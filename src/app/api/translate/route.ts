import { NextResponse } from "next/server"

type TranslateRequestBody = {
  text?: unknown
  source?: unknown
  target?: unknown
}

const normalizeLangCode = (value: string) => {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return "auto"
  if (normalized === "ua") return "uk"
  return normalized
}

const extractTranslatedText = (raw: unknown) => {
  if (!Array.isArray(raw) || !Array.isArray(raw[0])) return ""
  const chunks = raw[0] as unknown[]
  return chunks
    .map((chunk) => (Array.isArray(chunk) && typeof chunk[0] === "string" ? chunk[0] : ""))
    .join("")
    .trim()
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TranslateRequestBody
    const text = typeof body?.text === "string" ? body.text.trim() : ""
    const source = normalizeLangCode(typeof body?.source === "string" ? body.source : "auto")
    const target = normalizeLangCode(typeof body?.target === "string" ? body.target : "")
    const scriptUrl = process.env.GOOGLE_TRANSLATE_SCRIPT_URL

    if (!text || !target) {
      return NextResponse.json({ error: "Text and target are required" }, { status: 400 })
    }

    let translatedText = ""
    let usedMethod: "script" | "public_fallback" | "none" = "none"

    if (scriptUrl) {
      try {
        const response = await fetch(scriptUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, source, target }),
        })

        if (response.ok) {
          const data = (await response.json()) as { text?: string }
          translatedText = typeof data?.text === "string" ? data.text.trim() : ""
          if (translatedText) usedMethod = "script"
        }
      } catch {
        translatedText = ""
      }
    }

    if (!translatedText) {
      const fallbackResponse = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
          source
        )}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`
      )

      if (!fallbackResponse.ok) {
        return NextResponse.json({ error: "Translate provider failed" }, { status: 502 })
      }

      const fallbackData = (await fallbackResponse.json()) as unknown
      translatedText = extractTranslatedText(fallbackData)
      if (translatedText) usedMethod = "public_fallback"
    }

    if (!translatedText) {
      return NextResponse.json({ error: "Empty translation response" }, { status: 502 })
    }

    console.log("[translate] method=%s source=%s target=%s", usedMethod, source, target)

    return NextResponse.json({ text: translatedText })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to translate", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
