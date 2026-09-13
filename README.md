# UECA-React Showcase

A working application built with [UECA-React](https://www.npmjs.com/package/ueca-react): a component library of some fifty components on plain HTML, CSS and SVG, a live Showcase of every one of them, and a Playground where a component's properties and its source change together. It runs in a light and a dark theme, and every screen, service and control in it follows the same UECA component shape.

**Live demo:** https://nekutuzov.github.io/ueca-react-app-demo2/

## What is in it

- **Showcase** — nine topic pages plus an overview: design tokens, layout, controls, status, icons, overlays, data, lists and dynamic content. Every specimen renders against the active theme, so toggling the theme restyles the whole page.
- **Playground** — Button, Text field and Table on a workbench: a live instance, a properties panel that drives it, and a generated listing with every default left out. The Table editor runs up to 10,000 rows, with and without windowing.
- **Light and dark themes** — one set of colour tokens per theme, switched from the top bar and remembered between visits, with no flash on load.
- **An application shell** — collapsible sidebar, breadcrumbs, sign-in (any credentials work — there is no server), dialogs, toasts, a busy display and a single app-wide tooltip, each a component reached over the message bus.
- **No UI library** — the controls are this repository's own UECA components.

## What is UECA-React?

UECA-React gives every React component the same explicit structure: `props`, `children`, `methods`, `events`, `messages` and a `View`, in that order. On top of that it adds stable component IDs, automatic change events for every property, one- and two-way property bindings, lifecycle hooks and a typed message bus. State is reactive (MobX, abstracted away): you assign to a property and the views that read it update.

- **Documentation:** https://nekutuzov.github.io/ueca-react-doc/
- **Framework docs in the package:** `node_modules/ueca-react/docs/raw/index.md`

## Getting started

```bash
npm install
npm run dev
```

Then open `http://localhost:5001/ueca-react-app-demo2/`.

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 5001 |
| `npm run build` | Type-check and production build into `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the production build |
| `npm run deploy` | Build and copy to the GitHub Pages checkout (`deploy.ps1`) |

`npm install` also copies the UECA agent skills shipped with `ueca-react` into `.claude/skills/`.

## Project structure

```
src/
├── main.tsx                  # Entry point: global settings, error handler, render
├── tokens.css                # Non-colour design tokens: type, spacing, radii, motion, z-index
├── themes.css                # Colour tokens per theme (ueca-light, ueca-dark) and the control voice
├── theme.css                 # Page surface, markdown and code highlighting
├── api/                      # REST client and MSW mocks
├── components/               # The component library
│   ├── base/                 # useBase → useUIBase → useEditBase / useScreenBase
│   ├── buttons/              # Button, IconButton, toolbar shorthands
│   ├── data/                 # Table, VirtualList, FilterableList
│   ├── flyouts/              # Alert, Snackbar, AlertToast, Drawer, EditDrawer, AlertDrawer
│   ├── inputs/               # TextField, NumberField, SearchField, Select, Checkbox, Switch, RadioGroup
│   ├── layout/               # Block, Row, Col, Grid, GridCell, Card
│   ├── menus/                # Menu, MenuItem
│   ├── misc/                 # Icon, StatusLabel, ProgressBar, Spinner, MarkdownPreview, DropZone, …
│   ├── navigation/           # Router, NavLink, NavItem, NavItemExpandable, Breadcrumbs
│   ├── panels/               # Panel
│   ├── popups/               # Dialog, AlertDialog, Popover
│   └── tabs/                 # TabsContainer, Tab
├── core/                     # The application shell and its services
│   ├── infrastructure/       # Application, AppUI, router, routes, browsing history, security,
│   │                         # dialogs, alerts, tooltip, busy display, theme manager, message contract
│   ├── appLayout/            # Sidebar, menu, layouts
│   ├── screenLayout/         # Screen frame: top bar, breadcrumbs, CRUD and tabbed screens
│   ├── appComponents/        # CodeSample, ThemeToggle, UECAContacts
│   └── misc/                 # Icon set and role registry, overlay positioning and stacking
└── screens/
    ├── home/                 # Landing page
    ├── common/               # ScreenPage: the shared eyebrow / title / lead / pager frame
    ├── showcase/             # One screen per topic; showcaseTopics.tsx lists them
    └── playground/           # Button, Text field and Table editors; playgroundTopics.tsx lists them
```

`showcaseTopics.tsx` and `playgroundTopics.tsx` are the single source for each page's route, menu entry, title, lead and previous/next links. Adding a page means adding an entry there and a route in `appRoutes.tsx`.

## Design system

- **Tokens, not literals.** Component CSS reads tokens only. `tokens.css` holds everything that is not colour; `themes.css` holds one colour block per theme, selected by `<html data-theme>`. A theme is added by adding a block there and an entry in `core/infrastructure/appTheme.ts`.
- **Two accents with two jobs.** Blue is action (links, active navigation, primary buttons); amber marks structure (eyebrows, section markers) and is never clickable.
- **One control voice.** Labels, field values, buttons, tabs and table headers take their type from a small set of tokens in `themes.css`, so every control in a form changes together.
- **Icons by role.** Call sites name a role (`<Icon name="delete" />`); `core/misc/iconRegistry.ts` decides which glyph backs it.
- **Layout by props.** Block, Row and Col set layout inline from their props; CSS handles appearance.

## The component pattern

```tsx
import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";

type CounterStruct = UIBaseStruct<{
    props: { count: number };
    methods: { increment: () => void };
}>;

type CounterParams = UIBaseParams<CounterStruct>;
type CounterModel = UIBaseModel<CounterStruct>;

function useCounter(params?: CounterParams): CounterModel {
    const struct: CounterStruct = {
        props: {
            id: useCounter.name,
            count: 0
        },

        methods: {
            increment: () => {
                model.count++;
            }
        },

        View: () => (
            <button id={model.htmlId()} onClick={() => model.increment()}>
                Clicked {model.count} times
            </button>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const Counter = UECA.getFC(useCounter);

export { CounterParams, CounterModel, useCounter, Counter };
```

Services are components too: they declare `messages` handlers and render nothing, and the rest of the app reaches them over the bus.

```tsx
await model.bus.unicast("Alert.Success", { message: "Saved" });
const ok = await model.bus.unicast("Dialog.Confirmation", { title: "Delete", message: "Are you sure?" });
await model.bus.unicast("App.Router.GoToRoute", { path: "/playground/table" });
```

Every message is declared in `core/infrastructure/appMessage.ts`.

## Path aliases

- `@components` → `src/components`
- `@core` → `src/core`
- `@api` → `src/api`
- `@screens` → `src/screens`

## Technologies

- UECA-React 3.0
- React 19
- TypeScript 5.8
- MobX 6 (through UECA-React)
- Vite 7
- MSW 2 (API mocking)

## More UECA-React

- [Documentation](https://nekutuzov.github.io/ueca-react-doc/)
- [MUI components demo](https://nekutuzov.github.io/ueca-react-app-demo1) ([source](https://github.com/nekutuzov/ueca-react-app-demo1))
- [npm package](https://www.npmjs.com/package/ueca-react)
- [Video introduction](https://youtu.be/SQl8f-qGxwU?si=-YTWPpPB7ExBZ6L0)

## Contact

- **Email:** [cranesoft@protonmail.com](mailto:cranesoft@protonmail.com)
- **Author:** Aleksey Suvorov

## License

ISC
