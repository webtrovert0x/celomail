'use client';

import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Sparkles, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AISecurityBannerProps {
  subject: string;
  body: string;
  senderAddress: string;
  senderAlias?: string;
}

interface SecurityAnalysis {
  riskLevel: 'safe' | 'caution' | 'danger';
  score: number;
  issues: string[];
  warnings: string[];
  recommendation: string;
  hasSuspiciousLinks: boolean;
  hasAirdropScam: boolean;
  hasSeedPhraseRequest: boolean;
  verifiedSender: boolean;
}

export function AISecurityBanner({
  subject,
  body,
  senderAddress,
  senderAlias,
}: AISecurityBannerProps) {
  const [analysis, setAnalysis] = useState<SecurityAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function runScan() {
      setLoading(true);
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'security-scan',
            subject,
            body,
            senderAddress,
            senderAlias,
          }),
        });
        const data = await res.json();
        if (!isCancelled && res.ok) {
          setAnalysis(data);
        }
      } catch (err) {
        console.error('Failed to run AI security scan', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    if (body || subject) {
      runScan();
    }

    return () => {
      isCancelled = true;
    };
  }, [subject, body, senderAddress, senderAlias]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md text-xs text-slate-400">
        <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
        <span>Mailora AI Guard: Scanning message for phishing, scam contracts & risk vectors...</span>
      </div>
    );
  }

  if (!analysis) return null;

  const isSafe = analysis.riskLevel === 'safe';
  const isCaution = analysis.riskLevel === 'caution';
  const isDanger = analysis.riskLevel === 'danger';

  const badgeColor = isDanger
    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
    : isCaution
    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';

  const icon = isDanger ? (
    <ShieldAlert className="w-5 h-5 text-rose-400" />
  ) : isCaution ? (
    <AlertTriangle className="w-5 h-5 text-amber-400" />
  ) : (
    <ShieldCheck className="w-5 h-5 text-emerald-400" />
  );

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${badgeColor}`}>
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs tracking-wide uppercase">
                {isDanger ? 'Threat Detected' : isCaution ? 'Security Warning' : 'AI Security Shield'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-mono">
                Trust Score: {analysis.score}/100
              </span>
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {analysis.recommendation}
            </p>
          </div>
        </div>
        <button className="p-1 rounded-lg hover:bg-white/10 transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 px-4 py-3 bg-black/20 text-xs space-y-2"
          >
            {analysis.issues.length > 0 && (
              <div>
                <span className="font-bold text-slate-300">Flagged Issues:</span>
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-300">
                  {analysis.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.warnings.length > 0 && (
              <div>
                <span className="font-bold text-slate-300">Safety Precautions:</span>
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-400">
                  {analysis.warnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-white/5">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                End-to-End Encrypted via IPFS & BotChain
              </span>
              <span>Network: BOT Chain Mainnet (677)</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
