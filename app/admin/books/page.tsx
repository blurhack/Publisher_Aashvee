"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"

type Book = {
  id: string
  slug: string
  title: string
  available_positions: number
  total_author_positions: number
  price_per_position: number
  status: string
}

export default function AdminBooksPage() {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    totalPositions: 10,
    availablePositions: 10,
    pricePerPosition: 1000,
  })
  const [message, setMessage] = useState<string | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)

  const baseUrl = useMemo(() => (typeof window !== "undefined" ? window.location.origin : ""), [])

  const load = async () => {
    try {
      const res = await fetch("/api/admin/books", { cache: "no-store" })
      const data = await res.json()
      if (res.ok) setBooks(data.books || [])
      else setMessage(data.error || "Failed to load books")
    } catch (e: any) {
      setMessage(e?.message || "Failed to load books")
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      const res = await fetch("/api/admin/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to create book")
      setMessage("Book saved.")
      setForm({
        title: "",
        slug: "",
        description: "",
        totalPositions: 10,
        availablePositions: 10,
        pricePerPosition: 1000,
      })
      load()
    } catch (err: any) {
      setMessage(err?.message || "Error")
    }
  }

  const updateField = async (b: Book, key: "available_positions" | "price_per_position", value: number) => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id, [key]: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Update failed")
      setBooks((prev) => prev.map((x) => (x.id === b.id ? { ...x, ...data.book } : x)))
      setMessage("Book updated.")
    } catch (e: any) {
      setMessage(e?.message || "Update failed")
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async (slug: string) => {
    const url = `${baseUrl}/books/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      setMessage("Link copied to clipboard")
    } catch {
      setMessage(url)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Admin · Upcoming Books</h1>
      <section className="mt-6">
        <h2 className="text-lg font-medium">Create Upcoming Book</h2>
        <form onSubmit={submit} className="mt-4 grid gap-4">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Slug</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              className="mt-1 w-full rounded-md border px-3 py-2"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Total positions</label>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={form.totalPositions}
                onChange={(e) => setForm({ ...form, totalPositions: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Available</label>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={form.availablePositions}
                onChange={(e) => setForm({ ...form, availablePositions: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Price (₹)</label>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={form.pricePerPosition}
                onChange={(e) => setForm({ ...form, pricePerPosition: Number(e.target.value) })}
                required
              />
            </div>
          </div>
          <button className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-background">
            Save
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Existing Books</h2>
        <div className="mt-4 overflow-x-auto rounded-md border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Slug</th>
                <th className="px-3 py-2 text-left">Available</th>
                <th className="px-3 py-2 text-left">Price (₹)</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-muted-foreground" colSpan={5}>
                    No books yet.
                  </td>
                </tr>
              ) : (
                books.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-3 py-2">{b.title}</td>
                    <td className="px-3 py-2">{b.slug}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        className="w-24 rounded-md border px-2 py-1"
                        value={b.available_positions}
                        onChange={(e) =>
                          setBooks((prev) =>
                            prev.map((x) =>
                              x.id === b.id ? { ...x, available_positions: Number(e.target.value) } : x,
                            ),
                          )
                        }
                        onBlur={(e) => updateField(b, "available_positions", Number(e.target.value))}
                      />
                      <span className="ml-2 text-muted-foreground">/ {b.total_author_positions}</span>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        className="w-28 rounded-md border px-2 py-1"
                        value={b.price_per_position}
                        onChange={(e) =>
                          setBooks((prev) =>
                            prev.map((x) => (x.id === b.id ? { ...x, price_per_position: Number(e.target.value) } : x)),
                          )
                        }
                        onBlur={(e) => updateField(b, "price_per_position", Number(e.target.value))}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        className="rounded-md border px-3 py-1 text-xs"
                        onClick={() => copyLink(b.slug)}
                        disabled={!baseUrl}
                      >
                        Copy Link
                      </button>
                      <a
                        className="ml-2 text-xs underline underline-offset-4"
                        href={`/books/${b.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
      {loading && <p className="mt-2 text-xs text-muted-foreground">Saving…</p>}
    </main>
  )
}
