import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import type { Paginated, Workspace } from "@/lib/api-types";

export const instant = false;

// Entry point: land people in a workspace rather than on an empty shell.
export default async function HomePage() {
  const workspaces = await api<Paginated<Workspace>>("/workspaces", {
    query: { pageSize: 1 },
  });

  const first = workspaces.data[0];
  redirect(first ? `/w/${first.id}` : "/workspaces");
}
