import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperAdmin } from "@/lib/admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * DELETE /api/admin/invitations/[id]
 *
 * Deletes an administrator invitation.
 *
 * Security:
 * - User must be authenticated with Clerk.
 * - User must exist as an active Super Admin.
 * - Accepted invitations cannot be deleted.
 * - Audit logging is attempted after deletion.
 */
export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    // =====================================================
    // 1. CHECK CLERK AUTHENTICATION
    // =====================================================

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    // =====================================================
    // 2. CHECK SUPER ADMIN AUTHORIZATION
    // =====================================================

    await requireSuperAdmin();

    // =====================================================
    // 3. GET INVITATION ID FROM URL
    // =====================================================

    const { id } = await context.params;

    const invitationId =
      typeof id === "string"
        ? id.trim()
        : "";

    if (!invitationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invitation ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // 4. VALIDATE UUID
    // =====================================================

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(invitationId)) {
      console.error(
        "INVALID INVITATION UUID:",
        invitationId
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid invitation ID.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "DELETE INVITATION:",
      invitationId
    );

    // =====================================================
    // 5. FIND INVITATION
    // =====================================================

    const {
      data: invitation,
      error: findError,
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

    if (findError) {
      console.error(
        "FIND INVITATION ERROR:",
        findError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to find invitation.",
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // 6. INVITATION DOES NOT EXIST
    // =====================================================

    if (!invitation) {
      console.error(
        "INVITATION NOT FOUND:",
        invitationId
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Invitation not found. It may have already been deleted.",
        },
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // 7. PROTECT ACCEPTED INVITATIONS
    // =====================================================

    if (invitation.accepted_at) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Accepted invitations cannot be deleted.",
        },
        {
          status: 409,
        }
      );
    }

    // =====================================================
    // 8. FIND CURRENT ADMIN DATABASE RECORD
    //
    // admin_users.id is a Supabase UUID.
    // userId from Clerk is NOT the same thing.
    // =====================================================

    const {
      data: adminRecord,
      error: adminLookupError,
    } = await supabaseAdmin
      .from("admin_users")
      .select("id, clerk_user_id, role, status")
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
            "Unable to verify administrator account.",
        },
        {
          status: 500,
        }
      );
    }

    if (!adminRecord) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Administrator account not found.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      adminRecord.status !== "active" ||
      adminRecord.role !== "super_admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only an active Super Admin can delete invitations.",
        },
        {
          status: 403,
        }
      );
    }

    // =====================================================
    // 9. DELETE INVITATION
    // =====================================================

    const {
      error: deleteError,
    } = await supabaseAdmin
      .from("admin_invitations")
      .delete()
      .eq("id", invitationId)
      .is("accepted_at", null);

    if (deleteError) {
      console.error(
        "DELETE INVITATION ERROR:",
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to delete invitation.",
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // 10. CREATE AUDIT LOG
    //
    // Do not use the Clerk user ID here.
    // admin_id expects public.admin_users.id.
    // =====================================================

    const {
      error: auditError,
    } = await supabaseAdmin
      .from("admin_audit_logs")
      .insert({
        admin_id: adminRecord.id,
        action:
          "admin_invitation_deleted",
        target_type:
          "admin_invitation",
        target_id: invitationId,
        details: {
          email: invitation.email,
          role: "super_admin",
          invitation_id: invitation.id,
          expires_at:
            invitation.expires_at,
          accepted_at:
            invitation.accepted_at,
          revoked_at:
            invitation.revoked_at,
        },
      });

    // =====================================================
    // 11. AUDIT FAILURE SHOULD NOT ROLLBACK DELETE
    // =====================================================

    if (auditError) {
      console.error(
        "INVITATION DELETE AUDIT LOG ERROR:",
        auditError
      );
    }

    // =====================================================
    // 12. SUCCESS
    // =====================================================

    return NextResponse.json(
      {
        success: true,
        message:
          "Invitation deleted successfully.",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: "super_admin",
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "DELETE INVITATION API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete invitation.",
      },
      {
        status: 500,
      }
    );
  }
}