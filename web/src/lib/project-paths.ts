export type ProjectSection =
  | "board"
  | "board/list"
  | "tasks"
  | "labels"
  | "members";

export function projectPath(
  workspaceId: string,
  projectId: string,
  section: ProjectSection = "board",
) {
  const base = `/w/${workspaceId}/p/${projectId}`;
  switch (section) {
    case "board":
      return `${base}/board`;
    case "board/list":
      return `${base}/board/list`;
    case "tasks":
      return `${base}/tasks`;
    case "labels":
      return `${base}/labels`;
    case "members":
      return `${base}/members`;
  }
}

const PROJECT_SECTION_RE =
  /\/w\/[^/]+\/p\/[^/]+\/(board(?:\/list)?|tasks|labels|members)/;

/** Preserves the current project section when switching projects. */
export function projectSectionFromPathname(pathname: string): ProjectSection {
  const match = pathname.match(PROJECT_SECTION_RE);
  if (!match) return "board";
  const segment = match[1];
  if (segment === "board/list") return "board/list";
  if (segment === "tasks") return "tasks";
  if (segment === "labels") return "labels";
  if (segment === "members") return "members";
  return "board";
}

export function parseProjectIdFromPathname(pathname: string) {
  const match = pathname.match(/\/w\/[^/]+\/p\/([^/]+)/);
  return match?.[1];
}
