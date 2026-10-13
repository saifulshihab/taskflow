import Link from "next/link";
import { cn } from "cn";

export function ProjectNav({
  workspaceId,
  projectId,
  active,
}: {
  workspaceId: string;
  projectId: string;
  active: "board" | "list";
}) {
  const base = `/w/${workspaceId}/projects/${projectId}`;
  const items = [
    { href: base, label: "Board", key: "board" as const },
    { href: `${base}/list`, label: "List", key: "list" as const },
  ];

  return (
    <nav className="flex gap-1 rounded-lg border p-1">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            active === item.key
              ? "bg-muted font-medium"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
