import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          authenticated: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    const user = await currentUser();

    const {
      data: admin,
      error,
    } = await supabaseAdmin
      .from("admin_users")
      .select(
        "id, name, email, clerk_user_id, role, status"
      )
      .eq("clerk_user_id", userId)
      .maybeSingle();

    return NextResponse.json({
      authenticated: true,

      clerk: {
        userId,
        email:
          user?.emailAddresses?.[0]
            ?.emailAddress ?? null,
      },

      database: {
        admin,
        error: error
          ? error.message
          : null,
      },
    });
  } catch (error) {
    console.error(
      "DEBUG AUTH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Debug request failed.",
      },
      { status: 500 }
    );
  }
}