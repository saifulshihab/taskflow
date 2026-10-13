"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const navigateOnClick = useRef(false);

  return (
    <span
      role="presentation"
      className={cn(
        // Fit the text only — block would stretch to the card edge and
        // treat empty space beside the title as hoverable.
        "inline-block w-fit max-w-full text-sm font-medium leading-snug",
        hovered && "cursor-pointer underline underline-offset-2",
        className,
      )}
      onMouseEnter={() => {
        navigateOnClick.current = true;
        setHovered(true);
      }}
      onMouseLeave={() => {
        navigateOnClick.current = false;
        setHovered(false);
      }}
      onClick={(event) => {
        if (!navigateOnClick.current) return;
        event.stopPropagation();
        router.push(`/w/${workspaceId}/tasks/${taskId}`);
      }}
    >
      {title}
    </span>
  );
}
