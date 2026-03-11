import { HomeSlider } from "./_components/home-slider"
import { categoryPrefetch } from "@/actions/server/categoryPrefetch"
import { devicePrefetch } from "@/actions/server/devicePrefetch"
import { localizeCategoryName } from "@/lib/localize-entities"
import { getServerLocale } from "@/lib/server-locale"

export const generateMetadata = async () => {
  return {
    title: "Home Page",
    description: "V3V - Home Page",
  }
}

const HomePage = async () => {
  const locale = await getServerLocale()
  const categories = (await categoryPrefetch({ lang: locale }))
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
    }))

  const devicesResponse = await devicePrefetch({
    lang: locale,
    page: 1,
    limit: 30,
    sortBy: "createdAt",
    sortOrder: "desc",
  })
  const devices = devicesResponse.data

  const categoryById = new Map(categories.map((item) => [item.id, item]))
  const slides = devices
    .filter((device) => device.categoryId && categoryById.has(device.categoryId))
    .slice(0, 8)
    .map((device) => {
      const category = categoryById.get(device.categoryId)
      return {
        id: device.slug,
        title: device.nameLocalized ?? device.name ?? device.slug,
        subtitle: category ? localizeCategoryName(category.slug, category.name, locale) : "",
        imageUrl: device.imageUrl,
        href: `/category/${category?.slug ?? ""}`,
      }
    })

  return (
    <section className="space-y-6">
      <HomeSlider slides={slides} />
    </section>
  )
}

export default HomePage
