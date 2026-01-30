"use client";

import { useMemo, useState } from "react";
import type { Shift, Weekday } from "@/generated";
import { Button, Input, Select } from "@/components/ui";

type TeacherOption = {
  id: string;
  name: string;
  shift: Shift;
};

type SubjectOption = {
  id: string;
  code: string;
  name: string;
};

type LoadFormProps = {
  teachers: TeacherOption[];
  subjects: SubjectOption[];
  createLoad: (formData: FormData) => void;
};

const shiftLabels: Record<Shift, string> = {
  MORNING: "Morning (6:00 AM - 12:00 NN)",
  AFTERNOON: "Afternoon (1:00 PM - 7:00 PM)",
};

const weekdayOptions: { value: Weekday; label: string }[] = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
];

export default function LoadForm({ teachers, subjects, createLoad }: LoadFormProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === selectedTeacherId),
    [teachers, selectedTeacherId]
  );

  return (
    <form action={createLoad} className="grid gap-3 md:grid-cols-3">
      <Select
        name="teacherId"
        defaultValue=""
        onChange={(event) => setSelectedTeacherId(event.target.value)}
      >
        <option value="">Select teacher</option>
        {teachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.name}
          </option>
        ))}
      </Select>
      <Select name="subjectId">
        <option value="">Select subject</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.code} - {subject.name}
          </option>
        ))}
      </Select>
      <Input name="startTime" placeholder="Start time" type="time" />
      <Input name="endTime" placeholder="End time" type="time" />
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