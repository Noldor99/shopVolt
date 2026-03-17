import {
  colors,
  features,
  internalStorage, matrixTypes,
  os, processors,
  ram as ramOptions, wireless
} from "@/prisma/constants-tables"

import {
  backlight as monitorBacklight,
  brand as monitorBrand,
  diagonal as monitorDiagonal,
  display_tech as monitorDisplayTech,
  monitorDevices as monitorProducts,
  refresh_rate as monitorRefreshRate,
  resolution as monitorResolution,
} from "@/prisma/constants-monitors"

import type { FilterConfig } from "@/types/filter"

const colorOptions = colors.map((item) => item.ua.value)
const ramFilterOptions = ramOptions.map((item) => item.ua.value)
const osFilterOptions = os.map((item) => item.ua.value)
const featureOptions = features.map((item) => item.ua.value)
const storageOptions = internalStorage.map((item) => item.label.ua)
const monitorDiagonalOptions = monitorDiagonal.map((item) => item.ua.value)
const monitorRefreshRateOptions = monitorRefreshRate.map((item) => item.ua.value)

export const TABLET_FILTERS: FilterConfig[] = [
  {
    id: "ram",
    title: "Оперативна пам'ять",
    options: ramFilterOptions,
  },
  {
    id: "storage",
    title: "Внутрішня пам'ять",
    options: storageOptions,
  },
  {
    id: "os",
    title: "Операційна система",
    options: osFilterOptions,
  },
  {
    id: "matrix",
    title: "Тип матриці",
    options: matrixTypes,
  },
  {
    id: "processor",
    title: "Процесор",
    options: processors,
  },
  {
    id: "wireless",
    title: "Бездротові мережі",
    options: wireless,
  },
  {
    id: "features",
    title: "Особливості",
    options: featureOptions,
  },
  {
    id: "color",
    title: "Колір",
    options: colorOptions,
  },
]

const monitorColors = [...new Set(monitorProducts.map((item) => item.color).filter(Boolean))]

export const MONITOR_FILTERS: FilterConfig[] = [
  {
    id: "brand",
    title: "Бренд",
    options: monitorBrand,
  },
  {
    id: "diagonal",
    title: "Діагональ",
    options: monitorDiagonalOptions,
  },
  {
    id: "displayTech",
    title: "Технологія дисплея",
    options: monitorDisplayTech,
  },
  {
    id: "resolution",
    title: "Роздільна здатність",
    options: monitorResolution,
  },
  {
    id: "refreshRate",
    title: "Частота оновлення",
    options: monitorRefreshRateOptions,
  },
  {
    id: "backlight",
    title: "Підсвітка",
    options: monitorBacklight,
  },
  {
    id: "color",
    title: "Колір",
    options: monitorColors,
  },
]
