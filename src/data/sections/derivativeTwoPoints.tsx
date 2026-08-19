import { useRef, useState, type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeInput,
    InlineClozeChoice,
    InlineFeedback,
    InlineLinkedHighlight,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp } from "@/lib/motion";
import {
    T_MIN,
    T_MAX,
    battery,
    averageRate,
    fmtRate,
    fmtHours,
    makeScales,
    ACCENT,
    ACCENT_ALT,
    INK,
    INK_SOFT,
    GRID,
} from "./batteryCurve";
import {
    getVariableInfo,
    clozePropsFromDefinition,
    choicePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
} from "../variables";

/* ------------------------------------------------------------------ */
/*  Figure geometry (model + formats live in ./batteryCurve)           */
/* ------------------------------------------------------------------ */

const MIN_GAP = 0.4;
const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 400;
const PLOT = { x0: 60, x1: 600, y0: 90, y1: 330 };
const { xOf, yOf, tOfX, curvePath } = makeScales(PLOT);

const EARLY_COLOR = ACCENT;
const LATE_COLOR = ACCENT_ALT;

/* ------------------------------------------------------------------ */
/*  The bespoke figure                                                 */
/* ------------------------------------------------------------------ */

interface ChordProps {
    start: number;
    end: number;
    color: string;
    id: "early" | "late";
    dim: number;
    active: boolean;
    onHover: (id: "early" | "late" | null) => void;
    onDragStart: (which: "start" | "end") => void;
}

function Chord({ start, end, color, id, dim, active, onHover, onDragStart }: ChordProps) {
    const p1: [number, number] = [xOf(start), yOf(battery(start))];
    const p2: [number, number] = [xOf(end), yOf(battery(end))];

    return (
        <g
            opacity={dim}
            style={{ transition: "opacity 150ms ease-out" }}
            onPointerEnter={() => onHover(id)}
            onPointerLeave={() => onHover(null)}
        >
            {/* run and rise legs — the two ingredients of the rate */}
            <line
                x1={p1[0]}
                y1={p1[1]}
                x2={p2[0]}
                y2={p1[1]}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                strokeLinecap="round"
                opacity={0.7}
            />
            <line
                x1={p2[0]}
                y1={p1[1]}
                x2={p2[0]}
                y2={p2[1]}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                strokeLinecap="round"
                opacity={0.7}
            />

            {/* halo while highlighted */}
            {active && (
                <line
                    x1={p1[0]}
                    y1={p1[1]}
                    x2={p2[0]}
                    y2={p2[1]}
                    stroke={color}
                    strokeWidth={10}
                    opacity={0.28}
                    strokeLinecap="round"
                />
            )}
            <line
                x1={p1[0]}
                y1={p1[1]}
                x2={p2[0]}
                y2={p2[1]}
                stroke={color}
                strokeWidth={active ? 4.5 : 3}
                strokeLinecap="round"
                style={{ transition: "stroke-width 150ms ease-out" }}
            />

            {([
                ["start", p1],
                ["end", p2],
            ] as const).map(([which, point]) => (
                <g key={which}>
                    <circle
                        cx={point[0]}
                        cy={point[1]}
                        r={active ? 10 : 8}
                        fill={color}
                        filter="url(#two-intervals-handle-shadow)"
                        style={{ transition: "r 150ms ease-out" }}
                    />
                    <circle
                        cx={point[0]}
                        cy={point[1]}
                        r={22}
                        fill="transparent"
                        style={{ cursor: "ew-resize", touchAction: "none" }}
                        onPointerDown={(event) => {
                            event.currentTarget.setPointerCapture(event.pointerId);
                            onDragStart(which);
                        }}
                    />
                </g>
            ))}
        </g>
    );
}

function TwoIntervalsDrawing() {
    const setVar = useSetVar();
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragging, setDragging] = useState<null | { chord: "early" | "late"; which: "start" | "end" }>(null);

    const earlyStart = useVar<number>("earlyStart", 0.5);
    const earlyEnd = useVar<number>("earlyEnd", 1.5);
    const lateStart = useVar<number>("lateStart", 3);
    const lateEnd = useVar<number>("lateEnd", 4.5);
    const highlight = useVar<string>("chordHighlight", "");

    const earlyRate = averageRate(earlyStart, earlyEnd);
    const lateRate = averageRate(lateStart, lateEnd);

    const dimOf = (id: string) => (highlight && highlight !== id ? 0.32 : 1);

    const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!dragging || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const t = tOfX(((event.clientX - rect.left) / rect.width) * VIEW_WIDTH);

        if (dragging.chord === "early") {
            if (dragging.which === "start") setVar("earlyStart", clamp(t, T_MIN, earlyEnd - MIN_GAP));
            else setVar("earlyEnd", clamp(t, earlyStart + MIN_GAP, T_MAX));
        } else {
            if (dragging.which === "start") setVar("lateStart", clamp(t, T_MIN, lateEnd - MIN_GAP));
            else setVar("lateEnd", clamp(t, lateStart + MIN_GAP, T_MAX));
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
                <filter id="two-intervals-handle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            {/* readouts, one per stretch, above the drawing */}
            <g opacity={dimOf("early")} style={{ transition: "opacity 150ms ease-out" }}>
                <text x={PLOT.x0} y={36} fill={INK_SOFT} fontSize="12" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {`Early stretch, ${fmtHours(earlyStart)} to ${fmtHours(earlyEnd)}`}
                </text>
                <text
                    x={PLOT.x0}
                    y={60}
                    fill={EARLY_COLOR}
                    fontSize="17"
                    fontWeight="600"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {fmtRate(earlyRate)}
                </text>
            </g>
            <g opacity={dimOf("late")} style={{ transition: "opacity 150ms ease-out" }}>
                <text
                    x={PLOT.x1}
                    y={36}
                    fill={INK_SOFT}
                    fontSize="12"
                    textAnchor="end"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {`Late stretch, ${fmtHours(lateStart)} to ${fmtHours(lateEnd)}`}
                </text>
                <text
                    x={PLOT.x1}
                    y={60}
                    fill={LATE_COLOR}
                    fontSize="17"
                    fontWeight="600"
                    textAnchor="end"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {fmtRate(lateRate)}
                </text>
            </g>

            {/* quiet structure: gridlines, axis labels, the battery curve */}
            <g opacity={highlight ? 0.4 : 1} style={{ transition: "opacity 150ms ease-out" }}>
                {[100, 65, 30].map((p) => (
                    <g key={p}>
                        <line
                            x1={PLOT.x0}
                            y1={yOf(p)}
                            x2={PLOT.x1}
                            y2={yOf(p)}
                            stroke={GRID}
                            strokeWidth={1.5}
                        />
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

            <Chord
                start={lateStart}
                end={lateEnd}
                color={LATE_COLOR}
                id="late"
                dim={dimOf("late")}
                active={highlight === "late"}
                onHover={(id) => setVar("chordHighlight", id ?? "")}
                onDragStart={(which) => setDragging({ chord: "late", which })}
            />
            <Chord
                start={earlyStart}
                end={earlyEnd}
                color={EARLY_COLOR}
                id="early"
                dim={dimOf("early")}
                active={highlight === "early"}
                onHover={(id) => setVar("chordHighlight", id ?? "")}
                onDragStart={(which) => setDragging({ chord: "early", which })}
            />
        </svg>
    );
}

function TwoIntervalsFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="two-intervals"
            caption="Each stretch reports percent lost divided by hours passed. Drag any of the four markers and the two readouts part company."
            onReset={() => {
                setVar("earlyStart", 0.5);
                setVar("earlyEnd", 1.5);
                setVar("lateStart", 3);
                setVar("lateEnd", 4.5);
                setVar("chordHighlight", "");
            }}
        >
            <TwoIntervalsDrawing />
            <InteractionHintSequence
                hintKey="two-intervals-drag"
                steps={[
                    {
                        gesture: "drag-horizontal",
                        label: "Drag a teal marker along the curve",
                        position: { x: "35%", y: "34%" },
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

export const derivativeTwoPointsBlocks: ReactElement[] = [
    <StackLayout key="layout-two-points-heading" maxWidth="xl">
        <Block id="two-points-heading" padding="md">
            <EditableH2 id="h2-two-points-heading" blockId="two-points-heading">
                Two Moments, One Number
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-two-points-setup" maxWidth="xl">
        <Block id="two-points-setup" padding="sm">
            <EditableParagraph id="para-two-points-setup" blockId="two-points-setup">
                Here is a phone battery draining across an evening. Drag the endpoints of the teal{" "}
                <InlineLinkedHighlight
                    varName="chordHighlight"
                    highlightId="early"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('chordHighlight'))}
                >
                    early stretch
                </InlineLinkedHighlight>{" "}
                and the indigo{" "}
                <InlineLinkedHighlight
                    varName="chordHighlight"
                    highlightId="late"
                    showHint={false}
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('chordHighlightLateStyle'))}
                >
                    late stretch
                </InlineLinkedHighlight>{" "}
                along the curve, and compare what each one reports in percent per hour.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-two-points-visual" maxWidth="xl">
        <Block id="two-points-visual" padding="sm" hasVisualization>
            <TwoIntervalsFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-two-points-reflection" maxWidth="xl">
        <Block id="two-points-reflection" padding="sm">
            <EditableParagraph id="para-two-points-reflection" blockId="two-points-reflection">
                Each readout is percent lost divided by hours passed, which is the steepness of the
                straight line joining two moments. Both are honest averages, and they still
                disagree. One curve, no single rate. So what happens if a stretch gets tiny?
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-block-1787108907106" maxWidth="xl">
        <Block id="block-1787108907106" padding="sm">
            <EditableParagraph id="para-block-1787108907106" blockId="block-1787108907106"></EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-two-points-question-average" maxWidth="xl">
        <Block id="two-points-question-average" padding="md">
            <EditableParagraph id="para-two-points-question-average" blockId="two-points-question-average">
                A different phone slid from 74 percent at eight o'clock to 50 percent at ten, so
                across those two hours it drained at an average of{" "}
                <InlineFeedback
                    varName="answer_two_points_average"
                    correctValue={["12", "12%", "-12"]}
                    position="mid"
                    hint="Percent lost over hours passed, and 24 percent went in 2 hours"
                >
                    <InlineClozeInput
                        varName="answer_two_points_average"
                        correctAnswer={["12", "12%", "-12"]}
                        {...clozePropsFromDefinition(getVariableInfo('answer_two_points_average'))}
                    />
                </InlineFeedback>{" "}
                percent per hour.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-two-points-question-meaning" maxWidth="xl">
        <Block id="two-points-question-meaning" padding="md">
            <EditableParagraph id="para-two-points-question-meaning" blockId="two-points-question-meaning">
                That phone was therefore losing exactly 12 percent every single hour of the two,
                and never any faster or slower. That claim is{" "}
                <InlineFeedback
                    varName="answer_two_points_meaning"
                    correctValue="false"
                    position="terminal"
                    successMessage="— exactly, an average flattens out everything that happened inside the stretch, so it can hide a calm hour and a punishing one"
                    failureMessage="— have another look."
                    hint="A shorter stretch tucked inside a longer one does not have to agree with it"
                    visualizationHint={{
                        blockId: "two-points-visual",
                        hintKey: "two-intervals-nested-hint",
                        label: "Discover it yourself",
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Drag the left teal marker back to the 1 hour mark",
                                position: { x: "26%", y: "32%" },
                                completionVar: "earlyStart",
                                completionValue: 1,
                                completionTolerance: 0.3,
                            },
                            {
                                gesture: "drag-horizontal",
                                label: "Bring the right teal marker in to about 3 hours",
                                position: { x: "56%", y: "42%" },
                                completionVar: "earlyEnd",
                                completionValue: 3,
                                completionTolerance: 0.35,
                            },
                            {
                                gesture: "drag-horizontal",
                                label: "Now tuck the indigo pair inside that window, starting near 1.5 hours",
                                position: { x: "34%", y: "36%" },
                                completionVar: "lateStart",
                                completionValue: 1.5,
                                completionTolerance: 0.35,
                            },
                        ],
                        resetVars: { earlyStart: 0.5, earlyEnd: 1.5, lateStart: 3, lateEnd: 4.5 },
                    }}
                >
                    <InlineClozeChoice
                        varName="answer_two_points_meaning"
                        correctAnswer="false"
                        options={["true", "false"]}
                        {...choicePropsFromDefinition(getVariableInfo('answer_two_points_meaning'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-block-1787121224792" maxWidth="xl">
        <Block id="block-1787121224792" padding="sm">
            <EditableParagraph id="para-block-1787121224792" blockId="block-1787121224792">this para /</EditableParagraph>
        </Block>
    </StackLayout>,
];
