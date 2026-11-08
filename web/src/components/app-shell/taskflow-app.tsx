"use client";

import { apiClient, type RequestOptions } from "@/lib/api-client";
import type {
  ActivityEvent,
  Comment,
  Label,
  Paginated,
  Project,
  Workspace,
} from "@/lib/api-types";
import { clearTokens, getTokens } from "@/lib/auth-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Check,
  Columns3,
  List,
  LogOut,
  Maximize2,
  Menu,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import {
  CheckControl,
  SelectControl,
  SelectOption,
} from "@/components/form-controls";
import { People } from "@/components/projects/project-people";
import { ProjectSettings } from "@/components/projects/project-settings";
import { TaskEditor } from "@/components/tasks/task-editor";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogTitle,
  Dialog as UiDialog,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Avatar,
  cleanFilters,
  Field,
  formatDate,
  human,
  initials,
  priorities,
  PriorityChip,
  Status,
  statuses,
  type Filters,
  type Me,
  type Person,
  type ProjectData,
  type Recovery,
  type SavedView,
  type WorkTask,
} from "./taskflow-shared";

async function allPages<T>(
  path: string,
  query: RequestOptions["query"] = {},
): Promise<T[]> {
  const first = await apiClient<Paginated<T>>(path, {
    query: { ...query, pageSize: 100 },
  });
  const rest: T[] = [];
  for (let page = 2; page <= first.meta.totalPages; page++)
    rest.push(
      ...(
        await apiClient<Paginated<T>>(path, {
          query: { ...query, pageSize: 100, page },
        })
      ).data,
    );
  return [...first.data, ...rest];
}
function Dialog({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  return (
    <UiDialog
      open
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent
        className={`bg-background font-sans text-sm text-foreground   max-h-[90svh] overflow-y-auto sm:max-w-lg [&>header]:flex [&>header]:items-center [&>header]:justify-between [&_form]:flex [&_form]:flex-col [&_form]:gap-4 [&_form>button]:self-end      ${wide ? "sm:max-w-2xl" : ""}`}
        showCloseButton={false}
      >
        <header>
          <DialogTitle>{title}</DialogTitle>
          <Button
            type="button"
            variant="ghost"
            className="size-8 shrink-0 p-0"
            aria-label="Close dialog"
            onClick={close}
          >
            <X size={18} />
          </Button>
        </header>
        {children}
      </DialogContent>
    </UiDialog>
  );
}

export function WorkspacePicker() {
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["redesign-workspaces"],
    queryFn: () => allPages<Workspace>("/workspaces"),
  });
  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const ws = await apiClient<Workspace>("/workspaces", {
        method: "POST",
        body: { name },
      });
      await qc.invalidateQueries();
      router.push(`/w/${ws.id}/board`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto min-h-svh w-full max-w-5xl space-y-7 px-6 py-14   bg-background font-sans text-sm text-foreground">
      <span className="inline-flex items-center gap-2 text-base font-semibold text-primary">
        TF <b>TaskFlow</b>
      </span>
      <h1>Your workspaces</h1>
      <p>Choose where to work, or create a space of your own.</p>
      {query.isError && <p role="alert">{query.error.message}</p>}
      <div className="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
        {query.data?.map((ws) => (
          <Button
            variant="outline"
            type="submit"
            key={ws.id}
            className="h-auto flex-col items-start gap-4 rounded-xl border bg-card p-6 text-card-foreground"
            onClick={() => router.push(`/w/${ws.id}/board`)}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
              {initials(ws.name)}
            </span>
            <strong>{ws.name}</strong>
            <small>{human(ws.role)}</small>
          </Button>
        ))}
      </div>
      <form
        className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start"
        onSubmit={create}
      >
        <h2>Create workspace</h2>
        <Field label="Workspace name">
          <Input
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Button type="submit" variant="default" className="" disabled={busy}>
          {busy ? "Creating…" : "Create workspace"}
        </Button>
      </form>
    </main>
  );
}

const emptyProjects: ProjectData[] = [];

export function TaskflowApp({ children }: { children: ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const path = usePathname();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const workspaceId = String(params.workspaceId);
  const projectId =
    typeof params.projectId === "string" ? params.projectId : "";
  const legacyTaskId = typeof params.taskId === "string" ? params.taskId : "";
  const legacyTaskQuery = useQuery({
    queryKey: ["legacy-task", legacyTaskId],
    queryFn: () => apiClient<WorkTask>(`/tasks/${legacyTaskId}`),
    enabled: !!legacyTaskId,
  });
  useEffect(() => {
    const task = legacyTaskQuery.data;
    if (task && task.project.workspaceId === workspaceId)
      router.replace(
        `/w/${workspaceId}/p/${task.projectId}/board?task=${task.id}`,
      );
  }, [legacyTaskQuery.data, workspaceId, router]);
  const section = projectId
    ? path.endsWith("/settings")
      ? "psettings"
      : path.endsWith("/members")
        ? "pmembers"
        : path.endsWith("/activity")
          ? "pactivity"
          : path.endsWith("/list") || path.endsWith("/tasks")
            ? "list"
            : "board"
    : path.endsWith("/profile")
      ? "profile"
      : path.endsWith("/account")
        ? "account"
        : path.endsWith("/members")
          ? "members"
          : path.endsWith("/settings")
            ? "settings"
            : path.endsWith("/activity")
              ? "activity"
              : "board";
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(cleanFilters);
  const [selected, setSelected] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const [listPage, setListPage] = useState(0);
  const [showSubs, setShowSubs] = useState(false);
  const [cancelledCollapsed, setCancelledCollapsed] = useState(true);
  const [createAnother, setCreateAnother] = useState(false);
  const [activityProject, setActivityProject] = useState("");
  const [activityType, setActivityType] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const meQuery = useQuery({
    queryKey: ["redesign-me"],
    queryFn: () => apiClient<Me>("/auth/me"),
  });
  const workspaces = useQuery({
    queryKey: ["redesign-workspaces"],
    queryFn: () => allPages<Workspace>("/workspaces"),
  });
  const workspaceQuery = useQuery({
    queryKey: ["redesign-ws", workspaceId],
    queryFn: () => apiClient<Workspace>(`/workspaces/${workspaceId}`),
  });
  const projectsQuery = useQuery({
    queryKey: ["redesign-projects", workspaceId],
    queryFn: () =>
      allPages<ProjectData>(`/workspaces/${workspaceId}/projects`, {
        includeArchived: true,
      }),
  });
  const projectQuery = useQuery({
    queryKey: ["redesign-project", projectId],
    queryFn: () => apiClient<ProjectData>(`/projects/${projectId}`),
    enabled: !!projectId,
  });
  const ws = workspaceQuery.data;
  const me = meQuery.data;
  const projects = projectsQuery.data ?? emptyProjects;
  const project = projectQuery.data;
  const owner = ws?.role === "WORKSPACE_OWNER";
  const admin = owner || project?.role === "ADMIN";
  const editable = !!project && !project.archivedAt;
  const membersQuery = useQuery({
    queryKey: ["redesign-members", projectId],
    queryFn: () => apiClient<Person[]>(`/projects/${projectId}/members`),
    enabled: !!projectId,
  });
  const directory = useQuery({
    queryKey: ["redesign-directory", workspaceId],
    queryFn: () => allPages<Person>(`/workspaces/${workspaceId}/members`),
    enabled: !!owner,
  });
  const statsQuery = useQuery({
    queryKey: ["workspace-stats", workspaceId],
    queryFn: () =>
      apiClient<{ open: number; done: number; comments: number }>(
        `/workspaces/${workspaceId}/stats`,
      ),
    enabled: section === "profile",
  });
  const labelsQuery = useQuery({
    queryKey: ["redesign-labels", projectId],
    queryFn: () => apiClient<Label[]>(`/projects/${projectId}/labels`),
    enabled: !!projectId,
  });
  const tasksQuery = useQuery({
    queryKey: ["redesign-tasks", workspaceId, projectId],
    queryFn: () =>
      allPages<WorkTask>(
        projectId
          ? `/projects/${projectId}/tasks`
          : `/workspaces/${workspaceId}/tasks`,
      ),
  });
  const viewsQuery = useQuery({
    queryKey: ["redesign-views", projectId],
    queryFn: () => apiClient<SavedView[]>(`/projects/${projectId}/views`),
    enabled: !!projectId,
  });
  const activityQuery = useQuery({
    queryKey: ["redesign-activity", workspaceId, activityProject, activityType],
    queryFn: () =>
      allPages<ActivityEvent>(
        `/workspaces/${workspaceId}/activity`,
        owner ? { projectId: activityProject, entityType: activityType } : {},
      ),
    enabled: section === "activity" || section === "pactivity" || !!selected,
  });
  const globalTasksQuery = useQuery({
    queryKey: ["redesign-global-tasks", workspaceId],
    queryFn: () => allPages<WorkTask>(`/workspaces/${workspaceId}/tasks`),
    enabled: modal === "search",
  });
  const candidatesQuery = useQuery({
    queryKey: ["redesign-candidates", projectId],
    queryFn: () => apiClient<Person[]>(`/projects/${projectId}/candidates`),
    enabled: modal === "add-person" && !!projectId && admin,
  });
  const tasks = tasksQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const labels = labelsQuery.data ?? [];
  const selectedId = selected ?? searchParams.get("task");
  const task = tasks.find((t) => t.id === selectedId);
  const subtasks = tasks.filter((t) => t.parentTaskId === selectedId);
  const commentsQuery = useQuery({
    queryKey: ["redesign-comments", selectedId],
    queryFn: () => allPages<Comment>(`/tasks/${selectedId}/comments`),
    enabled: !!task,
  });
  const loading =
    meQuery.isPending || workspaceQuery.isPending || projectsQuery.isPending;
  const errors = [
    meQuery,
    workspaceQuery,
    projectsQuery,
    ...(projectId ? [projectQuery, membersQuery, labelsQuery] : []),
    tasksQuery,
    ...(legacyTaskId ? [legacyTaskQuery] : []),
  ].filter((q) => q.isError);

  useEffect(() => {
    if (
      !projectId &&
      section === "board" &&
      projectsQuery.isSuccess &&
      projects[0]
    )
      router.replace(
        `/w/${workspaceId}/p/${projects.find((p) => !p.archivedAt)?.id ?? projects[0].id}/board`,
      );
  }, [
    projectId,
    section,
    projectsQuery.isSuccess,
    projects,
    router,
    workspaceId,
  ]);
  useEffect(() => {
    if (me)
      document.documentElement.classList.toggle(
        "dark",
        me.theme === "dark" ||
          (me.theme === "system" &&
            matchMedia("(prefers-color-scheme: dark)").matches),
      );
  }, [me]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setModal("search");
      }
      if (e.key === "Escape") {
        setSelected(null);
        setModal(null);
        if (searchParams.has("task")) router.replace(path);
      }
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [path, router, searchParams]);

  async function mutate<T = unknown>(
    url: string,
    method: RequestOptions["method"],
    body?: unknown,
    message?: string,
  ): Promise<T | undefined> {
    setBusy(true);
    try {
      const result = await apiClient<T>(url, { method, body });
      void qc.invalidateQueries();
      if (message) toast.success(message);
      const r = result as Recovery | undefined;
      if (r?.recoveryId)
        toast("Deleted", {
          duration: Math.max(0, new Date(r.expiresAt!).getTime() - Date.now()),
          action: {
            label: "Undo",
            onClick: () => {
              void mutate(
                `/recovery/${r.recoveryId}/undo`,
                "POST",
                undefined,
                "Restored",
              );
            },
          },
        });
      return result;
    } catch (e) {
      toast.error((e as Error).message);
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  function go(page: string, pid = projectId) {
    setMenu(false);
    setSelected(null);
    setFilters(cleanFilters);
    setListPage(0);
    const route =
      page === "psettings"
        ? "settings"
        : page === "pmembers"
          ? "members"
          : page === "pactivity"
            ? "activity"
            : page === "list"
              ? "board/list"
              : "board";
    router.push(
      pid &&
        ["board", "list", "pactivity", "pmembers", "psettings"].includes(page)
        ? `/w/${workspaceId}/p/${pid}/${route}`
        : `/w/${workspaceId}/${page}`,
    );
  }
  function filter(key: keyof Filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
    setListPage(0);
  }
  async function logout() {
    try {
      await apiClient("/auth/logout", {
        method: "POST",
        body: { refreshToken: getTokens()?.refreshToken },
      });
    } finally {
      clearTokens();
      qc.clear();
      router.replace("/login");
    }
  }
  const visible = tasks
    .filter(
      (t) =>
        (showSubs || !t.parentTaskId) &&
        (!filters.search ||
          `${t.title} ${t.description ?? ""} ${t.key}`
            .toLowerCase()
            .includes(filters.search.toLowerCase())) &&
        (!filters.status || t.status === filters.status) &&
        (!filters.priority || t.priority === filters.priority) &&
        (!filters.assigneeId ||
          (filters.assigneeId === "me"
            ? t.assigneeId === me?.id
            : filters.assigneeId === "unassigned"
              ? !t.assigneeId
              : t.assigneeId === filters.assigneeId)) &&
        (!filters.labelId || t.labels.some((l) => l.id === filters.labelId)),
    )
    .sort((a, b) =>
      filters.sort === "title"
        ? a.title.localeCompare(b.title)
        : filters.sort === "dueDate"
          ? (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")
          : filters.sort === "-createdAt"
            ? b.createdAt.localeCompare(a.createdAt)
            : priorities.indexOf(a.priority) - priorities.indexOf(b.priority),
    );
  const openTask = (id: string) => {
    const t = tasks.find((t) => t.id === id);
    if (t && t.projectId !== projectId) {
      router.push(`/w/${workspaceId}/p/${t.projectId}/board?task=${id}`);
      setSelected(null);
    } else setSelected(id);
  };
  const formValues = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    return Object.fromEntries(
      new FormData(e.currentTarget).entries(),
    ) as Record<string, string>;
  };
  const closed = () => setModal(null);
  const pillLabel = (l: Label) => (
    <span
      key={l.id}
      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium"
      style={{ color: l.color, background: `${l.color}14` }}
    >
      {l.name}
    </span>
  );

  if (loading)
    return (
      <div className="bg-background font-sans text-sm text-foreground   flex min-h-svh flex-col items-center justify-center gap-4 p-8">
        Loading workspace…
      </div>
    );
  if (!ws || !me || errors.length)
    return (
      <div className="bg-background font-sans text-sm text-foreground   flex min-h-svh flex-col items-center justify-center gap-4 p-8">
        <h1>Could not load this workspace</h1>
        <p role="alert">
          {errors[0]?.error?.message ?? "Workspace unavailable"}
        </p>
        <Button
          variant="outline"
          type="submit"
          onClick={() => qc.invalidateQueries()}
        >
          Try again
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/workspaces")}
        >
          Your workspaces
        </Button>
      </div>
    );
  const heading = (
    {
      members: "Members",
      settings: "Settings",
      activity: "Activity",
      profile: "Profile",
      account: "Account settings",
    } as Record<string, string>
  )[section];

  return (
    <div className="min-h-svh bg-background font-sans text-sm text-foreground">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-2 overflow-y-auto border-r bg-sidebar p-4 md:flex   ${menu ? "!flex shadow-lg" : ""}`}
      >
        <div className="flex items-center gap-2 [&>button]:min-w-0 [&>button]:flex-1 [&>button]:border-0 [&>button]:bg-transparent">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
            {initials(ws.name)}
          </span>
          <SelectControl
            aria-label="Workspace"
            value={workspaceId}
            onChange={(e) => router.push(`/w/${e.target.value}/board`)}
          >
            {workspaces.data?.map((w) => (
              <SelectOption key={w.id} value={w.id}>
                {w.name}
              </SelectOption>
            ))}
          </SelectControl>
        </div>
        <small>
          {owner ? "Owner" : "Member"} · {workspaces.data?.length} workspaces
        </small>
        <Button
          variant="outline"
          type="submit"
          className="my-5 w-full justify-start gap-2 text-xs text-muted-foreground [&>kbd]:ml-auto [&>kbd]:text-[10px]"
          onClick={() => setModal("search")}
        >
          <Search size={15} />
          Search or jump to…<kbd>⌘ K</kbd>
        </Button>
        <div className="mt-5 mb-2 flex min-h-7 items-center justify-between px-2 text-xs font-medium text-muted-foreground">
          <span>Projects</span>
          {owner && (
            <Button
              type="button"
              variant="ghost"
              className="size-8 shrink-0 p-0"
              aria-label="New project"
              onClick={() => setModal("project")}
            >
              <Plus size={16} />
            </Button>
          )}
        </div>
        <nav className="flex flex-col gap-1 [&>button]:w-full [&>button]:justify-start [&>button]:border-0 [&>button]:bg-transparent [&>button]:shadow-none">
          {projects
            .filter((p) => !p.archivedAt)
            .map((p) => (
              <Button
                variant="outline"
                type="submit"
                className={
                  p.id === projectId
                    ? "!bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : ""
                }
                key={p.id}
                onClick={() =>
                  go(
                    me.startPage === "activity"
                      ? "pactivity"
                      : me.startPage === "list"
                        ? "list"
                        : "board",
                    p.id,
                  )
                }
              >
                <span
                  className="flex min-w-8 shrink-0 items-center justify-center text-[10px] font-semibold"
                  style={{ color: p.color }}
                >
                  {p.key}
                </span>
                <span>{p.name}</span>
                <small>{p._count?.tasks}</small>
              </Button>
            ))}
        </nav>
        {owner && projects.some((p) => p.archivedAt) && (
          <details className="my-3 space-y-2 px-2 text-xs text-muted-foreground [&>div]:flex [&>div]:items-center [&>div]:justify-between">
            <summary>Archived</summary>
            {projects
              .filter((p) => p.archivedAt)
              .map((p) => (
                <div key={p.id}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => go("board", p.id)}
                  >
                    {p.name}
                  </Button>
                  <Button
                    variant="outline"
                    type="submit"
                    onClick={() =>
                      mutate(`/projects/${p.id}/unarchive`, "POST")
                    }
                  >
                    Restore
                  </Button>
                </div>
              ))}
          </details>
        )}
        <span className="mt-5 mb-2 flex min-h-7 items-center justify-between px-2 text-xs font-medium text-muted-foreground">
          Workspace
        </span>
        <nav className="flex flex-col gap-1 [&>button]:w-full [&>button]:justify-start [&>button]:border-0 [&>button]:bg-transparent [&>button]:shadow-none">
          <Button
            type="button"
            variant="outline"
            className={
              section === "activity"
                ? "!bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                : ""
            }
            onClick={() => go("activity")}
          >
            <Activity size={16} />
            Activity
          </Button>
          {owner && (
            <>
              <Button
                variant="outline"
                type="submit"
                className={
                  section === "members"
                    ? "!bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : ""
                }
                onClick={() => go("members")}
              >
                <Users size={16} />
                Members
              </Button>
              <Button
                type="button"
                variant="outline"
                className={
                  section === "settings"
                    ? "!bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : ""
                }
                onClick={() => go("settings")}
              >
                <Settings size={16} />
                Settings
              </Button>
            </>
          )}
        </nav>
        <Button
          variant="outline"
          type="submit"
          className="my-4 justify-start"
          onClick={() => setModal("workspace")}
        >
          <Plus size={15} />
          Create workspace
        </Button>
        <div className="mt-auto flex items-center gap-2 border-t pt-4 [&>button:first-child]:min-w-0 [&>button:first-child]:flex-1 [&>button:first-child]:justify-start [&_strong]:block [&_strong]:truncate [&_strong]:text-xs [&_small]:block [&_small]:text-[11px]">
          <Button type="button" variant="outline" onClick={() => go("profile")}>
            <Avatar user={me} />
            <span>
              <strong>{me.name}</strong>
              <small>
                {owner ? "Workspace owner" : human(project?.role ?? "MEMBER")}
              </small>
            </span>
          </Button>
          <Button
            variant="ghost"
            type="submit"
            className="size-8 shrink-0 p-0"
            aria-label="Account settings"
            onClick={() => go("account")}
          >
            <Settings size={17} />
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 md:ml-60">
        <div className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-3 md:hidden">
          <Button
            type="button"
            variant="outline"
            aria-label="Open navigation"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={20} />
          </Button>
          <strong>{project?.name ?? ws.name}</strong>
          <Button
            variant="outline"
            type="submit"
            aria-label="Search"
            onClick={() => setModal("search")}
          >
            <Search size={18} />
          </Button>
        </div>
        <div className="px-4 pt-6 pb-24 md:px-8 md:pt-8 md:pb-12">
          {project && !heading && (
            <>
              <header className="mb-5 flex flex-wrap items-center justify-between gap-4 [&_h1]:mt-2 [&_h1]:flex [&_h1]:items-center [&_h1]:gap-2 [&_h1]:text-2xl [&_h1]:font-semibold [&_small]:text-xs [&_small]:text-muted-foreground">
                <div>
                  <small>{ws.name} / Projects</small>
                  <h1>
                    <span
                      className="inline-block size-3 shrink-0 rounded-sm"
                      style={{ background: project.color }}
                    />
                    {project.name}
                    {project.archivedAt && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium">
                        Archived
                      </span>
                    )}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="hidden items-center -space-x-2 sm:flex [&>*]:ring-2 [&>*]:ring-background">
                    {members.slice(0, 4).map((m) => (
                      <Avatar key={m.id} user={m.user} />
                    ))}
                  </div>
                  {admin && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="size-8 shrink-0 p-0"
                      aria-label="Project settings"
                      onClick={() => go("psettings")}
                    >
                      <Settings size={17} />
                    </Button>
                  )}
                  <Button
                    variant="default"
                    type="submit"
                    className=""
                    disabled={!editable}
                    onClick={() => setModal("task")}
                  >
                    <Plus size={16} />
                    New task
                  </Button>
                </div>
              </header>
              <nav className="mb-5 flex gap-5 overflow-x-auto border-b [&>button]:shrink-0 [&>button]:rounded-none [&>button]:border-0 [&>button]:border-b-2 [&>button]:border-transparent [&>button]:bg-transparent [&>button]:px-0 [&>button]:text-muted-foreground">
                {[
                  ["board", "Board"],
                  ["list", "List"],
                  ["pactivity", "Activity"],
                  ["pmembers", `Members ${members.length}`],
                  ...(admin ? [["psettings", "Settings"]] : []),
                ].map(([s, label]) => (
                  <Button
                    type="button"
                    variant="outline"
                    key={s}
                    className={
                      s === section ? "!border-primary !text-foreground" : ""
                    }
                    onClick={() => go(s!)}
                  >
                    {label}
                  </Button>
                ))}
              </nav>
            </>
          )}
          {heading && (
            <header className="mb-7 space-y-2 [&>h1]:text-2xl [&>h1]:font-semibold [&>p]:text-sm [&>p]:text-muted-foreground">
              <h1>{heading}</h1>
              {section === "activity" && (
                <p>
                  {owner
                    ? `Everything that changed in ${ws.name}, newest first.`
                    : "Changes from your assigned projects."}
                </p>
              )}
            </header>
          )}
          {!projectId && section === "board" && !projects.length && (
            <div className="flex flex-col items-center justify-center gap-4 px-5 py-20 text-center [&_h1]:text-xl [&_h1]:font-semibold [&_p]:max-w-md [&_p]:text-muted-foreground">
              <Columns3 size={36} />
              <h1>No projects in {ws.name} yet</h1>
              <p>
                {owner
                  ? "Create a project to start organizing your work."
                  : "Your workspace owner or project admin can add you to a project."}
              </p>
              {owner && (
                <Button
                  variant="default"
                  type="submit"
                  className=""
                  onClick={() => setModal("project")}
                >
                  Create project
                </Button>
              )}
            </div>
          )}
          {project && ["board", "list"].includes(section) && (
            <>
              <div className="mb-6 flex flex-wrap items-center gap-2 [&>button]:h-8 [&>button]:text-xs [&_input]:h-8">
                <SelectControl
                  aria-label="Saved view"
                  defaultValue=""
                  onChange={(e) => {
                    const v = viewsQuery.data?.find(
                      (v) => v.id === e.target.value,
                    );
                    setFilters(
                      v ? { ...cleanFilters, ...v.filters } : cleanFilters,
                    );
                  }}
                >
                  <SelectOption value="">All tasks</SelectOption>
                  {viewsQuery.data?.map((v) => (
                    <SelectOption key={v.id} value={v.id}>
                      {v.name}
                    </SelectOption>
                  ))}
                </SelectControl>
                <label className="flex min-w-32 items-center gap-2 rounded-lg border bg-background px-2 [&>input]:h-8 [&>input]:border-0 [&>input]:bg-transparent [&>input]:px-0 [&>input]:shadow-none [&>input]:focus-visible:ring-0">
                  <Search size={15} />
                  <Input
                    placeholder="Filter tasks"
                    value={filters.search}
                    onChange={(e) => filter("search", e.target.value)}
                  />
                </label>
                <SelectControl
                  aria-label="Status filter"
                  value={filters.status}
                  onChange={(e) => filter("status", e.target.value)}
                >
                  <SelectOption value="">Status</SelectOption>
                  {statuses.map((s) => (
                    <SelectOption key={s.id} value={s.id}>
                      {s.name}
                    </SelectOption>
                  ))}
                </SelectControl>
                <SelectControl
                  aria-label="Priority filter"
                  value={filters.priority}
                  onChange={(e) => filter("priority", e.target.value)}
                >
                  <SelectOption value="">Priority</SelectOption>
                  {priorities.map((p) => (
                    <SelectOption key={p}>{p}</SelectOption>
                  ))}
                </SelectControl>
                <SelectControl
                  aria-label="Assignee filter"
                  value={filters.assigneeId}
                  onChange={(e) => filter("assigneeId", e.target.value)}
                >
                  <SelectOption value="">Assignee</SelectOption>
                  <SelectOption value="me">Assigned to me</SelectOption>
                  <SelectOption value="unassigned">Unassigned</SelectOption>
                  {members
                    .filter((m) => m.active)
                    .map((m) => (
                      <SelectOption key={m.id} value={m.user.id}>
                        {m.user.name}
                      </SelectOption>
                    ))}
                </SelectControl>
                <SelectControl
                  aria-label="Label filter"
                  value={filters.labelId}
                  onChange={(e) => filter("labelId", e.target.value)}
                >
                  <SelectOption value="">Labels</SelectOption>
                  {labels.map((l) => (
                    <SelectOption key={l.id} value={l.id}>
                      {l.name}
                    </SelectOption>
                  ))}
                </SelectControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFilters(cleanFilters);
                    setListPage(0);
                  }}
                >
                  Clear
                </Button>
                <span className="flex-1" />
                <small>{visible.length} tasks</small>
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <CheckControl
                    checked={showSubs}
                    onChange={(e) => setShowSubs(e.target.checked)}
                  />
                  Show subtasks
                </label>
                <SelectControl
                  aria-label="Sort tasks"
                  value={filters.sort}
                  onChange={(e) => filter("sort", e.target.value)}
                >
                  <SelectOption value="-priority">Priority</SelectOption>
                  <SelectOption value="-createdAt">Newest</SelectOption>
                  <SelectOption value="dueDate">Due date</SelectOption>
                  <SelectOption value="title">Title A–Z</SelectOption>
                </SelectControl>
                <Button
                  variant="outline"
                  type="submit"
                  onClick={() => setModal("view")}
                >
                  Save view
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="size-8 shrink-0 p-0"
                  aria-label="Manage saved views"
                  onClick={() => setModal("views")}
                >
                  <Settings size={15} />
                </Button>
              </div>
              {section === "board" ? (
                <div className="flex min-h-[60vh] items-start gap-5 overflow-x-auto pb-6">
                  {statuses
                    .filter(
                      (s) => s.id !== "CANCELLED" || project.showCancelled,
                    )
                    .map((s) => {
                      const column = visible.filter((t) => t.status === s.id);
                      const total = tasks.filter(
                        (t) => t.status === s.id && !t.parentTaskId,
                      ).length;
                      const over =
                        s.id === "IN_PROGRESS" &&
                        project.wipLimit > 0 &&
                        total > project.wipLimit;
                      return (
                        <section
                          key={s.id}
                          className={`${s.id === "CANCELLED" && cancelledCollapsed ? "!min-w-14 !max-w-14 [&>*:not(header)]:hidden [&>header]:flex-col [&>header]:gap-4" : ""} min-w-60 flex-1 space-y-3 rounded-lg p-1 [&>header]:flex [&>header]:items-center [&>header]:gap-2 [&>header>button]:ml-auto [&>header>span:nth-child(2)]:text-xs [&>header>span:nth-child(2)]:text-muted-foreground   ${over ? "bg-destructive/5 ring-1 ring-destructive/30" : ""}`}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const id = e.dataTransfer.getData("text/plain");
                            if (editable && tasks.some((t) => t.id === id))
                              void mutate(`/tasks/${id}/status`, "PATCH", {
                                status: s.id,
                              });
                          }}
                        >
                          <header>
                            {s.id === "CANCELLED" ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                aria-expanded={!cancelledCollapsed}
                                aria-label={
                                  cancelledCollapsed
                                    ? "Expand Cancelled column"
                                    : "Collapse Cancelled column"
                                }
                                className={
                                  cancelledCollapsed
                                    ? "h-auto px-1 [writing-mode:vertical-rl]"
                                    : "px-0"
                                }
                                onClick={() => setCancelledCollapsed((v) => !v)}
                              >
                                <Status status={s.id} />
                              </Button>
                            ) : (
                              <Status status={s.id} />
                            )}
                            <span>
                              {column.length}
                              {s.id === "IN_PROGRESS" && project.wipLimit > 0
                                ? ` / ${project.wipLimit}`
                                : ""}
                            </span>
                            <Button
                              variant="ghost"
                              type="submit"
                              className="size-8 shrink-0 p-0"
                              aria-label={`Add task to ${s.name}`}
                              disabled={!editable}
                              onClick={() => setModal(`task:${s.id}`)}
                            >
                              <Plus size={15} />
                            </Button>
                          </header>
                          {over && (
                            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                              Over the WIP limit. Finish something before
                              starting more.
                            </p>
                          )}
                          {column.map((t) => (
                            <Button
                              type="button"
                              variant="outline"
                              key={t.id}
                              className="h-auto w-full flex-col items-start justify-start gap-3 whitespace-normal rounded-xl border bg-card p-4 text-left shadow-xs hover:border-primary/40 [&>small]:text-[10px] [&>small]:text-muted-foreground [&>strong]:text-sm [&>strong]:leading-relaxed [&>strong]:font-medium"
                              draggable={editable}
                              onDragStart={(e) =>
                                e.dataTransfer.setData("text/plain", t.id)
                              }
                              onClick={() => openTask(t.id)}
                            >
                              <small>{t.key}</small>
                              <strong
                                className={
                                  ["DONE", "CANCELLED"].includes(t.status)
                                    ? "text-muted-foreground line-through"
                                    : ""
                                }
                              >
                                {t.title}
                              </strong>
                              {project.cardFields.labels && (
                                <div className="flex flex-wrap gap-1">
                                  {t.labels.map(pillLabel)}
                                </div>
                              )}
                              <div className="flex w-full flex-wrap items-center gap-2 [&>small]:text-[10px] [&>small]:text-muted-foreground">
                                <PriorityChip priority={t.priority} />
                                {project.cardFields.due && t.dueDate && (
                                  <span
                                    className={
                                      new Date(t.dueDate) < new Date() &&
                                      !["DONE", "CANCELLED"].includes(t.status)
                                        ? "text-destructive"
                                        : ""
                                    }
                                  >
                                    {formatDate(t.dueDate)}
                                  </span>
                                )}
                                {project.cardFields.subtasks &&
                                  t._count.subtasks > 0 && (
                                    <small>
                                      ☑{" "}
                                      {
                                        tasks.filter(
                                          (x) =>
                                            x.parentTaskId === t.id &&
                                            x.status === "DONE",
                                        ).length
                                      }
                                      /{t._count.subtasks}
                                    </small>
                                  )}
                                {project.cardFields.comments &&
                                  t._count.comments > 0 && (
                                    <small>◯ {t._count.comments}</small>
                                  )}
                                <span className="flex-1" />
                                {project.cardFields.assignee && t.assignee && (
                                  <Avatar user={t.assignee} />
                                )}
                              </div>
                            </Button>
                          ))}
                          {!column.length && (
                            <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                              No tasks here
                            </div>
                          )}
                          <form
                            className="flex items-center gap-1 [&>input]:h-8 [&>input]:border-0 [&>input]:bg-transparent [&>input]:text-xs [&>input]:shadow-none"
                            onSubmit={async (e) => {
                              const form = e.currentTarget;
                              const v = formValues(e);
                              if (
                                await mutate(
                                  `/projects/${projectId}/tasks`,
                                  "POST",
                                  { title: v.title, status: s.id },
                                )
                              )
                                form.reset();
                            }}
                          >
                            <Input
                              aria-label={`New task in ${s.name}`}
                              placeholder="+ Add task"
                              name="title"
                              required
                              disabled={!editable}
                            />
                            <Button
                              variant="ghost"
                              type="submit"
                              className="size-8 shrink-0 p-0"
                              disabled={!editable || busy}
                              aria-label={`Create task in ${s.name}`}
                            >
                              <Plus size={14} />
                            </Button>
                          </form>
                        </section>
                      );
                    })}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[740px] [&_td:first-child]:w-1/2 [&_td:first-child>button]:justify-start [&_td:first-child>button]:px-0 [&_td:first-child>button]:text-left [&_small]:mr-2 [&_small]:text-xs [&_small]:text-muted-foreground">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Due</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visible
                        .slice(listPage * 20, (listPage + 1) * 20)
                        .map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => openTask(t.id)}
                              >
                                <small>{t.key}</small>
                                {t.title}
                              </Button>
                              {t.labels.map(pillLabel)}
                            </TableCell>
                            <TableCell>
                              <Status status={t.status} />
                            </TableCell>
                            <TableCell>
                              <PriorityChip priority={t.priority} />
                            </TableCell>
                            <TableCell>
                              {t.assignee ? <Avatar user={t.assignee} /> : "—"}
                            </TableCell>
                            <TableCell>{formatDate(t.dueDate)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  {!visible.length && (
                    <p className="flex flex-col items-center justify-center gap-4 px-5 py-20 text-center [&_h1]:text-xl [&_h1]:font-semibold [&_p]:max-w-md [&_p]:text-muted-foreground">
                      No matching tasks.
                    </p>
                  )}
                  <footer className="mt-5 flex items-center gap-3 text-xs [&>span:first-child]:mr-auto">
                    <span>{visible.length} tasks</span>
                    <Button
                      variant="outline"
                      type="submit"
                      disabled={!listPage}
                      onClick={() => setListPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <span>
                      {listPage + 1} /{" "}
                      {Math.max(1, Math.ceil(visible.length / 20))}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={(listPage + 1) * 20 >= visible.length}
                      onClick={() => setListPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </footer>
                </div>
              )}
            </>
          )}
          {["activity", "pactivity"].includes(section) && (
            <>
              <div className="mb-6 flex flex-wrap items-center gap-2 [&>button]:h-8 [&>button]:text-xs [&_input]:h-8">
                {owner && (
                  <>
                    <SelectControl
                      aria-label="Activity project filter"
                      value={activityProject}
                      onChange={(e) => setActivityProject(e.target.value)}
                    >
                      <SelectOption value="">All projects</SelectOption>
                      {projects.map((p) => (
                        <SelectOption key={p.id} value={p.id}>
                          {p.name}
                        </SelectOption>
                      ))}
                    </SelectControl>
                    <SelectControl
                      aria-label="Activity event filter"
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value)}
                    >
                      <SelectOption value="">All changes</SelectOption>
                      {[
                        "task",
                        "comment",
                        "project",
                        "membership",
                        "workspace",
                      ].map((t) => (
                        <SelectOption key={t} value={t}>
                          {human(t)}
                        </SelectOption>
                      ))}
                    </SelectControl>
                  </>
                )}
              </div>
              <div className="max-w-4xl [&>article]:flex [&>article]:items-start [&>article]:gap-3 [&>article]:border-b [&>article]:py-5 [&_p]:text-sm [&_small]:text-xs [&_small]:text-muted-foreground">
                {activityQuery.isError && (
                  <p role="alert">{activityQuery.error.message}</p>
                )}
                {activityQuery.data
                  ?.filter(
                    (a) =>
                      section !== "pactivity" ||
                      (a as ActivityEvent & { projectId: string }).projectId ===
                        projectId,
                  )
                  .map((a) => (
                    <article key={a.id}>
                      <Avatar user={a.actor ?? { name: "Deleted user" }} />
                      <div>
                        <p>
                          <strong>{a.actor?.name ?? "Deleted user"}</strong>{" "}
                          {a.action.replaceAll(".", " ").replaceAll("_", " ")}{" "}
                          <Button
                            variant="outline"
                            type="submit"
                            onClick={() => {
                              if (a.entityType === "task") openTask(a.entityId);
                            }}
                          >
                            {String(a.metadata?.title ?? a.metadata?.name ?? tasks.find(t=>t.id===a.entityId)?.title ?? "")}
                          </Button>
                        </p>
                        <small>{new Date(a.createdAt).toLocaleString()}</small>
                      </div>
                    </article>
                  ))}
                {activityQuery.data?.length === 0 && (
                  <p className="flex flex-col items-center justify-center gap-4 px-5 py-20 text-center [&_h1]:text-xl [&_h1]:font-semibold [&_p]:max-w-md [&_p]:text-muted-foreground">
                    No activity yet.
                  </p>
                )}
              </div>
            </>
          )}
          {section === "pmembers" && (
            <section className="mx-auto w-full max-w-3xl space-y-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 [&_h2]:text-base [&_h2]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground">
                <div>
                  <h2>Project team</h2>
                  <p>
                    {members.length} people · {project?.seatsUsed} of{" "}
                    {project?.seats} seats used
                  </p>
                </div>
                {admin && editable && (
                  <Button
                    type="button"
                    variant="default"
                    className=""
                    disabled={
                      (project?.seatsUsed ?? 0) >= (project?.seats ?? 0)
                    }
                    onClick={() => setModal("add-person")}
                  >
                    <Plus size={15} />
                    Add people
                  </Button>
                )}
              </div>
              <p className="mb-5 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                Only assigned people and the workspace owner can access this
                project.
              </p>
              <People
                people={members}
                meId={me.id}
                canManage={admin && editable}
                ownerId={ws.ownerId}
                onRole={(p, role) =>
                  mutate(
                    `/projects/${projectId}/members/${p.user.id}`,
                    "PATCH",
                    { role },
                  )
                }
                onRemove={(p) => setModal(`remove-project-person:${p.user.id}`)}
              />
            </section>
          )}
          {section === "members" &&
            (owner ? (
              <section className="mx-auto w-full max-w-3xl space-y-5">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 [&_h2]:text-base [&_h2]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground">
                  <p>People in {ws.name}, and the projects they belong to.</p>
                  <Button
                    variant="default"
                    type="submit"
                    className=""
                    onClick={() => setModal("user")}
                  >
                    <Plus size={15} />
                    Add user
                  </Button>
                </div>
                <SelectControl
                  aria-label="Directory project"
                  value={activityProject}
                  onChange={(e) => setActivityProject(e.target.value)}
                >
                  <SelectOption value="">All projects</SelectOption>
                  {projects.map((p) => (
                    <SelectOption key={p.id} value={p.id}>
                      {p.name}
                    </SelectOption>
                  ))}
                </SelectControl>
                {directory.isError && (
                  <p role="alert">{directory.error.message}</p>
                )}
                {directory.data
                  ?.filter(
                    (p) =>
                      !activityProject ||
                      p.user.id === ws.ownerId ||
                      p.projects?.some((a) => a.project.id === activityProject),
                  )
                  .map((p) => (
                    <div
                      className="flex flex-wrap items-center gap-3 border-b py-4 [&>div]:min-w-32 [&_strong]:text-sm [&_strong]:font-medium [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground"
                      key={p.id}
                    >
                      <Avatar user={p.user} />
                      <div>
                        <strong>{p.user.name}</strong>
                        <small>{p.user.email}</small>
                        <small>
                          {p.projects
                            ?.map((a) => `${a.project.name} (${human(a.role)})`)
                            .join(", ")}
                        </small>
                      </div>
                      <span className="flex-1" />
                      {p.user.id === ws.ownerId ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium">
                          Workspace owner
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium">
                            {p.active ? "Active" : "Deactivated"}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              mutate(
                                `/workspaces/${workspaceId}/members/${p.user.id}`,
                                "PATCH",
                                { active: !p.active },
                              )
                            }
                          >
                            {p.active ? "Deactivate" : "Reactivate"}
                          </Button>
                          <Button
                            variant="ghost"
                            type="submit"
                            className="text-destructive"
                            onClick={() =>
                              setModal(`remove-workspace-person:${p.user.id}`)
                            }
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
              </section>
            ) : (
              <p className="flex flex-col items-center justify-center gap-4 px-5 py-20 text-center [&_h1]:text-xl [&_h1]:font-semibold [&_p]:max-w-md [&_p]:text-muted-foreground">
                Only the workspace owner can access this page.
              </p>
            ))}
          {section === "psettings" &&
            project &&
            (admin ? (
              <ProjectSettings
                key={project.id + project.updatedAt}
                project={project}
                owner={owner}
                labels={labels}
                busy={busy}
                mutate={mutate}
                open={setModal}
              />
            ) : (
              <p className="flex flex-col items-center justify-center gap-4 px-5 py-20 text-center [&_h1]:text-xl [&_h1]:font-semibold [&_p]:max-w-md [&_p]:text-muted-foreground">
                Project settings require Admin permission.
              </p>
            ))}
          {section === "settings" &&
            (owner ? (
              <section className="mx-auto w-full max-w-3xl space-y-5">
                <form
                  className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start"
                  onSubmit={(e) => {
                    const v = formValues(e);
                    void mutate(
                      `/workspaces/${workspaceId}`,
                      "PATCH",
                      { name: v.name },
                      "Workspace updated",
                    );
                  }}
                >
                  <h2>Workspace name</h2>
                  <Field label="Name">
                    <Input name="name" required defaultValue={ws.name} />
                  </Field>
                  <Button
                    type="submit"
                    variant="default"
                    className=""
                    disabled={busy}
                  >
                    Save changes
                  </Button>
                </form>
                <section className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start">
                  <h2>Project seats</h2>
                  <p>
                    Each assigned Admin or Member uses one seat. Workspace
                    owners do not use a seat.
                  </p>
                  {projects
                    .filter((p) => !p.archivedAt)
                    .map((p) => (
                      <form
                        key={p.id}
                        className="flex flex-wrap items-center gap-3 [&>strong]:min-w-32 [&>strong]:flex-1 [&>input]:w-20"
                        onSubmit={(e) => {
                          const v = formValues(e);
                          void mutate(
                            `/projects/${p.id}`,
                            "PATCH",
                            { seats: Number(v.seats) },
                            "Seat limit updated",
                          );
                        }}
                      >
                        <strong>{p.name}</strong>
                        <Input
                          aria-label={`Seat limit for ${p.name}`}
                          type="number"
                          min={1}
                          max={100}
                          name="seats"
                          defaultValue={p.seats}
                        />
                        <Button variant="outline" type="submit" disabled={busy}>
                          Save
                        </Button>
                      </form>
                    ))}
                </section>
                <section className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start">
                  <h2>Transfer ownership</h2>
                  <p>
                    Choose an active workspace user and explicitly set your
                    project assignments.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModal("transfer")}
                  >
                    Transfer ownership
                  </Button>
                </section>
                <section className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start   border-destructive/25">
                  <h2>Delete workspace</h2>
                  <p>
                    Removes this workspace, its projects, tasks, and activity.
                  </p>
                  <Button
                    variant="ghost"
                    type="submit"
                    className="text-destructive"
                    onClick={() => setModal("delete-workspace")}
                  >
                    Delete workspace…
                  </Button>
                </section>
              </section>
            ) : (
              <p className="flex flex-col items-center justify-center gap-4 px-5 py-20 text-center [&_h1]:text-xl [&_h1]:font-semibold [&_p]:max-w-md [&_p]:text-muted-foreground">
                Only the workspace owner can access settings.
              </p>
            ))}
          {section === "profile" && (
            <section className="mx-auto w-full max-w-3xl space-y-5">
              <div className="mb-6 flex items-center gap-4 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground">
                <Avatar user={me} />
                <div>
                  <h2>{me.name}</h2>
                  <p>{me.email}</p>
                </div>
              </div>
              <div className="mb-6 grid grid-cols-3 gap-5">
                {[
                  [statsQuery.data?.open, "Open tasks assigned"],
                  [statsQuery.data?.done, "Tasks completed"],
                  [statsQuery.data?.comments, "Your comments"],
                ].map(([count, label]) => (
                  <div key={label}>
                    <strong className="block text-2xl font-semibold">
                      {count ?? "..."}
                    </strong>
                    <small className="text-xs text-muted-foreground">
                      {label}
                    </small>
                  </div>
                ))}
              </div>
              <form
                className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start"
                onSubmit={(e) => {
                  const v = formValues(e);
                  void mutate("/auth/me", "PATCH", v, "Profile updated");
                }}
              >
                <h2>About you</h2>
                <Field label="Name">
                  <Input name="name" defaultValue={me.name} required />
                </Field>
                <Field label="Email">
                  <Input
                    name="email"
                    defaultValue={me.email}
                    required
                    type="email"
                  />
                </Field>
                <Field label="Job title">
                  <Input name="jobTitle" defaultValue={me.jobTitle} />
                </Field>
                <Field label="Timezone">
                  <Input name="timezone" defaultValue={me.timezone} required />
                </Field>
                <Field label="Bio">
                  <Textarea name="bio" defaultValue={me.bio} rows={3} />
                </Field>
                <Field label="Avatar">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 140000) {
                        toast.error("Choose an avatar smaller than 140 KB");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        void mutate(
                          "/auth/me",
                          "PATCH",
                          { avatar: reader.result },
                          "Avatar updated",
                        );
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </Field>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="submit"
                    variant="default"
                    className=""
                    disabled={busy}
                  >
                    Save changes
                  </Button>
                  <Button variant="outline" type="reset">
                    Discard
                  </Button>
                </div>
              </form>
            </section>
          )}
          {section === "account" && (
            <section className="mx-auto w-full max-w-3xl space-y-5">
              <section className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start">
                <h2>Preferences</h2>
                <Field label="Open projects on">
                  <SelectControl
                    value={me.startPage}
                    onChange={(e) =>
                      mutate("/auth/me", "PATCH", { startPage: e.target.value })
                    }
                  >
                    <SelectOption value="board">Board</SelectOption>
                    <SelectOption value="list">List</SelectOption>
                    <SelectOption value="activity">Activity</SelectOption>
                  </SelectControl>
                </Field>
                <Field label="Appearance">
                  <SelectControl
                    value={me.theme}
                    onChange={(e) =>
                      mutate("/auth/me", "PATCH", { theme: e.target.value })
                    }
                  >
                    <SelectOption value="system">System</SelectOption>
                    <SelectOption value="light">Light</SelectOption>
                    <SelectOption value="dark">Dark</SelectOption>
                  </SelectControl>
                </Field>
              </section>
              <form
                className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start"
                onSubmit={async (e) => {
                  const form = e.currentTarget;
                  const v = formValues(e);
                  if (
                    await mutate(
                      "/auth/password",
                      "POST",
                      v,
                      "Password changed",
                    )
                  )
                    form.reset();
                }}
              >
                <h2>Change password</h2>
                <Field label="Current password">
                  <Input
                    name="currentPassword"
                    required
                    type="password"
                    autoComplete="current-password"
                  />
                </Field>
                <Field label="New password">
                  <Input
                    name="password"
                    required
                    minLength={8}
                    type="password"
                    autoComplete="new-password"
                  />
                </Field>
                <Button type="submit" variant="outline" disabled={busy}>
                  Change password
                </Button>
              </form>
              <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start">
                <Button variant="outline" type="submit" onClick={logout}>
                  <LogOut size={16} />
                  Sign out
                </Button>
              </div>
              <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start   border-destructive/25">
                <h2>Delete account</h2>
                <p>Transfer or delete your owned workspaces first.</p>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setModal("delete-account")}
                >
                  Delete my account…
                </Button>
              </div>
            </section>
          )}
        </div>
        <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-background p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] md:hidden [&>button]:h-auto [&>button]:flex-col [&>button]:gap-1 [&>button]:text-[10px]">
          <Button variant="outline" type="submit" onClick={() => go("board")}>
            <Columns3 size={19} />
            Board
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              go("list");
              setFilters({ ...cleanFilters, assigneeId: "me" });
            }}
          >
            <List size={19} />
            My tasks
          </Button>
          <Button
            variant="outline"
            type="submit"
            onClick={() => go("activity")}
          >
            <Activity size={19} />
            Activity
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={19} />
            More
          </Button>
        </nav>
      </main>
      {task && (
        <Sheet
          open
          onOpenChange={(next) => {
            if (!next) {
              setSelected(null);
              router.replace(path);
            }
          }}
        >
          <SheetContent
            className={`overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[620px] [&>header]:sticky [&>header]:top-0 [&>header]:z-10 [&>header]:flex [&>header]:items-center [&>header]:gap-2 [&>header]:border-b [&>header]:bg-background [&>header]:px-5 [&>header]:py-3   ${full ? "data-[side=right]:sm:!max-w-[calc(100vw-15rem)]" : ""}`}
            showCloseButton={false}
          >
            <SheetTitle className="sr-only">Task {task.key}</SheetTitle>
            <header>
              <small>
                {project?.name} / {task.key}
              </small>
              <Button
                variant="ghost"
                type="submit"
                className="size-8 shrink-0 p-0"
                aria-label="Copy task reference"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(`${task.key}: ${task.title}`)
                    .then(
                      () => toast.success("Copied task reference"),
                      () => toast.error("Could not copy"),
                    );
                }}
              >
                Copy
              </Button>
              <span className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                className="size-8 shrink-0 p-0"
                aria-label="Expand task"
                onClick={() => setFull(!full)}
              >
                <Maximize2 size={16} />
              </Button>
              <Button
                variant="ghost"
                type="submit"
                className="size-8 shrink-0 p-0"
                aria-label="Close task"
                onClick={() => {
                  setSelected(null);
                  router.replace(path);
                }}
              >
                <X size={18} />
              </Button>
            </header>
            <TaskEditor
              key={task.id + task.updatedAt}
              task={task}
              members={members}
              labels={labels}
              editable={editable}
              subtasks={subtasks}
              comments={commentsQuery.data ?? []}
              me={me}
              mutate={mutate}
              openTask={openTask}
              open={setModal}
              events={
                activityQuery.data?.filter((a) => a.entityId === task.id || a.metadata?.taskId === task.id) ?? []
              }
            />
          </SheetContent>
        </Sheet>
      )}
      {modal && (
        <Dialog
          title={
            modal === "search"
              ? "Search or jump to"
              : modal.startsWith("task")
                ? `New task in ${project?.name}`
                : human(modal.split(":")[0]!)
          }
          close={closed}
          wide={modal === "transfer"}
        >
          {["workspace", "project", "user", "view"].includes(modal) && (
            <form
              onSubmit={async (e) => {
                const v = formValues(e);
                const url =
                  modal === "workspace"
                    ? "/workspaces"
                    : modal === "project"
                      ? `/workspaces/${workspaceId}/projects`
                      : modal === "user"
                        ? `/workspaces/${workspaceId}/members`
                        : `/projects/${projectId}/views`;
                const result = await mutate<Workspace & Project>(
                  url,
                  "POST",
                  modal === "view" ? { name: v.name, filters } : v,
                );
                if (result) {
                  setModal(null);
                  if (modal === "workspace")
                    router.push(`/w/${result.id}/board`);
                  if (modal === "project") go("board", result.id);
                }
              }}
            >
              <Field
                label={modal === "user" ? "Registered account email" : "Name"}
              >
                <Input
                  name={modal === "user" ? "email" : "name"}
                  type={modal === "user" ? "email" : "text"}
                  required
                  autoFocus
                />
              </Field>
              {modal === "project" && (
                <Field label="Project key">
                  <Input
                    name="key"
                    pattern="[A-Za-z][A-Za-z0-9]{0,4}"
                    maxLength={5}
                    placeholder="PP"
                    required
                  />
                </Field>
              )}
              <Button
                type="submit"
                variant="default"
                className=""
                disabled={busy}
              >
                {modal === "user" ? "Add user" : "Create"}
              </Button>
            </form>
          )}
          {modal.startsWith("task") && (
            <form
              onSubmit={async (e) => {
                const form = e.currentTarget;
                const v = formValues(e);
                const result = await mutate(
                  `/projects/${projectId}/tasks`,
                  "POST",
                  {
                    title: v.title,
                    status: v.status,
                    priority: v.priority,
                    assigneeId: v.assigneeId || null,
                  },
                );
                if (result) {
                  if (createAnother) form.reset();
                  else setModal(null);
                }
              }}
            >
              <Field label="Title">
                <Input name="title" required maxLength={200} autoFocus />
              </Field>
              <Field label="Status">
                <SelectControl
                  name="status"
                  defaultValue={modal.split(":")[1] ?? project?.defaultStatus}
                >
                  {statuses.map((s) => (
                    <SelectOption key={s.id} value={s.id}>
                      {s.name}
                    </SelectOption>
                  ))}
                </SelectControl>
              </Field>
              <Field label="Priority">
                <SelectControl
                  name="priority"
                  defaultValue={project?.defaultPriority}
                >
                  {priorities.map((p) => (
                    <SelectOption key={p}>{p}</SelectOption>
                  ))}
                </SelectControl>
              </Field>
              <Field label="Assignee">
                <SelectControl name="assigneeId">
                  <SelectOption value="">Unassigned</SelectOption>
                  {members
                    .filter((m) => m.active)
                    .map((m) => (
                      <SelectOption key={m.id} value={m.user.id}>
                        {m.user.name}
                      </SelectOption>
                    ))}
                </SelectControl>
              </Field>
              <Button
                variant="default"
                type="submit"
                className=""
                disabled={busy}
              >
                Create task
              </Button>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckControl
                  checked={createAnother}
                  onChange={(e) => setCreateAnother(e.target.checked)}
                />
                Create another after this one
              </label>
            </form>
          )}
          {modal === "views" && (
            <div>
              {viewsQuery.data?.map((v) => (
                <div
                  className="flex flex-wrap items-center gap-3 border-b py-4 [&>div]:min-w-32 [&_strong]:text-sm [&_strong]:font-medium [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground"
                  key={v.id}
                >
                  <strong>{v.name}</strong>
                  <span className="flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      mutate(`/projects/${projectId}/views/${v.id}`, "DELETE")
                    }
                  >
                    Delete
                  </Button>
                </div>
              ))}
              {!viewsQuery.data?.length && <p>No saved views yet.</p>}
            </div>
          )}
          {modal === "add-person" && (
            <form
              onSubmit={async (e) => {
                const v = formValues(e);
                if (await mutate(`/projects/${projectId}/members`, "POST", v))
                  setModal(null);
              }}
            >
              <Field label="Workspace user">
                <SelectControl required name="userId">
                  <SelectOption value="">Choose a user</SelectOption>
                  {candidatesQuery.data
                    ?.filter((m) => m.user.id !== ws.ownerId)
                    .map((m) => (
                      <SelectOption key={m.id} value={m.user.id}>
                        {m.user.name} · {m.user.email}
                      </SelectOption>
                    ))}
                </SelectControl>
              </Field>
              {candidatesQuery.isError && (
                <p role="alert">{candidatesQuery.error.message}</p>
              )}
              <Field label="Project role">
                <SelectControl name="role">
                  <SelectOption value="MEMBER">Member</SelectOption>
                  <SelectOption value="ADMIN">Admin</SelectOption>
                </SelectControl>
              </Field>
              <Button
                variant="default"
                type="submit"
                className=""
                disabled={busy}
              >
                Add to project
              </Button>
            </form>
          )}
          {modal === "transfer" && (
            <form
              onSubmit={async (e) => {
                const v = formValues(e);
                const assignments = projects
                  .filter((p) => v[`role:${p.id}`])
                  .map((p) => ({ projectId: p.id, role: v[`role:${p.id}`] }));
                if (
                  await mutate(
                    `/workspaces/${workspaceId}/transfer`,
                    "POST",
                    { userId: v.userId, assignments },
                    "Ownership transferred",
                  )
                ) {
                  setModal(null);
                  router.push(`/w/${workspaceId}/board`);
                }
              }}
            >
              <Field label="New owner">
                <SelectControl name="userId" required>
                  <SelectOption value="">
                    Choose an active workspace user
                  </SelectOption>
                  {directory.data
                    ?.filter((m) => m.active && m.user.id !== me.id)
                    .map((m) => (
                      <SelectOption key={m.id} value={m.user.id}>
                        {m.user.name}
                      </SelectOption>
                    ))}
                </SelectControl>
              </Field>
              <h3>Your access after transfer</h3>
              {projects.map((p) => (
                <Field key={p.id} label={p.name}>
                  <SelectControl name={`role:${p.id}`} defaultValue="">
                    <SelectOption value="">No project access</SelectOption>
                    <SelectOption value="MEMBER">Member</SelectOption>
                    <SelectOption value="ADMIN">Admin</SelectOption>
                  </SelectControl>
                </Field>
              ))}
              <Button
                type="submit"
                variant="default"
                className=""
                disabled={busy}
              >
                Transfer ownership
              </Button>
            </form>
          )}
          {modal === "search" && (
            <div>
              <label className="flex min-w-32 items-center gap-2 rounded-lg border bg-background px-2 [&>input]:h-8 [&>input]:border-0 [&>input]:bg-transparent [&>input]:px-0 [&>input]:shadow-none [&>input]:focus-visible:ring-0">
                <Search size={17} />
                <Input
                  autoFocus
                  placeholder="Search tasks, projects and pages"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
              </label>
              <div className="mt-4 flex max-h-[50svh] flex-col gap-1 overflow-y-auto [&>button]:h-auto [&>button]:justify-start [&>button]:whitespace-normal [&_small]:ml-auto [&_small]:text-[10px] [&_small]:text-muted-foreground">
                {projects
                  .filter((p) =>
                    p.name.toLowerCase().includes(globalSearch.toLowerCase()),
                  )
                  .map((p) => (
                    <Button
                      variant="outline"
                      type="submit"
                      key={p.id}
                      onClick={() => {
                        go("board", p.id);
                        setModal(null);
                      }}
                    >
                      <Columns3 size={16} />
                      <span>{p.name}</span>
                      <small>Project</small>
                    </Button>
                  ))}
                {(globalTasksQuery.data ?? [])
                  .filter((t) =>
                    `${t.key} ${t.title}`
                      .toLowerCase()
                      .includes(globalSearch.toLowerCase()),
                  )
                  .map((t) => (
                    <Button
                      type="button"
                      variant="outline"
                      key={t.id}
                      onClick={() => {
                        router.push(
                          `/w/${workspaceId}/p/${t.projectId}/board?task=${t.id}`,
                        );
                        setModal(null);
                        setSelected(null);
                      }}
                    >
                      <Check size={16} />
                      <span>
                        {t.key} {t.title}
                      </span>
                      <small>Task</small>
                    </Button>
                  ))}
                {[
                  "profile",
                  "account",
                  "activity",
                  ...(owner ? ["members", "settings"] : []),
                ]
                  .filter((p) => p.includes(globalSearch.toLowerCase()))
                  .map((p) => (
                    <Button
                      variant="outline"
                      type="submit"
                      key={p}
                      onClick={() => {
                        go(p);
                        setModal(null);
                      }}
                    >
                      {human(p)}
                      <small>Page</small>
                    </Button>
                  ))}
              </div>
            </div>
          )}
          {modal.startsWith("remove-") && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const [type, id] = modal.split(":");
                await mutate(
                  type === "remove-project-person"
                    ? `/projects/${projectId}/members/${id}`
                    : `/workspaces/${workspaceId}/members/${id}`,
                  "DELETE",
                );
                setModal(null);
              }}
            >
              <p>
                This removes their access and clears affected task assignments.
                Their comments and history are retained.
              </p>
              <Button
                type="submit"
                variant="destructive"
                className=""
                disabled={busy}
              >
                Remove person
              </Button>
            </form>
          )}
          {["delete-project", "delete-workspace", "delete-account"].includes(
            modal,
          ) && (
            <form
              onSubmit={async (e) => {
                const v = formValues(e);
                if (
                  modal !== "delete-account" &&
                  v.confirm !==
                    (modal === "delete-project" ? project?.key : ws.name)
                ) {
                  toast.error("Confirmation does not match");
                  return;
                }
                if (modal === "delete-account") {
                  const result = await mutate<{ deleted: boolean }>(
                    "/auth/me",
                    "DELETE",
                    { password: v.password },
                  );
                  if (result?.deleted) {
                    clearTokens();
                    qc.clear();
                    router.replace("/register");
                  }
                } else if (modal === "delete-project") {
                  if (await mutate(`/projects/${projectId}`, "DELETE")) {
                    setModal(null);
                    router.push(`/w/${workspaceId}/board`);
                  }
                } else {
                  await apiClient(`/workspaces/${workspaceId}`, {
                    method: "DELETE",
                  })
                    .then(async () => {
                      await qc.invalidateQueries();
                      router.push("/workspaces");
                    })
                    .catch((e) => toast.error(e.message));
                }
              }}
            >
              <p>
                {modal === "delete-account"
                  ? "Transfer or delete your owned workspaces before deleting your account."
                  : `Type ${modal === "delete-project" ? project?.key : ws.name} to confirm deletion.`}
              </p>
              <Field
                label={modal === "delete-account" ? "Password" : "Confirmation"}
              >
                <Input
                  name={modal === "delete-account" ? "password" : "confirm"}
                  type={modal === "delete-account" ? "password" : "text"}
                  required
                  autoFocus
                />
              </Field>
              <Button
                variant="destructive"
                type="submit"
                className=""
                disabled={busy}
              >
                Delete
              </Button>
            </form>
          )}
          {modal.startsWith("delete-task:") && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await mutate(`/tasks/${modal.split(":")[1]}`, "DELETE");
                setSelected(null);
                router.replace(path);
                setModal(null);
              }}
            >
              <p>
                Delete this task with its subtasks and comments? Undo is
                available for six seconds.
              </p>
              <Button
                type="submit"
                variant="destructive"
                className=""
                disabled={busy}
              >
                Delete task
              </Button>
            </form>
          )}
        </Dialog>
      )}
      {children}
    </div>
  );
}
