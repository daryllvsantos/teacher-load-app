import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Load, LoadDay, Subject, Teacher, Weekday } from "@/generated";
import LoadForm from "@/app/loads/LoadForm";
import { Button, Card, Input, Select, SecondaryButton } from "@/components/ui";

const MAX_HOURS = 6;

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

const hasOverlap = ({
  startTime,
  endTime,
  existing,
}: {
  startTime: string;
  endTime: string;
  existing: { startTime: string; endTime: string }[];
}) => {
  const newStart = parseTimeToMinutes(startTime);
  const newEnd = parseTimeToMinutes(endTime);
  if (newStart === null || newEnd === null) return true;

  return existing.some((load) => {
    const existingStart = parseTimeToMinutes(load.startTime);
    const existingEnd = parseTimeToMinutes(load.endTime);
    if (existingStart === null || existingEnd === null) return true;
    return newStart < existingEnd && newEnd > existingStart;
  });
};

const weekdayOptions: { value: Weekday; label: string }[] = [
  { value: "MONDAY", label: "Mon" },
  { value: "TUESDAY", label: "Tue" },
  { value: "WEDNESDAY", label: "Wed" },
  { value: "THURSDAY", label: "Thu" },
  { value: "FRIDAY", label: "Fri" },
];

async function createLoad(formData: FormData) {
  "use server";
  const teacherId = String(formData.get("teacherId"));
  const subjectId = String(formData.get("subjectId"));
  const startTime = String(formData.get("startTime") || "").trim();
  const endTime = String(formData.get("endTime") || "").trim();
  const day = String(formData.get("day") || "").trim() as Weekday;

  if (!teacherId || !subjectId || !startTime || !endTime || !day) return;

  const durationHours = calculateDurationHours(startTime, endTime);
  if (!durationHours) return;

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { shift: true },
  });
  if (!teacher) return;

  const existingLoads = await prisma.load.findMany({
    where: { teacherId },
    select: { startTime: true, endTime: true },
  });

  const existingHours = existingLoads.reduce((total, load) => {
    const loadHours = calculateDurationHours(load.startTime, load.endTime) ?? 0;
    return total + loadHours;
  }, 0);

  if (existingHours + durationHours > MAX_HOURS) return;

  const existingSameDay = await prisma.load.findMany({
    where: {
      teacherId,
      days: { some: { weekday: day } },
    },
    select: { startTime: true, endTime: true },
  });

  if (hasOverlap({ startTime, endTime, existing: existingSameDay })) return;

  await prisma.load.create({
    data: {
      teacherId,
      subjectId,
      shift: teacher.shift,
      startTime,
      endTime,
      days: {
        create: { weekday: day },
      },
    },
  });

  revalidatePath("/loads");
}

async function updateLoad(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const teacherId = String(formData.get("teacherId"));
  const subjectId = String(formData.get("subjectId"));
  const startTime = String(formData.get("startTime") || "").trim();
  const endTime = String(formData.get("endTime") || "").trim();
  const day = String(formData.get("day") || "").trim() as Weekday;

  if (!id || !teacherId || !subjectId || !startTime || !endTime || !day) return;

  const durationHours = calculateDurationHours(startTime, endTime);
  if (!durationHours) return;

  const existing = await prisma.load.findUnique({ where: { id } });
  if (!existing) return;

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { shift: true },
  });
  if (!teacher) return;

  const existingLoads = await prisma.load.findMany({
    where: { teacherId },
    select: { startTime: true, endTime: true },
  });

  const currentHours = existingLoads.reduce((total, load) => {
    const loadHours = calculateDurationHours(load.startTime, load.endTime) ?? 0;
    return total + loadHours;
  }, 0);

  const existingDuration = calculateDurationHours(existing.startTime, existing.endTime) ?? 0;
  const adjustedHours = currentHours - existingDuration + durationHours;
  if (adjustedHours > MAX_HOURS) return;

  const existingSameDay = await prisma.load.findMany({
    where: {
      teacherId,
      days: { some: { weekday: day } },
      NOT: { id },
    },
    select: { startTime: true, endTime: true },
  });

  if (hasOverlap({ startTime, endTime, existing: existingSameDay })) return;

  await prisma.load.update({
    where: { id },
    data: {
      teacherId,
      subjectId,
      shift: teacher.shift,
      startTime,
      endTime,
      days: {
        deleteMany: {},
        create: { weekday: day },
      },
    },
  });

  revalidatePath("/loads");
}

async function deleteLoad(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.load.delete({ where: { id } });
  revalidatePath("/loads");
}

export default async function LoadsPage() {
  const [loads, teachers, subjects] = await Promise.all([
    prisma.load.findMany({
      include: { teacher: true, subject: true, days: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teacher.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="grid gap-6">
      <Card
        title="Teacher Loads"
        description={`Assign subjects to teachers. Each teacher can have up to ${MAX_HOURS} hours.`}
      >
        <LoadForm
          createLoad={createLoad}
          teachers={teachers.map((teacher) => ({
            id: teacher.id,
            name: teacher.name,
            shift: teacher.shift,
          }))}
          subjects={subjects.map((subject) => ({
            id: subject.id,
            code: subject.code,
            name: subject.name,
          }))}
        />
      </Card>

      <Card title="Current Loads">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--text-primary)]">
            <thead className="text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-3 py-2">Teacher</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Days</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loads.map((load: Load & { teacher: Teacher; subject: Subject; days: LoadDay[] }) => (
                <tr key={load.id} className="border-t border-[var(--border)]">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[var(--text-primary)]">
                      {load.teacher.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {load.teacher.shift === "MORNING" ? "Morning" : "Afternoon"} shift
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[var(--text-primary)]">
                      {load.subject.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{load.subject.code}</p>
                  </td>
                  <td className="px-3 py-3">
                    <form
                      action={updateLoad}
                      className="flex items-center gap-2"
                      id={`update-load-${load.id}`}
                    >
                      <input type="hidden" name="id" value={load.id} />
                      <input type="hidden" name="teacherId" value={load.teacherId} />
                      <input type="hidden" name="subjectId" value={load.subjectId} />
                      <Input name="startTime" defaultValue={load.startTime} type="time" />
                      <Input name="endTime" defaultValue={load.endTime} type="time" />
                    </form>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      className="w-full min-w-[140px] rounded-lg border border-[var(--border)] bg-transparent px-2 py-2 text-xs text-[var(--text-primary)]"
                      defaultValue={load.days[0]?.weekday ?? ""}
                      form={`update-load-${load.id}`}
                      name="day"
                    >
                      <option value="">Select day</option>
                      {weekdayOptions.map((weekday) => (
                        <option key={weekday.value} value={weekday.value}>
                          {weekday.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex items-center gap-3">
                      <button
                        aria-label="Save load"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-white transition hover:bg-[var(--primary-strong)]"
                        form={`update-load-${load.id}`}
                        title="Save"
                        type="submit"
                      >
                        <svg
                          aria-hidden="true"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                      <button
                        aria-label="Cancel changes"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-primary)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                        form={`update-load-${load.id}`}
                        title="Cancel"
                        type="reset"
                      >
                        <svg
                          aria-hidden="true"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                      <form action={deleteLoad}>
                        <input type="hidden" name="id" value={load.id} />
                        <button
                          aria-label="Delete load"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-600 hover:bg-red-50"
                          title="Delete"
                          type="submit"
                        >
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 7h12m-9 0V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0h10m-9 4v6m4-6v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12"
                            />
                          </svg>
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {loads.length === 0 && (
                <tr>
                  <td className="py-6 text-sm text-[var(--text-muted)]" colSpan={5}>
                    No loads assigned yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
