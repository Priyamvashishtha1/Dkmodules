import { NextResponse } from "next/server";
import { sendOfferCampaign } from "@/lib/services";

export async function POST(request) {
  try {
    const { message } = await request.json();
    const result = await sendOfferCampaign(message);

    return NextResponse.json({
      message: "Campaign processed.",
      ...result
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

