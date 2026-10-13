import {
  PRIORITIES,
  TASK_STATUSES,
  type Priority,
  type TaskStatus,
} from "./api-types";

export interface TaskListQuery {
  page?: number;
  pageSize?: number;
  status?: TaskStatus[];
  priority?: Priority[];
  assigneeId?: string;
  projectId?: string;
  labelId?: string;
  parentTaskId?: string;
  dueBefore?: string;
  dueAfter?: string;
  search?: string;
  topLevelOnly?: boolean;
  sort?: string;
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

const many = (value: string | string[] | undefined) => {
  if (!value) return undefined;
  const items = Array.isArray(value) ? value : [value];
  return items.filter(Boolean);
};

const pickEnum = <T extends string>(values: readonly T[], raw?: string[]) => {
  if (!raw?.length) return undefined;
  const allowed = new Set(values);
  const picked = raw.filter((item): item is T => allowed.has(item as T));
  return picked.length ? picked : undefined;
};

export function parseTaskListQuery(
  searchParams: Record<string, string | string[] | undefined>,
): TaskListQuery {
  const status = pickEnum(TASK_STATUSES, many(searchParams.status));
  const priority = pickEnum(PRIORITIES, many(searchParams.priority));

  return {
    page: one(searchParams.page) ? Number(one(searchParams.page)) : undefined,
    pageSize: one(searchParams.pageSize)
      ? Number(one(searchParams.pageSize))
      : undefined,
    status,
    priority,
    assigneeId: one(searchParams.assigneeId),
    projectId: one(searchParams.projectId),
    labelId: one(searchParams.labelId),
    parentTaskId: one(searchParams.parentTaskId),
    dueBefore: one(searchParams.dueBefore),
    dueAfter: one(searchParams.dueAfter),
    search: one(searchParams.search),
    topLevelOnly: one(searchParams.topLevelOnly) === "true",
    sort: one(searchParams.sort),
  };
}

export function taskQueryToApi(query: TaskListQuery) {
  return {
    ...query,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 25,
    topLevelOnly: query.topLevelOnly ? "true" : "false",
  };
}
