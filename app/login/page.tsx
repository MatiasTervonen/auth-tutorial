"use client";

import { useState } from "react";
import React from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/firebase";
import Spinner from "@/app/components/spinner";

export default function LoginPage() {
  const [activeForm, setActiveForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const getFriendlyError = (error: FirebaseError) => {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Incorrect email or password.";
      case "auth/user-not-found":
        return "No account found with this email.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/email-already-in-use":
        return "This email is already registered.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);

      const idToken = await auth.currentUser?.getIdToken();

      const res = await fetch("/api/log-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        throw new Error("Failed to log in");
      }

      router.push("/");
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(getFriendlyError(error));
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();

      const res = await fetch("/api/log-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        throw new Error("Failed to log in");
      }

      router.push("/");
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(getFriendlyError(error));
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen w-full px-2 bg-gradient-to-tr from-slate-950 via-slate-950 to-blue-900 max-w-3xl mx-auto">
      {/* form for login */}

      <div className="flex flex-col justify-center items-center w-full [perspective:800px]">
        <div
          className={`relative flex justify-center items-center max-w-md w-full transition-transform duration-700 [transform-style:preserve-3d]  ${
            activeForm ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          <form
            onSubmit={login}
            className="absolute border-2 border-gray-100 p-10 rounded-md w-full bg-slate-900 flex flex-col justify-center gap-5 [backface-visibility:hidden]"
          >
            <h2 className="text-gray-100 text-2xl text-center">Log in</h2>
            <label htmlFor="email" className="text-gray-100">
              Email
            </label>
            <input
              className="custom-login-input bg-slate-800 border-2 text-gray-100 border-gray-100 p-2 rounded-md hover:border-blue-500 focus:outline-none focus:border-green-300 placeholder-gray-400"
              placeholder="Email"
              type="text"
              id="email"
              name="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="password" className="text-gray-100">
              Password
            </label>
            <input
              className="custom-login-input bg-slate-800 border-2 text-gray-100 border-gray-100 p-2 rounded-md hover:border-blue-500 focus:outline-none focus:border-green-300 placeholder-gray-400"
              placeholder="Password"
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500">{error}</p>}
            <button
              className="flex justify-center items-center gap-2 bg-blue-500 text-white p-2 rounded mt-5 hover:bg-blue-600 hover:scale-105 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              type="submit"
              disabled={password.length === 0 || email.length === 0 || loading}
            >
              {loading ? "Logging in..." : "Log in"}
              {loading && <Spinner />}
            </button>
            {/* Toggle */}
            <p className="text-gray-400 text-center py-5">
              Don't have an account?
              <span
                className="text-blue-500 cursor-pointer ml-2"
                onClick={() => {
                  setActiveForm(!activeForm);
                  setError("");
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                }}
              >
                Sign Up
              </span>
            </p>
          </form>

          <form
            onSubmit={signup}
            className="absolute border-2 border-gray-100 p-10 rounded-md w-full bg-slate-900 flex flex-col justify-center gap-5 [backface-visibility:hidden] [transform:rotateY(180deg)]"
          >
            <h2 className="text-gray-100 text-2xl text-center">Sign up</h2>
            <label htmlFor="email-signUp" className="text-gray-100">
              Email
            </label>
            <input
              className="custom-login-input bg-slate-800 border-2 text-gray-100 border-gray-100 p-2 rounded-md hover:border-blue-500 focus:outline-none focus:border-green-300 placeholder-gray-400"
              placeholder="Email"
              type="text"
              id="email-signUp"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="password-signUp" className="text-gray-100">
              Password
            </label>
            <input
              className="custom-login-input bg-slate-800 border-2 text-gray-100 border-gray-100 p-2 rounded-md hover:border-blue-500 focus:outline-none focus:border-green-300 placeholder-gray-400"
              placeholder="Password"
              type="password"
              id="password-signUp"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="confirm-password" className="text-gray-100">
              Confirm Password
            </label>
            <input
              className="custom-login-input bg-slate-800 border-2 text-gray-100 border-gray-100 p-2 rounded-md hover:border-blue-500 focus:outline-none focus:border-green-300 placeholder-gray-400"
              placeholder="Confirm Password"
              type="password"
              id="confirm-password"
              name="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && <p className="text-red-500">{error}</p>}
            <button
              className="flex flex-col gap-2 bg-blue-500 text-white p-2 rounded mt-5 hover:bg-blue-600 hover:scale-105 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              type="submit"
              disabled={
                password.length === 0 ||
                email.length === 0 ||
                confirmPassword.length === 0 ||
                loading
              }
            >
              {loading ? "Signing up..." : "Sign up"}
              {loading && <Spinner />}
            </button>
            {/* Toggle */}
            <p className="text-gray-400 text-center py-5 ">
              Already have an account?
              <span
                className="text-blue-500 cursor-pointer ml-2"
                onClick={() => {
                  setActiveForm(!activeForm);
                  setError("");
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                }}
              >
                Login
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
