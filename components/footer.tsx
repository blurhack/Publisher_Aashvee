"use client"

import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-center md:text-left">© {new Date().getFullYear()} Bibliotheca Nexus. All rights reserved.</p>
        <nav className="flex items-center gap-6">
          <Link href="/terms" className="hover:text-foreground underline-offset-4 hover:underline">
            Terms & Conditions
          </Link>
          <Link href="/privacy" className="hover:text-foreground underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  )
}
