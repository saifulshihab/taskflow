"use client";

import { useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/tasks/task-badges";
import { TaskTitleNav } from "@/components/tasks/task-title-nav";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Task } from "@/lib/api-types";
import { formatDate, isOverdue } from "@/lib/format";
import { cn } from "cn";

export function TaskTable({
  tasks,
  workspaceId,
}: {
  tasks: Task[];
  workspaceId: string;
}) {
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [detailPreviewTitle, setDetailPreviewTitle] = useState<string>();

  if (tasks.length === 0) {
    return (
      <p className="text-muted-foreground text-center text-sm py-8">
        No tasks match these filters.
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Project</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer"
              onClick={() => {
                setDetailTaskId(task.id);
                setDetailPreviewTitle(task.title);
              }}
            >
              <TableCell>
                <TaskTitleNav
                  workspaceId={workspaceId}
                  taskId={task.id}
                  title={task.title}
                />
              </TableCell>
              <TableCell>
                <StatusBadge status={task.status} />
              </TableCell>
              <TableCell>
                <PriorityBadge priority={task.priority} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {task.assignee?.name ?? "—"}
              </TableCell>
              <TableCell
                className={cn(
                  isOverdue(task.dueDate, task.status) && "text-destructive",
                )}
              >
                {task.dueDate ? formatDate(task.dueDate) : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {task.project.key}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TaskDetailDialog
        taskId={detailTaskId}
        previewTitle={detailPreviewTitle}
        workspaceId={workspaceId}
        open={detailTaskId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailTaskId(null);
        }}
      />
    </>
  );
}
