import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/tasks/task-badges";
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
  if (tasks.length === 0) {
    return (
      <p className="text-muted-foreground text-center text-sm py-8">
        No tasks match these filters.
      </p>
    );
  }

  return (
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
          <TableRow key={task.id}>
            <TableCell>
              <Link
                href={`/w/${workspaceId}/tasks/${task.id}`}
                className="font-medium hover:underline"
              >
                {task.title}
              </Link>
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
  );
}
