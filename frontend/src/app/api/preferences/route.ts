import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import UserPreferences from '@/models/UserPreferences';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('owner');

    if (!ownerAddress) {
      return NextResponse.json({ error: 'Missing owner address' }, { status: 400 });
    }

    await connectToDatabase();
    
    const pref = await UserPreferences.findOne({ ownerAddress: ownerAddress.toLowerCase() });
    return NextResponse.json({ email: pref ? pref.email : null }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ownerAddress, email } = await request.json();

    if (!ownerAddress || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const pref = await UserPreferences.findOneAndUpdate(
      { ownerAddress: ownerAddress.toLowerCase() },
      { email },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, pref }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
