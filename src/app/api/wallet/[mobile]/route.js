import { NextResponse } from "next/server";
import { getWalletByMobile } from "@/lib/services";

export async function GET(_request, { params }) {
  try {
    const { mobile } = await params;
    const wallet = await getWalletByMobile(mobile);

    if (!wallet) {
      return NextResponse.json({ error: "Customer wallet not found." }, { status: 404 });
    }

    return NextResponse.json(wallet);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

