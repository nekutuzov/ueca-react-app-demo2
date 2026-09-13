import type { IconName } from "@core";

// The Playground, described once — the same shape as the showcase list, read by the route table,
// the menu, each page header and the previous/next links.
//
// Where the Showcase lays every variant out side by side, a Playground page is one component on a
// workbench: change a property and the live instance and its source follow.

type PlaygroundTopicKey = "button" | "textField" | "table";

type PlaygroundTopic = {
    key: PlaygroundTopicKey;
    title: string;
    path: string;
    icon: IconName;
    // One line for a card that links to the page — the Home page lists every page this way.
    summary: string;
    lead: React.ReactNode;
};

const PLAYGROUND_TOPICS: PlaygroundTopic[] = [
    {
        key: "button",
        title: "Button",
        path: "/playground/button",
        icon: "button",
        summary: "Variant, size, colour and icons, with the JSX that renders them.",
        lead: <>
            The action every screen is built from. Pick a variant, a size and a colour, give it an icon at
            either end, and the preview and its source update together — the snippet is exactly what
            renders, with every property left at its default omitted.
        </>
    },
    {
        key: "textField",
        title: "Text field",
        path: "/playground/text-field",
        icon: "textField",
        summary: "Input types, built-in validation, adornments and states.",
        lead: <>
            A single- or multi-line input that validates itself. Its <code>type</code> drives both the
            keyboard and the built-in check — try an email or a URL — and <code>required</code> is
            enforced without a line of validation code.
        </>
    },
    {
        key: "table",
        title: "Table",
        path: "/playground/table",
        icon: "table",
        summary: "Sorting, filters, selection and windowing over 10,000 rows.",
        lead: <>
            The data grid: sorting, a filter row, single or multi-select, a sticky first column,
            resizable columns and windowed rendering. Turn the features on one at a time over a data set
            of up to ten thousand rows.
        </>
    }
];

function playgroundTopic(key: PlaygroundTopicKey): PlaygroundTopic {
    return PLAYGROUND_TOPICS.find((t) => t.key === key);
}

function playgroundNeighbours(key: PlaygroundTopicKey): { prev: PlaygroundTopic; next: PlaygroundTopic } {
    const i = PLAYGROUND_TOPICS.findIndex((t) => t.key === key);
    return {
        prev: i > 0 ? PLAYGROUND_TOPICS[i - 1] : undefined,
        next: i >= 0 && i < PLAYGROUND_TOPICS.length - 1 ? PLAYGROUND_TOPICS[i + 1] : undefined
    };
}

export { PlaygroundTopicKey, PlaygroundTopic, PLAYGROUND_TOPICS, playgroundTopic, playgroundNeighbours };
