"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  fetchTaskDetailContext,
  type TaskDetailContext,
} from "@/lib/actions/task-detail";

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
  const router = useRouter();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [context, setContext] = useState<TaskDetailContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoad] = useTransition();

  const load = useCallback(
    (id: string) => {
      startLoad(async () => {
        const result = await fetchTaskDetailContext(workspaceId, id);
        if ("error" in result) {
          setError(result.error);
          setContext(null);
          return;
        }
        setError(null);
        setContext(result);
      });
    },
    [workspaceId],
  );

  useEffect(() => {
    if (open && taskId) setActiveTaskId(taskId);
  }, [open, taskId]);

  useEffect(() => {
    if (!open || !activeTaskId) {
      setContext(null);
      setError(null);
      return;
    }
    load(activeTaskId);
  }, [open, activeTaskId, load]);

  const refresh = useCallback(() => {
    router.refresh();
    if (activeTaskId) load(activeTaskId);
  }, [activeTaskId, load, router]);

  const detailHref =
    activeTaskId != null ? `/w/${workspaceId}/tasks/${activeTaskId}` : "#";

  const title =
    context?.task.title ?? previewTitle ?? (loading ? "Loading…" : "Task");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(92vh,900px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b px-4 py-4 pr-12">
          <DialogTitle className="text-base leading-snug">
            <Link
              href={detailHref}
              className="hover:underline"
              onClick={() => onOpenChange(false)}
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
              onClick={() => onOpenChange(false)}
            >
              Open full page
            </Link>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          {loading && !context && (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {error && (
            <p className="text-destructive text-sm">{error}</p>
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
              onDeleted={() => onOpenChange(false)}
              subtaskLinkMode="modal"
              onSubtaskSelect={setActiveTaskId}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
