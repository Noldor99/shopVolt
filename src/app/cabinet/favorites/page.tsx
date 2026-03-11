import { FavoritesClient } from './_components/FavoritesClient'

export const generateMetadata = async () => {
  return {
    title: 'Обране',
    description: 'V3V - Обрані товари',
  }
}

const FavoritesPage = async () => {
  return (
    <>
      <h1 className="text-3xl font-black uppercase">Обране</h1>
      <p className="mt-2 text-sm text-slate-600">Товари, які ви додали до обраного.</p>
      <FavoritesClient />
    </>
  )
}

export default FavoritesPage
