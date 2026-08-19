import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { VisualOptionCards } from "@/components/organisms";

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
                Now park the first moment at the two hour mark and bring the second one toward it.
                Every position you stop at gives a fresh average, taken over a shorter stretch of
                the evening than the last one.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-closing-gap-visual" maxWidth="xl">
        <Block id="closing-gap-visual">
            <VisualOptionCards
                blockId="closing-gap-visual"
                intro="Pick how students should experience the secant slopes converging."
                cards={[
                    {
                        id: "ghost-trail-secants",
                        title: "Slide it home, leave a trail",
                        manipulate:
                            "Drag the second marker along the curve toward the fixed one at 2 hours",
                        reveals:
                            "As the gap shrinks the chords stop swinging and pile onto one single line, and the rate settles rather than collapsing",
                        looks:
                            "The battery curve with one fixed marker. Every chord the student passes through stays behind as a faded ghost, so a fan of old chords visibly narrows onto one steep line as they drag inward.",
                        paradigm: "temporal",
                        recommended: true,
                    },
                    {
                        id: "hit-the-target-band",
                        title: "Hit the target rate",
                        manipulate:
                            "Drag the second marker until the average rate lands inside a narrow target band",
                        reveals:
                            "The target is only reachable when the two moments are extremely close, so closeness is what buys accuracy",
                        looks:
                            "A rate dial beside the curve with a thin amber target zone. The needle swings wildly for wide gaps and creeps into the zone only as the markers nearly touch.",
                        paradigm: "goal",
                    },
                    {
                        id: "call-it-before-closing",
                        title: "Call it before you close",
                        manipulate:
                            "Drag a line through the fixed moment to the steepness you predict the averages are heading for, then close the gap",
                        reveals:
                            "Students who expect the slope to flatten to nothing watch their guessed line sit visibly apart from where the chords actually land",
                        looks:
                            "The student's guessed line stays on screen as a dashed grey ghost while the real chords sweep in and settle, the difference between the two shown as an angle.",
                        targetsMisconception:
                            "Students think the slope at a single point must be zero, since there is no run",
                        paradigm: "prediction",
                    },
                ]}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-closing-gap-reflection" maxWidth="xl">
        <Block id="closing-gap-reflection" padding="sm">
            <EditableParagraph id="para-closing-gap-reflection" blockId="closing-gap-reflection">
                The gap shrinks toward nothing, and yet the rate does not vanish with it. It homes
                in on one particular value. That value is the thing we have been hunting since the
                first screen.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
