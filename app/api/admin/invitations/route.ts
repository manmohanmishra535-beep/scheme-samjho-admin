import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperAdmin } from "@/lib/admin";

const INVITATION_EXPIRY_HOURS = 48;

export async function POST(request: Request) {
  try {
    // =========================================================
    // 1. Authentication
    // =========================================================

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

    // =========================================================
    // 2. Only Super Admin can create invitations
    // =========================================================

    await requireSuperAdmin();

    // =========================================================
    // 3. Get current Super Admin database record
    // =========================================================

    const {
      data: currentAdmin,
      error: currentAdminError,
    } = await supabaseAdmin
      .from("admin_users")
      .select("id, clerk_user_id, email, role, status")
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
            "Unable to verify administrator account.",
        },
        { status: 500 }
      );
    }

    if (!currentAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Administrator account was not found.",
        },
        { status: 403 }
      );
    }

    if (currentAdmin.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your administrator account is not active.",
        },
        { status: 403 }
      );
    }

    if (currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only a Super Admin can create invitations.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 4. Read request body
    // =========================================================

    let body: {
      name?: unknown;
      email?: unknown;
    };

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

    // =========================================================
    // 5. Get name and email
    // =========================================================

    const name = String(body.name ?? "").trim();

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    // =========================================================
    // 6. Validate name
    // =========================================================

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Name is required.",
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name must be 100 characters or less.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 7. Validate email
    // =========================================================

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required.",
        },
        { status: 400 }
      );
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 8. Prevent Super Admin from inviting themselves
    // =========================================================

    if (
      currentAdmin.email &&
      currentAdmin.email.toLowerCase() === email
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot create an invitation for yourself.",
        },
        { status: 409 }
      );
    }

    // =========================================================
    // 9. Check whether email is already an administrator
    // =========================================================

    const {
      data: existingAdmin,
      error: existingAdminError,
    } = await supabaseAdmin
      .from("admin_users")
      .select(
        "id, email, role, status"
      )
      .eq("email", email)
      .maybeSingle();

    if (existingAdminError) {
      console.error(
        "EXISTING ADMIN CHECK ERROR:",
        existingAdminError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to check existing administrator.",
        },
        { status: 500 }
      );
    }

    if (existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This email address is already registered as an administrator.",
        },
        { status: 409 }
      );
    }

    // =========================================================
    // 10. Check existing active invitation
    // =========================================================

    const now = new Date();

    const {
      data: existingInvitation,
      error: existingInvitationError,
    } = await supabaseAdmin
      .from("admin_invitations")
      .select(
        `
          id,
          email,
          role,
          expires_at,
          accepted_at,
          revoked_at
        `
      )
      .eq("email", email)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .gt(
        "expires_at",
        now.toISOString()
      )
      .maybeSingle();

    if (existingInvitationError) {
      console.error(
        "EXISTING INVITATION CHECK ERROR:",
        existingInvitationError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to check existing invitations.",
        },
        { status: 500 }
      );
    }

    if (existingInvitation) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An active invitation already exists for this email address.",
        },
        { status: 409 }
      );
    }

    // =========================================================
    // 11. Generate secure random token
    // =========================================================

    const rawToken =
      randomBytes(32).toString("hex");

    // Only the hash is stored in the database.
    const tokenHash =
      createHash("sha256")
        .update(rawToken)
        .digest("hex");

    // =========================================================
    // 12. Set invitation expiration
    // =========================================================

    const expiresAt = new Date(
      Date.now() +
        INVITATION_EXPIRY_HOURS *
          60 *
          60 *
          1000
    );

    // =========================================================
    // 13. Every invited user is Super Admin
    // =========================================================

    const role = "super_admin";

    // =========================================================
    // 14. Create invitation
    // =========================================================

    const {
      data: invitation,
      error: invitationError,
    } = await supabaseAdmin
      .from("admin_invitations")
      .insert({
        email,
        role,
        token_hash: tokenHash,
        invited_by: currentAdmin.id,
        expires_at:
          expiresAt.toISOString(),
      })
      .select(
        `
          id,
          email,
          role,
          expires_at,
          created_at
        `
      )
      .single();

    if (invitationError) {
      console.error(
        "CREATE INVITATION ERROR:",
        invitationError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to create invitation.",
        },
        { status: 500 }
      );
    }

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invitation could not be created.",
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 15. Get public application URL
    // =========================================================

    const appUrl =
      process.env.APP_URL?.trim();

    if (!appUrl) {
      console.error(
        "APP_URL is not configured."
      );

      // Remove invitation because we cannot
      // provide a usable URL.
      await supabaseAdmin
        .from("admin_invitations")
        .delete()
        .eq("id", invitation.id);

      return NextResponse.json(
        {
          success: false,
          message:
            "APP_URL is not configured on the server.",
        },
        { status: 500 }
      );
    }

    // Remove trailing slash.
    const cleanAppUrl =
      appUrl.replace(/\/+$/, "");

    // =========================================================
    // 16. Create invitation URL
    // =========================================================

    const invitationUrl =
      `${cleanAppUrl}/admin/signup?token=${rawToken}`;

    // =========================================================
    // 17. Create audit log
    // =========================================================

    const {
      error: auditError,
    } = await supabaseAdmin
      .from("admin_audit_logs")
      .insert({
        admin_id: currentAdmin.id,
        action:
          "admin_invitation_created",
        target_type:
          "admin_invitation",
        target_id: invitation.id,
        details: {
          name,
          email,
          role: "super_admin",
          expires_at:
            expiresAt.toISOString(),
        },
      });

    if (auditError) {
      console.error(
        "AUDIT LOG ERROR:",
        auditError
      );

      // Do not fail the invitation because
      // audit logging failed.
    }

    // =========================================================
    // 18. Return response
    // =========================================================

    return NextResponse.json(
      {
        success: true,
        message:
          "Super Admin invitation created successfully.",
        invitation: {
          id: invitation.id,
          name,
          email: invitation.email,
          role: "super_admin",
          expiresAt:
            invitation.expires_at,
          createdAt:
            invitation.created_at,
          invitationUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE INVITATION API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create invitation.",
      },
      { status: 500 }
    );
  }
}