## Authentication with Next.js and Firebase + reCAPTCHA

**Overview**

A simple authentication flow using Next.js, Firebase Authentication, and Google reCAPTCHA for bot protection.
The app fetches an idToken on the client side, exchanges it on a Next.js API route, and creates a secure Firebase Session Cookie for server-side validation.

## Live Demo

🌐 [Web App (Vercel)](https://auth-tutorial-16oa.vercel.app/)

- Create a **test account** to explore the signup and login flow.
- Since this is only a demo project, **don’t use your real email or password** — use a disposable account (e.g., Mailinator, Temp Mail).
- You’ll need to **verify your email** before logging in.

**Setup**

- Create firebase project and enable Authetication
- Add Firebase client and admin connections to your Next.js app.
- On Google cloud add reCAPTCHA to your project and configure keys in your env.local.

<pre>
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_API_KEY=your_secret_key
</pre>

## Admin SDK (server side only)

<pre> 
//firebase-admin.ts
import * as admin from "firebase-admin";


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_SERVICE_ROLE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = admin.auth();

 </pre>

## Client SDK

<pre>
//firebase-client.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);

export { auth, app };
 </pre>

## Api route for Session token validation

- Receives the idToken from the frontend after login.
- Exchanges it for a secure Firebase Session Cookie (stored as httpOnly).
- Sets an expiration time (e.g. 5 days).
- This cookie is later verified on the server (getCurrentUser).
- This is what upgrades a temporary Firebase idToken into a persistent, server-trusted session.

<pre>

//api/log-in
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
    console.error("Error verifying reCAPTCHA:", error);
    return NextResponse.json(
      { error: "Unknown server error" },
      { status: 500 }
    );
  }
}
</pre>

## Api route for reCAPTCHA validation

- Receives a recaptchaToken and action from the frontend.
- Sends them to Google reCAPTCHA Enterprise for verification.
- Rejects invalid, mismatched, or low-score tokens.
- Use this route before login/signup to block bots and automated abuse.

<pre>

//api/captcha-check
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { recaptchaToken, action } = await request.json();

    if (!recaptchaToken) {
      return NextResponse.json(
        { error: "reCAPTCHA token is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/assessments?key=${process.env.RECAPTCHA_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: {
            token: recaptchaToken,
            expectedAction: action,
            siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
          },
        }),
      }
    );

    const data = await response.json();

    if (!data.tokenProperties.valid) {
      return NextResponse.json(
        { error: "Invalid reCAPTCHA token" },
        { status: 400 }
      );
    }

    if (data.tokenProperties.action !== action) {
      return NextResponse.json(
        { error: "reCAPTCHA action mismatch" },
        { status: 400 }
      );
    }

    if (data.riskAnalysis.score < 0.5) {
      return NextResponse.json(
        { error: "Low reCAPTCHA score, suspicious activity detected" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Verified" });
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    return NextResponse.json(
      { error: "Unknown server error" },
      { status: 500 }
    );
  }
}
</pre>

## Sign-out API Route

- Removes the session cookie.
- Call this endpoint whenever the user logs out.
- After this, the user will be treated as unauthenticated.

<pre>
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out" });

  res.cookies.set("session", "", {
    httpOnly: true,
    secure: true,
    expires: new Date(0),
    path: "/",
  });

  return res;
}
</pre>

## Middleware

- Placed at the project root, it runs before every request.
- Checks for a valid session cookie.
- Redirects unauthenticated users to login page and prevents logged-in users from visiting public routes.
- Ensures only authenticated users reach protected pages.

Note:
Middleware helps with user experience (redirecting unauthenticated users), but it should not be treated as the final security check.
The server-side verification is what actually enforces security. (Next Step)

<pre>
//middleware.ts
import { NextResponse, NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/"];
const publicRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  const session = request.cookies.get("session")?.value;

  // 4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 5. Redirect to / if the user is authenticated
  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If session exists, continue to the requested page
  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
</pre>

## Make auth helper function

- This is where the real security comes from.
- We use a shared helper on every API route and server component to verify the Firebase Session Cookie.
- Always trust the server side check, never just the client.

<pre>
import { cookies } from "next/headers";
import { adminAuth } from "./firebase-admin";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(session, true);

    return decodedToken;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}
</pre>

Then we can use it like this on api/server components

<pre>
import { getCurrentUser } from "@/lib/firebase/auth";

export async function GET(req: Request) {
    const user = await getCurrentUser();

    if(!user) {
        return NextResponse.json({ message: "Not authenticated" }, 
        { status: 401 });
    }


    // Your api route here......
}
</pre>

## Frontend Login & Signup Flow

- We use a single page with a flip form for login and signup.
- Two async functions (`login`, `signup`) handle authentication, each tied to its own form.
- Before login/signup, a **reCAPTCHA** check is executed and verified via `/api/captcha-check`.
- On login, the client retrieves an **idToken** but only keeps it **in memory** `(inMemoryPersistence)`.
- This token disappears after reload, so we always rely on the **secure session cookie** for actual authentication.
- After signup, a **confirmation** email is sent. Once the user confirms, they can log in to the app.
