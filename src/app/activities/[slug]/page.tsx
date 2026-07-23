import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getUpcomingSlotsForActivity } from "@/lib/availability";
import BookingForm from "@/components/BookingForm";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const activity = await prisma.activity.findUnique({ where: { slug } });

  if (!activity || !activity.isOnSale) notFound();

  const today = format(new Date(), "yyyy-MM-dd");
  const slots = await getUpcomingSlotsForActivity(activity.id, today);

  const hasDiscount =
    activity.originalPriceAdult != null && activity.originalPriceAdult > activity.pricePerAdult;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">{activity.name}</h1>
      {activity.highlights && (
        <p className="text-emerald-700 font-medium mt-1">{activity.highlights}</p>
      )}
      <p className="text-neutral-600 mt-3 whitespace-pre-line">{activity.description}</p>

      <dl className="mt-4 text-sm text-neutral-700 space-y-1">
        <div className="flex gap-2">
          <dt className="font-medium">所要時間:</dt>
          <dd>{activity.durationMinutes}分</dd>
        </div>
        <div className="flex gap-2 items-baseline">
          <dt className="font-medium">料金:</dt>
          <dd>
            {hasDiscount && (
              <span className="line-through text-neutral-400 mr-2">
                {activity.originalPriceAdult!.toLocaleString()}円
              </span>
            )}
            <span className={hasDiscount ? "text-red-600 font-semibold" : ""}>
              大人 {activity.pricePerAdult.toLocaleString()}円
            </span>{" "}
            / 子供 {activity.pricePerChild.toLocaleString()}円(現地決済)
          </dd>
        </div>
      </dl>

      {(activity.included || activity.requirements) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {activity.included && (
            <InfoBox title="含まれるもの" content={activity.included} />
          )}
          {activity.requirements && (
            <InfoBox title="ご利用条件" content={activity.requirements} />
          )}
        </div>
      )}

      {activity.notices && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 whitespace-pre-line">
          <p className="font-semibold mb-1">ご注意事項</p>
          {activity.notices}
        </div>
      )}

      <hr className="my-8 border-neutral-200" />

      <BookingForm slots={slots} />
    </div>
  );
}

function InfoBox({ title, content }: { title: string; content: string }) {
  const items = content.split("\n").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="border border-neutral-200 rounded-lg p-4 bg-white">
      <p className="font-semibold text-sm mb-2">{title}</p>
      <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
