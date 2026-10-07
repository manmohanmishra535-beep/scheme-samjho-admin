import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: Context
) {
  try {
  await requireSuperAdmin();

    const { id } = await context.params;

    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          success: false,
          message: "Category not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load category.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: Context
) {
  try {
    await requireSuperAdmin();

    const { id } = await context.params;

    const body = await request.json();

    const name = String(
      body.name ?? ""
    ).trim();

    const slug = String(
      body.slug ?? ""
    ).trim();

    const description = String(
      body.description ?? ""
    ).trim();

    const status =
      body.status === "inactive"
        ? "inactive"
        : "active";

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category name is required.",
        },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category slug is required.",
        },
        { status: 400 }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("categories")
        .update({
          name,
          slug,
          description: description || null,
          status,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          success: false,
          message:
            "Failed to update category.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Category updated successfully.",
      category: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update category.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: Context
) {
  try {
    await requireSuperAdmin();

    const { id } = await context.params;

    const { error } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          success: false,
          message:
            "Failed to delete category.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Category deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete category.",
      },
      { status: 500 }
    );
  }
}