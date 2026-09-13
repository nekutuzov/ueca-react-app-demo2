import * as UECA from "ueca-react";
import {
    ButtonAlign, ButtonModel, ButtonSize, ButtonVariant, Icon, RadioGroupModel, ScreenBaseModel,
    ScreenBaseParams, ScreenBaseStruct, SelectModel, SwitchModel, TextFieldModel, useButton, useRadioGroup,
    useScreenBase, useSelect, useSwitch, useTextField
} from "@components";
import { AppRoute, Breadcrumb, CodeSampleModel, CRUDScreenModel, IconName, Palette, ScreenRoute, useCodeSample, useCRUDScreen } from "@core";
import { ScreenPage, ScreenPager } from "../common/screenPage";
import { expr, jsxElement } from "./codeGen";
import { PlaygroundGroup, PlaygroundWorkbench } from "./playgroundWorkbench";
import { playgroundNeighbours, playgroundTopic } from "./playgroundTopics";

type ButtonColor = Palette | "inherit";
// "none" rather than an empty value: select options must carry a non-empty value.
type IconChoice = "none" | "add" | "save" | "download" | "refresh" | "search" | "arrowRight" | "chevronDown";

type ButtonState = {
    label: string;
    variant: ButtonVariant;
    size: ButtonSize;
    color: ButtonColor;
    startIcon: IconChoice;
    endIcon: IconChoice;
    align: ButtonAlign;
    disabled: boolean;
    fullWidth: boolean;
    selected: boolean;
};

// Where the page starts, and where Reset returns to.
const INITIAL: ButtonState = {
    label: "Save changes",
    variant: "contained",
    size: "medium",
    color: "inherit",
    startIcon: "save",
    endIcon: "none",
    align: "center",
    disabled: false,
    fullWidth: false,
    selected: false
};

// The component's own defaults — a prop equal to one of these is left out of the snippet.
const BUTTON_DEFAULTS = {
    variant: "text",
    size: "medium",
    color: "inherit",
    align: "center",
    disabled: false,
    fullWidth: false,
    selected: false
};

const ICON_OPTIONS: { value: IconChoice; label: string }[] = [
    { value: "none", label: "None" },
    { value: "add", label: "Add" },
    { value: "save", label: "Save" },
    { value: "download", label: "Download" },
    { value: "refresh", label: "Refresh" },
    { value: "search", label: "Search" },
    { value: "arrowRight", label: "Arrow right" },
    { value: "chevronDown", label: "Chevron down" }
];

type ButtonPlaygroundStruct = ScreenBaseStruct<{
    props: ButtonState & {
        _clicks: number;
    };

    children: {
        crudScreen: CRUDScreenModel;
        preview: ButtonModel;
        code: CodeSampleModel;
        resetButton: ButtonModel;
        labelInput: TextFieldModel;
        variantInput: RadioGroupModel<ButtonVariant>;
        sizeInput: SelectModel<ButtonSize>;
        colorInput: SelectModel<ButtonColor>;
        startIconInput: SelectModel<IconChoice>;
        endIconInput: SelectModel<IconChoice>;
        alignInput: RadioGroupModel<ButtonAlign>;
        disabledInput: SwitchModel;
        fullWidthInput: SwitchModel;
        selectedInput: SwitchModel;
    };

    methods: {
        go: (path: string) => Promise<void>;
        reset: () => void;
        _PageView: () => UECA.ReactElement;
        _PropertiesView: () => UECA.ReactElement;
    };
}>;

type ButtonPlaygroundParams = ScreenBaseParams<ButtonPlaygroundStruct>;
type ButtonPlaygroundModel = ScreenBaseModel<ButtonPlaygroundStruct>;

function useButtonPlayground(params?: ButtonPlaygroundParams): ButtonPlaygroundModel {
    const struct: ButtonPlaygroundStruct = {
        props: {
            id: useButtonPlayground.name,
            ...INITIAL,
            _clicks: 0
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                contentPaddings: "none",
                breadcrumbs: () => _breadcrumbs(),
                contentView: () => <model._PageView />
            }),

            // The instance being edited. Every param is a getter, so it follows the editors below.
            preview: useButton({
                contentView: () => model.label,
                variant: () => model.variant,
                size: () => model.size,
                color: () => model.color,
                startIconView: () => _iconView(model.startIcon),
                endIconView: () => _iconView(model.endIcon),
                align: () => model.align,
                disabled: () => model.disabled,
                fullWidth: () => model.fullWidth,
                selected: () => model.selected,
                onClick: () => {
                    model._clicks++;
                }
            }),

            code: useCodeSample({
                title: "JSX",
                code: () => _source()
            }),

            resetButton: useButton({
                contentView: "Reset",
                variant: "text",
                size: "small",
                startIconView: <Icon name="refresh" size="sm" />,
                onClick: () => model.reset()
            }),

            labelInput: useTextField({
                labelView: "Label",
                value: UECA.bind(() => model, "label"),
                fullWidth: true
            }),

            variantInput: useRadioGroup<ButtonVariant>({
                labelView: "Variant",
                value: UECA.bind(() => model, "variant"),
                orientation: "row",
                options: [
                    { value: "text", label: "Text" },
                    { value: "outlined", label: "Outlined" },
                    { value: "contained", label: "Contained" }
                ]
            }),

            sizeInput: useSelect<ButtonSize>({
                labelView: "Size",
                value: UECA.bind(() => model, "size"),
                fullWidth: true,
                options: [
                    { value: "xsmall", label: "Extra small" },
                    { value: "small", label: "Small" },
                    { value: "medium", label: "Medium" },
                    { value: "large", label: "Large" }
                ]
            }),

            colorInput: useSelect<ButtonColor>({
                labelView: "Color",
                value: UECA.bind(() => model, "color"),
                fullWidth: true,
                options: [
                    { value: "inherit", label: "Theme accent" },
                    { value: "secondary.main", label: "Secondary" },
                    { value: "success.main", label: "Success" },
                    { value: "warning.main", label: "Warning" },
                    { value: "error.main", label: "Error" },
                    { value: "info.main", label: "Info" }
                ]
            }),

            startIconInput: useSelect<IconChoice>({
                labelView: "Start icon",
                value: UECA.bind(() => model, "startIcon"),
                fullWidth: true,
                options: ICON_OPTIONS
            }),

            endIconInput: useSelect<IconChoice>({
                labelView: "End icon",
                value: UECA.bind(() => model, "endIcon"),
                fullWidth: true,
                options: ICON_OPTIONS
            }),

            alignInput: useRadioGroup<ButtonAlign>({
                labelView: "Content alignment",
                value: UECA.bind(() => model, "align"),
                orientation: "row",
                // Alignment only has room to show inside a full-width button.
                disabled: () => !model.fullWidth,
                options: [
                    { value: "left", label: "Left" },
                    { value: "center", label: "Center" },
                    { value: "right", label: "Right" }
                ]
            }),

            disabledInput: useSwitch({
                labelView: "Disabled",
                checked: UECA.bind(() => model, "disabled")
            }),

            fullWidthInput: useSwitch({
                labelView: "Full width",
                checked: UECA.bind(() => model, "fullWidth")
            }),

            selectedInput: useSwitch({
                labelView: "Selected (toggle state)",
                checked: UECA.bind(() => model, "selected")
            })
        },

        methods: {
            go: async (path) => {
                await model.goToRoute({ path } as AppRoute);
            },

            reset: () => {
                Object.assign(model, INITIAL);
                model._clicks = 0;
            },

            _PageView: () => {
                const topic = playgroundTopic("button");
                return (
                    <ScreenPage
                        eyebrow={"Playground"}
                        icon={topic.icon}
                        title={topic.title}
                        lead={topic.lead}
                        footerView={
                            <ScreenPager
                                label={"Playground pages"}
                                prev={playgroundNeighbours("button").prev}
                                next={playgroundNeighbours("button").next}
                                onGo={(path) => model.go(path)}
                            />
                        }
                    >
                        <PlaygroundWorkbench
                            stageView={<model.preview.View />}
                            stageStatusView={_status()}
                            codeView={<model.code.View />}
                            panelActionsView={<model.resetButton.View />}
                            propertiesView={<model._PropertiesView />}
                        />
                    </ScreenPage>
                );
            },

            _PropertiesView: () => (
                <>
                    <PlaygroundGroup title={"Content"}>
                        <model.labelInput.View />
                        <model.startIconInput.View />
                        <model.endIconInput.View />
                    </PlaygroundGroup>
                    <PlaygroundGroup title={"Appearance"}>
                        <model.variantInput.View />
                        <model.sizeInput.View />
                        <model.colorInput.View />
                    </PlaygroundGroup>
                    <PlaygroundGroup title={"Layout and state"}>
                        <model.fullWidthInput.View />
                        <model.alignInput.View />
                        <model.selectedInput.View />
                        <model.disabledInput.View />
                    </PlaygroundGroup>
                </>
            )
        },

        View: () => <model.crudScreen.View />
    };

    const model = useScreenBase(struct, params);
    return model;

    // Private methods
    function _breadcrumbs(): Breadcrumb[] {
        const topic = playgroundTopic("button");
        return [
            { route: { path: "/" }, label: "Home" },
            { route: { path: topic.path } as ScreenRoute, label: `Playground · ${topic.title}` }
        ];
    }

    function _iconView(choice: IconChoice): React.ReactNode {
        return choice === "none" ? undefined : <Icon name={choice as IconName} size="sm" />;
    }

    function _status(): string {
        if (model.disabled) {
            return "disabled — clicks are ignored";
        }
        return model._clicks === 1 ? "clicked once" : `clicked ${model._clicks} times`;
    }

    function _source(): string {
        return jsxElement("Button", {
            contentView: model.label,
            variant: model.variant,
            size: model.size,
            color: model.color,
            startIconView: model.startIcon === "none" ? undefined : expr(`<Icon name="${model.startIcon}" size="sm" />`),
            endIconView: model.endIcon === "none" ? undefined : expr(`<Icon name="${model.endIcon}" size="sm" />`),
            fullWidth: model.fullWidth,
            align: model.fullWidth ? model.align : undefined,
            selected: model.selected,
            disabled: model.disabled,
            onClick: expr("async () => await model.save()")
        }, BUTTON_DEFAULTS);
    }
}

const ButtonPlayground = UECA.getFC(useButtonPlayground);

export { ButtonPlaygroundParams, ButtonPlaygroundModel, useButtonPlayground, ButtonPlayground };
