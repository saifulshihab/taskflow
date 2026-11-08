import "dotenv/config";
import { prisma } from "./lib/prisma.js";
import { hashPassword } from "./lib/password.js";
import {
  create as createWorkspace,
  addMember,
} from "./modules/workspaces/workspaces.service.js";
import {
  create as createProject,
  setMember,
} from "./modules/projects/projects.service.js";
import { create as createTask } from "./modules/tasks/tasks.service.js";
// Optional fixtures are additive and refuse to overwrite real accounts.
async function seed() {
  if (await prisma.user.count())
    throw new Error("Seed requires an empty database");
  const passwordHash = await hashPassword("password123");
  const [owner, admin, member] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Saiful Islam Shihab",
        email: "owner@taskflow.dev",
        passwordHash,
      },
    }),
    prisma.user.create({
      data: { name: "Maya Rahman", email: "admin@taskflow.dev", passwordHash },
    }),
    prisma.user.create({
      data: {
        name: "Tanvir Ahmed",
        email: "member@taskflow.dev",
        passwordHash,
      },
    }),
  ]);
  const actor = { id: owner.id, email: owner.email };
  const ws = await createWorkspace(actor, { name: "AYAAN" });
  await addMember(actor, ws.id, { email: admin.email });
  await addMember(actor, ws.id, { email: member.email });
  const p = await createProject(actor, ws.id, {
    name: "Photo Payload",
    key: "PP",
    status: "ACTIVE",
    color: "#0E7490",
  });
  await setMember(actor, p.id, admin.id, "ADMIN");
  await setMember(actor, p.id, member.id, "MEMBER");
  await createProject(actor, ws.id, {
    name: "Website Redesign",
    key: "WR",
    status: "ACTIVE",
    color: "#7C3AED",
  });
  await createProject(actor, ws.id, {
    name: "Mobile App",
    key: "MA",
    status: "ACTIVE",
    color: "#B45309",
  });
  const label = await prisma.label.create({
    data: { projectId: p.id, name: "SEO", color: "#0E7490" },
  });
  await createTask(actor, p.id, {
    title: "Google Search Console Indexing Status",
    status: "TODO",
    labelIds: [label.id],
  });
  await createTask(actor, p.id, {
    title: "Improve image compression workflow",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assigneeId: admin.id,
  });
  await createTask(actor, p.id, {
    title: "Review metadata comparison",
    status: "IN_REVIEW",
    assigneeId: member.id,
  });
  console.log(
    "Created AYAAN demo workspace. Accounts: owner/admin/member@taskflow.dev; password: password123",
  );
}
seed().finally(() => prisma.$disconnect());
