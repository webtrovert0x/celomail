import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import connectToDatabase from '@/lib/mongodb';
import UserPreferences from '@/models/UserPreferences';

// We'll initialize nodemailer only if the SMTP credentials exist
const transporter = (process.env.EMAIL_USER && process.env.EMAIL_PASS) 
  ? nodemailer.createTransport({
      service: 'gmail', // You can change this if using another SMTP provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

export async function POST(request: Request) {
  try {
    const { recipientAddress, senderAlias } = await request.json();

    if (!recipientAddress) {
      return NextResponse.json({ error: 'Missing recipient address' }, { status: 400 });
    }

    await connectToDatabase();

    const pref = await UserPreferences.findOne({ ownerAddress: recipientAddress.toLowerCase() });
    
    // If user has no email configured, we just silently return success
    if (!pref || !pref.email) {
      return NextResponse.json({ success: true, message: 'User has not opted in to emails' }, { status: 200 });
    }

    if (!transporter) {
       console.warn("EMAIL_USER or EMAIL_PASS is missing. Mocking email send to:", pref.email);
       return NextResponse.json({ success: true, message: 'Mocked email sent (No SMTP credentials)' }, { status: 200 });
    }

    const info = await transporter.sendMail({
      from: `"Mailora Notifications" <${process.env.EMAIL_USER}>`,
      to: pref.email,
      subject: `New secure Web3 message from ${senderAlias || 'an on-chain sender'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #06090e; color: #f1f5f9; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;">
          <h2 style="color: #10b981; margin-top: 0;">✦ Mailora Notification</h2>
          <p>You have received a new end-to-end encrypted message on BotChain from <strong>${senderAlias || 'an on-chain contact'}</strong>.</p>
          <p style="color: #94a3b8;">Because Mailora messages are zero-knowledge encrypted and pinned to IPFS, only your connected wallet can decrypt and unlock the contents.</p>
          <div style="margin: 28px 0;">
            <a href="http://localhost:3000/dashboard" style="background: #10b981; color: #06090e; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">Open Mailora Dashboard</a>
          </div>
          <p style="font-size: 12px; color: #64748b;">To stop receiving notifications, update your settings in the Mailora dashboard.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, messageId: info.messageId }, { status: 200 });
  } catch (error: any) {
    console.error("Notification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
