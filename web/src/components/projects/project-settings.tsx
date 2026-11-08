"use client";
import {
  Field,
  human,
  labelColors,
  priorities,
  statuses,
  type Mutate,
  type ProjectData,
} from "@/components/app-shell/taskflow-shared";
import {
  CheckControl,
  ColorControl,
  SelectControl,
  SelectOption,
} from "@/components/form-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Label } from "@/lib/api-types";
export function ProjectSettings({
  project,
  owner,
  labels,
  busy,
  mutate,
  open,
}: {
  project: ProjectData;
  owner: boolean;
  labels: Label[];
  busy: boolean;
  mutate: Mutate;
  open: (m: string) => void;
}) {
  const base = `/projects/${project.id}`;
  const disabled = !!project.archivedAt;
  const patch = (body: unknown) =>
    mutate(base, "PATCH", body, "Project updated");
  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <p className="mb-5 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        {disabled
          ? "Restore this project before making changes."
          : "Changes apply to this project and its board."}
      </p>
      <form
        className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start"
        onSubmit={(e) => {
          e.preventDefault();
          const v = Object.fromEntries(new FormData(e.currentTarget));
          void patch(v);
        }}
      >
        <h2>General</h2>
        <Field label="Project name">
          <Input
            name="name"
            defaultValue={project.name}
            required
            disabled={disabled}
          />
        </Field>
        <Field label="Project key">
          <Input
            name="key"
            defaultValue={project.key}
            pattern="[A-Za-z][A-Za-z0-9]{0,4}"
            maxLength={5}
            required
            disabled={disabled}
          />
        </Field>
        <small>
          Changing the key updates the displayed prefix of all task IDs.
        </small>
        <Field label="Description">
          <Textarea
            name="description"
            defaultValue={project.description ?? ""}
            disabled={disabled}
          />
        </Field>
        <Field label="Status">
          <SelectControl
            name="status"
            defaultValue={project.status}
            disabled={disabled}
          >
            {["ACTIVE", "PAUSED", "COMPLETED"].map((s) => (
              <SelectOption key={s}>{s}</SelectOption>
            ))}
          </SelectControl>
        </Field>
        <Field label="Color">
          <ColorControl
            name="color"
            defaultValue={project.color}
            disabled={disabled}
          />
        </Field>
        <Button
          type="submit"
          variant="default"
          className=""
          disabled={busy || disabled}
        >
          Save changes
        </Button>
      </form>
      <section className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start">
        <h2>New task defaults</h2>
        <Field label="Status">
          <SelectControl
            value={project.defaultStatus}
            disabled={disabled}
            onChange={(e) => patch({ defaultStatus: e.target.value })}
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
            value={project.defaultPriority}
            disabled={disabled}
            onChange={(e) => patch({ defaultPriority: e.target.value })}
          >
            {priorities.map((p) => (
              <SelectOption key={p}>{p}</SelectOption>
            ))}
          </SelectControl>
        </Field>
      </section>
      <section className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start">
        <h2>Board</h2>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <CheckControl
            checked={project.showCancelled}
            disabled={disabled}
            onChange={(e) => patch({ showCancelled: e.target.checked })}
          />
          Show Cancelled column
        </label>
        <Field label="In progress WIP warning limit">
          <Input
            key={project.wipLimit}
            type="number"
            min={0}
            max={99}
            defaultValue={project.wipLimit}
            disabled={disabled}
            onBlur={(e) => {
              if (Number(e.target.value) !== project.wipLimit)
                void patch({ wipLimit: Number(e.target.value) });
            }}
          />
        </Field>
        <h3>Show on cards</h3>
        {["assignee", "due", "labels", "subtasks", "comments"].map((f) => (
          <label
            className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"
            key={f}
          >
            <CheckControl
              checked={project.cardFields[f]}
              disabled={disabled}
              onChange={(e) =>
                patch({
                  cardFields: { ...project.cardFields, [f]: e.target.checked },
                })
              }
            />
            {human(f)}
          </label>
        ))}
      </section>
      <section className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start">
        <h2>Labels</h2>
        <p>Labels belong to this project only.</p>
        {labels.map((l) => (
          <form
            key={l.id}
            className="flex flex-wrap items-center gap-2 [&>input:first-child]:min-w-24 [&>input:first-child]:flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              const v = Object.fromEntries(new FormData(e.currentTarget));
              void mutate(`/labels/${l.id}`, "PATCH", v, "Label updated");
            }}
          >
            <Input
              aria-label="Label name"
              name="name"
              defaultValue={l.name}
              disabled={disabled}
              required
            />
            <ColorControl
              aria-label="Label color"

              name="color"
              defaultValue={l.color}
              disabled={disabled}
            />
            <Button variant="outline" type="submit" disabled={disabled}>
              Save
            </Button>
            <Button
              variant="ghost"
              type="button"
              disabled={disabled}
              className="text-destructive"
              onClick={() => mutate(`/labels/${l.id}`, "DELETE")}
            >
              Delete
            </Button>
          </form>
        ))}
        <form
          className="flex flex-wrap items-center gap-2 [&>input:first-child]:min-w-24 [&>input:first-child]:flex-1"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            if (
              await mutate(
                `${base}/labels`,
                "POST",
                Object.fromEntries(new FormData(form)),
              )
            )
              form.reset();
          }}
        >
          <Input
            name="name"
            placeholder="New label"
            aria-label="New label name"
            required
            disabled={disabled}
          />
          <ColorControl
            name="color"
            defaultValue={labelColors[0]}
            aria-label="New label color"
            disabled={disabled}
          />
          <Button type="submit" variant="outline" disabled={disabled}>
            Create label
          </Button>
        </form>
      </section>
      <section className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start">
        <h2>Seats</h2>
        <p>
          {project.seatsUsed} of {project.seats} seats used.{" "}
          {owner
            ? "Manage seat limits in workspace settings."
            : "Only the workspace owner can change this limit."}
        </p>
      </section>
      {owner && (
        <section className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground [&>button]:self-start   border-destructive/25">
          <h2>Archive or delete</h2>
          <p>Archived projects can be restored at any time.</p>
          <Button
            variant="outline"
            type="submit"
            onClick={() =>
              mutate(`${base}/${disabled ? "unarchive" : "archive"}`, "POST")
            }
          >
            {disabled ? "Restore project" : "Archive project"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            disabled={disabled}
            onClick={() => open("delete-project")}
          >
            Delete project…
          </Button>
        </section>
      )}
    </section>
  );
}
