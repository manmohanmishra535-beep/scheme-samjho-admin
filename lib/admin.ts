import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type AdminRole = "super_admin";

export type AdminUser = {
  userId: string;
  role: AdminRole;
};

async function getAdminFromDatabase(
  userId: string
): Promise<AdminUser | null> {
  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select(
      "clerk_user_id, role, status"
    )
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) {
    console.error(
      "ADMIN DATABASE LOOKUP ERROR:",
      error
    );

    return null;
  }

  if (!data) {
    return null;
  }

  /*
   * Administrator must be active.
   */
  if (data.status !== "active") {
    return null;
  }

  /*
   * This application supports only
   * the Super Admin role.
   */
  if (data.role !== "super_admin") {
    console.error(
      "INVALID ADMIN ROLE:",
      data.role
    );

    return null;
  }

  return {
    userId: data.clerk_user_id,
    role: "super_admin",
  };
}

/**
 * Returns the currently authenticated
 * Super Admin or null.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return getAdminFromDatabase(userId);
}

/**
 * Requires an authenticated and active
 * Super Admin.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/admin/login");
  }

  const admin =
    await getAdminFromDatabase(userId);

  if (!admin) {
    redirect("/unauthorized");
  }

  return admin;
}

/**
 * Requires an authenticated and active
 * Super Admin.
 *
 * Currently this is equivalent to
 * requireAdmin() because Super Admin
 * is the only supported role.
 */
export async function requireSuperAdmin(): Promise<AdminUser> {
  return requireAdmin();
}