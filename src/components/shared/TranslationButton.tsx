'use client'

import { Languages, Loader2 } from 'lucide-react'

import { useState } from 'react'

import { useTranslate } from '@/ahooks/useTranslate'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

const LANGUAGES = [
  { label: 'EN', value: 'en' },
  { label: 'DE', value: 'de' },
  { label: 'UK', value: 'uk' },
  { label: 'RU', value: 'ru' },
]

type SmartTranslateProps = {
  firstText: string
  secondText: string
  onFirstTranslated: (translatedText: string) => void
  onSecondTranslated: (translatedText: string) => void
  defaultFirstLang?: string
  defaultSecondLang?: string
}

export const SmartTranslate = ({
  firstText,
  secondText,
  onFirstTranslated,
  onSecondTranslated,
  defaultFirstLang = 'uk',
  defaultSecondLang = 'en',
}: SmartTranslateProps) => {
  const [firstLang, setFirstLang] = useState(defaultFirstLang)
  const [secondLang, setSecondLang] = useState(defaultSecondLang)
  const { mutateAsync, isPending } = useTranslate()

  const normalizedFirst = firstText.trim()
  const normalizedSecond = secondText.trim()
  const canTranslate =
    (normalizedFirst.length > 0 && normalizedSecond.length === 0) ||
    (normalizedSecond.length > 0 && normalizedFirst.length === 0)

  const onTranslate = async () => {
    if (!canTranslate) return

    try {
      if (normalizedFirst.length > 0 && normalizedSecond.length === 0) {
        const data = await mutateAsync({
          text: normalizedFirst,
          source: firstLang,
          target: secondLang,
        })
        onSecondTranslated(data.text)
      } else if (normalizedSecond.length > 0 && normalizedFirst.length === 0) {
        const data = await mutateAsync({
          text: normalizedSecond,
          source: secondLang,
          target: firstLang,
        })
        onFirstTranslated(data.text)
      }
    } catch (error) {
      toast({
        title: 'Translation error',
        description: error instanceof Error ? error.message : 'Failed to translate text',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-md border bg-white p-2 shadow-sm">
      <select
        value={firstLang}
        onChange={(e) => setFirstLang(e.target.value)}
        className="border-none bg-transparent text-[10px] font-bold focus:ring-0"
      >
        {LANGUAGES.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={onTranslate}
        disabled={isPending || !canTranslate || firstLang === secondLang}
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
      </Button>

      <select
        value={secondLang}
        onChange={(e) => setSecondLang(e.target.value)}
        className="border-none bg-transparent text-[10px] font-bold focus:ring-0"
      >
        {LANGUAGES.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  )
}
