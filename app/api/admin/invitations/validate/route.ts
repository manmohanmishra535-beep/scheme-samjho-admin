import { NextResponse } from "next/server";
import { createHash } from "crypto";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

function hashToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    // =====================================================
    // 1. READ TOKEN
    // =====================================================

    const body = await request.json();

    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message:
            "Invitation token is required.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 2. HASH TOKEN
    //
    // The raw token is never stored in the database.
    // =====================================================

    const tokenHash = hashToken(token);

    // =====================================================
    // 3. FIND INVITATION
    // =====================================================

    const {
      data: invitation,
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
          revoked_at
        `
      )
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error) {
      console.error(
        "VALIDATE INVITATION DATABASE ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          valid: false,
          message:
            "Unable to validate invitation.",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 4. INVITATION NOT FOUND
    // =====================================================

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message:
            "Invitation not found or invalid.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // 5. CHECK IF ALREADY ACCEPTED
    // =====================================================

    if (invitation.accepted_at) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message:
            "This invitation has already been accepted.",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // 6. CHECK IF REVOKED
    // =====================================================

    if (invitation.revoked_at) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message:
            "This invitation has been revoked.",
        },
        { status: 410 }
      );
    }

    // =====================================================
    // 7. CHECK EXPIRATION
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
          valid: false,
          message:
            "This invitation has expired.",
        },
        { status: 410 }
      );
    }

    // =====================================================
    // 8. ONLY SUPER ADMIN INVITATIONS
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
          valid: false,
          message:
            "Invalid administrator invitation.",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // 9. SUCCESS
    //
    // Do NOT expose:
    // - token_hash
    // - internal database details
    // =====================================================

    return NextResponse.json(
      {
        success: true,
        valid: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: "super_admin",
          expiresAt:
            invitation.expires_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "VALIDATE INVITATION API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        valid: false,
        message:
          "Unable to validate invitation.",
      },
      { status: 500 }
    );
  }
}