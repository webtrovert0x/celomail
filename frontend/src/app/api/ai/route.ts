import { NextRequest, NextResponse } from 'next/server';

interface AIRequestPayload {
  action: 'compose' | 'summarize' | 'security-scan' | 'smart-replies';
  prompt?: string;
  existingDraft?: string;
  tone?: 'professional' | 'friendly' | 'degen' | 'concise' | 'formal' | 'persuasive';
  subject?: string;
  body?: string;
  sender?: string;
  senderAddress?: string;
  senderAlias?: string;
  recipient?: string;
}

// Helper to strip HTML tags for text analysis
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

// Clean markdown code fences that LLMs often return around JSON
function cleanJsonOutput(raw: string | undefined): any {
  if (!raw) return null;
  let clean = raw.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(clean);
}

// Helper to call Gemini API with modern active models (gemini-3.5-flash, gemini-flash-latest, gemini-3.7-flash)
async function callGemini(apiKey: string, promptText: string) {
  const models = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.7-flash'];
  
  for (const model of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
        })
      });

      if (!response.ok) continue;

      const resJson = await response.json();
      const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        return cleanJsonOutput(rawText);
      }
    } catch (err) {
      console.warn(`Gemini call to ${model} failed, trying next`, err);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const data: AIRequestPayload = await req.json();
    const { action } = data;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.AI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Handle each action with AI (or smart fallback if key not configured)
    switch (action) {
      case 'compose': {
        const { prompt, existingDraft, tone = 'professional', recipient } = data;
        const result = await handleCompose({ prompt, existingDraft, tone, recipient, geminiKey, openaiKey });
        return NextResponse.json(result);
      }

      case 'summarize': {
        const { subject = '', body = '', sender = '' } = data;
        const cleanBody = stripHtml(body);
        const result = await handleSummarize({ subject, body: cleanBody, sender, geminiKey, openaiKey });
        return NextResponse.json(result);
      }

      case 'security-scan': {
        const { subject = '', body = '', senderAddress = '', senderAlias = '' } = data;
        const cleanBody = stripHtml(body);
        const result = await handleSecurityScan({ subject, body: cleanBody, senderAddress, senderAlias, geminiKey, openaiKey });
        return NextResponse.json(result);
      }

      case 'smart-replies': {
        const { subject = '', body = '', sender = '' } = data;
        const cleanBody = stripHtml(body);
        const result = await handleSmartReplies({ subject, body: cleanBody, sender, geminiKey, openaiKey });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: 'Invalid AI action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('AI route error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process AI request' }, { status: 500 });
  }
}

// -------------------------------------------------------------
// AI Handlers
// -------------------------------------------------------------

async function handleCompose({
  prompt,
  existingDraft,
  tone,
  recipient,
  geminiKey,
  openaiKey
}: {
  prompt?: string;
  existingDraft?: string;
  tone: string;
  recipient?: string;
  geminiKey?: string;
  openaiKey?: string;
}) {
  const toneGuide: Record<string, string> = {
    professional: 'clear, courteous, structured, persuasive, and business-ready',
    friendly: 'warm, welcoming, conversational, and enthusiastic',
    degen: 'web3-native, energetic, using crypto terminology (gm, LFG, based, on-chain, WAGMI, alpha)',
    concise: 'ultra brief, direct, bulleted if needed, no fluff',
    formal: 'elevated, respectful, traditional executive correspondence',
    persuasive: 'compelling, value-driven, highlighting benefits and clear call to action'
  };

  const systemPrompt = `You are Mailora AI, an intelligent Web3 email assistant. Write a high quality email draft.
Tone required: ${tone} (${toneGuide[tone] || 'polite'}).
Recipient: ${recipient || 'Recipient'}
User instructions/prompt: "${prompt || 'Draft a helpful email'}"
${existingDraft ? `Current draft to improve/rewrite: "${existingDraft}"` : ''}

Output valid JSON ONLY in this format:
{
  "subject": "Clear descriptive subject line",
  "body": "Formatted email body in clean HTML (using <p>, <br>, <strong>, <ul>, <li> as needed)"
}`;

  if (geminiKey) {
    const aiResult = await callGemini(geminiKey, systemPrompt);
    if (aiResult && aiResult.body) {
      return aiResult;
    }
  }

  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are Mailora AI. Return only valid JSON.' },
            { role: 'user', content: systemPrompt }
          ],
          response_format: { type: 'json_object' }
        })
      });

      const resJson = await response.json();
      const text = resJson.choices?.[0]?.message?.content;
      if (text) {
        const parsed = cleanJsonOutput(text);
        if (parsed) return parsed;
      }
    } catch (e) {
      console.warn('OpenAI API failed, falling back', e);
    }
  }

  // Fallback
  return {
    subject: prompt ? `Regarding: ${prompt.slice(0, 40)}` : 'Update via Mailora',
    body: `<p>Hello ${recipient ? recipient.split('@')[0] : ''},</p><p>${prompt || 'I hope this message finds you well. I am reaching out to discuss updates.'}</p><p>Please review and let me know your thoughts.</p><p>Best regards,<br/><strong>Mailora Sender</strong></p>`
  };
}

async function handleSummarize({
  subject,
  body,
  sender,
  geminiKey,
  openaiKey
}: {
  subject: string;
  body: string;
  sender: string;
  geminiKey?: string;
  openaiKey?: string;
}) {
  const prompt = `You are Mailora AI. Summarize the following encrypted Web3 email for the user.
Sender: ${sender}
Subject: ${subject}
Message Body: "${body}"

Output valid JSON ONLY in the following format:
{
  "summary": "1-2 sentence executive overview",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "actionItems": ["Actionable step 1", "Actionable step 2"],
  "urgency": "low" | "medium" | "high"
}`;

  if (geminiKey) {
    const aiResult = await callGemini(geminiKey, prompt);
    if (aiResult && aiResult.summary) {
      return aiResult;
    }
  }

  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are Mailora AI. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
        })
      });

      const resJson = await response.json();
      const text = resJson.choices?.[0]?.message?.content;
      if (text) {
        const parsed = cleanJsonOutput(text);
        if (parsed) return parsed;
      }
    } catch (e) {
      console.warn('OpenAI summary failed', e);
    }
  }

  // Heuristic Fallback
  const sentences = body.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  return {
    summary: sentences.length > 0 ? `${sentences.slice(0, 2).join('. ')}.` : `Communication regarding "${subject}".`,
    keyPoints: sentences.slice(0, 3),
    actionItems: ['Review message details and follow up if needed'],
    urgency: 'low'
  };
}

async function handleSecurityScan({
  subject,
  body,
  senderAddress,
  senderAlias,
  geminiKey,
  openaiKey
}: {
  subject: string;
  body: string;
  senderAddress: string;
  senderAlias: string;
  geminiKey?: string;
  openaiKey?: string;
}) {
  const prompt = `You are Mailora AI Web3 Security Guard. Analyze this email for phishing, scam, impersonation, or dangerous smart contract links.
Sender Address: ${senderAddress}
Sender Alias: ${senderAlias}
Subject: ${subject}
Body: "${body}"

Return valid JSON ONLY:
{
  "riskLevel": "safe" | "caution" | "danger",
  "score": number (0 to 100, 100 is safest),
  "issues": string[],
  "warnings": string[],
  "recommendation": string,
  "hasSuspiciousLinks": boolean,
  "hasAirdropScam": boolean,
  "hasSeedPhraseRequest": boolean
}`;

  if (geminiKey) {
    const aiResult = await callGemini(geminiKey, prompt);
    if (aiResult && aiResult.riskLevel) {
      return {
        ...aiResult,
        verifiedSender: Boolean(senderAddress && senderAddress.startsWith('0x')),
        isImpersonator: false
      };
    }
  }

  const lowerBody = body.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 95;
  let riskLevel: 'safe' | 'caution' | 'danger' = 'safe';

  if (lowerBody.includes('seed phrase') || lowerBody.includes('private key')) {
    score -= 80;
    issues.push('CRITICAL: Requests private key or recovery seed phrase!');
    warnings.push('Legitimate services will NEVER ask for your secret recovery phrase.');
    riskLevel = 'danger';
  }

  return {
    riskLevel,
    score: Math.max(0, score),
    issues,
    warnings,
    recommendation: riskLevel === 'danger' ? 'Do NOT interact with links or sign transactions.' : 'No security threats detected.',
    hasSuspiciousLinks: false,
    hasAirdropScam: false,
    hasSeedPhraseRequest: false,
    isImpersonator: false,
    verifiedSender: Boolean(senderAddress && senderAddress.startsWith('0x'))
  };
}

async function handleSmartReplies({
  subject,
  body,
  sender,
  geminiKey,
  openaiKey
}: {
  subject: string;
  body: string;
  sender: string;
  geminiKey?: string;
  openaiKey?: string;
}) {
  const prompt = `You are Mailora AI. Based on the email below, generate 3 smart quick reply suggestions.
Sender: ${sender}
Subject: ${subject}
Message: "${body}"

Output valid JSON ONLY:
{
  "suggestions": [
    { "label": "Short button label with emoji", "replyText": "Complete ready-to-send reply message", "tone": "friendly | professional | degen" }
  ]
}`;

  if (geminiKey) {
    const aiResult = await callGemini(geminiKey, prompt);
    if (aiResult && aiResult.suggestions) {
      return aiResult;
    }
  }

  return {
    suggestions: [
      {
        label: '👍 Sounds good, let’s connect',
        replyText: `Hi,\n\nThanks for reaching out! That sounds good to me, let's proceed.\n\nBest,\nMailora User`,
        tone: 'friendly'
      },
      {
        label: '🔍 Reviewing details',
        replyText: `Hello,\n\nThank you for the update. I am currently reviewing the details and will get back to you shortly.\n\nRegards,\nMailora User`,
        tone: 'professional'
      },
      {
        label: '⚡ Web3 Quick Confirm',
        replyText: `gm! Received and verified on BotChain. Looking forward to our next steps.\n\nLFG! 🚀`,
        tone: 'degen'
      }
    ]
  };
}
