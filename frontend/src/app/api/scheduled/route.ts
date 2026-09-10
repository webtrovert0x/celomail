import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ScheduledMessage from '@/models/ScheduledMessage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('owner');

    if (!ownerAddress) {
      return NextResponse.json({ error: 'Missing owner address' }, { status: 400 });
    }

    await connectToDatabase();

    const scheduled = await ScheduledMessage.find({
      ownerAddress: ownerAddress.toLowerCase(),
      status: 'pending'
    }).sort({ sendAt: 1 });

    return NextResponse.json({ scheduled }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ownerAddress, recipients, subject, content, paymentAmount, attachmentCID, sendAt } = await request.json();

    if (!ownerAddress || !recipients || !recipients.length || !content || !sendAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const scheduled = await ScheduledMessage.create({
      ownerAddress: ownerAddress.toLowerCase(),
      recipients,
      subject: subject || '',
      content,
      paymentAmount: paymentAmount || '',
      attachmentCID: attachmentCID || '',
      sendAt: new Date(sendAt),
      status: 'pending'
    });

    return NextResponse.json({ success: true, scheduled }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ownerAddress = searchParams.get('owner');

    if (!id || !ownerAddress) {
      return NextResponse.json({ error: 'Missing id or owner address' }, { status: 400 });
    }

    await connectToDatabase();

    await ScheduledMessage.deleteOne({
      _id: id,
      ownerAddress: ownerAddress.toLowerCase()
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
