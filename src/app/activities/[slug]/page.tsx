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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">{activity.name}</h1>
      <p className="text-neutral-600 mt-2">{activity.description}</p>
      <dl className="mt-4 text-sm text-neutral-700 space-y-1">
        <div className="flex gap-2">
          <dt className="font-medium">所要時間:</dt>
          <dd>{activity.durationMinutes}分</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">料金:</dt>
          <dd>
            大人 {activity.pricePerAdult.toLocaleString()}円 / 子供{" "}
            {activity.pricePerChild.toLocaleString()}円(現地決済)
          </dd>
        </div>
      </dl>

      <hr className="my-8 border-neutral-200" />

      <BookingForm slots={slots} />
    </div>
  );
}
