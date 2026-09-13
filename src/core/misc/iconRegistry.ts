import {
    AccountIcon, AddIcon, CancelIcon, CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon,
    ChevronUpIcon, ClipboardIcon, CloseIcon, DatabaseIcon, DeleteIcon, DocumentIcon, EditIcon,
    ErrorCircleIcon, FolderIcon, HomeIcon, IconProps, InfoCircleIcon, LayoutIcon,
    MenuCollapseIcon, MenuIcon, RefreshIcon, SecurityIcon,
    SortIcon, SuccessCircleIcon, WarningIcon
} from "./icons";

// ============================================================================
// Icon registry — one name, several possible sources.
//
// Call sites name a ROLE ("delete", "refresh"), never a source. Swapping a hand-rolled SVG for a
// FontAwesome glyph, or for an image the server supplies, is then an edit HERE and nothing else
// changes — the same reasoning that keeps colour in themes.css rather than in components.
//
// Three source kinds today:
//   svg — a React component from icons.tsx. Monochrome, recolours via currentColor.
//   fa  — a FontAwesome Pro class pair. Monochrome, recolours via `color`. The Pro CSS is already
//         bundled (main.tsx), so this costs nothing extra.
//   url — an image. NOT monochrome: it cannot be recoloured, and `Icon` ignores `color` for it.
//         Included now so the shape is right for server-supplied icons later; note that a remote
//         source is async and will need `Icon` promoted from a plain function to a UECA component
//         holding load/error state. The public API below does not change when that happens.
// ============================================================================

type IconSource =
    | { kind: "svg"; component: (props?: IconProps) => React.ReactNode }
    | { kind: "fa"; classes: string }
    | { kind: "url"; src: string; alt?: string };

// Roles, grouped by what they are for rather than by what they look like.
const ICONS = {
    // Navigation / chrome
    home: { kind: "svg", component: HomeIcon },
    layout: { kind: "svg", component: LayoutIcon },
    menu: { kind: "svg", component: MenuIcon },
    menuCollapse: { kind: "svg", component: MenuCollapseIcon },
    chevronUp: { kind: "svg", component: ChevronUpIcon },
    chevronDown: { kind: "svg", component: ChevronDownIcon },
    // The DROPDOWN caret — a role of its own, not a second use of the chevrons above. Legacy draws
    // a menu trigger's caret with fal angle-up/down (topBarMenuItem.tsx:90) and an input's or a
    // select's with fal chevron-up/down (input.tsx:92, selectEx.tsx:152). Same direction, different
    // glyph, different job, so they must not collapse into one role.
    angleUp: { kind: "fa", classes: "fa-light fa-angle-up" },
    angleDown: { kind: "fa", classes: "fa-light fa-angle-down" },
    chevronLeft: { kind: "svg", component: ChevronLeftIcon },
    chevronRight: { kind: "svg", component: ChevronRightIcon },
    sort: { kind: "svg", component: SortIcon },

    // Record actions
    add: { kind: "svg", component: AddIcon },
    // legacy toolActions "Add new" glyph (fal plus-circle)
    addCircle: { kind: "fa", classes: "fa-light fa-circle-plus" },
    edit: { kind: "svg", component: EditIcon },
    delete: { kind: "svg", component: DeleteIcon },
    save: { kind: "svg", component: CheckIcon },
    // same glyph as "save": the selected-menu-row checkmark role
    check: { kind: "svg", component: CheckIcon },
    cancel: { kind: "svg", component: CancelIcon },
    refresh: { kind: "svg", component: RefreshIcon },
    close: { kind: "svg", component: CloseIcon },
    copy: { kind: "svg", component: ClipboardIcon },

    // Status
    success: { kind: "svg", component: SuccessCircleIcon },
    info: { kind: "svg", component: InfoCircleIcon },
    // The help affordance beside a field label — a distinct role from the `info` STATUS icon an
    // alert wears, and legacy drew it as the light outline circle rather than a filled glyph.
    infoHint: { kind: "fa", classes: "fa-light fa-circle-info" },
    warning: { kind: "svg", component: WarningIcon },
    error: { kind: "svg", component: ErrorCircleIcon },

    // Entities
    user: { kind: "fa", classes: "fa-light fa-user" },   // legacy used the fal outline everywhere
    account: { kind: "svg", component: AccountIcon },
    security: { kind: "svg", component: SecurityIcon },
    settings: { kind: "fa", classes: "fa-light fa-gear" },   // legacy Settings screen/menu glyph (fal cog)
    folder: { kind: "svg", component: FolderIcon },
    document: { kind: "svg", component: DocumentIcon },
    // The two Help menu rows. Distinct roles rather than two uses of `document`, because they point
    // at different things: a manual to read, and this build's release notes.
    guide: { kind: "fa", classes: "fa-light fa-book-open" },
    releaseNotes: { kind: "fa", classes: "fa-light fa-file-lines" },
    database: { kind: "svg", component: DatabaseIcon },
    email: { kind: "fa", classes: "fa-light fa-envelope" },   // legacy Email screen/menu glyph (fal envelope)
    sites: { kind: "fa", classes: "fa-light fa-window-restore" },   // legacy Sites screen/menu glyph
    site: { kind: "fa", classes: "fa-light fa-window-maximize" },   // legacy crumb icon for one site
    license: { kind: "fa", classes: "fa-light fa-file-certificate" },   // legacy crumb icon for a licence
    general: { kind: "fa", classes: "fa-light fa-gears" },   // legacy General screen/menu glyph (fal cogs)
    operations: { kind: "fa", classes: "fa-light fa-list-check" },   // legacy Operations screen/menu glyph
    // Was the filled Material-style LogoutIcon (still in icons.tsx, like the other spares). Swapped
    // to the fal outline so the user menu's two rows share one weight — a solid glyph beside a light
    // one reads as a mistake. Exactly the swap this registry exists to make cheap: one edit here.
    logout: { kind: "fa", classes: "fa-light fa-arrow-right-from-bracket" },

    // Roles with no hand-rolled SVG — served from the bundled FontAwesome Pro set instead. These
    // are the proof that a role is not tied to a source: give any of them an `svg` entry later and
    // no call site changes.
    print: { kind: "fa", classes: "fa-light fa-print" },
    exportFile: { kind: "fa", classes: "fa-light fa-file-export" },
    download: { kind: "fa", classes: "fa-light fa-download" },
    upload: { kind: "fa", classes: "fa-light fa-upload" },
    filter: { kind: "fa", classes: "fa-light fa-filter" },
    search: { kind: "fa", classes: "fa-light fa-magnifying-glass" },
    more: { kind: "fa", classes: "fa-light fa-ellipsis" },
    help: { kind: "fa", classes: "fa-light fa-circle-question" },
    theme: { kind: "fa", classes: "fa-light fa-palette" },
    lock: { kind: "fa", classes: "fa-solid fa-lock-keyhole" },   // legacy fas fa-lock-alt
    eye: { kind: "fa", classes: "fa-light fa-eye" },
    eyeSlash: { kind: "fa", classes: "fa-light fa-eye-slash" },
    calendar: { kind: "fa", classes: "fa-light fa-calendar" },
    chart: { kind: "fa", classes: "fa-light fa-chart-line" }
} as const satisfies Record<string, IconSource>;

type IconName = keyof typeof ICONS;

function getIconSource(name: IconName): IconSource {
    return ICONS[name];
}

function iconNames(): IconName[] {
    return Object.keys(ICONS) as IconName[];
}

export { IconSource, IconName, ICONS, getIconSource, iconNames };
