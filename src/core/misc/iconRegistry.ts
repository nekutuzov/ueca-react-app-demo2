import {
    AccountIcon, AddCircleIcon, AddIcon, AngleDownIcon, AngleUpIcon, ArrowLeftIcon, ArrowRightIcon,
    BoltIcon, CalendarIcon, CancelIcon, ChartIcon, CheckIcon, ChevronDownIcon, ChevronLeftIcon,
    ChevronRightIcon, ChevronUpIcon, ClipboardIcon, CloseIcon, CodeIcon, DashboardIcon, DatabaseIcon,
    DeleteIcon, DocumentIcon, DownloadIcon, EditIcon, EmailIcon, ErrorCircleIcon, ExportFileIcon,
    EyeIcon, EyeSlashIcon, FilterIcon, FolderIcon, GridIcon, HeartIcon, HelpIcon, HomeIcon, IconProps,
    InfoCircleIcon, LayersIcon, LayoutIcon, ListIcon, LockIcon, LogoutIcon, MenuCollapseIcon, MenuIcon,
    MoonIcon, MoreIcon, PrintIcon, PulseIcon, RefreshIcon, SearchIcon, SecurityIcon, SettingsIcon,
    ShapesIcon, SlidersIcon, SortIcon, SuccessCircleIcon, SunIcon, SwatchIcon, TableIcon, ThemeIcon,
    UploadIcon, UserIcon, WarningIcon, WebsiteIcon
} from "./icons";

// ============================================================================
// Icon registry — one name, the source decided here.
//
// Call sites name a ROLE ("delete", "refresh"), never a glyph. Swapping one drawing for another,
// or for an image the server supplies, is then an edit HERE and nothing else changes — the same
// reasoning that keeps colour in themes.css rather than in components.
//
// Two source kinds:
//   svg — a React component from icons.tsx. Monochrome, recolours via currentColor.
//   url — an image. NOT monochrome: it cannot be recoloured, and `Icon` ignores `color` for it.
//         Included so the shape is right for server-supplied icons; a remote source is async and
//         will need `Icon` promoted from a plain function to a UECA component holding load/error
//         state. The public API below does not change when that happens.
// ============================================================================

type IconSource =
    | { kind: "svg"; component: (props?: IconProps) => React.ReactNode }
    | { kind: "url"; src: string; alt?: string };

// Roles, grouped by what they are for rather than by what they look like.
const ICONS = {
    // Navigation / chrome
    home: { kind: "svg", component: HomeIcon },
    layout: { kind: "svg", component: LayoutIcon },
    grid: { kind: "svg", component: GridIcon },
    list: { kind: "svg", component: ListIcon },
    menu: { kind: "svg", component: MenuIcon },
    menuCollapse: { kind: "svg", component: MenuCollapseIcon },
    chevronUp: { kind: "svg", component: ChevronUpIcon },
    chevronDown: { kind: "svg", component: ChevronDownIcon },
    chevronLeft: { kind: "svg", component: ChevronLeftIcon },
    chevronRight: { kind: "svg", component: ChevronRightIcon },
    // The DROPDOWN caret — a role of its own, not a second use of the chevrons above: a menu
    // trigger's caret is smaller and lighter than a navigation chevron. Same direction, different
    // job, so they must not collapse into one role.
    angleUp: { kind: "svg", component: AngleUpIcon },
    angleDown: { kind: "svg", component: AngleDownIcon },
    arrowLeft: { kind: "svg", component: ArrowLeftIcon },
    arrowRight: { kind: "svg", component: ArrowRightIcon },
    sort: { kind: "svg", component: SortIcon },
    more: { kind: "svg", component: MoreIcon },

    // Record actions
    add: { kind: "svg", component: AddIcon },
    addCircle: { kind: "svg", component: AddCircleIcon },
    edit: { kind: "svg", component: EditIcon },
    delete: { kind: "svg", component: DeleteIcon },
    save: { kind: "svg", component: CheckIcon },
    // same glyph as "save": the selected-menu-row checkmark role
    check: { kind: "svg", component: CheckIcon },
    cancel: { kind: "svg", component: CancelIcon },
    refresh: { kind: "svg", component: RefreshIcon },
    close: { kind: "svg", component: CloseIcon },
    copy: { kind: "svg", component: ClipboardIcon },
    print: { kind: "svg", component: PrintIcon },
    exportFile: { kind: "svg", component: ExportFileIcon },
    download: { kind: "svg", component: DownloadIcon },
    upload: { kind: "svg", component: UploadIcon },
    filter: { kind: "svg", component: FilterIcon },
    search: { kind: "svg", component: SearchIcon },
    logout: { kind: "svg", component: LogoutIcon },

    // Status
    success: { kind: "svg", component: SuccessCircleIcon },
    info: { kind: "svg", component: InfoCircleIcon },
    // The help affordance beside a field label — a distinct ROLE from the `info` status icon an
    // alert wears, even though it draws the same glyph today. Keeping them apart is what lets one
    // change without the other.
    infoHint: { kind: "svg", component: InfoCircleIcon },
    warning: { kind: "svg", component: WarningIcon },
    error: { kind: "svg", component: ErrorCircleIcon },
    help: { kind: "svg", component: HelpIcon },

    // People and security
    user: { kind: "svg", component: UserIcon },
    account: { kind: "svg", component: AccountIcon },
    security: { kind: "svg", component: SecurityIcon },
    lock: { kind: "svg", component: LockIcon },
    eye: { kind: "svg", component: EyeIcon },
    eyeSlash: { kind: "svg", component: EyeSlashIcon },

    // Content and data
    settings: { kind: "svg", component: SettingsIcon },
    folder: { kind: "svg", component: FolderIcon },
    document: { kind: "svg", component: DocumentIcon },
    database: { kind: "svg", component: DatabaseIcon },
    table: { kind: "svg", component: TableIcon },
    calendar: { kind: "svg", component: CalendarIcon },
    chart: { kind: "svg", component: ChartIcon },
    email: { kind: "svg", component: EmailIcon },
    website: { kind: "svg", component: WebsiteIcon },
    favorite: { kind: "svg", component: HeartIcon },

    // Appearance
    theme: { kind: "svg", component: ThemeIcon },
    lightMode: { kind: "svg", component: SunIcon },
    darkMode: { kind: "svg", component: MoonIcon },

    // Showcase sections — one per component family, shared by the menu and the screens.
    overview: { kind: "svg", component: DashboardIcon },
    tokens: { kind: "svg", component: SwatchIcon },
    controls: { kind: "svg", component: SlidersIcon },
    status: { kind: "svg", component: PulseIcon },
    icons: { kind: "svg", component: ShapesIcon },
    overlays: { kind: "svg", component: LayersIcon },
    dynamic: { kind: "svg", component: BoltIcon },
    code: { kind: "svg", component: CodeIcon }
} as const satisfies Record<string, IconSource>;

type IconName = keyof typeof ICONS;

function getIconSource(name: IconName): IconSource {
    return ICONS[name];
}

function iconNames(): IconName[] {
    return Object.keys(ICONS) as IconName[];
}

export { IconSource, IconName, ICONS, getIconSource, iconNames };
