import { useRef, useState, type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeChoice,
    InlineClozeInput,
    InlineFeedback,
    InlineLinkedHighlight,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure } from "@/components/molecules";
import { FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp } from "@/lib/motion";
import {
    battery,
    batteryRate,
    fmtRate,
    fmtHours,
    ACCENT,
    ACCENT_WARM,
    INK,
    INK_SOFT,
    GRID,
} from "./batteryCurve";
import {
    scrubVarsFromDefinitions,
    getVariableInfo,
    choicePropsFromDefinition,
    clozePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
} from "../variables";

/* ------------------------------------------------------------------ */
/*  Figure geometry: the whole evening beside the magnified moment      */
/* ------------------------------------------------------------------ */

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 420;
const LEFT = { x0: 60, x1: 340, y0: 70, y1: 320 };
const RIGHT = { x0: 400, x1: 610, y0: 70, y1: 320 };

const P_LOW = 30;
const P_HIGH = 100;
const T_SPAN = 5;

/** The moment under the magnifier. */
const FOCUS_T = 2;
const FOCUS_P = battery(FOCUS_T);
const FOCUS_RATE = batteryRate(FOCUS_T);

const xLeft = (t: number) => LEFT.x0 + (t / T_SPAN) * (LEFT.x1 - LEFT.x0);
const yLeft = (p: number) => LEFT.y1 - ((p - P_LOW) / (P_HIGH - P_LOW)) * (LEFT.y1 - LEFT.y0);

const pxPerHourLeft = (LEFT.x1 - LEFT.x0) / T_SPAN;
const pxPerPercentLeft = (LEFT.y1 - LEFT.y0) / (P_HIGH - P_LOW);

/**
 * Half height of the magnifier window, in percent. Chosen so the window has the
 * same shape as the right hand panel — the zoom is a faithful magnification,
 * not a stretch.
 */
const halfHeight = (halfWidth: number) =>
    halfWidth *
    ((pxPerHourLeft / pxPerPercentLeft) * (RIGHT.y1 - RIGHT.y0)) /
    (RIGHT.x1 - RIGHT.x0);

const fmtPercentPoints = (v: number) => `${v.toFixed(2)} %`;

const leftCurvePath = (() => {
    const points: string[] = [];
    for (let t = 0; t <= T_SPAN + 1e-9; t += 0.05) {
        points.push(`${t === 0 ? "M" : "L"} ${xLeft(t).toFixed(2)} ${yLeft(battery(t)).toFixed(2)}`);
    }
    return points.join(" ");
})();

/* ------------------------------------------------------------------ */
/*  The bespoke figure                                                 */
/* ------------------------------------------------------------------ */

function ZoomDrawing() {
    const setVar = useSetVar();
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragging, setDragging] = useState(false);
    const [hovered, setHovered] = useState(false);

    const halfWidth = useVar<number>("zoomWindow", 0.8);
    const highlight = useVar<string>("zoomHighlight", "");

    const halfPercent = halfHeight(halfWidth);
    const tangentAt = (t: number) => FOCUS_P + FOCUS_RATE * (t - FOCUS_T);
    const bend = Math.abs(battery(FOCUS_T + halfWidth) - tangentAt(FOCUS_T + halfWidth));

    const dimOf = (id: string) => (highlight && highlight !== id ? 0.32 : 1);
    const tangentActive = highlight === "tangent";
    const windowActive = highlight === "window";

    /* right hand panel: the window contents blown up */
    const xRight = (t: number) =>
        RIGHT.x0 + ((t - (FOCUS_T - halfWidth)) / (2 * halfWidth)) * (RIGHT.x1 - RIGHT.x0);
    const yRight = (p: number) =>
        RIGHT.y1 - ((p - (FOCUS_P - halfPercent)) / (2 * halfPercent)) * (RIGHT.y1 - RIGHT.y0);

    const rightCurvePath = (() => {
        const points: string[] = [];
        const steps = 80;
        for (let i = 0; i <= steps; i += 1) {
            const t = FOCUS_T - halfWidth + (2 * halfWidth * i) / steps;
            points.push(`${i === 0 ? "M" : "L"} ${xRight(t).toFixed(2)} ${yRight(battery(t)).toFixed(2)}`);
        }
        return points.join(" ");
    })();

    const windowLeft = xLeft(FOCUS_T - halfWidth);
    const windowRight = xLeft(FOCUS_T + halfWidth);
    const windowTop = yLeft(FOCUS_P + halfPercent);
    const windowBottom = yLeft(FOCUS_P - halfPercent);

    const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!dragging || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const px = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH;
        const hours = (px - xLeft(FOCUS_T)) / pxPerHourLeft;
        setVar("zoomWindow", clamp(Math.round(Math.abs(hours) * 20) / 20, 0.15, 0.85));
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
                <filter id="zoom-handle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
                <clipPath id="zoom-right-panel">
                    <rect x={RIGHT.x0} y={RIGHT.y0} width={RIGHT.x1 - RIGHT.x0} height={RIGHT.y1 - RIGHT.y0} />
                </clipPath>
            </defs>

            {/* panel titles */}
            <g opacity={highlight ? 0.4 : 1} style={{ transition: "opacity 150ms ease-out" }}>
                <text x={LEFT.x0} y={44} fill={INK_SOFT} fontSize="12">
                    The whole evening
                </text>
                <text x={RIGHT.x0} y={44} fill={INK_SOFT} fontSize="12">
                    Inside the magnifier
                </text>
            </g>

            {/* left panel: the full battery curve */}
            <g opacity={highlight ? 0.4 : 1} style={{ transition: "opacity 150ms ease-out" }}>
                {[100, 65, 30].map((p) => (
                    <g key={p}>
                        <line x1={LEFT.x0} y1={yLeft(p)} x2={LEFT.x1} y2={yLeft(p)} stroke={GRID} strokeWidth={1.5} />
                        <text
                            x={LEFT.x0 - 8}
                            y={yLeft(p) + 4}
                            fill={INK_SOFT}
                            fontSize="11"
                            textAnchor="end"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {`${p}%`}
                        </text>
                    </g>
                ))}
                {[0, 1, 2, 3, 4, 5].map((t) => (
                    <text
                        key={t}
                        x={xLeft(t)}
                        y={LEFT.y1 + 24}
                        fill={INK_SOFT}
                        fontSize="11"
                        textAnchor="middle"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {`${t} h`}
                    </text>
                ))}
                <path d={leftCurvePath} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
                <circle cx={xLeft(FOCUS_T)} cy={yLeft(FOCUS_P)} r={4} fill={INK} />
            </g>

            {/* the magnifier the student squeezes */}
            <g opacity={dimOf("window")} style={{ transition: "opacity 150ms ease-out" }}>
                {windowActive && (
                    <rect
                        x={windowLeft}
                        y={windowTop}
                        width={windowRight - windowLeft}
                        height={windowBottom - windowTop}
                        fill={ACCENT_WARM}
                        opacity={0.18}
                    />
                )}
                <rect
                    x={windowLeft}
                    y={windowTop}
                    width={windowRight - windowLeft}
                    height={windowBottom - windowTop}
                    fill={ACCENT_WARM}
                    fillOpacity={windowActive ? 0.18 : 0.08}
                    stroke={ACCENT_WARM}
                    strokeWidth={windowActive ? 3.5 : 2}
                    style={{ transition: "stroke-width 150ms ease-out" }}
                    onPointerEnter={() => setVar("zoomHighlight", "window")}
                    onPointerLeave={() => setVar("zoomHighlight", "")}
                />
                {/* sight lines from the window across to the magnified panel */}
                <line
                    x1={windowRight}
                    y1={windowTop}
                    x2={RIGHT.x0}
                    y2={RIGHT.y0}
                    stroke={ACCENT_WARM}
                    strokeWidth={1.5}
                    strokeDasharray="4 6"
                    opacity={0.6}
                />
                <line
                    x1={windowRight}
                    y1={windowBottom}
                    x2={RIGHT.x0}
                    y2={RIGHT.y1}
                    stroke={ACCENT_WARM}
                    strokeWidth={1.5}
                    strokeDasharray="4 6"
                    opacity={0.6}
                />
                <circle
                    cx={windowRight}
                    cy={windowTop}
                    r={hovered || dragging || windowActive ? 10 : 8}
                    fill={ACCENT_WARM}
                    filter="url(#zoom-handle-shadow)"
                    style={{ transition: "r 150ms ease-out" }}
                />
                <circle
                    cx={windowRight}
                    cy={windowTop}
                    r={22}
                    fill="transparent"
                    style={{ cursor: "nesw-resize", touchAction: "none" }}
                    onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        setDragging(true);
                    }}
                    onPointerEnter={() => setHovered(true)}
                    onPointerLeave={() => setHovered(false)}
                />
            </g>

            {/* right panel: the same curve, magnified, against its tangent */}
            <g clipPath="url(#zoom-right-panel)">
                <g opacity={dimOf("tangent")} style={{ transition: "opacity 150ms ease-out" }}>
                    {tangentActive && (
                        <line
                            x1={xRight(FOCUS_T - halfWidth)}
                            y1={yRight(tangentAt(FOCUS_T - halfWidth))}
                            x2={xRight(FOCUS_T + halfWidth)}
                            y2={yRight(tangentAt(FOCUS_T + halfWidth))}
                            stroke={ACCENT}
                            strokeWidth={11}
                            opacity={0.28}
                            strokeLinecap="round"
                        />
                    )}
                    <line
                        x1={xRight(FOCUS_T - halfWidth)}
                        y1={yRight(tangentAt(FOCUS_T - halfWidth))}
                        x2={xRight(FOCUS_T + halfWidth)}
                        y2={yRight(tangentAt(FOCUS_T + halfWidth))}
                        stroke={ACCENT}
                        strokeWidth={tangentActive ? 4.5 : 3}
                        strokeLinecap="round"
                        style={{ transition: "stroke-width 150ms ease-out" }}
                        onPointerEnter={() => setVar("zoomHighlight", "tangent")}
                        onPointerLeave={() => setVar("zoomHighlight", "")}
                    />
                </g>
                <g opacity={highlight ? 0.4 : 1} style={{ transition: "opacity 150ms ease-out" }}>
                    <path d={rightCurvePath} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
                    <circle cx={xRight(FOCUS_T)} cy={yRight(FOCUS_P)} r={4} fill={INK} />
                </g>
            </g>

            {/* what the magnified window spans */}
            <g opacity={highlight ? 0.4 : 1} style={{ transition: "opacity 150ms ease-out" }}>
                <text
                    x={RIGHT.x0}
                    y={RIGHT.y1 + 24}
                    fill={INK_SOFT}
                    fontSize="11"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {fmtHours(FOCUS_T - halfWidth)}
                </text>
                <text
                    x={RIGHT.x1}
                    y={RIGHT.y1 + 24}
                    fill={INK_SOFT}
                    fontSize="11"
                    textAnchor="end"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {fmtHours(FOCUS_T + halfWidth)}
                </text>
            </g>

            {/* readouts below the two panels */}
            <g opacity={dimOf("window")} style={{ transition: "opacity 150ms ease-out" }}>
                <text
                    x={LEFT.x0}
                    y={VIEW_HEIGHT - 42}
                    fill={INK_SOFT}
                    fontSize="12"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {`Window ${fmtHours(2 * halfWidth)} wide`}
                </text>
                <text
                    x={LEFT.x0}
                    y={VIEW_HEIGHT - 18}
                    fill={INK}
                    fontSize="13"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {`Curve strays from the line by ${fmtPercentPoints(bend)}`}
                </text>
            </g>
            <g opacity={dimOf("tangent")} style={{ transition: "opacity 150ms ease-out" }}>
                <text
                    x={RIGHT.x1}
                    y={VIEW_HEIGHT - 42}
                    fill={INK_SOFT}
                    fontSize="12"
                    textAnchor="end"
                >
                    Steepness of that line
                </text>
                <text
                    x={RIGHT.x1}
                    y={VIEW_HEIGHT - 18}
                    fill={ACCENT}
                    fontSize="17"
                    fontWeight="600"
                    textAnchor="end"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {fmtRate(FOCUS_RATE)}
                </text>
            </g>
        </svg>
    );
}

function ZoomFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="zoom-until-straight"
            caption="Drag the amber corner to squeeze the magnifier tighter around the 2 hour mark. The tighter it gets, the less the curve strays from the teal line."
            onReset={() => {
                setVar("zoomWindow", 0.8);
                setVar("zoomHighlight", "");
            }}
        >
            <ZoomDrawing />
            <InteractionHintSequence
                hintKey="zoom-until-straight-drag"
                steps={[
                    {
                        gesture: "drag",
                        label: "Drag the amber corner inward to zoom",
                        position: { x: "34%", y: "17%" },
                        color: ACCENT_WARM,
                        dragPath: { type: "line", startOffset: { x: 22, y: -14 }, endOffset: { x: -22, y: 14 } },
                    },
                ]}
            />
        </Figure>
    );
}

/* ------------------------------------------------------------------ */
/*  Section blocks                                                     */
/* ------------------------------------------------------------------ */

export const derivativeInstantRateBlocks: ReactElement[] = [
    <StackLayout key="layout-instant-rate-heading" maxWidth="xl">
        <Block id="instant-rate-heading" padding="md">
            <EditableH2 id="h2-instant-rate-heading" blockId="instant-rate-heading">
                The Rate at an Instant
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-instant-rate-naming" maxWidth="xl">
        <Block id="instant-rate-naming" padding="sm">
            <EditableParagraph id="para-instant-rate-naming" blockId="instant-rate-naming">
                That settled value has a name: the derivative at that moment, and the line carrying
                its steepness is the{" "}
                <InlineLinkedHighlight
                    varName="zoomHighlight"
                    highlightId="tangent"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('zoomHighlight'))}
                >
                    tangent
                </InlineLinkedHighlight>
                . Squeeze the{" "}
                <InlineLinkedHighlight
                    varName="zoomHighlight"
                    highlightId="window"
                    showHint={false}
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('zoomHighlightWindowStyle'))}
                >
                    magnifier
                </InlineLinkedHighlight>{" "}
                tighter around the two hour mark and watch the curve give itself up to a straight
                line.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-instant-rate-visual" maxWidth="xl">
        <Block id="instant-rate-visual" padding="sm" hasVisualization>
            <ZoomFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-instant-rate-formula" maxWidth="xl">
        <Block id="instant-rate-formula" padding="lg">
            <FormulaBlock
                latex="\frac{f(a + \scrub{secantGapHours}) - f(a)}{\scrub{secantGapHours}} \; \longrightarrow \; f'(a)"
                variables={scrubVarsFromDefinitions(['secantGapHours'])}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-instant-rate-misconception" maxWidth="xl">
        <Block id="instant-rate-misconception" padding="sm">
            <EditableParagraph id="para-instant-rate-misconception" blockId="instant-rate-misconception">
                It is tempting to argue that one point cannot have a steepness, since a single point
                gives you no run. True, but we never used a single point. We used a run that shrinks
                forever and never actually arrives at zero.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-instant-rate-question-slope" maxWidth="xl">
        <Block id="instant-rate-question-slope" padding="md">
            <EditableParagraph id="para-instant-rate-question-slope" blockId="instant-rate-question-slope">
                Magnified far enough, the curve at the two hour mark is indistinguishable from a
                line whose steepness is{" "}
                <InlineFeedback
                    varName="answer_instant_rate_slope"
                    correctValue="about -11 %/h"
                    position="terminal"
                    successMessage="— and there it is, a genuine rate living at a single instant rather than across a stretch"
                    failureMessage="— squeeze the magnifier down and look again."
                    hint="Zooming never flattens the line, it only reveals which line the curve was hugging"
                    visualizationHint={{
                        blockId: "instant-rate-visual",
                        hintKey: "zoom-slope-hint",
                        label: "Discover it yourself",
                        steps: [
                            {
                                gesture: "drag",
                                label: "Drag the amber corner in until the window is under an hour wide",
                                position: { x: "32%", y: "18%" },
                                completionVar: "zoomWindow",
                                completionValue: 0.45,
                                completionTolerance: 0.12,
                            },
                            {
                                gesture: "drag",
                                label: "Keep squeezing — the curve settles onto the teal line, and its steepness is written below",
                                position: { x: "28%", y: "22%" },
                                completionVar: "zoomWindow",
                                completionValue: 0.2,
                                completionTolerance: 0.06,
                            },
                        ],
                        resetVars: { zoomWindow: 0.85 },
                    }}
                >
                    <InlineClozeChoice
                        varName="answer_instant_rate_slope"
                        correctAnswer="about -11 %/h"
                        options={["0 %/h", "about -5 %/h", "about -11 %/h"]}
                        {...choicePropsFromDefinition(getVariableInfo('answer_instant_rate_slope'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-instant-rate-question-corner" maxWidth="xl">
        <Block id="instant-rate-question-corner" padding="md">
            <EditableParagraph id="para-instant-rate-question-corner" blockId="instant-rate-question-corner">
                Some graphs have a sharp corner that stays just as sharp however far you magnify it.
                At a point like that, the graph simply has no{" "}
                <InlineFeedback
                    varName="answer_instant_rate_corner"
                    correctValue={["derivative", "tangent", "slope", "tangent line", "gradient"]}
                    position="terminal"
                    successMessage="— exactly, no single straight line fits the corner, so there is no one rate to report there"
                    failureMessage="— think about what the zooming produced."
                    hint="Zooming in on a smooth curve handed you one particular line, and that line gave you the rate"
                >
                    <InlineClozeInput
                        varName="answer_instant_rate_corner"
                        correctAnswer={["derivative", "tangent", "slope", "tangent line", "gradient"]}
                        {...clozePropsFromDefinition(getVariableInfo('answer_instant_rate_corner'))}
                    />
                </InlineFeedback>{" "}
                there.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
