import { Badge } from "@/components/ui/badge";
import type { Priority, TaskStatus } from "@/lib/api-types";
import {
  PRIORITY_CLASSES,
  PRIORITY_LABELS,
  TASK_STATUS_CLASSES,
  TASK_STATUS_LABELS,
} from "@/lib/format";
import { cn } from "cn";

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={cn("font-normal", PRIORITY_CLASSES[priority])}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={cn("size-2 rounded-full", TASK_STATUS_CLASSES[status])}
        aria-hidden
      />
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}
