import { NextResponse } from "next/server";
import { redeemCustomerPoints } from "@/lib/services";

export async function POST(request) {
  try {
    const payload = await request.json();
    const result = await redeemCustomerPoints(payload);

    return NextResponse.json({
      message: "Points redeemed successfully.",
      wallet: result.wallet
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

