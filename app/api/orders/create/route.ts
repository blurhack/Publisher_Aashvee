import { type NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createServerClient } from "@supabase/ssr"
import { cookies, headers } from "next/headers"

/**
 * Creates a pending order and returns a transaction link payload
 * After Supabase is connected, persist to DB and compute amount from book price.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { bookSlug, count, email, phone, bio, imageUrl } = body
    if (!bookSlug || !count || !email || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
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

    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: book, error: bookErr } = await supabase
      .from("upcoming_books")
      .select("id, price_per_position, available_positions")
      .eq("slug", bookSlug)
      .maybeSingle()

    if (bookErr) return NextResponse.json({ error: bookErr.message }, { status: 500 })
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 })

    const positions = Number(count)
    if (!Number.isFinite(positions) || positions <= 0) {
      return NextResponse.json({ error: "Invalid positions requested" }, { status: 400 })
    }
    if ((book.available_positions ?? 0) < positions) {
      return NextResponse.json({ error: "Not enough positions available" }, { status: 400 })
    }

    const amount = Number(book.price_per_position) * positions
    const merchantTransactionId = randomUUID()

    const { error: insertErr } = await supabase.from("authorship_purchases").insert({
      user_id: user.id,
      upcoming_book_id: book.id,
      positions_purchased: positions,
      total_amount: amount,
      payment_status: "pending",
      payment_id: merchantTransactionId, // reuse payment_id to store merchant txn id before confirmation
      phone_number: phone,
      bio: bio || null,
      profile_image_url: imageUrl || null,
    })

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({
      amount,
      merchantTransactionId,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}
