import { Row, Col, Block } from "@components";

export function ColDemos() {
    return (
        <Col fill overflow={"auto"} padding={"medium"} spacing="medium">
            <Block overflow="visible">
                <h2>Col Component</h2>
                <p>Col arranges children vertically with flexbox support.</p>
            </Block>
            
            <Block overflow="visible">
                <h3>Basic Col with Spacing</h3>
                <Col spacing="medium" maxWidth="200px">
                    <Block padding="small" backgroundColor="primary.main" height="40px">Item 1</Block>
                    <Block padding="small" backgroundColor="secondary.main" height="40px">Item 2</Block>
                    <Block padding="small" backgroundColor="success.main" height="40px">Item 3</Block>
                </Col>
            </Block>

            <Block overflow="visible">
                <h3>Col Vertical Alignment</h3>
                <Row spacing="large" flexWrap="wrap">
                    <Block>
                        <strong>Top (default):</strong>
                        <Col spacing="small" verticalAlign="top" backgroundColor="background.paper" padding="small" height="200px" width="120px">
                            <Block padding="small" backgroundColor="primary.main" height="40px" />
                            <Block padding="small" backgroundColor="secondary.main" height="40px" />
                        </Col>
                    </Block>
                    
                    <Block>
                        <strong>Center:</strong>
                        <Col spacing="small" verticalAlign="center" backgroundColor="background.paper" padding="small" height="200px" width="120px">
                            <Block padding="small" backgroundColor="primary.main" height="40px" />
                            <Block padding="small" backgroundColor="secondary.main" height="40px" />
                        </Col>
                    </Block>
                    
                    <Block>
                        <strong>Bottom:</strong>
                        <Col spacing="small" verticalAlign="bottom" backgroundColor="background.paper" padding="small" height="200px" width="120px">
                            <Block padding="small" backgroundColor="primary.main" height="40px" />
                            <Block padding="small" backgroundColor="secondary.main" height="40px" />
                        </Col>
                    </Block>
                </Row>
            </Block>

            <Block overflow="visible">
                <h3>Col Horizontal Alignment</h3>
                <Row spacing="large" flexWrap="wrap">
                    <Block>
                        <strong>Left (default):</strong>
                        <Col spacing="small" horizontalAlign="left" backgroundColor="background.paper" padding="small" height="150px" width="150px">
                            <Block padding="small" backgroundColor="primary.main" height="30px" width="80px" />
                            <Block padding="small" backgroundColor="secondary.main" height="30px" width="80px" />
                        </Col>
                    </Block>
                    
                    <Block>
                        <strong>Center:</strong>
                        <Col spacing="small" horizontalAlign="center" backgroundColor="background.paper" padding="small" height="150px" width="150px">
                            <Block padding="small" backgroundColor="primary.main" height="30px" width="80px" />
                            <Block padding="small" backgroundColor="secondary.main" height="30px" width="80px" />
                        </Col>
                    </Block>
                    
                    <Block>
                        <strong>Right:</strong>
                        <Col spacing="small" horizontalAlign="right" backgroundColor="background.paper" padding="small" height="150px" width="150px">
                            <Block padding="small" backgroundColor="primary.main" height="30px" width="80px" />
                            <Block padding="small" backgroundColor="secondary.main" height="30px" width="80px" />
                        </Col>
                    </Block>
                </Row>
            </Block>

            <Block overflow="visible">
                <h3>Col with Dividers</h3>
                <Col spacing="medium" divider maxWidth="200px">
                    <Block padding="small" backgroundColor="primary.light" height="40px">Section 1</Block>
                    <Block padding="small" backgroundColor="secondary.light" height="40px">Section 2</Block>
                    <Block padding="small" backgroundColor="success.light" height="40px">Section 3</Block>
                </Col>
            </Block>

            <Block overflow="visible">
                <h3>Dashboard Layout Example</h3>
                <Col spacing="medium">
                    <Row spacing="medium" flexWrap="wrap">
                        <Block padding="medium" backgroundColor="info.light" fill>
                            <strong>Stat 1</strong>
                            <p>Value: 1,234</p>
                        </Block>
                        <Block padding="medium" backgroundColor="success.light" fill>
                            <strong>Stat 2</strong>
                            <p>Value: 5,678</p>
                        </Block>
                        <Block padding="medium" backgroundColor="warning.light" fill>
                            <strong>Stat 3</strong>
                            <p>Value: 9,012</p>
                        </Block>
                    </Row>
                    
                    <Row spacing="medium" flexWrap="wrap">
                        <Block padding="medium" backgroundColor="background.paper" fill height="150px">
                            <strong>Main Content Area</strong>
                            <p>This area uses fill to take available space.</p>
                        </Block>
                        <Block padding="medium" backgroundColor="secondary.light" width="200px" height="150px">
                            <strong>Sidebar</strong>
                            <p>Fixed width sidebar</p>
                        </Block>
                    </Row>
                </Col>
            </Block>
        </Col>
    );
}
