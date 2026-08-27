import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Archive from '@/models/Archive';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('owner');

    if (!ownerAddress) {
      return NextResponse.json({ error: 'Missing owner address' }, { status: 400 });
    }

    await connectToDatabase();
    
    const archive = await Archive.findOne({ ownerAddress: ownerAddress.toLowerCase() });
    const cids = archive ? archive.cids : [];
    
    return NextResponse.json({ cids }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching archive:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ownerAddress, cid } = await request.json();

    if (!ownerAddress || !cid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // Find or create
    let archive = await Archive.findOne({ ownerAddress: ownerAddress.toLowerCase() });
    
    if (!archive) {
      archive = await Archive.create({
        ownerAddress: ownerAddress.toLowerCase(),
        cids: [cid]
      });
    } else {
      if (!archive.cids.includes(cid)) {
        archive.cids.push(cid);
        await archive.save();
      }
    }

    return NextResponse.json({ success: true, cids: archive.cids }, { status: 200 });
  } catch (error: any) {
    console.error('Error adding to archive:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('owner');
    const cid = searchParams.get('cid');

    if (!ownerAddress || !cid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();
    
    const archive = await Archive.findOne({ ownerAddress: ownerAddress.toLowerCase() });
    if (archive) {
      archive.cids = archive.cids.filter((c: string) => c !== cid);
      await archive.save();
      return NextResponse.json({ success: true, cids: archive.cids }, { status: 200 });
    }

    return NextResponse.json({ success: true, cids: [] }, { status: 200 });
  } catch (error: any) {
    console.error('Error unarchiving:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
