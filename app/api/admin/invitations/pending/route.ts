import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperAdmin } from "@/lib/admin";

export async function GET() {
  try {
    // =====================================================
    // 1. Check Clerk authentication
    // =====================================================

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

    // =====================================================
    // 2. Only Super Admin can view invitations
    // =====================================================

    await requireSuperAdmin();

    // =====================================================
    // 3. Get invitations
    // =====================================================

    const {
      data: invitations,
      error,
    } = await supabaseAdmin
      .from("admin_invitations")
      .select(
        `
          id,
          email,
          role,
          expires_at,
          accepted_at,
          revoked_at,
          created_at,
          invited_by
        `
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "FETCH INVITATIONS ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to load invitations.",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 4. Return invitations
    // =====================================================

    return NextResponse.json(
      {
        success: true,
        invitations: invitations ?? [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PENDING INVITATIONS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Internal server error.",
      },
      { status: 500 }
    );
  }
}