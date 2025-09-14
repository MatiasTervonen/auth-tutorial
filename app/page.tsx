"use client";

import SignOutButton from "./components/signOutButton";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[100dvh] w-full px-2 bg-gradient-to-tr from-slate-950 via-slate-950 to-blue-900 max-w-3xl mx-auto">
      <h1 className="text-gray-100 text-2xl">Welcome</h1>

      <SignOutButton />
    </div>
  );
}
