import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies, headers } from "next/headers"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
      headers: {
        get(key: string) {
          return headers().get(key) ?? undefined
        },
      },
    } as any,
  )

  const { data, error } = await supabase
    .from("upcoming_books")
    .select("id, slug, title, available_positions, total_author_positions, price_per_position, status")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 403 })
  return NextResponse.json({ books: data })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      title,
      slug,
      description,
      totalPositions,
      availablePositions,
      pricePerPosition,
      coverUrl,
      genre,
      publicationDate,
    } = body ?? {}

    if (!title || !slug || typeof pricePerPosition !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
        headers: {
          get(key: string) {
            return headers().get(key) ?? undefined
          },
        },
      } as any,
    )

    // Insert with RLS; only users with admin role can insert/update upcoming_books
    const { data, error } = await supabase
      .from("upcoming_books")
      .insert({
        slug,
        title,
        description: description || null,
        genre: genre || null,
        cover_image_url: coverUrl || null,
        publication_date: publicationDate || null,
        total_author_positions: Number(totalPositions) || 0,
        available_positions: Number(availablePositions ?? totalPositions) || 0,
        price_per_position: Number(pricePerPosition),
        status: "published",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json({ ok: true, book: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, available_positions, price_per_position, status } = await req.json()

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
        headers: {
          get(key: string) {
            return headers().get(key) ?? undefined
          },
        },
      } as any,
    )

    const { data, error } = await supabase
      .from("upcoming_books")
      .update({
        available_positions: typeof available_positions === "number" ? available_positions : undefined,
        price_per_position: typeof price_per_position === "number" ? price_per_position : undefined,
        status: typeof status === "string" ? status : undefined,
      })
      .eq("id", id)
      .select()
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 403 })
    return NextResponse.json({ book: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}
