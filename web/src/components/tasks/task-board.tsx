"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { PriorityBadge } from "@/components/tasks/task-badges";
import { apiClient } from "@/lib/api-client";
import {
  TASK_STATUSES,
  type Task,
  type TaskStatus,
} from "@/lib/api-types";
import { patchTaskInProjectTasksCache } from "@/lib/invalidate";
import { queryKeys } from "@/lib/query-keys";
import { useProjectTasks } from "@/lib/queries";
import { TASK_STATUS_LABELS } from "@/lib/format";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { TaskTitleNav } from "@/components/tasks/task-title-nav";
import { cn } from "cn";

const boardTasksQuery = {
  pageSize: 100,
  topLevelOnly: true,
  sort: "position",
} as const;

function BoardCard({
  task,
  workspaceId,
  dragging,
  onOpenDetails,
}: {
  task: Task;
  workspaceId: string;
  dragging?: boolean;
  onOpenDetails: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card rounded-lg border p-3 shadow-xs transition-shadow",
        dragging && "opacity-50",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="text-muted-foreground mt-0.5 cursor-grab touch-none active:cursor-grabbing"
          aria-label="Drag task"
          {...listeners}
          {...attributes}
        >
          ⋮⋮
        </button>
        <div
          role="button"
          tabIndex={0}
          className="min-w-0 flex-1 cursor-pointer space-y-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onOpenDetails(task)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpenDetails(task);
            }
          }}
        >
          <TaskTitleNav
            workspaceId={workspaceId}
            taskId={task.id}
            title={task.title}
          />
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={task.priority} />
            {task.assignee && (
              <span className="text-muted-foreground text-xs">
                {task.assignee.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BoardColumn({
  status,
  tasks,
  workspaceId,
  onOpenDetails,
}: {
  status: TaskStatus;
  tasks: Task[];
  workspaceId: string;
  onOpenDetails: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-medium">{TASK_STATUS_LABELS[status]}</h3>
        <span className="text-muted-foreground text-xs">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 rounded-xl border border-dashed p-2 transition-colors",
          isOver && "border-primary/50 bg-primary/5",
        )}
      >
        {tasks.map((task) => (
          <BoardCard
            key={task.id}
            task={task}
            workspaceId={workspaceId}
            onOpenDetails={onOpenDetails}
          />
        ))}
        {tasks.length === 0 && (
          <p className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
            No tasks
          </p>
        )}
      </div>
    </div>
  );
}

export function TaskBoard({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  const queryClient = useQueryClient();
  const tasksQuery = useProjectTasks(projectId, boardTasksQuery);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [detailPreviewTitle, setDetailPreviewTitle] = useState<string>();

  const statusMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
    }: {
      taskId: string;
      status: TaskStatus;
    }) =>
      apiClient<Task>(`/tasks/${taskId}/status`, {
        method: "PATCH",
        body: { status },
      }),
    onMutate: async ({ taskId, status }) => {
      const key = queryKeys.projectTasks(projectId, boardTasksQuery);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (current: typeof tasksQuery.data) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((task) =>
            task.id === taskId ? { ...task, status } : task,
          ),
        };
      });
      return { previous, key };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
      toast.error("Could not update status");
    },
    onSuccess: (updated) => {
      patchTaskInProjectTasksCache(queryClient, projectId, updated);
    },
  });

  const displayTasks = tasksQuery.data?.data ?? [];

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(
      TASK_STATUSES.map((status) => [status, [] as Task[]]),
    ) as Record<TaskStatus, Task[]>;
    for (const task of displayTasks) {
      map[task.status].push(task);
    }
    return map;
  }, [displayTasks]);

  const activeTask = activeId
    ? displayTasks.find((task) => task.id === activeId)
    : undefined;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const taskId = String(event.active.id);
    const nextStatus = event.over?.id as TaskStatus | undefined;
    const task = displayTasks.find((item) => item.id === taskId);
    if (!task || !nextStatus || task.status === nextStatus) return;

    statusMutation.mutate({ taskId, status: nextStatus });
  };

  if (tasksQuery.isPending) {
    return (
      <p className="text-muted-foreground text-sm">Loading board…</p>
    );
  }

  if (tasksQuery.isError) {
    return (
      <p className="text-destructive text-sm">Could not load tasks.</p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={byStatus[status]}
            workspaceId={workspaceId}
            onOpenDetails={(task) => {
              setDetailTaskId(task.id);
              setDetailPreviewTitle(task.title);
            }}
          />
        ))}
      </div>
      <TaskDetailDialog
        taskId={detailTaskId}
        previewTitle={detailPreviewTitle}
        workspaceId={workspaceId}
        open={detailTaskId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailTaskId(null);
        }}
      />
      <DragOverlay>
        {activeTask ? (
          <div className="bg-card w-72 rounded-lg border p-3 shadow-lg">
            <p className="text-sm font-medium">{activeTask.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
