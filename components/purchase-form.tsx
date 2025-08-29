"use client"

import type React from "react"

import { useState } from "react"

export default function PurchaseForm({
  slug,
  pricePerPosition,
  available,
  isLoggedIn,
}: {
  slug: string
  pricePerPosition: number
  available: number
  isLoggedIn: boolean
}) {
  const [positions, setPositions] = useState(1)
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const total = positions * (pricePerPosition || 0)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoggedIn) {
      window.location.href = `/auth/sign-in?next=/books/${slug}`
      return
    }
    if (!agree) return

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append("positions", String(positions))
      fd.append("phone", phone)
      fd.append("bio", bio)
      const res = await fetch(`/api/books/${slug}/purchase`, { method: "POST", body: fd })

      const json = await res.json()
      if (res.ok && json.checkoutUrl) {
        window.location.href = json.checkoutUrl
      } else if (res.status === 401) {
        window.location.href = `/auth/sign-in?next=/books/${slug}`
      } else {
        alert(json?.error || "Payment initialization failed")
      }
    } catch (err: any) {
      alert(err?.message || "Unexpected error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-md border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Positions</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={positions}
            onChange={(e) => setPositions(Number(e.target.value))}
          >
            {Array.from({ length: Math.max(available, 0) }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">Max available: {available}</p>
        </div>
        <div>
          <label className="block text-sm font-medium">Phone number</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
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
          placeholder="Tell us a little about yourself."
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="agree"
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="h-4 w-4"
          required
        />
        <label htmlFor="agree" className="text-sm">
          I agree to the{" "}
          <a href="/terms" className="underline underline-offset-4">
            Terms & Conditions
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </a>
          .
        </label>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm">
          Total: <span className="font-semibold">₹{total}</span>
        </p>
        <button
          disabled={loading || !agree || positions < 1 || positions > available || !isLoggedIn}
          className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-50"
        >
          {loading ? "Processing…" : "Proceed to Pay"}
        </button>
      </div>
    </form>
  )
}
