export type IconProps = {
    size?: number;
    color?: string;
};

export function HomeIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
    );
}

export function LayoutIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
        </svg>
    );
}

export function ButtonsIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
        </svg>
    );
}

export function InputsIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
    );
}

export function PopupsIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-8-2h2v-2h-2v2zm0-4h2V7h-2v6z" />
        </svg>
    );
}

export function FlyoutsIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
    );
}

export function NavigationIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
        </svg>
    );
}

export function TabsIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h10v4h8v10z" />
        </svg>
    );
}

export function MiscIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
    );
}

// Icon Button Icons
export function CheckIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
    );
}

export function IndeterminateIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M19 13H5v-2h14v2z" />
        </svg>
    );
}

export function CancelIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
        </svg>
    );
}

export function DeleteIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
    );
}

export function RefreshIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
        </svg>
    );
}

export function CloseIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
    );
}

// Settings and Profile Icons
export function SettingsIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
    );
}

export function PersonIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
    );
}

export function AccountIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
        </svg>
    );
}

export function SecurityIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
        </svg>
    );
}

export function InfoIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
    );
}

export function BlockIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z" />
        </svg>
    );
}

export function ClipboardIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V19z" />
        </svg>
    );
}

// Navigation Icons
export function MenuIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
    );
}

export function MenuCollapseIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M3 18h13v-2H3v2zm0-5h10v-2H3v2zm0-7v2h13V6H3zm18 9.59L17.42 12 21 8.41 19.59 7l-5 5 5 5L21 15.59z" />
        </svg>
    );
}

export function ChevronDownIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M7 10l5 5 5-5z" />
        </svg>
    );
}

export function ChevronRightIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M9.29 6.71a.996.996 0 000 1.41L13.17 12l-3.88 3.88a.996.996 0 101.41 1.41l4.59-4.59a.996.996 0 000-1.41L10.7 6.7c-.38-.38-1.02-.38-1.41.01z" />
        </svg>
    );
}

export function ChevronLeftIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
    );
}

export function ChevronUpIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
        </svg>
    );
}

export function GitHubIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
    );
}

export function FolderIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
        </svg>
    );
}

export function DocumentIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
    );
}

export function HeartIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
    );
}

export function SuccessCircleIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
    );
}

export function InfoCircleIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
    );
}

export function WarningIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </svg>
    );
}

export function ErrorCircleIcon(props?: IconProps) {
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
    );
}
