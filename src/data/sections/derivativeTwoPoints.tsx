import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { VisualOptionCards } from "@/components/organisms";

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
                Here is a phone battery draining across an evening. Pick any two moments on that
                curve and you can already say something solid: the battery fell this much over
                that long.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-two-points-visual" maxWidth="xl">
        <Block id="two-points-visual">
            <VisualOptionCards
                blockId="two-points-visual"
                intro="Pick how students should build a rate from two moments on the battery curve."
                cards={[
                    {
                        id: "chord-triangle",
                        title: "Two markers and a triangle",
                        manipulate:
                            "Drag either of the two markers along the battery curve",
                        reveals:
                            "Percent lost divided by hours passed is exactly the steepness of the line joining the two moments",
                        looks:
                            "A falling battery curve with two teal markers joined by a straight chord. Underneath the chord a right-angled triangle shows the hours passed along the bottom and the percent lost up the side, both labelled live.",
                        paradigm: "conventional",
                        recommended: true,
                    },
                    {
                        id: "build-the-ratio",
                        title: "Build the rate yourself",
                        manipulate:
                            "Drag a horizontal time bar out from the first moment, then drag a vertical drop bar until its corner lands on the curve",
                        reveals:
                            "The rate is something you construct out of a run and a fall, not a number handed to you",
                        looks:
                            "The curve starts bare with one marker on it. As the student drags, a run bar and a fall bar grow out of that marker, and the ratio appears the instant the corner touches the curve.",
                        paradigm: "constructivist",
                    },
                    {
                        id: "two-intervals-compared",
                        title: "Two intervals, side by side",
                        manipulate:
                            "Drag the endpoints of two separate chords on the same battery curve",
                        reveals:
                            "One curve does not have one rate. The answer depends entirely on which stretch of time you measure",
                        looks:
                            "The same battery curve carrying two chords in different colours, each with its own pair of draggable markers and its own percent-per-hour readout beside it.",
                        paradigm: "comparison",
                    },
                ]}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-two-points-reflection" maxWidth="xl">
        <Block id="two-points-reflection" padding="sm">
            <EditableParagraph id="para-two-points-reflection" blockId="two-points-reflection">
                Percent lost divided by hours passed is the steepness of the straight line joining
                your two moments. It is an average, spread evenly across the whole gap, which is
                exactly why it hides the moment you care about. So what happens if the gap gets small?
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
