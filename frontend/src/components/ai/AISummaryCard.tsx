'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Clock, ListChecks } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AISummaryCardProps {
  subject: string;
  body: string;
  sender: string;
}

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  urgency: 'low' | 'medium' | 'high';
}

export function AISummaryCard({ subject, body, sender }: AISummaryCardProps) {
  const [summaryData, setSummaryData] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchSummary = async () => {
    if (summaryData) {
      setIsOpen(!isOpen);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summarize',
          subject,
          body,
          sender,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSummaryData(data);
        setIsOpen(true);
      }
    } catch (err) {
      console.error('Failed to summarize email', err);
    } finally {
      setLoading(false);
    }
  };

  const urgencyColors = {
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-lg transition-all">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={fetchSummary}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-white">AI Quick Summary & Actions</span>
              {summaryData && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${urgencyColors[summaryData.urgency || 'low']}`}>
                  {summaryData.urgency} Urgency
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {summaryData ? 'Click to collapse summary' : 'Generate executive recap & key action items'}
            </p>
          </div>
        </div>

        <button className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5 border border-white/5">
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              Thinking...
            </span>
          ) : isOpen ? (
            <>
              Hide <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              Summarize <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && summaryData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 px-4 py-4 space-y-3 bg-black/30"
          >
            {/* Executive Summary */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3 h-3" /> Executive Overview
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {summaryData.summary}
              </p>
            </div>

            {/* Action Items */}
            {summaryData.actionItems && summaryData.actionItems.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5" /> Action Items & Next Steps
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {summaryData.actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-300 p-2 rounded-lg bg-white/[0.02] border border-white/5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Points */}
            {summaryData.keyPoints && summaryData.keyPoints.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Key Highlights
                </span>
                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                  {summaryData.keyPoints.map((pt, idx) => (
                    <li key={idx}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
