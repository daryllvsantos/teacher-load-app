import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DashboardCharts from "@/app/DashboardCharts";

const MAX_MORNING_HOURS_PER_DAY = 6.17;
const MAX_AFTERNOON_HOURS_PER_DAY = 6.67;

const parseTimeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const calculateDurationHours = (startTime: string, endTime: string) => {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (startMinutes === null || endMinutes === null) return null;
  if (endMinutes <= startMinutes) return null;
  return (endMinutes - startMinutes) / 60;
};

const formatHours = (value: number) => Number(value.toFixed(1));

export default async function Home() {
  const [teacherCount, subjectCount, loadCount, loads, teachersByShift] =
    await Promise.all([
      prisma.teacher.count(),
      prisma.subject.count(),
      prisma.load.count(),
      prisma.load.findMany({
        select: { shift: true, startTime: true, endTime: true },
      }),
      prisma.teacher.groupBy({
        by: ["shift"],
        _count: { id: true },
      }),
    ]);

  const teachersByShiftMap = Object.fromEntries(
    teachersByShift.map((entry) => [entry.shift, entry._count.id])
  );

  const totalAssignedHours = loads.reduce((total, load) => {
    const duration = calculateDurationHours(load.startTime, load.endTime) ?? 0;
    return total + duration;
  }, 0);
  const totalCapacity =
    (teachersByShiftMap.MORNING ?? 0) * MAX_MORNING_HOURS_PER_DAY +
    (teachersByShiftMap.AFTERNOON ?? 0) * MAX_AFTERNOON_HOURS_PER_DAY;
  const totalRemaining = Math.max(totalCapacity - totalAssignedHours, 0);

  const loadsByShiftMap = loads.reduce<Record<string, number>>((acc, load) => {
    const duration = calculateDurationHours(load.startTime, load.endTime) ?? 0;
    acc[load.shift] = (acc[load.shift] ?? 0) + duration;
    return acc;
  }, {});

  const morningCapacity = (teachersByShiftMap.MORNING ?? 0) * MAX_MORNING_HOURS_PER_DAY;
  const afternoonCapacity = (teachersByShiftMap.AFTERNOON ?? 0) * MAX_AFTERNOON_HOURS_PER_DAY;
  const morningAssigned = loadsByShiftMap.MORNING ?? 0;
  const afternoonAssigned = loadsByShiftMap.AFTERNOON ?? 0;

  const charts = [
    {
      label: "Morning",
      total: morningCapacity,
      data: [
        { name: "Assigned", value: formatHours(morningAssigned) },
        {
          name: "Remaining",
          value: formatHours(Math.max(morningCapacity - morningAssigned, 0)),
        },
      ],
    },
    {
      label: "Afternoon",
      total: afternoonCapacity,
      data: [
        { name: "Assigned", value: formatHours(afternoonAssigned) },
        {
          name: "Remaining",
          value: formatHours(Math.max(afternoonCapacity - afternoonAssigned, 0)),
        },
      ],
    },
  ];

  const kpis = [
    { label: "Teachers", value: teacherCount },
    { label: "Subjects", value: subjectCount },
    { label: "Loads", value: loadCount },
    { label: "Assigned Hours", value: formatHours(totalAssignedHours) },
    { label: "Remaining Hours", value: formatHours(totalRemaining) },
  ];
  return (
    <section className="grid gap-6">
      <div className="rounded-2xl bg-[var(--surface)] p-6 shadow-sm ring-1 ring-[var(--border)]">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Welcome</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Use this dashboard to manage teacher subject loads. Morning shift runs 6:00 AM - 12:10 NN
          (6 hours 10 minutes total) and afternoon runs 12:00 PM - 7:00 PM (6 hours 40 minutes
          total).
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl bg-[var(--surface)] p-5 shadow-sm ring-1 ring-[var(--border)]"
          >
            <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">
              {kpi.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>
      <DashboardCharts charts={charts} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-[var(--surface)] p-5 shadow-sm ring-1 ring-[var(--border)]">
          <h3 className="text-sm font-semibold uppercase text-[var(--text-muted)]">Teachers</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Add teacher profiles with basic details.</p>
          <Link
            className="mt-3 inline-flex text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--primary)]"
            href="/teachers"
          >
            Manage teachers →
          </Link>
        </div>
        <div className="rounded-2xl bg-[var(--surface)] p-5 shadow-sm ring-1 ring-[var(--border)]">
          <h3 className="text-sm font-semibold uppercase text-[var(--text-muted)]">Subjects</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Track subject codes and schedule colors.
          </p>
          <Link
            className="mt-3 inline-flex text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--primary)]"
            href="/subjects"
          >
            Manage subjects →
          </Link>
        </div>
      </div>
    </section>
  );
}
