import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Select, Row, Col, Block, Button } from "@components";

type SelectScreenStruct = UIBaseStruct<{
    props: {
        selectedCountry: string;
        selectedCity: string;
        selectedColor: string;
        requiredSelection: string;
    };

    methods: {
        resetSelections: () => void;
    };
}>;

type SelectScreenParams = UIBaseParams<SelectScreenStruct>;
type SelectScreenModel = UIBaseModel<SelectScreenStruct>;

function useSelectScreen(params?: SelectScreenParams): SelectScreenModel {
    const struct: SelectScreenStruct = {
        props: {
            id: useSelectScreen.name,
            selectedCountry: "",
            selectedCity: "",
            selectedColor: "blue",
            requiredSelection: ""
        },

        methods: {
            resetSelections: () => {
                model.selectedCountry = "";
                model.selectedCity = "";
                model.selectedColor = "blue";
                model.requiredSelection = "";
                model.alertInformation("Selections reset");
            }
        },

        View: () => (
            <Col id={model.htmlId()} fill overflow={"auto"} padding={"medium"}>
                <Block>
                    <h1>Select Component</h1>
                    <p>Demonstration of the Select component with various variants, sizes, and states.</p>
                </Block>

                {/* Basic Select */}
                <Block>
                    <h2>Basic Select</h2>
                    <p>A simple select input with options.</p>
                    
                    <Block padding={{ top: "small" }} maxWidth="400px">
                        <Select
                            labelView="Select a Country"
                            value={model.selectedCountry}
                            options={[
                                { value: "us", label: "United States" },
                                { value: "uk", label: "United Kingdom" },
                                { value: "ca", label: "Canada" },
                                { value: "au", label: "Australia" },
                                { value: "de", label: "Germany" },
                                { value: "fr", label: "France" },
                                { value: "jp", label: "Japan" },
                            ]}
                            placeholder="Select a country..."
                            onChange={(value) => {
                                model.selectedCountry = value as string;
                                model.alertInformation(`Selected: ${value}`);
                            }}
                        />
                    </Block>
                </Block>

                {/* Variants Section */}
                <Block>
                    <h2>Select Variants</h2>
                    <p>Selects come in three variants: outlined, filled, and standard.</p>
                    
                    <Col spacing="medium" padding={{ top: "small" }} maxWidth="400px">
                        <Select
                            labelView="Outlined (Default)"
                            value={model.selectedCity}
                            variant="outlined"
                            options={[
                                { value: "nyc", label: "New York" },
                                { value: "lon", label: "London" },
                                { value: "tok", label: "Tokyo" },
                                { value: "par", label: "Paris" },
                            ]}
                            placeholder="Choose a city..."
                            onChange={(value) => { model.selectedCity = value as string; }}
                        />
                        <Select
                            labelView="Filled"
                            value={model.selectedCity}
                            variant="filled"
                            options={[
                                { value: "nyc", label: "New York" },
                                { value: "lon", label: "London" },
                                { value: "tok", label: "Tokyo" },
                                { value: "par", label: "Paris" },
                            ]}
                            placeholder="Choose a city..."
                            onChange={(value) => { model.selectedCity = value as string; }}
                        />
                        <Select
                            labelView="Standard"
                            value={model.selectedCity}
                            variant="standard"
                            options={[
                                { value: "nyc", label: "New York" },
                                { value: "lon", label: "London" },
                                { value: "tok", label: "Tokyo" },
                                { value: "par", label: "Paris" },
                            ]}
                            placeholder="Choose a city..."
                            onChange={(value) => { model.selectedCity = value as string; }}
                        />
                    </Col>
                </Block>

                {/* Sizes Section */}
                <Block>
                    <h2>Select Sizes</h2>
                    <p>Selects are available in two sizes: small and medium.</p>
                    
                    <Col spacing="medium" padding={{ top: "small" }} maxWidth="400px">
                        <Select
                            labelView="Small Size"
                            value={model.selectedColor}
                            size="small"
                            options={[
                                { value: "red", label: "Red" },
                                { value: "blue", label: "Blue" },
                                { value: "green", label: "Green" },
                                { value: "yellow", label: "Yellow" },
                            ]}
                            onChange={(value) => { model.selectedColor = value as string; }}
                        />
                        <Select
                            labelView="Medium Size (Default)"
                            value={model.selectedColor}
                            size="medium"
                            options={[
                                { value: "red", label: "Red" },
                                { value: "blue", label: "Blue" },
                                { value: "green", label: "Green" },
                                { value: "yellow", label: "Yellow" },
                            ]}
                            onChange={(value) => { model.selectedColor = value as string; }}
                        />
                    </Col>
                </Block>

                {/* States Section */}
                <Block>
                    <h2>Select States</h2>
                    <p>Selects can be required, disabled, or have helper text.</p>
                    
                    <Col spacing="medium" padding={{ top: "small" }} maxWidth="400px">
                        <Select
                            labelView="Required Field"
                            value={model.requiredSelection}
                            required={true}
                            options={[
                                { value: "opt1", label: "Option 1" },
                                { value: "opt2", label: "Option 2" },
                                { value: "opt3", label: "Option 3" },
                            ]}
                            placeholder="Please select an option..."
                            helperTextView="This field is required"
                            onChange={(value) => { model.requiredSelection = value as string; }}
                        />
                        <Select
                            labelView="Disabled Select"
                            value="disabled-value"
                            disabled={true}
                            options={[
                                { value: "disabled-value", label: "Cannot change this" },
                                { value: "opt2", label: "Option 2" },
                            ]}
                            helperTextView="This select is disabled"
                        />
                        <Select
                            labelView="With Helper Text"
                            value=""
                            options={[
                                { value: "1", label: "Low Priority" },
                                { value: "2", label: "Medium Priority" },
                                { value: "3", label: "High Priority" },
                            ]}
                            placeholder="Select priority level..."
                            helperTextView="Choose the priority level for this task"
                        />
                    </Col>
                </Block>

                {/* Disabled Options */}
                <Block>
                    <h2>Disabled Options</h2>
                    <p>Individual options can be disabled within the select.</p>
                    
                    <Block padding={{ top: "small" }} maxWidth="400px">
                        <Select
                            labelView="Select Package"
                            value=""
                            options={[
                                { value: "free", label: "Free - $0/month" },
                                { value: "basic", label: "Basic - $10/month" },
                                { value: "pro", label: "Pro - $25/month" },
                                { value: "enterprise", label: "Enterprise - Contact Us", disabled: true },
                            ]}
                            placeholder="Choose a package..."
                            helperTextView="Some options may be unavailable"
                        />
                    </Block>
                </Block>

                {/* Colors Section */}
                <Block>
                    <h2>Select Colors</h2>
                    <p>Selects support the full color palette from the theme.</p>
                    
                    <Col spacing="medium" padding={{ top: "small" }} maxWidth="400px">
                        <Select
                            labelView="Primary Color"
                            value=""
                            color="primary.main"
                            options={[
                                { value: "1", label: "Option 1" },
                                { value: "2", label: "Option 2" },
                            ]}
                            placeholder="Primary themed..."
                        />
                        <Select
                            labelView="Secondary Color"
                            value=""
                            color="secondary.main"
                            options={[
                                { value: "1", label: "Option 1" },
                                { value: "2", label: "Option 2" },
                            ]}
                            placeholder="Secondary themed..."
                        />
                        <Select
                            labelView="Success Color"
                            value=""
                            color="success.main"
                            options={[
                                { value: "1", label: "Option 1" },
                                { value: "2", label: "Option 2" },
                            ]}
                            placeholder="Success themed..."
                        />
                        <Select
                            labelView="Error Color"
                            value=""
                            color="error.main"
                            options={[
                                { value: "1", label: "Option 1" },
                                { value: "2", label: "Option 2" },
                            ]}
                            placeholder="Error themed..."
                        />
                    </Col>
                </Block>

                {/* Numeric Values */}
                <Block>
                    <h2>Numeric Values</h2>
                    <p>Select options can use numeric values instead of strings.</p>
                    
                    <Block padding={{ top: "small" }} maxWidth="400px">
                        <Select
                            labelView="Select Quantity"
                            value={1}
                            options={[
                                { value: 1, label: "One" },
                                { value: 5, label: "Five" },
                                { value: 10, label: "Ten" },
                                { value: 25, label: "Twenty-Five" },
                                { value: 50, label: "Fifty" },
                                { value: 100, label: "One Hundred" },
                            ]}
                            onChange={(value) => model.alertInformation(`Selected quantity: ${value}`)}
                        />
                    </Block>
                </Block>

                {/* Interactive Example */}
                <Block padding={{ bottom: "large" }}>
                    <h2>Interactive Example</h2>
                    <p>Current selections:</p>
                    <ul>
                        <li><strong>Country:</strong> {model.selectedCountry || "(none)"}</li>
                        <li><strong>City:</strong> {model.selectedCity || "(none)"}</li>
                        <li><strong>Color:</strong> {model.selectedColor || "(none)"}</li>
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
Country: ${model.selectedCountry || "(none)"}
City: ${model.selectedCity || "(none)"}
Color: ${model.selectedColor || "(none)"}
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

const SelectScreen = UECA.getFC(useSelectScreen);

export { SelectScreenParams, SelectScreenModel, useSelectScreen, SelectScreen };
