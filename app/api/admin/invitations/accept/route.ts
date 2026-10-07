import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createHash } from "crypto";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

function hashToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    // =====================================================
    // 1. CHECK CLERK SESSION
    // =====================================================

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication required.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // 2. GET CURRENT CLERK USER
    // =====================================================

    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to retrieve your account.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // 3. READ REQUEST BODY
    // =====================================================

    const body = await request.json();

    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    const providedName =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invitation token is required.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 4. GET VERIFIED CLERK EMAIL
    // =====================================================

    const verifiedEmail =
      user.emailAddresses.find(
        (emailAddress) =>
          emailAddress.verification
            ?.status === "verified"
      );

    if (!verifiedEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your email address must be verified before accepting the invitation.",
        },
        { status: 403 }
      );
    }

    const userEmail =
      verifiedEmail.emailAddress
        .trim()
        .toLowerCase();

    // =====================================================
    // 5. HASH INVITATION TOKEN
    // =====================================================

    const tokenHash = hashToken(token);

    // =====================================================
    // 6. FIND INVITATION
    // =====================================================

    const {
      data: invitation,
      error: invitationError,
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
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (invitationError) {
      console.error(
        "INVITATION LOOKUP ERROR:",
        invitationError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to validate invitation.",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 7. INVITATION NOT FOUND
    // =====================================================

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invitation not found or invalid.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // 8. CHECK INVITATION STATUS
    // =====================================================

    if (invitation.accepted_at) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This invitation has already been accepted.",
        },
        { status: 409 }
      );
    }

    if (invitation.revoked_at) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This invitation has been revoked.",
        },
        { status: 410 }
      );
    }

    // =====================================================
    // 9. CHECK EXPIRATION
    // =====================================================

    const expiresAt = new Date(
      invitation.expires_at
    );

    if (
      Number.isNaN(expiresAt.getTime()) ||
      expiresAt.getTime() <= Date.now()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This invitation has expired.",
        },
        { status: 410 }
      );
    }

    // =====================================================
    // 10. ONLY SUPER ADMIN INVITATIONS ARE ALLOWED
    // =====================================================

    if (
      invitation.role !== "super_admin"
    ) {
      console.error(
        "INVALID INVITATION ROLE:",
        invitation.role
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid administrator invitation.",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // 11. VERIFY INVITATION EMAIL
    // =====================================================

    const invitationEmail =
      invitation.email
        .trim()
        .toLowerCase();

    if (invitationEmail !== userEmail) {
      console.error(
        "INVITATION EMAIL MISMATCH:",
        {
          invitationEmail,
          userEmail,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "This invitation was issued for a different email address.",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // 12. CHECK WHETHER USER IS ALREADY AN ADMIN
    // =====================================================

    const {
      data: existingByClerkId,
      error: existingClerkError,
    } = await supabaseAdmin
      .from("admin_users")
      .select(
        "id, clerk_user_id, email, role, status"
      )
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (existingClerkError) {
      console.error(
        "EXISTING ADMIN LOOKUP ERROR:",
        existingClerkError
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

    // =====================================================
    // 13. EXISTING ADMIN
    //
    // If this Clerk account is already an admin,
    // consume the invitation instead of creating
    // a duplicate admin_users record.
    // =====================================================

    if (existingByClerkId) {
      if (
        existingByClerkId.status !==
        "active"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Your administrator account is disabled.",
          },
          { status: 403 }
        );
      }

      if (
        existingByClerkId.role !==
        "super_admin"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Your account does not have Super Admin permission.",
          },
          { status: 403 }
        );
      }

      const {
        error: consumeExistingError,
      } = await supabaseAdmin
        .from("admin_invitations")
        .update({
          accepted_at:
            new Date().toISOString(),
        })
        .eq("id", invitation.id)
        .is("accepted_at", null);

      if (consumeExistingError) {
        console.error(
          "CONSUME EXISTING INVITATION ERROR:",
          consumeExistingError
        );
      }

      return NextResponse.json(
        {
          success: true,
          message:
            "Administrator access already exists.",
          role: "super_admin",
        },
        { status: 200 }
      );
    }

    // =====================================================
    // 14. CHECK SAME EMAIL
    // =====================================================

    const {
      data: existingByEmail,
      error: existingEmailError,
    } = await supabaseAdmin
      .from("admin_users")
      .select(
        "id, clerk_user_id, email, role, status"
      )
      .ilike("email", invitationEmail)
      .maybeSingle();

    if (existingEmailError) {
      console.error(
        "EXISTING EMAIL LOOKUP ERROR:",
        existingEmailError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to verify administrator email.",
        },
        { status: 500 }
      );
    }

    if (existingByEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An administrator account already exists for this email address.",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // 15. GET USER NAME
    // =====================================================

    const clerkName = [
      user.firstName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const name =
      providedName ||
      clerkName ||
      user.username ||
      invitationEmail.split("@")[0];

    // =====================================================
    // 16. CREATE ADMIN USER
    //
    // Every invited administrator is SUPER ADMIN.
    // =====================================================

    const {
      data: newAdmin,
      error: insertError,
    } = await supabaseAdmin
      .from("admin_users")
      .insert({
        clerk_user_id: userId,
        name,
        email: invitationEmail,
        role: "super_admin",
        status: "active",
      })
      .select(
        "id, clerk_user_id, name, email, role, status"
      )
      .single();

    if (insertError) {
      console.error(
        "CREATE ADMIN USER ERROR:",
        insertError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to create administrator account.",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 17. MARK INVITATION AS ACCEPTED
    // =====================================================

    const {
      data: acceptedInvitation,
      error: acceptError,
    } = await supabaseAdmin
      .from("admin_invitations")
      .update({
        accepted_at:
          new Date().toISOString(),
      })
      .eq("id", invitation.id)
      .is("accepted_at", null)
      .select("id")
      .maybeSingle();

    // =====================================================
    // 18. ROLLBACK ADMIN IF INVITATION UPDATE FAILED
    // =====================================================

    if (
      acceptError ||
      !acceptedInvitation
    ) {
      console.error(
        "ACCEPT INVITATION UPDATE ERROR:",
        acceptError
      );

      await supabaseAdmin
        .from("admin_users")
        .delete()
        .eq("id", newAdmin.id);

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to finalize the invitation. Please try again.",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 19. AUDIT LOG
    // =====================================================

    const {
      error: auditError,
    } = await supabaseAdmin
      .from("admin_audit_logs")
      .insert({
        admin_id: newAdmin.id,
        action:
          "admin_invitation_accepted",
        target_type:
          "admin_invitation",
        target_id: invitation.id,
        details: {
          email: invitationEmail,
          role: "super_admin",
          clerk_user_id: userId,
        },
      });

    if (auditError) {
      console.error(
        "ACCEPT INVITATION AUDIT ERROR:",
        auditError
      );
    }

    // =====================================================
    // 20. SUCCESS
    // =====================================================

    return NextResponse.json(
      {
        success: true,
        message:
          "Administrator invitation accepted successfully.",
        admin: {
          id: newAdmin.id,
          clerk_user_id:
            newAdmin.clerk_user_id,
          name: newAdmin.name,
          email: newAdmin.email,
          role: "super_admin",
          status: "active",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ACCEPT INVITATION API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to accept invitation.",
      },
      { status: 500 }
    );
  }
}