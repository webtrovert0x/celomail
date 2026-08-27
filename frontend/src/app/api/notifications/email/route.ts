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
      from: `"CeloMail Notifications" <${process.env.EMAIL_USER}>`,
      to: pref.email,
      subject: `New secure message from ${senderAlias || 'an unknown user'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ca8a04;">🟡 CeloMail Notification</h2>
          <p>You have received a new end-to-end encrypted message on CeloMail from <strong>${senderAlias || 'an unknown sender'}</strong>.</p>
          <p>Because CeloMail is fully decentralized and encrypted, we cannot show you the content of the message here.</p>
          <div style="margin: 30px 0;">
            <a href="https://cmail.com/dashboard" style="background-color: #eab308; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Unlock Message in App</a>
          </div>
          <p style="font-size: 12px; color: #888;">To stop receiving these emails, update your preferences in the CeloMail Settings menu.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, messageId: info.messageId }, { status: 200 });
  } catch (error: any) {
    console.error("Notification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
