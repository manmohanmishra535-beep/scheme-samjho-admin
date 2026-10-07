import { NextResponse } from "next/server";
import { requireAdmin, requireSuperAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    await requireAdmin();

    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Categories GET error:", error);

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      categories: data ?? [],
    });
  } catch (error) {
    console.error("Categories GET failed:", error);

    return NextResponse.json(
      {
        error: "Unauthorized or unable to load categories.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();

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
          error: "Category name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!slug) {
      return NextResponse.json(
        {
          error: "Category slug is required.",
        },
        {
          status: 400,
        }
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
      console.error("Categories POST error:", error);

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        category: data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Categories POST failed:", error);

    return NextResponse.json(
      {
        error: "Unable to create category.",
      },
      {
        status: 500,
      }
    );
  }
}