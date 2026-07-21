import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { addDays, format } from "date-fns";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const DAILY_START_TIMES = ["10:00", "13:00", "15:30"];
const DAYS_AHEAD = 30;

async function main() {
  const cruise = await prisma.activity.upsert({
    where: { slug: "town-cruise" },
    update: {},
    create: {
      name: "トゥクトゥク街めぐりクルーズ",
      slug: "town-cruise",
      description:
        "ガイド付きトゥクトゥクで街の名所をめぐる定番コースです。風を感じながらのんびり観光をお楽しみいただけます。",
      durationMinutes: 60,
      pricePerAdult: 3000,
      pricePerChild: 1500,
      defaultCapacity: 4,
      isOnSale: true,
    },
  });

  const sunset = await prisma.activity.upsert({
    where: { slug: "sunset-tour" },
    update: {},
    create: {
      name: "サンセット貸切ツアー",
      slug: "sunset-tour",
      description:
        "夕暮れ時の特別な景色を貸切トゥクトゥクで巡る特別コースです。カップルやご家族での記念日にもおすすめです。",
      durationMinutes: 90,
      pricePerAdult: 5000,
      pricePerChild: 2500,
      defaultCapacity: 4,
      isOnSale: true,
    },
  });

  const today = new Date();
  for (const activity of [cruise, sunset]) {
    for (let i = 1; i <= DAYS_AHEAD; i++) {
      const date = format(addDays(today, i), "yyyy-MM-dd");
      for (const startTime of DAILY_START_TIMES) {
        await prisma.scheduleSlot.upsert({
          where: {
            activityId_date_startTime: {
              activityId: activity.id,
              date,
              startTime,
            },
          },
          update: {},
          create: {
            activityId: activity.id,
            date,
            startTime,
            capacity: activity.defaultCapacity,
            isOpen: true,
          },
        });
      }
    }
  }

  console.log("Seed data created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
