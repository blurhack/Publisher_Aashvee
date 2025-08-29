import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

/**
 * PhonePe callback/redirect handler
 * TODO: verify transaction status via /pg/v1/status/{merchantId}/{merchantTransactionId}
 * and update the corresponding order in DB.
 */
export async function GET(req: NextRequest) {
  return handleCallback(req)
}

export async function POST(req: NextRequest) {
  return handleCallback(req)
}

async function handleCallback(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const mtid = url.searchParams.get("mtid")
    if (!mtid) {
      return NextResponse.redirect(new URL(`/purchase/result?status=error`, req.url))
    }

    const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID!
    const SALT_KEY = process.env.PHONEPE_SALT_KEY!
    const SALT_INDEX = process.env.PHONEPE_SALT_INDEX!
    const BASE_URL = process.env.PHONEPE_BASE_URL!
    if (!MERCHANT_ID || !SALT_KEY || !SALT_INDEX || !BASE_URL) {
      return NextResponse.redirect(new URL(`/purchase/result?status=error`, req.url))
    }

    const path = `/pg/v1/status/${MERCHANT_ID}/${mtid}`
    const checksum =
      crypto
        .createHash("sha256")
        .update(path + SALT_KEY)
        .digest("hex") +
      "###" +
      SALT_INDEX

    const resp = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": MERCHANT_ID,
      },
    })
    const data = await resp.json()

    const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const success =
      (data?.success === true && (data?.code === "PAYMENT_SUCCESS" || data?.data?.state === "COMPLETED")) ||
      data?.data?.responseCode === "SUCCESS"

    const { data: purchase, error: purchaseErr } = await admin
      .from("authorship_purchases")
      .select("id, upcoming_book_id, positions_purchased")
      .eq("payment_id", mtid)
      .maybeSingle()

    if (!purchase || purchaseErr) {
      const dest = new URL(`/purchase/result`, req.url)
      dest.searchParams.set("status", success ? "success" : "failed")
      dest.searchParams.set("mtid", mtid)
      return NextResponse.redirect(dest)
    }

    await admin
      .from("authorship_purchases")
      .update({
        payment_status: success ? "success" : "failed",
      })
      .eq("id", purchase.id)

    if (success) {
      await admin.rpc("decrement_available_positions", {
        p_book_id: purchase.upcoming_book_id,
        p_positions: purchase.positions_purchased,
      })
    }

    const dest = new URL(`/purchase/result`, req.url)
    dest.searchParams.set("status", success ? "success" : "failed")
    dest.searchParams.set("mtid", mtid)
    return NextResponse.redirect(dest)
  } catch {
    return NextResponse.redirect(new URL(`/purchase/result?status=error`, req.url))
  }
}
