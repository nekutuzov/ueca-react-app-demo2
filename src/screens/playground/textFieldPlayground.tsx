import * as UECA from "ueca-react";
import {
    ButtonModel, Icon, NumberFieldModel, RadioGroupModel, Row, ScreenBaseModel, ScreenBaseParams,
    ScreenBaseStruct, SelectModel, SwitchModel, TextFieldModel, TextFieldType, TextFieldVariant, useButton,
    useNumberField, useRadioGroup, useScreenBase, useSelect, useSwitch, useTextField
} from "@components";
import { AppRoute, Breadcrumb, CodeSampleModel, CRUDScreenModel, IconName, ScreenRoute, useCodeSample, useCRUDScreen } from "@core";
import { ScreenPage, ScreenPager } from "../common/screenPage";
import { expr, jsxElement } from "./codeGen";
import { PlaygroundGroup, PlaygroundWorkbench } from "./playgroundWorkbench";
import { playgroundNeighbours, playgroundTopic } from "./playgroundTopics";

type AdornmentChoice = "none" | "email" | "user" | "search" | "lock" | "website";

type TextFieldState = {
    label: string;
    placeholder: string;
    helper: string;
    type: TextFieldType;
    variant: TextFieldVariant;
    startIcon: AdornmentChoice;
    required: boolean;
    disabled: boolean;
    readOnly: boolean;
    multiline: boolean;
    rows: number;
    revealable: boolean;
};

const INITIAL: TextFieldState = {
    label: "Email address",
    placeholder: "you@example.com",
    helper: "We only use it to send the receipt.",
    type: "email",
    variant: "outlined",
    startIcon: "email",
    required: true,
    disabled: false,
    readOnly: false,
    multiline: false,
    rows: 3,
    revealable: false
};

// The component's own defaults — a prop equal to one of these is left out of the snippet.
const TEXT_FIELD_DEFAULTS = {
    placeholder: "",
    type: "text",
    variant: "outlined",
    required: false,
    disabled: false,
    readOnly: false,
    multiline: false,
    rows: 1,
    revealable: false
};

type TextFieldPlaygroundStruct = ScreenBaseStruct<{
    props: TextFieldState & {
        // The preview's own value, bound two ways — what someone types in the canvas.
        value: string;
        // Filled by Validate: the verdict on the value as it stood then.
        _verdict: string;
    };

    children: {
        crudScreen: CRUDScreenModel;
        preview: TextFieldModel;
        code: CodeSampleModel;
        resetButton: ButtonModel;
        validateButton: ButtonModel;
        labelInput: TextFieldModel;
        placeholderInput: TextFieldModel;
        helperInput: TextFieldModel;
        typeInput: SelectModel<TextFieldType>;
        variantInput: RadioGroupModel<TextFieldVariant>;
        startIconInput: SelectModel<AdornmentChoice>;
        requiredInput: SwitchModel;
        disabledInput: SwitchModel;
        readOnlyInput: SwitchModel;
        revealableInput: SwitchModel;
        multilineInput: SwitchModel;
        rowsInput: NumberFieldModel;
    };

    methods: {
        go: (path: string) => Promise<void>;
        reset: () => void;
        validate: () => Promise<void>;
        _PageView: () => UECA.ReactElement;
        _PropertiesView: () => UECA.ReactElement;
    };
}>;

type TextFieldPlaygroundParams = ScreenBaseParams<TextFieldPlaygroundStruct>;
type TextFieldPlaygroundModel = ScreenBaseModel<TextFieldPlaygroundStruct>;

function useTextFieldPlayground(params?: TextFieldPlaygroundParams): TextFieldPlaygroundModel {
    const struct: TextFieldPlaygroundStruct = {
        props: {
            id: useTextFieldPlayground.name,
            ...INITIAL,
            value: "",
            _verdict: undefined
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                contentPaddings: "none",
                breadcrumbs: () => _breadcrumbs(),
                contentView: () => <model._PageView />
            }),

            preview: useTextField({
                // A binding, not a getter: the canvas field is a real input, and a one-way thunk
                // would lose focus on every keystroke.
                value: UECA.bind(() => model, "value"),
                labelView: () => model.label,
                placeholder: () => model.placeholder,
                helperTextView: () => model.helper || undefined,
                type: () => model.type,
                variant: () => model.variant,
                startView: () => _iconView(model.startIcon),
                required: () => model.required,
                disabled: () => model.disabled,
                readOnly: () => model.readOnly,
                multiline: () => model.multiline,
                rows: () => model.multiline ? model.rows : 1,
                revealable: () => model.type === "password" && model.revealable,
                fullWidth: true
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

            validateButton: useButton({
                contentView: "Validate",
                variant: "text",
                size: "small",
                startIconView: <Icon name="check" size="sm" />,
                onClick: async () => await model.validate()
            }),

            labelInput: useTextField({
                labelView: "Label",
                value: UECA.bind(() => model, "label")
            }),

            placeholderInput: useTextField({
                labelView: "Placeholder",
                value: UECA.bind(() => model, "placeholder")
            }),

            helperInput: useTextField({
                labelView: "Helper text",
                value: UECA.bind(() => model, "helper")
            }),

            typeInput: useSelect<TextFieldType>({
                labelView: "Type",
                value: UECA.bind(() => model, "type"),
                fullWidth: true,
                options: [
                    { value: "text", label: "Text" },
                    { value: "email", label: "Email" },
                    { value: "password", label: "Password" },
                    { value: "number", label: "Number" },
                    { value: "tel", label: "Telephone" },
                    { value: "url", label: "URL" },
                    { value: "search", label: "Search" }
                ],
                // Clear the verdict: it was about the old type's rules.
                onChange: () => {
                    model._verdict = undefined;
                }
            }),

            variantInput: useRadioGroup<TextFieldVariant>({
                labelView: "Variant",
                value: UECA.bind(() => model, "variant"),
                orientation: "row",
                options: [
                    { value: "outlined", label: "Outlined" },
                    { value: "filled", label: "Filled" },
                    { value: "standard", label: "Standard" }
                ]
            }),

            startIconInput: useSelect<AdornmentChoice>({
                labelView: "Start icon",
                value: UECA.bind(() => model, "startIcon"),
                fullWidth: true,
                // Adornments belong to single-line fields only.
                disabled: () => model.multiline,
                options: [
                    { value: "none", label: "None" },
                    { value: "email", label: "Email" },
                    { value: "user", label: "User" },
                    { value: "search", label: "Search" },
                    { value: "lock", label: "Lock" },
                    { value: "website", label: "Website" }
                ]
            }),

            requiredInput: useSwitch({
                labelView: "Required",
                checked: UECA.bind(() => model, "required")
            }),

            disabledInput: useSwitch({
                labelView: "Disabled",
                checked: UECA.bind(() => model, "disabled")
            }),

            readOnlyInput: useSwitch({
                labelView: "Read-only",
                checked: UECA.bind(() => model, "readOnly")
            }),

            revealableInput: useSwitch({
                labelView: "Show-password toggle",
                checked: UECA.bind(() => model, "revealable"),
                disabled: () => model.type !== "password"
            }),

            multilineInput: useSwitch({
                labelView: "Multiline",
                checked: UECA.bind(() => model, "multiline")
            }),

            rowsInput: useNumberField({
                labelView: "Rows",
                value: UECA.bind(() => model, "rows"),
                min: 2,
                max: 12,
                spinButtons: true,
                fullWidth: true,
                disabled: () => !model.multiline
            })
        },

        methods: {
            go: async (path) => {
                await model.goToRoute({ path } as AppRoute);
            },

            reset: () => {
                Object.assign(model, INITIAL);
                model.value = "";
                model._verdict = undefined;
                model.preview.resetValidationErrors();
            },

            validate: async () => {
                await model.preview.validate();
                model._verdict = model.preview.isValid()
                    ? "valid"
                    : `invalid — ${model.preview.getValidationError()}`;
            },

            _PageView: () => {
                const topic = playgroundTopic("textField");
                return (
                    <ScreenPage
                        eyebrow={"Playground"}
                        icon={topic.icon}
                        title={topic.title}
                        lead={topic.lead}
                        footerView={
                            <ScreenPager
                                label={"Playground pages"}
                                prev={playgroundNeighbours("textField").prev}
                                next={playgroundNeighbours("textField").next}
                                onGo={(path) => model.go(path)}
                            />
                        }
                    >
                        <PlaygroundWorkbench
                            stageView={<div className="playground-field-stage"><model.preview.View /></div>}
                            stageStatusView={_status()}
                            codeView={<model.code.View />}
                            panelActionsView={
                                <Row spacing={"tiny"}>
                                    <model.validateButton.View />
                                    <model.resetButton.View />
                                </Row>
                            }
                            propertiesView={<model._PropertiesView />}
                        />
                    </ScreenPage>
                );
            },

            _PropertiesView: () => (
                <>
                    <PlaygroundGroup title={"Content"}>
                        <model.labelInput.View />
                        <model.placeholderInput.View />
                        <model.helperInput.View />
                        <model.startIconInput.View />
                    </PlaygroundGroup>
                    <PlaygroundGroup title={"Input"}>
                        <model.typeInput.View />
                        <model.variantInput.View />
                        <model.multilineInput.View />
                        <model.rowsInput.View />
                    </PlaygroundGroup>
                    <PlaygroundGroup title={"State"}>
                        <model.requiredInput.View />
                        <model.readOnlyInput.View />
                        <model.disabledInput.View />
                        <model.revealableInput.View />
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
        const topic = playgroundTopic("textField");
        return [
            { route: { path: "/" }, label: "Home" },
            { route: { path: topic.path } as ScreenRoute, label: `Playground · ${topic.title}` }
        ];
    }

    function _iconView(choice: AdornmentChoice): React.ReactNode {
        if (choice === "none" || model.multiline) {
            return undefined;
        }
        return <Icon name={choice as IconName} size="md" />;
    }

    function _status(): string {
        const value = model.value ? `"${model.value}"` : "empty";
        return model._verdict ? `${value} · ${model._verdict}` : `${value} · press Validate to check`;
    }

    function _source(): string {
        return jsxElement("TextField", {
            labelView: model.label,
            placeholder: model.placeholder,
            helperTextView: model.helper || undefined,
            type: model.type,
            variant: model.variant,
            startView: model.startIcon === "none" || model.multiline ? undefined : expr(`<Icon name="${model.startIcon}" />`),
            multiline: model.multiline,
            rows: model.multiline ? model.rows : undefined,
            required: model.required,
            readOnly: model.readOnly,
            disabled: model.disabled,
            revealable: model.type === "password" ? model.revealable : undefined,
            value: expr(`UECA.bind(() => model, "${_fieldName()}")`)
        }, TEXT_FIELD_DEFAULTS);
    }

    // A plausible model prop for the snippet's binding, from the field's type.
    function _fieldName(): string {
        switch (model.type) {
            case "email":
                return "email";
            case "password":
                return "password";
            case "number":
                return "quantity";
            case "tel":
                return "phone";
            case "url":
                return "website";
            case "search":
                return "query";
            default:
                return model.multiline ? "notes" : "name";
        }
    }
}

const TextFieldPlayground = UECA.getFC(useTextFieldPlayground);

export { TextFieldPlaygroundParams, TextFieldPlaygroundModel, useTextFieldPlayground, TextFieldPlayground };
