"use client";

import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { Pie } from "react-chartjs-2";

type ChartSlice = {
  name: string;
  value: number;
};

type ShiftChart = {
  label: string;
  data: ChartSlice[];
  total: number;
};

type DashboardChartsProps = {
  charts: ShiftChart[];
};

const DEFAULT_COLORS = ["#0f766e", "#f1f5f9"];
const sumValues = (slices: ChartSlice[]) =>
  slices.reduce((total, slice) => total + slice.value, 0);

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DashboardCharts({ charts }: DashboardChartsProps) {
  const [themeColors, setThemeColors] = useState(DEFAULT_COLORS);

  useEffect(() => {
    const updateColors = () => {
      const styles = getComputedStyle(document.documentElement);
      const primary = styles.getPropertyValue("--primary").trim();
      const surfaceMuted = styles.getPropertyValue("--surface-muted").trim();
      setThemeColors([
        primary || DEFAULT_COLORS[0],
        surfaceMuted || DEFAULT_COLORS[1],
      ]);
    };

    updateColors();
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {charts.map((chart) => {
        const totalValue = sumValues(chart.data);
        const hasData = totalValue > 0;
        const chartData = hasData ? chart.data : [];
        const pieData = {
          labels: chartData.map((slice) => slice.name),
          datasets: [
            {
              data: chartData.map((slice) => slice.value),
              backgroundColor: chartData.map(
                (_, index) => themeColors[index % themeColors.length]
              ),
              borderWidth: 0,
            },
          ],
        };

        return (
          <div className="rounded-2xl bg-[var(--surface)] p-6 shadow-sm ring-1 ring-[var(--border)]" key={chart.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                  {chart.label}
                </p>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Shift Utilization
                </h3>
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                Total capacity: {chart.total} hrs
              </p>
            </div>
            <div className="mt-4 h-56 min-w-0">
              {hasData ? (
                <Pie
                  data={pieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: { enabled: true },
                    },
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] text-sm text-[var(--text-muted)]">
                  No assigned hours yet
                </div>
              )}
            </div>
            <div className="mt-4 grid gap-2 text-sm text-[var(--text-muted)]">
              {chart.data.map((entry, index) => (
                <div
                  key={`${chart.label}-${entry.name}-label`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: themeColors[index % themeColors.length],
                      }}
                    />
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {entry.value} hrs
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}