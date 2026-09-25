"use client";

import React, { useMemo, useState } from "react";
import { useProject, newId } from "@/lib/store";
import { Avatar, fmtDay } from "./ui";
import type { Comment } from "@/lib/model/types";

/**
 * Discussion sits against the thing being discussed.
 *
 * Comments hang off an idea, an option, a decision or a scope item — never in a
 * separate chat screen where the context is lost. Replies nest one level, which
 * is as deep as a conversation about a light fitting ever needs to go.
 */
export function Comments({
  targetType, targetId, compact, placeholder,
}: {
  targetType: Comment["targetType"];
  targetId: string;
  compact?: boolean;
  placeholder?: string;
}) {
  const { state, dispatch, me } = useProject();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const all = useMemo(
    () => state.comments.filter((c) => c.targetType === targetType && c.targetId === targetId),
    [state.comments, targetType, targetId],
  );
  const roots = all.filter((c) => !c.parentId);
  const repliesOf = (id: string) => all.filter((c) => c.parentId === id);

  const post = (parentId?: string) => {
    if (!text.trim()) return;
    const mentions = Array.from(text.matchAll(/@([A-Za-z]+)/g)).map((m) => m[1]);
    dispatch({
      type: "comment/add",
      comment: {
        id: newId("c"), targetType, targetId, author: me, body: text.trim(),
        createdAt: new Date().toISOString(), mentions, parentId,
      },
    });
    setText("");
    setReplyTo(null);
  };

  const react = (id: string, emoji: string) => dispatch({ type: "comment/react", id, emoji, by: me });

  return (
    <div className={compact ? "" : "mt-1"}>
      {roots.length > 0 && (
        <div className="space-y-3 mb-3">
          {roots.map((c) => (
            <div key={c.id}>
              <Bubble c={c} onReact={react} onReply={() => setReplyTo(c.id)} />
              {repliesOf(c.id).length > 0 && (
                <div className="ml-8 mt-2.5 space-y-2.5 border-l border-line pl-3.5">
                  {repliesOf(c.id).map((r) => <Bubble key={r.id} c={r} onReact={react} />)}
                </div>
              )}
              {replyTo === c.id && (
                <div className="ml-8 mt-2.5">
                  <Composer
                    value={text} onChange={setText} onPost={() => post(c.id)}
                    onCancel={() => { setReplyTo(null); setText(""); }}
                    placeholder={`Reply to ${c.author.split(" ")[0]}…`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {replyTo === null && (
        <Composer
          value={text} onChange={setText} onPost={() => post()}
          placeholder={placeholder ?? "Add a comment — use @ to mention someone"}
        />
      )}
    </div>
  );
}

function Bubble({
  c, onReact, onReply,
}: { c: Comment; onReact: (id: string, e: string) => void; onReply?: () => void }) {
  const { state, me } = useProject();
  const person = state.people.find((p) => p.name === c.author);
  const body = c.body.split(/(@[A-Za-z]+)/g);
  return (
    <div className="flex items-start gap-2.5 group">
      <Avatar name={c.author} tone={person?.avatarTone} size={26} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[13.5px] font-medium">{c.author}</span>
          {person?.firm && <span className="text-[12.5px] text-ink-3">{person.firm}</span>}
          <span className="text-[12.5px] text-ink-3">{fmtDay(c.createdAt)}</span>
        </div>
        <div className="text-[14px] text-ink-2 leading-relaxed mt-0.5 whitespace-pre-wrap">
          {body.map((part, i) =>
            part.startsWith("@") ? (
              <span key={i} className="text-accent font-medium">{part}</span>
            ) : (
              <React.Fragment key={i}>{part}</React.Fragment>
            ),
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          {Object.entries(c.reactions ?? {}).map(([e, who]) => (
            <button
              key={e}
              onClick={() => onReact(c.id, e)}
              title={who.join(", ")}
              className="chip"
              style={{
                background: who.includes(me) ? "var(--color-accent-soft)" : "var(--color-paper-2)",
                color: "var(--color-ink-2)", fontSize: 12.5,
              }}
            >
              {e} <span className="tnum">{who.length}</span>
            </button>
          ))}
          <div className="[@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1">
            {["👍", "❤️", "🤔"].map((e) => (
              <button key={e} onClick={() => onReact(c.id, e)} className="text-[14px] px-1 rounded hover:bg-paper-2" aria-label={`React ${e}`}>
                {e}
              </button>
            ))}
            {onReply && (
              <button onClick={onReply} className="text-[12.5px] text-ink-3 px-1.5 rounded hover:bg-paper-2">Reply</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Composer({
  value, onChange, onPost, onCancel, placeholder,
}: { value: string; onChange: (s: string) => void; onPost: () => void; onCancel?: () => void; placeholder: string }) {
  return (
    <div className="flex items-end gap-2">
      <textarea
        className="input resize-y min-h-[40px] py-2"
        rows={1}
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onPost(); }
        }}
        placeholder={placeholder}
      />
      {onCancel && <button className="btn btn-sm" onClick={onCancel}>Cancel</button>}
      <button className="btn btn-sm btn-primary" onClick={onPost} disabled={!value.trim()} title="Post (Ctrl+Enter)">Post</button>
    </div>
  );
}
