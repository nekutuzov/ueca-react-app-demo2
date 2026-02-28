# UECA-React Vite Application - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- `ueca-react@^2.0.4` - The UECA framework
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

Visit: `http://localhost:5001/myapp/`

## What Was Created

### Project Files (30+ files)

#### Configuration (7 files)
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite configuration
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - TypeScript configs
- `eslint.config.js` - Linting rules
- `.gitignore` - Git ignore patterns

#### Source Code Structure

**src/components/** (4 files)
- `base/base.tsx` - Root base component with shortcuts
- `base/uiBase.tsx` - UI component base
- `base/editBase.tsx` - Form/editing base with validation
- `index.ts` - Exports

**src/core/** (8 files)
- `infrastructure/application.tsx` - Main app component
- `infrastructure/appStart.tsx` - Bootstrap utilities
- `infrastructure/appMessage.ts` - Message bus definitions
- `infrastructure/appRoutes.tsx` - Route definitions
- `infrastructure/appBrowsingHistory.ts` - Browser history
- `infrastructure/appTypes.ts` - Common types
- `infrastructure/appUtils.ts` - Utility functions
- `index.ts` - Exports

**src/api/** (3 files)
- `restApiClient.ts` - REST API client
- `mocks/handlers.ts` - MSW mock handlers
- `index.ts` - Exports

**src/screens/** (2 files)
- `homeScreen.tsx` - Welcome screen
- `index.ts` - Exports

**Root Files**
- `src/main.tsx` - Application entry point
- `src/vite-env.d.ts` - Vite type definitions
- `index.html` - HTML entry point
- `README.md` - Project documentation
- `.github/copilot-instructions.md` - AI coding assistant guide

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
node_modules/ueca-react/docs/index.md
```

### 2. Check Out Examples

Reference project with full examples:
```
https://github.com/nekutuzov/ueca-react-app
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
import { MyScreen } from "@screens";

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

To change the base path from `/myapp/`, edit:

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
2. **UECA Docs**: `node_modules/ueca-react/docs/index.md`
3. **Copilot Guide**: `.github/copilot-instructions.md`
4. **Base Components**: Study `src/components/base/`
5. **Example Project**: https://github.com/nekutuzov/ueca-react-app
6. **Build Something**: Create your first screen!

## Key Concepts to Master

- ✅ Component structure (props, children, methods, events)
- ✅ Message bus communication
- ✅ Lifecycle hooks (init, mount, draw, erase, unmount, deinit)
- ✅ Property bindings (unidirectional, bidirectional, custom)
- ✅ Direct state assignment (no useState/setState)
- ✅ Base component hierarchy
- ✅ Component encapsulation principles

## Getting Help

- **Documentation**: `node_modules/ueca-react/docs/`
- **Example Project**: https://github.com/nekutuzov/ueca-react-app
- **Copilot Instructions**: Use `.github/copilot-instructions.md` for AI assistance

Happy coding with UECA-React! 🚀
