import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import SparklineSvg from "./SparklineSvg";
import type { PlotPoint } from "./types";

const makePlotPoints = (values: number[]): PlotPoint[] =>
  values.map((value, i) => ({ date: `2026-02-${18 + i}`, value, x: i }));

describe("SparklineSvg", () => {
  const baseProps = {
    maxY: 10,
    lowerIsBetter: false,
    lineColor: "hsl(145 45% 45%)",
    fillColor: "hsl(145 45% 45% / 0.10)",
    colorFn: () => "hsl(145 50% 42%)",
  };

  it("renders an svg element", () => {
    const { container } = render(
      <SparklineSvg {...baseProps} plotPoints={makePlotPoints([5, 7, 3])} height={36} />
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 200 36");
  });

  it("renders circles for each data point", () => {
    const points = makePlotPoints([2, 8, 5, 4]);
    const { container } = render(
      <SparklineSvg {...baseProps} plotPoints={points} height={36} />
    );
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(4);
  });

  it("renders polylines when 2+ points exist", () => {
    const points = makePlotPoints([3, 7]);
    const { container } = render(
      <SparklineSvg {...baseProps} plotPoints={points} height={36} />
    );
    const polylines = container.querySelectorAll("polyline");
    expect(polylines.length).toBe(2); // fill + line
  });

  it("does not render polylines with fewer than 2 points", () => {
    const points = makePlotPoints([5]);
    const { container } = render(
      <SparklineSvg {...baseProps} plotPoints={points} height={36} />
    );
    const polylines = container.querySelectorAll("polyline");
    expect(polylines).toHaveLength(0);
  });

  it("renders the midline dashed guide", () => {
    const { container } = render(
      <SparklineSvg {...baseProps} plotPoints={makePlotPoints([5])} height={36} />
    );
    const line = container.querySelector("line");
    expect(line).toBeInTheDocument();
    expect(line).toHaveAttribute("stroke-dasharray", "3 3");
  });

  it("applies custom height via style", () => {
    const { container } = render(
      <SparklineSvg {...baseProps} plotPoints={makePlotPoints([5, 6])} height={48} />
    );
    const svg = container.querySelector("svg");
    expect(svg?.style.height).toBe("48px");
  });
});
