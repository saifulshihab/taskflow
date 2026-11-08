import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

// Exercises real HTTP authorization and persistence. Creates only its own
// uniquely named fixtures; never resets the database or modifies other data.
const base = process.env.TASKFLOW_TEST_API ?? "http://localhost:4000/api";
const suffix = crypto.randomUUID().slice(0, 8);
const password = "Taskflow-test-123!";
let assertions = 0;
async function request(actor, path, method = "GET", body, status = 200) {
  const response = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(actor ? { authorization: `Bearer ${actor.tokens.accessToken}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json().catch(() => undefined);
  assert.equal(
    response.status,
    status,
    `${method} ${path}: ${JSON.stringify(result?.error ?? "Unexpected response")}`,
  );
  assertions++;
  return result;
}
function check(condition, message) {
  assert.ok(condition, message);
  assertions++;
}
const actor = async (name) =>
  request(
    null,
    "/auth/register",
    "POST",
    {
      name: `QA ${name}`,
      email: `qa-${name}-${suffix}@taskflow.test`,
      password,
    },
    201,
  );
const [owner, admin, member, outsider] = await Promise.all([
  actor("owner"),
  actor("admin"),
  actor("member"),
  actor("outsider"),
]);
let ws;
try {
  ws = await request(
    owner,
    "/workspaces",
    "POST",
    { name: `Redesign QA ${suffix}` },
    201,
  );
  check(ws.role === "WORKSPACE_OWNER", "Creator owns workspace");
  for (const user of [admin, member])
    await request(
      owner,
      `/workspaces/${ws.id}/members`,
      "POST",
      { email: user.user.email },
      201,
    );
  const project = await request(
    owner,
    `/workspaces/${ws.id}/projects`,
    "POST",
    { name: "Assigned project", key: "QA" },
    201,
  );
  const hidden = await request(
    owner,
    `/workspaces/${ws.id}/projects`,
    "POST",
    { name: "Unassigned project", key: "HIDE" },
    201,
  );
  for (const [user, role] of [
    [admin, "ADMIN"],
    [member, "MEMBER"],
  ])
    await request(owner, `/projects/${project.id}/members`, "POST", {
      userId: user.user.id,
      role,
    });
  await request(member, `/workspaces/${ws.id}/members`, "GET", undefined, 403);
  await request(
    admin,
    `/workspaces/${ws.id}`,
    "PATCH",
    { name: "Forbidden" },
    403,
  );
  await request(
    admin,
    `/workspaces/${ws.id}/projects`,
    "POST",
    { name: "Forbidden" },
    403,
  );
  await request(member, `/projects/${hidden.id}`, "GET", undefined, 404);
  await request(outsider, `/projects/${project.id}`, "GET", undefined, 404);
  const visible = await request(member, `/workspaces/${ws.id}/projects`);
  check(
    visible.data.length === 1 && visible.data[0].id === project.id,
    "Project listing hides unassigned projects",
  );
  await request(admin, `/projects/${project.id}`, "PATCH", {
    name: "Renamed by admin",
    defaultStatus: "IN_REVIEW",
    defaultPriority: "HIGH",
  });
  await request(
    member,
    `/projects/${project.id}`,
    "PATCH",
    { name: "Forbidden" },
    403,
  );
  await request(
    admin,
    `/projects/${project.id}/archive`,
    "POST",
    undefined,
    403,
  );
  await request(admin, `/projects/${project.id}`, "DELETE", undefined, 403);
  await request(admin, `/projects/${project.id}`, "PATCH", { seats: 2 }, 400);
  await request(
    admin,
    `/projects/${project.id}/members/${admin.user.id}`,
    "DELETE",
    undefined,
    400,
  );
  await request(
    admin,
    `/projects/${project.id}/members/${admin.user.id}`,
    "PATCH",
    { role: "MEMBER" },
    400,
  );
  const label = await request(
    member,
    `/projects/${project.id}/labels`,
    "POST",
    { name: "Member label", color: "#0E7490" },
    201,
  );
  await request(
    member,
    `/labels/${label.id}`,
    "PATCH",
    { name: "Forbidden" },
    403,
  );
  await request(admin, `/labels/${label.id}`, "PATCH", { name: "Admin label" });
  const hiddenTask = await request(
    owner,
    `/projects/${hidden.id}/tasks`,
    "POST",
    { title: "Hidden task" },
    201,
  );
  const task = await request(
    member,
    `/projects/${project.id}/tasks`,
    "POST",
    { title: "Main task", assigneeId: member.user.id, labelIds: [label.id] },
    201,
  );
  check(
    task.status === "IN_REVIEW" &&
      task.priority === "HIGH" &&
      task.key === "QA-1",
    "Project defaults and readable task ID apply",
  );
  const override = await request(
    member,
    `/projects/${project.id}/tasks?projectId=${hidden.id}`,
  );
  check(
    override.data.length === 0,
    "Query projectId cannot override authorization scope",
  );
  await request(member, `/tasks/${hiddenTask.id}`, "GET", undefined, 404);
  const hiddenLabel = await request(
    owner,
    `/projects/${hidden.id}/labels`,
    "POST",
    { name: "Hidden label" },
    201,
  );
  await request(
    member,
    `/tasks/${task.id}/labels`,
    "POST",
    { labelId: hiddenLabel.id },
    400,
  );
  await request(
    member,
    `/tasks/${task.id}/assignee`,
    "PATCH",
    { assigneeId: outsider.user.id },
    400,
  );
  const sub = await request(
    member,
    `/projects/${project.id}/tasks`,
    "POST",
    { title: "Unfinished subtask", parentTaskId: task.id, status: "TODO" },
    201,
  );
  await request(member, `/tasks/${task.id}/status`, "PATCH", {
    status: "DONE",
  });
  await request(admin, `/tasks/${sub.id}`, "PATCH", {
    title: "Renamed subtask",
  });
  const comment = await request(
    member,
    `/tasks/${task.id}/comments`,
    "POST",
    { body: "My comment" },
    201,
  );
  await request(owner, `/comments/${comment.id}`, "DELETE", undefined, 403);
  await request(
    admin,
    `/comments/${comment.id}`,
    "PATCH",
    { body: "Forbidden" },
    403,
  );
  await request(member, `/comments/${comment.id}`, "PATCH", {
    body: "Edited own comment",
  });
  const view = await request(member, `/projects/${project.id}/views`, "POST", {
    name: "Mine",
    filters: { status: "DONE" },
  });
  await request(
    owner,
    `/projects/${project.id}/views/${view.id}`,
    "DELETE",
    undefined,
    404,
  );
  const ownerViews = await request(owner, `/projects/${project.id}/views`);
  check(ownerViews.length === 0, "Saved views are personal");
  await request(
    member,
    `/workspaces/${ws.id}/activity?entityType=task`,
    "GET",
    undefined,
    403,
  );
  const activity = await request(member, `/workspaces/${ws.id}/activity`);
  check(
    activity.data.every((a) => a.projectId === project.id),
    "Activity stays within assigned projects",
  );
  await request(owner, `/projects/${project.id}/archive`, "POST");
  await request(
    owner,
    `/tasks/${task.id}`,
    "PATCH",
    { title: "Forbidden" },
    400,
  );
  await request(owner, `/projects/${project.id}/unarchive`, "POST");
  const deletion = await request(member, `/tasks/${sub.id}`, "DELETE");
  await request(member, `/tasks/${sub.id}`, "GET", undefined, 404);
  await request(member, `/recovery/${deletion.recoveryId}/undo`, "POST");
  await request(member, `/tasks/${sub.id}`);
  const expired = await request(member, `/tasks/${sub.id}`, "DELETE");
  if (process.env.TASKFLOW_TEST_RESTART === "1") {
    execFileSync("docker", ["compose", "restart", "api"], { stdio: "pipe" });
    let ready = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        const health = await fetch(base.replace(/\/api$/, "") + "/health");
        if (health.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    check(ready, "API recovered after restart");
  }
  await new Promise((resolve) => setTimeout(resolve, 6200));
  const denied = await fetch(base + `/recovery/${expired.recoveryId}/undo`, {
    method: "POST",
    headers: { authorization: `Bearer ${member.tokens.accessToken}` },
  });
  check([400, 404].includes(denied.status), "Undo rejected after six seconds");
  await request(
    owner,
    `/workspaces/${ws.id}/members/${member.user.id}`,
    "PATCH",
    { active: false },
  );
  await request(member, `/projects/${project.id}`, "GET", undefined, 404);
  const unassigned = await request(owner, `/tasks/${task.id}`);
  check(unassigned.assigneeId === null, "Deactivation clears task assignments");
  await request(
    owner,
    `/workspaces/${ws.id}/members/${member.user.id}`,
    "PATCH",
    { active: true },
  );
  await request(member, `/projects/${project.id}`);
  const ownSpace = await request(
    member,
    "/workspaces",
    "POST",
    { name: "Member becomes owner" },
    201,
  );
  check(
    ownSpace.role === "WORKSPACE_OWNER",
    "Members can own another workspace",
  );
  await request(member, `/workspaces/${ownSpace.id}`, "DELETE", undefined, 204);
  await request(owner, "/auth/me", "DELETE", { password }, 400);
  await request(
    owner,
    `/workspaces/${ws.id}/members`,
    "POST",
    { email: outsider.user.email },
    201,
  );
  await request(owner, `/projects/${project.id}`, "PATCH", { seats: 2 });
  await request(
    admin,
    `/projects/${project.id}/members`,
    "POST",
    { userId: outsider.user.id, role: "MEMBER" },
    409,
  );
  await request(owner, `/projects/${project.id}`, "PATCH", { seats: 1 }, 409);
  const otherWorkspace = await request(
    admin,
    "/workspaces",
    "POST",
    { name: "Admin owns another workspace" },
    201,
  );
  await request(owner, `/projects/${hidden.id}/members`, "POST", {
    userId: admin.user.id,
    role: "MEMBER",
  });
  await request(
    admin,
    `/projects/${hidden.id}`,
    "PATCH",
    { name: "Forbidden as project Member" },
    403,
  );
  const mixedRole = await request(admin, `/projects/${hidden.id}`);
  check(
    mixedRole.role === "MEMBER",
    "Workspace ownership and project Admin role do not leak into other projects",
  );
  await request(
    admin,
    `/workspaces/${otherWorkspace.id}`,
    "DELETE",
    undefined,
    204,
  );
  const concurrent = await Promise.all([
    request(
      member,
      `/projects/${project.id}/tasks`,
      "POST",
      { title: "Concurrent one" },
      201,
    ),
    request(
      member,
      `/projects/${project.id}/tasks`,
      "POST",
      { title: "Concurrent two" },
      201,
    ),
  ]);
  check(
    concurrent[0].number !== concurrent[1].number,
    "Concurrent task creation uses unique project sequence",
  );
  const labelDeletion = await request(admin, `/labels/${label.id}`, "DELETE");
  await request(
    member,
    `/recovery/${labelDeletion.recoveryId}/undo`,
    "POST",
    undefined,
    403,
  );
  await request(admin, `/recovery/${labelDeletion.recoveryId}/undo`, "POST");
  const projectDeletion = await request(
    owner,
    `/projects/${hidden.id}`,
    "DELETE",
  );
  await request(owner, `/projects/${hidden.id}`, "GET", undefined, 404);
  await request(owner, `/recovery/${projectDeletion.recoveryId}/undo`, "POST");
  const memberDeletion = await request(
    owner,
    `/workspaces/${ws.id}/members/${member.user.id}`,
    "DELETE",
  );
  await request(member, `/projects/${project.id}`, "GET", undefined, 404);
  await request(owner, `/recovery/${memberDeletion.recoveryId}/undo`, "POST");
  await request(member, `/projects/${project.id}`);
  await request(member, "/auth/me", "PATCH", {
    name: "QA Updated",
    theme: "dark",
    startPage: "list",
  });
  const preferences = await request(member, "/auth/me");
  check(
    preferences.theme === "dark" && preferences.startPage === "list",
    "Personal preferences persist",
  );
  const refreshed = await Promise.all([
    fetch(base + "/auth/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: admin.tokens.refreshToken }),
    }),
    fetch(base + "/auth/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: admin.tokens.refreshToken }),
    }),
  ]);
  check(
    refreshed.filter((r) => r.status === 200).length === 1 &&
      refreshed.filter((r) => r.status === 401).length === 1,
    "Only one concurrent refresh succeeds",
  );
  admin.tokens = (await refreshed.find((r) => r.status === 200).json()).tokens;
  await request(owner, `/workspaces/${ws.id}/transfer`, "POST", {
    userId: admin.user.id,
    assignments: [{ projectId: project.id, role: "MEMBER" }],
  });
  await request(owner, `/workspaces/${ws.id}/members`, "GET", undefined, 403);
  const transferred = await request(admin, `/workspaces/${ws.id}`);
  check(
    transferred.ownerId === admin.user.id &&
      transferred.role === "WORKSPACE_OWNER",
    "Exactly one new owner after transfer",
  );
  await request(admin, `/workspaces/${ws.id}`, "DELETE", undefined, 204);
  ws = null;
  await request(
    member,
    "/auth/logout",
    "POST",
    { refreshToken: member.tokens.refreshToken },
    204,
  );
  await request(member, "/auth/me", "GET", undefined, 401);
  console.log(`PASS: ${assertions} redesign integration assertions`);
} finally {
  // Delete only this run's workspace and accounts. Keep cleanup failures visible.
  if (ws) {
    for (const user of [owner, admin]) {
      const response = await fetch(base + `/workspaces/${ws.id}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${user.tokens.accessToken}` },
      });
      if (response.ok) break;
    }
  }
  for (const user of [owner, admin, member, outsider]) {
    try {
      const fresh = await request(null, "/auth/login", "POST", {
        email: user.user.email,
        password,
      });
      await request(fresh, "/auth/me", "DELETE", { password });
    } catch (error) {
      console.error("Fixture cleanup failed:", error.message);
      process.exitCode = 1;
    }
  }
}
