import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signSession } from "@/lib/session";

export async function POST(request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.BOOTH_PASSWORD || "12345";

    if (password !== correctPassword) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    // Set session expiry to 7 days
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const token = await signSession({ loggedIn: true, expiresAt });

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
      sameSite: "strict",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
