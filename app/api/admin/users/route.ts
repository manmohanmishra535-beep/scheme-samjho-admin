import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    /*
     * Server-side authorization.
     *
     * The frontend is never trusted to decide
     * whether the current user is a Super Admin.
     */
    await requireSuperAdmin();

    const { data: admins, error } = await supabaseAdmin
      .from("admin_users")
      .select(
        `
          id,
          clerk_user_id,
          name,
          email,
          role,
          status,
          created_at,
          updated_at
        `
      )
      .eq("role", "super_admin")
      .in("status", ["active", "disabled"])
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "ADMIN USERS FETCH ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to fetch administrators.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      admins: admins ?? [],
    });
  } catch (error) {
    console.error(
      "GET ADMIN USERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to fetch administrators.",
      },
      { status: 500 }
    );
  }
}