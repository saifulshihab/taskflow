import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PriorityBadge, StatusBadge } from "@/components/tasks/task-badges";
import { buttonVariants } from "@/components/ui/button";
import {
  getMe,
  getTask,
  getWorkspace,
  listComments,
  listLabels,
  listMembers,
  listSubtasks,
} from "@/lib/data";
import { can } from "@/lib/rbac";
import { CommentSection } from "./comment-section";
import { TaskEditForm } from "./task-edit-form";
import { TaskLabels } from "./task-labels";
import { SubtaskSection } from "./subtask-section";

export default async function TaskDetailPage({
  params,
}: PageProps<"/w/[workspaceId]/tasks/[taskId]">) {
  const { workspaceId, taskId } = await params;

  let task;
  try {
    task = await getTask(taskId);
  } catch {
    notFound();
  }

  if (task.project.workspaceId !== workspaceId) notFound();

  const [workspace, members, labels, subtasks, comments, me] = await Promise.all([
    getWorkspace(workspaceId),
    listMembers(workspaceId),
    listLabels(workspaceId),
    listSubtasks(taskId),
    listComments(taskId),
    getMe(),
  ]);

  const canEdit = can(workspace.role, "MEMBER");
  const canModerateComments = can(workspace.role, "ADMIN");
  const projectHref = `/w/${workspaceId}/projects/${task.projectId}`;

  return (
    <>
      <PageHeader
        title={task.title}
        description={`${task.project.key} · ${task.project.name}`}
      >
        <Link
          href={projectHref}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Back to project
        </Link>
      </PageHeader>

      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {canEdit ? (
            <TaskEditForm
              task={task}
              workspaceId={workspaceId}
              members={members.data}
            />
          ) : (
            <div className="space-y-3 rounded-xl border p-4">
              <p className="whitespace-pre-wrap text-sm">
                {task.description ?? "No description"}
              </p>
              <div className="flex flex-wrap gap-3">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
            </div>
          )}

          <SubtaskSection
            workspaceId={workspaceId}
            projectId={task.projectId}
            parentTaskId={taskId}
            subtasks={subtasks}
            canEdit={canEdit}
          />

          <CommentSection
            workspaceId={workspaceId}
            taskId={taskId}
            comments={comments.data}
            canPost={canEdit}
            canModerate={canModerateComments}
            currentUserId={me.id}
          />
        </div>

        <aside className="space-y-4">
          <TaskLabels
            workspaceId={workspaceId}
            projectId={task.projectId}
            taskId={taskId}
            labels={labels}
            attached={task.labels}
            canEdit={canEdit}
          />
        </aside>
      </div>
    </>
  );
}
