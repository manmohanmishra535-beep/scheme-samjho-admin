import Link from "next/link";
import { ArrowLeft, Tags } from "lucide-react";

import { requireSuperAdmin } from "@/lib/admin";
import EditCategoryForm from "@/components/admin/EditCategoryForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditCategoryPage({
  params,
}: PageProps) {
  await requireSuperAdmin();

  const { id } = await params;

  return (
    <main className="mx-auto max-w-3xl">
      {/* HEADER */}
      <div className="mb-6">
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to Categories
        </Link>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Tags size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Edit Category
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update category information.
            </p>
          </div>
        </div>
      </div>

      {/* EDIT FORM */}
      <EditCategoryForm categoryId={id} />
    </main>
  );
}