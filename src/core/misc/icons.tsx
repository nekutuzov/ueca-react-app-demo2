export type IconProps = {
    render?: boolean;
    // `number` is a pixel size; a string passes straight through, which is how `Icon` sizes these
    // from a token — it sets font-size on the wrapper and renders the glyph at "1em". Without that
    // the icon scale would have to be duplicated as numbers here and kept in sync with tokens.css.
    size?: number | string;
    color?: string;
};

// ============================================================================
// The app's icon set — one outline family, drawn for this project.
//
// Every interface glyph sits on the same 24px grid with the same 1.75px stroke, round caps and
// round joins, so they read as one set wherever they appear together: a toolbar, a menu, an alert.
// A handful of small solid dots (the ellipsis, the "i" and "?" marks) are filled rather than
// stroked, because a 1.75px round cap is too small to read as a dot.
//
// Brand marks (GitHub, YouTube, npm) are the exception and keep their own shapes — they identify
// those services, so they are drawn as the services draw them.
//
// Call sites should usually name a ROLE through `<Icon name="…" />` (see iconRegistry.ts) rather
// than import a glyph, so swapping a drawing is an edit to the registry and nothing else.
// ============================================================================

// The outline family. `color` is applied as the SVG `color` attribute and every stroke and dot
// draws in currentColor, so a colour passed as a prop reaches the dots as well as the strokes;
// with no colour the glyph inherits the surrounding text colour.
function outline(props: IconProps, children: React.ReactNode) {
    if (props?.render === false) {
        return null;
    }
    const size = props?.size ?? 24;
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            color={props?.color}
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {children}
        </svg>
    );
}

// A solid dot inside an outline glyph.
function dot(cx: number, cy: number, r = 1.15) {
    return <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />;
}

// ---- Navigation and chrome -------------------------------------------------

export function HomeIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M3.5 10.5 12 3.75l8.5 6.75" />
        <path d="M5.75 9v11h12.5V9" />
        <path d="M10 20v-5.25h4V20" />
    </>);
}

export function MenuIcon(props?: IconProps) {
    return outline(props, <path d="M4 6.5h16M4 12h16M4 17.5h16" />);
}

export function MenuCollapseIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M4 6.5h16M11 12h9M4 17.5h16" />
        <path d="m7.5 9.25-3 2.75 3 2.75" />
    </>);
}

export function ChevronUpIcon(props?: IconProps) {
    return outline(props, <path d="m6 15 6-6 6 6" />);
}

export function ChevronDownIcon(props?: IconProps) {
    return outline(props, <path d="m6 9 6 6 6-6" />);
}

export function ChevronLeftIcon(props?: IconProps) {
    return outline(props, <path d="m15 6-6 6 6 6" />);
}

export function ChevronRightIcon(props?: IconProps) {
    return outline(props, <path d="m9 6 6 6-6 6" />);
}

// The dropdown caret — a smaller, lighter chevron than the navigation ones above.
export function AngleUpIcon(props?: IconProps) {
    return outline(props, <path d="m8 14 4-4 4 4" />);
}

export function AngleDownIcon(props?: IconProps) {
    return outline(props, <path d="m8 10 4 4 4-4" />);
}

export function ArrowLeftIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M19 12H5" />
        <path d="m11 6-6 6 6 6" />
    </>);
}

export function ArrowRightIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
    </>);
}

export function SortIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M8 19.5V4.5M4.75 7.75 8 4.5l3.25 3.25" />
        <path d="M16 4.5v15M12.75 16.25 16 19.5l3.25-3.25" />
    </>);
}

export function ListIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M9 6.5h11M9 12h11M9 17.5h11" />
        {dot(4.75, 6.5)}
        {dot(4.75, 12)}
        {dot(4.75, 17.5)}
    </>);
}

export function MoreIcon(props?: IconProps) {
    return outline(props, <>
        {dot(5.5, 12, 1.5)}
        {dot(12, 12, 1.5)}
        {dot(18.5, 12, 1.5)}
    </>);
}

export function LayoutIcon(props?: IconProps) {
    return outline(props, <>
        <rect x="3.5" y="4" width="17" height="16" rx="2" />
        <path d="M3.5 9h17M9.5 9v11" />
    </>);
}

export function GridIcon(props?: IconProps) {
    return outline(props, <>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </>);
}

// ---- Record actions --------------------------------------------------------

export function AddIcon(props?: IconProps) {
    return outline(props, <path d="M12 5v14M5 12h14" />);
}

export function AddCircleIcon(props?: IconProps) {
    return outline(props, <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8.5v7M8.5 12h7" />
    </>);
}

export function EditIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M14.5 5.25 18.75 9.5 8.5 19.75H4.25V15.5z" />
        <path d="m12.25 7.5 4.25 4.25" />
    </>);
}

export function DeleteIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M4.5 7h15" />
        <path d="M9.5 7V4.5h5V7" />
        <path d="m6.5 7 1 13h9l1-13" />
        <path d="M10 11v5.5M14 11v5.5" />
    </>);
}

export function CheckIcon(props?: IconProps) {
    return outline(props, <path d="m5 12.5 4.5 4.5L19 7.5" />);
}

export function IndeterminateIcon(props?: IconProps) {
    return outline(props, <path d="M6 12h12" />);
}

export function CancelIcon(props?: IconProps) {
    return outline(props, <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m9.25 9.25 5.5 5.5M14.75 9.25l-5.5 5.5" />
    </>);
}

export function CloseIcon(props?: IconProps) {
    return outline(props, <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />);
}

export function RefreshIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
        <path d="M19.5 4.25v4.5H15" />
    </>);
}

export function ClipboardIcon(props?: IconProps) {
    return outline(props, <>
        <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
        <path d="M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
    </>);
}

export function PrintIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M7 9V4.5h10V9" />
        <rect x="4" y="9" width="16" height="7.5" rx="1.5" />
        <path d="M7 14h10v6H7z" />
    </>);
}

export function ExportFileIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M13.5 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z" />
        <path d="M13.5 3.5v5h5" />
        <path d="M9 14.5h6M12.75 12.25 15 14.5l-2.25 2.25" />
    </>);
}

export function DownloadIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M12 4v11" />
        <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
        <path d="M5 19.5h14" />
    </>);
}

export function UploadIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M12 15V4" />
        <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
        <path d="M5 19.5h14" />
    </>);
}

export function FilterIcon(props?: IconProps) {
    return outline(props, <path d="M4 5h16l-6.25 7.5v6.25L10.25 17.5v-5z" />);
}

export function SearchIcon(props?: IconProps) {
    return outline(props, <>
        <circle cx="10.5" cy="10.5" r="6" />
        <path d="m15 15 5 5" />
    </>);
}

export function LogoutIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14" />
        <path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5" />
    </>);
}

// ---- Status ----------------------------------------------------------------
// Outline like everything else. A status surface — an alert, a toast, an invalid field — already
// carries its own tint, so a stroked glyph in the status ink reads clearly without a solid badge.

export function SuccessCircleIcon(props?: IconProps) {
    return outline(props, <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8.5 12.25 2.5 2.5 4.5-5" />
    </>);
}

export function InfoCircleIcon(props?: IconProps) {
    return outline(props, <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 11v5.5" />
        {dot(12, 7.9)}
    </>);
}

// The same glyph as InfoCircleIcon, kept as its own export for the call sites that import it.
export function InfoIcon(props?: IconProps) {
    return InfoCircleIcon(props);
}

export function WarningIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M10.3 4.5 3.3 17a2 2 0 0 0 1.7 3h14a2 2 0 0 0 1.7-3L13.7 4.5a1.95 1.95 0 0 0-3.4 0z" />
        <path d="M12 9.5v4.25" />
        {dot(12, 16.9)}
    </>);
}

export function ErrorCircleIcon(props?: IconProps) {
    return outline(props, <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5v5.5" />
        {dot(12, 16.1)}
    </>);
}

export function HelpIcon(props?: IconProps) {
    return outline(props, <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9.6 9.4a2.5 2.5 0 0 1 4.85.85c0 1.65-2.45 2.15-2.45 3.7" />
        {dot(12, 16.9)}
    </>);
}

// ---- People and security ---------------------------------------------------

export function UserIcon(props?: IconProps) {
    return outline(props, <>
        <circle cx="12" cy="8.5" r="3.75" />
        <path d="M5 20a7 7 0 0 1 14 0" />
    </>);
}

// The same glyph as UserIcon, kept as its own export for the call sites that import it.
export function PersonIcon(props?: IconProps) {
    return UserIcon(props);
}

export function AccountIcon(props?: IconProps) {
    return outline(props, <>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="10" r="3" />
        <path d="M6.6 18.1a6.1 6.1 0 0 1 10.8 0" />
    </>);
}

export function SecurityIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M12 3.5 5 6.1v5.4c0 4.25 2.9 7.8 7 9 4.1-1.2 7-4.75 7-9V6.1z" />
        <path d="m9 12 2.1 2.1L15.25 10" />
    </>);
}

export function LockIcon(props?: IconProps) {
    return outline(props, <>
        <rect x="5" y="10.5" width="14" height="10" rx="2" />
        <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        <path d="M12 14.5v2" />
    </>);
}

export function EyeIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M2.75 12S6.25 5.75 12 5.75 21.25 12 21.25 12 17.75 18.25 12 18.25 2.75 12 2.75 12z" />
        <circle cx="12" cy="12" r="3" />
    </>);
}

export function EyeSlashIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M9.9 5.95A9 9 0 0 1 12 5.75C17.75 5.75 21.25 12 21.25 12a15.7 15.7 0 0 1-2.55 3.35M6.55 6.8C4 8.5 2.75 12 2.75 12S6.25 18.25 12 18.25a8.7 8.7 0 0 0 5.3-1.8" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        <path d="m3.5 3.5 17 17" />
    </>);
}

// ---- Settings, content and data -------------------------------------------

export function SettingsIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M10.23 5.33 10.8 3.08h2.4l.57 2.25 1.7.7 1.99-1.18 1.69 1.69-1.18 1.99.7 1.7 2.25.57v2.4l-2.25.57-.7 1.7 1.18 1.99-1.69 1.69-1.99-1.18-1.7.7-.57 2.25h-2.4l-.57-2.25-1.7-.7-1.99 1.18-1.69-1.69 1.18-1.99-.7-1.7-2.25-.57v-2.4l2.25-.57.7-1.7-1.18-1.99 1.69-1.69 1.99 1.18z" />
        <circle cx="12" cy="12" r="3" />
    </>);
}

export function ThemeIcon(props?: IconProps) {
    return outline(props, <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" stroke="none" />
    </>);
}

export function SunIcon(props?: IconProps) {
    return outline(props, <>
        <circle cx="12" cy="12" r="4.1" />
        <path d="M12 2.6v2.2M12 19.2v2.2M4.3 4.3l1.6 1.6M18.1 18.1l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.3 19.7l1.6-1.6M18.1 5.9l1.6-1.6" />
    </>);
}

export function MoonIcon(props?: IconProps) {
    return outline(props, <path d="M20.5 14.3A8.6 8.6 0 0 1 9.7 3.5a8.6 8.6 0 1 0 10.8 10.8" />);
}

export function FolderIcon(props?: IconProps) {
    return outline(props, <path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4l2 2.5h8a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z" />);
}

export function DocumentIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M13.5 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z" />
        <path d="M13.5 3.5v5h5" />
        <path d="M9 13h6M9 16.5h6" />
    </>);
}

export function DatabaseIcon(props?: IconProps) {
    return outline(props, <>
        <ellipse cx="12" cy="6" rx="7" ry="2.5" />
        <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
        <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
    </>);
}

export function CalendarIcon(props?: IconProps) {
    return outline(props, <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 9.5h16M8.5 3.5v3M15.5 3.5v3" />
    </>);
}

export function ChartIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M4 4v16h16" />
        <path d="m7.5 14.5 3.5-4 3 3 5-6" />
    </>);
}

export function TableIcon(props?: IconProps) {
    return outline(props, <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10" />
    </>);
}

export function EmailIcon(props?: IconProps) {
    return outline(props, <>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
        <path d="m4 7.25 8 5.75 8-5.75" />
    </>);
}

export function WebsiteIcon(props?: IconProps) {
    return outline(props, <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17" />
        <path d="M12 3.5a13 13 0 0 1 0 17 13 13 0 0 1 0-17z" />
    </>);
}

export function HeartIcon(props?: IconProps) {
    return outline(props, <path d="M12 19.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 6.75a4.3 4.3 0 0 1 7.5 2.75c0 5.6-7.5 10-7.5 10z" />);
}

// ---- Showcase sections -----------------------------------------------------
// One glyph per component family, used by the navigation menu and the showcase screens.

export function DashboardIcon(props?: IconProps) {
    return outline(props, <>
        <rect x="3.5" y="3.5" width="7.5" height="9" rx="1.5" />
        <rect x="13" y="3.5" width="7.5" height="5" rx="1.5" />
        <rect x="13" y="11" width="7.5" height="9.5" rx="1.5" />
        <rect x="3.5" y="15" width="7.5" height="5.5" rx="1.5" />
    </>);
}

export function SwatchIcon(props?: IconProps) {
    return outline(props, <>
        <circle cx="7.5" cy="7.5" r="3.5" />
        <circle cx="16.5" cy="7.5" r="3.5" />
        <circle cx="7.5" cy="16.5" r="3.5" />
        <circle cx="16.5" cy="16.5" r="3.5" />
    </>);
}

export function SlidersIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
        <circle cx="15" cy="7" r="2" />
        <circle cx="9" cy="17" r="2" />
    </>);
}

export function PulseIcon(props?: IconProps) {
    return outline(props, <path d="M3.5 12h4l2.5-6 4 12 2.5-6h4" />);
}

export function ShapesIcon(props?: IconProps) {
    return outline(props, <>
        <circle cx="7.5" cy="7.5" r="3.5" />
        <rect x="13.5" y="4" width="7" height="7" rx="1.5" />
        <path d="M7.5 13.5 11.25 20.5h-7.5z" />
        <path d="m17 13.25 3.5 3.5-3.5 3.5-3.5-3.5z" />
    </>);
}

export function LayersIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M12 3.5 20.5 8 12 12.5 3.5 8z" />
        <path d="m3.5 12 8.5 4.5 8.5-4.5" />
        <path d="m3.5 16 8.5 4.5 8.5-4.5" />
    </>);
}

export function BoltIcon(props?: IconProps) {
    return outline(props, <path d="M13 3.5 5.5 13.5H12l-1 7 7.5-10H12z" />);
}

export function CodeIcon(props?: IconProps) {
    return outline(props, <path d="m8.5 7.5-5 4.5 5 4.5M15.5 7.5l5 4.5-5 4.5" />);
}

export function CubeIcon(props?: IconProps) {
    return outline(props, <>
        <path d="M12 3.5 19.5 7.5v9L12 20.5l-7.5-4v-9z" />
        <path d="M4.5 7.5 12 11.5l7.5-4M12 11.5v9" />
    </>);
}

export function BlockIcon(props?: IconProps) {
    return outline(props, <rect x="4.5" y="4.5" width="15" height="15" rx="2" />);
}

export function ButtonsIcon(props?: IconProps) {
    return outline(props, <>
        <rect x="3.5" y="7.5" width="17" height="9" rx="4.5" />
        <path d="M8.5 12h7" />
    </>);
}

export function InputsIcon(props?: IconProps) {
    return outline(props, <>
        <rect x="3.5" y="6.5" width="17" height="11" rx="2" />
        <path d="M7.5 10v4" />
    </>);
}

export function PopupsIcon(props?: IconProps) {
    return outline(props, <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <path d="M3.5 8.5h17M8 13h8M8 16h5" />
    </>);
}

export function FlyoutsIcon(props?: IconProps) {
    return outline(props, <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <path d="M14 4.5v15" />
    </>);
}

export function NavigationIcon(props?: IconProps) {
    return outline(props, <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z" />
    </>);
}

export function TabsIcon(props?: IconProps) {
    return outline(props, <path d="M3.5 19.5V7A1.5 1.5 0 0 1 5 5.5h4.5A1.5 1.5 0 0 1 11 7v2.5h8a1.5 1.5 0 0 1 1.5 1.5v8.5z" />);
}

// The same glyph as GridIcon, kept as its own export for the call sites that import it.
export function MiscIcon(props?: IconProps) {
    return GridIcon(props);
}

// ---- Brand marks -----------------------------------------------------------
// Drawn as the services draw them, not in the outline family: they identify the service.

export function GitHubIcon(props?: IconProps) {
    if (props?.render === false) {
        return null;
    }
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" focusable="false">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
    );
}

export function YouTubeIcon(props?: IconProps) {
    if (props?.render === false) {
        return null;
    }
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" focusable="false">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
    );
}

export function NpmIcon(props?: IconProps) {
    if (props?.render === false) {
        return null;
    }
    const size = props?.size ?? 24;
    const color = props?.color ?? "currentColor";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" focusable="false">
            <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
        </svg>
    );
}
