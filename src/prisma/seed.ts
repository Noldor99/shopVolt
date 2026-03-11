import { prisma } from "./prisma-client";
import { categories_data } from "./categoriey-const";
import {
  products as tabletProducts,
  ram_data,
  features_data,
  internalStorage,
  os_data,
  colors_data
} from "./constants-tables";
import {
  products as monitorProducts,
  diagonal_data,
  refresh_rate_data
} from "./constants-monitors";
import { hashSync } from 'bcrypt';


interface TranslationItem {
  ua: { key: string; value: string };
  en: { key: string; value: string };
}

interface SourceProduct {
  id?: string;
  sku?: string;
  title?: string;
  title_en?: string;
  description?: string;
  description_en?: string;
  brand?: string;
  image?: string;
  slider_images?: string[];
  price_uah?: number;
  old_price_uah?: number;
  rating?: number;
  reviews_count?: number;
  in_stock?: boolean;
  stock_count?: number;
  diagonal?: string;
  refresh_rate?: string;
  color?: string;
  ram?: string;
  os?: string;
}

type ParsedSpecs = {
  ram: string | null;
  storage: string | null;
}

const getTranslation = (dataArray: TranslationItem[], value: string | undefined) => {
  if (!value) return [];
  const found = dataArray.find(
    (item) => item.en.value === value || item.ua.value === value
  );
  return found ? [
    { locale: "ua", key: found.ua.key, value: found.ua.value },
    { locale: "en", key: found.en.key, value: found.en.value }
  ] : [];
};

const extractRamAndStorageFromTitle = (title?: string): ParsedSpecs => {
  if (!title) return { ram: null, storage: null };

  const normalizedTitle = title.replace(/,/g, ".");
  const patterns = [
    /(\d+(?:\.\d+)?)\s*\/\s*(\d+)\s*(?:GB|ГБ|TB|ТБ)\b/i,
    /(\d+(?:\.\d+)?)\s*(?:GB|ГБ)\s*\/\s*(\d+)\s*(?:GB|ГБ|TB|ТБ)\b/i,
  ];

  for (const pattern of patterns) {
    const match = normalizedTitle.match(pattern);
    if (!match) continue;

    const ram = `${match[1]} GB`;
    const storage = match[2];
    return { ram, storage };
  }

  return { ram: null, storage: null };
};

const getStorageTranslations = (storageValue: string | null) => {
  if (!storageValue) return [];

  const normalizedStorage = storageValue.replace(/\D+/g, "");
  if (!normalizedStorage) return [];

  const found = internalStorage.find((item) => item.value === normalizedStorage);
  if (!found) return [];

  return [
    { locale: "ua", key: "Внутрішня пам'ять", value: found.label.ua },
    { locale: "en", key: "Internal storage", value: found.label.en },
  ];
};

const getDetectedFeatures = (title?: string) => {
  if (!title) return [] as string[];
  const normalizedTitle = title.toLowerCase();
  const detected = new Set<string>();

  const featureMatchers: Array<{ value: string; checks: string[] }> = [
    { value: "Зі стилусом", checks: [" pen", " stylus", "стилус"] },
    { value: "З клавіатурою", checks: ["keyboard", "клавіатур"] },
    { value: "Протиударні", checks: ["протиудар"] },
    { value: "Водонепроникні", checks: ["waterproof", "захищен"] },
  ];

  for (const matcher of featureMatchers) {
    if (matcher.checks.some((check) => normalizedTitle.includes(check))) {
      detected.add(matcher.value);
    }
  }

  return [...detected];
};

async function down() {
  console.log("Cleaning database...");
  // Видаляємо в правильному порядку (спочатку залежні таблиці)
  await prisma.deviceInfoTranslation.deleteMany();
  await prisma.deviceInfo.deleteMany();
  await prisma.deviceTranslation.deleteMany();
  await prisma.device.deleteMany();
  await prisma.categoryTranslation.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
}

async function up() {

  await prisma.user.createMany({
    data: [
      {
        fullName: 'User',
        email: 'user@test.ru',
        password: hashSync('111111', 10),
        verified: new Date(),
        role: 'USER',
      },
      {
        fullName: 'Admin',
        email: 'admin@test.ru',
        password: hashSync('111111', 10),
        verified: new Date(),
        role: 'ADMIN',
      },
    ],
  });

  console.log("Seeding categories...");
  for (const cat of categories_data) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        slug: cat.slug,
        translations: {
          create: [
            { locale: "ua", name: cat.ua },
            { locale: "en", name: cat.en },
          ],
        },
      },
    });
  }

  const allCategories = await prisma.category.findMany();

  const seedProducts = async (products: SourceProduct[], type: "TABLET" | "MONITOR", categorySlug: string) => {
    // Виправляємо помилку TS7006: вказуємо тип для 'c'
    const category = allCategories.find((c: { slug: string; id: number }) => c.slug === categorySlug);
    if (!category) {
      console.warn(`Category with slug ${categorySlug} not found!`);
      return;
    }

    for (const p of products) {
      const brand = await prisma.brand.upsert({
        where: { name: p.brand || "Unknown" },
        update: {},
        create: { name: p.brand || "Unknown" },
      });

      const infoItems: any[] = [];

      if (type === "MONITOR") {
        const diag = getTranslation(diagonal_data as any, p.diagonal);
        if (diag.length) infoItems.push({ translations: { create: diag } });

        const rate = getTranslation(refresh_rate_data as any, p.refresh_rate);
        if (rate.length) infoItems.push({ translations: { create: rate } });
      }

      if (type === "TABLET") {
        const parsedSpecs = extractRamAndStorageFromTitle(p.title);

        const ram = getTranslation(ram_data as any, p.ram || parsedSpecs.ram || undefined);
        if (ram.length) infoItems.push({ translations: { create: ram } });

        const storage = getStorageTranslations(parsedSpecs.storage);
        if (storage.length) infoItems.push({ translations: { create: storage } });

        const detectedFeatures = getDetectedFeatures(p.title);
        for (const featureValue of detectedFeatures) {
          const feature = getTranslation(features_data as any, featureValue);
          if (feature.length) infoItems.push({ translations: { create: feature } });
        }

        const os = getTranslation(os_data as any, p.os);
        if (os.length) infoItems.push({ translations: { create: os } });
      }

      const color = getTranslation(colors_data as any, p.color);
      if (color.length) infoItems.push({ translations: { create: color } });

      const titleUa = p.title || "";
      const titleEn = p.title_en || p.title || "";
      const descriptionUa = p.description || "";
      const descriptionEn = p.description_en || p.description || "";

      await prisma.device.upsert({
        where: { slug: p.id || p.sku },
        update: {
          imageUrl: p.image || "",
          imageUrls: Array.isArray(p.slider_images) ? p.slider_images : [],
          deviceType: type,
          priceUah: p.price_uah || 0,
          oldPriceUah: p.old_price_uah || 0,
          rating: p.rating || 0,
          reviewsCount: p.reviews_count || 0,
          inStock: p.in_stock ?? true,
          stockCount: p.stock_count || 0,
          categoryId: category.id,
          brandId: brand.id,
          translations: {
            deleteMany: {},
            create: [
              { locale: "ua", name: titleUa, description: descriptionUa },
              { locale: "en", name: titleEn, description: descriptionEn },
            ],
          },
          info: {
            deleteMany: {},
            create: infoItems,
          },
        },
        create: {
          slug: p.id || p.sku,
          imageUrl: p.image || "",
          imageUrls: Array.isArray(p.slider_images) ? p.slider_images : [],
          deviceType: type,
          priceUah: p.price_uah || 0,
          oldPriceUah: p.old_price_uah || 0,
          rating: p.rating || 0,
          reviewsCount: p.reviews_count || 0,
          inStock: p.in_stock ?? true,
          stockCount: p.stock_count || 0,
          categoryId: category.id,
          brandId: brand.id,
          translations: {
            create: [
              { locale: "ua", name: titleUa, description: descriptionUa },
              { locale: "en", name: titleEn, description: descriptionEn },
            ],
          },
          info: {
            create: infoItems,
          },
        },
      });
    }
  };

  console.log("Seeding tablets...");
  await seedProducts(tabletProducts, "TABLET", "tablets");

  console.log("Seeding monitors...");
  await seedProducts(monitorProducts, "MONITOR", "monitors");
}

async function main() {
  try {
    await down();
    await up();
    console.log("Seed finished successfully!");
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();