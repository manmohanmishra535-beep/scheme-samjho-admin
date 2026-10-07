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

/*
|--------------------------------------------------------------------------
| GET - Fetch all schemes
|--------------------------------------------------------------------------
*/
export async function GET() {
  try {
    await requireSuperAdmin();

    const { data, error } = await supabaseAdmin
      .from("schemes")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Get schemes error:", error);

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
        schemes: data ?? [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/admin/schemes error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch schemes.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST - Create a new scheme
|--------------------------------------------------------------------------
*/
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

    const slug = createSlug(name);

    const shortDescription =
      description.trim();

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

    const lastVerified = new Date()
      .toISOString()
      .split("T")[0];

    console.log("Creating scheme:", {
      name: name.trim(),
      slug,
      status: "published",
    });

    const { data, error } =
      await supabaseAdmin
        .from("schemes")
        .insert({
          name: name.trim(),

          slug: slug,

          short_name:
            typeof short_name === "string" &&
            short_name.trim()
              ? short_name.trim()
              : null,

          short_description:
            shortDescription,

          description:
            description.trim(),

          category:
            category.trim(),

          benefits:
            typeof benefits === "string" &&
            benefits.trim()
              ? benefits.trim()
              : null,

          eligibility_summary:
            eligibilitySummary,

          eligibility:
            typeof eligibility === "string" &&
            eligibility.trim()
              ? eligibility.trim()
              : null,

          application_url:
            typeof application_url === "string" &&
            application_url.trim()
              ? application_url.trim()
              : null,

          official_url:
            officialUrl,

          status: "published",

          last_verified:
            lastVerified,
        })
        .select()
        .single();

    if (error) {
      console.error(
        "Create scheme error:",
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

    console.log(
      "Scheme created successfully:",
      data
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Scheme created successfully.",
        scheme: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/schemes error:",
      error
    );

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