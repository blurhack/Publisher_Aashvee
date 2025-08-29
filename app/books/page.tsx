import Link from "next/link"
import { createServerClient } from "@supabase/ssr"
import { cookies, headers } from "next/headers"

type BookItem = {
  id: string
  slug: string
  title: string
  price_per_position: number
  available_positions: number
}

export default async function BooksIndexPage() {
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

  const { data: books, error } = await supabase
    .from("upcoming_books")
    .select("id, slug, title, price_per_position, available_positions")
    .eq("status", "published")
    .order("created_at", { ascending: false })

  const list = (books ?? []) as BookItem[]

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">Upcoming Books</h1>
        <p className="mt-2 text-muted-foreground">
          Secure co‑authorship positions in our upcoming titles. Each book has a limited number of positions.
        </p>
      </header>

      {error && (
        <div className="rounded-md border p-4 text-sm text-red-600">Failed to load books. Please try again later.</div>
      )}

      {list.length === 0 ? (
        <div className="rounded-md border p-6 text-center text-muted-foreground">
          No books available yet. Please check back soon.
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <li key={b.id} className="rounded-lg border p-4">
              <h3 className="font-medium">{b.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                From ₹{b.price_per_position} per position · {b.available_positions} available
              </p>
              <Link className="inline-flex mt-4 text-sm underline underline-offset-4" href={`/books/${b.slug}`}>
                View & Purchase
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
