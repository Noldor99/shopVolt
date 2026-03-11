
const url = process.env.NEXT_PUBLIC_REVALIDATE_URL || 'http://localhost:3000/api'
const secret = process.env.NEXT_PUBLIC_TOKEN_REVALIDATE || 'simple'

export const urlRevalidate = (router: string) => {
  if (router.charAt(0) === '/') {
    router = router.slice(1);
  }

  fetch(
    `${url}/revalidate?path=/${router}&secret=${secret}`
  )
} 