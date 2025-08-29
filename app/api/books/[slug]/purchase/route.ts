import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const form = await req.formData()
    const positions = Number(form.get("positions") || 0)
    const bio = String(form.get("bio") || "")
    const phone = String(form.get("phone") || "")
    // Optional file is ignored here; uploading requires a storage bucket

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
        },
        headers: {
          get(key: string) {
            return req.headers.get(key) ?? undefined
          },
        },
      } as any,
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: book, error: bookErr } = await supabase
      .from("upcoming_books")
      .select("*")
      .eq("slug", params.slug)
      .single()
    if (bookErr || !book) return NextResponse.json({ error: "Book not found" }, { status: 404 })
    if (!positions || positions < 1) return NextResponse.json({ error: "Invalid positions" }, { status: 400 })
    if (positions > book.available_positions)
      return NextResponse.json({ error: "Not enough positions available" }, { status: 400 })

    const totalAmount = positions * (book.price_per_position || 0)

    // Create the pending purchase
    const { data: purchase, error: insErr } = await supabase
      .from("authorship_purchases")
      .insert({
        user_id: user.id,
        upcoming_book_id: book.id,
        positions_purchased: positions,
        total_amount: totalAmount,
        payment_status: "pending",
        phone_number: phone || null,
        bio: bio || null,
      })
      .select("*")
      .single()

    if (insErr || !purchase)
      return NextResponse.json({ error: insErr?.message || "Failed to create order" }, { status: 500 })

    // Request a PhonePe payment link via internal API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin
    const res = await fetch(new URL("/api/payments/phonepe/create", baseUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount: totalAmount,
        currency: "INR",
        orderId: purchase.id,
        userEmail: user.email,
        redirectUrl: `${baseUrl}/books/${params.slug}`,
        callbackUrl: `${baseUrl}/api/payments/phonepe/callback`,
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Payment provider error" }, { status: 500 })
    }
    const json = await res.json()
    return NextResponse.json({ checkoutUrl: json.checkoutUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
