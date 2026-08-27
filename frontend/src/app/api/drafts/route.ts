import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Draft from '@/models/Draft';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('owner');

    if (!ownerAddress) {
      return NextResponse.json({ error: 'Missing owner address' }, { status: 400 });
    }

    await connectToDatabase();
    
    const draft = await Draft.findOne({ ownerAddress: ownerAddress.toLowerCase() });
    return NextResponse.json({ draft }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ownerAddress, toAlias, content } = await request.json();

    if (!ownerAddress) {
      return NextResponse.json({ error: 'Missing owner address' }, { status: 400 });
    }

    await connectToDatabase();

    const draft = await Draft.findOneAndUpdate(
      { ownerAddress: ownerAddress.toLowerCase() },
      { toAlias, content, lastUpdated: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, draft }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('owner');

    if (!ownerAddress) {
      return NextResponse.json({ error: 'Missing owner address' }, { status: 400 });
    }

    await connectToDatabase();
    await Draft.deleteOne({ ownerAddress: ownerAddress.toLowerCase() });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
