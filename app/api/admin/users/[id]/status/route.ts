import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperAdmin } from "@/lib/admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type AdminStatus = "active" | "disabled";

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    /*
     * ---------------------------------------------------------
     * 1. Authenticate the request
     * ---------------------------------------------------------
     */
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
     * ---------------------------------------------------------
     * 2. Require an active Super Admin
     * ---------------------------------------------------------
     */
    await requireSuperAdmin();

    /*
     * ---------------------------------------------------------
     * 3. Get target admin ID
     * ---------------------------------------------------------
     */
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin ID is required.",
        },
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 4. Parse request body
     * ---------------------------------------------------------
     */
    let body: { status?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const requestedStatus = String(
      body.status ?? ""
    ).trim();

    if (
      requestedStatus !== "active" &&
      requestedStatus !== "disabled"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Status must be either active or disabled.",
        },
        { status: 400 }
      );
    }

    const status =
      requestedStatus as AdminStatus;

    /*
     * ---------------------------------------------------------
     * 5. Find the current logged-in Super Admin
     * ---------------------------------------------------------
     */
    const {
      data: currentAdmin,
      error: currentAdminError,
    } = await supabaseAdmin
      .from("admin_users")
      .select(
        "id, clerk_user_id, name, email, role, status"
      )
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (currentAdminError) {
      console.error(
        "CURRENT ADMIN LOOKUP ERROR:",
        currentAdminError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to verify administrator.",
        },
        { status: 500 }
      );
    }

    if (!currentAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Administrator account not found.",
        },
        { status: 403 }
      );
    }

    if (
      currentAdmin.role !== "super_admin" ||
      currentAdmin.status !== "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only an active Super Admin can change administrator status.",
        },
        { status: 403 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 6. Find the target administrator
     * ---------------------------------------------------------
     */
    const {
      data: targetAdmin,
      error: targetError,
    } = await supabaseAdmin
      .from("admin_users")
      .select(
        "id, clerk_user_id, name, email, role, status, created_at, updated_at"
      )
      .eq("id", id)
      .maybeSingle();

    if (targetError) {
      console.error(
        "TARGET ADMIN LOOKUP ERROR:",
        targetError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to find administrator.",
        },
        { status: 500 }
      );
    }

    if (!targetAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Administrator not found.",
        },
        { status: 404 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 7. Enforce Super Admin-only role
     * ---------------------------------------------------------
     */
    if (targetAdmin.role !== "super_admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid administrator role.",
        },
        { status: 403 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 8. Protect Super Admin accounts
     *
     * Your current system has ONLY Super Admin accounts.
     * Therefore this endpoint does not allow their status
     * to be changed.
     * ---------------------------------------------------------
     */
    return NextResponse.json(
      {
        success: false,
        message:
          "Super Admin accounts cannot be disabled or enabled through this endpoint.",
      },
      { status: 403 }
    );
  } catch (error) {
    console.error(
      "ADMIN STATUS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update administrator.",
      },
      { status: 500 }
    );
  }
}