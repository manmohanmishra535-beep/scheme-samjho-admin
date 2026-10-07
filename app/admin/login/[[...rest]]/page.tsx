import AdminLoginForm from "@/components/auth/AdminLoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <AdminLoginForm
      invitationToken={params.token ?? ""}
    />
  );
}