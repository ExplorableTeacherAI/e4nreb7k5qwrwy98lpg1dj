/**
 * Shared model for the derivatives lesson.
 *
 * Every figure in this lesson draws the same phone battery draining across an
 * evening, so the function, the number formats and the palette live here and
 * are imported by each section. One quantity, one formatter, everywhere.
 */

import { clamp } from "@/lib/motion";

export const T_MIN = 0;
export const T_MAX = 5;
export const P_MIN = 30;
export const P_MAX = 100;

/** Battery percentage after t hours off the charger. */
export const battery = (t: number) => 100 - 5 * t - 1.6 * t * t;

/** Exact drain rate at time t (percent per hour) — used to check figures. */
export const batteryRate = (t: number) => -5 - 3.2 * t;

/** Average drain rate across an interval, in percent per hour. */
export const averageRate = (t1: number, t2: number) =>
    (battery(t2) - battery(t1)) / (t2 - t1);

/* One formatter per quantity, shared by every figure and readout. */
export const fmtRate = (v: number) => `${v.toFixed(1)} %/h`;
export const fmtHours = (v: number) => `${v.toFixed(1)} h`;

/* Palette */
export const ACCENT = "#62D0AD";
export const ACCENT_ALT = "#8E90F5";
export const ACCENT_WARM = "#F7B23B";
export const GHOST = "#94A3B8";
export const INK = "#334155";
export const INK_SOFT = "#64748B";
export const GRID = "#E2E8F0";

export interface PlotRect {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
}

/** Build the model-to-screen mappings for a given plot rectangle. */
export const makeScales = (plot: PlotRect) => {
    const xOf = (t: number) => plot.x0 + ((t - T_MIN) / (T_MAX - T_MIN)) * (plot.x1 - plot.x0);
    const yOf = (p: number) => plot.y1 - ((p - P_MIN) / (P_MAX - P_MIN)) * (plot.y1 - plot.y0);
    const tOfX = (x: number) =>
        clamp(T_MIN + ((x - plot.x0) / (plot.x1 - plot.x0)) * (T_MAX - T_MIN), T_MIN, T_MAX);

    /** Pixels per hour and pixels per percent — needed to convert a screen tilt into a rate. */
    const pxPerHour = (plot.x1 - plot.x0) / (T_MAX - T_MIN);
    const pxPerPercent = (plot.y1 - plot.y0) / (P_MAX - P_MIN);

    const curvePath = (() => {
        const points: string[] = [];
        for (let t = T_MIN; t <= T_MAX + 1e-9; t += 0.05) {
            points.push(`${t === T_MIN ? "M" : "L"} ${xOf(t).toFixed(2)} ${yOf(battery(t)).toFixed(2)}`);
        }
        return points.join(" ");
    })();

    return { xOf, yOf, tOfX, pxPerHour, pxPerPercent, curvePath };
};

/**
 * A straight line through (px, py) with screen gradient m, clipped to the plot
 * rectangle so it never spills past the drawing area.
 */
export const clipLine = (
    px: number,
    py: number,
    m: number,
    plot: PlotRect,
): [[number, number], [number, number]] => {
    let x1 = plot.x0;
    let x2 = plot.x1;
    let y1 = py + m * (x1 - px);
    let y2 = py + m * (x2 - px);

    if (Math.abs(m) > 1e-6) {
        if (y1 < plot.y0) {
            x1 = px + (plot.y0 - py) / m;
            y1 = plot.y0;
        } else if (y1 > plot.y1) {
            x1 = px + (plot.y1 - py) / m;
            y1 = plot.y1;
        }
        if (y2 < plot.y0) {
            x2 = px + (plot.y0 - py) / m;
            y2 = plot.y0;
        } else if (y2 > plot.y1) {
            x2 = px + (plot.y1 - py) / m;
            y2 = plot.y1;
        }
    }

    return [
        [x1, y1],
        [x2, y2],
    ];
};
