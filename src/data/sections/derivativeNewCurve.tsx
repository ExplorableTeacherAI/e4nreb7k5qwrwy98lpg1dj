import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { VisualOptionCards } from "@/components/organisms";

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
                a video call. Take the tangent for a walk along this curve and hunt down the moment
                the battery was draining hardest.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-new-curve-visual" maxWidth="xl">
        <Block id="new-curve-visual">
            <VisualOptionCards
                blockId="new-curve-visual"
                intro="Pick how students should apply the idea to an unfamiliar curve."
                cards={[
                    {
                        id: "hunt-fastest-drain",
                        title: "Hunt the fastest drain",
                        manipulate:
                            "Drag the tangent's touch point along the new battery curve",
                        reveals:
                            "The derivative is not one number for a curve. It changes from moment to moment, and its most negative value marks the heaviest drain",
                        looks:
                            "A curve with a steep middle stretch, a tangent line riding wherever the student drags, and a live percent-per-hour readout that dips to its lowest in that middle stretch.",
                        paradigm: "goal",
                        recommended: true,
                    },
                    {
                        id: "build-the-rate-graph",
                        title: "Build the rate graph",
                        manipulate:
                            "Drag the touch point, then click to drop each slope reading onto an empty pair of axes below",
                        reveals:
                            "Collecting the slope at every moment builds a brand new curve, the derivative as a function in its own right",
                        looks:
                            "The battery curve on top, blank axes underneath. Dropped points accumulate below and gradually trace out the shape of the rate graph.",
                        paradigm: "constructivist",
                    },
                    {
                        id: "given-rate-find-time",
                        title: "Given the rate, find the time",
                        manipulate:
                            "Drag the touch point until the tangent matches a stated drain rate of 12 percent per hour",
                        reveals:
                            "Reading a derivative works both directions, and two different moments can share the same rate",
                        looks:
                            "A target rate shown at the top, the tangent riding the curve, and a marker that turns teal at each moment where the steepness matches.",
                        paradigm: "inversion",
                    },
                ]}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-new-curve-reflection" maxWidth="xl">
        <Block id="new-curve-reflection" padding="sm">
            <EditableParagraph id="para-new-curve-reflection" blockId="new-curve-reflection">
                Notice that the derivative refused to stay still as you moved. It carries a
                different value at every moment, which means it is not a number attached to the
                curve. It is a whole function of its own.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
