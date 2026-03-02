import * as React from "react";

type ErrorFallbackProps = {
    children?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}

class ErrorFallback extends React.PureComponent<ErrorFallbackProps, { error: boolean }> {

    constructor(props: ErrorFallbackProps | Readonly<ErrorFallbackProps>) {
        super(props);
        this.state = { error: false }
    }

    static getDerivedStateFromError() {
        return { error: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        const { onError } = this.props;
        onError?.(error, info);
    }

    render() {
        const { children } = this.props;
        if (this.state.error) {
            return <span>This page isn’t loading correctly. Please try refreshing it.</span>
        }
        return (
            <React.Fragment>
                {children || false}
            </React.Fragment>
        )
    }
}

export { ErrorFallback }
