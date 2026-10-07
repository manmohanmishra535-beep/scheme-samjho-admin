import Link from "next/link";
import { ArrowLeft, Tags } from "lucide-react";
import { requireSuperAdmin } from "@/lib/admin";
import AddCategoryForm from "./AddCategoryForm";

export default async function NewCategoryPage() {
  await requireSuperAdmin();

  return (
    <main className="mx-auto max-w-3xl">
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
              Add Category
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create a new scheme category.
            </p>
          </div>
        </div>
      </div>

      <AddCategoryForm />
    </main>
  );
}