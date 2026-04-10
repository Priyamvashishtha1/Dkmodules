import { NextResponse } from "next/server";
import { registerCustomer } from "@/lib/services";

export async function POST(request) {
  try {
    const payload = await request.json();
    const result = await registerCustomer(payload);

    return NextResponse.json({
      message: "Customer registered successfully.",
      customer: result.customer,
      wallet: result.wallet,
      purchase: result.purchase
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

