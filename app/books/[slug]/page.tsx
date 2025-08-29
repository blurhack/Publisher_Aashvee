import { createServerClient } from "@supabase/ssr"
import { cookies, headers } from "next/headers"
import Image from "next/image"
import PurchaseForm from "./purchase-form"

export default async function BookDetailPage({ params }: { params: { slug: string } }) {
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

  const { data: book, error } = await supabase
    .from("upcoming_books")
    .select(
      "id, slug, title, description, cover_image_url, total_author_positions, available_positions, price_per_position",
    )
    .eq("slug", params.slug)
    .maybeSingle()

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-sm text-red-600">Failed to load book: {error.message}</p>
      </main>
    )
  }

  if (!book) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-muted-foreground">Book not found.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted">
          <Image
            src={book.cover_image_url || "/placeholder.svg?height=600&width=450&query=book%20cover"}
            alt="Book cover"
            fill
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{book.title}</h1>
          <p className="mt-2 text-muted-foreground">{book.description || "More details coming soon."}</p>
          <p className="mt-4">
            <span className="font-medium">Price per position:</span> ₹{book.price_per_position}
          </p>
          <p className="mt-1 text-muted-foreground">
            {book.available_positions} of {book.total_author_positions} positions available
          </p>

          <div className="mt-8 rounded-lg border p-4">
            <PurchaseForm bookSlug={params.slug} pricePerPosition={book.price_per_position} />
          </div>
        </div>
      </div>
    </main>
  )
}
