import { parsePhoneNumberFromString } from 'libphonenumber-js'

const DEFAULT_COUNTRY = 'UA'

export const PHONE_VALIDATION_MESSAGE =
  'Вкажіть телефон у міжнародному форматі, наприклад +380XXXXXXXXX'

export const toE164PhoneOrNull = (value: string) => {
  const normalized = value.trim()
  if (!normalized) return null

  const parsed = parsePhoneNumberFromString(normalized, DEFAULT_COUNTRY)
  if (!parsed || !parsed.isValid()) {
    return null
  }

  return parsed.number
}
