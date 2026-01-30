import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Shift, Weekday } from "@/generated";
import { Button, Card, Input, Select } from "@/components/ui";
import LoadModal from "@/app/teachers/[id]/LoadModal";
import type { LoadFormState } from "@/app/loads/load-types";

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

async function updateTeacher(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const department = String(formData.get("department") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const shift = String(formData.get("shift") || "MORNING") as Shift;

  if (!id || !name) return;

  await prisma.teacher.update({
    where: { id },
    data: {
      name,
      department: department || null,
      email: email || null,
      shift,
    },
  });

  revalidatePath("/teachers");
  revalidatePath(`/teachers/${id}`);
}

async function deleteTeacher(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.teacher.delete({ where: { id } });
  revalidatePath("/teachers");
}

async function createLoad(
  previousState: LoadFormState,
  formData: FormData
): Promise<LoadFormState> {
  "use server";
  const teacherId = String(formData.get("teacherId"));
  const subjectId = String(formData.get("subjectId"));
  const startTime = String(formData.get("startTime") || "").trim();
  const endTime = String(formData.get("endTime") || "").trim();
  const day = String(formData.get("day") || "").trim() as Weekday;

  if (!teacherId || !subjectId || !startTime || !endTime || !day) {
    return { status: "error", message: "Please complete all load details." };
  }

  const durationHours = calculateDurationHours(startTime, endTime);
  if (!durationHours) {
    return { status: "error", message: "End time must be after the start time." };
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { shift: true },
  });
  if (!teacher) {
    return { status: "error", message: "Teacher not found." };
  }

  const existingSameDay = await prisma.load.findMany({
    where: {
      teacherId,
      days: { some: { weekday: day } },
    },
    select: { startTime: true, endTime: true },
  });

  const existingDayHours = existingSameDay.reduce((total, load) => {
    const loadHours = calculateDurationHours(load.startTime, load.endTime) ?? 0;
    return total + loadHours;
  }, 0);

  const maxHoursForShift =
    teacher.shift === "AFTERNOON" ? MAX_AFTERNOON_HOURS_PER_DAY : MAX_MORNING_HOURS_PER_DAY;

  if (existingDayHours + durationHours > maxHoursForShift) {
    return {
      status: "error",
      message: "This load exceeds the allowed hours for the selected day.",
    };
  }

  if (hasOverlap({ startTime, endTime, existing: existingSameDay })) {
    return {
      status: "error",
      message: "Time slot is not available anymore for the selected day.",
    };
  }

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

  revalidatePath(`/teachers/${teacherId}`);
  return { status: "success", message: "Load added successfully." };
}

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

type TimeBlock = {
  label: string;
  start: string;
  end: string;
  disabled?: boolean;
};

const morningTimeBlocks: TimeBlock[] = [
  { label: "6:00 AM - 7:10 AM", start: "06:00", end: "07:10" },
  { label: "7:10 AM - 8:20 AM", start: "07:10", end: "08:20" },
  { label: "8:20 AM - 9:30 AM", start: "08:20", end: "09:30" },
  { label: "Break (9:30 AM - 9:50 AM)", start: "09:30", end: "09:50", disabled: true },
  { label: "9:50 AM - 11:00 AM", start: "09:50", end: "11:00" },
  { label: "11:00 AM - 12:10 PM", start: "11:00", end: "12:10" },
];

const afternoonTimeBlocks: TimeBlock[] = [
  { label: "12:00 PM - 1:20 PM", start: "12:00", end: "13:20" },
  { label: "1:20 PM - 2:40 PM", start: "13:20", end: "14:40" },
  { label: "2:40 PM - 4:00 PM", start: "14:40", end: "16:00" },
  { label: "Break (4:00 PM - 4:20 PM)", start: "16:00", end: "16:20", disabled: true },
  { label: "4:20 PM - 5:40 PM", start: "16:20", end: "17:40" },
  { label: "5:40 PM - 7:00 PM", start: "17:40", end: "19:00" },
];

export default async function TeacherDetailPage({
  params,
}: {
  params?: { id?: string } | Promise<{ id?: string }>;
}) {
  const resolvedParams = await Promise.resolve(params ?? {});
  const id = resolvedParams.id;
  if (!id) {
    notFound();
  }
  const [teacher, subjects] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id },
      include: {
        loads: {
          include: {
            subject: true,
            days: true,
          },
        },
      },
    }),
    prisma.subject.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, color: true },
    }),
  ]);

  if (!teacher) {
    notFound();
  }

  const scheduleByDay = weekdayOrder.map((weekday) => {
    const dayLoads = teacher.loads.filter((load) =>
      load.days.some((day) => day.weekday === weekday)
    );

    return {
      weekday,
      label: weekdayLabels[weekday],
      loads: dayLoads,
    };
  });

  const activeBlocks = teacher.shift === "AFTERNOON" ? afternoonTimeBlocks : morningTimeBlocks;
  const scheduleLookup = new Map<string, (typeof teacher.loads)[number]>();

  teacher.loads.forEach((load) => {
    load.days.forEach((day) => {
      const key = `${day.weekday}-${load.startTime}-${load.endTime}`;
      scheduleLookup.set(key, load);
    });
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-muted)]">Teacher Profile</p>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{teacher.name}</h2>
        </div>
        <Link
          className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)]"
          href="/teachers"
        >
          ← Back to teachers
        </Link>
      </div>

      <Card title="Edit Teacher" description="Update the teacher profile details.">
        <form action={updateTeacher} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="id" value={teacher.id} />
          <label className="flex flex-col gap-1 text-sm text-[var(--text-muted)]">
            Name
            <Input name="name" defaultValue={teacher.name} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[var(--text-muted)]">
            Department
            <Input name="department" defaultValue={teacher.department ?? ""} placeholder="Department" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[var(--text-muted)]">
            Email
            <Input name="email" defaultValue={teacher.email ?? ""} placeholder="Email" type="email" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[var(--text-muted)]">
            Shift
            <Select name="shift" defaultValue={teacher.shift}>
              <option value="MORNING">Morning (6:00 AM - 12:10 NN)</option>
              <option value="AFTERNOON">Afternoon (12:00 PM - 7:00 PM)</option>
            </Select>
          </label>
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <Button>Save Changes</Button>
          </div>
        </form>
        <form action={deleteTeacher} className="mt-3">
          <input type="hidden" name="id" value={teacher.id} />
          <button
            aria-label="Delete teacher"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 text-red-600 hover:bg-red-50"
            title="Delete teacher"
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
      </Card>

      <Card
        title="Weekly Schedule"
        description="Monday to Friday schedule based on assigned loads."
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <LoadModal
            createLoad={createLoad}
            teacher={{ id: teacher.id, name: teacher.name, shift: teacher.shift }}
            subjects={subjects}
          />
          <p className="text-sm text-[var(--text-muted)]">
            Add new loads without leaving the schedule view.
          </p>
        </div>
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
                    const load = scheduleLookup.get(
                      `${entry.weekday}-${block.start}-${block.end}`
                    );
                    return (
                      <td key={`${entry.weekday}-${block.start}`} className="py-3">
                        {load ? (
                          <div
                            className="inline-flex max-w-full flex-col gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-xs"
                            style={{ backgroundColor: load.subject.color }}
                          >
                            <span className="font-semibold text-white">
                              {load.subject.code}
                            </span>
                            <span className="text-white/90">{load.subject.name}</span>
                            <span className="text-[10px] text-white/80">
                              {load.startTime} - {load.endTime}
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