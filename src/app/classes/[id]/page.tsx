import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Prisma, Shift, Weekday } from "@/generated";
import { Card } from "@/components/ui";

const weekdayOrder: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

const weekdayLabels: Record<Weekday, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
};

const formatTimeToMeridiem = (time: string) => {
  const [rawHours, rawMinutes] = time.split(":").map(Number);
  if (Number.isNaN(rawHours) || Number.isNaN(rawMinutes)) return time;
  const period = rawHours >= 12 ? "PM" : "AM";
  const hours = rawHours % 12 || 12;
  return `${hours}:${String(rawMinutes).padStart(2, "0")} ${period}`;
};

type TimeBlock = {
  label: string;
  start: string;
  end: string;
  disabled?: boolean;
};

const timeBlocksByShift: Record<Shift, TimeBlock[]> = {
  MORNING: [
    { label: "6:00 AM - 7:10 AM", start: "06:00", end: "07:10" },
    { label: "7:10 AM - 8:20 AM", start: "07:10", end: "08:20" },
    { label: "8:20 AM - 9:30 AM", start: "08:20", end: "09:30" },
    { label: "Break (9:30 AM - 9:50 AM)", start: "09:30", end: "09:50", disabled: true },
    { label: "9:50 AM - 11:00 AM", start: "09:50", end: "11:00" },
    { label: "11:00 AM - 12:10 PM", start: "11:00", end: "12:10" },
  ],
  AFTERNOON: [
    { label: "12:00 PM - 1:20 PM", start: "12:00", end: "13:20" },
    { label: "1:20 PM - 2:40 PM", start: "13:20", end: "14:40" },
    { label: "2:40 PM - 4:00 PM", start: "14:40", end: "16:00" },
    { label: "Break (4:00 PM - 4:20 PM)", start: "16:00", end: "16:20", disabled: true },
    { label: "4:20 PM - 5:40 PM", start: "16:20", end: "17:40" },
    { label: "5:40 PM - 7:00 PM", start: "17:40", end: "19:00" },
  ],
};

type LoadWithRelations = Prisma.LoadGetPayload<{
  include: {
    teacher: true;
    subject: true;
    days: true;
  };
}>;

export default async function ClassDetailPage({
  params,
}: {
  params?: { id?: string } | Promise<{ id?: string }>;
}) {
  const resolvedParams = await Promise.resolve(params ?? {});
  const id = resolvedParams.id;
  if (!id) {
    notFound();
  }

  const classSection = await prisma.class.findUnique({
    where: { id },
    include: {
      loads: {
        include: {
          teacher: true,
          subject: true,
          days: true,
        },
        orderBy: { startTime: "asc" },
      },
    },
  });

  if (!classSection) {
    notFound();
  }

  const scheduleByDay = weekdayOrder.map((weekday) => {
    const dayLoads = classSection.loads.filter((load: LoadWithRelations) =>
      load.days.some((day) => day.weekday === weekday)
    );

    return {
      weekday,
      label: weekdayLabels[weekday],
      loads: dayLoads,
    };
  });

  const scheduleLookup = new Map<string, LoadWithRelations>();
  const activeBlocks =
    classSection.shift === "AFTERNOON" ? timeBlocksByShift.AFTERNOON : timeBlocksByShift.MORNING;

  classSection.loads.forEach((load) => {
    load.days.forEach((day) => {
      const key = `${day.weekday}-${load.startTime}-${load.endTime}`;
      scheduleLookup.set(key, load);
    });
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-muted)]">Class Schedule</p>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            {classSection.gradeLevel} {classSection.section}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">Adviser: {classSection.adviser}</p>
        </div>
        <Link
          className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)]"
          href="/classes"
        >
          ← Back to classes
        </Link>
      </div>

      <Card
        title="Weekly Schedule"
        description="Read-only schedule based on teacher load assignments."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--text-primary)]">
            <thead className="text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="py-2">Time</th>
                {scheduleByDay.map((entry) => (
                  <th key={entry.weekday} className="py-2">
                    {entry.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeBlocks.map((block) => (
                <tr key={`${block.start}-${block.end}`} className="border-t border-[var(--border)]">
                  <td className="py-3 font-semibold text-[var(--text-primary)]">
                    <div className="flex flex-col">
                      <span>{block.label}</span>
                      {block.disabled && (
                        <span className="text-xs text-[var(--text-muted)]">Break</span>
                      )}
                    </div>
                  </td>
                  {scheduleByDay.map((entry) => {
                    const load = scheduleLookup.get(`${entry.weekday}-${block.start}-${block.end}`);
                    return (
                      <td key={`${entry.weekday}-${block.start}`} className="py-3">
                        {load ? (
                          <div
                            className="relative inline-flex max-w-full flex-col gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-xs"
                            style={{ backgroundColor: load.subject.color ?? undefined }}
                          >
                            <span className="schedule-chip-text text-white">
                              {load.subject.code} - {load.subject.name}
                            </span>
                            <span className="schedule-chip-text text-white/90">
                              {load.teacher.name}
                            </span>
                            <span className="schedule-chip-text text-[10px] text-white/80">
                              {formatTimeToMeridiem(load.startTime)} -{" "}
                              {formatTimeToMeridiem(load.endTime)}
                            </span>
                          </div>
                        ) : block.disabled ? (
                          <span className="text-xs text-[var(--text-muted)]">Break</span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">No load</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
