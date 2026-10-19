"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TaskDetailPanels } from "@/components/tasks/task-detail-panels";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useTaskDetailContext } from "@/lib/queries";

export default function TaskDetailPage() {
  const params = useParams();
  const workspaceId = String(params.workspaceId);
  const taskId = String(params.taskId);
  const queryClient = useQueryClient();

  const { data: context, isPending, isError } = useTaskDetailContext(
    workspaceId,
    taskId,
  );

  if (isPending) return <Skeleton className="m-6 h-96 w-full" />;
  if (isError || !context) notFound();

  const projectHref = `/w/${workspaceId}/board/${context.task.projectId}`;

  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.taskDetail(workspaceId, taskId),
    });
  };

  return (
    <>
      <PageHeader
        title={context.task.title}
        description={`${context.task.project.key} · ${context.task.project.name}`}
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
          task={context.task}
          members={context.members}
          labels={context.labels}
          subtasks={context.subtasks}
          comments={context.comments}
          me={context.me}
          canEdit={context.canEdit}
          canModerateComments={context.canModerateComments}
          onMutate={refresh}
        />
      </div>
    </>
  );
}
