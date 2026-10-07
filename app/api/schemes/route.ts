import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();

    const body = await request.json();

    const {
      name,
      short_name,
      category,
      description,
      benefits,
      eligibility,
      application_url,
      status,
    } = body;

    if (!name || !category || !description) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, category and description are required.",
        },
        { status: 400 }
      );
    }

    const slug = createSlug(name);

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not generate a valid slug from the scheme name.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("schemes")
      .insert({
        name: name.trim(),
        slug,
        short_name: short_name?.trim() || null,
        category: category.trim(),
        description: description.trim(),
        benefits: benefits?.trim() || null,
        eligibility: eligibility?.trim() || null,
        application_url: application_url?.trim() || null,
        status: status || "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Create scheme error:", error);

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Scheme created successfully.",
        scheme: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/schemes error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create scheme.",
      },
      { status: 500 }
    );
  }
}