import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, RadioGroup, Row, Col, Block, Button } from "@components";

type RadioGroupScreenStruct = UIBaseStruct<{
    props: {
        selectedGender: string;
        selectedSize: string;
        selectedPriority: number;
        requiredSelection: string;
    };

    methods: {
        resetSelections: () => void;
    };
}>;

type RadioGroupScreenParams = UIBaseParams<RadioGroupScreenStruct>;
type RadioGroupScreenModel = UIBaseModel<RadioGroupScreenStruct>;

function useRadioGroupScreen(params?: RadioGroupScreenParams): RadioGroupScreenModel {
    const struct: RadioGroupScreenStruct = {
        props: {
            id: useRadioGroupScreen.name,
            selectedGender: "",
            selectedSize: "medium",
            selectedPriority: 2,
            requiredSelection: ""
        },

        methods: {
            resetSelections: () => {
                model.selectedGender = "";
                model.selectedSize = "medium";
                model.selectedPriority = 2;
                model.requiredSelection = "";
                model.alertInformation("Selections reset");
            }
        },

        View: () => (
            <Col id={model.htmlId()} fill overflow={"auto"} padding={"medium"}>
                <Block>
                    <h1>RadioGroup Component</h1>
                    <p>Demonstration of the RadioGroup component with various orientations, sizes, and states.</p>
                </Block>

                {/* Basic RadioGroup */}
                <Block>
                    <h2>Basic RadioGroup</h2>
                    <p>A simple radio group with options.</p>

                    <Block padding={{ top: "small" }} maxWidth="400px">
                        <RadioGroup
                            labelView="Select Gender"
                            value={model.selectedGender}
                            options={[
                                { value: "male", label: "Male" },
                                { value: "female", label: "Female" },
                                { value: "other", label: "Other" },
                                { value: "prefer-not", label: "Prefer not to say" },
                            ]}
                            onChange={(value) => {
                                model.selectedGender = value as string;
                                model.alertInformation(`Selected: ${value}`);
                            }}
                        />
                    </Block>
                </Block>

                {/* Orientation Section */}
                <Block>
                    <h2>Orientation</h2>
                    <p>RadioGroups can be arranged vertically (column) or horizontally (row).</p>

                    <Col spacing="medium" padding={{ top: "small" }} maxWidth="600px">
                        <RadioGroup
                            labelView="Column Orientation (Default)"
                            value={model.selectedSize}
                            orientation="column"
                            options={[
                                { value: "small", label: "Small" },
                                { value: "medium", label: "Medium" },
                                { value: "large", label: "Large" },
                            ]}
                            onChange={(value) => { model.selectedSize = value as string; }}
                        />
                        <RadioGroup
                            labelView="Row Orientation"
                            value={model.selectedSize}
                            orientation="row"
                            options={[
                                { value: "small", label: "Small" },
                                { value: "medium", label: "Medium" },
                                { value: "large", label: "Large" },
                            ]}
                            onChange={(value) => { model.selectedSize = value as string; }}
                        />
                    </Col>
                </Block>

                {/* Sizes Section */}
                <Block>
                    <h2>RadioGroup Sizes</h2>
                    <p>Radio buttons are available in three sizes: small, medium, and large.</p>

                    <Col spacing="medium" padding={{ top: "small" }} maxWidth="400px">
                        <RadioGroup
                            labelView="Small Size"
                            value="opt2"
                            size="small"
                            options={[
                                { value: "opt1", label: "Option 1" },
                                { value: "opt2", label: "Option 2" },
                                { value: "opt3", label: "Option 3" },
                            ]}
                        />
                        <RadioGroup
                            labelView="Medium Size (Default)"
                            value="opt2"
                            size="medium"
                            options={[
                                { value: "opt1", label: "Option 1" },
                                { value: "opt2", label: "Option 2" },
                                { value: "opt3", label: "Option 3" },
                            ]}
                        />
                        <RadioGroup
                            labelView="Large Size"
                            value="opt2"
                            size="large"
                            options={[
                                { value: "opt1", label: "Option 1" },
                                { value: "opt2", label: "Option 2" },
                                { value: "opt3", label: "Option 3" },
                            ]}
                        />
                    </Col>
                </Block>

                {/* States Section */}
                <Block>
                    <h2>RadioGroup States</h2>
                    <p>RadioGroups can be required, disabled, or have helper text.</p>

                    <Col spacing="medium" padding={{ top: "small" }} maxWidth="400px">
                        <RadioGroup
                            labelView="Required Field"
                            value={model.requiredSelection}
                            required={true}
                            options={[
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                                { value: "maybe", label: "Maybe" },
                            ]}
                            helperTextView="This field is required"
                            onChange={(value) => { model.requiredSelection = value as string; }}
                        />
                        <RadioGroup
                            labelView="Disabled RadioGroup"
                            value="option1"
                            disabled={true}
                            options={[
                                { value: "option1", label: "Option 1 (selected)" },
                                { value: "option2", label: "Option 2" },
                            ]}
                            helperTextView="This radio group is disabled"
                        />
                        <RadioGroup
                            labelView="With Helper Text"
                            value=""
                            options={[
                                { value: "email", label: "Email notifications" },
                                { value: "sms", label: "SMS notifications" },
                                { value: "none", label: "No notifications" },
                            ]}
                            helperTextView="Choose your preferred notification method"
                        />
                    </Col>
                </Block>

                {/* Disabled Options */}
                <Block>
                    <h2>Disabled Options</h2>
                    <p>Individual options can be disabled within the radio group.</p>

                    <Block padding={{ top: "small" }} maxWidth="400px">
                        <RadioGroup
                            labelView="Select Subscription Plan"
                            value="free"
                            options={[
                                { value: "free", label: "Free Plan - $0/month" },
                                { value: "basic", label: "Basic Plan - $10/month" },
                                { value: "pro", label: "Pro Plan - $25/month" },
                                { value: "enterprise", label: "Enterprise Plan - Contact Us", disabled: true },
                            ]}
                            helperTextView="Some options may be unavailable"
                        />
                    </Block>
                </Block>

                {/* Colors Section */}
                <Block>
                    <h2>RadioGroup Colors</h2>
                    <p>RadioGroups support the full color palette from the theme.</p>

                    <Col spacing="medium" padding={{ top: "small" }} maxWidth="400px">
                        <RadioGroup
                            labelView="Primary Color"
                            value="opt1"
                            color="primary.main"
                            orientation="row"
                            options={[
                                { value: "opt1", label: "Option 1" },
                                { value: "opt2", label: "Option 2" },
                            ]}
                        />
                        <RadioGroup
                            labelView="Secondary Color"
                            value="opt1"
                            color="secondary.main"
                            orientation="row"
                            options={[
                                { value: "opt1", label: "Option 1" },
                                { value: "opt2", label: "Option 2" },
                            ]}
                        />
                        <RadioGroup
                            labelView="Success Color"
                            value="opt1"
                            color="success.main"
                            orientation="row"
                            options={[
                                { value: "opt1", label: "Option 1" },
                                { value: "opt2", label: "Option 2" },
                            ]}
                        />
                        <RadioGroup
                            labelView="Error Color"
                            value="opt1"
                            color="error.main"
                            orientation="row"
                            options={[
                                { value: "opt1", label: "Option 1" },
                                { value: "opt2", label: "Option 2" },
                            ]}
                        />
                    </Col>
                </Block>

                {/* Numeric Values */}
                <Block>
                    <h2>Numeric Values</h2>
                    <p>RadioGroup options can use numeric values instead of strings.</p>

                    <Block padding={{ top: "small" }} maxWidth="400px">
                        <RadioGroup
                            labelView="Select Priority Level"
                            value={model.selectedPriority}
                            options={[
                                { value: 1, label: "Low Priority" },
                                { value: 2, label: "Medium Priority" },
                                { value: 3, label: "High Priority" },
                                { value: 4, label: "Critical Priority" },
                            ]}
                            onChange={(value) => {
                                model.selectedPriority = value as number;
                                model.alertInformation(`Priority level: ${value}`);
                            }}
                        />
                    </Block>
                </Block>

                {/* Interactive Example */}
                <Block padding={{ bottom: "large" }}>
                    <h2>Interactive Example</h2>
                    <p>Current selections:</p>
                    <ul>
                        <li><strong>Gender:</strong> {model.selectedGender || "(none)"}</li>
                        <li><strong>Size:</strong> {model.selectedSize || "(none)"}</li>
                        <li><strong>Priority:</strong> {model.selectedPriority || "(none)"}</li>
                        <li><strong>Required:</strong> {model.requiredSelection || "(none)"}</li>
                    </ul>

                    <Row spacing="medium" padding={{ top: "small" }}>
                        <Button
                            contentView="Reset All Selections"
                            variant="outlined"
                            color="secondary.main"
                            onClick={model.resetSelections}
                        />
                        <Button
                            contentView="Show Summary"
                            variant="contained"
                            color="primary.main"
                            onClick={() => {
                                const summary = `
Gender: ${model.selectedGender || "(none)"}
Size: ${model.selectedSize || "(none)"}
Priority: ${model.selectedPriority || "(none)"}
Required: ${model.requiredSelection || "(none)"}
                                `.trim();
                                model.alertInformation(summary);
                            }}
                        />
                    </Row>
                </Block>
            </Col>
        )
    }

    const model = useUIBase(struct, params);
    return model;
}

const RadioGroupScreen = UECA.getFC(useRadioGroupScreen);

export { RadioGroupScreenParams, RadioGroupScreenModel, useRadioGroupScreen, RadioGroupScreen };
