"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Shift, Weekday } from "@/generated";
import { Button, Input, Select } from "@/components/ui";
import type { LoadFormState } from "@/app/loads/load-types";

type TeacherOption = {
  id: string;
  name: string;
  shift: Shift;
};

type SubjectOption = {
  id: string;
  code: string;
  name: string;
  color: string;
};

type ClassOption = {
  id: string;
  gradeLevel: string;
  section: string;
  shift?: Shift;
};

type LoadFormProps = {
  teachers: TeacherOption[];
  subjects: SubjectOption[];
  classes: ClassOption[];
  createLoad: (previousState: LoadFormState, formData: FormData) => Promise<LoadFormState>;
  preselectedTeacherId?: string;
};

const shiftLabels: Record<Shift, string> = {
  MORNING: "Morning (6:00 AM - 12:10 NN)",
  AFTERNOON: "Afternoon (12:00 PM - 7:00 PM)",
};

const weekdayOptions: { value: Weekday; label: string }[] = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
];

export default function LoadForm({
  teachers,
  subjects,
  classes,
  createLoad,
  preselectedTeacherId,
}: LoadFormProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState(preselectedTeacherId ?? "");
  const [selectedTimeBlock, setSelectedTimeBlock] = useState("");
  const [formState, formAction] = useActionState(createLoad, {
    status: "idle",
  });

  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === selectedTeacherId),
    [teachers, selectedTeacherId]
  );

  const afternoonTimeBlocks = [
    { label: "12:00 PM - 1:20 PM", start: "12:00", end: "13:20" },
    { label: "1:20 PM - 2:40 PM", start: "13:20", end: "14:40" },
    { label: "2:40 PM - 4:00 PM", start: "14:40", end: "16:00" },
    { label: "Break (4:00 PM - 4:20 PM)", start: "16:00", end: "16:20", disabled: true },
    { label: "4:20 PM - 5:40 PM", start: "16:20", end: "17:40" },
    { label: "5:40 PM - 7:00 PM", start: "17:40", end: "19:00" },
  ];

  const morningTimeBlocks = [
    { label: "6:00 AM - 7:10 AM", start: "06:00", end: "07:10" },
    { label: "7:10 AM - 8:20 AM", start: "07:10", end: "08:20" },
    { label: "8:20 AM - 9:30 AM", start: "08:20", end: "09:30" },
    { label: "Break (9:30 AM - 9:50 AM)", start: "09:30", end: "09:50", disabled: true },
    { label: "9:50 AM - 11:00 AM", start: "09:50", end: "11:00" },
    { label: "11:00 AM - 12:10 PM", start: "11:00", end: "12:10" },
  ];

  const isAfternoonShift = selectedTeacher?.shift === "AFTERNOON";
  const isMorningShift = selectedTeacher?.shift === "MORNING";
  const activeBlocks = isAfternoonShift ? afternoonTimeBlocks : morningTimeBlocks;
  const visibleClasses = selectedTeacher
    ? classes.filter((classItem) => classItem.shift === selectedTeacher.shift)
    : classes;
  const selectedBlock = activeBlocks.find(
    (block) => `${block.start}-${block.end}` === selectedTimeBlock
  );

  useEffect(() => {
    if (formState.status === "error" && formState.message) {
      toast.error(formState.message);
    }
    if (formState.status === "success" && formState.message) {
      toast.success(formState.message);
    }
  }, [formState]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const teacherId = String(formData.get("teacherId") ?? "").trim();
    const subjectId = String(formData.get("subjectId") ?? "").trim();
    const classId = String(formData.get("classId") ?? "").trim();
    const day = String(formData.get("day") ?? "").trim();
    const startTime = String(formData.get("startTime") ?? "").trim();
    const endTime = String(formData.get("endTime") ?? "").trim();
    const timeBlock = String(formData.get("timeBlock") ?? "").trim();

    const hasTeacher = Boolean(preselectedTeacherId || teacherId);
    const needsTimeBlock = Boolean(selectedTeacher);
    const hasValidTime = needsTimeBlock
      ? Boolean(timeBlock && startTime && endTime)
      : Boolean(startTime && endTime);

    if (!hasTeacher || !subjectId || !classId || !day || !hasValidTime) {
      event.preventDefault();
      toast.error("Please complete all required load details.");
    }
  };

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-3" onSubmit={handleSubmit}>
      {preselectedTeacherId ? (
        <input type="hidden" name="teacherId" value={preselectedTeacherId} />
      ) : (
        <Select
          name="teacherId"
          value={selectedTeacherId}
          onChange={(event) => setSelectedTeacherId(event.target.value)}
        >
          <option value="">Select teacher</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </Select>
      )}
      <Select name="subjectId">
        <option value="">Select subject</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.code} - {subject.name}
          </option>
        ))}
      </Select>
      <Select name="classId">
        <option value="">Select class</option>
        {visibleClasses.map((classItem) => (
          <option key={classItem.id} value={classItem.id}>
            {classItem.gradeLevel} - {classItem.section}
          </option>
        ))}
      </Select>
      {isAfternoonShift || isMorningShift ? (
        <>
          <Select
            name="timeBlock"
            value={selectedTimeBlock}
            onChange={(event) => setSelectedTimeBlock(event.target.value)}
          >
            <option value="">Select time block</option>
            {activeBlocks.map((block) => (
              <option
                key={`${block.start}-${block.end}`}
                value={`${block.start}-${block.end}`}
                disabled={block.disabled}
              >
                {block.label}
              </option>
            ))}
          </Select>
          <input type="hidden" name="startTime" value={selectedBlock?.start ?? ""} />
          <input type="hidden" name="endTime" value={selectedBlock?.end ?? ""} />
        </>
      ) : (
        <>
          <Input name="startTime" placeholder="Start time" type="time" />
          <Input name="endTime" placeholder="End time" type="time" />
        </>
      )}
      <div className="md:col-span-3">
        <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Day</p>
        <Select name="day" defaultValue="">
          <option value="">Select day</option>
          {weekdayOptions.map((weekday) => (
            <option key={weekday.value} value={weekday.value}>
              {weekday.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-muted)]">
          Shift:{" "}
          <span className="font-semibold text-[var(--text-primary)]">
            {selectedTeacher ? shiftLabels[selectedTeacher.shift] : "Select a teacher"}
          </span>
        </p>
        <Button>Add Load</Button>
      </div>
    </form>
  );
}
