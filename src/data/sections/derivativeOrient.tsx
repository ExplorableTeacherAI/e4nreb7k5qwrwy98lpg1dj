import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH1, EditableParagraph } from "@/components/atoms";

export const derivativeOrientBlocks: ReactElement[] = [
    <StackLayout key="layout-orient-title" maxWidth="xl">
        <Block id="orient-title" padding="md">
            <EditableH1 id="h1-orient-title" blockId="orient-title">
                How Fast Is It Dropping Right Now?
            </EditableH1>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-orient-opening" maxWidth="xl">
        <Block id="orient-opening" padding="sm">
            <EditableParagraph id="para-orient-opening" blockId="orient-opening">
                Your phone says the battery is at 62 percent. What it never tells you is the
                thing you actually want to know: how fast is it draining at this very moment?
                Not on average since breakfast. Right now.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-orient-promise" maxWidth="xl">
        <Block id="orient-promise" padding="sm">
            <EditableParagraph id="para-orient-promise" blockId="orient-promise">That question is what a derivative answers, and by the end of this you will be able to say exactly what it means and where it comes from. We start from nothing more than two points on a graph, so if you can read a point off a curve, you are ready to.</EditableParagraph>
        </Block>
    </StackLayout>,
];
