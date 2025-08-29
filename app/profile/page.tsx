"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

function getSupabaseClient() {
  let client: ReturnType<typeof createBrowserClient> | null = (globalThis as any).__sb_profile
  if (!client) {
    client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    ;(globalThis as any).__sb_profile = client
  }
  return client
}

export default function ProfilePage() {
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string>("")
  const [fullName, setFullName] = useState<string>("")
  const [phone, setPhone] = useState<string>("")
  const [bio, setBio] = useState<string>("")
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { data: auth } = await supabase.auth.getUser()
        const u = auth?.user
        if (!u) {
          window.location.href = `/auth/sign-in?next=${encodeURIComponent("/profile")}`
          return
        }
        setUserId(u.id)
        setEmail(u.email || "")

        const { data: row } = await supabase.from("profiles").select("*").eq("user_id", u.id).maybeSingle()
        if (row) {
          setFullName(row.full_name || "")
          setPhone(row.phone || "")
          setBio(row.bio || "")
          setAvatarUrl(row.avatar_url || "")
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load profile")
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onUpload = async (file: File) => {
    if (!userId) return
    setUploading(true)
    setError(null)
    try {
      const ext = file.name.split(".").pop()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      })
      if (upErr) throw upErr
      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      const url = data?.publicUrl || ""
      setAvatarUrl(url)
      setMessage("Image uploaded.")
    } catch (e: any) {
      setError(e?.message || "Upload failed (ensure a public 'avatars' bucket exists).")
    } finally {
      setUploading(false)
    }
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    try {
      if (!userId) throw new Error("Not authenticated")
      // Try to find a record first
      const { data: existing } = await supabase.from("profiles").select("id").eq("user_id", userId).maybeSingle()
      if (existing) {
        const { error: upErr } = await supabase
          .from("profiles")
          .update({ full_name: fullName, phone, bio, avatar_url: avatarUrl, email })
          .eq("id", existing.id)
        if (upErr) throw upErr
      } else {
        const { error: insErr } = await supabase
          .from("profiles")
          .insert({ user_id: userId, full_name: fullName, phone, bio, avatar_url: avatarUrl, email })
        if (insErr) throw insErr
      }
      setMessage("Profile saved.")
    } catch (e: any) {
      setError(e?.message || "Save failed")
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <p>Loading…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Your Profile</h1>
      <form onSubmit={onSave} className="mt-6 grid gap-4">
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
          <label className="block text-sm font-medium">Full name</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Short bio</label>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Avatar</label>
          {avatarUrl && (
            <img
              src={avatarUrl || "/placeholder.svg"}
              alt="Avatar"
              className="mt-2 h-24 w-24 rounded-full border object-cover"
            />
          )}
          <input
            className="mt-2 block w-full text-sm"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onUpload(f)
            }}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        <button className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-background">
          Save
        </button>
      </form>
    </main>
  )
}
