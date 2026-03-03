import * as UECA from "ueca-react";
import { EditBaseModel, EditBaseParams, EditBaseStruct, TabsContainerModel, useEditBase } from "@components";
import { asyncSafe } from "@core";
import "./tab.css";

// Tab component
type TabStruct = EditBaseStruct<{
    props: {
        container: TabsContainerModel;
        tabId: string;
        selected: boolean;
        contentView: React.ReactNode;  // Rendered outside when this tab is selected
        visible: boolean;
        labelView: React.ReactNode;
        disabled: boolean;
        iconView: React.ReactElement<unknown>;
        iconPosition: "top" | "bottom" | "start" | "end";
        wrapped: boolean;
    };

    methods: {
        getTabId: () => string;
    };

    events: {
        onClick: (source: TabModel) => UECA.MaybePromise;
    };
}>;

type TabParams = EditBaseParams<TabStruct>;
type TabModel = EditBaseModel<TabStruct>;

function useTab(params?: TabParams): TabModel {
    const struct: TabStruct = {
        props: {
            id: useTab.name,
            container: undefined,
            tabId: undefined,
            selected: false,
            contentView: undefined,
            visible: true,
            labelView: undefined,
            disabled: false,
            iconView: undefined,
            iconPosition: "top",
            wrapped: false,
        },

        methods: {
            getTabId: () => model.tabId ? model.tabId : model.id,
        },

        View: () => {
            if (!model.visible) return null;

            const invalid = !model.isValid();
            const classNames = [
                "ueca-tab",
                model.selected ? "selected" : "",
                invalid ? "invalid" : "",
                model.iconView ? `icon-${model.iconPosition}` : "",
                model.wrapped ? "wrapped" : ""
            ].filter(Boolean).join(" ");

            return (
                <button
                    id={model.htmlId()}
                    className={classNames}
                    disabled={model.disabled}
                    onClick={() => {
                        if (model.disabled) return;
                        model.container.selectedTab = model;
                        asyncSafe(() => model.onClick?.(model));
                    }}
                >
                    {model.iconView && (
                        <span className="ueca-tab-icon">{model.iconView}</span>
                    )}
                    {model.labelView && (
                        <span className="ueca-tab-label">{model.labelView}</span>
                    )}
                </button>
            );
        }
    };

    const model = useEditBase(struct, params);
    return model;
}

const Tab = UECA.getFC(useTab);

export { TabModel, TabParams, useTab, Tab };
