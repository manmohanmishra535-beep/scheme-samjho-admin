import AdminSignupForm from "@/components/auth/AdminSignupForm";

export default async function AdminSignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <AdminSignupForm
      invitationToken={params.token ?? ""}
    />
  );
}