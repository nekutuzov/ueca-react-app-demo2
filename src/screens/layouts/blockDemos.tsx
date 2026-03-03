import { Row, Col, Block } from "@components";

export function BlockDemos() {
    return (
        <Col fill overflow={"auto"} padding={"medium"} spacing="medium">
            <Block overflow="visible">
                <h2>Block Component</h2>
                <p>Block is a basic container for content with support for padding, alignment, and sizing.</p>
            </Block>

            <Block overflow="visible">
                <h3>Basic Block</h3>
                <Block padding="medium" backgroundColor="background.paper">
                    <p>This is a basic block with medium padding and background color.</p>
                </Block>
            </Block>

            <Block overflow="visible">
                <h3>Block with Max Width</h3>
                <Block padding="medium" backgroundColor="primary.light" maxWidth="400px">
                    <p>This block has a maximum width of 400px.</p>
                </Block>
            </Block>

            <Block overflow="visible">
                <h3>Block Horizontal Alignment</h3>
                <Block padding="medium" backgroundColor="background.paper" horizontalAlign="center">
                    <p>This text is center-aligned.</p>
                </Block>
                <Block padding="medium" backgroundColor="secondary.light" horizontalAlign="right">
                    <p>This text is right-aligned.</p>
                </Block>
            </Block>

            <Block overflow="visible">
                <h3>Block with Fixed Dimensions</h3>
                <Block padding="medium" backgroundColor="info.light" width="300px" height="100px">
                    <p>This block has fixed width (300px) and height (100px).</p>
                </Block>
            </Block>

            <Block overflow="visible">
                <h3>Padding Variants</h3>
                <Col spacing="small">
                    <Row spacing="medium" verticalAlign="center">
                        <Block><strong>None:</strong></Block>
                        <Block padding="none" backgroundColor="primary.light">No padding</Block>
                    </Row>
                    
                    <Row spacing="medium" verticalAlign="center">
                        <Block><strong>Tiny:</strong></Block>
                        <Block padding="tiny" backgroundColor="primary.light">Tiny padding</Block>
                    </Row>
                    
                    <Row spacing="medium" verticalAlign="center">
                        <Block><strong>Small:</strong></Block>
                        <Block padding="small" backgroundColor="primary.light">Small padding</Block>
                    </Row>
                    
                    <Row spacing="medium" verticalAlign="center">
                        <Block><strong>Medium:</strong></Block>
                        <Block padding="medium" backgroundColor="primary.light">Medium padding</Block>
                    </Row>
                    
                    <Row spacing="medium" verticalAlign="center">
                        <Block><strong>Large:</strong></Block>
                        <Block padding="large" backgroundColor="primary.light">Large padding</Block>
                    </Row>
                    
                    <Row spacing="medium" verticalAlign="center">
                        <Block><strong>Directional:</strong></Block>
                        <Block padding={{ top: "large", bottom: "small", left: "medium", right: "tiny" }} backgroundColor="secondary.light">
                            Custom padding per side
                        </Block>
                    </Row>
                    
                    <Row spacing="medium" verticalAlign="center">
                        <Block><strong>Top/Bottom:</strong></Block>
                        <Block padding={{ topBottom: "large", leftRight: "small" }} backgroundColor="success.light">
                            Large vertical, small horizontal
                        </Block>
                    </Row>
                </Col>
            </Block>
        </Col>
    );
}
