# UECA React Application - AI Instructions

## Quick Reference

**UECA Documentation**: `node_modules/ueca-react/docs/raw/index.md` - Complete framework documentation (also https://nekutuzov.github.io/ueca-react-doc/)  
**UECA Skills**: `.claude/skills/ueca-app-development`, `.claude/skills/ueca-app-architecture` - copied from the package on `npm install`  
**Example Project**: `https://github.com/nekutuzov/ueca-react-app`

**Core Principles**:
- UECA framework: Component model with props, children, methods, events, message bus
- **NO React patterns**: No `useState`, `useEffect`, `useContext`, `useReducer`, class components
- **NO UI libraries**: Plain HTML/CSS/SVG only (zero dependencies)
- TypeScript with `strictNullChecks: false`, `noImplicitAny: false`
- MobX powers reactive state (abstracted by UECA)

**Path Aliases**:
- `@components` → `src/components`
- `@core` → `src/core`
- `@api` → `src/api`
- `@screens` → `src/screens` (optional, for application-specific screens)

## Application Architecture

```
Application
  ├─ AppBrowsingHistory (history management, document title)
  ├─ AppSecurity (auth: isAuthorized, authorize, unauthorize)
  ├─ AppLocalStorage (browser localStorage wrapper)
  ├─ AppThemeManager (light/dark theme, persisted)
  └─ AppUI (infrastructure)
      ├─ ErrorFallback (error boundaries)
      ├─ AppBusyDisplay (spinner)
      ├─ AppDialogManager (dialog system)
      ├─ AppAlertManager (toast notifications, 6 positions)
      ├─ AppTooltipManager (the one app-wide tooltip)
      ├─ FileSelector (file picker)
      └─ Conditional: AppLoginForm | AppRouter
          ├─ AppLayout (main layout)
          │   ├─ AppSideBar (collapsible, 60px/280px) → AppMenu
          │   └─ Router → Screens (each in ScreenLayout: top bar, breadcrumbs, theme toggle)
          └─ OtherLayout (minimal)
              └─ Router → External/Docs
```

**Base Components** (`src/components/base/`):
- `BaseModel` - Core UECA with routing/dialog/tooltip shortcuts
- `UIBaseModel` - UI-focused components
- `EditBaseModel` - Form/validation components
- `ScreenBaseModel` - Route-mounted screens

## Component Inventory

**Layout** (`layout/`):
- Block, Row, Col: flexbox containers with spacing, alignment, fill, cursor props. They write layout inline, so CSS cannot override their flex/gap/padding/overflow — use their props
- Grid, GridCell: two-dimensional layout
- Card: container with title, elevation, and padding

**Note**: In dynamic lists, put React's `key` on the item and give each rendered UECA component an explicit, item-derived `id` (siblings may not share one):
```tsx
{items.map((item) => (
    <Button key={item.id} id={`item-${item.id}`} contentView={item.name} />
))}
```

**Buttons** (`buttons/`):
- Button: variants (text/outlined/contained), sizes (xsmall/small/medium/large), align (left/center/right), fullWidth, selected, `tooltipView`
- IconButton: predefined kinds (ok/cancel/delete/refresh/close) or custom icon; `title` becomes the app tooltip; CloseIconButton factory
- Toolbar shorthands (`toolButtons.tsx`): AddNewButton, SaveButton, EditButton, CancelButton, DeleteButton, RefreshButton

**Inputs** (`inputs/`):
- TextField`<T>`: variants (outlined/filled/standard), types (text/email/password/number/tel/url/search), multiline, start/end adornments, built-in validation
- NumberField: parsing, min/max clamping, spin buttons; SearchField: settled (debounced) search text
- RadioGroup`<T>`: orientation (row/column), sizes (small/medium/large), color palette, built-in validation
- Select`<T>`: variants, sizes (small/medium), fullWidth, themed listbox, built-in validation
- Checkbox, Switch: sizes, built-in `required` validation (Checkbox also indeterminate)

**Note**: TextField, RadioGroup, Select, and Checkbox:
- TextField, RadioGroup, and Select accept generic type parameter `<T>` for type-safe values
- All extend EditBase providing built-in validation via `onInternalValidate`
- TextField validates based on `type` property (email, url, tel, number)
- Checkbox validates `required` state (must be checked)
- All support `required` validation automatically

**Data** (`data/`):
- Table`<T>`: sorting, filter row, single/multi-select, sticky first column, resizable columns, virtualization (`rowKeyField`, `maxRows` cap when not virtualized)
- VirtualList, FilterableList (SearchField + VirtualList)

**Popups** (`popups/`):
- Dialog: modal with backdrop, title, content, actions
- AlertDialog: pre-built with severity icons, details drawer
- Popover: anchored, not a singleton (owns state); Menu/MenuItem (`menus/`) are built on it

**Flyouts** (`flyouts/`):
- Snackbar: container with positioning, auto-hide, close reasons
- Alert: severity icons (success/info/warning/error), variants (standard/filled/outlined)
- AlertToast: Snackbar + Alert combo (global via AppAlertManager or local as child)
- Drawer: side panel; EditDrawer: Drawer with a record editor's footer; AlertDrawer: alert details

**Navigation** (`navigation/`):
- Router: regex-based, path params `/:id`, query params `?:tab`, type-safe routes
- NavLink: palette colors, underline variants, beforeNavigate hook, real `href` (resolved over the bus)
- NavItem: modes (icon-only/text-only/icon-text), active state, wraps NavLink, supports onClick for non-navigation actions; NavItemExpandable for groups
- Breadcrumbs: arrow separator (customizable), NavLink integration

**Tabs** (`tabs/`):
- TabsContainer: orientation (horizontal/vertical), variants (standard/scrollable/fullWidth), manages selection
- Tab: label, icon (4 positions), wrapped text, disabled/invalid states

**Misc** (`misc/`): Icon, StatusLabel, ProgressBar, Spinner, SeverityIcon, MarkdownPreview, FileSelector, DropZone, FieldLabel, FieldHint, Notebook; **Panels** (`panels/`): Panel

**App Components** (`src/core/appComponents/`):
- UECAContacts: Four icon buttons (email, GitHub, npm, YouTube) for contact links, supports horizontal/vertical orientation
- ThemeToggle: top-bar light/dark switch (`App.Theme.*` messages)
- CodeSample: a titled, syntax-highlighted listing with a copy button

**Infrastructure** (`src/core/infrastructure/`):
- **AppSecurity**: UserContext (user, apiToken), messages: `App.Security.IsAuthorized/Authorize/Unauthorize`
- **AppLoginForm**: sign-in card (AppAuthForm shell); this demo accepts any credentials
- **AppRouter**: Orchestrates AppLayout/OtherLayout, messages: `App.Router.GetRoute/GoToRoute/SetRoute/SetRouteParams/OpenNewTab/BeforeRouteChange/AfterRouteChange`
- **AppBrowsingHistory**: `App.BrowsingHistory.*`; screens name themselves for the document title with `App.BrowsingHistory.SetPageTitle`
- **AppBusyDisplay**: `BusyDisplay.Set/Clear/SetVisibility`
- **AppDialogManager**: `Dialog.Information/Warning/Error/Exception/Confirmation/ActionConfirmation/Custom`
- **AppAlertManager**: `Alert.Success/Information/Warning/Error`, position via `anchorOrigin` (top/bottom × left/center/right)
- **AppTooltipManager**: the single tooltip; triggers spread `model.tooltipProps(contentView)` onto an element
- **AppThemeManager**: `App.Theme.GetTheme/SetTheme/ToggleTheme/GetMode/SetMode/ListThemes`, broadcasts `App.Theme.Changed`
- **AppLocalStorage**: Browser localStorage wrapper, messages: `App.LocalStorage.Read/Write/Clear`, storage keys defined as union type in `appTypes.ts`
- **appTheme.ts**: Palette tokens → CSS variables (`resolvePaletteColor()` returns `var(--…)`), theme registry

**Routing**:
- `appRoutes.tsx`: `screenRoutes` (main app), `otherRoutes` (external/docs)
- Types: `ScreenRoute`, `OtherRoute`, `AppRoute`, `AppRouteParams<T>`
- **IMPORTANT**: External URLs opened via `openNewTab` MUST be registered in `otherRoutes` with `() => null` handler

## Screens

- `src/screens/showcase/showcaseTopics.tsx` and `src/screens/playground/playgroundTopics.tsx` list every Showcase and Playground page once — key, title, path, icon, summary, lead. The route table, the menu (`appMenu.tsx`), page headers, previous/next links and the Home page cards all read them. A new page is a new entry plus a route with its own stable screen id.
- `src/screens/common/screenPage.tsx`: `ScreenPage` (eyebrow, title, lead, footer slot) and `ScreenPager` — the frame every content page shares.
- Topic screens are rendered from a switch in `showcaseScreen.tsx`, not declared as children, so visiting one topic does not construct the other nine.
- Playground editors (`buttonPlayground.tsx`, `textFieldPlayground.tsx`, `tablePlayground.tsx`) share `PlaygroundWorkbench` and generate their listing with `codeGen.ts`, omitting props equal to the component default.

## Design System

- **`src/tokens.css`**: everything that is not colour — type scale, weights, spacing (mirrors `layoutShared.ts`), control heights, icon sizes, radii, strokes, elevation, motion, z-index, plus typography role classes (`.ueca-label`, `.ueca-eyebrow`, `.ueca-title`…).
- **`src/themes.css`**: one colour block per theme (`:root[data-theme="ueca-light"|"ueca-dark"]`) and theme-independent derived tokens (status ramps, shell chrome, the **control voice**: `--label-*`, `--input-*`, `--select-*`, `--btn-*`, `--tab-*`, `--table-header-*`). Change how all controls read here, not per component.
- **`src/theme.css`**: page surface, markdown and code highlighting.
- Component CSS never uses a hex value — only tokens. Blue `--accent` is action; amber `--marker` marks structure and is never clickable.
- Theme restore without a flash: inline script in `index.html` (storage key `ueca-demo2-theme`, shared with `appTheme.ts`).
- Fonts: Space Grotesk (`--font-display`), IBM Plex Sans (`--font-body`/`--font-ui`), IBM Plex Mono (`--font-mono`).
- **Icons**: `<Icon name="delete" size="sm" />` names a ROLE; `src/core/misc/iconRegistry.ts` maps roles to glyphs from `icons.tsx`. Add a role there rather than importing a glyph at a call site.
- **Tooltips**: never the native `title` attribute on plain elements — use `model.tooltipProps(...)`, `Button.tooltipView` or `IconButton.title`.
- **JSX whitespace**: a line break next to an inline element drops the space — write `{" "}` at the end of the line.
- Source files under `src/` use **CRLF** line endings — preserve them when editing.

## Component Patterns

**Structure** (one folder per component: `button/` → button.tsx + button.css):
```tsx
import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";

type XxxStruct = UIBaseStruct<{
    props: { value: string };
    events: { onChange: (value: string) => void };
}>;

type XxxParams = UIBaseParams<XxxStruct>;
type XxxModel = UIBaseModel<XxxStruct>;

function useXxx(params?: XxxParams): XxxModel {
    const struct: XxxStruct = {
        props: { id: useXxx.name, value: "" },
        View: () => <div id={model.htmlId()}>{model.value}</div>
    };
    const model = useUIBase(struct, params);
    return model;
}

const Xxx = UECA.getFC(useXxx);
export { XxxModel, XxxParams, useXxx, Xxx };
```

**Bindings** (see UECA docs for details):
```tsx
// Unidirectional
disabled: () => model.isLoading

// Bidirectional
value: UECA.bind(() => model, "username")

// Type casting for broader types (when component requires string | number but model has narrower type)
// Note: With generic components (TextField<T>, RadioGroup<T>, Select<T>), casting is often not needed
value={UECA.bind(() => model, "variant") as UECA.Bond<string | number>}

// Critical: Always use UECA.bind() for inputs to prevent focus loss
```

**Message Bus**:
```tsx
// In appMessage.ts
type AppMessage = {
    "Api.GetUsers": { out: User[] };
    "Dialog.Warning": { in: { title?: string, message: string } };
};

// Usage
await model.bus.unicast("Api.GetUsers");  // First subscriber
await model.bus.broadcast("*.Input", "UI.Validate");  // Pattern match
await model.bus.castTo("app.form.button", "Click");  // By fullId

// Handler
messages: {
    "Api.GetUsers": async () => await apiClient.get<User[]>("/users")
}
```

**Observer View Methods** (for complex screens):
```tsx
methods: {
    _EditorView: () => <Col>{/* inputs */}</Col>,
    _PreviewView: () => <Row>{/* preview */}</Row>
}
// Benefits: MobX observers, isolated re-renders, maintains focus
```

**View Method Purity & Helper Functions** (keep View methods clean):
```tsx
// RULE: View methods should be pure JSX only - no const declarations or logic
// Extract complex data/strings/logic to private helper functions after `return model`

// ❌ BAD: Logic clutters View method
methods: {
    _DemoView: () => {
        const codeExample = `const x = 1;\nconst y = 2;`;  // Don't do this
        const items = ["a", "b", "c"];
        return <Block>{/* JSX using codeExample, items */}</Block>;
    }
}

// ✅ GOOD: Pure JSX in View, helpers after return
function useMyComponent(params?: MyParams): MyModel {
    const struct: MyStruct = {
        props: { id: useMyComponent.name },
        methods: {
            // Pure JSX only - calls helper functions
            _DemoView: () => (
                <Block>
                    <pre>{_getCodeExample()}</pre>
                    {_getItems().map((item, index) => <div reactKey={index}>{item}</div>)}
                </Block>
            )
        },
        View: () => <Col>{model._DemoView()}</Col>
    };
    
    const model = useUIBase(struct, params);
    return model;
    
    // Private helper functions after return - available due to hoisting
    function _getCodeExample(): string {
        return `const x = 1;\nconst y = 2;`;
    }
    
    function _getItems(): string[] {
        return ["a", "b", "c"];
    }
}
// Benefits: Clean separation, scannable Views, testable helpers, follows UECA conventions
```

**Component Wrapping** (extend functionality):
```tsx
// NavItem wraps NavLink with bidirectional bindings
props: {
    route: UECA.bind(() => model.navLink, "route"),
    disabled: UECA.bind(() => model.navLink, "disabled"),
    text: UECA.bind(() => model.navLink, "title")  // maps to 'title'
}
// Transparent API, automatic sync, clean separation
```

**Helper Functions for Reducing Boilerplate** (navigation menus, repetitive component creation):
```tsx
// Store reactive state for computed properties
props: {
    _activeRoute: AppRoute  // Single source of truth
}

// Helper creates menu items with computed active state
function useMenuItem(params: { text: string; route: AppRoute; icon?: React.ReactNode }): NavItemModel {
    return useNavItem({
        text: params.text,
        route: params.route,
        icon: params.icon,
        active: () => model._activeRoute?.path === params.route.path,  // Computed, not manual
        mode: () => model.iconsOnly ? "icon-only" : "icon-text"
    });
}

// Helper for expandable groups - auto-detects active state from children
function useGroupMenuItem(params: { text: string; icon?: React.ReactNode; subItems?: () => NavItemModel[] }): NavItemExpandableModel {
    const menuItem = useNavItemExpandable({
        text: params.text,
        icon: params.icon,
        active: () => params.subItems?.().some(item => item.active),  // Auto-computed from children
        subItems: params.subItems,
        onChangeActive: (active) => {
            if (active && !model.iconsOnly) {
                menuItem.expanded = true;  // Auto-expand when active
            }
        }
    });
    return menuItem;
}

// Usage - clean, declarative
children: {
    homeMenuItem: useMenuItem({ text: "Home", route: { path: "/home" }, icon: homeIcon }),
    layoutMenuItem: useGroupMenuItem({ 
        text: "Layout", 
        icon: layoutIcon,
        subItems: () => [model.blockMenuItem, model.rowMenuItem] 
    })
}

// Update active route reactively - everything else updates automatically
messages: {
    "App.Router.AfterRouteChange": async (route) => {
        model._activeRoute = route;  // All computed active states update automatically
    }
}
// Benefits: Eliminates manual sync logic, DRY principle, type-safe, reactive
```

**CSS Practices**:
- CSS: appearance only (colors, borders, transitions)
- JSX: layout (Block/Row/Col props for padding, spacing, alignment)
- Theme colors: CSS variables + `resolvePaletteColor()`

## Common Usage

**Authentication**:
```tsx
// Login
await model.bus.unicast("App.Security.Authorize", { user, password });

// Check
const authorized = await model.bus.unicast("App.Security.IsAuthorized");

// Logout
await model.bus.unicast("App.Security.Unauthorize");
```

**LocalStorage**:
```tsx
// Read
const userContext = await model.bus.unicast("App.LocalStorage.Read", "user-context");

// Write
await model.bus.unicast("App.LocalStorage.Write", { 
    key: "user-context", 
    value: JSON.stringify({ user: "admin" })
});

// Clear
await model.bus.unicast("App.LocalStorage.Clear", "last-used-route");

// Add custom storage keys by editing appTypes.ts:
type AppStorageKey = "user-context" | "last-used-route" | "custom-key";
```

**Dialogs**:
```tsx
await model.bus.unicast("Dialog.Information", { title, message });
await model.bus.unicast("Dialog.Warning", { title, message, details });
await model.bus.unicast("Dialog.Error", { title, message, details });
const ok = await model.bus.unicast("Dialog.Confirmation", { title, message });

try { await operation(); } 
catch (error) { await model.bus.unicast("Dialog.Exception", { title, error }); }
```

**Alerts** (toast notifications):
```tsx
await model.bus.unicast("Alert.Success", { message: "Saved!" });
await model.bus.unicast("Alert.Information", { message: "FYI..." });
await model.bus.unicast("Alert.Warning", { message: "Check this" });
await model.bus.unicast("Alert.Error", { message: "Failed!" });

// Position (in AppUI):
alertManager: useAppAlertManager({
    anchorOrigin: { vertical: "top", horizontal: "center" }
})
```

**Routing**:
```tsx
// Navigate
await model.bus.unicast("App.Router.GoToRoute", { path: "/users/:id", params: { id: "123" } });

// Without history
await model.bus.unicast("App.Router.SetRoute", { path: "/home" });

// Update params
await model.bus.unicast("App.Router.SetRouteParams", { params: { tab: "settings" }, patch: true });

// New tab
await model.bus.unicast("App.Router.OpenNewTab", { path, params });

// Hooks
messages: {
    "App.Router.BeforeRouteChange": async (route) => {
        // Return false to cancel navigation
        return !model.hasUnsavedChanges || await confirmDialog();
    }
}

// Define routes (appRoutes.tsx)
const screenRoutes = {
    "/": () => <DashboardScreen id="dashboardScreen" />,
    "/items/:id": () => <ItemDetailScreen id="itemDetailScreen" />,
    "/config?:tab": () => <ConfigScreen id="configScreen" />
};

// Register external URLs (required for openNewTab)
const otherRoutes = {
    "https://example.com": () => null,
    "https://github.com/user/repo": () => null
};
```

**Busy State**:
```tsx
await model.bus.unicast("BusyDisplay.Set", true);
try { await operation(); } 
finally { await model.bus.unicast("BusyDisplay.Set", false); }
```

**File Selection**:
```tsx
const files = await model.bus.unicast("App.SelectFiles", { 
    fileMask: ".pdf,.jpg,.png", 
    multiselect: true 
});
```

**Components**:
```tsx
// Button
<Button contentView="Save" variant="contained" fullWidth onClick={save} />
<Button contentView="Menu Item" variant="text" align="left" onClick={action} />

// IconButton with tooltip
<IconButton iconView={<CustomIcon />} title="Click to perform action" onClick={handleClick} />

// TextField with built-in validation (type-specific: email, url, tel, number)
<TextField labelView="Email" type="email" value={UECA.bind(() => model, "email")} required />
<TextField labelView="Website" type="url" value={UECA.bind(() => model, "website")} />

// TextField with external error (for custom validation)
<TextField labelView="Username" value={UECA.bind(() => model, "username")} 
    error={!!error} helperTextView={error} />

// Checkbox with built-in validation
<Checkbox checked={UECA.bind(() => model, "agree")} labelView="I agree to terms" required 
    helperTextView="Required" onChange={(v) => model.agree = v} />

// Checkbox without validation
<Checkbox checked={model.newsletter} labelView="Subscribe to newsletter" onChange={(v) => model.newsletter = v} />

// Layout
<Row horizontalAlign="spaceBetween" spacing="medium" fill>
    <Block>Left</Block>
    <Block>Right</Block>
</Row>

// NavLink
<NavLink route={{ path: "/home" }} linkView="Home" color="primary.main" underline="hover" />

// NavItem (for navigation)
<NavItem text="Home" route={{ path: "/home" }} icon={<HomeIcon />} mode="icon-text" />

// NavItem (for actions without navigation)
<NavItem text="Logout" icon={<LogoutIcon />} mode="icon-text" onClick={handleLogout} />

// Tabs
<TabsContainer tabs={model.tabs} selectedTabId={model.currentTab} 
    onChange={(c) => model.currentTab = c.selectedTab.getTabId()} />

// UECAContacts (horizontal or vertical layout)
<UECAContacts orientation="horizontal" />
<UECAContacts orientation="vertical" />
```

**Generic Type Parameters for Input Components**:
TextField, Select, and RadioGroup accept a generic type parameter `<T>` for better type safety:

```tsx
// TextField with string (default)
<TextField labelView="Name" value={UECA.bind(() => model, "name")} />

// TextField with number
<TextField<number> labelView="Age" type="number" value={UECA.bind(() => model, "age")} />

// RadioGroup with union literals - no type casting needed!
<RadioGroup
    labelView="Size"
    value={UECA.bind(() => model, "size")}  // Type-safe, no "as UECA.Bond<...>"
    options={[
        { value: "small", label: "Small" },
        { value: "medium", label: "Medium" },
        { value: "large", label: "Large" }
    ]}
/>

// Select with Palette type
<Select
    labelView="Color"
    value={UECA.bind(() => model, "color")}  // Type inference works automatically
    options={[
        { value: "primary.main", label: "Primary" },
        { value: "secondary.main", label: "Secondary" }
    ]}
/>

// Only use type casting when component explicitly requires broader type
<RadioGroup
    labelView="Variant"
    value={UECA.bind(() => model, "variant") as UECA.Bond<string | number>}
    options={[{ value: "text", label: "Text" }]}
/>
```

Benefits:
- Type-safe bindings without manual casting in most cases
- Better IDE autocomplete and error detection
- Cleaner, more maintainable code
- Automatic type inference from model properties

**Important**: RadioGroup and Select options must have non-empty values (React key requirement):
```tsx
// ❌ BAD: Empty string causes React key warning
options: [{ value: undefined, label: "None" }]

// ✅ GOOD: Use valid non-empty values
options: [{ value: "none", label: "None" }]
```

## Critical Conventions

**Lifecycle** (replace useEffect): `constr`, `init`, `mount`, `draw`, `erase`, `unmount`, `deinit` (see UECA docs)

**State**: Direct assignment: `model.count++`, `model.user = newUser` (MobX reactive)

**Event Handlers**: Auto-generated `onChange<Prop>` (after), `onChanging<Prop>` (before, can transform/block)

**Error Handling**: Centralized via `UECA.globalSettings.errorHandler`

**Component Files**: One folder per component with tsx + css files

**Exports**: Always export `XxxModel`, `XxxParams`, `useXxx`, `Xxx`

**IDs**: `id: useXxx.name` in props, `model.htmlId()` for root element

**React Key**: Use `reactKey` prop for dynamic lists (React's `key` is reserved):
```tsx
{items.map((item, index) => <Block reactKey={index}>{item}</Block>)}
```

**Helper Functions**: Private helper functions (prefixed with `_`) should be defined after `return model` using function declarations for hoisting. Use them to:
- Extract complex data/strings/logic from View methods (keep Views pure JSX only)
- Create multiple similar components (e.g., menu items) with computed properties
- Store reactive state (`_activeRoute`) and reference it in computed bindings to eliminate manual synchronization

**View Method Purity**: View methods should contain pure JSX only with minimal code. Extract const declarations, data processing, and complex logic to private helper functions. This improves readability, maintainability, and follows UECA best practices.

## Development

- **Dev**: `npm run dev` (port 5001, base `/ueca-react-app-demo2/`)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **MSW**: Toggle `initMocks()` in `src/main.tsx`

**No React.StrictMode**: Conflicts with UECA lifecycle

When modifying: No React patterns, no UI libraries, use message bus for communication, follow UECA patterns in official docs.