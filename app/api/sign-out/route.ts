import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/auth";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const res = NextResponse.json({ message: "Logged out" });

  res.cookies.set("session", "", {
    httpOnly: true,
    secure: true,
    expires: new Date(0),
    path: "/",
  });

  return res;
}
