"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "cn";

/**
 * Navigates to the task page only when the pointer is over the title on click.
 * Otherwise the click bubbles so the parent can open the detail modal.
 */
export function TaskTitleNav({
  workspaceId,
  taskId,
  title,
  className,
}: {
  workspaceId: string;
  taskId: string;
  title: string;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const href = `/w/${workspaceId}/tasks/${taskId}`;

  return (
    <Link
      href={href}
      className={cn(
        // Fit the text only — block would stretch to the card edge and
        // treat empty space beside the title as hoverable.
        "inline-block w-fit max-w-full text-sm font-medium leading-snug",
        hovered && "underline underline-offset-2",
        className,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(event) => {
        if (hovered) {
          event.stopPropagation();
          return;
        }
        event.preventDefault();
      }}
    >
      {title}
    </Link>
  );
}
