import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

function getSSRClient(req: NextRequest) {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
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
  } as any)
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSSRClient(req)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Get existing profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone, bio, avatar_url, user_id")
      .eq("user_id", user.id)
      .maybeSingle()

    return NextResponse.json({ user: { id: user.id, email: user.email }, profile })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSSRClient(req)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const payload = {
      user_id: user.id,
      full_name: body?.full_name ?? null,
      email: body?.email ?? user.email ?? null,
      phone: body?.phone ?? null,
      bio: body?.bio ?? null,
      avatar_url: body?.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select("full_name, email, phone, bio, avatar_url")
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 403 })
    return NextResponse.json({ ok: true, profile: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}
