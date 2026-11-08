"use client";
import {
  Avatar,
  human,
  type Person,
} from "@/components/app-shell/taskflow-shared";
import { SelectControl, SelectOption } from "@/components/form-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
export function People({
  people,
  meId,
  ownerId,
  canManage,
  onRole,
  onRemove,
}: {
  people: Person[];
  meId: string;
  ownerId?: string;
  canManage: boolean;
  onRole: (p: Person, role: string) => unknown;
  onRemove: (p: Person) => unknown;
}) {
  const [q, setQ] = useState("");
  return (
    <>
      <label className="flex min-w-32 items-center gap-2 rounded-lg border bg-background px-2 [&>input]:h-8 [&>input]:border-0 [&>input]:bg-transparent [&>input]:px-0 [&>input]:shadow-none [&>input]:focus-visible:ring-0">
        <Search size={15} />
        <Input
          placeholder="Find a member"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      {people
        .filter((p) =>
          `${p.user.name} ${p.user.email}`
            .toLowerCase()
            .includes(q.toLowerCase()),
        )
        .map((p) => (
          <div
            className="flex flex-wrap items-center gap-3 border-b py-4 [&>div]:min-w-32 [&_strong]:text-sm [&_strong]:font-medium [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground"
            key={p.id}
          >
            <Avatar user={p.user} />
            <div>
              <strong>
                {p.user.name}
                {p.user.id === meId ? " (you)" : ""}
              </strong>
              <small>
                {p.user.email}
                {!p.active ? " · Deactivated" : ""}
              </small>
            </div>
            <span className="flex-1" />
            {canManage && p.user.id !== ownerId && p.user.id !== meId ? (
              <>
                <SelectControl
                  aria-label={`Role for ${p.user.name}`}
                  value={p.role}
                  onChange={(e) => onRole(p, e.target.value)}
                >
                  <SelectOption value="MEMBER">Member</SelectOption>
                  <SelectOption value="ADMIN">Admin</SelectOption>
                </SelectControl>
                <Button
                  variant="ghost"
                  type="submit"
                  className="text-destructive"
                  onClick={() => onRemove(p)}
                >
                  Remove
                </Button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium">
                {human(p.role)}
              </span>
            )}
          </div>
        ))}
    </>
  );
}

import { Search } from "lucide-react";
