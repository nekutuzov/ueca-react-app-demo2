# UECA-React Vite Application

A minimal foundation for building applications with the UECA (Unified Encapsulated Component Architecture) React framework.

## What is UECA-React?

UECA-React is a framework that abstracts React patterns into a unified component model with:

- **Structured Component Model**: props, children, methods, events, and message bus
- **Reactive State Management**: MobX-powered (abstracted away)
- **Message Bus Communication**: Decoupled component interaction
- **Lifecycle Hooks**: constr, init, mount, draw, erase, unmount, deinit
- **Property Bindings**: Unidirectional, bidirectional, and custom bindings
- **Automatic Events**: onChange and onChanging events for all properties

## Getting Started

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Visit `http://localhost:5001/myapp/` to see your application.

### Build for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── api/                    # API clients and mocks
│   ├── mocks/
│   │   └── handlers.ts    # MSW mock handlers
│   ├── restApiClient.ts   # REST API client
│   └── index.ts
├── components/            # Reusable components
│   ├── base/              # Base component classes
│   │   ├── base.tsx       # Root base with routing/dialog shortcuts
│   │   ├── uiBase.tsx     # UI component base
│   │   └── editBase.tsx   # Form/editing base with validation
│   └── index.ts
├── core/                  # Core infrastructure
│   ├── infrastructure/
│   │   ├── application.tsx           # Main application component
│   │   ├── appStart.tsx              # Bootstrap utilities
│   │   ├── appMessage.ts             # Typed message bus definitions
│   │   ├── appRoutes.tsx             # Route definitions
│   │   ├── appBrowsingHistory.ts     # Browser history management
│   │   ├── appTypes.ts               # Common types
│   │   └── appUtils.ts               # Utility functions
│   └── index.ts
├── screens/               # Application screens
│   ├── homeScreen.tsx     # Home/welcome screen
│   └── index.ts
└── main.tsx              # Application entry point

```

## Key Concepts

### Component Pattern

All UECA components follow this structure:

```tsx
import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";

type MyComponentStruct = UIBaseStruct<{
    props: {
        value: string;
    };
    children: {
        // child components
    };
    methods: {
        // component methods
    };
    events: {
        onChange: (value: string) => void;
    };
}>;

type MyComponentParams = UIBaseParams<MyComponentStruct>;
type MyComponentModel = UIBaseModel<MyComponentStruct>;

function useMyComponent(params?: MyComponentParams): MyComponentModel {
    const struct: MyComponentStruct = {
        props: {
            id: useMyComponent.name,
            value: "",
        },
        
        View: () => <div id={model.htmlId()}>{model.value}</div>
    };
    
    const model = useUIBase(struct, params);
    return model;
}

const MyComponent = UECA.getFC(useMyComponent);

export { MyComponentModel, MyComponentParams, useMyComponent, MyComponent };
```

### Message Bus Communication

```tsx
// Define messages in appMessage.ts
type AppMessage = {
    "Api.GetUsers": { out: User[] };
    "Dialog.Warning": { in: { title?: string, message: string } };
};

// Send messages
await model.bus.unicast("Api.GetUsers");
await model.bus.broadcast("*.Input", "UI.Validate");
await model.bus.castTo("app.form.button", "Click");

// Handle messages in component struct
messages: {
    "Api.GetUsers": async () => {
        return await apiClient.get<User[]>("/users");
    }
}
```

### Property Bindings

```tsx
// Unidirectional (read-only)
disabled: () => model.isLoading

// Bidirectional (two-way sync)
value: UECA.bind(() => model.formData, "username")

// Custom (with transformation)
phone: UECA.bind(
    () => formatPhone(model.phoneDigits),
    (val) => model.phoneDigits = stripFormat(val)
)
```

## Path Aliases

The project uses TypeScript path aliases configured in `tsconfig.app.json`:

- `@components` → `src/components`
- `@core` → `src/core`
- `@api` → `src/api`
- `@screens` → `src/screens`

## Documentation

- **Framework Docs**: `node_modules/ueca-react/docs/index.md`
- **Example Project**: https://github.com/nekutuzov/ueca-react-app
- **Copilot Instructions**: See `.github/copilot-instructions.md` for AI coding assistance

## Technologies

- **UECA-React 2.0**: Component framework
- **React 19.0**: UI library (minimal usage)
- **TypeScript**: Type safety
- **MobX**: Reactive state (abstracted)
- **Vite**: Build tool
- **MSW**: API mocking

## Next Steps

1. Read the UECA documentation in `node_modules/ueca-react/docs/`
2. Explore the example project at https://github.com/nekutuzov/ueca-react-app
3. Review `.github/copilot-instructions.md` for AI coding assistance
4. Create your first screen in `src/screens/`
5. Add routes in `src/core/infrastructure/appRoutes.tsx`
6. Build UI components extending from base classes

## Important Notes

- **No React Hooks**: Don't use useState, useEffect, useContext, useReducer
- **No React.StrictMode**: UECA handles lifecycle differently
- **Direct Property Assignment**: Use `model.count++` instead of setState
- **Component IDs**: Always set `id: useXxx.name` in props
- **DOM IDs**: Use `model.htmlId()` for root element ID

## License

ISC
