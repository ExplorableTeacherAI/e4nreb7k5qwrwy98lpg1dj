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
    T_MAX,
    battery,
    averageRate,
    fmtRate,
    fmtHours,
    makeScales,
    clipLine,
    ACCENT,
    ACCENT_WARM,
    GHOST,
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
/*  Figure geometry                                                    */
/* ------------------------------------------------------------------ */

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 400;
const PLOT = { x0: 60, x1: 600, y0: 90, y1: 330 };
const { xOf, yOf, tOfX, pxPerHour, pxPerPercent, curvePath } = makeScales(PLOT);

/** The moment the whole section is about. */
const FIXED_T = 2;
const FIXED_P = battery(FIXED_T);
const FIXED_X = xOf(FIXED_T);
const FIXED_Y = yOf(FIXED_P);

const MIN_SLOPE = -30;
const MAX_SLOPE = 6;
const HANDLE_REACH = 120;

/** A drain rate in %/h becomes a screen gradient (y grows downward). */
const screenGradient = (rate: number) => (-rate * pxPerPercent) / pxPerHour;

/* ------------------------------------------------------------------ */
/*  The bespoke figure                                                 */
/* ------------------------------------------------------------------ */

function ClosingGapDrawing() {
    const setVar = useSetVar();
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragging, setDragging] = useState<null | "guess" | "moment">(null);
    const [hovered, setHovered] = useState(false);

    const predictedRate = useVar<number>("gapPredictedSlope", -3);
    const locked = useVar<boolean>("gapPredictionLocked", false);
    const secondMoment = useVar<number>("gapSecondMoment", 4.2);
    const highlight = useVar<string>("closingHighlight", "");

    const chordRate = averageRate(FIXED_T, secondMoment);
    const gap = secondMoment - FIXED_T;
    const difference = Math.abs(chordRate - predictedRate);

    const dimOf = (id: string) => (highlight && highlight !== id ? 0.32 : 1);
    const guessActive = highlight === "guess";
    const chordActive = highlight === "chord";

    const guessGradient = screenGradient(predictedRate);
    const [guessA, guessB] = clipLine(FIXED_X, FIXED_Y, guessGradient, PLOT);
    const handleX = FIXED_X + HANDLE_REACH / Math.sqrt(1 + guessGradient * guessGradient);
    const handleY = FIXED_Y + guessGradient * (handleX - FIXED_X);

    const secondX = xOf(secondMoment);
    const secondY = yOf(battery(secondMoment));

    const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!dragging || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const px = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH;
        const py = ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT;

        if (dragging === "guess") {
            const dx = px - FIXED_X;
            if (dx < 24) return;
            const rate = (-(py - FIXED_Y) / dx) * (pxPerHour / pxPerPercent);
            setVar("gapPredictedSlope", clamp(rate, MIN_SLOPE, MAX_SLOPE));
        } else {
            setVar("gapSecondMoment", clamp(tOfX(px), 2.1, T_MAX));
        }
    };

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full"
            onPointerMove={handlePointerMove}
            onPointerUp={() => setDragging(null)}
            onPointerLeave={() => setDragging(null)}
        >
            <defs>
                <filter id="closing-gap-handle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            {/* readouts above the drawing */}
            <g opacity={dimOf("guess")} style={{ transition: "opacity 150ms ease-out" }}>
                <text x={PLOT.x0} y={36} fill={INK_SOFT} fontSize="12">
                    {locked ? "Your locked guess" : "Your guess"}
                </text>
                <text
                    x={PLOT.x0}
                    y={60}
                    fill={locked ? GHOST : ACCENT_WARM}
                    fontSize="17"
                    fontWeight="600"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {fmtRate(predictedRate)}
                </text>
            </g>

            {locked && (
                <g opacity={dimOf("chord")} style={{ transition: "opacity 150ms ease-out" }}>
                    <text
                        x={PLOT.x1}
                        y={36}
                        fill={INK_SOFT}
                        fontSize="12"
                        textAnchor="end"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {`Average over a gap of ${fmtHours(gap)}`}
                    </text>
                    <text
                        x={PLOT.x1}
                        y={60}
                        fill={ACCENT}
                        fontSize="17"
                        fontWeight="600"
                        textAnchor="end"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {fmtRate(chordRate)}
                    </text>
                </g>
            )}

            {/* quiet structure */}
            <g opacity={highlight ? 0.4 : 1} style={{ transition: "opacity 150ms ease-out" }}>
                {[100, 65, 30].map((p) => (
                    <g key={p}>
                        <line x1={PLOT.x0} y1={yOf(p)} x2={PLOT.x1} y2={yOf(p)} stroke={GRID} strokeWidth={1.5} />
                        <text
                            x={PLOT.x0 - 8}
                            y={yOf(p) + 4}
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
                        x={xOf(t)}
                        y={PLOT.y1 + 26}
                        fill={INK_SOFT}
                        fontSize="11"
                        textAnchor="middle"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {`${t} h`}
                    </text>
                ))}
                <path d={curvePath} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
                <text x={PLOT.x0} y={PLOT.y1 + 52} fill={INK_SOFT} fontSize="12">
                    Hours since the phone came off the charger
                </text>
            </g>

            {/* the guessed line — amber while adjustable, a grey ghost once locked */}
            <g opacity={dimOf("guess")} style={{ transition: "opacity 150ms ease-out" }}>
                {guessActive && (
                    <line
                        x1={guessA[0]}
                        y1={guessA[1]}
                        x2={guessB[0]}
                        y2={guessB[1]}
                        stroke={locked ? GHOST : ACCENT_WARM}
                        strokeWidth={10}
                        opacity={0.28}
                        strokeLinecap="round"
                    />
                )}
                <line
                    x1={guessA[0]}
                    y1={guessA[1]}
                    x2={guessB[0]}
                    y2={guessB[1]}
                    stroke={locked ? GHOST : ACCENT_WARM}
                    strokeWidth={guessActive ? 4 : 2.5}
                    strokeDasharray={locked ? "7 6" : undefined}
                    strokeLinecap="round"
                    style={{ transition: "stroke-width 150ms ease-out" }}
                    onPointerEnter={() => setVar("closingHighlight", "guess")}
                    onPointerLeave={() => setVar("closingHighlight", "")}
                />
                {!locked && (
                    <g>
                        <circle
                            cx={handleX}
                            cy={handleY}
                            r={hovered || dragging === "guess" ? 13 : 11}
                            fill={ACCENT_WARM}
                            filter="url(#closing-gap-handle-shadow)"
                            style={{ transition: "r 150ms ease-out" }}
                        />
                        <circle
                            cx={handleX}
                            cy={handleY}
                            r={24}
                            fill="transparent"
                            style={{ cursor: "grab", touchAction: "none" }}
                            onPointerDown={(event) => {
                                event.currentTarget.setPointerCapture(event.pointerId);
                                setDragging("guess");
                            }}
                            onPointerEnter={() => setHovered(true)}
                            onPointerLeave={() => setHovered(false)}
                        />
                    </g>
                )}
            </g>

            {/* the live chord, only once the guess is committed */}
            {locked && (
                <g opacity={dimOf("chord")} style={{ transition: "opacity 150ms ease-out" }}>
                    {chordActive && (
                        <line
                            x1={FIXED_X}
                            y1={FIXED_Y}
                            x2={secondX}
                            y2={secondY}
                            stroke={ACCENT}
                            strokeWidth={10}
                            opacity={0.28}
                            strokeLinecap="round"
                        />
                    )}
                    <line
                        x1={FIXED_X}
                        y1={FIXED_Y}
                        x2={secondX}
                        y2={secondY}
                        stroke={ACCENT}
                        strokeWidth={chordActive ? 4.5 : 3}
                        strokeLinecap="round"
                        style={{ transition: "stroke-width 150ms ease-out" }}
                        onPointerEnter={() => setVar("closingHighlight", "chord")}
                        onPointerLeave={() => setVar("closingHighlight", "")}
                    />
                    <circle
                        cx={secondX}
                        cy={secondY}
                        r={chordActive ? 10 : 8}
                        fill={ACCENT}
                        filter="url(#closing-gap-handle-shadow)"
                        style={{ transition: "r 150ms ease-out" }}
                    />
                    <circle
                        cx={secondX}
                        cy={secondY}
                        r={24}
                        fill="transparent"
                        style={{ cursor: "ew-resize", touchAction: "none" }}
                        onPointerDown={(event) => {
                            event.currentTarget.setPointerCapture(event.pointerId);
                            setDragging("moment");
                        }}
                    />
                </g>
            )}

            {/* the fixed moment everything pivots around */}
            <g opacity={highlight ? 0.4 : 1} style={{ transition: "opacity 150ms ease-out" }}>
                <circle cx={FIXED_X} cy={FIXED_Y} r={6} fill={INK} />
                <text
                    x={FIXED_X}
                    y={FIXED_Y - 16}
                    fill={INK}
                    fontSize="12"
                    textAnchor="middle"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    2 h
                </text>
            </g>

            {/* how far the guess sits from the closing average */}
            {locked && (
                <text
                    x={PLOT.x0}
                    y={PLOT.y0 - 8}
                    fill={INK_SOFT}
                    fontSize="12"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {`Your guess is ${fmtRate(difference)} away`}
                </text>
            )}
        </svg>
    );
}

function ClosingGapFigure() {
    const setVar = useSetVar();
    const locked = useVar<boolean>("gapPredictionLocked", false);

    const reset = () => {
        setVar("gapPredictedSlope", -3);
        setVar("gapPredictionLocked", false);
        setVar("gapSecondMoment", 4.2);
        setVar("closingHighlight", "");
    };

    return (
        <Figure
            id="closing-gap"
            caption="Tilt the amber line to the rate you expect at the 2 hour mark, lock it in, then walk the teal marker home and watch where the averages actually settle."
            onReset={reset}
        >
            <ClosingGapDrawing />
            <div className="px-6 pb-5">
                {locked ? (
                    <button
                        type="button"
                        onClick={reset}
                        className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
                    >
                        Guess again
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setVar("gapPredictionLocked", true)}
                        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        Lock in my guess
                    </button>
                )}
            </div>
            <InteractionHintSequence
                hintKey="closing-gap-predict"
                currentStep={locked ? 1 : 0}
                steps={[
                    {
                        gesture: "drag-vertical",
                        label: "Tilt the amber line to the rate you expect at 2 hours",
                        position: { x: "62%", y: "40%" },
                        color: ACCENT_WARM,
                        dragPath: { type: "line", startOffset: { x: 0, y: -26 }, endOffset: { x: 0, y: 26 } },
                    },
                    {
                        gesture: "drag-horizontal",
                        label: "Now drag the teal marker in toward the 2 hour mark",
                        position: { x: "78%", y: "58%" },
                        dragPath: { type: "line", startOffset: { x: 26, y: 0 }, endOffset: { x: -26, y: 0 } },
                    },
                ]}
            />
        </Figure>
    );
}

/* ------------------------------------------------------------------ */
/*  Section blocks                                                     */
/* ------------------------------------------------------------------ */

export const derivativeClosingGapBlocks: ReactElement[] = [
    <StackLayout key="layout-closing-gap-heading" maxWidth="xl">
        <Block id="closing-gap-heading" padding="md">
            <EditableH2 id="h2-closing-gap-heading" blockId="closing-gap-heading">
                Closing the Gap
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-closing-gap-setup" maxWidth="xl">
        <Block id="closing-gap-setup" padding="sm">
            <EditableParagraph id="para-closing-gap-setup" blockId="closing-gap-setup">
                Now park one moment at the two hour mark. Before anything moves, tilt the{" "}
                <InlineLinkedHighlight
                    varName="closingHighlight"
                    highlightId="guess"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('closingHighlightGuessStyle'))}
                >
                    amber line
                </InlineLinkedHighlight>{" "}
                to the rate you believe the shrinking averages are heading for and lock your guess
                in. Then walk the{" "}
                <InlineLinkedHighlight
                    varName="closingHighlight"
                    highlightId="chord"
                    showHint={false}
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('closingHighlight'))}
                >
                    teal marker
                </InlineLinkedHighlight>{" "}
                home.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-closing-gap-visual" maxWidth="xl">
        <Block id="closing-gap-visual" padding="sm" hasVisualization>
            <ClosingGapFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-closing-gap-reflection" maxWidth="xl">
        <Block id="closing-gap-reflection" padding="sm">
            <EditableParagraph id="para-closing-gap-reflection" blockId="closing-gap-reflection">
                The gap shrinks toward nothing, and yet the rate does not vanish with it. It homes
                in on one particular value, and your ghosted guess now shows exactly how far your
                instinct sat from it.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-closing-gap-question-behaviour" maxWidth="xl">
        <Block id="closing-gap-question-behaviour" padding="md">
            <EditableParagraph
                id="para-closing-gap-question-behaviour"
                blockId="closing-gap-question-behaviour"
            >
                As the second moment creeps in toward two hours, the average rate{" "}
                <InlineFeedback
                    varName="answer_closing_gap_behaviour"
                    correctValue="settles on one value"
                    position="terminal"
                    successMessage="— yes, and that stubborn value is the whole point of everything that follows"
                    failureMessage="— worth another look."
                    hint="The gap heads for nothing, but the readout does not follow it there"
                    visualizationHint={{
                        blockId: "closing-gap-visual",
                        hintKey: "closing-gap-behaviour-hint",
                        label: "Discover it yourself",
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Drag the teal marker back to about 3 hours",
                                position: { x: "58%", y: "56%" },
                                completionVar: "gapSecondMoment",
                                completionValue: 3,
                                completionTolerance: 0.25,
                            },
                            {
                                gesture: "drag-horizontal",
                                label: "Keep coming, now to about 2.5 hours",
                                position: { x: "48%", y: "50%" },
                                completionVar: "gapSecondMoment",
                                completionValue: 2.5,
                                completionTolerance: 0.2,
                            },
                            {
                                gesture: "drag-horizontal",
                                label: "All the way in — the readout stops moving much at all",
                                position: { x: "42%", y: "46%" },
                                completionVar: "gapSecondMoment",
                                completionValue: 2.15,
                                completionTolerance: 0.12,
                            },
                        ],
                        resetVars: { gapSecondMoment: 4.2, gapPredictionLocked: true },
                    }}
                >
                    <InlineClozeChoice
                        varName="answer_closing_gap_behaviour"
                        correctAnswer="settles on one value"
                        options={["settles on one value", "falls away to zero", "grows without limit"]}
                        {...choicePropsFromDefinition(getVariableInfo('answer_closing_gap_behaviour'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-closing-gap-question-value" maxWidth="xl">
        <Block id="closing-gap-question-value" padding="md">
            <EditableParagraph id="para-closing-gap-question-value" blockId="closing-gap-question-value">
                Closed right down, the reading at the two hour mark lands somewhere near{" "}
                <InlineFeedback
                    varName="answer_closing_gap_value"
                    correctValue="about -12 %/h"
                    position="terminal"
                    successMessage="— and that is the battery's true drain at that instant, not an average over anything"
                    failureMessage="— check the teal readout again."
                    hint="Bring the marker as close to 2 hours as it will go, then read the number"
                    visualizationHint={{
                        blockId: "closing-gap-visual",
                        hintKey: "closing-gap-value-hint",
                        label: "Read it off the graph",
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Drag the teal marker as close to 2 hours as it will go",
                                position: { x: "44%", y: "48%" },
                                completionVar: "gapSecondMoment",
                                completionValue: 2.15,
                                completionTolerance: 0.12,
                            },
                        ],
                        resetVars: { gapSecondMoment: 4.2, gapPredictionLocked: true },
                    }}
                >
                    <InlineClozeChoice
                        varName="answer_closing_gap_value"
                        correctAnswer="about -12 %/h"
                        options={["0 %/h", "about -5 %/h", "about -12 %/h", "about -20 %/h"]}
                        {...choicePropsFromDefinition(getVariableInfo('answer_closing_gap_value'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
