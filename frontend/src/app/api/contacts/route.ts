import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('owner');

    if (!ownerAddress) {
      return NextResponse.json({ error: 'Missing owner address' }, { status: 400 });
    }

    await connectToDatabase();
    
    const contacts = await Contact.find({ ownerAddress: ownerAddress.toLowerCase() }).sort({ addedAt: -1 });
    return NextResponse.json({ contacts }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ownerAddress, alias, contactAddress } = await request.json();

    if (!ownerAddress || !alias || !contactAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if it already exists
    const existing = await Contact.findOne({ ownerAddress: ownerAddress.toLowerCase(), alias: alias.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Contact already exists in your address book' }, { status: 400 });
    }

    const newContact = await Contact.create({
      ownerAddress: ownerAddress.toLowerCase(),
      alias: alias.toLowerCase(),
      contactAddress: contactAddress.toLowerCase()
    });

    return NextResponse.json({ contact: newContact }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding contact:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('owner');
    const alias = searchParams.get('alias');

    if (!ownerAddress || !alias) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();
    
    await Contact.findOneAndDelete({ 
      ownerAddress: ownerAddress.toLowerCase(), 
      alias: alias.toLowerCase() 
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
