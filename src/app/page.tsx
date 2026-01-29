import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DashboardCharts from "@/app/DashboardCharts";

const MAX_HOURS = 6;

export default async function Home() {
  const [teacherCount, subjectCount, loadCount, totalAssigned, teachersByShift] =
    await Promise.all([
      prisma.teacher.count(),
      prisma.subject.count(),
      prisma.load.count(),
      prisma.load.aggregate({ _sum: { hours: true } }),
      prisma.teacher.groupBy({
        by: ["shift"],
        _count: { id: true },
      }),
    ]);

  const totalAssignedHours = totalAssigned._sum.hours ?? 0;
  const totalCapacity = teacherCount * MAX_HOURS;
  const totalRemaining = Math.max(totalCapacity - totalAssignedHours, 0);

  const teachersByShiftMap = Object.fromEntries(
    teachersByShift.map((entry) => [entry.shift, entry._count.id])
  );

  const loadsByShift = await prisma.load.groupBy({
    by: ["shift"],
    _sum: { hours: true },
  });

  const loadsByShiftMap = Object.fromEntries(
    loadsByShift.map((entry) => [entry.shift, entry._sum.hours ?? 0])
  );

  const morningCapacity = (teachersByShiftMap.MORNING ?? 0) * MAX_HOURS;
  const afternoonCapacity = (teachersByShiftMap.AFTERNOON ?? 0) * MAX_HOURS;
  const morningAssigned = loadsByShiftMap.MORNING ?? 0;
  const afternoonAssigned = loadsByShiftMap.AFTERNOON ?? 0;

  const charts = [
    {
      label: "Morning",
      total: morningCapacity,
      data: [
        { name: "Assigned", value: morningAssigned },
        {
          name: "Remaining",
          value: Math.max(morningCapacity - morningAssigned, 0),
        },
      ],
    },
    {
      label: "Afternoon",
      total: afternoonCapacity,
      data: [
        { name: "Assigned", value: afternoonAssigned },
        {
          name: "Remaining",
          value: Math.max(afternoonCapacity - afternoonAssigned, 0),
        },
      ],
    },
  ];

  const kpis = [
    { label: "Teachers", value: teacherCount },
    { label: "Subjects", value: subjectCount },
    { label: "Loads", value: loadCount },
    { label: "Assigned Hours", value: totalAssignedHours },
    { label: "Remaining Hours", value: totalRemaining },
  ];
  return (
    <section className="grid gap-6">
      <div className="rounded-2xl bg-[var(--surface)] p-6 shadow-sm ring-1 ring-[var(--border)]">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Welcome</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Use this dashboard to manage teacher subject loads. Each teacher should have a maximum of 6
          hours per day, and every schedule must be within the morning (6:00 AM - 12:00 NN) or
          afternoon (1:00 PM - 7:00 PM) shift.
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
      <div className="grid gap-4 md:grid-cols-3">
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
          <p className="mt-2 text-sm text-[var(--text-muted)]">Track subject codes and hours.</p>
          <Link
            className="mt-3 inline-flex text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--primary)]"
            href="/subjects"
          >
            Manage subjects →
          </Link>
        </div>
        <div className="rounded-2xl bg-[var(--surface)] p-5 shadow-sm ring-1 ring-[var(--border)]">
          <h3 className="text-sm font-semibold uppercase text-[var(--text-muted)]">Loads</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Assign subjects to teachers and keep hours in check.
          </p>
          <Link
            className="mt-3 inline-flex text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--primary)]"
            href="/loads"
          >
            Manage loads →
          </Link>
        </div>
      </div>
    </section>
  );
}
