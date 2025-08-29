export default function PurchaseResultPage({
  searchParams,
}: {
  searchParams: { status?: "success" | "failed" | "error" | string; mtid?: string }
}) {
  const status = (searchParams?.status as "success" | "failed" | "error" | undefined) || "error"
  const mtid = searchParams?.mtid || ""

  let title = "Payment Status"
  let desc =
    "We are verifying your payment and allocating your co‑authorship positions. You will receive an email confirmation shortly."
  let tone = "text-foreground"
  if (status === "success") {
    title = "Payment Successful"
    desc =
      "Your co‑authorship positions have been allocated. You will receive a confirmation email shortly. You can review or update your profile anytime."
    tone = "text-green-600"
  } else if (status === "failed") {
    title = "Payment Failed"
    desc =
      "We could not process your payment. No amount was captured. You can return to the book page to try again, or contact support if you were charged."
    tone = "text-red-600"
  } else if (status === "error") {
    title = "Payment Error"
    desc = "Something went wrong while verifying your payment. Please try again or contact support."
    tone = "text-red-600"
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12 text-center">
      <h1 className={`text-2xl font-semibold tracking-tight ${tone}`}>{title}</h1>
      <p className="mt-2 text-muted-foreground">Transaction ID: {mtid || "—"}</p>
      <p className="mt-6">{desc}</p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <a className="rounded-md border px-4 py-2 text-sm" href="/books">
          Back to Books
        </a>
        <a className="rounded-md bg-foreground px-4 py-2 text-sm text-background" href="/profile">
          Go to Profile
        </a>
      </div>
    </main>
  )
}
