import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

/**
 * PhonePe checkout creation
 * Requirements (set in Project Settings as environment variables):
 * - PHONEPE_MERCHANT_ID
 * - PHONEPE_SALT_KEY
 * - PHONEPE_SALT_INDEX
 * - PHONEPE_BASE_URL (e.g., https://api-preprod.phonepe.com/apis/pg-sandbox or prod base)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, merchantTransactionId, userId, bookSlug, count } = body

    if (!amount || !merchantTransactionId || !bookSlug || !count) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 })
    }

    const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID!
    const SALT_KEY = process.env.PHONEPE_SALT_KEY!
    const SALT_INDEX = process.env.PHONEPE_SALT_INDEX!
    const BASE_URL = process.env.PHONEPE_BASE_URL!

    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: String(userId || "guest"),
      amount: Math.round(Number(amount) * 100), // paise
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/checkout/phonepe/callback?mtid=${merchantTransactionId}`,
      redirectMode: "POST",
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/checkout/phonepe/callback?mtid=${merchantTransactionId}`,
      paymentInstrument: { type: "PAY_PAGE" },
    }

    const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64")
    const checksum =
      crypto
        .createHash("sha256")
        .update(payloadStr + "/pg/v1/pay" + SALT_KEY)
        .digest("hex") +
      "###" +
      SALT_INDEX

    const resp = await fetch(`${BASE_URL}/pg/v1/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": MERCHANT_ID,
      },
      body: JSON.stringify({ request: payloadStr }),
    })

    const data = await resp.json()
    if (!resp.ok || data?.success !== true) {
      return NextResponse.json({ error: "PhonePe error", details: data }, { status: 400 })
    }

    return NextResponse.json({ instrumentResponse: data?.data }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}
