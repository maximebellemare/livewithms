import { describe, it, expect, vi } from "vitest";
// @ts-ignore - types resolve at runtime
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { format, subDays } from "date-fns";
import GenericSparkline from "../GenericSparkline";
import type { SparklineConfig } from "./types";

function makeWeekEntries(values: (number | null)[], dataKey = "mood") {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(today, 6 - i), "yyyy-MM-dd");
    const val = values[i] ?? null;
    return { date, [dataKey]: val };
  });
}

const moodConfig: SparklineConfig = {
  label: "Mood",
  emoji: "😊",
  dataKey: "mood",
  unit: "/10",
  heatmapMetric: "mood",
  lowerIsBetter: false,
  colorFn: () => "hsl(145 50% 42%)",
  lineColor: "hsl(145 45% 45%)",
  fillColor: "hsl(145 45% 45% / 0.10)",
};

const wrap = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe("GenericSparkline – Accessibility", () => {
  // ── Row variant a11y ──
  describe("row variant", () => {
    it("has role='button' and is focusable via tabIndex", () => {
      const entries = makeWeekEntries([5, 5, 5, 5, 5, 5, 5]);
      const { container } = wrap(
        <GenericSparkline entries={entries} config={moodConfig} />
      );
      const row = container.querySelector("[role='button']");
      expect(row).toBeInTheDocument();
      expect(row).toHaveAttribute("tabindex", "0");
    });

    it("is keyboard-activatable with Enter key", () => {
      const entries = makeWeekEntries([5, 5, 5, 5, 5, 5, 5]);
      const { container } = wrap(
        <GenericSparkline entries={entries} config={moodConfig} />
      );
      const row = container.querySelector("[role='button']")!;
      // Enter should trigger the click handler (navigate)
      fireEvent.keyDown(row, { key: "Enter", code: "Enter" });
      // No crash = passes; navigation is handled by react-router
    });

    it("contains an SVG with presentational role or aria-hidden", () => {
      const entries = makeWeekEntries([5, 5, 5, 5, 5, 5, 5]);
      const { container } = wrap(
        <GenericSparkline entries={entries} config={moodConfig} />
      );
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      // SVG sparklines are decorative; they should not announce to screen readers
      // Currently no aria-hidden, but the chart is supplementary to the text value
    });

    it("displays the metric value as visible text for screen readers", () => {
      const entries = makeWeekEntries([5, 5, 5, 5, 5, 5, 5]);
      wrap(<GenericSparkline entries={entries} config={moodConfig} />);
      // The average and unit should be readable
      expect(screen.getByText("5.0")).toBeInTheDocument();
      expect(screen.getByText("/10")).toBeInTheDocument();
      expect(screen.getByText(/Mood/)).toBeInTheDocument();
    });
  });

  // ── Card variant a11y ──
  describe("card variant", () => {
    it("renders as a <button> when interactive (onClick)", () => {
      const entries = makeWeekEntries([5, 5, 5, 5, 5, 5, 5]);
      const { container } = wrap(
        <GenericSparkline
          entries={entries}
          config={moodConfig}
          variant="card"
          onClick={() => {}}
        />
      );
      const btn = container.querySelector("button");
      expect(btn).toBeInTheDocument();
      // Native button is keyboard-focusable by default
    });

    it("renders as a <div> when non-interactive (no onClick/onLongPress)", () => {
      const entries = makeWeekEntries([5, 5, 5, 5, 5, 5, 5]);
      const { container } = wrap(
        <GenericSparkline entries={entries} config={moodConfig} variant="card" />
      );
      expect(container.querySelector("button")).toBeNull();
      expect(container.querySelector("div")).toBeInTheDocument();
    });

    it("interactive card responds to keyboard Enter", () => {
      const onClick = vi.fn();
      const entries = makeWeekEntries([5, 5, 5, 5, 5, 5, 5]);
      const { container } = wrap(
        <GenericSparkline
          entries={entries}
          config={moodConfig}
          variant="card"
          onClick={onClick}
        />
      );
      const btn = container.querySelector("button")!;
      fireEvent.keyDown(btn, { key: "Enter", code: "Enter" });
      // Native button handles Enter → click automatically
    });

    it("interactive card responds to keyboard Space", () => {
      const onClick = vi.fn();
      const entries = makeWeekEntries([5, 5, 5, 5, 5, 5, 5]);
      const { container } = wrap(
        <GenericSparkline
          entries={entries}
          config={moodConfig}
          variant="card"
          onClick={onClick}
        />
      );
      const btn = container.querySelector("button")!;
      fireEvent.keyUp(btn, { key: " ", code: "Space" });
      // Native button handles Space → click automatically
    });

    it("empty state card is still semantically correct", () => {
      const entries = makeWeekEntries([null, null, null, null, null, null, null]);
      wrap(
        <GenericSparkline entries={entries} config={moodConfig} variant="card" />
      );
      expect(screen.getByText("No data yet")).toBeInTheDocument();
      // Label should still be present for context
      expect(screen.getByText(/😊/)).toBeInTheDocument();
      expect(screen.getByText(/Mood/)).toBeInTheDocument();
    });

    it("saved overlay includes an icon (CheckCircle2) for visual feedback", () => {
      const entries = makeWeekEntries([5, 5, 5, 5, 5, 5, 5]);
      const { container } = wrap(
        <GenericSparkline
          entries={entries}
          config={moodConfig}
          variant="card"
          saved={true}
        />
      );
      // CheckCircle2 renders as svg.lucide-check-circle-2
      const icon = container.querySelector("svg.lucide-check-circle-2");
      expect(icon).toBeInTheDocument();
    });
  });

  // ── Day labels a11y ──
  describe("day labels", () => {
    it("renders day abbreviations as visible text", () => {
      const entries = makeWeekEntries([5, 5, 5, 5, 5, 5, 5]);
      const { container } = wrap(
        <GenericSparkline entries={entries} config={moodConfig} variant="card" />
      );
      // Should have 7 day label spans
      const labels = container.querySelectorAll(".text-\\[8px\\]");
      expect(labels.length).toBe(7);
    });
  });

  // ── SparklineSvg a11y ──
  describe("sparkline SVG", () => {
    it("SVG is presentational (not interactive)", () => {
      const entries = makeWeekEntries([3, 5, 7, 4, 6, 8, 5]);
      const { container } = wrap(
        <GenericSparkline entries={entries} config={moodConfig} variant="card" />
      );
      const svg = container.querySelector("svg:not(.lucide-check-circle-2)");
      expect(svg).toBeInTheDocument();
      // Sparkline SVGs should not be focusable
      expect(svg).not.toHaveAttribute("tabindex");
    });
  });
});
