"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";

export default function SignOutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/sign-out", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    await signOut(auth);

    router.push("/login");
  };

  return (
    <button
      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 hover:scale-105"
      onClick={handleLogout}
    >
      Log out
    </button>
  );
}
