import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          allowed: false,
          message: "Email address is required.",
        },
        { status: 400 }
      );
    }

    const raw =
      process.env.ADMIN_SIGNUP_EMAILS || "";

    const allowedEmails = raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (!allowedEmails.includes(email)) {
      return NextResponse.json(
        {
          allowed: false,
          message:
            "This email is not authorized to create an admin account.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      allowed: true,
    });
  } catch {
    return NextResponse.json(
      {
        allowed: false,
        message: "Invalid request.",
      },
      { status: 400 }
    );
  }
}