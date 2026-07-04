"use client";

import { useState, useTransition } from "react";
import { postComment } from "@/lib/actions/comments";
import type { TicketComment, UserRole } from "@/lib/db-types";
import { Send, Loader2, Lock } from "lucide-react";

interface Props {
  ticketId: string;
  currentUserRole: UserRole;
  currentUserId: string;
  comments: TicketComment[];
  actors: Record<string, string>;   // author_id -> full_name
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-SG", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export function CommentsThread({ ticketId, currentUserRole, currentUserId, comments, actors }: Props) {
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canPostInternal = currentUserRole === "admin" || currentUserRole === "technician";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await postComment(ticketId, body, isInternal && canPostInternal);
      if (res.error) {
        setError(res.error);
      } else {
        setBody("");
        setIsInternal(false);
      }
    });
  }

  return (
    <div className="space-y-3">
      {comments.length === 0 ? (
        <p className="text-sm text-slate-500">No comments yet.</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li
              key={c.id}
              className={
                c.is_internal
                  ? "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
                  : "rounded-lg border border-slate-200 bg-white px-3 py-2"
              }
            >
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-medium text-slate-700">
                  {actors[c.author_id] ?? "Unknown"}
                  {c.author_id === currentUserId && <span className="text-slate-400"> (you)</span>}
                </span>
                <span className="flex items-center gap-1">
                  {c.is_internal && (
                    <span className="inline-flex items-center gap-0.5 text-amber-700">
                      <Lock className="w-3 h-3" />
                      internal
                    </span>
                  )}
                  <span>{fmt(c.created_at)}</span>
                </span>
              </div>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="space-y-2 pt-2 border-t border-slate-200">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Write a comment…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <div className="flex items-center justify-between gap-2">
          {canPostInternal ? (
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              Internal (hidden from requester)
            </label>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-60"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </div>
  );
}
