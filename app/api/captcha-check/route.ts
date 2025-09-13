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
