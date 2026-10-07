import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperAdmin } from "@/lib/admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  _request: Request,
  context: RouteContext
) {
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
    // 2. Only Super Admin can revoke invitations
    // =====================================================

    await requireSuperAdmin();

    // =====================================================
    // 3. Get invitation ID
    // =====================================================

    const { id } = await context.params;

    const invitationId =
      typeof id === "string" ? id.trim() : "";

    if (!invitationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invitation ID is required.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 4. Validate UUID
    // =====================================================

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(invitationId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invitation ID.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 5. Get invitation
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
          revoked_at,
          created_at
        `
      )
      .eq("id", invitationId)
      .maybeSingle();

    if (invitationError) {
      console.error(
        "GET INVITATION ERROR:",
        invitationError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to find invitation.",
        },
        { status: 500 }
      );
    }

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invitation not found.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // 6. Prevent revoking accepted invitation
    // =====================================================

    if (invitation.accepted_at) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This invitation has already been accepted and cannot be revoked.",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // 7. Check if already revoked
    // =====================================================

    if (invitation.revoked_at) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This invitation has already been revoked.",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // 8. Get current admin database record
    // =====================================================

    const {
      data: adminRecord,
      error: adminLookupError,
    } = await supabaseAdmin
      .from("admin_users")
      .select(
        `
          id,
          clerk_user_id,
          role,
          status
        `
      )
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (adminLookupError) {
      console.error(
        "ADMIN LOOKUP ERROR:",
        adminLookupError
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

    if (!adminRecord) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Administrator account not found.",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // 9. Verify Super Admin role
    // =====================================================

    if (
      adminRecord.status !== "active" ||
      adminRecord.role !== "super_admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only Super Admins can revoke invitations.",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // 10. Revoke invitation
    // =====================================================

    const revokedAt =
      new Date().toISOString();

    const {
      data: updatedInvitation,
      error: revokeError,
    } = await supabaseAdmin
      .from("admin_invitations")
      .update({
        revoked_at: revokedAt,
      })
      .eq("id", invitationId)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .select(
        `
          id,
          email,
          role,
          expires_at,
          accepted_at,
          revoked_at,
          created_at
        `
      )
      .maybeSingle();

    if (revokeError) {
      console.error(
        "REVOKE INVITATION ERROR:",
        revokeError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to revoke invitation.",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 11. Handle race condition / already changed record
    // =====================================================

    if (!updatedInvitation) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The invitation was already accepted or revoked.",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // 12. Audit log
    // =====================================================

    const { error: auditError } =
      await supabaseAdmin
        .from("admin_audit_logs")
        .insert({
          admin_id: adminRecord.id,
          action:
            "admin_invitation_revoked",
          target_type:
            "admin_invitation",
          target_id: invitationId,
          details: {
            email: invitation.email,
            role: "super_admin",
            revoked_at: revokedAt,
          },
        });

    if (auditError) {
      console.error(
        "AUDIT LOG ERROR:",
        auditError
      );

      // The invitation has already been
      // revoked, so don't undo the action.
    }

    // =====================================================
    // 13. Success
    // =====================================================

    return NextResponse.json(
      {
        success: true,
        message:
          "Invitation revoked successfully.",
        invitation: updatedInvitation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "REVOKE INVITATION API ERROR:",
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