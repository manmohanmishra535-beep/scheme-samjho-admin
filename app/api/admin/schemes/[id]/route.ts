import { NextResponse } from "next/server";
import {
  requireEditor,
  requireSuperAdmin,
} from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

/*
|--------------------------------------------------------------------------
| GET - Get one scheme
|--------------------------------------------------------------------------
*/
export async function GET(
  request: Request,
  { params }: Params
) {
  try {
    await requireEditor();

    const { id } = await params;

    const { data, error } =
      await supabaseAdmin
        .from("schemes")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
      console.error(
        "Get scheme error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      scheme: data,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/schemes/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch scheme.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH - Update one scheme
|--------------------------------------------------------------------------
*/
export async function PATCH(
  request: Request,
  { params }: Params
) {
  try {
    await requireEditor();

    const { id } = await params;

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
          message:
            "Name, category and description are required.",
        },
        { status: 400 }
      );
    }

    if (
      status !== "draft" &&
      status !== "published"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Status must be draft or published.",
        },
        { status: 400 }
      );
    }

    const eligibilitySummary =
      typeof eligibility === "string" &&
      eligibility.trim()
        ? eligibility.trim()
        : "Eligibility details not provided.";

    const officialUrl =
      typeof application_url === "string" &&
      application_url.trim()
        ? application_url.trim()
        : "";

    const { data, error } =
      await supabaseAdmin
        .from("schemes")
        .update({
          name: name.trim(),

          short_name:
            typeof short_name === "string" &&
            short_name.trim()
              ? short_name.trim()
              : null,

          category: category.trim(),

          description:
            description.trim(),

          short_description:
            description.trim(),

          benefits:
            typeof benefits === "string" &&
            benefits.trim()
              ? benefits.trim()
              : null,

          eligibility:
            typeof eligibility === "string" &&
            eligibility.trim()
              ? eligibility.trim()
              : null,

          eligibility_summary:
            eligibilitySummary,

          application_url:
            typeof application_url === "string" &&
            application_url.trim()
              ? application_url.trim()
              : null,

          official_url:
            officialUrl,

          status,

          last_verified: new Date()
            .toISOString()
            .split("T")[0],
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
      console.error(
        "Update scheme error:",
        error
      );

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
      message:
        "Scheme updated successfully.",
      scheme: data,
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/schemes/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update scheme.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE - Delete one scheme
|--------------------------------------------------------------------------
*/
export async function DELETE(
  request: Request,
  { params }: Params
) {
  try {
    await requireSuperAdmin();

    const { id } = await params;

    const { error } =
      await supabaseAdmin
        .from("schemes")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        "Delete scheme error:",
        error
      );

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
      message:
        "Scheme deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/schemes/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete scheme.",
      },
      { status: 500 }
    );
  }
}