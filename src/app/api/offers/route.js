import { NextResponse } from "next/server";
import { createOffer, listOffers } from "@/lib/services";

export async function GET() {
  try {
    const offers = await listOffers();
    return NextResponse.json(offers);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const offer = await createOffer(payload);

    return NextResponse.json({
      message: "Offer created successfully.",
      offer
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

