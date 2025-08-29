"use client"

import Link from "next/link"
import { useEffect } from "react"

export default function NotFound() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("404 Error: User attempted to access non-existent route:", window.location.pathname)
    }
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-6 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Page not found</p>
        <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
          Return to Home
        </Link>
      </div>
    </main>
  )
}
