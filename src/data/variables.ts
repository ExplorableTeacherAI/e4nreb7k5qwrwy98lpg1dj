/**
 * Variables Configuration
 * =======================
 * 
 * CENTRAL PLACE TO DEFINE ALL SHARED VARIABLES
 * 
 * This file defines all variables that can be shared across sections.
 * AI agents should read this file to understand what variables are available.
 * 
 * USAGE:
 * 1. Define variables here with their default values and metadata
 * 2. Use them in any section with: const x = useVar('variableName', defaultValue)
 * 3. Update them with: setVar('variableName', newValue)
 */

import { type VarValue } from '@/stores';

/**
 * Variable definition with metadata
 */
export interface VariableDefinition {
    /** Default value */
    defaultValue: VarValue;
    /** Human-readable label */
    label?: string;
    /** Description for AI agents */
    description?: string;
    /** Variable type hint */
    type?: 'number' | 'text' | 'boolean' | 'select' | 'array' | 'object' | 'spotColor' | 'linkedHighlight';
    /** Unit (e.g., 'Hz', '°', 'm/s') - for numbers */
    unit?: string;
    /** Minimum value (for number sliders) */
    min?: number;
    /** Maximum value (for number sliders) */
    max?: number;
    /** Step increment (for number sliders) */
    step?: number;
    /** Display color for InlineScrubbleNumber / InlineSpotColor (e.g. '#D81B60') */
    color?: string;
    /** Options for 'select' type variables */
    options?: string[];
    /** Placeholder text for text inputs */
    placeholder?: string;
    /**
     * Correct answer for cloze input validation.
     * Accepts a single string, pipe-separated alternates (e.g. "first | 1 | 1st"),
     * or an array of accepted answers (e.g. ["first", "1", "1st"]).
     */
    correctAnswer?: string | string[];
    /** Whether cloze matching is case sensitive */
    caseSensitive?: boolean;
    /** Background color for inline components */
    bgColor?: string;
    /** Schema hint for object types (for AI agents) */
    schema?: string;
}

/**
 * =====================================================
 * 🎯 DEFINE YOUR VARIABLES HERE
 * =====================================================
 * 
 * SUPPORTED TYPES:
 * 
 * 1. NUMBER (slider):
 *    { defaultValue: 5, type: 'number', min: 0, max: 10, step: 1 }
 * 
 * 2. TEXT (free text):
 *    { defaultValue: 'Hello', type: 'text', placeholder: 'Enter text...' }
 * 
 * 3. SELECT (dropdown):
 *    { defaultValue: 'sine', type: 'select', options: ['sine', 'cosine', 'tangent'] }
 * 
 * 4. BOOLEAN (toggle):
 *    { defaultValue: true, type: 'boolean' }
 * 
 * 5. ARRAY (list of numbers):
 *    { defaultValue: [1, 2, 3], type: 'array' }
 * 
 * 6. OBJECT (complex data):
 *    { defaultValue: { x: 5, y: 10 }, type: 'object', schema: '{ x: number, y: number }' }
 */
export const variableDefinitions: Record<string, VariableDefinition> = {
    // ─────────────────────────────────────────
    // Derivatives lesson — shared variables
    // ─────────────────────────────────────────
    earlyStart: {
        defaultValue: 0.5,
        type: 'number',
        label: 'Early stretch start',
        description: 'Start time of the early interval on the battery curve',
        unit: 'h',
        min: 0,
        max: 5,
        step: 0.05,
        color: '#62D0AD',
    },
    earlyEnd: {
        defaultValue: 1.5,
        type: 'number',
        label: 'Early stretch end',
        description: 'End time of the early interval on the battery curve',
        unit: 'h',
        min: 0,
        max: 5,
        step: 0.05,
        color: '#62D0AD',
    },
    lateStart: {
        defaultValue: 3,
        type: 'number',
        label: 'Late stretch start',
        description: 'Start time of the late interval on the battery curve',
        unit: 'h',
        min: 0,
        max: 5,
        step: 0.05,
        color: '#8E90F5',
    },
    lateEnd: {
        defaultValue: 4.5,
        type: 'number',
        label: 'Late stretch end',
        description: 'End time of the late interval on the battery curve',
        unit: 'h',
        min: 0,
        max: 5,
        step: 0.05,
        color: '#8E90F5',
    },
    // Hover-link between the prose phrases and the two chords in the figure.
    chordHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Chord highlight',
        description: 'Which chord is highlighted: early, late, or empty',
        color: '#2FA983',
        bgColor: 'rgba(98, 208, 173, 0.22)',
    },
    // Style-only definition: gives the "late stretch" phrase its indigo colours
    // while still writing to the shared chordHighlight variable.
    chordHighlightLateStyle: {
        defaultValue: '',
        type: 'text',
        label: 'Chord highlight (late styling)',
        description: 'Colour styling for the late stretch highlight phrase',
        color: '#6366F1',
        bgColor: 'rgba(142, 144, 245, 0.22)',
    },
    answer_two_points_average: {
        defaultValue: '',
        type: 'text',
        label: 'Average drain answer',
        description: 'Student answer for the average percent per hour question',
        placeholder: '???',
        correctAnswer: ['12', '12%', '-12'],
        color: '#8E90F5',
    },
    answer_two_points_meaning: {
        defaultValue: '',
        type: 'select',
        label: 'Average meaning answer',
        description: 'Student answer on whether an average rate holds at every instant',
        placeholder: '???',
        correctAnswer: 'false',
        options: ['true', 'false'],
        color: '#AC8BF9',
    },
    gapPredictedSlope: {
        defaultValue: -3,
        type: 'number',
        label: 'Predicted rate at 2 hours',
        description: 'The drain rate the student predicts before closing the gap',
        unit: '%/h',
        min: -30,
        max: 6,
        step: 0.1,
        color: '#F7B23B',
    },
    gapPredictionLocked: {
        defaultValue: false,
        type: 'boolean',
        label: 'Prediction locked',
        description: 'True once the student has committed to their predicted rate',
    },
    gapSecondMoment: {
        defaultValue: 4.2,
        type: 'number',
        label: 'Second moment',
        description: 'The moving moment that closes in on the fixed 2 hour mark',
        unit: 'h',
        min: 2.1,
        max: 5,
        step: 0.05,
        color: '#62D0AD',
    },
    // Hover-link between the prose phrases and the closing-gap figure.
    closingHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Closing gap highlight',
        description: 'Which element is highlighted: guess, chord, or empty',
        color: '#2FA983',
        bgColor: 'rgba(98, 208, 173, 0.22)',
    },
    // Style-only definition: amber colours for the guessed-line phrase.
    closingHighlightGuessStyle: {
        defaultValue: '',
        type: 'text',
        label: 'Closing gap highlight (guess styling)',
        description: 'Colour styling for the predicted line phrase',
        color: '#C77F0B',
        bgColor: 'rgba(247, 178, 59, 0.22)',
    },
    answer_closing_gap_behaviour: {
        defaultValue: '',
        type: 'select',
        label: 'Shrinking gap behaviour',
        description: 'What the chord rate does as the gap closes',
        placeholder: '???',
        correctAnswer: 'settles on one value',
        options: ['settles on one value', 'falls away to zero', 'grows without limit'],
        color: '#AC8BF9',
    },
    answer_closing_gap_value: {
        defaultValue: '',
        type: 'select',
        label: 'Settled rate value',
        description: 'The value the chord rate settles near at the 2 hour mark',
        placeholder: '???',
        correctAnswer: 'about -12 %/h',
        options: ['0 %/h', 'about -5 %/h', 'about -12 %/h', 'about -20 %/h'],
        color: '#62CCF9',
    },
    rateSampleTime: {
        defaultValue: 1.2,
        type: 'number',
        label: 'Sampled moment',
        description: 'Where the tangent touches the second battery curve',
        unit: 'h',
        min: 0,
        max: 4,
        step: 0.05,
        color: '#62D0AD',
    },
    rateSampleTimes: {
        defaultValue: [],
        type: 'array',
        label: 'Plotted moments',
        description: 'Times the student has plotted onto the rate graph',
    },
    rateGraphHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Rate graph highlight',
        description: 'Which element is highlighted: tangent, dots, or empty',
        color: '#2FA983',
        bgColor: 'rgba(98, 208, 173, 0.22)',
    },
    // Style-only definition: indigo colours for the rate graph phrase.
    rateGraphHighlightDotsStyle: {
        defaultValue: '',
        type: 'text',
        label: 'Rate graph highlight (dots styling)',
        description: 'Colour styling for the rate graph phrase',
        color: '#6366F1',
        bgColor: 'rgba(142, 144, 245, 0.22)',
    },
    answer_new_curve_half: {
        defaultValue: '',
        type: 'select',
        label: 'Half the starting drain',
        description: 'When the drain rate reaches half its starting value',
        placeholder: '???',
        correctAnswer: 'about 2 hours',
        options: ['about 1 hour', 'about 2 hours', 'about 3 hours'],
        color: '#AC8BF9',
    },
    answer_new_curve_positive: {
        defaultValue: '',
        type: 'select',
        label: 'Positive rate meaning',
        description: 'What a rate above zero would mean for the battery',
        placeholder: '???',
        correctAnswer: 'charging back up',
        options: ['charging back up', 'draining even faster', 'holding perfectly steady'],
        color: '#62CCF9',
    },
    secantGapHours: {
        defaultValue: 1.5,
        type: 'number',
        label: 'Gap between the two moments',
        description: 'The time gap h between the fixed moment and the second moment on the battery curve',
        unit: 'h',
        min: 0.05,
        max: 3,
        step: 0.05,
        color: '#62D0AD',
    },

    // ========================================
    // ADD YOUR VARIABLES HERE
    // ========================================

    // Uncomment and modify these examples for your lesson:

    /*
    // ─────────────────────────────────────────
    // NUMBER - Use with sliders
    // ─────────────────────────────────────────
    myValue: {
        defaultValue: 5,
        type: 'number',
        label: 'My Value',
        description: 'A number that controls something',
        unit: 'm',           // optional unit display
        min: 0,
        max: 10,
        step: 0.5,
    },

    // ─────────────────────────────────────────
    // TEXT - Free text input
    // ─────────────────────────────────────────
    lessonTitle: {
        defaultValue: 'My Lesson',
        type: 'text',
        label: 'Lesson Title',
        description: 'The title of your lesson',
        placeholder: 'Enter a title...',
    },

    // ─────────────────────────────────────────
    // SELECT - Dropdown with options
    // ─────────────────────────────────────────
    difficulty: {
        defaultValue: 'medium',
        type: 'select',
        label: 'Difficulty',
        description: 'The difficulty level of the lesson',
        options: ['easy', 'medium', 'hard', 'expert'],
    },

    // ─────────────────────────────────────────
    // BOOLEAN - Toggle switch
    // ─────────────────────────────────────────
    showHints: {
        defaultValue: true,
        type: 'boolean',
        label: 'Show Hints',
        description: 'Toggle to show or hide hints',
    },

    // ─────────────────────────────────────────
    // ARRAY - List of numbers
    // ─────────────────────────────────────────
    dataPoints: {
        defaultValue: [1, 4, 9, 16, 25],
        type: 'array',
        label: 'Data Points',
        description: 'Y-values for plotting a graph',
    },

    // ─────────────────────────────────────────
    // OBJECT - Complex structured data
    // ─────────────────────────────────────────
    graphSettings: {
        defaultValue: { 
            xMin: -10, 
            xMax: 10, 
            showGrid: true 
        },
        type: 'object',
        label: 'Graph Settings',
        description: 'Configuration for the graph display',
        schema: '{ xMin: number, xMax: number, showGrid: boolean }',
    },
    */
};

/**
 * Get all variable names (for AI agents to discover)
 */
export const getVariableNames = (): string[] => {
    return Object.keys(variableDefinitions);
};

/**
 * Get a variable's default value
 */
export const getDefaultValue = (name: string): VarValue => {
    return variableDefinitions[name]?.defaultValue ?? 0;
};

/**
 * Get a variable's metadata
 */
export const getVariableInfo = (name: string): VariableDefinition | undefined => {
    return variableDefinitions[name];
};

/**
 * Get all default values as a record (for initialization)
 */
export const getDefaultValues = (): Record<string, VarValue> => {
    const defaults: Record<string, VarValue> = {};
    for (const [name, def] of Object.entries(variableDefinitions)) {
        defaults[name] = def.defaultValue;
    }
    return defaults;
};

/**
 * Get number props for InlineScrubbleNumber from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx, or getExampleVariableInfo(name) in exampleBlocks.tsx.
 */
export function numberPropsFromDefinition(def: VariableDefinition | undefined): {
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    color?: string;
} {
    if (!def || def.type !== 'number') return {};
    return {
        defaultValue: def.defaultValue as number,
        min: def.min,
        max: def.max,
        step: def.step,
        ...(def.color ? { color: def.color } : {}),
    };
}

/**
 * Get cloze input props for InlineClozeInput from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx, or getExampleVariableInfo(name) in exampleBlocks.tsx.
 */
/**
 * Get cloze choice props for InlineClozeChoice from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx.
 */
export function choicePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Get toggle props for InlineToggle from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx.
 */
export function togglePropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

export function clozePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
    caseSensitive?: boolean;
} {
    if (!def || def.type !== 'text') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
        ...(def.caseSensitive !== undefined ? { caseSensitive: def.caseSensitive } : {}),
    };
}

/**
 * Get spot-color props for InlineSpotColor from a variable definition.
 * Extracts the `color` field.
 *
 * @example
 * <InlineSpotColor
 *     varName="radius"
 *     {...spotColorPropsFromDefinition(getVariableInfo('radius'))}
 * >
 *     radius
 * </InlineSpotColor>
 */
export function spotColorPropsFromDefinition(def: VariableDefinition | undefined): {
    color: string;
} {
    return {
        color: def?.color ?? '#8B5CF6',
    };
}

/**
 * Get linked-highlight props for InlineLinkedHighlight from a variable definition.
 * Extracts the `color` and `bgColor` fields.
 *
 * @example
 * <InlineLinkedHighlight
 *     varName="activeHighlight"
 *     highlightId="radius"
 *     {...linkedHighlightPropsFromDefinition(getVariableInfo('activeHighlight'))}
 * >
 *     radius
 * </InlineLinkedHighlight>
 */
export function linkedHighlightPropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    return {
        ...(def?.color ? { color: def.color } : {}),
        ...(def?.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Build the `variables` prop for FormulaBlock from variable definitions.
 *
 * Takes an array of variable names and returns the config map expected by
 * `<FormulaBlock variables={...} />`.
 *
 * @example
 * import { scrubVarsFromDefinitions } from './variables';
 *
 * <FormulaBlock
 *     latex="\scrub{mass} \times \scrub{accel}"
 *     variables={scrubVarsFromDefinitions(['mass', 'accel'])}
 * />
 */
export function scrubVarsFromDefinitions(
    varNames: string[],
): Record<string, { min?: number; max?: number; step?: number; color?: string }> {
    const result: Record<string, { min?: number; max?: number; step?: number; color?: string }> = {};
    for (const name of varNames) {
        const def = variableDefinitions[name];
        if (!def) continue;
        result[name] = {
            ...(def.min !== undefined ? { min: def.min } : {}),
            ...(def.max !== undefined ? { max: def.max } : {}),
            ...(def.step !== undefined ? { step: def.step } : {}),
            ...(def.color ? { color: def.color } : {}),
        };
    }
    return result;
}
