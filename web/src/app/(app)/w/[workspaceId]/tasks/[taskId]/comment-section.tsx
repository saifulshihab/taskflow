"use client";

import { useActionState, useEffect, useState } from "react";
import { FormError, SubmitButton } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  createCommentAction,
  deleteCommentAction,
  updateCommentAction,
} from "@/lib/actions/comments";
import type { Comment } from "@/lib/api-types";
import type { FormState } from "@/lib/form-state";
import { fromNow } from "@/lib/format";

export function CommentSection({
  workspaceId,
  taskId,
  comments,
  canPost,
  canModerate,
  currentUserId,
  onMutate,
}: {
  workspaceId: string;
  taskId: string;
  comments: Comment[];
  canPost: boolean;
  canModerate: boolean;
  currentUserId: string;
  onMutate?: () => void;
}) {
  const [state, action] = useActionState<FormState, FormData>(
    createCommentAction,
    {},
  );

  useEffect(() => {
    if (state.ok) onMutate?.();
  }, [state.ok, onMutate]);

  return (
    <section className="rounded-xl border p-4">
      <h2 className="mb-3 text-sm font-medium">Comments</h2>

      <ul className="mb-4 space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            workspaceId={workspaceId}
            taskId={taskId}
            currentUserId={currentUserId}
            canModerate={canModerate}
            onMutate={onMutate}
          />
        ))}
      </ul>

      {canPost && (
        <form action={action} className="space-y-2">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="taskId" value={taskId} />
          <FormError message={state.error} />
          <Textarea name="body" rows={3} placeholder="Write a comment…" required />
          <SubmitButton pendingText="Posting...">
            Post comment
          </SubmitButton>
        </form>
      )}
    </section>
  );
}

function CommentItem({
  comment,
  workspaceId,
  taskId,
  currentUserId,
  canModerate,
  onMutate,
}: {
  comment: Comment;
  workspaceId: string;
  taskId: string;
  currentUserId: string;
  canModerate: boolean;
  onMutate?: () => void;
}) {
  const canDelete = comment.author.id === currentUserId || canModerate;
  const [editing, setEditing] = useState(false);
  const [, action] = useActionState<FormState, FormData>(
    async (previousState, formData) => {
      const result = await updateCommentAction(previousState, formData);
      if (result.ok) {
        setEditing(false);
        onMutate?.();
      }
      return result;
    },
    {},
  );

  const onDelete = () => {
    const formData = new FormData();
    formData.set("workspaceId", workspaceId);
    formData.set("taskId", taskId);
    formData.set("commentId", comment.id);
    void deleteCommentAction(formData).then((result) => {
      if (result.ok) onMutate?.();
    });
  };

  return (
    <li className="text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{comment.author.name}</span>
        <span className="text-muted-foreground text-xs">
          {fromNow(comment.createdAt)}
          {comment.editedAt ? " · edited" : ""}
        </span>
      </div>
      {editing ? (
        <form action={action} className="mt-2 space-y-2">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="taskId" value={taskId} />
          <input type="hidden" name="commentId" value={comment.id} />
          <Textarea name="body" rows={3} defaultValue={comment.body} required />
          <div className="flex gap-2">
            <SubmitButton>Save</SubmitButton>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-1 whitespace-pre-wrap">{comment.body}</p>
      )}
      {!editing && (comment.author.id === currentUserId || canDelete) && (
        <div className="mt-2 flex gap-2">
          {comment.author.id === currentUserId && (
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          )}
          {canDelete && (
            <Button type="button" size="xs" variant="ghost" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
