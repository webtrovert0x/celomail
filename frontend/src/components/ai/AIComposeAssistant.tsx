'use client';

import React, { useState } from 'react';
import { Sparkles, Wand2, RefreshCw, Check, Zap, Briefcase, Smile, Rocket, AlignLeft, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface AIComposeAssistantProps {
  currentSubject: string;
  currentBody: string;
  recipient: string;
  onApply: (subject: string, body: string) => void;
}

type ToneType = 'professional' | 'friendly' | 'degen' | 'concise' | 'formal' | 'persuasive';

const TONES: { id: ToneType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'professional', label: 'Professional', icon: <Briefcase className="w-3.5 h-3.5" />, desc: 'Crisp & structured' },
  { id: 'friendly', label: 'Friendly', icon: <Smile className="w-3.5 h-3.5" />, desc: 'Warm & welcoming' },
  { id: 'degen', label: 'Web3 Native', icon: <Rocket className="w-3.5 h-3.5" />, desc: 'gm, LFG, on-chain' },
  { id: 'concise', label: 'Ultra Concise', icon: <AlignLeft className="w-3.5 h-3.5" />, desc: 'Direct & bulleted' },
  { id: 'persuasive', label: 'Persuasive', icon: <Zap className="w-3.5 h-3.5" />, desc: 'Action-oriented' },
];

export function AIComposeAssistant({
  currentSubject,
  currentBody,
  recipient,
  onApply,
}: AIComposeAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedTone, setSelectedTone] = useState<ToneType>('professional');
  const [loading, setLoading] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<{ subject: string; body: string } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() && !currentBody.trim()) {
      toast.error('Please enter prompt instructions or have an existing draft');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compose',
          prompt: prompt.trim(),
          existingDraft: currentBody,
          tone: selectedTone,
          recipient,
        }),
      });

      const data = await res.json();
      if (res.ok && data.body) {
        setGeneratedDraft({
          subject: data.subject || currentSubject || 'Mailora Web3 Message',
          body: data.body,
        });
        toast.success('AI Draft generated!');
      } else {
        toast.error('Failed to generate draft');
      }
    } catch (e) {
      toast.error('Error contacting AI assistant');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedDraft) return;
    onApply(generatedDraft.subject, generatedDraft.body);
    setIsOpen(false);
    toast.success('Applied AI draft to composer!');
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-cyan-950/40 border border-emerald-500/20 mb-3 shadow-inner">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Mailora AI Smart Composer</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                Mailora AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Draft from prompts, polish tones, or generate instant replies
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-emerald-500/20 bg-slate-950/90 backdrop-blur-xl p-4 mb-4 space-y-4 overflow-hidden"
          >
            {/* Tone Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block flex items-center gap-1.5">
                <span>Select Desired Tone</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {TONES.map((tone) => {
                  const isSelected = selectedTone === tone.id;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setSelectedTone(tone.id)}
                      className={`flex flex-col items-center p-2.5 rounded-xl border text-xs transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/10'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                      }`}
                    >
                      <div className={`mb-1 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {tone.icon}
                      </div>
                      <span className="font-semibold">{tone.label}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">{tone.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                What would you like to write or rewrite?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Write a friendly proposal to sponsor our upcoming BotChain hackathon..."
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generated Output Preview */}
            {generatedDraft && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                  <span>Generated AI Draft Preview</span>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Insert into Compose
                  </button>
                </div>
                <div className="text-xs font-medium text-slate-200">
                  <strong>Subject:</strong> {generatedDraft.subject}
                </div>
                <div
                  className="text-xs text-slate-300 p-2.5 rounded-lg bg-black/40 max-h-36 overflow-y-auto leading-relaxed border border-white/5"
                  dangerouslySetInnerHTML={{ __html: generatedDraft.body }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
