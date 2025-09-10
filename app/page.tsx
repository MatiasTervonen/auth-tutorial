"use client";

import SignOutButton from "./components/signOutButton";
import { useAuth } from "./components/authContext";

export default function Home() {
  const { user } = useAuth();

  console.log("User in Home:", user);

  return (
    <div className="flex flex-col justify-center items-center h-screen w-full px-2 bg-gradient-to-tr from-slate-950 via-slate-950 to-blue-900 max-w-3xl mx-auto">
      <h1 className="text-gray-100 text-2xl">Welcome</h1>
      <p className="text-gray-100 text-2xl pt-3">{user?.email}</p>
      <SignOutButton />
    </div>
  );
}
