import { Button, Row, Col, Block } from "@components";

export function RowDemos() {
    return (
        <Col fill overflow={"auto"} padding={"medium"} spacing="medium">
            <Block overflow="visible">
                <h2>Row Component</h2>
                <p>Row arranges children horizontally with flexbox support.</p>
            </Block>
            
            <Block overflow="visible">
                <h3>Basic Row with Spacing</h3>
                <Row spacing="medium">
                    <Block padding="small" backgroundColor="primary.main" width="80px" height="60px" />
                    <Block padding="small" backgroundColor="secondary.main" width="80px" height="60px" />
                    <Block padding="small" backgroundColor="success.main" width="80px" height="60px" />
                </Row>
            </Block>

            <Block overflow="visible">
                <h3>Row Spacing Variants</h3>
                <Col spacing="small">
                    <Block><strong>Tiny spacing:</strong></Block>
                    <Row spacing="tiny">
                        <Block padding="small" backgroundColor="error.main" width="60px" height="40px" />
                        <Block padding="small" backgroundColor="warning.main" width="60px" height="40px" />
                        <Block padding="small" backgroundColor="info.main" width="60px" height="40px" />
                    </Row>
                    
                    <Block><strong>Small spacing:</strong></Block>
                    <Row spacing="small">
                        <Block padding="small" backgroundColor="error.main" width="60px" height="40px" />
                        <Block padding="small" backgroundColor="warning.main" width="60px" height="40px" />
                        <Block padding="small" backgroundColor="info.main" width="60px" height="40px" />
                    </Row>
                    
                    <Block><strong>Large spacing:</strong></Block>
                    <Row spacing="large">
                        <Block padding="small" backgroundColor="error.main" width="60px" height="40px" />
                        <Block padding="small" backgroundColor="warning.main" width="60px" height="40px" />
                        <Block padding="small" backgroundColor="info.main" width="60px" height="40px" />
                    </Row>
                </Col>
            </Block>

            <Block overflow="visible">
                <h3>Row Horizontal Alignment</h3>
                <Col spacing="small">
                    <Block><strong>Left (default):</strong></Block>
                    <Row spacing="small" horizontalAlign="left" backgroundColor="background.paper" padding="small">
                        <Block padding="small" backgroundColor="primary.main" width="60px" height="40px" />
                        <Block padding="small" backgroundColor="secondary.main" width="60px" height="40px" />
                    </Row>
                    
                    <Block><strong>Center:</strong></Block>
                    <Row spacing="small" horizontalAlign="center" backgroundColor="background.paper" padding="small">
                        <Block padding="small" backgroundColor="primary.main" width="60px" height="40px" />
                        <Block padding="small" backgroundColor="secondary.main" width="60px" height="40px" />
                    </Row>
                    
                    <Block><strong>Right:</strong></Block>
                    <Row spacing="small" horizontalAlign="right" backgroundColor="background.paper" padding="small">
                        <Block padding="small" backgroundColor="primary.main" width="60px" height="40px" />
                        <Block padding="small" backgroundColor="secondary.main" width="60px" height="40px" />
                    </Row>
                    
                    <Block><strong>Space Between:</strong></Block>
                    <Row spacing="small" horizontalAlign="spaceBetween" backgroundColor="background.paper" padding="small">
                        <Block padding="small" backgroundColor="primary.main" width="60px" height="40px" />
                        <Block padding="small" backgroundColor="secondary.main" width="60px" height="40px" />
                        <Block padding="small" backgroundColor="success.main" width="60px" height="40px" />
                    </Row>
                </Col>
            </Block>

            <Block overflow="visible">
                <h3>Row Vertical Alignment</h3>
                <Col spacing="small">
                    <Block><strong>Top:</strong></Block>
                    <Row spacing="small" verticalAlign="top" backgroundColor="background.paper" padding="small" height="100px">
                        <Block padding="small" backgroundColor="primary.main" width="60px" height="40px" />
                        <Block padding="small" backgroundColor="secondary.main" width="60px" height="60px" />
                    </Row>
                    
                    <Block><strong>Center:</strong></Block>
                    <Row spacing="small" verticalAlign="center" backgroundColor="background.paper" padding="small" height="100px">
                        <Block padding="small" backgroundColor="primary.main" width="60px" height="40px" />
                        <Block padding="small" backgroundColor="secondary.main" width="60px" height="60px" />
                    </Row>
                    
                    <Block><strong>Bottom:</strong></Block>
                    <Row spacing="small" verticalAlign="bottom" backgroundColor="background.paper" padding="small" height="100px">
                        <Block padding="small" backgroundColor="primary.main" width="60px" height="40px" />
                        <Block padding="small" backgroundColor="secondary.main" width="60px" height="60px" />
                    </Row>
                </Col>
            </Block>

            <Block overflow="visible">
                <h3>Row with Dividers</h3>
                <Row spacing="medium" divider>
                    <Block padding="small" backgroundColor="primary.light" width="80px" height="60px" />
                    <Block padding="small" backgroundColor="secondary.light" width="80px" height="60px" />
                    <Block padding="small" backgroundColor="success.light" width="80px" height="60px" />
                </Row>
            </Block>

            <Block overflow="visible">
                <h3>Row with FlexWrap</h3>
                <Row spacing="medium" flexWrap="wrap" maxWidth="300px" backgroundColor="background.paper" padding="small">
                    <Block padding="small" backgroundColor="primary.main" width="80px" height="60px" />
                    <Block padding="small" backgroundColor="secondary.main" width="80px" height="60px" />
                    <Block padding="small" backgroundColor="success.main" width="80px" height="60px" />
                    <Block padding="small" backgroundColor="error.main" width="80px" height="60px" />
                    <Block padding="small" backgroundColor="warning.main" width="80px" height="60px" />
                </Row>
            </Block>

            <Block overflow="visible">
                <h3>Card Grid Layout Example</h3>
                <Row spacing="medium" flexWrap="wrap">
                    {[1, 2, 3, 4, 5, 6].map(num => (
                        <Block key={num} padding="medium" backgroundColor="background.paper" width="150px">
                            <Col spacing="small">
                                <Block backgroundColor="primary.main" height="80px" />
                                <Block><strong>Card {num}</strong></Block>
                                <Block>Sample content for card {num}</Block>
                                <Button contentView="Action" size="small" variant="contained" color="primary.main" />
                            </Col>
                        </Block>
                    ))}
                </Row>
            </Block>
        </Col>
    );
}
