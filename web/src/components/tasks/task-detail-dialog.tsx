"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TaskDetailPanels } from "@/components/tasks/task-detail-panels";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/query-keys";
import { useTaskDetailContext } from "@/lib/queries";

export function TaskDetailDialog({
  taskId,
  workspaceId,
  open,
  onOpenChange,
  previewTitle,
}: {
  taskId: string | null;
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewTitle?: string;
}) {
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<{
    rootTaskId: string;
    selectedTaskId: string;
  } | null>(null);
  const activeTaskId =
    selection?.rootTaskId === taskId ? selection.selectedTaskId : taskId;

  const { data: context, isPending, isError, error } = useTaskDetailContext(
    workspaceId,
    open && activeTaskId ? activeTaskId : null,
  );

  useEffect(() => {
    if (!open) {
      setSelection(null);
    }
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setSelection(null);
    onOpenChange(nextOpen);
  };

  const refresh = () => {
    if (!activeTaskId) return;
    void queryClient.invalidateQueries({
      queryKey: queryKeys.taskDetail(workspaceId, activeTaskId),
    });
  };

  const detailHref =
    activeTaskId != null ? `/w/${workspaceId}/tasks/${activeTaskId}` : "#";

  const title =
    context?.task.title ?? previewTitle ?? (isPending ? "Loading…" : "Task");

  const errorMessage =
    isError && error instanceof Error ? error.message : isError ? "Task not found" : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[min(92vh,900px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b px-4 py-4 pr-12">
          <DialogTitle className="text-base leading-snug">
            <Link
              href={detailHref}
              className="hover:underline"
              onClick={() => handleOpenChange(false)}
            >
              {title}
            </Link>
          </DialogTitle>
          {context && (
            <DialogDescription>
              {context.task.project.key} · {context.task.project.name}
            </DialogDescription>
          )}
          <div className="pt-1">
            <Link
              href={detailHref}
              className={buttonVariants({ variant: "link", size: "sm" })}
              onClick={() => handleOpenChange(false)}
            >
              Open full page
            </Link>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          {isPending && !context && (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {errorMessage && (
            <p className="text-destructive text-sm">{errorMessage}</p>
          )}

          {context && activeTaskId && (
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
              deleteMode="close"
              onDeleted={() => handleOpenChange(false)}
              subtaskLinkMode="modal"
              onSubtaskSelect={(selectedTaskId) => {
                if (taskId) setSelection({ rootTaskId: taskId, selectedTaskId });
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
