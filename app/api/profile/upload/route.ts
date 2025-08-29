import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { getServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
        },
        headers: {
          get(key: string) {
            return req.headers.get(key) ?? undefined
          },
        },
      } as any,
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 })

    const bytes = Buffer.from(await file.arrayBuffer())
    const ext = (file.name.split(".").pop() || "bin").toLowerCase()
    const path = `${user.id}/${Date.now()}.${ext}`

    const svc = getServiceClient()

    // Ensure bucket exists (best-effort); if not, return a clear error
    // Note: Creating buckets programmatically is not officially supported via JS client in all environments.
    // Expect the "avatars" bucket to exist and be public.
    const upload = await svc.storage.from("avatars").upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    })

    if (upload.error) {
      return NextResponse.json({ error: upload.error.message }, { status: 400 })
    }

    const { data: pub } = svc.storage.from("avatars").getPublicUrl(path)
    const publicUrl = pub?.publicUrl
    return NextResponse.json({ ok: true, path, publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}
