import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import SnoozedMessage from '@/models/SnoozedMessage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('owner');

    if (!ownerAddress) {
      return NextResponse.json({ error: 'Missing owner address' }, { status: 400 });
    }

    await connectToDatabase();

    // Get active snoozes where snoozeUntil is in the future
    const now = new Date();
    const snoozed = await SnoozedMessage.find({
      ownerAddress: ownerAddress.toLowerCase(),
      snoozeUntil: { $gt: now }
    });

    return NextResponse.json({ snoozed }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ownerAddress, cid, snoozeUntil } = await request.json();

    if (!ownerAddress || !cid || !snoozeUntil) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const snoozed = await SnoozedMessage.findOneAndUpdate(
      { ownerAddress: ownerAddress.toLowerCase(), cid },
      { snoozeUntil: new Date(snoozeUntil) },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, snoozed }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('owner');
    const cid = searchParams.get('cid');

    if (!ownerAddress || !cid) {
      return NextResponse.json({ error: 'Missing owner address or cid' }, { status: 400 });
    }

    await connectToDatabase();

    await SnoozedMessage.deleteOne({
      ownerAddress: ownerAddress.toLowerCase(),
      cid
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
