import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type AdminRole =
  | "super_admin"
  | "editor"
  | "viewer";

export type AdminUser = {
  userId: string;
  role: AdminRole;
};

function getAdminUsers(): AdminUser[] {
  const raw = process.env.ADMIN_USERS ?? "";

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [userId, role] = item
        .split(":")
        .map((value) => value.trim());

      let validRole: AdminRole = "viewer";

      if (role === "super_admin") {
        validRole = "super_admin";
      } else if (role === "editor") {
        validRole = "editor";
      }

      return {
        userId,
        role: validRole,
      };
    });
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return (
    getAdminUsers().find(
      (admin) => admin.userId === userId
    ) ?? null
  );
}

export async function requireAdmin(): Promise<AdminUser> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/admin/login");
  }

  const admin = getAdminUsers().find(
    (item) => item.userId === userId
  );

  if (!admin) {
    redirect("/unauthorized");
  }

  return admin;
}

export async function requireEditor(): Promise<AdminUser> {
  const admin = await requireAdmin();

  if (
    admin.role !== "super_admin" &&
    admin.role !== "editor"
  ) {
    redirect("/unauthorized");
  }

  return admin;
}

export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await requireAdmin();

  if (admin.role !== "super_admin") {
    redirect("/unauthorized");
  }

  return admin;
}