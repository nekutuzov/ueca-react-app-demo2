# UECA React Application - AI Instructions

## Quick Reference

**UECA Documentation**: `node_modules/ueca-react/docs/index.md` - Complete framework documentation  
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
- `@screens` → `src/screens`

## Application Architecture

```
Application
  ├─ AppBrowsingHistory (history management)
  ├─ AppSecurity (auth: isAuthorized, authorize, unauthorize)
  └─ AppUI (infrastructure)
      ├─ ErrorFallback (error boundaries)
      ├─ AppBusyDisplay (spinner)
      ├─ AppDialogManager (dialog system)
      ├─ AppAlertManager (toast notifications, 6 positions)
      ├─ FileSelector (file picker)
      └─ Conditional: AppLoginForm | AppRouter
          ├─ AppLayout (main layout)
          │   ├─ AppSideBar (collapsible, 60px/200px)
          │   └─ Router → Screens
          └─ OtherLayout (minimal)
              └─ Router → External/Docs
```

**Base Components** (`src/components/base/`):
- `BaseModel` - Core UECA with routing/dialog shortcuts
- `UIBaseModel` - UI-focused components
- `EditBaseModel` - Form/validation components

## Component Inventory

**Layout** (`layout/`): Block, Row, Col - flexbox containers with spacing, alignment, fill, cursor props

**Input** (`input/`):
- Button: variants (text/outlined/contained), sizes (small/medium/large), fullWidth
- IconButton: predefined kinds (ok/cancel/delete/refresh/close) or custom SVG, CloseIconButton factory
- TextField`<T>`: variants (outlined/filled/standard), types (text/email/password/etc), multiline, error state
- RadioGroup`<T>`: orientation (row/column), sizes (small/medium/large), color palette
- Select`<T>`: variants (filled/outlined/standard), sizes (small/medium), fullWidth
- Checkbox: sizes, indeterminate state

**Note**: TextField, RadioGroup, and Select accept generic type parameter for type-safe values

**Dialog** (`dialog/`):
- Dialog: modal with backdrop, title, content, actions
- AlertDialog: pre-built with severity icons, details drawer
- Drawer: side panel (left/right/top/bottom), variants (temporary/persistent/permanent)
- AlertDrawer: pre-built drawer for alert details

**Flyout** (`flyouts/`):
- Snackbar: container with positioning, auto-hide, close reasons
- Alert: severity icons (success/info/warning/error), variants (standard/filled/outlined)
- AlertToast: Snackbar + Alert combo (global via AppAlertManager or local as child)

**Navigation** (`navigation/`):
- Router: regex-based, path params `/:id`, query params `?:tab`, type-safe routes
- NavLink: palette colors, underline variants, beforeNavigate hook
- NavItem: modes (icon-only/text-only/icon-text), active state, wraps NavLink
- Breadcrumbs: arrow separator (customizable), NavLink integration

**Tabs** (`tabs/`):
- TabsContainer: orientation (horizontal/vertical), variants (standard/scrollable/fullWidth), manages selection
- Tab: label, icon (4 positions), wrapped text, disabled/invalid states

**Utility** (`misc/`): SeverityIcon, Spinner, FileSelector

**Infrastructure** (`src/core/infrastructure/`):
- **AppSecurity**: UserContext (user, apiToken), messages: `App.Security.IsAuthorized/AuthorizeNative/Unauthorize`
- **AppLoginForm**: TextField/Checkbox inputs, calls `App.Security.AuthorizeNative`
- **AppRouter**: Orchestrates AppLayout/OtherLayout, messages: `App.Router.GetRoute/GoToRoute/SetRoute/SetRouteParams/OpenNewTab/BeforeRouteChange/AfterRouteChange`
- **AppBusyDisplay**: `BusyDisplay.Set/Clear/SetVisibility`
- **AppDialogManager**: `Dialog.Information/Warning/Error/Exception/Confirmation/ActionConfirmation`
- **AppAlertManager**: `Alert.Success/Information/Warning/Error`, position via `anchorOrigin` (top/bottom × left/center/right)
- **appTheme.ts**: Palette system, `resolvePaletteColor()` helper

**Routing**:
- `appRoutes.tsx`: `screenRoutes` (main app), `otherRoutes` (external/docs)
- Types: `ScreenRoute`, `OtherRoute`, `AppRoute`, `AppRouteParams<T>`

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

**CSS Practices**:
- CSS: appearance only (colors, borders, transitions)
- JSX: layout (Block/Row/Col props for padding, spacing, alignment)
- Theme colors: CSS variables + `resolvePaletteColor()`

## Common Usage

**Authentication**:
```tsx
// Login
await model.bus.unicast("App.Security.AuthorizeNative", { user, password });

// Check
const authorized = await model.bus.unicast("App.Security.IsAuthorized");

// Logout
await model.bus.unicast("App.Security.Unauthorize");
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
    "/": () => <HomeScreen id="homeScreen" />,
    "/users/:id": () => <UserDetailScreen id="userDetailScreen" />,
    "/settings?:tab": () => <SettingsScreen id="settingsScreen" />
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

// TextField
<TextField labelView="Email" type="email" value={UECA.bind(() => model, "email")} 
    required error={!!error} helperTextView={error} />

// Checkbox
<Checkbox checked={model.agree} labelView="I agree" onChange={(v) => model.agree = v} />

// Layout
<Row horizontalAlign="spaceBetween" spacing="medium" fill>
    <Block>Left</Block>
    <Block>Right</Block>
</Row>

// NavLink
<NavLink route={{ path: "/home" }} linkView="Home" color="primary.main" underline="hover" />

// Tabs
<TabsContainer tabs={model.tabs} selectedTabId={model.currentTab} 
    onChange={(c) => model.currentTab = c.selectedTab.getTabId()} />
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
// (e.g., RadioGroup/Select internal implementation expects string | number)
<RadioGroup
    labelView="Variant"
    value={UECA.bind(() => model, "variant") as UECA.Bond<string | number>}
    options={[{ value: "text", label: "Text" }]}
/>
```

Benefits of generic types:
- Type-safe bindings without manual casting in most cases
- Better IDE autocomplete and error detection
- Cleaner, more maintainable code
- Automatic type inference from model properties

## Critical Conventions

**Lifecycle** (replace useEffect): `constr`, `init`, `mount`, `draw`, `erase`, `unmount`, `deinit` (see UECA docs)

**State**: Direct assignment: `model.count++`, `model.user = newUser` (MobX reactive)

**Event Handlers**: Auto-generated `onChange<Prop>` (after), `onChanging<Prop>` (before, can transform/block)

**Error Handling**: Centralized via `UECA.globalSettings.errorHandler`

**Component Files**: One folder per component with tsx + css files

**Exports**: Always export `XxxModel`, `XxxParams`, `useXxx`, `Xxx`

**IDs**: `id: useXxx.name` in props, `model.htmlId()` for root element

## Development

- **Dev**: `npm run dev` (port 5001, base `/myapp`)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **MSW**: Toggle `initMocks()` in `src/main.tsx`

**No React.StrictMode**: Conflicts with UECA lifecycle

When modifying: No React patterns, no UI libraries, use message bus for communication, follow UECA patterns in official docs.