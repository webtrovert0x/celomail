import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const update = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json({ ok: true });
    }

    if (update?.message) {
      const chatId = update.message.chat?.id;
      const text = update.message.text || '';
      const firstName = update.message.from?.first_name || 'there';

      if (text.startsWith('/start') || text.startsWith('/help')) {
        const welcomeMessage = 
          `👋 <b>Welcome to Mailora Alerts, ${firstName}!</b>\n\n` +
          `Your Telegram Chat ID is:\n<code>${chatId}</code>\n\n` +
          `📋 <b>How to activate notifications:</b>\n` +
          `1. Copy the Chat ID above: <code>${chatId}</code>\n` +
          `2. Go to your <a href="https://mailora.app/dashboard">Mailora Dashboard</a>\n` +
          `3. Open <b>Settings</b> ⚙️ and paste this ID into the <b>Telegram Instant Alert Bot</b> field.\n` +
          `4. Click <b>Save Preferences</b>.\n\n` +
          `🔐 Whenever someone sends an encrypted message or native BOT token to your @mailora handle, you'll receive an instant push alert here!`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeMessage,
            parse_mode: 'HTML',
            disable_web_page_preview: true
          })
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error.message);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Mailora Telegram Webhook Active" });
}
