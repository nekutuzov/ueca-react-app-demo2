import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { Icon, MenuSeparator } from "@components";
import { asyncSafe, IconName } from "@core";
import "./menuItem.css";

// MenuItem — one row of a menu, as a COMPONENT, not a config entry.
//
// Composition over configuration (see CLAUDE.md): the screen that owns a menu declares its items
// as children on its own model and composes their Views into a `hiddenToolsView`-style slot,
// usually inside a <MenuList> in a Popover. A config-array contract (a `MenuItem[]` the host
// renders — tried and retired) caps expressiveness: every new per-item need is a schema change,
// while a component item inherits the whole component model — reactive `disabled`, its own state,
// async onClick — for free.

type MenuItemStruct = UIBaseStruct<{
    props: {
        labelView: React.ReactNode;
        // A role from the icon registry, so menu icons stay in step with the rest of the app.
        iconName: IconName;
        // Right-aligned hint, e.g. "Ctrl+S". Display only — the item does not bind accelerators.
        shortcut: string;
        disabled: boolean;
        // Marks a destructive action (delete). Renders in the error ramp.
        danger: boolean;
        // Draws a divider above this row — for the common single case; compose an explicit
        // <MenuSeparator /> between Views when the grouping is more elaborate.
        separatorBefore: boolean;
    };

    events: {
        onClick: (source: MenuItemModel) => UECA.MaybePromise;
    };
}>;

type MenuItemParams = UIBaseParams<MenuItemStruct>;
type MenuItemModel = UIBaseModel<MenuItemStruct>;

function useMenuItem(params?: MenuItemParams): MenuItemModel {
    const struct: MenuItemStruct = {
        props: {
            id: useMenuItem.name,
            labelView: undefined,
            iconName: undefined,
            shortcut: undefined,
            disabled: false,
            danger: false,
            separatorBefore: false
        },

        events: {
            onClick: undefined
        },

        View: () => (
            <>
                {model.separatorBefore && <MenuSeparator />}
                <button
                    id={model.htmlId()}
                    type="button"
                    role="menuitem"
                    className={"ueca-menuitem" + (model.danger ? " danger" : "")}
                    disabled={model.disabled}
                    onClick={() => { _click(); }}
                >
                    {/* Fixed gutter so labels line up whether or not a row has an icon. */}
                    <span className="ueca-menuitem-icon">
                        {model.iconName && <Icon name={model.iconName} size="sm" />}
                    </span>
                    <span className="ueca-menuitem-label">{model.labelView}</span>
                    {model.shortcut && <span className="ueca-menuitem-shortcut">{model.shortcut}</span>}
                </button>
            </>
        )
    };

    const model = useUIBase(struct, params);
    return model;

    // Raw DOM handler — cannot be async itself, so the MaybePromise event goes through asyncSafe.
    function _click() {
        if (!model.disabled && model.onClick) {
            asyncSafe(() => model.onClick(model));
        }
    }
}

const MenuItem = UECA.getFC(useMenuItem);

export { MenuItemModel, MenuItemParams, useMenuItem, MenuItem };
