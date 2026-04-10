import { NextResponse } from "next/server";
import { loginAdmin } from "@/lib/services";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const { admin, token } = await loginAdmin(email, password);

    return NextResponse.json({
      message: "Login successful.",
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        name: admin.name
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
