import { prisma } from "./prisma-client";
import { categories_data } from "./categoriey-const";
import {
  ram, os, matrixTypes, processors, wireless, features, internalStorage, colors, tabletDevices
} from "./constants-tables";
import {
  brand,
  diagonal,
  display_tech, resolution, refresh_rate, backlight, monitorDevices
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
  display_tech?: string;
  resolution?: string;
  backlight?: string;
  color?: string;
  ram?: string;
  os?: string;
}

type ParsedSpecs = {
  ram: string | null;
  storage: string | null;
}

type InfoTranslationInput = {
  locale: "ua" | "en";
  key: string;
  value: string;
};

type SeedInfoItem = {
  translations: InfoTranslationInput[];
};

const VARIANT_ATTRIBUTE_CODES = new Set([
  "color",
  "kolir",
  "ram",
  "memory",
  "storage",
  "internal-storage",
  "vnutrishnia-pam-iat",
  "diagonal",
  "rozmir",
  "size",
]);

const VARIANT_ATTRIBUTE_KEYWORDS = [
  "колір",
  "color",
  "оперативна пам",
  "ram",
  "пам'ять",
  "память",
  "memory",
  "внутрішня",
  "internal storage",
  "storage",
  "діагональ",
  "diagonal",
  "розмір",
  "size",
];

const isVariantAttribute = (rawKey: string, code: string) => {
  const normalizedKey = rawKey.trim().toLowerCase();
  if (VARIANT_ATTRIBUTE_CODES.has(code)) return true;
  return VARIANT_ATTRIBUTE_KEYWORDS.some((keyword) => normalizedKey.includes(keyword));
};

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

const getPlainInfoTranslations = (
  value: string | undefined,
  uaKey: string,
  enKey: string
) => {
  if (!value) return [];
  return [
    { locale: "ua", key: uaKey, value },
    { locale: "en", key: enKey, value },
  ];
};

const normalizeText = (value?: string) => (value || "").toLowerCase();

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const toSeedCode = (value: string, prefix: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = hashString(value).slice(0, 6);
  const base = normalized || prefix;

  return `${base}-${suffix}`;
};

const detectFirstByTitle = (title: string | undefined, options: string[]) => {
  const normalizedTitle = normalizeText(title);
  if (!normalizedTitle) return null;

  for (const option of options) {
    if (normalizedTitle.includes(option.toLowerCase())) return option;
  }

  return null;
};

const detectWirelessFromTitle = (title?: string) => {
  const normalizedTitle = normalizeText(title);
  if (!normalizedTitle) return [] as string[];

  const detected = new Set<string>();

  if (normalizedTitle.includes("wi-fi") || normalizedTitle.includes("wifi")) detected.add("Wi-Fi");
  if (normalizedTitle.includes("bluetooth")) detected.add("Bluetooth");
  if (normalizedTitle.includes("5g")) detected.add("5G");
  if (normalizedTitle.includes("4g") || normalizedTitle.includes("lte")) detected.add("4G (LTE)");
  if (normalizedTitle.includes("3g") || normalizedTitle.includes("umts")) detected.add("3G (UMTS)");
  if (normalizedTitle.includes("nfc")) detected.add("NFC");

  return wireless.filter((item) => detected.has(item));
};

async function down() {
  console.log("Cleaning database...");

  await prisma.basketDevice.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.basket.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.order.deleteMany();

  await prisma.user.deleteMany();

  await prisma.deviceInfo.deleteMany();
  await prisma.deviceItemProperty.deleteMany();
  await prisma.deviceItem.deleteMany();
  await prisma.attributeValueTranslation.deleteMany();
  await prisma.attributeValue.deleteMany();
  await prisma.categoryAttribute.deleteMany();
  await prisma.attributeTranslation.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.deviceTranslation.deleteMany();
  await prisma.device.deleteMany();

  await prisma.categoryTranslation.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();

  console.log("Database cleaned!");
}
async function up() {
  const categoryAttributeSortOrder = new Map<number, number>();

  const ensureCategoryAttribute = async (categoryId: number, infoItem: SeedInfoItem) => {
    const uaTranslation = infoItem.translations.find((translation) => translation.locale === "ua");
    const enTranslation = infoItem.translations.find((translation) => translation.locale === "en");
    const fallbackTranslation = infoItem.translations[0];
    const rawKey = uaTranslation?.key || enTranslation?.key || fallbackTranslation?.key || "attribute";
    const code = toSeedCode(rawKey, "attribute");
    const isVariant = isVariantAttribute(rawKey, code);

    const attribute = await prisma.attribute.upsert({
      where: { code },
      update: {},
      create: { code },
      select: { id: true },
    });

    if (uaTranslation?.key) {
      await prisma.attributeTranslation.upsert({
        where: {
          attributeId_locale: {
            attributeId: attribute.id,
            locale: "ua",
          },
        },
        update: { name: uaTranslation.key },
        create: {
          attributeId: attribute.id,
          locale: "ua",
          name: uaTranslation.key,
        },
      });
    }

    if (enTranslation?.key) {
      await prisma.attributeTranslation.upsert({
        where: {
          attributeId_locale: {
            attributeId: attribute.id,
            locale: "en",
          },
        },
        update: { name: enTranslation.key },
        create: {
          attributeId: attribute.id,
          locale: "en",
          name: enTranslation.key,
        },
      });
    }

    const existingCategoryAttribute = await prisma.categoryAttribute.findUnique({
      where: {
        categoryId_attributeId: {
          categoryId,
          attributeId: attribute.id,
        },
      },
      select: { id: true, attributeId: true, isVariant: true },
    });

    if (existingCategoryAttribute) {
      if (existingCategoryAttribute.isVariant !== isVariant) {
        await prisma.categoryAttribute.update({
          where: { id: existingCategoryAttribute.id },
          data: { isVariant },
        });
      }

      return {
        categoryAttributeId: existingCategoryAttribute.id,
        attributeId: existingCategoryAttribute.attributeId,
      };
    }

    const nextSortOrder = categoryAttributeSortOrder.get(categoryId) ?? 0;
    const createdCategoryAttribute = await prisma.categoryAttribute.create({
      data: {
        categoryId,
        attributeId: attribute.id,
        isVariant,
        sortOrder: nextSortOrder,
      },
      select: { id: true, attributeId: true },
    });
    categoryAttributeSortOrder.set(categoryId, nextSortOrder + 1);

    return {
      categoryAttributeId: createdCategoryAttribute.id,
      attributeId: createdCategoryAttribute.attributeId,
    };
  };

  const ensureAttributeValue = async (attributeId: number, infoItem: SeedInfoItem) => {
    const uaTranslation = infoItem.translations.find((translation) => translation.locale === "ua");
    const enTranslation = infoItem.translations.find((translation) => translation.locale === "en");
    const fallbackTranslation = infoItem.translations[0];

    const rawValue = uaTranslation?.value || enTranslation?.value || fallbackTranslation?.value || "value";
    const code = toSeedCode(rawValue, "value");

    const attributeValue = await prisma.attributeValue.upsert({
      where: {
        attributeId_code: {
          attributeId,
          code,
        },
      },
      update: {},
      create: {
        attributeId,
        code,
      },
      select: { id: true },
    });

    if (uaTranslation?.value) {
      await prisma.attributeValueTranslation.upsert({
        where: {
          attributeValueId_locale: {
            attributeValueId: attributeValue.id,
            locale: "ua",
          },
        },
        update: { value: uaTranslation.value },
        create: {
          attributeValueId: attributeValue.id,
          locale: "ua",
          value: uaTranslation.value,
        },
      });
    }

    if (enTranslation?.value) {
      await prisma.attributeValueTranslation.upsert({
        where: {
          attributeValueId_locale: {
            attributeValueId: attributeValue.id,
            locale: "en",
          },
        },
        update: { value: enTranslation.value },
        create: {
          attributeValueId: attributeValue.id,
          locale: "en",
          value: enTranslation.value,
        },
      });
    }

    return attributeValue.id;
  };

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
      const brandName = p.brand?.trim() || "Unknown";
      const brandSlug = toSeedCode(brandName, "brand");
      const deviceBrand = await prisma.brand.upsert({
        where: { name: brandName },
        update: {
          slug: brandSlug,
          categories: {
            connect: { id: category.id },
          },
        },
        create: {
          name: brandName,
          slug: brandSlug,
          categories: {
            connect: { id: category.id },
          },
        },
      });

      const infoItems: SeedInfoItem[] = [];
      const pushInfoItem = (translations: InfoTranslationInput[]) => {
        if (!translations.length) return;
        infoItems.push({ translations });
      };

      if (type === "MONITOR") {
        const monitorBrandValue = brand.includes(p.brand || "") ? p.brand : undefined;
        const monitorBrandInfo = getPlainInfoTranslations(monitorBrandValue, "Бренд", "Brand");
        pushInfoItem(monitorBrandInfo as InfoTranslationInput[]);

        const diag = getTranslation(diagonal as TranslationItem[], p.diagonal);
        pushInfoItem(diag as InfoTranslationInput[]);

        const displayTechInfo = getPlainInfoTranslations(
          display_tech.includes(p.display_tech || "") ? p.display_tech : undefined,
          "Технологія дисплея",
          "Display technology"
        );
        pushInfoItem(displayTechInfo as InfoTranslationInput[]);

        const resolutionInfo = getPlainInfoTranslations(
          resolution.includes(p.resolution || "") ? p.resolution : undefined,
          "Роздільна здатність",
          "Resolution"
        );
        pushInfoItem(resolutionInfo as InfoTranslationInput[]);

        const rate = getTranslation(refresh_rate as TranslationItem[], p.refresh_rate);
        pushInfoItem(rate as InfoTranslationInput[]);

        const backlightInfo = getPlainInfoTranslations(
          backlight.includes(p.backlight || "") ? p.backlight : undefined,
          "Підсвітка",
          "Backlight"
        );
        pushInfoItem(backlightInfo as InfoTranslationInput[]);
      }

      if (type === "TABLET") {
        const parsedSpecs = extractRamAndStorageFromTitle(p.title);

        const ramTranslations = getTranslation(ram as TranslationItem[], p.ram || parsedSpecs.ram || undefined);
        pushInfoItem(ramTranslations as InfoTranslationInput[]);

        const matrixValue = detectFirstByTitle(p.title, matrixTypes);
        const matrixInfo = getPlainInfoTranslations(matrixValue || undefined, "Тип матриці", "Panel type");
        pushInfoItem(matrixInfo as InfoTranslationInput[]);

        const processorValue = detectFirstByTitle(p.title, processors);
        const processorInfo = getPlainInfoTranslations(processorValue || undefined, "Процесор", "Processor");
        pushInfoItem(processorInfo as InfoTranslationInput[]);

        const wirelessValues = detectWirelessFromTitle(p.title);
        for (const wirelessValue of wirelessValues) {
          const wirelessInfo = getPlainInfoTranslations(wirelessValue, "Бездротові мережі", "Wireless networks");
          pushInfoItem(wirelessInfo as InfoTranslationInput[]);
        }

        const storage = getStorageTranslations(parsedSpecs.storage);
        pushInfoItem(storage as InfoTranslationInput[]);

        const detectedFeatures = getDetectedFeatures(p.title);
        for (const featureValue of detectedFeatures) {
          const feature = getTranslation(features as TranslationItem[], featureValue);
          pushInfoItem(feature as InfoTranslationInput[]);
        }

        const osTranslations = getTranslation(os as TranslationItem[], p.os);
        pushInfoItem(osTranslations as InfoTranslationInput[]);
      }

      const color = getTranslation(colors as TranslationItem[], p.color);
      pushInfoItem(color as InfoTranslationInput[]);

      const resolvedAttributeData = await Promise.all(
        infoItems.map(async (item) => {
          const { categoryAttributeId, attributeId } = await ensureCategoryAttribute(category.id, item);
          const attributeValueId = await ensureAttributeValue(attributeId, item);
          return {
            categoryAttributeId,
            attributeValueId,
          };
        })
      );

      const resolvedInfoItems = resolvedAttributeData.map((item) => ({
        categoryAttributeId: item.categoryAttributeId,
        attributeValueId: item.attributeValueId,
      }));
      const resolvedItemProperties = resolvedAttributeData.map((item) => ({
        categoryAttributeId: item.categoryAttributeId,
        attributeValueId: item.attributeValueId,
      }));

      const titleUa = p.title || "";
      const titleEn = p.title_en || p.title || "";
      const descriptionUa = p.description || "";
      const descriptionEn = p.description_en || p.description || "";

      const seededDevice = await prisma.device.upsert({
        where: { slug: p.id || p.sku },
        update: {
          imageUrl: p.image || "",
          imageUrls: Array.isArray(p.slider_images) ? p.slider_images : [],
          priceUah: p.price_uah || 0,
          oldPriceUah: p.old_price_uah || 0,
          rating: p.rating || 0,
          reviewsCount: p.reviews_count || 0,
          inStock: p.in_stock ?? true,
          stockCount: p.stock_count || 0,
          categoryId: category.id,
          brandId: deviceBrand.id,
          translations: {
            deleteMany: {},
            create: [
              { locale: "ua", name: titleUa, description: descriptionUa },
              { locale: "en", name: titleEn, description: descriptionEn },
            ],
          },
          info: {
            deleteMany: {},
            create: resolvedInfoItems,
          },
        },
        create: {
          slug: p.id || p.sku,
          imageUrl: p.image || "",
          imageUrls: Array.isArray(p.slider_images) ? p.slider_images : [],
          priceUah: p.price_uah || 0,
          oldPriceUah: p.old_price_uah || 0,
          rating: p.rating || 0,
          reviewsCount: p.reviews_count || 0,
          inStock: p.in_stock ?? true,
          stockCount: p.stock_count || 0,
          categoryId: category.id,
          brandId: deviceBrand.id,
          translations: {
            create: [
              { locale: "ua", name: titleUa, description: descriptionUa },
              { locale: "en", name: titleEn, description: descriptionEn },
            ],
          },
          info: {
            create: resolvedInfoItems,
          },
        },
        select: {
          id: true,
          imageUrl: true,
          imageUrls: true,
        },
      });

      const deviceItemSku = p.sku || p.id || `${category.slug}-${deviceBrand.id}-${Date.now()}`;
      const deviceItemMainImage =
        (Array.isArray(p.slider_images) && p.slider_images[0]) ||
        seededDevice.imageUrls[0] ||
        seededDevice.imageUrl ||
        p.image ||
        "";

      await prisma.deviceItem.upsert({
        where: { sku: deviceItemSku },
        update: {
          deviceId: seededDevice.id,
          priceUah: p.price_uah || 0,
          oldPriceUah: p.old_price_uah || null,
          stockCount: p.stock_count || 0,
          inStock: p.in_stock ?? true,
          mainImage: deviceItemMainImage,
          properties: {
            deleteMany: {},
            create: resolvedItemProperties,
          },
        },
        create: {
          sku: deviceItemSku,
          deviceId: seededDevice.id,
          priceUah: p.price_uah || 0,
          oldPriceUah: p.old_price_uah || null,
          stockCount: p.stock_count || 0,
          inStock: p.in_stock ?? true,
          mainImage: deviceItemMainImage,
          properties: {
            create: resolvedItemProperties,
          },
        },
      });
    }
  };

  console.log("Seeding tablets...");
  await seedProducts(tabletDevices, "TABLET", "tablets");

  console.log("Seeding monitors...");
  await seedProducts(monitorDevices, "MONITOR", "monitors");
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