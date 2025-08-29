"use client"

import type React from "react"

import { useState } from "react"

export default function PurchaseForm({ bookSlug, pricePerPosition }: { bookSlug: string; pricePerPosition: number }) {
  const [count, setCount] = useState(1)
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [accept, setAccept] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = pricePerPosition * count

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const createResp = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookSlug, count, email, phone, bio, imageUrl }),
      })

      if (createResp.status === 401) {
        const next = `/books/${bookSlug}`
        window.location.href = `/auth/sign-in?next=${encodeURIComponent(next)}`
        return
      }

      const createData = await createResp.json()
      if (!createResp.ok) throw new Error(createData?.error || "Failed to create order")

      const payResp = await fetch("/api/checkout/phonepe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: createData.amount,
          merchantTransactionId: createData.merchantTransactionId,
          bookSlug,
          count,
        }),
      })
      const payData = await payResp.json()
      if (!payResp.ok) throw new Error(payData?.error || "Failed to initiate payment")

      const url =
        payData?.instrumentResponse?.instrumentResponse?.redirectInfo?.url ||
        payData?.instrumentResponse?.redirectInfo?.url

      if (!url) throw new Error("Invalid payment response")
      window.location.href = url
    } catch (err: any) {
      setError(err?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Short bio (optional)</label>
        <textarea
          className="mt-1 w-full rounded-md border px-3 py-2"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Profile image URL (optional)</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="/images/me.jpg"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Positions</label>
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            required
          />
        </div>
        <div className="col-span-2 flex items-end">
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-medium">₹{isNaN(total) ? 0 : total}</span>
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={accept}
          onChange={(e) => setAccept(e.target.checked)}
          required
        />
        <span>
          I agree to the{" "}
          <a href="/terms" className="underline underline-offset-4">
            Terms & Conditions
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </a>
          .
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={loading || !accept}
        className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-50"
      >
        {loading ? "Redirecting…" : "Proceed to Payment"}
      </button>
    </form>
  )
}
