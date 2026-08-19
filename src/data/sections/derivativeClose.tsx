import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph } from "@/components/atoms";

export const derivativeCloseBlocks: ReactElement[] = [
    <StackLayout key="layout-close-heading" maxWidth="xl">
        <Block id="close-heading" padding="md">
            <EditableH2 id="h2-close-heading" blockId="close-heading">
                Where That Leaves You
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-close-summary" maxWidth="xl">
        <Block id="close-summary" padding="sm">
            <EditableParagraph id="para-close-summary" blockId="close-summary">
                So the derivative was never a mysterious steepness at a lonely point. It is the
                number that a whole run of perfectly ordinary rise over run slopes closes in on as
                the two moments collapse together. That is how a phone can quote you a rate right
                now from readings taken over time.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-close-next" maxWidth="xl">
        <Block id="close-next" padding="sm">
            <EditableParagraph id="para-close-next" blockId="close-next">
                From here the same shrinking gap gets turned into shortcuts. A handful of rules
                will hand you the derivative of an entire function at once, without you having to
                close the gap by hand ever again.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
