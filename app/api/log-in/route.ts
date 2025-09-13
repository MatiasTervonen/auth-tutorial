import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const res = NextResponse.json({ message: "Logged in" });

    res.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: expiresIn / 1000,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Error creating session cookie", error);
    return NextResponse.json(
      { error: "Unknown server error" },
      { status: 500 }
    );
  }
}
