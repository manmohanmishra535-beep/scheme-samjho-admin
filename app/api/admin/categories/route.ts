import { NextResponse } from "next/server";
import { requireAdmin, requireEditor } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    await requireAdmin();

    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("GET categories error:", error);

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      categories: data ?? [],
    });
  } catch (error) {
    console.error("GET categories failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load categories.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireEditor();

    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const slug = String(body.slug ?? "").trim();
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
          message: "Category name is required.",
        },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Category slug is required.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert({
        name,
        slug,
        description: description || null,
        status,
      })
      .select()
      .single();

    if (error) {
      console.error("POST category error:", error);

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        category: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST category failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create category.",
      },
      { status: 500 }
    );
  }
}