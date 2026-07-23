import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { addDays, format } from "date-fns";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Configure a PostgreSQL connection string.");
}
const adapter = new PrismaPg(process.env.DATABASE_URL);
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
      highlights: "期間限定・今だけ半額！",
      description:
        "ガイド付きトゥクトゥクで街の名所をめぐる定番コースです。風を感じながらのんびり観光をお楽しみいただけます。",
      imageUrl:
        "https://images.unsplash.com/photo-1596395463746-f8ec2a58a4f2?w=800&q=80",
      included: "ガイド料\n保険\n駐車料",
      requirements: "参加年齢: 6〜70歳\n運転免許は1名でOK、あとは同乗するだけ",
      notices: "道路渋滞等により到着が遅れる場合があります。",
      durationMinutes: 60,
      pricePerAdult: 3000,
      originalPriceAdult: 6000,
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
      highlights: "カップル・ご家族の記念日におすすめ",
      description:
        "夕暮れ時の特別な景色を貸切トゥクトゥクで巡る特別コースです。カップルやご家族での記念日にもおすすめです。",
      imageUrl:
        "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80",
      included: "ガイド料\n保険\n駐車料\n記念撮影サポート",
      requirements: "参加年齢: 6〜70歳\n運転免許は1名でOK",
      notices: "天候により時間が前後する場合があります。",
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
