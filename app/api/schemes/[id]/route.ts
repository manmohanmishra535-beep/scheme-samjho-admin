import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type SchemeStatus = "draft" | "published";

function isValidStatus(
  status: unknown
): status is SchemeStatus {
  return (
    status === "draft" ||
    status === "published"
  );
}

function toNumberOrNull(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return numberValue;
}

function cleanStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string"
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

/* =========================================================
   GET ONE SCHEME
========================================================= */

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const supabase =
      supabaseAdmin;

    const { data, error } = await supabase
      .from("schemes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(
        "GET single scheme error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error: "Scheme not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      scheme: data,
    });
  } catch (error) {
    return handleApiError(
      error,
      "Unable to load scheme."
    );
  }
}

/* =========================================================
   UPDATE SCHEME
========================================================= */

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const body = await request.json();

    if (
      typeof body.name !== "string" ||
      !body.name.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Scheme name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof body.slug !== "string" ||
      !body.slug.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Scheme slug is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^[a-z0-9-]+$/.test(
        body.slug.trim().toLowerCase()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Slug can contain only lowercase letters, numbers and hyphens.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof body.category !== "string" ||
      !body.category.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Scheme category is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isValidStatus(body.status)) {
      return NextResponse.json(
        {
          error:
            "Status must be either draft or published.",
        },
        {
          status: 400,
        }
      );
    }

    const updateData = {
      name: body.name.trim(),

      slug: body.slug
        .trim()
        .toLowerCase(),

      category: body.category.trim(),

      status: body.status,

      short_description:
        typeof body.short_description ===
        "string"
          ? body.short_description.trim()
          : "",

      description:
        typeof body.description ===
        "string"
          ? body.description.trim()
          : "",

      benefits: cleanStringArray(
        body.benefits
      ),

      documents: cleanStringArray(
        body.documents
      ),

      occupations: cleanStringArray(
        body.occupations
      ),

      exclusions: cleanStringArray(
        body.exclusions
      ),

      min_age: toNumberOrNull(
        body.min_age
      ),

      max_age: toNumberOrNull(
        body.max_age
      ),

      max_income: toNumberOrNull(
        body.max_income
      ),

      eligibility_summary:
        typeof body.eligibility_summary ===
        "string"
          ? body.eligibility_summary.trim()
          : "",

      last_verified:
        typeof body.last_verified ===
        "string"
          ? body.last_verified.trim()
          : "",

      official_url:
        typeof body.official_url ===
        "string"
          ? body.official_url.trim()
          : "",

      updated_at:
        new Date().toISOString(),
    };

    const supabase =
      supabaseAdmin;

    const {
      data,
      error,
    } = await supabase
      .from("schemes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(
        "UPDATE scheme error:",
        error
      );

      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "A scheme with this slug already exists.",
          },
          {
            status: 409,
          }
        );
      }

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,
      scheme: data,
    });
  } catch (error) {
    return handleApiError(
      error,
      "Unable to update scheme."
    );
  }
}

/* =========================================================
   DELETE SCHEME
========================================================= */

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const supabase =
      supabaseAdmin;

    const {
      data: existingScheme,
      error: findError,
    } = await supabase
      .from("schemes")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      console.error(
        "Find scheme before delete error:",
        findError
      );

      return NextResponse.json(
        {
          error: findError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!existingScheme) {
      return NextResponse.json(
        {
          error: "Scheme not found.",
        },
        {
          status: 404,
        }
      );
    }

    const { error } =
      await supabase
        .from("schemes")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        "DELETE scheme error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Scheme deleted successfully.",
    });
  } catch (error) {
    return handleApiError(
      error,
      "Unable to delete scheme."
    );
  }
}

/* =========================================================
   ERROR HANDLER
========================================================= */

function handleApiError(
  error: unknown,
  fallbackMessage: string
) {
  console.error(
    "Admin scheme API error:",
    error
  );

  if (
    error instanceof Error &&
    error.message === "UNAUTHORIZED"
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  if (
    error instanceof Error &&
    error.message === "FORBIDDEN"
  ) {
    return NextResponse.json(
      {
        error: "Forbidden",
      },
      {
        status: 403,
      }
    );
  }

  return NextResponse.json(
    {
      error:
        error instanceof Error
          ? error.message
          : fallbackMessage,
    },
    {
      status: 500,
    }
  );
}