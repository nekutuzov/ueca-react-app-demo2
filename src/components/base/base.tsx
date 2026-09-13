import * as UECA from "ueca-react";
import { AnchorRect, AppMessage, AppRoute, asyncSafe, Placement } from "@core";

// Base UECA Component for all components in the application

type BasePartialStruct = UECA.ComponentStruct<{
    props: {
        // Whether THIS component currently has the app's tooltip showing. Only so `unmount` can
        // close its own without every component in the app sending a hide on every unmount.
        __tooltipShown: boolean;
    };

    methods: {
        // Shorthand Methods

        // Routing
        getRoute: () => Promise<AppRoute>;
        goToRoute: (route: AppRoute) => Promise<boolean>;
        setRoute: (route: AppRoute) => Promise<boolean>;
        setRouteParams: (params: Record<string, unknown>, patch: boolean) => Promise<void>;
        // Patches only the anchor of the current address - the screen on show stays mounted.
        setRouteSection: (section: string) => Promise<void>;
        openNewTab: (route: AppRoute) => Promise<void>;
        // The URL a route would navigate to, without navigating. Undefined when it cannot resolve.
        resolveRoute: (route: AppRoute) => Promise<string>;

        // Dialogs
        dialogInfo: (title: string, message: string) => Promise<void>;
        dialogWarning: (title: string, message: string, details?: string) => Promise<void>;
        dialogError: (title: string, message: string, details?: string) => Promise<void>;
        dialogException: (title: string, error: Error) => Promise<void>;
        dialogYesNo: (title: string, message: string) => Promise<boolean>;
        dialogConfirmAction: (title?: string, message?: string, action?: string) => Promise<boolean>;
        dialogCustom: (title: React.ReactNode, content: React.ReactNode, okText?: string) => Promise<boolean>;
        alertInformation: (text: string) => Promise<void>;
        alertWarning: (message: React.ReactNode) => Promise<void>;
        alertSuccess: (message: React.ReactNode) => Promise<void>;
        alertError: (message: React.ReactNode) => Promise<void>;

        // Busy indicator
        setAppBusy: (value: boolean) => Promise<void>;  // IMPORTANT: counts the calls
        clearAppBusy: () => Promise<void>;              // Set the call count to 0 and set busy state to false

        // Misc
        // Displays the error and RESOLVES rather than rethrowing, so a caller that must finish
        // (a navigation guard returning a boolean) still does. Yields undefined when it failed.
        runWithErrorDisplay: <P, R>(action: (params?: P) => Promise<R>, params?: P) => Promise<R | undefined>;
        runWithBusyDisplay: <T>(action: () => Promise<T>) => Promise<T>;
        copyToClipboard: (content: string) => Promise<void>;

        // File selection
        selectFiles: (fileMask: string, multiselect?: boolean) => Promise<File[]>;

        // Tooltip — spread the result onto any element to give it a tooltip:
        //     <button {...model.tooltipProps("Refresh the list")}>…</button>
        // Returns the DOM handlers; the app's single tooltip (AppTooltipManager) does the rendering,
        // so nothing here owns tooltip state. Wiring the four handlers by hand is what leads to a
        // stuck tooltip when one of them is forgotten, which is why this exists.
        tooltipProps: (contentView: React.ReactNode, options?: { placement?: Placement; delay?: number }) => {
            onMouseEnter: React.MouseEventHandler;
            onMouseLeave: React.MouseEventHandler;
            onFocus: React.FocusEventHandler;
            onBlur: React.FocusEventHandler;
        };
        // dismissed — awaited like dialogYesNo.
        showTooltip: (anchor: AnchorRect, contentView: React.ReactNode, options?: { placement?: Placement; delay?: number }) => Promise<void>;
        hideTooltip: () => Promise<void>;
    }

}, AppMessage>;


type BaseStruct<T extends UECA.GeneralComponentStruct> = BasePartialStruct & UECA.ComponentStruct<T, AppMessage>;
type BaseParams<T extends BasePartialStruct> = UECA.ComponentParams<T>;
type BaseModel<T extends BasePartialStruct = BasePartialStruct> = UECA.ComponentModel<T, AppMessage>;

function useBase<T extends BasePartialStruct>(extStruct: T, params?: BaseParams<T>): BaseModel<T> {
    const struct: BasePartialStruct = {
        props: {
            __tooltipShown: false
        },

        // A trigger that unmounts while its tooltip is up can never fire its own mouseleave — a
        // dialog's × closes the dialog it lives in, a row action removes its own row — which left
        // the bubble stranded on screen. `hideTooltip` carries this component's token, so it can
        // only ever close a tooltip this component opened. Base and extended lifecycle hooks
        // chain (extended runs first, then this), so declaring it here costs call sites nothing.
        unmount: async () => {
            if (model.__tooltipShown) {
                await model.hideTooltip();
            }
        },

        methods: {
            // Shorthand Methods

            // Routing
            getRoute: async () => await model.bus.unicast("App.Router.GetRoute"),
            goToRoute: async (route) => await model.bus.unicast("App.Router.GoToRoute", route),
            setRoute: async (route) => await model.bus.unicast("App.Router.SetRoute", route),
            setRouteParams: async (params, patch) => await model.bus.unicast("App.Router.SetRouteParams", { params, patch }),

            setRouteSection: async (section) => await model.bus.unicast("App.Router.SetRouteParams", { section }),
            openNewTab: async (route) => await model.bus.unicast("App.Router.OpenNewTab", route),
            resolveRoute: async (route) => await model.bus.unicast("App.Router.ResolveRoute", route),

            // Modal dialogs
            dialogInfo: async (title, message) => await model.bus.unicast("Dialog.Information", { title, message }),
            dialogWarning: async (title, message, details) => await model.bus.unicast("Dialog.Warning", { title, message, details }),
            dialogError: async (title, message, details) => await model.bus.unicast("Dialog.Error", { title, message, details }),
            dialogException: async (title: string, error: Error) => await model.bus.unicast("Dialog.Exception", { title, error }),
            dialogYesNo: async (title, message) => await model.bus.unicast("Dialog.Confirmation", { title, message }),
            dialogConfirmAction: async (title = "Warning", message = "Are you sure want to delete this item?", action = "Delete") => await model.bus.unicast("Dialog.ActionConfirmation", { title, message, action }),
            dialogCustom: async (title, content, okText) => await model.bus.unicast("Dialog.Custom", { title, content, okText }),

            // Toast notifications
            alertInformation: async (text) => await model.bus.unicast("Alert.Information", { message: text }),
            alertSuccess: async (message) => await model.bus.unicast("Alert.Success", { message }),
            alertWarning: async (message) => await model.bus.unicast("Alert.Warning", { message }),
            alertError: async (message) => await model.bus.unicast("Alert.Error", { message }),

            // Busy indicator
            setAppBusy: async (value) => await model.bus.unicast("BusyDisplay.Set", value),
            clearAppBusy: async () => await model.bus.unicast("BusyDisplay.Clear"),

            // Misc
            runWithErrorDisplay: async (action, params) => await _runWithErrorDisplay(action, params),
            runWithBusyDisplay: async (action) => await _runWithBusyDisplay(action),
            // Was declared here but never implemented — every caller silently died awaiting
            // undefined. Requires a secure context (https/localhost) and a focused document.
            copyToClipboard: async (content) => await navigator.clipboard.writeText(content),
            selectFiles: async (fileMask, multiselect) => await model.bus.unicast("App.SelectFiles", { fileMask, multiselect }),

            // Tooltip
            tooltipProps: (contentView, options) => _tooltipProps(contentView, options),
            // The flag is set HERE rather than in _tooltipProps so that every route to the tooltip
            // marks it — including a direct showTooltip from a click handler (textField's reveal).
            showTooltip: async (anchor, contentView, options) => {
                model.__tooltipShown = true;
                await model.bus.unicast("App.Tooltip.Show",
                    { token: model.htmlId(), anchor, contentView, placement: options?.placement, delay: options?.delay });
            },
            hideTooltip: async () => {
                model.__tooltipShown = false;
                await model.bus.unicast("App.Tooltip.Hide", { token: model.htmlId() });
            }
        }
    }

    const model = UECA.useExtendedComponent(struct, extStruct, params);
    return model;

    // Private methods
    function _tooltipProps(contentView: React.ReactNode, options?: { placement?: Placement; delay?: number }) {
        // The anchor rect is read from the event target, so no ref is needed on the caller's side —
        // and it is read at hover time, when it is actually correct, rather than at render.
        const open = (target: Element) => {
            const r = target.getBoundingClientRect();
            const anchor: AnchorRect = { top: r.top, left: r.left, width: r.width, height: r.height };
            asyncSafe(() => model.showTooltip(anchor, contentView, options));
        };
        const close = () => asyncSafe(() => model.hideTooltip());

        // Focus/blur as well as the pointer pair: a tooltip that only answers the mouse is invisible
        // to keyboard users. These are raw DOM handlers and cannot be async, hence asyncSafe.
        return {
            onMouseEnter: (e: React.MouseEvent) => open(e.currentTarget),
            onMouseLeave: () => close(),
            // Only KEYBOARD focus opens a tooltip. Clicking a control focuses it too, and the
            // browser RESTORES that focus when the user comes back from another tab or
            // application — which fired this handler again and popped a tooltip with the pointer
            // nowhere near the trigger. `:focus-visible` is exactly the keyboard-vs-pointer
            // distinction, and it is still set when a keyboard user returns, so tabbing keeps
            // working in both directions.
            onFocus: (e: React.FocusEvent) => {
                if (!e.currentTarget.matches(":focus-visible")) {
                    return;
                }
                open(e.currentTarget);
            },
            onBlur: () => close()
        };
    }

    async function _runWithErrorDisplay<P, R>(action: (params?: P) => Promise<R>, params?: P): Promise<R | undefined> {
        try {
            return await action(params);
        } catch (error) {
            await model.dialogException("Error", error as Error);
        }
    }

    async function _runWithBusyDisplay<T>(action: () => Promise<T>): Promise<T> {
        await model.setAppBusy(true);
        try {
            return await action();
        } finally {
            await model.setAppBusy(false);
        }
    }
}

export { BaseStruct, BaseParams, BaseModel, useBase }
