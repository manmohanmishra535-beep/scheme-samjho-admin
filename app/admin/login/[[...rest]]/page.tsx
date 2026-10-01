import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/auth/AdminLoginForm";

export default async function AdminLoginPage() {
  const { userId } = await auth();

  // If already signed in, don't show the login form again.
  if (userId) {
    redirect("/admin/dashboard");
  }

  return <AdminLoginForm />;
}