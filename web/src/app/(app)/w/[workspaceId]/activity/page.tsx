"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { describeActivity, activityEntityLabel } from "@/lib/activity-text";
import { fromNow } from "@/lib/format";
import { useRawSearchParams } from "@/lib/search-params";
import { useActivity, useMembers } from "@/lib/queries";

const ENTITY_TYPES = [
  "workspace",
  "membership",
  "project",
  "task",
  "comment",
] as const;

export default function ActivityPage() {
  const params = useParams();
  const workspaceId = String(params.workspaceId);
  const query = useRawSearchParams();

  const entityType =
    typeof query.entityType === "string" ? query.entityType : undefined;
  const action =
    typeof query.action === "string" ? query.action : undefined;
  const actorId =
    typeof query.actorId === "string" ? query.actorId : undefined;
  const since = typeof query.since === "string" ? query.since : undefined;
  const pageRaw = query.page;
  const page = pageRaw
    ? Number(Array.isArray(pageRaw) ? pageRaw[0] : pageRaw)
    : 1;

  const eventsQuery = useActivity(workspaceId, {
    page,
    pageSize: 30,
    entityType,
    action,
    actorId,
    since,
  });
  const membersQuery = useMembers(workspaceId);

  if (eventsQuery.isPending || membersQuery.isPending) {
    return <Skeleton className="m-6 h-64 w-full" />;
  }

  if (
    eventsQuery.isError ||
    membersQuery.isError ||
    !eventsQuery.data ||
    !membersQuery.data
  ) {
    return (
      <p className="text-destructive p-6 text-sm">Could not load activity.</p>
    );
  }

  const events = eventsQuery.data;
  const members = membersQuery.data;

  return (
    <>
      <PageHeader
        title="Activity"
        description="An audit trail of changes in this workspace."
      />

      <div className="space-y-4 p-4 md:p-6">
        <form
          method="get"
          className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="entityType">Entity</Label>
            <NativeSelect
              id="entityType"
              name="entityType"
              defaultValue={entityType ?? ""}
            >
              <option value="">All</option>
              {ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {activityEntityLabel(type)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="action">Action</Label>
            <Input
              id="action"
              name="action"
              placeholder="task.status_changed"
              defaultValue={action ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="actorId">Actor</Label>
            <NativeSelect id="actorId" name="actorId" defaultValue={actorId ?? ""}>
              <option value="">Anyone</option>
              {members.data.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="since">Since</Label>
            <Input
              id="since"
              name="since"
              type="datetime-local"
              defaultValue={since ?? ""}
            />
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm">
              Apply filters
            </Button>
          </div>
        </form>

        <ul className="divide-y rounded-xl border">
          {events.data.map((event) => (
            <li key={event.id} className="px-4 py-3">
              <p className="text-sm">{describeActivity(event)}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {fromNow(event.createdAt)} · {activityEntityLabel(event.entityType)}
              </p>
            </li>
          ))}
        </ul>

        {events.meta.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/w/${workspaceId}/activity?${buildPageQuery(query, page - 1)}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Previous
              </Link>
            )}
            {page < events.meta.totalPages && (
              <Link
                href={`/w/${workspaceId}/activity?${buildPageQuery(query, page + 1)}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function buildPageQuery(
  query: Record<string, string | string[] | undefined>,
  page: number,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "page" || !value) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else params.set(key, value);
  }
  params.set("page", String(page));
  return params.toString();
}
