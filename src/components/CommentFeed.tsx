"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Comment = {
  id: string;
  display_name: string;
  body: string;
  created_at: string;
};

export function CommentFeed() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      setLoaded(true);
      return;
    }
    let mounted = true;

    client
      .from("comments")
      .select("id, display_name, body, created_at")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!mounted) return;
        if (data) setComments(data);
        setLoaded(true);
      });

    const channel = client
      .channel("comments-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload) => {
          const row = payload.new as Comment;
          setComments((prev) => [row, ...prev].slice(0, 100));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      client.removeChannel(channel);
    };
  }, []);

  if (loaded && comments.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No comments yet — be the first.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-5">
      {comments.map((c) => (
        <li key={c.id} className="flex flex-col gap-1">
          <div className="text-xs text-zinc-500">
            <span className="text-zinc-300">{c.display_name}</span>
            <span aria-hidden> · </span>
            <time dateTime={c.created_at}>{formatRelative(c.created_at)}</time>
          </div>
          <p className="whitespace-pre-wrap text-sm text-zinc-200">{c.body}</p>
        </li>
      ))}
    </ul>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
