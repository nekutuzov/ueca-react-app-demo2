# UECA React Application Architecture

Welcome to the **UECA React** application! This document provides a comprehensive overview of the application's architecture, structure, and key concepts.

**[← Back to Welcome](/home)**

---

## 📊 Architecture Diagram

To better understand the application structure, view the comprehensive architecture diagram:

**[Architecture Diagram →](/home/diagram)**

---

## 🏗️ Application Architecture

The UECA React application follows a well-structured architecture built on the UECA framework, which provides a component-based model with reactive state management powered by MobX.

### Core Principles

1. **UECA Framework**: Component model with props, children, methods, events, and message bus
2. **No React Patterns**: No `useState`, `useEffect`, `useContext`, `useReducer`, or class components
3. **No UI Libraries**: Plain HTML/CSS/SVG only - zero external UI dependencies
4. **TypeScript**: Configured with `strictNullChecks: false` and `noImplicitAny: false`
5. **MobX Reactive State**: Abstracted by UECA for seamless reactivity

---

## 📂 Project Structure

```
.github/
└── copilot-instructions.md # AI coding assistant instructions
src/
├── api/                    # API client and mock services
│   ├── restApiClient.ts
│   └── mocks/
├── components/             # Reusable UI components
│   ├── base/              # Base component models
│   ├── layout/            # Layout components (Block, Row, Col, Card)
│   ├── buttons/           # Button components
│   ├── inputs/            # Input components (TextField, Checkbox, etc.)
│   ├── navigation/        # Navigation components (Router, NavLink, etc.)
│   ├── popups/            # Dialog and popup components
│   ├── flyouts/           # Snackbar, Alert, Drawer components
│   ├── tabs/              # Tab components
│   └── misc/              # Utility components (Spinner, FileSelector, etc.)
├── core/                   # Core application infrastructure
│   ├── infrastructure/    # App-level components and services
│   ├── appLayout/         # Main application layouts
│   ├── appComponents/     # Shared application-specific components
│   └── misc/              # Icons and utilities
└── screens/               # Application screens (optional)
    ├── home/
    ├── layout/
    ├── inputs/
    ├── navigation/
    ├── popups/
    └── tabs/
```

---

## 🎯 Application Hierarchy

The application follows a hierarchical structure starting from the root `Application` component:

### Application Root
```
Application
├─ AppBrowsingHistory (history management)
├─ AppSecurity (authentication & authorization)
├─ AppLocalStorage (browser localStorage wrapper)
└─ AppUI (infrastructure)
    ├─ ErrorFallback (error boundaries)
    ├─ AppBusyDisplay (loading spinner)
    ├─ AppDialogManager (dialog system)
    ├─ AppAlertManager (toast notifications)
    ├─ FileSelector (file picker)
    └─ Conditional: AppLoginForm | AppRouter
        ├─ AppLayout (main layout with sidebar)
        │   ├─ AppSideBar (collapsible navigation)
        │   └─ Router → Screens
        └─ OtherLayout (minimal layout)
            └─ Router → External/Docs
```

### Key Infrastructure Components

#### 1. **AppSecurity**
Manages authentication and authorization:
- **UserContext**: Stores user info and API token
- **Messages**:
  - `App.Security.IsAuthorized` - Check auth status
  - `App.Security.Authorize` - Login
  - `App.Security.Unauthorize` - Logout

#### 2. **AppRouter**
Orchestrates routing and navigation:
- Supports path parameters: `/users/:id`
- Supports query parameters: `/config?:tab`
- **IMPORTANT**: External URLs opened via `openNewTab` MUST be registered in `otherRoutes` with `() => null` handler
- **Messages**:
  - `App.Router.GoToRoute` - Navigate with history
  - `App.Router.SetRoute` - Navigate without history
  - `App.Router.SetRouteParams` - Update parameters
  - `App.Router.OpenNewTab` - Open URL in new tab
  - `App.Router.BeforeRouteChange` - Intercept navigation
  - `App.Router.AfterRouteChange` - Post-navigation hook

#### 3. **AppDialogManager**
Global dialog system:
- `Dialog.Information` - Info dialog
- `Dialog.Warning` - Warning with details drawer
- `Dialog.Error` - Error with details
- `Dialog.Exception` - Exception handling
- `Dialog.Confirmation` - Yes/No confirmation
- `Dialog.ActionConfirmation` - Action-specific confirmation

#### 4. **AppAlertManager**
Global toast notifications:
- `Alert.Success` - Success message
- `Alert.Information` - Info message
- `Alert.Warning` - Warning message
- `Alert.Error` - Error message
- Configurable positioning (6 anchor positions)

#### 5. **AppBusyDisplay**
Global loading indicator:
- `BusyDisplay.Set` - Show/hide spinner
- `BusyDisplay.SetVisibility` - Control visibility

#### 6. **AppLocalStorage**
Browser localStorage wrapper:
- **Messages**:
  - `App.LocalStorage.Read` - Read value by key
  - `App.LocalStorage.Write` - Write value to key
  - `App.LocalStorage.Clear` - Clear value by key
- Storage keys defined as union type in `appTypes.ts`

---

## 🧩 Component Inventory

### Layout Components

**Block, Row, Col** - Flexbox containers with:
- Spacing control (`none`, `tiny`, `small`, `medium`, `large`, `huge`, `massive`)
- Alignment options
- Padding sizes
- Fill behavior
- Background colors from palette
- Border styles

**Card** - Container with elevation and padding

### Input Components

- **Button**: Variants (`text`, `outlined`, `contained`), sizes, align (`left`, `center`, `right`), colors
- **IconButton**: Predefined kinds or custom SVG icons, title prop for tooltips
- **TextField\<T\>**: Multiple variants, types, built-in validation
- **RadioGroup\<T\>**: Type-safe options, orientation control
- **Select\<T\>**: Dropdown with variants and validation
- **Checkbox**: Sizes, indeterminate state, validation

### Navigation Components

- **Router**: Regex-based routing with type-safe routes
- **NavLink**: Styled links with underline variants
- **NavItem**: List items with modes (`icon-only`, `text-only`, `icon-text`), supports onClick for non-navigation actions
- **Breadcrumbs**: Navigation trails with custom separators

### Dialog Components

- **Dialog**: Modal with backdrop, title, content, actions
- **AlertDialog**: Pre-built with severity icons
- **Drawer**: Side panels (left/right/top/bottom)

### Flyout Components

- **Snackbar**: Container with positioning and auto-hide
- **Alert**: Severity-based messages (`success`, `info`, `warning`, `error`)
- **AlertToast**: Combined Snackbar + Alert

### Tab Components

- **TabsContainer**: Manages tab selection, orientations, variants
- **Tab**: Individual tab with label, icon, content

### Utility Components

- **Spinner**: Loading indicator
- **FileSelector**: File upload dialog
- **SeverityIcon**: Icons for alert severities
- **MarkdownPreview**: Markdown content renderer

### App Components

- **UECAContacts**: Four icon buttons (email, GitHub, npm, YouTube) for contact links with horizontal/vertical orientation

---

## 🔄 Component Patterns

### Structure

Each component follows this pattern:

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

### Bindings

```tsx
// Unidirectional
disabled: () => model.isLoading

// Bidirectional
value: UECA.bind(() => model, "username")
```

### Message Bus Communication

```tsx
// Unicast (first subscriber)
await model.bus.unicast("Api.GetUsers");

// Broadcast (all subscribers)
await model.bus.broadcast("*.Input", "UI.Validate");

// CastTo (by component ID)
await model.bus.castTo("app.form.button", "Click");
```

---

## 🎨 Styling Approach

### CSS Separation
- **CSS files**: Appearance only (colors, borders, transitions)
- **JSX props**: Layout (padding, spacing, alignment via Block/Row/Col)
- **Theme system**: Palette-based colors with `resolvePaletteColor()`

### Palette Colors

Available color options:
- Primary: `primary.main`, `primary.light`, `primary.dark`
- Secondary: `secondary.main`, `secondary.light`, `secondary.dark`
- Success, Error, Warning, Info (with variants)
- Background: `background.default`, `background.paper`
- Text: `text.primary`, `text.secondary`, `text.disabled`

---

## 🚀 Development Workflow

### Commands

```bash
npm run dev      # Development server (port 5001, base /ueca-react-app-demo2)
npm run build    # Production build
npm run lint     # Run linter
```

### Key Conventions

1. **Lifecycle**: Use `constr`, `init`, `mount`, `draw`, `erase`, `unmount`, `deinit` instead of React hooks
2. **State**: Direct assignment (`model.count++`) - MobX makes it reactive
3. **IDs**: Use `id: useXxx.name` in props, `model.htmlId()` for root element
4. **React Key**: Use `reactKey` prop (not `key`) for dynamic lists
5. **No React.StrictMode**: Conflicts with UECA lifecycle

### Helper Functions

- Define after `return model` using function declarations
- Prefix with `_` for private helpers
- Extract complex logic from View methods
- Keep Views pure JSX only

---

## 📖 Path Aliases

```tsx
@components → src/components
@core → src/core
@api → src/api
@screens → src/screens (optional)
```

---

## 🤖 AI Development Support

### Copilot Instructions

The project includes comprehensive AI coding assistant instructions in `.github/copilot-instructions.md`. This file provides:

- **Quick Reference**: Core principles, path aliases, and architecture overview
- **Component Inventory**: Complete list of available components with usage patterns
- **Component Patterns**: Standard structure, bindings, message bus, and helper functions
- **Common Usage**: Code examples for authentication, routing, dialogs, alerts, and more
- **Critical Conventions**: Lifecycle hooks, state management, and UECA-specific patterns

This enables AI assistants like GitHub Copilot to generate accurate, idiomatic UECA-React code following the project's conventions and patterns.

---

## 🔗 Resources

- **UECA Documentation**: `node_modules/ueca-react/docs/index.md`
- **MUI Based Example Project**: [UECA React App](https://github.com/nekutuzov/ueca-react-app-demo2)
- **Official Website**: [ueca-react.carrd.co](https://ueca-react.carrd.co/)

---

## 🎯 Getting Started

1. **Explore Components**: Check `src/components/` for reusable UI components
2. **Review Infrastructure**: Study `src/core/infrastructure/` for app-level services
3. **Understand Routing**: See `src/core/infrastructure/appRoutes.tsx`
4. **Build Screens**: Create new screens in `src/screens/` (optional)
5. **Follow Patterns**: Use existing components as templates

---

## ⚡ Best Practices

1. **No React Patterns**: Avoid `useState`, `useEffect`, and other React hooks
2. **Use Message Bus**: For cross-component communication
3. **Strong Typing**: Leverage TypeScript generics for type-safe components
4. **Pure Views**: Extract logic to helper functions, keep JSX clean
5. **Component Isolation**: One folder per component with .tsx + .css files

---

**Happy Coding with UECA React! 🚀**


**[← Back to Welcome](/home)**