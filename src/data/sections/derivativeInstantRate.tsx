import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { FormulaBlock } from "@/components/molecules";
import { VisualOptionCards } from "@/components/organisms";
import { scrubVarsFromDefinitions } from "../variables";

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
                The value those shrinking averages close in on has a name. It is the derivative of
                the battery function at that moment, and the one line carrying that steepness is
                the tangent.
            </EditableParagraph>
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

    <StackLayout key="layout-instant-rate-visual" maxWidth="xl">
        <Block id="instant-rate-visual">
            <VisualOptionCards
                blockId="instant-rate-visual"
                intro="Pick how students should meet the tangent line and the idea of a rate at a single instant."
                cards={[
                    {
                        id: "zero-or-not-prediction",
                        title: "Zero or not?",
                        manipulate:
                            "Tilt a line pinned at the two hour mark to the steepness you believe it has, commit, then watch the real chords arrive",
                        reveals:
                            "A single instant does have a rate, because the rate came from runs that shrink without ever reaching zero",
                        looks:
                            "The curve with one pinned point and a tiltable line through it. After committing, the student's line freezes as a grey ghost while teal chords sweep in and settle on the true tangent, the two steepnesses read out side by side.",
                        targetsMisconception:
                            "Students think the slope at a single point must be zero, since there is no run",
                        paradigm: "prediction",
                        recommended: true,
                    },
                    {
                        id: "set-rate-find-moment",
                        title: "Set the rate, find the moment",
                        manipulate:
                            "Drag the tangent line's steepness handle and watch the touch point slide along the curve to the moment that drains at that rate",
                        reveals:
                            "Every instant carries its own rate, so a rate can be searched for as well as read off",
                        looks:
                            "A tangent line glued to the battery curve. The student steers the slope, and the point of contact travels to wherever that steepness occurs, with the clock time updating live.",
                        paradigm: "inversion",
                    },
                    {
                        id: "zoom-until-straight",
                        title: "Zoom until it is straight",
                        manipulate:
                            "Drag a magnifier into the curve at the two hour mark to zoom deeper and deeper",
                        reveals:
                            "Close enough in, a smooth curve is indistinguishable from a straight line, and that line's steepness is the derivative",
                        looks:
                            "A small window over the curve that magnifies as the student drags. The visible arc flattens step by step until the curve and the tangent lie on top of each other.",
                        paradigm: "temporal",
                    },
                ]}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-instant-rate-misconception" maxWidth="xl">
        <Block id="instant-rate-misconception" padding="sm">
            <EditableParagraph id="para-instant-rate-misconception" blockId="instant-rate-misconception">
                It is tempting to argue that a single point cannot have a steepness at all, since
                one point gives you no run to divide by. True enough, but we never used a single
                point. We used a run that shrinks forever and never actually arrives at zero.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
