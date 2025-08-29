"use client"

import Link from "next/link"

export default function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-xl">
          Bibliotheca Nexus
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/books" className="hover:underline underline-offset-4">
            Books
          </Link>
          <Link href="/admin/books" className="hover:underline underline-offset-4">
            Admin
          </Link>
          <Link href="/terms" className="hover:underline underline-offset-4">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </div>
    </header>
  )
}
