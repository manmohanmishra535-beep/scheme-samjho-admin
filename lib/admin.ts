import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const adminUserIds =
  process.env.ADMIN_USER_IDS
    ?.split(",")
    .map((id) => id.trim())
    .filter(Boolean) ?? [];

export async function requireAdmin() {
  const { userId } = await auth();

  // Not logged in
  if (!userId) {
    redirect("/sign-in");
  }

  // Logged in but not an administrator
  if (!adminUserIds.includes(userId)) {
    redirect("/unauthorized");
  }

  return userId;
}