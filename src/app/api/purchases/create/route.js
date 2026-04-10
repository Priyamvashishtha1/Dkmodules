import { NextResponse } from "next/server";
import { recordPurchase } from "@/lib/services";

export async function POST(request) {
  try {
    const payload = await request.json();
    const result = await recordPurchase(payload);

    return NextResponse.json({
      message: "Purchase saved successfully.",
      wallet: result.wallet,
      purchase: result.purchase
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

