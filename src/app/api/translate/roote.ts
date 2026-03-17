import { NextResponse } from "next/server"

type TranslateRequestBody = {
  text?: unknown
  source?: unknown
  target?: unknown
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TranslateRequestBody
    const text = typeof body?.text === "string" ? body.text.trim() : ""
    const source = typeof body?.source === "string" ? body.source.trim() : "auto"
    const target = typeof body?.target === "string" ? body.target.trim() : ""
    const scriptUrl = process.env.GOOGLE_TRANSLATE_SCRIPT_URL

    if (!scriptUrl) {
      return NextResponse.json({ error: "GOOGLE_TRANSLATE_SCRIPT_URL is not set" }, { status: 500 })
    }

    if (!text || !target) {
      return NextResponse.json({ error: "Text and target are required" }, { status: 400 })
    }

    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, source, target }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Translate provider failed" }, { status: 502 })
    }

    const data = (await response.json()) as { text?: string }
    return NextResponse.json({ text: data?.text ?? "" })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to translate", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}