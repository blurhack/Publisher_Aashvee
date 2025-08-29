import { NextResponse, type NextRequest } from "next/server"
import { getServiceClient } from "@/lib/supabase/service"
import { createServerClient } from "@supabase/ssr"

export async function POST(req: NextRequest) {
  try {
    // Check current user via anon key (session cookies)
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

    const svc = getServiceClient()

    // If there are already admins, do nothing
    const { data: admins, error: adminErr } = await svc.from("user_roles").select("id").eq("role", "admin").limit(1)

    if (adminErr) return NextResponse.json({ error: adminErr.message }, { status: 500 })
    if (admins && admins.length > 0) {
      return NextResponse.json({ ok: true, message: "Admin already present" })
    }

    const { error: grantErr } = await svc.from("user_roles").insert({
      user_id: user.id,
      role: "admin",
    })

    if (grantErr) return NextResponse.json({ error: grantErr.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: "Admin role granted to current user" })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}
