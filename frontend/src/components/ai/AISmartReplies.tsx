'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Reply, ArrowRight } from 'lucide-react';

interface AISmartRepliesProps {
  subject: string;
  body: string;
  sender: string;
  onSelectReply: (replyText: string) => void;
}

interface ReplySuggestion {
  label: string;
  replyText: string;
  tone: string;
}

export function AISmartReplies({
  subject,
  body,
  sender,
  onSelectReply,
}: AISmartRepliesProps) {
  const [replies, setReplies] = useState<ReplySuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadReplies() {
      if (!body && !subject) return;
      setLoading(true);
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'smart-replies',
            subject,
            body,
            sender,
          }),
        });

        const data = await res.json();
        if (!isCancelled && res.ok && data.suggestions) {
          setReplies(data.suggestions);
        }
      } catch (e) {
        console.error('Failed to load smart replies', e);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadReplies();
    return () => {
      isCancelled = true;
    };
  }, [subject, body, sender]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
        <span>Generating AI smart replies...</span>
      </div>
    );
  }

  if (!replies || replies.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span>AI Smart Quick Replies</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {replies.map((reply, i) => (
          <button
            key={i}
            onClick={() => onSelectReply(reply.replyText)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-xs text-slate-300 hover:text-emerald-300 transition-all group"
          >
            <span>{reply.label}</span>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
}
