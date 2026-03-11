export const shortenText = (text: string, n: number) => {
  if (text.length > n) {
    const shortenedText = text.substring(0, n).concat('...')
    return shortenedText
  }
  return text
}