// Browser APIs the app relies on that jsdom does not implement. Each stub is the smallest thing that
// lets the code run; a test that cares about one (a resize, a media query) drives it explicitly.

type ResizeCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;

// Keeps every live instance, so a test can simulate the browser reporting a size change.
class ResizeObserverStub {
    static readonly instances = new Set<ResizeObserverStub>();

    readonly targets = new Set<Element>();

    constructor(private readonly callback: ResizeCallback) {
        ResizeObserverStub.instances.add(this);
    }

    observe(target: Element) {
        this.targets.add(target);
    }

    unobserve(target: Element) {
        this.targets.delete(target);
    }

    disconnect() {
        this.targets.clear();
        ResizeObserverStub.instances.delete(this);
    }

    // Fires the callback of every observer watching `target` (or every observer, without one).
    static trigger(target?: Element) {
        for (const observer of [...ResizeObserverStub.instances]) {
            if (!target || observer.targets.has(target)) {
                observer.callback([], observer as unknown as ResizeObserver);
            }
        }
    }
}

function matchMediaStub(query: string): MediaQueryList {
    return {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => { },
        removeEventListener: () => { },
        addListener: () => { },
        removeListener: () => { },
        dispatchEvent: () => false
    } as MediaQueryList;
}

function installBrowserStubs() {
    globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

    window.matchMedia = matchMediaStub;

    // jsdom logs "Not implemented" for these rather than doing anything.
    window.scrollTo = () => { };
    window.open = () => null;
    window.alert = () => { };

    Element.prototype.scrollTo = function (this: Element, options?: ScrollToOptions | number, y?: number) {
        if (typeof options === "number") {
            this.scrollLeft = options;
            this.scrollTop = y ?? this.scrollTop;
            return;
        }
        if (options?.top != null) {
            this.scrollTop = options.top;
        }
        if (options?.left != null) {
            this.scrollLeft = options.left;
        }
    };
    Element.prototype.scrollIntoView = () => { };
    Element.prototype.setPointerCapture = () => { };
    Element.prototype.releasePointerCapture = () => { };
    Element.prototype.hasPointerCapture = () => false;

    if (!globalThis.CSS?.escape) {
        globalThis.CSS = {
            ...globalThis.CSS,
            escape: (value: string) => String(value).replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`)
        } as typeof CSS;
    }

    if (!navigator.clipboard) {
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: {
                writeText: async () => { },
                readText: async () => ""
            }
        });
    }
}

export { installBrowserStubs, ResizeObserverStub };
