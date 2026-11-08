"use client";
import {
  Avatar,
  Field,
  labelColors,
  priorities,
  statuses,
  type Me,
  type Mutate,
  type Person,
  type WorkTask,
} from "@/components/app-shell/taskflow-shared";
import {
  CheckControl,
  DateControl,
  SelectControl,
  SelectOption,
} from "@/components/form-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActivityEvent, Comment, Label } from "@/lib/api-types";
import { Maximize2, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
export function TaskEditor({
  task,
  members,
  labels,
  editable,
  subtasks,
  comments,
  me,
  mutate,
  openTask,
  open,
  events,
}: {
  task: WorkTask;
  members: Person[];
  labels: Label[];
  editable: boolean;
  subtasks: WorkTask[];
  comments: Comment[];
  me: Me;
  mutate: Mutate;
  openTask: (id: string) => void;
  open: (m: string) => void;
  events: ActivityEvent[];
}) {
  const [tab, setTab] = useState("all");
  const patch = (body: unknown) => mutate(`/tasks/${task.id}`, "PATCH", body);
  const formValues = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    return Object.fromEntries(new FormData(e.currentTarget));
  };
  return (
    <div className="space-y-5 px-5 pb-6 [&_section]:space-y-3 [&_section]:border-t [&_section]:pt-5 [&_h3]:text-sm [&_h3]:font-medium">
      <Textarea
        className="min-h-20 resize-none border-0 bg-transparent px-0 text-xl! font-semibold shadow-none focus-visible:ring-0"
        aria-label="Task title"
        defaultValue={task.title}
        disabled={!editable}
        onBlur={(e) => {
          if (e.target.value.trim() && e.target.value !== task.title)
            void patch({ title: e.target.value });
        }}
      />
      <div className="grid grid-cols-2 items-end gap-4">
        <Field label="Status">
          <SelectControl
            value={task.status}
            disabled={!editable}
            onChange={(e) => patch({ status: e.target.value })}
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
            value={task.priority}
            disabled={!editable}
            onChange={(e) => patch({ priority: e.target.value })}
          >
            {priorities.map((p) => (
              <SelectOption key={p}>{p}</SelectOption>
            ))}
          </SelectControl>
        </Field>
        <Field label="Assignee">
          <SelectControl
            value={task.assigneeId ?? ""}
            disabled={!editable}
            onChange={(e) => patch({ assigneeId: e.target.value || null })}
          >
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
          variant="outline"
          type="submit"
          disabled={!editable}
          onClick={() => patch({ assigneeId: me.id })}
        >
          Assign to me
        </Button>
        <Field label="Due date">
          <DateControl
            value={task.dueDate?.slice(0, 10) ?? ""}
            disabled={!editable}
            onChange={(e) => patch({ dueDate: e.target.value || null })}
          />
        </Field>
      </div>
      <section>
        <h3>Labels</h3>
        <div className="flex flex-wrap gap-2">
          {labels.map((l) => (
            <label
              className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground   inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium"
              key={l.id}
              style={{ color: l.color }}
            >
              <CheckControl
                checked={task.labels.some((x) => x.id === l.id)}
                disabled={!editable}
                onChange={(e) =>
                  mutate(
                    `/tasks/${task.id}/labels${e.target.checked ? "" : `/${l.id}`}`,
                    e.target.checked ? "POST" : "DELETE",
                    e.target.checked ? { labelId: l.id } : undefined,
                  )
                }
              />
              {l.name}
            </label>
          ))}
        </div>
        <form
          className="flex items-center gap-2 [&>input]:min-w-0 [&>input]:flex-1"
          onSubmit={async (e) => {
            const form = e.currentTarget;
            const v = formValues(e);
            const l = await mutate<Label>(
              `/projects/${task.projectId}/labels`,
              "POST",
              {
                name: v.name,
                color: labelColors[labels.length % labelColors.length],
              },
            );
            if (l) {
              await mutate(`/tasks/${task.id}/labels`, "POST", {
                labelId: l.id,
              });
              form.reset();
            }
          }}
        >
          <Input
            name="name"
            placeholder="Add or create label"
            aria-label="New label name"
            required
            disabled={!editable}
          />
          <Button type="submit" variant="outline" disabled={!editable}>
            Create
          </Button>
        </form>
      </section>
      <section>
        <h3>Description</h3>
        <Textarea
          aria-label="Task description"
          placeholder="Add a description…"
          defaultValue={task.description ?? ""}
          rows={5}
          disabled={!editable}
          onBlur={(e) => {
            if (e.target.value !== (task.description ?? ""))
              void patch({ description: e.target.value });
          }}
        />
      </section>
      <section>
        <h3>
          Subtasks{" "}
          <small>
            {subtasks.filter((s) => s.status === "DONE").length}/
            {subtasks.length}
          </small>
        </h3>
        {subtasks.map((s) => (
          <div
            className="flex items-center gap-2 border-b py-2 [&>input]:min-w-0 [&>input]:flex-1 [&>input]:border-0 [&>input]:shadow-none"
            key={s.id}
          >
            <CheckControl
              aria-label={`Complete ${s.title}`}
              checked={s.status === "DONE"}
              disabled={!editable}
              onChange={(e) =>
                mutate(`/tasks/${s.id}/status`, "PATCH", {
                  status: e.target.checked ? "DONE" : "TODO",
                })
              }
            />
            <Input
              aria-label="Subtask title"
              defaultValue={s.title}
              disabled={!editable}
              onBlur={(e) => {
                if (e.target.value !== s.title)
                  void mutate(`/tasks/${s.id}`, "PATCH", {
                    title: e.target.value,
                  });
              }}
            />
            <Button
              variant="ghost"
              type="submit"
              className="size-8 shrink-0 p-0"
              aria-label="Open subtask"
              onClick={() => openTask(s.id)}
            >
              <Maximize2 size={13} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="size-8 shrink-0 p-0"
              aria-label="Delete subtask"
              disabled={!editable}
              onClick={() => open(`delete-task:${s.id}`)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
        {!task.parentTaskId && (
          <form
            className="flex items-center gap-2 [&>input]:min-w-0 [&>input]:flex-1"
            onSubmit={async (e) => {
              const form = e.currentTarget;
              const v = formValues(e);
              if (
                await mutate(`/projects/${task.projectId}/tasks`, "POST", {
                  title: v.title,
                  parentTaskId: task.id,
                })
              )
                form.reset();
            }}
          >
            <Input
              name="title"
              placeholder="New subtask"
              aria-label="New subtask"
              required
              disabled={!editable}
            />
            <Button variant="outline" type="submit" disabled={!editable}>
              Add
            </Button>
          </form>
        )}
      </section>
      <section>
        <nav className="mb-5 flex gap-5 overflow-x-auto border-b [&>button]:shrink-0 [&>button]:rounded-none [&>button]:border-0 [&>button]:border-b-2 [&>button]:border-transparent [&>button]:bg-transparent [&>button]:px-0 [&>button]:text-muted-foreground">
          <Button
            type="button"
            variant="outline"
            className={tab === "all" ? "!border-primary !text-foreground" : ""}
            onClick={() => setTab("all")}
          >
            All activity
          </Button>
          <Button
            variant="outline"
            type="submit"
            className={
              tab === "comments" ? "!border-primary !text-foreground" : ""
            }
            onClick={() => setTab("comments")}
          >
            Comments ({comments.length})
          </Button>
        </nav>
        {tab === "all" &&
          events.map((a) => (
            <p
              className="my-3 text-xs text-muted-foreground [&>small]:block"
              key={a.id}
            >
              {a.actor?.name ?? "Deleted user"} ·{" "}
              {a.action.replaceAll(".", " ")}
              <small>{new Date(a.createdAt).toLocaleString()}</small>
            </p>
          ))}
        {comments.map((c) => (
          <article
            className="flex gap-3 py-3 [&>div]:min-w-0 [&>div]:flex-1 [&_strong]:text-xs [&_small]:mb-2 [&_small]:block [&_small]:text-[10px] [&_small]:text-muted-foreground [&_p]:whitespace-pre-wrap [&_form]:space-y-2"
            key={c.id}
          >
            <Avatar user={c.author} />
            <div>
              <strong>{c.author.name}</strong>
              <small>
                {new Date(c.createdAt).toLocaleString()}
                {c.editedAt ? " · edited" : ""}
              </small>
              {c.author.id === me.id ? (
                <form
                  onSubmit={(e) => {
                    const v = formValues(e);
                    void mutate(`/comments/${c.id}`, "PATCH", v);
                  }}
                >
                  <Textarea
                    name="body"
                    aria-label="Edit own comment"
                    defaultValue={c.body}
                    disabled={!editable}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={!editable}
                    >
                      Save edit
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={!editable}
                      onClick={() => mutate(`/comments/${c.id}`, "DELETE")}
                    >
                      Delete
                    </Button>
                  </div>
                </form>
              ) : (
                <p>{c.body}</p>
              )}
            </div>
          </article>
        ))}
        <form
          onSubmit={async (e) => {
            const form = e.currentTarget;
            const v = formValues(e);
            if (await mutate(`/tasks/${task.id}/comments`, "POST", v))
              form.reset();
          }}
        >
          <Textarea
            name="body"
            placeholder="Write a comment…"
            aria-label="New comment"
            required
            disabled={!editable}
          />
          <Button
            type="submit"
            variant="default"
            className=""
            disabled={!editable}
          >
            Comment
          </Button>
        </form>
      </section>
      <footer className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          type="submit"
          disabled={!editable}
          onClick={() =>
            mutate(
              `/tasks/${task.id}/duplicate`,
              "POST",
              undefined,
              "Task duplicated",
            )
          }
        >
          Duplicate task
        </Button>
        <Button
          variant="ghost"
          type="submit"
          className="text-destructive"
          disabled={!editable}
          onClick={() => open(`delete-task:${task.id}`)}
        >
          Delete task…
        </Button>
      </footer>
    </div>
  );
}
