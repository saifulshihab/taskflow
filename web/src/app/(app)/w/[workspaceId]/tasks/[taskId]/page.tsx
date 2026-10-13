import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TaskDetailPanels } from "@/components/tasks/task-detail-panels";
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

      <div className="p-4 md:p-6">
        <TaskDetailPanels
          workspaceId={workspaceId}
          task={task}
          members={members.data}
          labels={labels}
          subtasks={subtasks}
          comments={comments.data}
          me={me}
          canEdit={canEdit}
          canModerateComments={canModerateComments}
        />
      </div>
    </>
  );
}
