# UECA-React Vite Application - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- `ueca-react@^3.0.2` - The UECA framework
- React 19, MobX, Vite, TypeScript, MSW, and more

### 2. Initialize MSW (Mock Service Worker)

After npm install, initialize MSW for API mocking:

```bash
npx msw init public --save
```

This creates the `public/mockServiceWorker.js` file needed for API mocking.

### 3. Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:5001/ueca-react-app-demo2/`

## Current Project Structure

This repository already contains a complete demo application with many components and screens.
Use this high-level map instead of fixed file counts.

### Core Config Files
- `package.json` - Dependencies and npm scripts (`dev`, `build`, `lint`, `preview`)
- `vite.config.ts` - Vite configuration (base path and dev server port)
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - TypeScript configs and path aliases
- `eslint.config.js` - Linting rules

### Source Directories
- `src/components/` - Reusable UI components (layout, inputs, navigation, dialogs, tabs, flyouts)
- `src/core/` - Application infrastructure (routing, app shell, security, dialogs, alerts, theme, icons)
- `src/api/` - API client and MSW mocks
- `src/screens/` - The landing page, the Showcase topic pages and the Playground editors

### Important Entry Points
- `src/main.tsx` - Application startup and MSW initialization
- `src/core/infrastructure/appRoutes.tsx` - App routes and external-link routes
- `src/screens/index.ts` - Exported screens
- `src/screens/showcase/showcaseTopics.tsx`, `src/screens/playground/playgroundTopics.tsx` - The page lists the menu, routes and page headers read
- `src/tokens.css`, `src/themes.css` - Design tokens and the light and dark colour themes

## TypeScript Errors Before npm install

You'll see TypeScript errors until you run `npm install`:
- "Cannot find module 'ueca-react'" - Fixed after install
- "Cannot find module '@core/@components/@api/@screens'" - Fixed after install
- "react/jsx-runtime" missing - Fixed after install

These are expected and will resolve automatically.

## Next Steps

### 1. Explore the Framework

Read the UECA documentation:
```bash
# After npm install
node_modules/ueca-react/docs/raw/index.md
```

### 2. Check Out Examples

This app, deployed:
```
https://nekutuzov.github.io/ueca-react-app-demo2/
```

The UECA-React documentation site:
```
https://nekutuzov.github.io/ueca-react-doc/
```

### 3. Create Your First Component

Create a new screen in `src/screens/`:

```tsx
import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";

type MyScreenStruct = UIBaseStruct<{
    props: {
        title: string;
    };
}>;

type MyScreenParams = UIBaseParams<MyScreenStruct>;
type MyScreenModel = UIBaseModel<MyScreenStruct>;

function useMyScreen(params?: MyScreenParams): MyScreenModel {
    const struct: MyScreenStruct = {
        props: {
            id: useMyScreen.name,
            title: "My Screen"
        },
        
        View: () => (
            <div id={model.htmlId()}>
                <h1>{model.title}</h1>
            </div>
        )
    };
    
    const model = useUIBase(struct, params);
    return model;
}

const MyScreen = UECA.getFC(useMyScreen);

export { MyScreenModel, MyScreenParams, useMyScreen, MyScreen };
```

### 4. Add Routes

Edit `src/core/infrastructure/appRoutes.tsx`:

```tsx
import { HomeScreen, MyScreen } from "@screens";

const screenRoutes = {
    "/": () => <HomeScreen id={"homeScreen"} />,
    "/home": () => <HomeScreen id={"homeScreen"} />,
    "/myscreen": () => <MyScreen id={"myScreen"} />,  // Add this
}
```

### 5. Build for Production

```bash
npm run build
```

Output goes to `dist/` folder.

## Common Issues

### Port Already in Use

If port 5001 is in use, edit `vite.config.ts`:

```typescript
server: {
    port: 3000,  // Change to available port
},
```

### Base Path Configuration

To change the base path from `/ueca-react-app-demo2/`, edit:

1. `vite.config.ts`:
```typescript
base: '/your-path/',
```

2. `index.html`:
```html
<base href="/your-path/" />
```

3. `src/api/mocks/handlers.ts`:
```typescript
serviceWorker: {
    url: "/your-path/mockServiceWorker.js",
}
```

### Disable API Mocking

Comment out in `src/main.tsx`:
```typescript
// initMocks();  // Comment this line
```

## Learning Path

1. **Start Here**: Read `README.md`
2. **UECA Docs**: `node_modules/ueca-react/docs/raw/index.md`
3. **AI Instructions**: `CLAUDE.md`, and the UECA skills `npm install` copies into `.claude/skills/`
4. **Base Components**: Study `src/components/base/`
5. **The Showcase**: https://nekutuzov.github.io/ueca-react-app-demo2/
6. **UECA-React Documentation**: https://nekutuzov.github.io/ueca-react-doc/
7. **Build Something**: Create your first screen!

## Key Concepts to Master

- [x] Component structure (props, children, methods, events)
- [x] Message bus communication
- [x] Lifecycle hooks (init, mount, draw, erase, unmount, deinit)
- [x] Property bindings (unidirectional, bidirectional, custom)
- [x] Direct state assignment (no useState/setState)
- [x] Base component hierarchy
- [x] Component encapsulation principles

## Getting Help

- **Documentation**: https://nekutuzov.github.io/ueca-react-doc/ (also in `node_modules/ueca-react/docs/`)
- **This Demo Repository**: https://github.com/nekutuzov/ueca-react-app-demo2
- **AI Instructions**: `CLAUDE.md`

Happy coding with UECA-React!
