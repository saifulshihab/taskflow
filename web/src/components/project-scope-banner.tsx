export function ProjectScopeBanner({ kind }: { kind: "labels" | "members" }) {
  const message =
    kind === "labels"
      ? "Labels are workspace-wide today. Project-specific labels will use this URL once the API supports them."
      : "Members are workspace-wide today. Project teams will use this URL once the API supports them.";

  return (
    <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-3 text-sm">
      {message}
    </p>
  );
}
