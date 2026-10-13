"use client";

import { CommentSection } from "@/app/(app)/w/[workspaceId]/tasks/[taskId]/comment-section";
import { SubtaskSection } from "@/app/(app)/w/[workspaceId]/tasks/[taskId]/subtask-section";
import { TaskEditForm } from "@/app/(app)/w/[workspaceId]/tasks/[taskId]/task-edit-form";
import { TaskLabels } from "@/app/(app)/w/[workspaceId]/tasks/[taskId]/task-labels";
import { PriorityBadge, StatusBadge } from "@/components/tasks/task-badges";
import type {
  Comment,
  CurrentUser,
  Label,
  Member,
  Task,
} from "@/lib/api-types";

export function TaskDetailPanels({
  workspaceId,
  task,
  members,
  labels,
  subtasks,
  comments,
  me,
  canEdit,
  canModerateComments,
  onMutate,
  deleteMode = "redirect",
  onDeleted,
  subtaskLinkMode = "page",
  onSubtaskSelect,
}: {
  workspaceId: string;
  task: Task;
  members: Member[];
  labels: Label[];
  subtasks: Task[];
  comments: Comment[];
  me: CurrentUser;
  canEdit: boolean;
  canModerateComments: boolean;
  onMutate?: () => void;
  deleteMode?: "redirect" | "close";
  onDeleted?: () => void;
  subtaskLinkMode?: "page" | "modal";
  onSubtaskSelect?: (taskId: string) => void;
}) {
  const taskId = task.id;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        {canEdit ? (
          <TaskEditForm
            key={`${taskId}-${task.updatedAt}`}
            task={task}
            workspaceId={workspaceId}
            members={members}
            onSaved={onMutate}
            deleteMode={deleteMode}
            onDeleted={onDeleted}
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
          onCreated={onMutate}
          onSubtaskSelect={
            subtaskLinkMode === "modal" ? onSubtaskSelect : undefined
          }
        />

        <CommentSection
          key={`comments-${taskId}-${comments.length}`}
          workspaceId={workspaceId}
          taskId={taskId}
          comments={comments}
          canPost={canEdit}
          canModerate={canModerateComments}
          currentUserId={me.id}
          onMutate={onMutate}
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
          onMutate={onMutate}
        />
      </aside>
    </div>
  );
}
