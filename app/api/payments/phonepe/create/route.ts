import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, orderId, userEmail, redirectUrl, callbackUrl } = await req.json()

    // Validate env vars
    const merchantId = process.env.PHONEPE_MERCHANT_ID
    const saltKey = process.env.PHONEPE_SALT_KEY
    const saltIndex = process.env.PHONEPE_SALT_INDEX
    const base = process.env.PHONEPE_BASE_URL || "https://api.phonepe.com/apis/hermes"

    if (!merchantId || !saltKey || !saltIndex) {
      return NextResponse.json({ error: "PhonePe env vars missing" }, { status: 500 })
    }

    // TODO: Construct payload as per PhonePe docs (amount in paise, checksum using SHA256 + base64)
    // This is a scaffold; implement exact fields per account configuration.
    const payload = {
      merchantId,
      amount: amount * 100, // PhonePe expects paise
      merchantTransactionId: orderId,
      merchantUserId: userEmail || "user",
      redirectUrl,
      callbackUrl,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    }

    // TODO: compute X-VERIFY checksum header using payload + path + salt key and salt index
    // Placeholder headers:
    const headers = {
      "Content-Type": "application/json",
      // "X-VERIFY": checksum,
      "X-MERCHANT-ID": merchantId,
    } as any

    const resp = await fetch(`${base}/pg/v1/pay`, {
      method: "POST",
      headers,
      body: JSON.stringify({ request: Buffer.from(JSON.stringify(payload)).toString("base64") }),
    })

    const data = await resp.json()
    // The response should include a redirect URL (instrumentResponse.redirectInfo.url)
    const checkoutUrl =
      data?.data?.instrumentResponse?.redirectInfo?.url || data?.data?.redirectUrl || data?.redirectUrl || null

    if (!checkoutUrl) {
      return NextResponse.json({ error: "No redirect URL from PhonePe" }, { status: 500 })
    }

    return NextResponse.json({ checkoutUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Payment init error" }, { status: 500 })
  }
}
