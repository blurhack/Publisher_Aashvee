import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {} as any,
    )

    const body = await req.json().catch(() => ({}) as any)
    // TODO: Verify signature/checksum from PhonePe using env salts before trusting the payload.

    const orderId = body?.data?.merchantTransactionId || body?.merchantTransactionId || body?.orderId
    const status = body?.code === "PAYMENT_SUCCESS" || body?.success ? "success" : "failed"
    const paymentId = body?.data?.transactionId || body?.transactionId || null

    if (!orderId) return NextResponse.json({ ok: false }, { status: 400 })

    // Update purchase record
    const { data: purchase } = await supabase
      .from("authorship_purchases")
      .update({ payment_status: status, payment_id: paymentId })
      .eq("id", orderId)
      .select("id, positions_purchased, upcoming_book_id, payment_status")
      .single()

    // If success, decrement available positions
    if (purchase && status === "success") {
      // Reduce available positions atomically
      await supabase.rpc("decrement_available_positions", {
        p_book_id: purchase.upcoming_book_id,
        p_positions: purchase.positions_purchased,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}
