import { useRef, useState, type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeChoice,
    InlineFeedback,
    InlineLinkedHighlight,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp } from "@/lib/motion";
import {
    fmtRate,
    fmtHours,
    clipLine,
    ACCENT,
    ACCENT_ALT,
    INK,
    INK_SOFT,
    GRID,
} from "./batteryCurve";
import {
    getVariableInfo,
    choicePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
} from "../variables";

/* ------------------------------------------------------------------ */
/*  Model: a second phone, straight off a video call                   */
/* ------------------------------------------------------------------ */

const T_END = 4;
/** Battery percentage after t hours — a heavy start that eases off. */
const videoBattery = (t: number) => 100 - 20 * t + 2.4 * t * t;
/** Exact drain rate at time t, in percent per hour. */
const videoRate = (t: number) => -20 + 4.8 * t;

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 580;
const TOP = { x0: 92, x1: 600, y0: 60, y1: 250 };
const BOTTOM = { x0: 92, x1: 600, y0: 330, y1: 490 };

const P_LOW = 55;
const P_HIGH = 100;
const R_LOW = -22;
const R_HIGH = 2;

const xOfT = (t: number) => TOP.x0 + (t / T_END) * (TOP.x1 - TOP.x0);
const tOfX = (x: number) => clamp(((x - TOP.x0) / (TOP.x1 - TOP.x0)) * T_END, 0, T_END);
const yTop = (p: number) => TOP.y1 - ((p - P_LOW) / (P_HIGH - P_LOW)) * (TOP.y1 - TOP.y0);
const yBottom = (r: number) => BOTTOM.y1 - ((r - R_LOW) / (R_HIGH - R_LOW)) * (BOTTOM.y1 - BOTTOM.y0);

const GHOST_LINK = "#CBD5E1";

const pxPerHour = (TOP.x1 - TOP.x0) / T_END;
const pxPerPercent = (TOP.y1 - TOP.y0) / (P_HIGH - P_LOW);
const screenGradient = (rate: number) => (-rate * pxPerPercent) / pxPerHour;

const videoCurvePath = (() => {
    const points: string[] = [];
    for (let t = 0; t <= T_END + 1e-9; t += 0.05) {
        points.push(`${t === 0 ? "M" : "L"} ${xOfT(t).toFixed(2)} ${yTop(videoBattery(t)).toFixed(2)}`);
    }
    return points.join(" ");
})();

/* ------------------------------------------------------------------ */
/*  The bespoke figure                                                 */
/* ------------------------------------------------------------------ */

function RateGraphDrawing() {
    const setVar = useSetVar();
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragging, setDragging] = useState(false);
    const [hovered, setHovered] = useState(false);

    const sampleTime = useVar<number>("rateSampleTime", 1.2);
    const plotted = useVar<number[]>("rateSampleTimes", []);
    const highlight = useVar<string>("rateGraphHighlight", "");

    const rate = videoRate(sampleTime);
    const touchX = xOfT(sampleTime);
    const touchY = yTop(videoBattery(sampleTime));
    const [tangentA, tangentB] = clipLine(touchX, touchY, screenGradient(rate), TOP);

    const dimOf = (id: string) => (highlight && highlight !== id ? 0.32 : 1);
    const tangentActive = highlight === "tangent";
    const dotsActive = highlight === "dots";

    const sorted = [...plotted].sort((a, b) => a - b);
    const builtPath = sorted
        .map((t, index) => `${index === 0 ? "M" : "L"} ${xOfT(t).toFixed(2)} ${yBottom(videoRate(t)).toFixed(2)}`)
        .join(" ");

    const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!dragging || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const px = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH;
        setVar("rateSampleTime", Math.round(tOfX(px) * 20) / 20);
    };

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full"
            onPointerMove={handlePointerMove}
            onPointerUp={() => setDragging(false)}
            onPointerLeave={() => setDragging(false)}
        >
            <defs>
                <filter id="rate-graph-handle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            {/* the moment being sampled, carried down into the rate graph */}
            <line
                x1={touchX}
                y1={touchY}
                x2={touchX}
                y2={yBottom(rate)}
                stroke={GHOST_LINK}
                strokeWidth={1.5}
                strokeDasharray="4 6"
            />

            {/* live readout */}
            <g opacity={dimOf("tangent")} style={{ transition: "opacity 150ms ease-out" }}>
                <text
                    x={TOP.x0}
                    y={32}
                    fill={INK_SOFT}
                    fontSize="12"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {`At ${fmtHours(sampleTime)} the drain is`}
                </text>
                <text
                    x={TOP.x0 + 165}
                    y={32}
                    fill={ACCENT}
                    fontSize="14"
                    fontWeight="600"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {fmtRate(rate)}
                </text>
            </g>
            <g opacity={dimOf("dots")} style={{ transition: "opacity 150ms ease-out" }}>
                <text
                    x={TOP.x1}
                    y={32}
                    fill={INK_SOFT}
                    fontSize="12"
                    textAnchor="end"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {`${plotted.length} plotted`}
                </text>
            </g>

            {/* upper panel: the battery curve */}
            <g opacity={highlight ? 0.4 : 1} style={{ transition: "opacity 150ms ease-out" }}>
                {[100, 78, 55].map((p) => (
                    <g key={p}>
                        <line x1={TOP.x0} y1={yTop(p)} x2={TOP.x1} y2={yTop(p)} stroke={GRID} strokeWidth={1.5} />
                        <text
                            x={TOP.x0 - 8}
                            y={yTop(p) + 4}
                            fill={INK_SOFT}
                            fontSize="11"
                            textAnchor="end"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {`${p}%`}
                        </text>
                    </g>
                ))}
                <path d={videoCurvePath} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
                <text x={TOP.x0} y={TOP.y1 + 26} fill={INK_SOFT} fontSize="12">
                    Battery left
                </text>
            </g>

            {/* the tangent and its draggable touch point */}
            <g opacity={dimOf("tangent")} style={{ transition: "opacity 150ms ease-out" }}>
                {tangentActive && (
                    <line
                        x1={tangentA[0]}
                        y1={tangentA[1]}
                        x2={tangentB[0]}
                        y2={tangentB[1]}
                        stroke={ACCENT}
                        strokeWidth={10}
                        opacity={0.28}
                        strokeLinecap="round"
                    />
                )}
                <line
                    x1={tangentA[0]}
                    y1={tangentA[1]}
                    x2={tangentB[0]}
                    y2={tangentB[1]}
                    stroke={ACCENT}
                    strokeWidth={tangentActive ? 4.5 : 3}
                    strokeLinecap="round"
                    style={{ transition: "stroke-width 150ms ease-out" }}
                    onPointerEnter={() => setVar("rateGraphHighlight", "tangent")}
                    onPointerLeave={() => setVar("rateGraphHighlight", "")}
                />
                <circle
                    cx={touchX}
                    cy={touchY}
                    r={hovered || dragging || tangentActive ? 11 : 9}
                    fill={ACCENT}
                    filter="url(#rate-graph-handle-shadow)"
                    style={{ transition: "r 150ms ease-out" }}
                />
                <circle
                    cx={touchX}
                    cy={touchY}
                    r={24}
                    fill="transparent"
                    style={{ cursor: "ew-resize", touchAction: "none" }}
                    onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        setDragging(true);
                    }}
                    onPointerEnter={() => setHovered(true)}
                    onPointerLeave={() => setHovered(false)}
                />
            </g>

            {/* lower panel: the rate graph the student is assembling */}
            <g opacity={highlight ? 0.4 : 1} style={{ transition: "opacity 150ms ease-out" }}>
                <text x={BOTTOM.x0} y={BOTTOM.y0 - 22} fill={INK_SOFT} fontSize="12">
                    The rate graph you are building
                </text>
                {[0, -10, -20].map((r) => (
                    <g key={r}>
                        <line
                            x1={BOTTOM.x0}
                            y1={yBottom(r)}
                            x2={BOTTOM.x1}
                            y2={yBottom(r)}
                            stroke={GRID}
                            strokeWidth={1.5}
                        />
                        <text
                            x={BOTTOM.x0 - 8}
                            y={yBottom(r) + 4}
                            fill={INK_SOFT}
                            fontSize="11"
                            textAnchor="end"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {`${r} %/h`}
                        </text>
                    </g>
                ))}
                {[0, 1, 2, 3, 4].map((t) => (
                    <text
                        key={t}
                        x={xOfT(t)}
                        y={BOTTOM.y1 + 26}
                        fill={INK_SOFT}
                        fontSize="11"
                        textAnchor="middle"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {`${t} h`}
                    </text>
                ))}
                <text x={BOTTOM.x0} y={BOTTOM.y1 + 52} fill={INK_SOFT} fontSize="12">
                    Hours since the phone came off the charger
                </text>
            </g>

            {/* where the current rate would land, before it is plotted */}
            <circle
                cx={touchX}
                cy={yBottom(rate)}
                r={7}
                fill="none"
                stroke={GHOST_LINK}
                strokeWidth={1.5}
                strokeDasharray="3 4"
            />

            {/* the dots already collected */}
            <g opacity={dimOf("dots")} style={{ transition: "opacity 150ms ease-out" }}>
                {sorted.length > 1 && (
                    <path
                        d={builtPath}
                        fill="none"
                        stroke={ACCENT_ALT}
                        strokeWidth={dotsActive ? 3.5 : 2}
                        strokeLinecap="round"
                        opacity={0.75}
                        style={{ transition: "stroke-width 150ms ease-out" }}
                    />
                )}
                {sorted.map((t) => (
                    <circle
                        key={t}
                        cx={xOfT(t)}
                        cy={yBottom(videoRate(t))}
                        r={dotsActive ? 7 : 5.5}
                        fill={ACCENT_ALT}
                        style={{ transition: "r 150ms ease-out" }}
                        onPointerEnter={() => setVar("rateGraphHighlight", "dots")}
                        onPointerLeave={() => setVar("rateGraphHighlight", "")}
                    />
                ))}
            </g>
        </svg>
    );
}

function RateGraphFigure() {
    const setVar = useSetVar();
    const sampleTime = useVar<number>("rateSampleTime", 1.2);
    const plotted = useVar<number[]>("rateSampleTimes", []);

    const alreadyPlotted = plotted.some((t) => Math.abs(t - sampleTime) < 0.03);

    return (
        <Figure
            id="rate-graph-builder"
            caption="Drag the teal point along the curve to read the drain at that moment, then plot it. Enough dots and the rate graph draws itself."
            onReset={() => {
                setVar("rateSampleTime", 1.2);
                setVar("rateSampleTimes", []);
                setVar("rateGraphHighlight", "");
            }}
        >
            <RateGraphDrawing />
            <div className="px-6 pb-5">
                <button
                    type="button"
                    disabled={alreadyPlotted}
                    onClick={() => setVar("rateSampleTimes", [...plotted, sampleTime])}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                >
                    {alreadyPlotted ? "Already plotted" : "Plot this rate"}
                </button>
            </div>
            <InteractionHintSequence
                hintKey="rate-graph-build"
                currentStep={plotted.length === 0 ? 0 : 1}
                steps={[
                    {
                        gesture: "drag-horizontal",
                        label: "Drag the teal point along the curve",
                        position: { x: "42%", y: "24%" },
                        dragPath: { type: "line", startOffset: { x: -28, y: 0 }, endOffset: { x: 28, y: 0 } },
                    },
                    {
                        gesture: "drag-horizontal",
                        label: "Move on and plot another moment",
                        position: { x: "62%", y: "20%" },
                        dragPath: { type: "line", startOffset: { x: -28, y: 0 }, endOffset: { x: 28, y: 0 } },
                    },
                ]}
            />
        </Figure>
    );
}

/* ------------------------------------------------------------------ */
/*  Section blocks                                                     */
/* ------------------------------------------------------------------ */

export const derivativeNewCurveBlocks: ReactElement[] = [
    <StackLayout key="layout-new-curve-heading" maxWidth="xl">
        <Block id="new-curve-heading" padding="md">
            <EditableH2 id="h2-new-curve-heading" blockId="new-curve-heading">
                A Different Phone, A Different Evening
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-new-curve-setup" maxWidth="xl">
        <Block id="new-curve-setup" padding="sm">
            <EditableParagraph id="para-new-curve-setup" blockId="new-curve-setup">
                Here is a battery you have not seen before, from a phone that started the night on
                a video call. Drag the teal point along the curve to read the{" "}
                <InlineLinkedHighlight
                    varName="rateGraphHighlight"
                    highlightId="tangent"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('rateGraphHighlight'))}
                >
                    drain at that instant
                </InlineLinkedHighlight>
                , then plot it as a dot on the empty axes below.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-new-curve-visual" maxWidth="xl">
        <Block id="new-curve-visual" padding="sm" hasVisualization>
            <RateGraphFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-new-curve-reflection" maxWidth="xl">
        <Block id="new-curve-reflection" padding="sm">
            <EditableParagraph id="para-new-curve-reflection" blockId="new-curve-reflection">
                Collect a handful and a second curve appears. That{" "}
                <InlineLinkedHighlight
                    varName="rateGraphHighlight"
                    highlightId="dots"
                    showHint={false}
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('rateGraphHighlightDotsStyle'))}
                >
                    rate graph
                </InlineLinkedHighlight>{" "}
                is the derivative, and it is a function in its own right rather than a single
                number pinned to the evening.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-new-curve-question-half" maxWidth="xl">
        <Block id="new-curve-question-half" padding="md">
            <EditableParagraph id="para-new-curve-question-half" blockId="new-curve-question-half">
                This phone starts the night shedding 20 percent an hour. Reading your rate graph,
                the drain has eased to half of that by{" "}
                <InlineFeedback
                    varName="answer_new_curve_half"
                    correctValue="about 2 hours"
                    position="terminal"
                    successMessage="— spot on, the video call ends and the drain relaxes steadily from there"
                    failureMessage="— worth plotting a few more dots."
                    hint="Half of 20 percent an hour is 10, so find where your dots cross that line"
                    visualizationHint={{
                        blockId: "new-curve-visual",
                        hintKey: "rate-graph-half-hint",
                        label: "Discover it yourself",
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Drag the teal point to about 1 hour, then plot it",
                                position: { x: "30%", y: "26%" },
                                completionVar: "rateSampleTime",
                                completionValue: 1,
                                completionTolerance: 0.2,
                            },
                            {
                                gesture: "drag-horizontal",
                                label: "Now out to about 2 hours and plot again",
                                position: { x: "46%", y: "22%" },
                                completionVar: "rateSampleTime",
                                completionValue: 2,
                                completionTolerance: 0.2,
                            },
                            {
                                gesture: "drag-horizontal",
                                label: "And on to 3 hours — watch which dot sits level with 10 percent an hour",
                                position: { x: "62%", y: "20%" },
                                completionVar: "rateSampleTime",
                                completionValue: 3,
                                completionTolerance: 0.2,
                            },
                        ],
                        resetVars: { rateSampleTime: 0.2 },
                    }}
                >
                    <InlineClozeChoice
                        varName="answer_new_curve_half"
                        correctAnswer="about 2 hours"
                        options={["about 1 hour", "about 2 hours", "about 3 hours"]}
                        {...choicePropsFromDefinition(getVariableInfo('answer_new_curve_half'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-new-curve-question-positive" maxWidth="xl">
        <Block id="new-curve-question-positive" padding="md">
            <EditableParagraph
                id="para-new-curve-question-positive"
                blockId="new-curve-question-positive"
            >
                Suppose the rate graph kept climbing and crossed above the zero line. The phone
                would then be{" "}
                <InlineFeedback
                    varName="answer_new_curve_positive"
                    correctValue="charging back up"
                    position="terminal"
                    successMessage="— exactly, a positive rate of change means the percentage is going up rather than down"
                    failureMessage="— think about the sign."
                    hint="A negative rate means the battery falls, so what must a positive one mean"
                    visualizationHint={{
                        blockId: "new-curve-visual",
                        hintKey: "rate-graph-positive-hint",
                        label: "Take another look",
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Drag the teal point out to 4 hours, where the curve has almost flattened",
                                position: { x: "80%", y: "18%" },
                                completionVar: "rateSampleTime",
                                completionValue: 4,
                                completionTolerance: 0.25,
                            },
                        ],
                        resetVars: { rateSampleTime: 1.2 },
                    }}
                >
                    <InlineClozeChoice
                        varName="answer_new_curve_positive"
                        correctAnswer="charging back up"
                        options={["charging back up", "draining even faster", "holding perfectly steady"]}
                        {...choicePropsFromDefinition(getVariableInfo('answer_new_curve_positive'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
