# Reference fixes

Bugs fixed in **ueca-react-app-demo2** whose code also lives in **ueca-react-doc**. The doc was ported on
2026-09-14 (branch `reference-fixes`, `9d3297b`..`9fc0abf`, one commit per entry plus a CLAUDE.md update;
not merged or pushed); each status names the commit, followed by what the entry said before the port, and
four statuses were corrected then (31, 32, 35 present; 51 not). Each entry records the symptom, the root
cause, the exact change and how it was verified in demo2, then the doc's status — checked against its
source when the entry was written.

| Project | Path | Tests |
| --- | --- | --- |
| ueca-react-app-demo2 | `E:\CraneSoft\ueca\ueca-react-app-demo2` | Vitest + Testing Library, component and whole-app (`npm test`) |
| ueca-react-doc | `E:\CraneSoft\ueca\ueca-react-doc` | none; the port was checked with throwaway Vitest runs against its `src`, not committed |

## Porting an entry

1. Open the file named under the project's status and confirm the **Before** code is still there.
   Line numbers are from when the entry was written.
2. Apply the **After** change. Keep CRLF line endings.
3. Verify: `npm run build`, the project's tests if it has them, and the symptom by hand in the running
   app where no test covers it.
4. Update the project's status line: ported, with the commit.

---

## 1. NumberField — a rejected keystroke opens an error dialog

**Severity:** high. Visible in demo2: Showcase › Controls number fields; Playground › Text field › Rows.

**Symptom.** Typing a character the number style does not allow — a letter in an int field — makes
UECA report *"did not settle after 10 binding rounds"*, which the app's error handler shows as an
exception dialog, once per rejected keystroke. After a rejected paste the box still shows the old
text, but leaving the field commits the pasted text: the box shows 12 and 123 is saved.

**Root cause.** The inner TextField's `value` is bound read-write to NumberField's `_text`, and the
character filter lived only in the child's `onChangingValue`. A read-write bond writes through
*before* the changing handler sees the value (ueca-react reactivity docs, "Re-convergence has a
budget"), so `_text` took the refused text while the child reverted, and the bond kept re-delivering
it until the retry budget ran out.

**Fix.** Refuse the text in the bond's setter as well, and keep the child's handler so the input
stays in step. Text the model writes itself — a formatted commit — never passes through the setter.

Before (`numberField.tsx`, in `children`):

```tsx
input: useTextField({
    value: UECA.bind(() => model, "_text"),
    // ...
    onChangingValue: (newText: string, oldText: string) =>
        CHAR_PATTERNS[model.numberStyle].test(newText) ? newText : oldText,
```

After:

```tsx
input: useTextField({
    // Refused in the bond's setter as well as by onChangingValue below. A read-write bond
    // writes through BEFORE the child's changing handler sees the text, so refusing it in
    // the child alone left `_text` holding what the box no longer showed: UECA reported a
    // binding that never settled (an exception dialog on every rejected keystroke), and
    // leaving the field committed the refused text.
    value: UECA.bind(() => model._text, (text) => {
        if (_allowsText(text)) {
            model._text = text;
        }
    }),
    // ...
    onChangingValue: (newText: string, oldText: string) => _allowsText(newText) ? newText : oldText,
```

and a private helper, placed just before `_commit`:

```tsx
// Whether typing may put `text` in the box: the style's characters, partial entries included.
function _allowsText(text: string): boolean {
    return CHAR_PATTERNS[model.numberStyle].test(text);
}
```

**Verified in demo2.** `src/components/inputs/numberField/numberField.test.tsx`:
"rejects a disallowed character without reporting a binding divergence" and "commits the text it
displays after rejecting a paste" (both were `it.fails`), plus "keeps accepting allowed text after
refusing a character". The test helper that discarded binding-divergence reports is gone, so any
future divergence fails the typing tests. With the fix reverted, 13 tests fail; with it, the full
suite passes.

**Status**

- **ueca-react-doc — not present.** It has no NumberField and no `onChangingValue` anywhere in `src`.

Checked against ueca-react-doc `5a900d4`.

**Same pattern elsewhere.** The bug is general: a read-write `UECA.bind(...)` handed to a child whose
`onChanging<Prop>` refuses values. The only other refusing handlers in demo2 and ueca-react-doc are
`Router.onChangingRoute` and `Notebook.onChangingActivePage`. AppLayout binds `route` read-write to
its Router, which is demo2's pinned bug "AppLayout holds on to a route its router refused"
(`src/core/appLayout/appLayout.test.tsx`) — a separate entry when it is fixed.

---

## 2. Form fields have no accessible name

**Severity:** medium (accessibility). Visible in demo2: every labelled text and number field, the
sign-in form included, and every radio group (Showcase › Controls › Units; Playground › Button ›
Variant, Content alignment).

**Symptom.** A screen reader announces a text or number field as "edit text" with no name, and a
radio option as "Inches, radio button, 3 of 3" without saying what is being chosen. Clicking a
field's label does not focus the field. Hint and error text are not announced with the field, a field
showing an error is not reported invalid, and a required field's asterisk is read out as "star".

**Root cause.** TextField's `<label>` is a sibling of its `<input>`/`<textarea>` with no
`htmlFor`/`id` pairing. RadioGroup's label is a plain `<div>`, and the container of its radios has no
`radiogroup` role. Neither links its helper or error text (`aria-describedby`) or marks the invalid
state (`aria-invalid`), and the required asterisk sits inside the label text without `aria-hidden`.

**Fix.** Ids follow the convention Select already had: derived from `model.htmlId()` with a suffix.

TextField — private helpers after `return model`:

```tsx
// Derived from the model's DOM id, like Select's: the label's htmlFor and the input's
// aria-describedby point at these.
function _inputId(): string {
    return `${model.htmlId()}-input`;
}

function _helperId(): string {
    return `${model.htmlId()}-helper`;
}
```

and in the View (`helperShown` is a new const beside `showError`: `showError || !!model.helperTextView`):

```tsx
<label htmlFor={_inputId()} className="textfield-label ueca-label">
    {model.required && <span className="textfield-required" aria-hidden="true">*</span>}
    {model.labelView}
</label>
// on both the <input> and the <textarea>:
id={_inputId()}
aria-required={model.required || undefined}
aria-invalid={showError || undefined}
aria-describedby={helperShown ? _helperId() : undefined}
// the helper text, now rendered on {helperShown && (...)}:
<div id={_helperId()} className={`textfield-helper-text${showError ? " textfield-helper-text-error" : ""}`}>
```

NumberField needs no change: its TextField child carries all of it.

RadioGroup — `_labelId()` (`-label`) and `_helperId()` (`-helper`) helpers, consts
`invalid = !model.isValid()` and `helperShown = invalid || !!model.helperTextView`, then:

```tsx
<div id={_labelId()} className="ueca-radio-group-label ueca-label">
    {model.labelView}
    {model.required && <span className="ueca-radio-group-required" aria-hidden="true"> *</span>}
</div>
<div
    className={`ueca-radio-group-options ueca-radio-group-options-${model.orientation}`}
    role="radiogroup"
    aria-labelledby={model.labelView ? _labelId() : undefined}
    aria-required={model.required || undefined}
    aria-invalid={invalid || undefined}
    aria-describedby={helperShown ? _helperId() : undefined}
>
// the helper text: <div id={_helperId()} ...>
```

Select — `aria-hidden="true"` on its asterisk. Its trigger already had `aria-labelledby`,
`aria-required` and `aria-invalid`.

**Verified in demo2.** The accessibility tests in `textField.test.tsx` (8), `radioGroup.test.tsx` (4),
`numberField.test.tsx` and `select.test.tsx`; five of them were `it.fails`. `appLoginForm.test.tsx`
and the integration harness now find the sign-in fields by their labels instead of by model id. With
the fix reverted, 30 tests fail; with it, the full suite passes.

**Status**

- **ueca-react-doc — ported in `9d3297b`.** Adapted: the native `required` kept, the trailing asterisks kept, and the native `<select>` paired with its label. Before: Checked against `5a900d4`. No tests;
  verify in the accessibility tree.
  - `inputs/textField/textField.tsx` (View, around lines 122–159): the label is a sibling with no
    `htmlFor`, its asterisk trails (`" *"`), and the input/textarea already carry the native
    `required` attribute — keep that instead of adding `aria-required`. Add the input/textarea `id`,
    the label's `htmlFor`, `aria-hidden` on the asterisk, `aria-invalid`, and `aria-describedby` with
    the helper's `id`.
  - `inputs/radioGroup/radioGroup.tsx` (around lines 78–118): the same structure as demo2's pre-fix
    file, label class `ueca-radio-group-label`. Apply demo2's change.
  - `inputs/select/select.tsx` (around lines 81–116): a native `<select>` whose `<label>` is a sibling
    with no `htmlFor`, so the select has no name at all. Add an `id` on the `<select>` (e.g.
    `${model.htmlId()}-select`) and `htmlFor` on the label, `aria-hidden` on the asterisk,
    `aria-invalid`, and `aria-describedby` with the helper's `id`; the native `required` stays.

---

## 3. A toast closes early when another follows within four seconds

**Severity:** medium. Visible in demo2: copy a listing in the Playground, close the toast with its ×,
copy again within four seconds — the second toast vanishes early.

**Symptom.** The second toast is closed by the first toast's timer, because AppAlertManager reuses
the alert id (`alert1`), and with it the cached toast model, for the next alert. Less visibly: every
toast adds two document listeners that are never removed (a snackbar removed while open still
answers Escape and clicks), a toast created open raises `onOpen` twice, and a Snackbar created with a
plain `open: true` never hides on its own.

**Root cause.** In `snackbar.tsx`:
- `onChangeOpen` started a four-second `setTimeout` on every opening and never cancelled it, so a
  timer outlived the opening it belonged to.
- `mount` added `keydown`/`mousedown` listeners as local closures, and there was no `unmount` to
  remove them.
- `init` raised `onOpen` for a snackbar created open, but a bound `open` had already arrived and
  raised it through `onChangeOpen` — and neither path started the timer for a plain `open: true`,
  which raises no change event.

**Fix.** One place owns each opening: private `_opened()` / `_closed()`, a timer kept in a private
`__hideTimer` that every opening restarts and every closing or unmount cancels, a private
`__openRaised` flag so an opening is announced once, and named handlers paired in `mount`/`unmount`.

In `snackbar.tsx` — a module constant, two private props, and the events/lifecycle:

```tsx
// How long a snackbar with the `timeout` close reason stays up.
const AUTO_HIDE_MS = 4000;

// props type, and their defaults (`__hideTimer: undefined`, `__openRaised: false`):
// The pending auto-hide of the current opening, so closing can cancel it.
__hideTimer: number;
// Whether onOpen has been raised for the current opening. A snackbar created open hears of
// that opening twice — from its bound `open` arriving and again from `init`.
__openRaised: boolean;

events: {
    onChangeOpen: () => {
        if (model.open) {
            _opened();
        } else {
            _closed();
        }
    }
},

// A snackbar created open never hears onChangeOpen for that first value, and one brought
// back open from the model cache had its auto-hide cancelled when it unmounted.
init: () => {
    if (model.open) {
        _opened();
    }
},

mount: () => {
    document.addEventListener("keydown", _handleKeyDown);
    document.addEventListener("mousedown", _handleClickAway);
},

unmount: () => {
    document.removeEventListener("keydown", _handleKeyDown);
    document.removeEventListener("mousedown", _handleClickAway);
    _cancelHide();
},
```

and private methods after `return model`, replacing the closures that lived in `mount`:

```tsx
function _opened() {
    if (!model.__openRaised) {
        model.__openRaised = true;
        asyncSafe(() => model.onOpen?.(model));
    }
    _scheduleHide();
}

function _closed() {
    _cancelHide();
    model.__openRaised = false;
    asyncSafe(() => model.onClose?.(model));
}

function _scheduleHide() {
    _cancelHide();
    if (model.open && model.closeReasons?.timeout) {
        model.__hideTimer = window.setTimeout(() => {
            model.__hideTimer = undefined;
            model.open = false;
        }, AUTO_HIDE_MS);
    }
}

function _cancelHide() {
    window.clearTimeout(model.__hideTimer);
    model.__hideTimer = undefined;
}

function _handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && model.open && model.closeReasons?.escapeKeyDown) {
        model.open = false;
    }
}

function _handleClickAway(e: MouseEvent) {
    if (!model.open || !model.closeReasons?.clickaway) {
        return;
    }
    const snackbarElement = document.getElementById(model.htmlId());
    if (snackbarElement && !snackbarElement.contains(e.target as Node)) {
        model.open = false;
    }
}
```

AlertToast and AppAlertManager need no change.

**Verified in demo2.** `snackbar.test.tsx`: "gives a reopened snackbar its full four seconds" and "stops
listening to the document once unmounted" (both were `it.fails`), plus "hides on time when it is
created open", "cancels a pending auto-hide when it unmounts" and "restarts its auto-hide when brought
back open from the model cache". `alertToast.test.tsx`: "raises onOpen once for a toast created open"
(was `it.fails`). `appAlertManager.test.tsx`: "gives an alert shown under a reused id its full four
seconds" — the Playground scenario end to end. With the fix reverted, exactly those 7 tests fail;
with it, the full suite passes.

**Status**

- **ueca-react-doc — ported in `d0a4e0b`.** Before: Checked against `5a900d4`: `alertToast.tsx` and
  `appAlertManager.tsx` are identical; `snackbar.tsx` differs only in writing two early returns on one
  line (`if (...) return;`), one of them inside the click-away closure that the fix replaces. Apply
  the same change. No tests; check by hand: raise a toast, close it with its ×, raise another within four
  seconds — it stays a full four seconds.

---

## 4. Deleting in the Overlays showcase's edit drawer asks twice

**Severity:** medium. Visible in demo2: Showcase › Overlays › Open edit drawer › Delete.

**Symptom.** One Delete shows two confirmation dialogs: the drawer's own "Are you sure want to
delete this item?" and then the page's "Delete the specimen?".

**Root cause.** EditDrawer asks before raising `onDelete` unless `deleteConfirmation` is off — its prop
comment says "Off only when the owner asks in its own way". The Overlays topic asks in its own way
(`onDelete` opens "Delete the specimen?", and a "No" keeps the drawer open) but left
`deleteConfirmation` at its default, `true`. The component is right; the page's configuration was not.

**Fix.** In `src/screens/showcase/topics/overlaysTopic.tsx`, in the `editDrawer: useEditDrawer({...})`
child, add before `onDelete`:

```tsx
// This topic asks its own question before deleting, so the drawer's built-in
// confirmation is off — with both, one Delete asked twice.
deleteConfirmation: false,
```

**Verified in demo2.** `overlaysTopic.test.tsx`: "asks for confirmation only once before deleting"
(was `it.fails`) now also checks the question asked is the page's own. The delete tests "closes after
the delete is confirmed" and "stays open when the topic's own delete question is answered no" no
longer stub the drawer's built-in confirmation, so they fail if it comes back. With the fix
reverted, those 3 tests fail; with it, the full suite passes.

**Status**

- **ueca-react-doc — not present.** Checked against `5a900d4`: it has no EditDrawer usage and no
  Overlays showcase.

---

## 5. Arrow keys do not scroll an open Select

**Severity:** medium. Visible in demo2: Playground › Button › the start and end icon lists, or any
Select with more options than its list shows.

**Symptom.** With the list open, arrowing (or PageDown/End, or type-ahead) past the visible rows moves
the highlight out of sight; the list never scrolls to follow it.

**Root cause.** `_scrollActiveIntoView()` ran only from Select's `draw` hook, and `draw` follows only
the main View's renders. The main View deliberately reads nothing that changes while the list is
open — that is what stopped the popover re-mounting and blinking on every hover — so a keyboard move
set `_scrollActive` and no draw ever came to act on it.

**Fix.** Scroll in `_setActive`, at the moment the keyboard moves the active row. The rows are already
on screen, and the `.active` class only changes their background, so nothing moves. `draw` still
covers the opening render, when the list is not on screen yet. Hover does not go through
`_setActive`, so the list never scrolls out from under the pointer.

In `select.tsx`:

```tsx
// The opening render: when _openMenu runs, the list is not on screen yet, so the flag it sets
// waits for this. Keyboard moves inside an open list scroll at once, in _setActive.
draw: () => {
    _scrollActiveIntoView();
},
```

```tsx
function _setActive(index: number) {
    if (index < 0) {
        return;
    }
    model._activeIndex = index;
    model._scrollActive = true;
    // Now, not on the next draw. `draw` follows only the main View, which deliberately does not
    // re-render while the list is open, so a move left for it never scrolled: arrowing past the
    // visible rows left the active row out of sight. The rows are already on screen, and moving
    // the active class does not move them.
    _scrollActiveIntoView();
}
```

**Verified in demo2.** `select.test.tsx`, "scrolling the active row into view": "scrolls the active row
into view as the keyboard moves it" (was `it.fails`), "scrolls back up when the keyboard moves above
the visible rows", "follows a type-ahead jump in the open list", and "does not scroll when the pointer
moves the active row". With the fix reverted, the three keyboard tests fail; with it, the full suite
passes.

**Status**

- **ueca-react-doc — not present.** Checked against `5a900d4`: its Select is a native `<select>`,
  whose list the browser scrolls itself.

---

## 6. Menu links have no name when the sidebar is collapsed

**Severity:** medium (accessibility). Visible in demo2: collapse the sidebar — every menu link, and
the rail's other icon-only items, are announced as just "link".

**Symptom.** An icon-only NavItem's link has no accessible name: its only content is an aria-hidden
glyph. NavItem's own comment says keyboard users "get the aria-label" on the link, but nothing set one.

**Root cause.** NavLink renders its anchor without `title` or `aria-label`, on the reasoning that its
content names it ("the accessible name already comes from the content"). That holds for a visible
label, not for NavItem's icon-only mode, where the label is not rendered.

**Fix.** A new NavLink prop, `ariaLabel`, rendered on the anchor, and NavItem sets it only while the
label is hidden — in every other mode the visible label names the link, and an aria-label would only
duplicate it.

In `navLink.tsx` — the prop in the props type (after `linkView`), its default, and the anchor:

```tsx
// The link's accessible name when its content carries none — an icon-only link, whose glyph
// is aria-hidden. Leave it unset whenever the content already names the link.
ariaLabel: string;

ariaLabel: undefined,          // default, after linkView: undefined

aria-label={model.ariaLabel}   // on the <a>, after rel={...}
```

In `navItem.tsx`, in the `navLink: useNavLink({...})` child, after `linkView`:

```tsx
// With the label hidden, the link's only content is an aria-hidden glyph, so it would
// have no accessible name at all. The visible label names it in every other mode.
ariaLabel: () => model.mode === "icon-only" ? model.text : undefined,
```

**Verified in demo2.** `navItem.test.tsx`: "gives an icon-only item's link its text as the accessible
name" (was `it.fails`) and "labels the link only while the label is hidden, following mode and
text"; `navLink.test.tsx`: "takes its accessible name from ariaLabel when given one, and from its
content otherwise". With the fix reverted, those 3 tests fail; with it, the full suite passes.

**Found while making it:** Sign out and menu group headings cannot be reached from the keyboard at
all — fixed separately, as entry 7.

**Status**

- **ueca-react-doc — not present.** Checked against `5a900d4`: its `navLink.tsx` still renders
  `aria-label={model.title}` on every anchor, and NavItem binds its `text` to that `title`, so an
  icon-only item is named. (That attribute is what demo2 removed.)

---

## 7. The keyboard cannot sign out or open a menu group

**Severity:** medium (accessibility — a keyboard-only user cannot complete these at all). Visible in
demo2: Tab through the sidebar — Sign out and the Showcase and Playground group headings are skipped,
in both sidebar states.

**Symptom.** Sign out is never focused, and neither is a menu group's heading, so a keyboard user can
neither sign out nor expand a collapsed group to reach its pages.

**Root cause.**
- Sign out is a NavItem without a route. Its NavLink then renders an `<a>` with no `href`, which is
  neither focusable nor a link, so no key reaches it (and an aria-label on it is ignored).
- NavItemExpandable's heading is a `Block` with an `onClick` and nothing else: no role, no tab stop, no
  key handling, no expanded state. And Block — like Row, Col and Grid — could not carry `aria-*`
  attributes at all, only `role`.

**Fix.**

1. Layout primitives pass `aria-*` through. In `layoutShared.ts`, `BlockProps` gains
   `& React.AriaAttributes` (after its closing `}`), plus a helper, exported beside the others:

   ```tsx
   // The aria-* attributes among a primitive's props, to spread onto its element. Picked out by name,
   // so no other prop ever reaches the DOM.
   function ariaAttributes(props?: React.AriaAttributes): React.AriaAttributes {
       const aria: Record<string, unknown> = {};
       for (const key in props) {
           if (key.startsWith("aria-")) {
               aria[key] = props[key as keyof React.AriaAttributes];
           }
       }
       return aria;
   }
   ```

   `block.tsx`, `row.tsx`, `col.tsx` and `grid.tsx` import `ariaAttributes` and spread
   `{...ariaAttributes(props)}` on their `<div>`, right after `role={props?.role}`. GridCell and Card
   pass their props through to Block and Col, so they need nothing.

2. NavLink — a route-less link is a button. On the `<a>`, after `href`, and a private handler:

   ```tsx
   // A link without a route is an action (Sign out). An <a> with no href is neither focusable
   // nor a link, so the keyboard could not reach it at all: it is a button with a tab stop
   // instead, pressed by Enter and Space.
   role={model.route ? undefined : "button"}
   tabIndex={model.route ? undefined : 0}
   // ...and after onClick:
   onKeyDown={model.route ? undefined : _onActionKeyDown}
   ```

   ```tsx
   // A link with an href needs none of this: the browser turns Enter on it into the click above.
   function _onActionKeyDown(e: React.KeyboardEvent) {
       if (e.key !== "Enter" && e.key !== " ") {
           return;
       }
       // Space would otherwise scroll the page.
       e.preventDefault();
       asyncSafe(async () => await model.click());
   }
   ```

3. NavItemExpandable — the heading is a disclosure button. On the heading `Block` in
   `_ParentItemView`, beside `cursor="pointer"` and `onClick`:

   ```tsx
   role="button"
   tabIndex={0}
   aria-expanded={model.expanded}
   // With the label hidden, only an aria-hidden glyph is left to name the group.
   aria-label={model.mode === "icon-only" ? model.text : undefined}
   onKeyDown={_onHeaderKeyDown}
   ```

   and after `return model`:

   ```tsx
   // Private methods
   function _onHeaderKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
       if (e.key !== "Enter" && e.key !== " ") {
           return;
       }
       // Space would otherwise scroll the menu.
       e.preventDefault();
       model.expanded = !model.expanded;
   }
   ```

Nothing moves on screen: the elements keep their tags, `role`/`tabIndex` do not affect layout, and
the app's `:focus-visible` rings appear only for keyboard focus.

**Verified in demo2.** `layoutShared.test.tsx`: "picks out the aria-* props and nothing else" and
"… puts aria-* attributes on its element" for Block, Row, Col, Grid, GridCell and Card.
`navLink.test.tsx`: "make a link without a route a focusable button that Enter and Space press" and
"leave a link with a route a plain link…". `navItemExpandable.test.tsx`: "is a button the keyboard can
reach and press, reporting whether it is expanded" and "names its button after its text only while
the label is hidden". `appSideBar.test.tsx`: "signs out from the keyboard, expanded and collapsed".
Reverting the key handling fails 4 of those; reverting the attribute forwarding fails the 6
primitive tests and both heading tests. The full suite passes.

**Status**

- **ueca-react-doc — ported in `fbc1184`.** The primitives (`role`, `tabIndex`, `onKeyDown` and `aria-*` on Block, Row and Col) and part 3. Part 2 was not applied: its NavLink still renders an href, and no route-less link is used. Before: Checked against `5a900d4`.
  - Its docs menu uses a NavItemExpandable group (`appMenu.tsx`, `useGroupMenuItem`), so the heading
    bug is live there. Its `navItemExpandable.tsx` heading is the same `Block` (`onClick` at line 48).
  - Its layout primitives are one file, `components/layout/layout.tsx`, and its `Block` forwards only
    `id`, `key`, `ref`, `className`, `style`, `onClick`, `onMouseEnter` and `onMouseLeave` — not
    `role`, `tabIndex` or `onKeyDown` either. Add those three to its `BlockProps` and `<div>` as well as
    the `aria-*` pass-through, then apply part 3.
  - Its NavLink renders `href={(model.route?.path.startsWith("/") ? "#" : "") + model.route?.path}`,
    so a route-less link would get `href="undefined"`: reachable, but announced as a link. No
    route-less NavLink is used there today; part 2 applies if one is added.

---

## 8. Dialogs are not announced as dialogs, and focus stays behind them

**Severity:** medium (accessibility). Visible in demo2: every dialog — confirmations, errors, the
Overlays showcase's dialogs.

**Symptom.** A screen reader is never told a modal is up: the panel has no dialog role, is not modal
and has no name. Focus stays on whatever opened the dialog, behind the backdrop, so a keyboard user
has to Tab through the page to reach it, and nothing puts focus back when it closes.

**Root cause.** Dialog's panel is a plain `<div>`. Adding `aria-modal` alone would be worse than
nothing: it tells a screen reader to stay inside the dialog while focus sits outside it, so the
semantics and the focus handling have to arrive together.

**Fix.** In `dialog.tsx`:
- The panel gets `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the title
  *text* (`<div id={_titleId()}>{model.titleView}</div>` — not the title row, which holds the ×), and
  `tabIndex={-1}`, so code can focus it but Tab never stops on it.
- Opening (in `onChangeOpen` and in `constr` for a dialog created open) remembers
  `document.activeElement` and marks focus pending; `draw` then focuses the panel — once it is on
  screen and not suspended by `hidden`.
- Closing, or unmounting while open, gives focus back to the remembered element — only when focus is
  still the dialog's to give (inside the panel, or dropped to `<body>` because the panel went away),
  and only if that element is still in the document.

Two private props (props type and defaults `undefined`/`false`):

```tsx
// Where focus was when the dialog opened — the trigger, as a rule — to give back on close.
__returnFocus: HTMLElement;
// Set on opening, cleared by the first draw that can put focus into the panel.
__focusPending: boolean;
```

Hooks — `_focusOnDraw()` beside `_takeStackBand()` in both `onChangeOpen` (open branch) and `constr`,
`_returnFocus()` after `_releaseStackBand()` in the close branch, and:

```tsx
// A dialog torn down while still open would otherwise hold its band for the session, and
// leave focus on the page it no longer covers.
unmount: () => {
    _releaseStackBand();
    if (model.open) {
        _returnFocus();
    }
},

// Focus moves into the panel once it is on screen. aria-modal tells a screen reader to stay
// inside the dialog, so focus left on the trigger behind the backdrop would sit somewhere it
// has just been told to ignore. Not while the dialog is suspended by `hidden`.
draw: () => {
    if (!model.__focusPending || !model.open || model.hidden) {
        return;
    }
    const panel = document.getElementById(model.htmlId());
    if (panel) {
        model.__focusPending = false;
        panel.focus();
    }
},
```

The panel's attributes, and private methods after `_close`:

```tsx
// Without these, assistive technology could not tell a modal was up at all.
// Named by the title text alone, not the title row, which holds the ×.
role="dialog"
aria-modal="true"
aria-labelledby={model.titleView ? _titleId() : undefined}
// Focusable from code only, for draw to move focus into; never a Tab stop.
tabIndex={-1}
```

```tsx
function _titleId(): string {
    return `${model.htmlId()}-title`;
}

function _focusOnDraw() {
    model.__returnFocus = document.activeElement as HTMLElement;
    model.__focusPending = true;
}

// Only while focus is still the dialog's to give back: inside the panel, or dropped to the page
// because the panel went away. Focus the user has moved elsewhere stays where they put it.
function _returnFocus() {
    const target = model.__returnFocus;
    model.__returnFocus = undefined;
    model.__focusPending = false;
    const active = document.activeElement;
    const panel = document.getElementById(model.htmlId());
    const focusIsOurs = !active || active === document.body || !!panel?.contains(active);
    if (focusIsOurs && target?.isConnected && target !== document.body) {
        target.focus();
    }
}
```

In `dialog.css`, after the `.ueca-dialog { ... }` block:

```css
/* The panel takes focus from code when the dialog opens, so assistive technology starts inside it.
   It is a container, not a control, so it draws no ring — the dialog itself is what shows. */
.ueca-dialog:focus-visible {
    outline: none;
}
```

**Verified in demo2.** `dialog.test.tsx`, "accessibility": named modal dialog outside the tab order
(was `it.fails`), no name without a title, focus in on open and back on close, focus taken when
created open, focus given back when removed while open, focus left where the user moved it, and no
focus taken while `hidden`. With the fix reverted, 6 fail (the "left where the user moved it" guard
passes either way); with it, the full suite passes.

**Same gap in Drawer** — fixed as entry 9, which also adds to Dialog: when it is shown again after
being `hidden`, it takes focus back.

**Status**

- **ueca-react-doc — ported in `9c37ae8`.** Without the `hidden` condition, as it has no `hidden`. Before: Checked against `5a900d4`: its `dialog.tsx` has no
  `hidden` prop, no stacking band and no `unmount` hook. Add the panel attributes and `_titleId()`
  (title `<div>` at line 71), `_focusOnDraw()` in its `onChangeOpen` open branch and `constr`,
  `_returnFocus()` in the close branch, an `unmount` that calls `_returnFocus()` while open, and the
  `draw` hook without the `hidden` condition. Add the CSS rule after its `.ueca-dialog` block (line 25).

---

## 9. Modal drawers are not announced, and focus stays behind them

**Severity:** medium (accessibility). Visible in demo2: Showcase › Overlays › Open edit drawer, and an
error dialog's Show details panel.

**Symptom.** A `temporary` Drawer — the modal kind, over a backdrop, which EditDrawer and AlertDrawer
use — has the same gaps entry 8 fixed for Dialog: no dialog role, not modal, no name, and focus left on
the page behind it. In AlertDialog's details flow there is a second step: the dialog is `display:none`
while its details panel is up, and a browser will not focus an element inside a hidden subtree, so
focus given back to "Show details" when the panel closes lands nowhere.

**Fix.**

1. Drawer (`drawer.tsx`) — the Dialog pattern of entry 8, for the `temporary` variant only; permanent
   and persistent drawers sit beside the page and claim nothing:
   - the same two private props (`__returnFocus`, `__focusPending`);
   - `_focusOnDraw()` in `onChangeOpen` (open) and `constr`, `_returnFocus()` in the close branch and in
     `unmount` while open;
   - a `draw` hook that focuses the panel unless focus is already inside it;
   - on the panel `<div>`: `role={_isModal() ? "dialog" : undefined}`,
     `aria-modal={_isModal() ? "true" : undefined}`,
     `aria-labelledby={_isModal() && model.titleView ? _titleId() : undefined}`,
     `tabIndex={_isModal() ? -1 : undefined}`; and `id={_titleId()}` on the title's `<div>`.

   Private methods:

   ```tsx
   function _isModal(): boolean {
       return model.variant === "temporary";
   }

   function _titleId(): string {
       return `${model.htmlId()}-title`;
   }

   function _focusOnDraw() {
       if (!_isModal()) {
           return;
       }
       model.__returnFocus = document.activeElement as HTMLElement;
       model.__focusPending = true;
   }
   ```

   `_returnFocus()` is Dialog's, word for word. The `draw` hook:

   ```tsx
   // A modal drawer takes focus once its panel is on screen, as Dialog does: aria-modal tells a
   // screen reader to stay inside it, so focus must not be left on the page behind the backdrop.
   draw: () => {
       if (!model.__focusPending || !model.open || !_isModal()) {
           return;
       }
       const panel = document.getElementById(model.htmlId());
       if (panel) {
           model.__focusPending = false;
           if (!panel.contains(document.activeElement)) {
               panel.focus();
           }
       }
   },
   ```

   In `drawer.css`, after the `.ueca-drawer { ... }` block:

   ```css
   /* A modal drawer's panel takes focus from code when it opens, so assistive technology starts inside
      it. It is a container, not a control, so it draws no ring — the panel itself is what shows. */
   .ueca-drawer:focus-visible {
       outline: none;
   }
   ```

2. Dialog (`dialog.tsx`, on top of entry 8) — shown again, it takes focus back:

   ```tsx
   // in events, after onChangeOpen:
   // Shown again after something it opened covered it — AlertDialog's details drawer. A
   // browser will not focus an element inside a hidden subtree, so the drawer's attempt to
   // give focus back to "Show details" lands nowhere; the next draw brings it back inside.
   onChangeHidden: () => {
       if (model.open && !model.hidden) {
           model.__focusPending = true;
       }
   }
   ```

   and in its `draw`, focus the panel only if focus is not already inside it:

   ```tsx
   model.__focusPending = false;
   // Focus already inside — a control that took it, or one it was given back to — stays.
   if (!panel.contains(document.activeElement)) {
       panel.focus();
   }
   ```

**Verified in demo2.** `drawer.test.tsx`, "accessibility": a temporary drawer is a named modal dialog
outside the tab order, permanent and persistent drawers claim nothing, focus in and back, a
persistent drawer takes no focus, focus given back when removed while open. `dialog.test.tsx`: "takes
focus back when shown again after losing it while hidden" and "leaves focus on a control inside it
when shown again". `alertDialog.test.tsx`: "moves focus into the details panel, and back inside the
dialog when that is cancelled". With the fix reverted, 5 fail (the rest guard what must not change);
with it, the full suite passes.

**Status**

- **ueca-react-doc — ported in `605fd69`.** Part 1; part 2 does not apply. Before: Checked against `5a900d4`: its `drawer.tsx`
  has no `unmount` hook and no stacking band — add an `unmount` that calls `_returnFocus()` while open,
  then the rest of part 1 (title `<div>` at line 76; CSS rule after the `.ueca-drawer` block starting
  at line 23). Its ScreenLayout still opens an AlertDrawer, so the bug is live there. Part 2 does not
  apply: its AlertDialog does not hide itself while the details are up, and its Dialog has no `hidden`.

---

## 10. An address that only ends like a screen's path opens that screen

**Severity:** low. Visible in demo2: open `/ueca-react-app-demo2/retired/showcase/controls` — Controls
opens instead of Home — or `/ueca-react-app-demo2/showcase/controls?from=/home`, which opens Home.

**Symptom.** A route answers for any path that merely ends like it. An address with extra segments in
front opens the screen its tail names instead of falling back to Home. An address whose query value
ends in a path opens the screen that value names, and startup then rewrites the address to match.
Among nested routes, a shorter one listed first answers for a longer path (`/users/:id` for
`/org/7/users/u2`), and an app-relative route answers for an origin-root `//` path.

**Root cause.** `_prepareRegExRoutes` in `router.tsx` ends every pattern with `(?:\?|$)` but never
starts one with `^`, and `lookupRoute` takes the first route whose pattern is found anywhere in the
path.

**Fix.** Anchor each pattern at the start.

Before (`router.tsx`, `_prepareRegExRoutes`):

```tsx
const routeUrl = new AppURL(url);
let regEx = routeUrl.host === "_" ? "" : (routeUrl.protocol + "\\/\\/" + routeUrl.host);
```

After:

```tsx
const routeUrl = new AppURL(url);
// "^": a route names the whole path, not its tail. Unanchored, "/home" also answered
// "/retired/home" and "/showcase/controls?from=/home", and an app-relative route answered
// the tagged form of an origin-root path.
let regEx = "^" + (routeUrl.host === "_" ? "" : (routeUrl.protocol + "\\/\\/" + routeUrl.host));
```

Nothing relies on tail matching. Every caller hands `lookupRoute` a route key, or the address with the
base already stripped (`AppBrowsingHistory`: `pathname.substring(__baseURL.length)` plus the search),
and both start where the pattern does. Neither demo2 nor ueca-react-doc redirects deep links through a
query string, which is the one setup that would have leaned on it.

**Verified in demo2.** `router.test.tsx`: "matches a route from the start of the path, not a shorter
route its tail resembles" (now also a query value ending in a path) and "never answers an origin-root
path with an app-relative route listed before it". `appLayout.test.tsx`: "does not claim an external
address, even one ending in a slash" and "does not claim a path that merely ends with a screen path".
All four were `it.fails`. `integration/routing.test.tsx`: "falls back to Home for an address that only
ends like a screen's path" and "opens the screen its path names, whatever path a query value ends in".
With the fix reverted, those 6 fail; with it, the full suite passes.

**Not part of this fix.** A registered origin-only address (`https://cranesoft.net`) or `mailto:` route
is still not found by `lookupRoute`: the pattern is built from the parsed URL, which gives the one a
trailing slash and drops the other's address. Still pinned in demo2; it only affects a `GoToRoute` to
such an address, which none of the projects sends.

**Status**

- **ueca-react-doc — ported in `830800f`.** Before: Checked against `5a900d4`: its `router.tsx` differs in
  comments, null guards and typing, but builds the pattern with the same line (129). Apply the same
  change. Every `GoToRoute` it sends (`homeHero`, `docsPager`, `markdownPreview`'s `resolveDocPath`)
  is a route key starting with `/`. No tests; check by hand in dev: `/ueca-react-doc/old/docs/tracing`
  opens Home, and `/ueca-react-doc/docs/tracing?from=/home` opens Tracing.

---

## 11. A vetoed Back rolls the browser back to the wrong entry

**Severity:** medium in an app whose screens veto navigation, where it can reload the page over unsaved
edits; low in demo2, where no shipped screen vetoes navigation. Visible in demo2: open the app in a fresh tab, move to another
page and press Back — the console logs "Unexpected condition: AppBrowsingHistory._browserNavigation()".

**Symptom.** AppBrowsingHistory stamps each history entry with an index. When a screen vetoes a Back or
Forward — CRUDScreen's "All unsaved changes will be lost!" answered No, or any navigation while a
record loads or saves — it rolls the browser back by the difference between the two entries' indexes.
Two of the indexes were wrong, so the rollback travelled the wrong distance:

- In a fresh tab, the entry the app opened on and the page opened next got the same index. A vetoed
  Back between them had no distance to travel: demo2 rewrote the first entry with the current address,
  and ueca-react-doc calls `history.go(0)`, which reloads the page and throws away the
  edits the veto was protecting. Every Back and Forward between the two also logged the warning above.
- Opened after other pages in the same tab, a vetoed Back to that first entry overshot. The browser
  ignores an out-of-range `history.go`, so the address stayed on the page the user tried to go back to
  while the vetoing screen stayed on show.
- After a Back followed by opening another page, the new entry's index was one too high, so a vetoed
  Back from it overshot the same way.
- Once the browser's history is full (50 entries in Chrome), every new entry got the same index.

**Root cause.** In `appBrowsingHistory.ts`:

1. `syncWithBrowser` stamps an entry that carries no index with a fixed `1`, while pushed entries are
   indexed by position, so the two disagree unless the app is the tab's second entry.
2. `_navigate` indexes a pushed entry with the history length before the push and re-stamps it only
   when `history.length - index === 1` — the normal case, where the guess was already right. After a
   Back the push drops the entries ahead, the guess is too high, and the re-stamp is skipped. At the
   history cap the length stops growing, so every push guesses the same index.

**Fix.**

Before (`syncWithBrowser`):

```tsx
// Set initial history index (the top of the list)
model.__currentHistoryIndex = window.history.state?.index ?? 1;
```

After:

```tsx
// A reload keeps the index its entry was given. Otherwise the page has just been
// opened as the newest entry, so its index is its position: history.length - 1. A
// fixed 1 was right only for a tab's second entry; anywhere else a vetoed Back to
// this entry rolled forward by the wrong distance.
model.__currentHistoryIndex = window.history.state?.index ?? history.length - 1;
```

Before (`_navigate`):

```tsx
model.__currentHistoryIndex = history.length;
history.pushState({ index: model.__currentHistoryIndex }, "", newURL);
if (history.length - model.__currentHistoryIndex === 1) {
    // History was truncated or abnormally changes by the browser. Synchronize the state.
    model.__currentHistoryIndex = history.length - 1;
    history.replaceState({ index: model.__currentHistoryIndex }, "", newURL);
}
_syncCurrentPath();
```

After:

```tsx
// The new entry comes straight after the one the browser is on, so its index is one more.
// Counting from history.length instead broke whenever the push dropped entries: the ones
// ahead of the current entry after a Back, or the oldest once the browser's history is full.
model.__currentHistoryIndex = (history.state?.index ?? model.__currentHistoryIndex) + 1;
history.pushState({ index: model.__currentHistoryIndex }, "", newURL);
_syncCurrentPath();
```

Why not only flip `=== 1` to `!== 1`: that fixes the Back-then-open case, but at the history cap it
re-stamps every new entry with `length - 1`, the index the entry before it already holds. Counting on
from the current entry keeps neighbours one apart there too. `history.state` is read rather than the
model's index because it is the entry the browser is actually on; during Back/Forward handling the
model still names the entry being left.

**Verified in demo2.** `appBrowsingHistory.test.tsx`, "history index": "stamps the entry it starts on
with its position when that entry carries no index" (it used to accept any number), "rolls a vetoed
Back to the entry the app started on forward by exactly one" and "rolls a vetoed Back forward by
exactly one after a page reached with Back was left" (both were `it.fails`), and the new "rolls a
vetoed Back forward by exactly one once the browser's history is full". `integration/history.test.tsx`:
"a Back that a guard vetoes returns the address to the screen still on show" (was `it.fails`). With
the fix reverted, those 5 fail; with only the condition flipped, the full-history test fails; with the
fix, the full suite passes.

**Status**

- **ueca-react-doc — ported in `e679409`.** The index fix and the in-place rollback went in together. Before: Checked against `5a900d4`: `appBrowsingHistory.ts`
  has the same `?? 1` (line 57) and `_navigate` block (lines 291–297); apply the change. None of its
  screens loads or edits data through CRUDScreen, so nothing vetoes, and what shows is the warning on
  Back and Forward between a fresh tab's first two pages. It lacks the in-place rollback too
  (lines 220–221); bring it over too, for the day a screen does veto. No tests; check by
  hand in a fresh tab: open Home, open an article, press Back — nothing is logged.

---

## 12. Inputs keep showing old text or state once their value is unset

**Severity:** medium in an app whose fields, checkboxes and switches are bound to records that start
empty and come back from the server with nulls; low in demo2, where no value is unset again. Visible
in demo2 only as a console warning: type into Showcase › Controls › "Operator", or the adornments'
"Username" field, neither of which has a value — React logs "A component is changing an uncontrolled
input to be controlled".

**Symptom.** A TextField whose value is unset (undefined or null), and a Checkbox or Switch whose
`checked` is, renders as an uncontrolled React input. React warns once a keystroke or a loaded record
gives it a value, and when the value is unset again the control keeps what it last showed: text typed
into a field whose record then reloads with that field empty, or a box left ticked. The screen then
disagrees with the model, and a save sends the model's value, not the one on show.

**Root cause.** `textField.tsx` renders `value={model.value?.toString()}` on both the `<textarea>` and
the `<input>`, and `checkbox.tsx` and `switch.tsx` render `checked={model.checked}`. React decides
controlled or uncontrolled by whether that prop is null, and never writes an uncontrolled input's DOM
value. SearchField already rendered `value={model.value ?? ""}`.

**Fix.** In `textField.tsx`, on the `<textarea>`:

```tsx
// Never undefined: value={undefined} makes React treat the field as
// uncontrolled, and an uncontrolled field keeps the text it last
// showed when its value is unset again (a reloaded record, a null).
value={model.value?.toString() ?? ""}
```

and on the `<input>`:

```tsx
// Never undefined, for the same reason as the textarea's.
value={model.value?.toString() ?? ""}
```

In `checkbox.tsx`:

```tsx
// Always a boolean: checked={undefined} makes React treat the box as
// uncontrolled, and it would keep the state it last showed while the
// value is unset (a record field not loaded yet, or sent as null).
checked={!!model.checked}
```

In `switch.tsx`:

```tsx
// Always a boolean, as a switch is always on or off: checked={undefined}
// makes React treat it as uncontrolled, and it would keep the state it
// last showed while the value is unset.
checked={!!model.checked}
```

**Verified in demo2.** `textField.test.tsx`: "empties the box when its value is unset again" for
undefined, null, and undefined in a multiline field (it was one `it.fails`, for undefined).
`checkbox.test.tsx`: "shows a checked value that becomes undefined/null as unchecked";
`switch.test.tsx`: the same "as off". With the fix reverted, those 7 fail; with it, the full suite
passes. React's warnings are not asserted: React logs each once per page, so an earlier test in the
file would hide them.

**Status**

- **ueca-react-doc — ported in `b609253`.** Before: Checked against `5a900d4`: `textField.tsx` lines 131 and 144
  and `checkbox.tsx` line 70 render the same; it has no Switch. No screen uses TextField or Checkbox,
  so nothing shows it; apply the change to keep the components right.

---

## 13. An API error with an empty body resolves as a success

**Severity:** high in an app whose API calls go through this client: a failure the server reports
without a body passes silently — a save it rejected looks saved. Latent in demo2 and
ueca-react-doc, where nothing creates the client.

**Symptom.** An error response with nothing to read resolves `undefined` instead of rejecting:

- a 4xx or 5xx declared `content-length: 0`, which is what a server sends for an unhandled exception it
  has no error page for, or for a route it does not have;
- an error whose body was already read and that has no status text, which HTTP/2 responses never
  carry.

A save then resolves as if it had succeeded and no error dialog appears; a load resolves with no data,
and the screen fails later on `undefined`.

**Root cause.** `_processResponse` returns the parsed body of a success. For anything else it throws
only when there is a body to read (`!bodyUsed` and content-length not 0) or a status text (`bodyUsed`
and `statusText`), and nothing follows those checks. An error that matches neither falls out of the
method, and the promise resolves `undefined` — the same result as the deliberate "success with an
empty body".

**Fix.** At the end of `_processResponse`, after the `if (!response.bodyUsed) { ... } else { ... }`
block:

```ts
// An error with nothing to read is still an error: a body declared empty (a server's bare
// 500), or one already read with no status text (HTTP/2 sends none). Falling out of the
// checks above resolved it as undefined, and the caller carried on as if it had succeeded.
if (!response.ok) {
    const status = `${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;
    throw new DetailedError(response.statusText || `HTTP ${response.status}`, `The server responded with ${status}.`);
}
```

A success with an empty body still resolves `undefined`.

**Verified in demo2.** `restApiClient.test.ts`, "errors": "rejects a 500 whose body is declared empty"
and the same for a 404 (it was one `it.fails`, for the 500), "reports an empty 401 to
onUnauthorizedResponse and still rejects", and "rejects an error whose body has been read and that has
no status text, naming the status". With the fix reverted, those 4 fail; with it, the full suite
passes, including "resolves undefined for a body declared empty, whatever its content type".

**Status**

- **ueca-react-doc — ported in `0392b4e`.** Before: Checked against `5a900d4`: `src/api/restApiClient.ts` is
  identical to demo2's pre-fix file, but nothing creates the client. Apply the same change.

---

## 14. A stored password stays revealed after focus leaves the field from the eye

**Severity:** medium (a secret left on screen) wherever a stored secret uses SecuredPasswordField.
Latent in demo2, where no screen uses it.

**Symptom.** SecuredPasswordField promises that an unfocused field can never reveal what it holds, and
that blurring re-hides it. But reveal a secret with the eye — click it, or Tab to it and press Enter —
then click anywhere else or Tab on, and the secret stays in plain text with the eye still enabled.
Underneath, TextField's `_focused` stays true and `onBlur` never fires, for any field left from a
focusable adornment; and Shift+Tab from the eye back to the input raises `onFocus` a second time.

**Root cause.** TextField's `_handleFocus` and `_handleBlur` sit on the `<input>` and `<textarea>`.
`_handleBlur` deliberately ignores focus moving to the eye, which is inside the same frame, so the
field stays focused while the eye has focus — but the eye has no handler of its own, so when focus
then leaves the field from the eye, nothing runs.

**Fix.** Track focus on the frame, where React's `onFocus`/`onBlur` bubble from every control in it,
and ignore focus passing between controls inside it.

In `textField.tsx`, on each `<div className="textfield-frame">` (the textarea's and the input's), add
the two handlers, and remove `onFocus={_handleFocus}` and `onBlur={_handleBlur}` from the `<textarea>`
and the `<input>`:

```tsx
// Focus is tracked on the frame, not on the input: see _handleBlur.
<div className="textfield-frame" onFocus={_handleFocus} onBlur={_handleBlur}>
```

(The comment goes on the first frame only.) Then replace `_handleFocus` and `_handleBlur`:

```tsx
function _handleFocus(e: React.FocusEvent<HTMLDivElement>) {
    if (_movesWithinField(e)) {
        return;
    }

    model._focused = true;
    if (model.onFocus) {
        model.onFocus(model);
    }
}

// `_focused` means "the FIELD has focus", not "the input element has focus". The difference is
// load-bearing: useSecuredPasswordField gates its reveal button on it, and the button is a
// sibling of the input inside the same frame — so moving focus toward the eye (by Tab or by
// mousedown) must not blur the field, or the button is disabled mid-transit and focus drops to
// <body>. Both handlers sit on the frame, where React's focus events bubble from every control
// in it: with them on the input alone, focus that left the field FROM the eye never blurred it,
// and a secured field went on showing its secret, unfocused.
function _handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (_movesWithinField(e)) {
        return;
    }

    model._focused = false;
    if (model.onBlur) {
        model.onBlur(model);
    }
}

// Focus passing between the input and an adornment inside the same frame.
function _movesWithinField(e: React.FocusEvent<HTMLDivElement>): boolean {
    return e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget);
}
```

A side effect worth knowing: NumberField commits on its inner field's blur and keeps its spin buttons
in that frame, so it now also commits when focus leaves from a spin button.

**Verified in demo2.** `textField.test.tsx`: "clears _focused and raises onBlur when focus leaves the
field from the reveal button" and SecuredPasswordField's "re-hides the password and disables the eye
when focus leaves from the eye" (both were `it.fails`), plus the new "raises onFocus once while focus
moves between the input and the reveal button" and "re-hides the password when the user clicks away
after revealing it with the eye". With the fix reverted, those 4 fail; with it, the full suite passes,
NumberField's commit-on-blur tests included.

**Status**

- **ueca-react-doc — not present.** Checked against `5a900d4`: its older TextField has no
  SecuredPasswordField, and its `_handleBlur` takes no event, so moving to the eye already blurs the
  field.

---

## 15. Space after a pause in type-ahead closes a Select without choosing

**Severity:** low (keyboard; Enter still works). Visible in demo2: Showcase › Controls › Interval —
open it, type `d`, wait a second, press Space. The list closes and the value stays Hourly.

**Symptom.** In an open Select, typing a letter moves the highlight to a matching option, and Space
should then choose it, as it does when nothing was typed. After a pause it does not: the list closes
and nothing is chosen.

**Root cause.** The key handler lets Space choose only while the type-ahead buffer is empty, so that
Space can be part of a word ("New Zealand"). But the buffer is cleared only when the list opens or
closes; the 700 ms reset only restarts it on the next typed key. After a pause the stale buffer still
sends Space to type-ahead, where it starts a new word " " that matches nothing, and the key falls
through to the button, whose native click toggles the list shut.

**Fix.** In `select.tsx`, add `TYPE_AHEAD_RESET_MS` to the `./selectNavigation` import, and change the
Space condition from `!model._typeAhead` to `!_typingWord()`:

```tsx
if (e.key === "Enter" || (e.key === " " && !_typingWord())) {
```

with a private helper before `_typeAhead`:

```tsx
// Whether a type-ahead word is still being typed, so that Space belongs to it ("New Zealand")
// rather than choosing. The buffer is cleared only when the list opens or closes, so it is not
// enough on its own: after the reset pause it is stale, and Space chooses again.
function _typingWord(): boolean {
    return !!model._typeAhead && Date.now() - model._typeAheadAt <= TYPE_AHEAD_RESET_MS;
}
```

In `selectNavigation.ts`, the comment on `isTypeAheadKey` describes the old rule; it now reads:

```ts
// A key that should feed type-ahead rather than being treated as a command. Space is deliberately
// excluded by the CALLER when no word is being typed — the buffer empty, or stale after the reset
// pause (there it commits the active row) — but included while one is, or "NEW ZEALAND" is
// unreachable.
```

**Verified in demo2.** `select.test.tsx`, type-ahead: "chooses the active row with Space after a pause
in typing" (was `it.fails`), and the new "opens a closed select with Space after a pause in typing",
which passed before too — through the button's native click — and guards that path. "treats Space as
part of a word being typed" still passes. With the fix reverted, the first fails; with it, the full
suite passes.

**Status**

- **ueca-react-doc — not present.** Checked against `5a900d4`: its Select is a native `<select>`.

---

## 16. Errors in a deferred action (runAsync) are never reported

**Severity:** medium in an app that navigates after a save or a delete through `runAsync`, where a
navigation that fails does so without a word; low in demo2 and ueca-react-doc, whose deferred actions (menu reveal, section scroll, a history
index) rarely throw.

**Symptom.** An error thrown by an action passed to `runAsync`, or a promise it returns that rejects,
ignores the `errorHandling` argument: nothing reaches `App.UnhandledException` or `Dialog.Exception`,
the error escapes as an uncaught error or an unhandled rejection in the console, and even
`"suppress"` does not suppress it.

**Root cause.** `runAsync` wrapped only the `setTimeout` call in `asyncSafe`. Scheduling the timer never
fails; the action runs later, on the timer's own task, outside any guard.

**Fix.** In `appUtils.ts`, replace `runAsync`:

```ts
// Runs the action on a later task, with the error handling asyncSafe gives a call made now. The guard
// goes inside the timer: wrapped around setTimeout it only covered the scheduling, and the action's
// own errors escaped uncaught whatever errorHandling said.
function runAsync(action: () => void, errorHandling: ErrorHandling = "application") {
    setTimeout(() => {
        try {
            asyncSafe(action, errorHandling);
        } catch (error) {
            // asyncSafe ends a reported failure by throwing AbortExecutionException, to bail its caller
            // out. A timer has no caller to bail out, so that stops here; "none" still rethrows.
            if (!(error instanceof AbortExecutionException)) {
                throw error;
            }
        }
    }, 0);
}
```

Keep the parameter typed `() => void`: callers pass actions returning `Promise<boolean>`
(`() => model.setRoute(route)`), which `() => void | Promise<void>` would reject, and `asyncSafe`
recognises a returned promise at run time anyway.

**Verified in demo2.** `appUtils.test.ts`, "runAsync": "applies errorHandling to an error thrown by the
deferred action" (was `it.fails`), and the new "reports an error thrown by the deferred action as
App.UnhandledException by default, throwing nothing into the timer" and "reports a deferred async
action that rejects through the channel it was given". With the fix reverted, those 3 fail; the new
"lets the deferred action's error through in none mode" passes either way and guards that mode. With
the fix, the full suite passes.

**Status**

- **ueca-react-doc — ported in `a1d35f9`.** Before: Checked against `5a900d4`: the same `runAsync`
  (lines 81–83), used for the menu reveal, section scroll, the history index and DocsScreen's pending
  section. Apply the same change.

---

## 17. The sign-in form keeps the signed-out page's title

**Severity:** low (cosmetic). Visible in demo2: on Showcase › Controls, sign out — the browser tab
still reads "Controls · Showcase — UECA-React Showcase" over the sign-in form.

**Symptom.** After signing out, the document title names the screen that was on show. A signed-out
visit to the same address gets the app name alone.

**Root cause.** Screens name themselves through `App.BrowsingHistory.SetPageTitle`, and
AppBrowsingHistory keeps that name for as long as the browser stays at the address it was given for.
Signing out swaps the screen for the sign-in form without changing the address, and the form sent
nothing, so the name outlived its screen.

**Fix.** In `appLoginForm.tsx`, after `constr`:

```tsx
// The form names no page, and says so each time it is shown. Signing out puts it in place of
// a screen WITHOUT changing the address, and the title the history service keeps for that
// address would otherwise go on naming the screen it replaced.
mount: async () => {
    await model.bus.unicast("App.BrowsingHistory.SetPageTitle", undefined);
},
```

Tried first and rejected: clearing the title in ScreenLayout's `unmount`. On Back the returning
screen's `mount` names the page BEFORE the leaving screen's `unmount` runs, so the clear erased the
new title (the Back/Forward title tests caught it). The form is the only thing shown in a screen's
place at an unchanged address, and nothing races it.

**Verified in demo2.** `integration/auth.test.tsx`: "titles the sign-in form with the app name alone
after signing out" (was `it.fails`); `appLoginForm.test.tsx`: the new "tells the history service it
names no page when it is shown". With the fix reverted, both fail; with it, the full suite passes,
including the Back/Forward and sign-in title tests.

**Status**

- **ueca-react-doc — not present.** Checked against `5a900d4`: the same path-based title, and no
  sign-in form.

---

## 18. The Layout showcase misstates the default spacing

**Severity:** low (documentation). Visible in demo2: Showcase › Layout › Spacing.

**Symptom.** The section tells the reader that a Row or Col "defaults to `default` (8px), not zero",
and that a container converted from CSS gains 8px between every child. Both default to no gap, so the
reference page gets wrong the one default it warns about.

**Root cause.** The text predates the change that took the implicit gap away (`row.tsx`: "No implicit
gap… Ask for spacing where you want it"; Col and Grid follow Row).

**Fix.** In `src/screens/showcase/topics/layoutTopic.tsx`, `_SpacingView`, replace the description:

```tsx
description="The gap BETWEEN children of a Row or Col. There is none by default:
             children touch unless you pass a spacing, so every gap on screen can
             be read off the JSX."
```

**Verified in demo2.** `layoutTopic.test.tsx`: "states the gap a Row really has without a spacing
prop" (was `it.fails`) renders a bare Row to confirm the default, and now also checks the new
sentence. With the old text back, it fails; with the fix, the full suite passes.

**Status**

- **ueca-react-doc — not present.** Checked against `5a900d4`: it has no Showcase.

---

## 19. Several tooltip triggers on one model share a token

**Severity:** low. Visible in demo2 in principle on Showcase › Overlays › Sweeping across a row — the
section whose text promises exactly the protection this defeated. In a browser a mouseleave is
delivered before the next mouseenter, so the race rarely shows; the flaw is in what the page claims.

**Symptom.** The app's single tooltip ignores a Hide that names a trigger other than the one showing,
so a late leave from one trigger cannot close the tooltip its neighbour has just opened. But
`tooltipProps` used the component's htmlId as the token, so every element one model spread it onto —
the twelve sweep targets, the four placement targets, a table's column resize handles — had the same
token, and a late leave from one closed the others' tooltip. A second, related flaw: a hide from any of
them cleared the component's "tooltip showing" flag, so after one trigger's late leave, unmount no
longer closed the tooltip another trigger still had open.

**Root cause.** In `base.tsx`, the token is always `model.htmlId()`, and `__tooltipShown` is one flag
for the whole component.

**Fix.**

1. `base.tsx`:
   - add, before `BasePartialStruct`:
     ```ts
     // `trigger` names one of several elements a component gives tooltips to — see tooltipProps.
     type TooltipOptions = { placement?: Placement; delay?: number; trigger?: string };
     ```
   - replace the `__tooltipShown: boolean` prop with `__tooltipToken: string` (initial `undefined`):
     the token of the tooltip this component last opened and has not hidden;
   - type `tooltipProps` and `showTooltip` options as `TooltipOptions`, and `hideTooltip` as
     `(trigger?: string) => Promise<void>`; document on `tooltipProps` that a model spreading it onto
     several elements names each with `trigger`;
   - `unmount`: `if (model.__tooltipToken) { await model.hideTooltip(); }`;
   - implementations:
     ```ts
     showTooltip: async (anchor, contentView, options) => {
         const token = _tooltipToken(options?.trigger);
         model.__tooltipToken = token;
         await model.bus.unicast("App.Tooltip.Show",
             { token, anchor, contentView, placement: options?.placement, delay: options?.delay });
     },
     hideTooltip: async (trigger) => {
         await _hideTooltip(trigger === undefined ? (model.__tooltipToken ?? model.htmlId()) : _tooltipToken(trigger));
     }
     ```
   - in `_tooltipProps`, close with the trigger's own token, never "the last opened":
     ```ts
     const close = () => asyncSafe(() => _hideTooltip(_tooltipToken(options?.trigger)));
     ```
   - private helpers:
     ```ts
     // The component's htmlId names its trigger; a named trigger adds its name after a "#", which
     // model paths do not use, so it cannot collide with a child component's id.
     function _tooltipToken(trigger?: string): string {
         return trigger === undefined ? model.htmlId() : `${model.htmlId()}#${trigger}`;
     }

     // Forgets the token only when it is the one this component has showing: a late hide from another
     // of its named triggers must not leave unmount thinking there is nothing left to close.
     async function _hideTooltip(token: string) {
         if (token === model.__tooltipToken) {
             model.__tooltipToken = undefined;
         }
         await model.bus.unicast("App.Tooltip.Hide", { token });
     }
     ```
   A component with a single trigger passes no name and keeps its htmlId as the token.

2. Name the triggers of each model that has several:
   - `overlaysTopic.tsx`: placement targets `trigger: placement`; sweep targets
     ``trigger: `channel-${i + 1}` ``; the two JSX-content blocks `trigger: "battery"` and
     `trigger: "long-text"`. The sweep section's description gains a sentence saying so.
   - `table.tsx`, the resize handle: ``{ trigger: `resize-${String(column.key)}` }``.

3. `CLAUDE.md`, the AppTooltipManager line: a model spreading `tooltipProps` onto several elements
   names each with `{ trigger: "…" }`.

**Verified in demo2.** `overlaysTopic.test.tsx`: "a late leave from one sweep target leaves its
neighbour's tooltip open" (was `it.fails`, runs the real AppTooltipManager); the placement tests now
expect `overlays#top` and the like. `base.test.tsx`, "named triggers on one component": "give each
trigger a token of its own" and "still close the tooltip showing on unmount after another trigger's
late leave". `table.test.tsx`: "gives each column's handle a tooltip token of its own". Without the
fix those fail; the single-trigger token tests across the components are unchanged, and the full suite
passes.

**Status**

- **ueca-react-doc — ported in `e4132e0`.** Part 1, the base; every trigger there is still alone on its model. Before: Checked against `5a900d4`: `components/base/base.tsx` has the same
  tooltip code (`_tooltipProps` at line 138), but every trigger there is alone on its model (NavItem,
  IconButton), so nothing needs a name. Apply part 1 to keep the base in step.

---

## 20. A required Checkbox keeps "must be checked" after it is checked

**Severity:** medium when used, and it is the usage `CLAUDE.md` documents (a required "I agree to
terms" box); latent in demo2 and ueca-react-doc, where no screen has a required Checkbox.

**Symptom.** Validate a form whose required Checkbox is unchecked: it shows "… must be checked". Check
the box — by clicking or through its bound `checked` — and the error stays on screen, in red, until the
owner validates again.

**Root cause.** Every input clears its validation error when its value changes, through
`onChangeValue`. A Checkbox's state is `checked`; it has no `value`, so its `onChangeValue` handler
never fired. The struct even declared an `onChangeValue` event of its own just so that line would
type-check.

**Fix.** In `checkbox.tsx`, remove `onChangeValue: () => void;` from the `events` type, and in the
struct's `events` replace `onChangeValue: () => model.resetValidationErrors(),` with:

```tsx
// On `checked`, the box's state, by click or by binding. The other inputs reset on
// onChangeValue, and a Checkbox has no `value`: wired to that, the reset never ran and
// "must be checked" stayed on a box the user had just checked.
onChangeChecked: () => model.resetValidationErrors(),
```

`onChangeChecked` is generated for the `checked` prop and needs no declaration.

**Verified in demo2.** `checkbox.test.tsx`, "validation": "clears its validation error once checked"
(was `it.fails`) and the new "clears its validation error when checked is assigned". With the fix
reverted, both fail; with it, the full suite passes and `tsc -b` accepts the generated event.

**Status**

- **ueca-react-doc — ported in `3d7f723`.** Before: Checked against `5a900d4`: the same code at lines 22 and 51,
  and no screen uses Checkbox. Apply the same change.

---

## 21. A required field holding 0 reports "cannot be empty"

**Severity:** medium when hit — the form cannot be saved with a legitimate choice — and latent in demo2
and ueca-react-doc today. A numeric enum whose first member is 0 is exactly what reaches it: a required
Select or RadioGroup over it would refuse that first member.

**Symptom.** A required TextField<number> showing "0", a required Select showing its option whose value
is 0, or a required RadioGroup with that option checked, fails validation with "… cannot be empty".

**Root cause.** Their `onInternalValidate` tests `!model.value` (TextField also skips its type check on
the same test), which counts 0 — and `false` — as no value, although each input shows 0 as a value.
NumberField already tested `value == null`.

**Fix.** One rule for all three.

1. `components/base/editBase.tsx`, before the export, and add `isEmptyValue` to the export list:

   ```ts
   // What `required` counts as no value: nothing at all, or text that is blank. A number or a boolean is
   // a value even at 0 or false — inputs used to test `!model.value`, which counted a chosen 0 as empty.
   function isEmptyValue(value: unknown): boolean {
       return value == null || (typeof value === "string" && value.trim() === "");
   }
   ```

2. `textField.tsx` (import `isEmptyValue` from `@components`):

   ```tsx
   // Required validation. A TextField<number> holding 0 shows "0", so 0 is not empty.
   if (model.required && isEmptyValue(model.value)) {
       return `${fieldName} cannot be empty`;
   }

   // Type-specific validation (only if value is not empty)
   if (!isEmptyValue(model.value)) {
   ```

3. `select.tsx` and `radioGroup.tsx` (import `isEmptyValue`):

   ```tsx
   // Not `!model.value`: an option whose value is 0 is a choice, and shows as chosen.
   if (model.required && isEmptyValue(model.value)) {
   ```

   (RadioGroup's comment says "shows as checked".)

**Verified in demo2.** "does not report a required numeric field holding 0 as empty"
(`textField.test.tsx`), "does not report a required select holding the option 0 as empty"
(`select.test.tsx`) and "does not report a required group holding the option 0 as empty"
(`radioGroup.test.tsx`) — all three were `it.fails` — plus `editBase.test.tsx`, "isEmptyValue":
undefined, null, "" and whitespace are empty; 0, false, "0" and text are values. With the three
components reverted, their tests fail; with the fix, the full suite passes, including the existing
"reports a required field holding an undefined / empty / whitespace-only value as empty".

**Status**

- **ueca-react-doc — ported in `a270251`.** Its TextField's message stays "is required". Before: Checked against `5a900d4`: `textField.tsx` lines 62 and 67,
  `select.tsx` line 59, `radioGroup.tsx` line 57; its `editBase.tsx` export (line 81) also exports
  `useValidator`, so add `isEmptyValue` beside it. No screen uses these inputs.

---

## 22. A local AlertToast without a position never shows

**Severity:** medium when used, and it is a usage `CLAUDE.md` documents (AlertToast "local as child").
Latent in demo2 and ueca-react-doc: their only AlertToasts are AppAlertManager's, which pass `disablePortal`
and so never read the position.

**Symptom.** Create an AlertToast without `anchorOrigin` — `useAlertToast({ contentView: "Saved" })` —
and open it: nothing appears, the View's error (reading `vertical` of undefined) goes to UECA's error
handler, and `onOpen` still reports the toast opened. A Snackbar given `anchorOrigin={undefined}` fails
the same way.

**Root cause.** AlertToast declares `anchorOrigin: undefined` and hands it to its Snackbar through a
binding, `anchorOrigin: () => model.anchorOrigin`. In UECA an undefined param or binding *replaces* a
prop's default rather than falling back to it — checked in demo2: a Snackbar mounted with
`anchorOrigin: undefined` has no position — so Snackbar's top-right default is gone, and its View read
`model.anchorOrigin.vertical` unguarded. AlertToast's `simple: () => !model.anchorOrigin` looks like a
mode for "no position", but Snackbar never reads `simple`.

**Fix.** In `components/flyouts/snackbar/snackbar.tsx` only; AlertToast is unchanged.

1. After the imports (demo2 has it after `AUTO_HIDE_MS`):

   ```ts
   // Where a snackbar sits unless it is given an anchorOrigin.
   const DEFAULT_ANCHOR_ORIGIN = { vertical: "top", horizontal: "right" } as const;
   ```

2. In `props`, `anchorOrigin: DEFAULT_ANCHOR_ORIGIN,`. UECA copies a default into each model, so
   changing one snackbar's `anchorOrigin.vertical` leaves the constant and other snackbars alone —
   checked in demo2.

3. In the View, replace the `positionClass` line with:

   ```tsx
   // Unset means the default corner. An undefined param or binding replaces the default rather
   // than falling back to it, and AlertToast hands on its own anchorOrigin, unset unless given —
   // reading it unguarded threw, so a local toast without a position never showed.
   const { vertical, horizontal } = model.anchorOrigin ?? DEFAULT_ANCHOR_ORIGIN;
   const positionClass = model.disablePortal ? "" : `snackbar-${vertical}-${horizontal}`;
   ```

**Verified in demo2.** `alertToast.test.tsx`, "opens at the top right, like a Snackbar, when no
anchorOrigin is given" (was `it.fails`; it now also checks the `snackbar-top-right` class and a single
onOpen), and `snackbar.test.tsx`, "sits at the top right when anchorOrigin is passed unset". With the
Snackbar change reverted, both fail; with it, the full suite passes.

**Not done.** Snackbar's `simple` prop does nothing in demo2 or ueca-react-doc — only AlertToast sets it.
Removing both is a cleanup, not part of the fix.

**Status**

- **ueca-react-doc — ported in `7a168eb`.** Before: Checked against `5a900d4`: `snackbar.tsx` default at line 36,
  read at line 93; `alertToast.tsx` lines 37 and 53; AlertToast appears only in AppAlertManager, with
  `disablePortal`. Apply the same change.

---

## 23. A REST query value of 0, false or "" never reaches the server

**Severity:** high when hit — the request goes out without the value, the server answers with its
default in place of the caller's choice, and nothing reports an error. Neither demo2 nor ueca-react-doc
calls its client today.

**Symptom.** `get("/users", { page: 0 })` requests `/users` with no `page`; `false` and `""` vanish the
same way, from `post`, `postFormData` and `getUrl` too.

**Root cause.** `_createRequestURL` appended a query value only `if (updatedParams[param])` — a
truthiness test where "absent" was meant.

**Fix.** In `src/api/restApiClient.ts`, `_createRequestURL`, replace the loop:

```ts
for (const param in updatedParams) {
    // Only null and undefined mean "no value". The loop tested truthiness, so 0, false and ""
    // were dropped too — { page: 0 } or { active: false } never reached the server.
    const value = updatedParams[param];
    if (value != null) {
        searchParams.append(param, JSON.stringify(value));
    }
}
```

Every value keeps its JSON encoding, so `""` goes out as `%22%22`.

**Verified in demo2.** `restApiClient.test.ts`, "URLs": "sends the query value 0 / false / """ (was
`it.fails.each`) and the new "getUrl keeps 0 and false among the query values while still omitting
null". With the loop reverted, exactly those four fail; "omits null and undefined query values" passes
either way.

**Status**

- **ueca-react-doc — ported in `20b8a1a`.** Before: Checked against `5a900d4`: `src/api/restApiClient.ts` line 116;
  the client is only re-exported from `api/index.ts`. Apply the same change.

---

## 24. A successful request with no body is rejected (204 No Content)

**Severity:** high when hit — 204 is the usual answer to a delete or an update, and the caller gets an
exception for a request that succeeded. Neither demo2 nor ueca-react-doc calls its client today.

**Symptom.** A request answered `204 No Content` rejects with `SyntaxError: Unexpected end of JSON
input`. So does a 200 whose body is empty without a `content-length: 0` header — a chunked response,
for one. Only a body declared empty resolved `undefined`.

**Root cause.** `_processResponse` parsed every success body as JSON unless it declared
`content-length: 0`, and a 204 must not send that header at all; `response.json()` or
`JSON.parse("")` then threw.

**Fix.** In `_processResponse`, replace the success branch's
`return (this._isJson(response)) ? … : JSON.parse(await response.text());` with:

```ts
if (this._isStream(response)) {
    return await this._processBlob(response) as T;
}
// Read as text so an empty body resolves undefined. A success need not declare
// content-length 0 to have no body — a 204 No Content must not send the header at
// all — and parsing its "" as JSON rejected the request.
const text = await response.text();
return text ? JSON.parse(text) : undefined;
```

A body declared JSON was already parsed like one that is not ("parses a body that is not declared as
JSON as JSON all the same"), so reading both as text changes nothing else.

**Verified in demo2.** "responses": "resolves undefined for 204 No Content" (was `it.fails`), and the
new "resolves undefined for a 204 that still declares JSON" and "… for a 200 with an empty body and no
content-length". With the branch reverted, exactly those three fail.

**Not done — pinned.** The error path has the same gap. An error whose empty body is not declared empty
rejects with that SyntaxError when it declares JSON, and otherwise with a blank message — and a blank
name on HTTP/2, which sends no status text. The request still fails, so the harm is the message, not
the outcome. Pinned in demo2 as "names the status for an error whose empty body is … but not declared
empty" (`it.fails.each`).

**Status**

- **ueca-react-doc — ported in `bc713b8`.** Before: Checked against `5a900d4`: `src/api/restApiClient.ts` lines
  173–179. Apply the same change.

---

## 25. An EditDrawer reports Save, Delete and OK as a cancel

**Severity:** medium to high when used — an owner that reverts edits in `onCancel`, the natural thing to
put there, has them reverted right after every successful Save. Latent in both projects that have
EditDrawer: no owner passes `onCancel` or opens a view drawer with `showModal()`.

**Symptom.** In an edit drawer, `onCancel` also fires after a successful Save and after a confirmed
Delete, and twice for one Cancel. In a view drawer, `showModal()` resolves `false` when the user
acknowledges it with OK, although it is documented to resolve `true`.

**Root cause.** The drawer's close handler treats every close as the × or the backdrop: in edit mode it
raises `onCancel`, and then it settles `showModal()` with `false`. The footer's buttons close through
`hide()` as well, and `hide()` runs that handler synchronously. Save still resolved `true` only because
the handler awaits `onCancel` first; OK in view mode has no such await, so `false` won.

**Fix.** In `components/flyouts/editDrawer/editDrawer.tsx`:

1. A prop, declared after `__resolveShowModal` and defaulting to `false`:

   ```ts
   // Set when a footer button closes the drawer, having already settled the outcome. Cleared on
   // every opening, so a button whose hide() closed nothing cannot mark the next close.
   __closedByFooter: boolean;
   ```

2. The drawer's handlers:

   ```tsx
   onOpen: async () => {
       model.__closedByFooter = false;
       await model.onOpen?.();
   },
   // Every close lands here — the × and the backdrop, the owner's hide(), and the footer's
   // buttons, which close through hide() too. Only a close no button made is a dismissal,
   // which an edit drawer treats as a cancel. Treating them all as one raised onCancel after
   // a Save or a Delete and twice for a Cancel, and turned a view drawer's OK into false.
   onClose: async () => {
       if (!model.__closedByFooter) {
           if (model.mode === "edit") {
               await model.onCancel?.();
           }
           _resolveShowModal(false);
       }
       await model.onClose?.();
   }
   ```

3. In Delete (after a successful `onDelete`), Cancel (after `onCancel`), Save (after `onSave`) and OK,
   replace the `model.hide(); _resolveShowModal(…);` pair with `_closeFromFooter(false)`,
   `_closeFromFooter(false)`, `_closeFromFooter(true)` and `onClick: () => _closeFromFooter(true)`,
   and add after `_resolveShowModal`:

   ```ts
   // A footer button's close: the button knows the outcome, so it settles showModal() itself and
   // marks the close as its own before the drawer's close handler runs.
   function _closeFromFooter(result: boolean) {
       model.__closedByFooter = true;
       _resolveShowModal(result);
       model.hide();
   }
   ```

The flag is cleared on opening rather than by the close handler: when the owner's `onSave` hides the
drawer itself, Save's own `hide()` closes nothing, and a flag left set would turn the next opening's ×
into a button close — no `onCancel`, and `showModal()` never settling. An owner's `hide()` is still a
dismissal, as before.

**Verified in demo2.** `editDrawer.test.tsx`: "resolves true when a view drawer is acknowledged with OK"
and "onCancel is raised only when the user cancels" — "is not raised by a successful Save", "is raised
once by Cancel", "is not raised by a confirmed Delete" (all four were `it.fails`) — plus the new "is
raised by the × of the next opening after a Save whose hide() closed nothing". With the old
`editDrawer.tsx`, exactly the four fail; with the flag cleared by the close handler instead of on
opening, exactly the new one fails. The ×, backdrop and owner-`hide()` tests pass throughout.

**Status**

- **ueca-react-doc — not present.** It has no EditDrawer.

---

## 26. A Table switched to virtualized after mounting ignores viewport resizes

**Severity:** low — a blank band below the rows until the next scroll. Visible in demo2: Playground ›
Table, turn on Virtualized, then make the window much taller.

**Symptom.** Right after the switch the table renders a fallback first page of 30 rows, whatever the
viewport holds. After a scroll it fits the viewport, but a later resize is not followed: once the
viewport grows past the overscan margin (12–18 rows), the rows below stay blank until the grid scrolls.

**Root cause.** The ResizeObserver, and the first measurement of the viewport, were set up only in the
`mount` hook, and only when the table was already virtualized.

**Fix.** In `components/data/table/table.tsx`, watch the viewport whenever the table is virtualized,
however it got there:

```tsx
events: {
    // The viewport is watched while the table is virtualized, however it got there. Watching
    // started only in `mount`, so a table switched on afterwards — the Table playground's
    // "Virtualized" switch — never measured its viewport or heard it resize, and a viewport
    // grown past the overscan showed a blank band below the rows until the next scroll.
    onChangeVirtualized: (virtualized) => {
        if (virtualized) {
            _observeViewport();
        } else {
            _stopObservingViewport();
        }
    }
},

mount: () => {
    if (model.virtualized) {
        _observeViewport();
    }
},

unmount: () => {
    _stopObservingViewport();
    // …the existing _hoverKey reset stays
},
```

and after `_isSelectable`:

```ts
// Sizes the window to the viewport now, and again whenever the viewport resizes. Only a mounted
// table has one; an unmounted table is measured when it mounts.
function _observeViewport() {
    const el = model.__rootRef.current;
    if (!el || model.__resizeObserver) {
        return;
    }
    model.__resizeObserver = new ResizeObserver(() => {
        model.__derived.viewportH = el.clientHeight;
        updateWindow(model);
    });
    model.__resizeObserver.observe(el);
    model.__derived.viewportH = el.clientHeight;
    updateWindow(model);
}

function _stopObservingViewport() {
    model.__resizeObserver?.disconnect();
    model.__resizeObserver = undefined;
    model.__derived.viewportH = 0;
}
```

**Verified in demo2.** `table.test.tsx`, "virtualization": "follows viewport resizes when switched to
virtualized after mounting" (was `it.fails`), the new "stops observing its size when switched off", and
"measures the viewport when switched on after mounting", which replaces the test that recorded the
30-row fallback. With the old `table.tsx`, exactly those three fail.

**Status**

- **ueca-react-doc — not present.** It has no Table.

---

## 27. One unreadable value leaves a sorted number or date column unsorted

**Severity:** medium when hit — the column looks sorted by a header that says so, but is not. Latent:
it needs a value the column cannot read, such as "n/a" in a number column or a malformed date.

**Symptom.** Sorting `[3, "n/a", 1, 2]` in a number column, or dates around `"not a date"`, leaves the
valid values out of order.

**Root cause.** `compareValues` subtracted the two readings, and a value that is not a number (or not a
date) reads as `NaN`, so the comparison returned `NaN`. `Array.sort` treats that as "equal to
everything", which is no consistent order at all.

**Fix.** In `components/data/table/tableFormat.ts`, `compareValues`, compare every reading through a
helper — `_compareReadings(Number(x), Number(y), x, y)` for number columns,
`_compareReadings(new Date(x as string).getTime(), new Date(y as string).getTime(), x, y)` for date,
time and dateTime columns, and `_compareReadings(x, y, x, y)` for two plain numbers — defined after it:

```ts
// Compares two values by what the column reads them as. A value it cannot read — "n/a" in a number
// column, which formatValue shows as it is — sorts after every readable one, and among its own kind
// as text. Subtracting gave NaN, which Array.sort takes for "equal to everything": no order at all,
// and the readable values around it were left unsorted.
function _compareReadings(a: number, b: number, x: unknown, y: unknown): number {
    const aReadable = !Number.isNaN(a);
    const bReadable = !Number.isNaN(b);
    if (aReadable && bReadable) {
        return a - b;
    }
    if (aReadable !== bReadable) {
        return aReadable ? -1 : 1;
    }
    return textCollator.compare(String(x), String(y));
}
```

Empty values still sort last, after the unreadable ones; descending order reverses the lot, as before.

**Verified in demo2.** `tableFormat.test.ts`, "compareValues": the two "still orders the valid …" tests
(were `it.fails`), plus the new "sorts the values a number / date column cannot read after the readable
ones and before empty ones" and "orders NaN in a column without a data type after the numbers". With the
old `tableFormat.ts`, all five fail.

**Status**

- **ueca-react-doc — not present.** It has no Table.

---

## 28. A FilterableList's search box ignores a search set from code

**Severity:** medium when used — the box misdescribes the filter the list applies. It is the documented
use of `search` ("a caller can clear or preseed the filter"); latent, as no screen assigns it.

**Symptom.** Preseeding `search: "piezo"` narrows the list under an empty box. Clearing `search` from
code restores the list but leaves the old text in the box, and the next keystroke searches for it again.

**Root cause.** `search` is owned by FilterableList and fed by the SearchField's `onSearch`, but nothing
carried it the other way into the SearchField's `value`.

**Fix.** In `components/data/filterableList/filterableList.tsx`, add to `events`, after
`onChangeActiveKey`, and an `init` hook:

```tsx
// The box shows the search a caller assigns, not only what was typed there. Nothing
// carried it into the SearchField, so a preseeded search narrowed the list under an
// empty box, and a cleared one stayed in the box for the next keystroke to bring back.
onChangeSearch: () => {
    _showSearchInBox();
}
},

init: () => {
    _showSearchInBox();
},
```

and after `return model`:

```ts
// Typing reaches `search` through onSearch, where the box already holds the same text; only a
// search set from outside changes what the box shows.
function _showSearchInBox() {
    const search = model.search ?? "";
    if (model.searchField.value !== search) {
        model.searchField.value = search;
    }
}
```

**Verified in demo2.** `filterableList.test.tsx`, "search": "shows a preseeded search in the search
box" and "empties the search box when a caller clears the search" (were `it.fails`), plus the new
"keeps the typed text while its search is still settling". With the old `filterableList.tsx`, the two
fail.

**Status**

- **ueca-react-doc — not present.** It has no FilterableList.

---

## 29. An EditBase with modelsToValidate unset cannot validate

**Severity:** medium when hit — `validate()` rejects with "undefined is not iterable" and the form cannot
be saved. Latent: it needs an unset list, such as a TabsContainer whose `tabs` binding has no value yet
(TabsContainer copies `tabs` into `modelsToValidate`).

**Root cause.** `getValidationError` and `resetValidationErrors` read `modelsToValidate?.`, but
`validate()` handed `modelsToValidate?.map(...)` — `undefined` for an unset list — to `Promise.all`.

**Fix.** In `components/base/editBase.tsx`, `validate`:

```ts
// An unset list validates nothing, as it reads in getValidationError and
// resetValidationErrors. Promise.all(undefined) rejected, so a composite whose list
// was unset — a TabsContainer whose tabs were not there yet — could not validate.
await Promise.all((model.modelsToValidate ?? []).map(x => x.validate()));
```

**Verified in demo2.** `editBase.test.tsx`, "validates with modelsToValidate unset, as its other methods
already allow" (was `it.fails`); with the old `editBase.tsx` it fails.

**Status**

- **ueca-react-doc — ported in `149b0c1`.** Before: Checked against `5a900d4`: `components/base/editBase.tsx`
  line 52. Apply the same change.

---

## 30. A screen reader hears an indeterminate Checkbox as "not checked"

**Severity:** low to medium — an accessibility defect: the mixed state ("some selected") is drawn but
not exposed. Latent: no screen in any project uses an indeterminate Checkbox.

**Root cause.** `indeterminate` only swapped the drawn glyph. A native checkbox is announced as mixed
through its DOM `indeterminate` property, which has no HTML attribute, so React never set it.

**Fix.** In `components/inputs/checkbox/checkbox.tsx`:

1. A ref prop: `__inputRef: React.RefObject<HTMLInputElement>;` in the props type, defaulting to
   `{ current: null }`, and `ref={model.__inputRef}` on the `<input>`.
2. A `draw` hook before `View`:

   ```tsx
   // The mixed state is a DOM property with no attribute, so it is set here, after each draw.
   // Only the glyph used to change: a screen reader announced a mixed box as plain "not checked".
   draw: () => {
       const input = model.__inputRef.current;
       if (input) {
           input.indeterminate = _showsMixed();
       }
   },
   ```

3. The glyph condition `model.indeterminate && !model.checked` becomes `_showsMixed()`, defined after
   `_handleChange`:

   ```ts
   // A checked box shows its check, whatever `indeterminate` says.
   function _showsMixed(): boolean {
       return !!model.indeterminate && !model.checked;
   }
   ```

**Verified in demo2.** `checkbox.test.tsx`, "accessibility": "exposes the indeterminate state as
partially checked" (was `it.fails`) and the new "follows indeterminate and checked after mounting, as
the glyph does". With the old `checkbox.tsx`, both fail.

**Status**

- **ueca-react-doc — ported in `ced4807`.** Before: Checked against `5a900d4`: the same code at lines 17, 40, 54, 67,
  80 and 101.

---

## 31. A Spinner created visible stays hidden

**Severity:** medium when hit — busy work runs with no busy indicator. Latent: AppBusyDisplay, the only
Spinner in each project, is created with `visible` false and changes it later.

**Root cause.** The drawn `_visible` state was synchronised only from `onChangeVisible`, which never fires
for the value a model is created with.

**Fix.** In `components/misc/spinner/spinner.tsx`, after `events`:

```ts
// onChangeVisible never fires for the value a spinner is created with, so a spinner
// created visible stayed hidden until `visible` changed.
init: () => _updateState(),
```

`_updateState` already honours `delayTime` and does nothing when the drawn state matches.

**Verified in demo2.** `spinner.test.tsx`: "shows a spinner that is visible from the start" (was
`it.fails`) and the new "waits out its delayTime when it is visible from the start". With the old
`spinner.tsx`, both fail.

**Status**

- **ueca-react-doc — ported in `a48e357`.** Corrected after checking: it does have a Spinner, `components/misc/spinner.tsx`, AppBusyDisplay's, with the same `onChangeVisible`-only sync. Before: It has no Spinner.

---

## 32. A determinate Spinner draws a full ring whatever its value

**Severity:** low when used — the progress it is meant to show is not shown. Latent: every Spinner in
the projects is indeterminate.

**Root cause.** The value is drawn through `stroke-dashoffset`, which only slides a dash pattern, and only
the indeterminate circle had a `stroke-dasharray`.

**Fix.** In `components/misc/spinner/spinner.tsx`, on the `<circle>`:

```tsx
// One ring-long dash in both variants. The offset only slides a dash
// pattern, so a determinate ring without one drew in full whatever its
// value; the indeterminate animation overrides the pattern in CSS.
strokeDasharray={circumference}
```

**Verified in demo2.** `spinner.test.tsx`, "gives the determinate arc a dash pattern one ring long, so
the offset shows the value" (was `it.fails`); with the old `spinner.tsx` it fails, and the existing
indeterminate and offset tests pass either way.

**Status**

- **ueca-react-doc — ported in `e17e68a`.** Corrected after checking: its `components/misc/spinner.tsx` drew the determinate circle without a dash pattern. Before: It has no Spinner.

---

## 33. A read-only NumberField changes when its spin buttons are clicked

**Severity:** medium when hit — a value the form shows as not editable is edited, and saved with the
form. Latent: no screen combines `readOnly` with `spinButtons`.

**Root cause.** The spin buttons were disabled by `disabled` alone, and `_step` had no guard of its own.

**Fix.** In `components/inputs/numberField/numberField.tsx`, both buttons get
`disabled={!_isEditable()}`, and `_step` returns first thing when `!_isEditable()`, with after it:

```ts
// Read-only is "visible and selectable but not editable", so it stops the spin buttons as
// disabled does. They used to check disabled alone, and changed a read-only field.
function _isEditable(): boolean {
    return !model.disabled && !model.readOnly;
}
```

**Verified in demo2.** `numberField.test.tsx`, "spin buttons": "does not let the spin buttons change a
read-only field" (was `it.fails`) and the new "disables both buttons while read-only, and enables them
again after". With the old `numberField.tsx`, both fail.

**Status**

- **ueca-react-doc — not present.** It has no NumberField.

---

## 34. A required NumberField with no label says " cannot be empty"

**Severity:** low — the error names nothing. Latent: every required NumberField in the projects is
labelled.

**Root cause.** The field name fell back with `??`, and `placeholder` defaults to `""`, which `??` passes
through. TextField uses `||` for exactly this reason and says so.

**Fix.** In `components/inputs/numberField/numberField.tsx`, `onInternalValidate`:

```ts
// `||`, as in TextField: placeholder defaults to "", which `??` passed through,
// so an unlabelled field reported " cannot be empty".
const fieldName = fieldLabelText(model.labelView) || model.placeholder || "This field";
```

**Verified in demo2.** `numberField.test.tsx`, "names an unlabelled field without a placeholder 'This
field'" (was `it.fails`); with the old line it fails, and "names an unlabelled field by its placeholder"
passes either way.

**Status**

- **ueca-react-doc — not present.** It has no NumberField.

---

## 35. Notebook.open() keeps the page showing before it in the history

**Severity:** medium when used — `closeLastPage()` steps back to a page the reset was meant to forget.
Latent: no screen in any project uses Notebook.

**Root cause.** `open()` cleared the history before assigning the new active page, and
`onChangingActivePage` then pushed the page that was showing.

**Fix.** In `components/misc/notebook/notebook.tsx`, `open`, between the assignment and the push:

```ts
model.activePage = pages.pop();
// Cleared again now the page is assigned: onChangingActivePage has just recorded the
// page that was showing, which a reset must not keep. Cleared only before, that page
// stayed reachable through closeLastPage().
_historyClear();
_historyPush(...pages);
```

**Verified in demo2.** `notebook.test.tsx`, "resets the history, so the page showing before open() is
not stepped back to" (was `it.fails`); with the old `notebook.tsx` it fails.

**Status**

- **ueca-react-doc — ported in `4a6f35c`.** Corrected after checking: it does have a Notebook, `components/misc/notebook.tsx`, unused, with the same `open()`. Before: It has no Notebook.

---

## 36. MarkdownPreview renders raw HTML although skipHtml is set

**Severity:** high if it ever renders markdown from users or a server — `skipHtml` is the switch for
exactly that, and it did nothing, so any tag in the source (forms, iframes, overlays) rendered. Latent:
no screen in any project sets `skipHtml`; all render the app's own markdown.

**Root cause.** `@uiw/react-markdown-preview` (5.2.x, its default export) adds `rehype-raw` to its rehype
plugins whatever `skipHtml` says, so raw HTML is always parsed into elements.

**Fix.** In `components/misc/markdownPreview/markdownPreview.tsx`, drop raw HTML at the markdown stage,
before `rehype-raw` sees it. On the preview element:

```tsx
<MarkdownPreview
    source={model.source}
    skipHtml={model.skipHtml}
    remarkPlugins={model.skipHtml ? [remarkSkipHtml] : undefined}
/>
```

and after the hook:

```ts
// A parsed markdown node, as far as dropping raw HTML needs one: raw HTML is a node of type "html".
type MarkdownNode = { type: string; children?: MarkdownNode[] };

// Removes raw HTML from the parsed markdown before it becomes elements, keeping the text between
// inline tags. skipHtml alone never took effect: @uiw/react-markdown-preview adds rehype-raw to its
// plugins whatever skipHtml says, so every tag in the source rendered.
function remarkSkipHtml() {
    return (tree: MarkdownNode) => {
        _dropHtml(tree);
    };
}

function _dropHtml(node: MarkdownNode) {
    if (!node.children) {
        return;
    }
    node.children = node.children.filter((child) => child.type !== "html");
    node.children.forEach(_dropHtml);
}
```

No new dependency, and nothing depends on identifying `rehype-raw` in the plugin list, which a
minified build would break. Code spans and fenced code are `inlineCode`/`code` nodes, so HTML shown as
code is untouched.

**Verified in demo2.** `markdownPreview.test.tsx`: "does not render raw HTML when skipHtml is set" (was
`it.fails`), plus the new "keeps the text between skipped tags, drops an HTML block, and leaves HTML in
code alone" and "renders raw HTML while skipHtml is off, and stops once it is set". With the old
`markdownPreview.tsx`, all three fail.

**Status**

- **ueca-react-doc — ported in `dc00a05`.** Before: Checked against `5a900d4`: the preview element at line
  95 and the hook's end at 140. Its docs are the repository's own markdown and never set `skipHtml`.

---

## 37. A reopened AlertDrawer reports the previous answer from its ×

**Severity:** medium when used as a question — closing with the × after an earlier OK reports `true`.
Latent: AlertDialog's details panel is the only AlertDrawer, and nothing reads its result.

**Root cause.** OK and Cancel set `closeResult`, and nothing reset it when the drawer opened again.
AlertDialog resets its own on open for this reason.

**Fix.** In `components/flyouts/alertDrawer/alertDrawer.tsx`, the drawer's `onOpen`:

```ts
onOpen: () => {
    // Each opening starts unanswered, as AlertDialog's does. OK and Cancel set the
    // result and nothing reset it, so the × on a reopened drawer reported the
    // previous answer — an earlier OK came back as true.
    model.closeResult = false;
    model.enterModalMode();
    model.onOpen?.(model);
},
```

**Verified in demo2.** `alertDrawer.test.tsx`, "reports false from the × even after an earlier OK" (was
`it.fails`); with the old `alertDrawer.tsx` it fails.

**Status**

- **ueca-react-doc — ported in `b0d6435`.** Before: Checked against `5a900d4`: `onOpen` at line 75.

---

## 38. An AlertDialog or AlertDrawer removed while open stays in modal mode

**Severity:** low — a leaked entry on uiBase's modal stack for the session, raising every later
overlay's computed `zIndex` by 100. Nothing paints that `zIndex` today (the painted z comes from
overlayStack, which Dialog and Drawer release on unmount), so it is not visible. Reached whenever
AppDialogManager's `Dialog.Close` retires a dialog.

**Root cause.** Both leave modal mode only in their close handler, and a component unmounted while open
never closes.

**Fix.** In `components/popups/alertDialog/alertDialog.tsx`, before `View`:

```ts
// Removed while still open — AppDialogManager's Dialog.Close retires a dialog that way — the
// dialog never closes, and leaving modal mode happened only on close: the entry stayed on
// the modal stack for the session. Leaving is idempotent.
unmount: () => {
    model.leaveModalMode();
},
```

and the same hook in `components/flyouts/alertDrawer/alertDrawer.tsx`, commented:

```ts
// Removed while still open, the drawer never closes, and leaving modal mode happened only on
// close — the entry stayed on the modal stack for the session. Leaving is idempotent.
```

**Verified in demo2.** "leaves modal mode when unmounted while still open" in both
`alertDialog.test.tsx` and `alertDrawer.test.tsx` (were `it.fails`); with the two files reverted, both
fail.

**Status**

- **ueca-react-doc — ported in `3352aad`.** Before: Checked against `5a900d4`: `alertDialog.tsx` `View` at
  line 113; `alertDrawer.tsx` `View` at line 100.

---

## 39. An AlertDialog's details panel outlives the dialog

**Severity:** medium when hit — the panel stays up over the page, and the next time the dialog opens it
is hidden behind the panel. Reached when a dialog closes while its details are showing: from code, or
through AppDialogManager, which reuses one dialog model for every dialog.

**Root cause.** Closing the dialog set `detailsOpen = false` to put the details away, but `detailsOpen`
was a plain prop connected to nothing; the panel is `detailsDrawer.open`.

**Fix.** In `components/popups/alertDialog/alertDialog.tsx`, the default:

```ts
// The details panel's own state, read and written through. A plain prop connected to
// nothing, it could not put the panel away on close: the panel outlived its dialog, and
// the dialog came back hidden behind it the next time it opened.
detailsOpen: UECA.bind(() => model.detailsDrawer, "open"),
```

The close handler's existing `model.detailsOpen = false` now closes the panel.

**Verified in demo2.** `alertDialog.test.tsx`, "details": "puts the details panel away when the dialog
closes" (was `it.fails`) and the new "reads the details panel's state through detailsOpen and opens the
panel from it". With the old `alertDialog.tsx`, both fail.

**Status**

- **ueca-react-doc — ported in `2455bc9`.** Before: Checked against `5a900d4`: line 47 (close handler at 84).

---

## 40. Every AppDialogManager dialog shares one model

**Severity:** medium — a dialog opened over another wears the other's OK button: a nested delete
confirmation can show a primary "Apply" instead of a danger "Delete". A dialog also inherits the last
one's state, such as a details panel left open (entry 39). Reached whenever dialogs nest
or follow one retired by `Dialog.Close`.

**Root cause.** Every dialog is rendered as `<AlertDialog id="activeDialog" …>` in the same place. UECA
keeps a JSX child's model by id, so each dialog took over the previous model, and its `init` param — where
the OK button gets its verb and colour — never ran again.

**Fix.** In `core/infrastructure/appDialogManager.tsx`:

1. A counter prop: `__dialogCount: number;` in the props type, defaulting to `0`.
2. On the dialog element, keeping the id (the integration harness and tests address
   `…activeDialog.dialog`):

   ```tsx
   // Every dialog shows as "activeDialog", so the key and cacheable={false} are what give each
   // one a model of its own. Sharing one, a nested dialog took over the model of the dialog
   // beneath it, whose `init` — the OK button's verb and colour — never ran again, and the
   // nested dialog wore the other's button. Uncached, a dialog brought back when the one above
   // it closes starts from its own parameters again.
   const newDialog = (
       <AlertDialog
           key={++model.__dialogCount}
           cacheable={false}
           id={"activeDialog"}
   ```

A dialog covered by a nested one is rebuilt from its parameters when it comes back, so its own transient
state (an open details panel) does not survive the nesting.

**Verified in demo2.** `appDialogManager.test.tsx`: "gives a nested action confirmation its own verb and
danger tint" (was `it.fails`), plus the new "gives the dialog beneath its own button back when the nested
one closes" and "opens each dialog fresh, not with the details panel an earlier one left open". With the
old `appDialogManager.tsx`, all three fail.

**Status**

- **ueca-react-doc — ported in `14101b3`.** Before: Checked against `5a900d4`: the element at line 55. Its
  manager is older (no `Dialog.Close`), so add the counter beside `_openDialogs` (lines 8 and 21).

---

## 41. Closing a nested dialog brings the busy spinner back over the dialog beneath

**Severity:** high when hit — while the app is busy, the outer dialog is covered by the spinner and cannot
be answered; if the busy work is waiting on that answer, the app is stuck. Reached when dialogs nest while
busy.

**Root cause.** A dialog hides the spinner when it opens and restores it when it closes, even when
another dialog is still open beneath it.

**Fix.** In `core/infrastructure/appDialogManager.tsx`, `settle`:

```ts
// Only once no dialog is left. The spinner covers every dialog, so restored while
// a dialog beneath was still up, it kept the app busy over a question nobody could
// then answer.
if (!model._openDialogs.length) {
    model.bus.unicast("BusyDisplay.SetVisibility", true);
}
```

**Verified in demo2.** `appDialogManager.test.tsx`, "busy display": "keeps the spinner hidden while a
dialog beneath the closed one is still open" (was `it.fails`) and the new "restores the spinner once the
last of nested dialogs closes". With the old `appDialogManager.tsx`, both fail.

**Status**

- **ueca-react-doc — ported in `56a2fe2`.** Before: Checked against `5a900d4`: line 47.

---

## 42. routeKey reads a port or a mailto: scheme as a path token

**Severity:** low — two routes that differ only by port key the same, and every `mailto:` route keys as
"mailto", so NavItem's active check and the Router's screen identity can confuse them. Latent: no route
in any project has a port, and `mailto:` routes never render.

**Root cause.** `routeKey` substituted `:tokens` with `/:([^/?]+)/g` over the whole address, scheme and
host included.

**Fix.** In `components/navigation/router.tsx`, `routeKey`'s return:

```ts
// Tokens are substituted after the scheme and host only. Matched over the whole address, the
// pattern read a port or a mailto: scheme as a ":param" and deleted it: https://host:8443/guide
// keyed as https://host/guide, and every mailto: route keyed as "mailto".
const origin = path.match(ROUTE_ORIGIN)?.[0] ?? "";
return origin + path.slice(origin.length).replace(/:([^/?]+)/g, (_m, name) => String(route.params?.[name] ?? ""));
```

and after the function:

```ts
// The scheme and host that start an absolute route ("https://host:8443", "mailto:"), where a colon is
// not a token.
const ROUTE_ORIGIN = /^[a-z][a-z\d+.-]*:(?:\/\/[^/?#]*)?/i;
```

App-relative (`/…`) and origin-root (`//…`) routes have no origin, so they key as before.

**Verified in demo2.** `router.test.tsx`, "routeKey": "keeps the colon of a port or a scheme, which is
not a path token" (was `it.fails`) and the new "still substitutes the path tokens of an absolute or
origin-root route". With the old `router.tsx`, both fail.

**Status**

- **ueca-react-doc — ported in `c4da0ce`.** Before: Checked against `5a900d4`: line 47. Its `mailto:` route
  keys as "mailto" today.

---

## 43. A Router given its route at creation shows nothing

**Severity:** high when used — the router renders nothing, or holds a route its table does not have.
Latent: the layouts' routers get their route after creation, through AppRouter.

**Root cause.** The view was built only in `onChangeRoute`, and unknown routes were refused only in
`onChangingRoute`. Change events are suppressed while a model initialises, so a route present at creation
went through neither.

**Fix.** In `components/navigation/router.tsx`, `onChangeRoute` becomes `onChangeRoute: () => {
_drawRoute(); }`, followed by:

```ts
// A route present at creation raised no change events — they are suppressed while a model
// initialises — so it was never vetted against the table and never drawn: the router showed
// nothing, or held a route it does not have. By mount the route has landed.
mount: () => {
    if (model.route && !_hasRoute(model.route)) {
        model.route = undefined;
        return;
    }
    _drawRoute();
},
```

and, first among the private methods:

```ts
function _hasRoute(route: AnyRoute): boolean {
    return !!model.routes && Reflect.has(model.routes, route.path);
}

function _drawRoute() {
    if (!model.route || !model.routes) {
        model._currentView = undefined;
        return;
    }
    const RouteView: RouteComp = model.routes[model.route.path];
    model._currentView = RouteView(model.route.params);
}
```

**Verified in demo2.** `router.test.tsx`, "rendering": "renders the view of a route given at creation"
and "does not accept an unknown route given at creation" (were `it.fails`), plus the new "follows a route
given at creation to the next one". With the old `router.tsx`, the two fail.

**Status**

- **ueca-react-doc — ported in `9ef71b5`.** Before: Checked against `5a900d4`: lines 80–88.

---

## 44. A Router whose table changes keeps showing the old table's view

**Severity:** medium when used — the route shows a component the router no longer has. Latent: every
Router's table is a constant.

**Root cause.** `onChangeRoutes` reset the match cache and dropped a route the new table lacks, but did
not rebuild the view for a route that survives.

**Fix.** In `components/navigation/router.tsx`, `onChangeRoutes` (needs `_drawRoute` from entry 43):

```ts
onChangeRoutes: () => {
    model.__regExRoutes = undefined; // reset routes cache
    if (model.route && model.routes && !Reflect.has(model.routes, model.route.path)) {
        model.route = undefined
        return;
    }
    // A route the new table still has is drawn from the new table. The view used to be
    // rebuilt only when the route changed, so a surviving route kept rendering the
    // component of the table that was replaced.
    _drawRoute();
},
```

**Verified in demo2.** `router.test.tsx`, "unknown routes": "renders the new table's view for a route that
survives the change" (was `it.fails`) and the new "clears the view when the new table drops the route".
With the old `onChangeRoutes`, the first fails.

**Status**

- **ueca-react-doc — ported in `a621a77`.** Before: Checked against `5a900d4`: lines 63–68.

---

## 45. The router cannot find an origin-only or mailto: route by its own key

**Severity:** medium when used — `lookupRoute` misses a registered address, so a `GoToRoute` to it falls
back to the home screen. Latent in demo2 and ueca-react-doc: their contacts and brand links use `openNewTab`
or real anchors, which do not look routes up.

**Root cause.** `_prepareRegExRoutes` built every pattern as protocol + `//` + host + path from the parsed
URL. An origin-only key (`https://cranesoft.net`) parses with the path `/`, so the pattern demanded a
trailing slash the key does not have. A `mailto:` address has no host: its whole address is the path's
first segment, which the builder drops as the empty segment before a leading slash, leaving
`/^mailto:\/\/(?:\?|$)/` for every mailto route.

**Fix.** In `components/navigation/router.tsx`, `_prepareRegExRoutes`, replace the pattern building
(from `let regEx = …` to `regEx += "(?:\\?|$)";`) with:

```ts
let regEx = "^";
const rootParams: Record<string, null | undefined> = {};
if (!routeUrl.host && !routeUrl.pathname.startsWith("/")) {
    // An address with no host, such as mailto:, is its whole path, matched as written.
    // Built like a URL with a host, the address was dropped as the empty segment before a
    // leading slash, and every mailto: route became /^mailto:\/\/(?:\?|$)/.
    regEx += _escapeRegExp(routeUrl.protocol + routeUrl.pathname);
} else {
    regEx += routeUrl.host === "_" ? "" : (routeUrl.protocol + "\\/\\/" + routeUrl.host);
    // …the existing pathParts loop, unchanged…
    if (routeUrl.host !== "_" && routeUrl.pathname === "/" && !r.split("?")[0].endsWith("/")) {
        // An origin-only address ("https://cranesoft.net") parses with the path "/", which
        // its key does not have, so the slash is optional — required, the key did not
        // match itself.
        regEx += "?";
    }
}
regEx += "(?:\\?|$)";
```

(keep the "^" comment above it), and a private helper before `_getRegExRoute`:

```ts
function _escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

App-relative and origin-root routes build exactly as before.

**Verified in demo2.** `otherLayout.test.tsx`, "lookupRoute": "resolves an origin-only address by its own
key" and "resolves a mailto address by its own key" (were `it.fails`; they now also check the trailing
slash form and that another mailto address does not match), and "resolves each registered external
address to its own route" now covers every registered address — its exclusion list is gone. With the old
`router.tsx`, all three fail.

**Status**

- **ueca-react-doc — ported in `b9e091c`.** Before: Checked against `5a900d4`: lines 129–141. It registers
  `https://cranesoft.net` and `mailto:cranesoft@protonmail.com`.

---

## 46. GoToRoute to an external address blanks the whole app

**Severity:** high when hit — the menu and the screen disappear, leaving a blank page, while the address
opens in a new tab. Latent: every external link in demo2 and ueca-react-doc uses `openNewTab` or a real anchor,
not `GoToRoute`.

**Root cause.** An absolute URL is an OtherLayout route, so `_changeRoute` made OtherLayout the active
layout. AppBrowsingHistory diverts a foreign URL to a new tab, and OtherLayout's external routes draw
nothing (`() => null`), contradicting appRoutes.tsx: "an absolute URL opens in a new tab and never mounts
OtherLayout". Before entry 45, an origin-only address was not found at all and routed to Home instead.

**Fix.** In `core/infrastructure/appRouter.tsx`, the two navigation messages call a new
`_goToRoute(route, true)` / `_goToRoute(route, false)` instead of `_changeRoute`, defined after
`_changeRoute`:

```ts
// A route the app asks for. An address on another origin opens in a new tab and the screen on
// show stays: nothing is left, so nothing is asked or announced. Routed like any other, it made
// OtherLayout — whose external routes draw nothing — the active layout while the address went to
// a new tab, and the whole shell went blank. (Startup and Back/Forward read this page's own
// address, which is never foreign.)
async function _goToRoute(route: AppRoute, historyTrack: boolean) {
    if (_isForeign(route)) {
        await model.bus.unicast("App.BrowsingHistory.Open", { path: UECA.clone(route), newTab: true });
        return true;
    }
    return await _changeRoute(route, historyTrack);
}
```

and after `_withSection`:

```ts
// An absolute address whose origin is not this one ("https://…" elsewhere, "mailto:…"). App-relative
// and origin-root paths start with "/".
function _isForeign(route: AppRoute): boolean {
    const path = route?.path as string;
    if (!path || path.startsWith("/")) {
        return false;
    }
    try {
        return new URL(path).origin !== window.location.origin;
    } catch {
        return false;
    }
}
```

`BeforeRouteChange` guards are not asked: the screen with unsaved changes stays where it is.

**Verified in demo2.** `appRouter.test.tsx`, "opens an external route without blanking the screen on
show", and `services.test.tsx`, "App.Router.GoToRoute to https://cranesoft.net opens the site in a new tab
and stays on the screen" and "… to a registered external page opens it in a new tab and keeps the shell on
show" (all three were `it.fails`), plus the new "GoToRoute / SetRoute to a foreign address opens a new
tab, asking no guard and announcing nothing". With the old `appRouter.tsx`, all five fail; the startup
and Back/Forward tests that feed it an external address pass either way.

**Status**

- **ueca-react-doc — ported in `5e5b366`.** Before: Checked against `5a900d4`: lines 34, 36, 58 and 176.

---

## 47. AppLayout keeps a route its router refused

**Severity:** medium when hit — UECA reports a binding that "did not settle" (an error dialog), and
AppRouter answers `GetRoute` with a route that is not showing. Latent now that entry 46 keeps external
addresses out of the layouts; before it, any address `lookupRoute` claimed could reach this.

**Root cause.** The layout's `route` was a plain prop, bound two-way into the router's params. When the
router's `onChangingRoute` refused a route, nothing at the source refused it too (UECA's re-convergence
guidance asks for that), so the binding kept re-delivering it.

**Fix.** In `core/appLayout/appLayout.tsx`, bind the layout's prop through to the router, as
OtherLayout does, and drop the router's `route` param (and the now unused `AnyRoute` import):

```tsx
props: {
    id: useAppLayout.name,
    // The router's own route, read and written through, as OtherLayout's is: a route the
    // router refuses is never taken, so the layout cannot hold one that is not showing.
    // Bound the other way — this prop fed into the router's params — nothing at the source
    // refused what the router's onChangingRoute rejected, and the binding retried until UECA
    // reported it had not settled.
    route: UECA.bind(() => model.router.route as ScreenRoute, (newRoute) => { model.router.route = newRoute; })
},

children: {
    sideBar: useAppSideBar(),

    router: useRouter({
        routes: screenRoutes
    })
},
```

A route given to the layout at creation now reaches the router while it initialises, which entry 43's
`mount` hook draws — port 43 first.

**Verified in demo2.** `appLayout.test.tsx`, "keeps its route in step with the router when the router
refuses one" (was `it.fails`); with the old `appLayout.tsx` it fails, and the layout's other tests —
including "follows the router when the router changes route itself" — pass either way.

**Status**

- **ueca-react-doc — ported in `4963cef`.** Before: Checked against `5a900d4`: lines 2, 27 and 35.

---

## 48. An unknown selectedTabId leaves no tab selected and a blank panel

**Severity:** medium when hit — the tab strip shows nothing selected and the content area is empty.
Latent: it needs a route change that hands a mounted tabbed screen an id naming no tab, as a screen that
passes the route's `tab` into `selectedTabId` on `AfterRouteChange` would get from a link with a bad id;
a reload with a bad `?tab=` goes through start-up, which already falls back.

**Root cause.** The `selectedTabId` setter looked the id up and assigned the result, `undefined` for an id
that names no tab. The fallback to the first tab lives in `_initTabs`, which runs only when the tabs
change; a stale id given at start-up falls back, one set later did not.

**Fix.** In `components/tabs/tabsContainer/tabsContainer.tsx`, the setter:

```ts
// An id that names no tab falls back to the first, as it does at start-up.
// Looked up alone, it deselected every tab and blanked the panel — a stale
// ?tab= in a route a TabsScreen binds did exactly that.
model.selectedTab = (v && model.getTab(v)) || model.tabs[0];
```

The first tab is then what `selectedTabId` reads back, so a bound route is corrected to it.

**Verified in demo2.** `tabsContainer.test.tsx`: "keeps a tab selected when selectedTabId is set to an id
that names no tab" (was `it.fails`) and the new "falls back to the first tab, and reports it, for an id
that names no tab". With the old setter, both fail.

**Status**

- **ueca-react-doc — ported in `e8e1f0e`.** Before: Checked against `5a900d4`: line 57.

---

## 49. A TabsContainer with config tabs ignores the selectedTabId it starts with

**Severity:** medium when used — the container opens on its first tab, and a bound `selectedTabId`
source is overwritten with it (a deep link to a tab loses the tab). Latent: the tabbed screens in the
projects give their tabs as models (`tabs`), not as `tabsConfig`.

**Root cause.** Config tabs are created by the first render, but `init` runs `_initTabs` before that, over
an empty list. It looked the parked `__defaultTabId` up there, found nothing, discarded it, and the
fallback selected the first tab once the tabs appeared.

**Fix.** In `components/tabs/tabsContainer/tabsContainer.tsx`, `_initTabs`:

```ts
if (model.__defaultTabId) {
    // Config tabs are created by the first render, after init has already run this over an
    // empty list, so the id waits until its tab exists — or until every configured tab does
    // and it names none. Looked up at once, it was discarded, the first tab was selected, and
    // a bound selectedTabId source was overwritten with it.
    const defaultTab = model.getTab(model.__defaultTabId);
    if (defaultTab || !_configTabsPending()) {
        model.__defaultTabId = undefined; // Clear after use, so it used only once
        model.selectedTab = defaultTab;
    }
}
```

and before `_configTabId`:

```ts
// Whether configured tabs are still to be created by the render.
function _configTabsPending(): boolean {
    return (model.tabsConfig?.length ?? 0) > (model.tabs?.length ?? 0);
}
```

Tabs given as models are all there at `init`, so they are never pending and behave as before.

**Verified in demo2.** `tabsContainer.test.tsx`, "starts on the selectedTabId it was given among its
config tabs" (was `it.fails`) and the new "starts on the first config tab when the selectedTabId it was
given names none". With the old `_initTabs`, the first fails.

**Status**

- **ueca-react-doc — ported in `141efd5`.** The fallback to the first tab now tests the tab list directly: through `selectedTabIndex` a start-up id that named no tab left nothing selected. Before: Checked against `5a900d4`: line 275 (the id at 280–284).

---

## 50. selectedTabId keeps reporting a start-up id that named no tab

Found while fixing entry 49; not one of the pinned bugs.

**Severity:** low to medium — the tab strip shows the first tab, but `selectedTabId` still reads the id
that named nothing, so a bound source (a route's `?tab=`) is never corrected to the tab on show. Happens
before entry 49 too.

**Root cause.** `selectedTabId`'s getter reads the parked id first (`__defaultTabId ?? selectedTab?.getTabId()`),
and the parked id was a non-reactive `__` prop. Using it up did not make the getter look again, and the
selection it fell back to could be the one already chosen, so nothing else did either.

**Fix.** In `components/tabs/tabsContainer/tabsContainer.tsx`, rename `__defaultTabId` to the reactive
`_defaultTabId` everywhere (the type, the getter, the setter and `_initTabs`), declare it with a default —
`_defaultTabId: undefined,` after `_hasOverflow` (an undeclared prop is not observable) — and comment the
type:

```ts
// A selectedTabId waiting for its tab to exist. Reactive, because selectedTabId reads it
// first: as a non-reactive prop, using it up did not make that read look again, and the id
// went on being reported after another tab was selected in its place.
_defaultTabId: string;
```

**Verified in demo2.** `tabsContainer.test.tsx`, the new "reports the tab it fell back to through
selectedTabId"; with the non-reactive prop it fails, and every other TabsContainer and TabsScreen test
passes either way.

**Status**

- **ueca-react-doc — ported in `a298768`.** Before: Checked against `5a900d4`: lines 23, 54, 59 and 280–282.

---

## 51. A TabsScreen's Add button does nothing

**Severity:** medium when used — an add intent shows the Add button, and clicking it runs nothing. Latent:
no TabsScreen in the projects uses an add intent.

**Root cause.** TabsScreen declares `onAdd` (from `CRUDScreenEvents`) but forwarded every CRUD event to its
inner CRUDScreen except that one.

**Fix.** In `core/screenLayout/tabsScreen.tsx`, among the events passed to `useCRUDScreen`, before
`onRefresh`:

```ts
// Every CRUD event is forwarded. onAdd was missing, so the Add button an add intent
// shows did nothing and the screen's handler never ran.
onAdd: async () => await model.onAdd?.(),
```

**Verified in demo2.** `tabsScreen.test.tsx`, "raises onAdd from the Add button of an add intent" (was
`it.fails`); with the old `tabsScreen.tsx` it fails.

**Status**

- **ueca-react-doc — not present; not ported.** Corrected after checking: its CRUDScreen has no add intent, no `onAdd` and no `add()`, and TabsScreen already forwards every CRUD event it has. Before: Checked against `5a900d4`: line 41.

---

## 52. Four of a TabsScreen's CRUD methods are missing at runtime

**Severity:** high when used — `add()`, `goToParentScreen()`, `scheduleSetRoute()` and
`scheduleGoToRoute()` type-check and throw "is not a function". Latent: no TabsScreen owner calls them.

**Root cause.** `TabsScreenModel`'s type promises every `CRUDScreenMethods` member, but the struct forwarded
only some of them to its inner CRUDScreen.

**Fix.** In `core/screenLayout/tabsScreen.tsx`, the `methods` section, with a comment above it:

```ts
// Every CRUDScreenMethods member the model's type promises. add, goToParentScreen,
// scheduleSetRoute and scheduleGoToRoute were missing, so a call that type-checked threw
// "is not a function".
```

adding, in `CRUDScreenMethods` order:

```ts
add: async () => await model.crudScreen.add(),
goToParentScreen: async (redirect) => await model.crudScreen.goToParentScreen(redirect),
scheduleSetRoute: (route) => model.crudScreen.scheduleSetRoute(route),
scheduleGoToRoute: (route) => model.crudScreen.scheduleGoToRoute(route),
```

**Verified in demo2.** `tabsScreen.test.tsx`, "goes to the parent screen like the CRUD screen it wraps"
(was `it.fails`) and the new "adds and schedules routes like the CRUD screen it wraps". With the old
`tabsScreen.tsx`, both fail.

**Status**

- **ueca-react-doc — ported in `fc6d6b5`.** Only `goToParentScreen`: its CRUDScreenMethods has no `add`, `scheduleSetRoute` or `scheduleGoToRoute`. Before: Checked against `5a900d4`: lines 53–62.

---

## 53. A TabsScreen drops the contentPaddings it is given

**Severity:** low — the tabs sit in the default padding whatever the screen asks for. Latent: no TabsScreen
in the projects sets `contentPaddings`.

**Root cause.** `contentPaddings` is in TabsScreen's props type (`Omit<CRUDScreenProps, "contentView">`)
but was neither declared nor bound to the inner CRUDScreen.

**Fix.** In `core/screenLayout/tabsScreen.tsx`, after the `actionButtonText` binding:

```ts
// Part of the props type like the rest, but neither declared nor bound, so a value given
// here was dropped and the tabs always sat in the default padding.
contentPaddings: UECA.bind(() => model.crudScreen, "contentPaddings"),
```

**Verified in demo2.** `tabsScreen.test.tsx`, "applies the content paddings it is given" (was
`it.fails`) and the new "follows content paddings that change after mounting". With the old
`tabsScreen.tsx`, both fail.

**Status**

- **ueca-react-doc — ported in `000e8d3`.** Before: Checked against `5a900d4`: line 35.

---

## 54. The REST client empties the params object a caller passes

**Severity:** medium when hit — reusing a params object for a second request (a retry, a refresh) fails
with 'Parameter "id" not found', and the caller's object has lost its path values. Latent: neither demo2 nor
ueca-react-doc calls its client today.

**Root cause.** `_replaceDynamicParams` deletes each path param it consumes from the object it is given,
and `_createRequestURL` gave it the caller's object.

**Fix.** In `src/api/restApiClient.ts`, `_createRequestURL`:

```ts
// A copy: substitution deletes each path param it consumes. Handed the caller's object, it
// emptied it, and the same params used again — a retry, a refresh — failed with
// 'Parameter "id" not found'.
const { updatedUrl, updatedParams } = this._replaceDynamicParams(url, { ...params });
```

**Verified in demo2.** `restApiClient.test.ts`, "leaves the caller's params untouched, so they can be
reused" (was `it.fails`); with the old line it fails.

**Status**

- **ueca-react-doc — ported in `c7309af`.** Before: Checked against `5a900d4`: line 113.

---

## 55. An undefined or null REST path value goes into the URL as text

**Severity:** medium when hit — `get("/users/:id", { id: undefined })` requests `/users/undefined` instead
of failing, reaching the wrong resource or a confusing server error. Latent: neither demo2 nor
ueca-react-doc calls its client today.

**Root cause.** `_replaceDynamicParams` checked that the params had the key, not that it had a value, and
`JSON.stringify(undefined)` / `JSON.stringify(null)` were spliced into the path.

**Fix.** In `src/api/restApiClient.ts`, `_replaceDynamicParams`, the condition:

```ts
// A value, not merely a key: undefined and null are as missing as an absent key. Checked
// for the key alone, they went into the path as the text "undefined" or "null", and the
// request went to /users/undefined instead of failing.
if (updatedParams[paramName] != null) {
```

The existing `throw new Error(\`Parameter "${paramName}" not found. URL: ${url}\`)` now covers them; `0`
and `false` are still values.

**Verified in demo2.** `restApiClient.test.ts`, "treats an explicit undefined / null path value as
missing" (was `it.fails.each`); with the old condition both fail.

**Status**

- **ueca-react-doc — ported in `a0321d3`.** Before: Checked against `5a900d4`: line 101.

---

## 56. A REST path value with "?", "/" or "#" sends the request elsewhere

**Severity:** high when hit — silently the wrong resource: `get("/files/:name", { name: "what?.txt" })`
requests `/files/what`, and a "/" in a value adds a path segment. Latent: neither demo2 nor
ueca-react-doc calls its client today.

**Root cause.** `_replaceDynamicParams` spliced path values into the URL unencoded.

**Fix.** In `src/api/restApiClient.ts`, `_replaceDynamicParams`, the substitution's return:

```ts
// Encoded, so the value stays one path segment. Spliced in as it was, a "?" started the
// query (which the search assignment then overwrote) and a "/" or "#" moved the
// request somewhere else: "what?.txt" requested /files/what.
return encodeURIComponent((typeof parameter === "string") ? parameter : JSON.stringify(parameter));
```

A server receives the decoded value as before; only characters that were changing the URL's shape are
now escaped.

**Verified in demo2.** `restApiClient.test.ts`, "URLs": "keeps a '?' inside a path value in the path"
(was `it.fails`) and the new "keeps a path value with a slash / a hash / a percent sign / a space in one
segment". With the old line, all but the space case fail.

**Status**

- **ueca-react-doc — ported in `11546cb`.** Before: Checked against `5a900d4`: line 104.

---

## 57. A downloaded File the server does not name is called "undefined"

**Severity:** low when hit — a saved download is literally named "undefined". Latent: neither demo2 nor
ueca-react-doc calls its client today.

**Root cause.** `_getFileName` returns `undefined` when no `content-disposition` names the file, and
`new File([blob], undefined)` turns that into the string "undefined".

**Fix.** In `src/api/restApiClient.ts`, `_processBlob`:

```ts
// Unnamed by the server, the file gets an empty name, which a caller can tell apart and a
// browser saves under its own default. new File([blob], undefined) named it "undefined".
const fileName = this._getFileName(response) ?? "";
```

**Verified in demo2.** `restApiClient.test.ts`, "does not name a file "undefined" when the response has
no content-disposition / a disposition without a filename / an empty disposition" (was `it.fails.each`;
now also checks the empty name and the content). With the old line, all three fail.

**Status**

- **ueca-react-doc — ported in `9816a77`.** Before: Checked against `5a900d4`: lines 165–169.

---

## 58. An empty REST error body gives a SyntaxError or a blank message

The error-path twin of entry 24.

**Severity:** medium when hit — the request still fails, but the error dialog says "Unexpected end of JSON
input", or nothing at all (on HTTP/2, not even a name). Reached by an error response with no body and no
`content-length: 0` (a chunked or HTTP/2 response).

**Root cause.** The error path read a body unless it declared `content-length: 0`: as JSON when it declared
JSON (`response.json()` on "" throws), otherwise as text, throwing with that empty text as the message.

**Fix.** In `src/api/restApiClient.ts`, `_processResponse`, the `!response.bodyUsed` branch:

```ts
if (!response.bodyUsed) {
    // Read as text first, as a success is: an empty body need not declare content-length 0.
    // Parsed as JSON it rejected with a SyntaxError, and read as text it gave a blank
    // message, where an empty error should name its status below.
    const errorText = this._isContentLengthIsZero(response) ? "" : await response.text();
    if (errorText) {
        if (this._isJson(response)) {
            const errorObject = JSON.parse(errorText);
            throw new DetailedError(response.statusText, errorObject.errorText, errorObject.errorDetails, errorObject.errorCallStack);
        }
        throw new DetailedError(response.statusText, errorText);
    }
} else {
```

An empty error then reaches entry 13's closing throw, which names the status.

**Verified in demo2.** `restApiClient.test.ts`, "errors": "names the status for an error whose empty body
is declared JSON / of no declared type but not declared empty" (was `it.fails.each`) and the new "names
the status of an empty HTTP/2 error, which has no status text". With the old branch, all three fail.

**Status**

- **ueca-react-doc — ported in `38202f7`.** Before: Checked against `5a900d4`: lines 186–195, and it lacks entry 13
  too.

---

## 59. Following a link with a null route parameter throws

**Severity:** medium when hit — `ResolveRoute` gives the link an href, but clicking it throws "Cannot read
properties of null (reading 'toString')" (an error dialog), and a null path parameter throws that
TypeError instead of naming the parameter.

**Root cause.** AppBrowsingHistory still resolved navigation through its own private `_routeToURL`, a copy
of the rules from before `routeURL.ts` was fixed to treat `null` as absent. `ResolveRoute` already used
`routeURL.ts`, so the two disagreed.

**Fix.** In `core/infrastructure/appBrowsingHistory.ts`, delete the private `_routeToURL`, import
`routeToURL` beside `resolveRouteURL`, and call `routeToURL(route, model.__baseURL)` in `open` and
`replace`, and `routeToURL({ path: route }, model.__baseURL)` in `_navigate`. Above the import:

```ts
// Navigation and ResolveRoute resolve through the same rules. Navigation used to keep a private copy
// of the rules from before routeURL.ts was fixed, so a link that resolved with a null parameter threw
// when it was followed.
```

**Verified in demo2.** `appBrowsingHistory.test.tsx`, "Open": "omits a query parameter whose value is
null, as ResolveRoute does" and "rejects a null path parameter by name, as the strict resolver does"
(were `it.fails`). With the old file, both fail.

**Status**

- **ueca-react-doc — ported in `e8f0674`.** `core/misc/routeURL.ts` came over as it is in demo2 (its unused `resolveRouteURL` included), and the private copy is gone. Before: Checked against `5a900d4`: it has no
  `core/misc/routeURL.ts` and no `ResolveRoute`; its `core/infrastructure/appBrowsingHistory.ts` resolves
  only through the private copy (line 225, called at lines 83, 98 and 282), which throws the same TypeError
  for a null parameter. Port demo2's `routeURL.ts` (with entry 61) and then this change.

---

## 60. A string route opens outside the app in a new tab, and throws in Replace

**Severity:** medium when hit — `Open` with `newTab` hands `"/home"` to `window.open` unresolved, so the tab
opens at the origin root (a 404 when the app lives under a base such as GitHub Pages), and `"//docs/x"`
opens on host "docs"; `Replace` with an app-relative string throws "Invalid URL". Latent: the projects
pass route objects, not strings.

**Root cause.** `open` and `replace` resolved a route only when it was an object; `routeURL.ts` says a bare
string must still be resolved, since only its app-relative form gains the base.

**Fix.** In `core/infrastructure/appBrowsingHistory.ts` (after entry 59), both methods resolve either form:

```ts
open: async (route, newTab) => {
    // A string route is resolved too: only its app-relative form gains the base, and
    // routeURL.ts leaves every other form as it is. Handed to window.open as it was,
    // "/home" opened at the origin root, outside the app, and "//docs/x" on host "docs".
    route = routeToURL(UECA.isObject(route) ? route : { path: route }, model.__baseURL);
```

```ts
replace: async (route) => {
    // Resolved like Open's. Used as it was, an app-relative string reached `new URL()` in
    // _divertCrossOrigin without a base and threw "Invalid URL".
    route = routeToURL(UECA.isObject(route) ? route : { path: route }, model.__baseURL);
```

Resolving an already absolute URL again (as `_navigate` does) returns it unchanged.

**Verified in demo2.** `appBrowsingHistory.test.tsx`: "opens an app-relative string path in a new tab
inside the app" and "resolves an app-relative string path the way Open does" (were `it.fails`), plus the
new "opens an origin-root / an absolute string in a new tab where routeURL.ts resolves it". With the old
methods, all but the absolute case fail.

**Status**

- **ueca-react-doc — ported in `1033a0c`.** Before: Checked against `5a900d4`: `open` at lines 83–90 and
  `replace` at line 98; port after entry 59.

---

## 61. A route's query value with "&" or "+" is corrupted when another placeholder follows

**Severity:** medium when hit — `{ path: "/search?:q&:page", params: { q: "tom & jerry" } }` navigates to
`?q=tom%20&%20jerry=&page=1`: the search reads "tom " and a stray parameter appears; a literal `%26` on the
path is decoded into a separator too. Latent: no route in the projects has two query placeholders with
such values.

**Root cause.** `_buildURL` deleted each placeholder through `url.searchParams` and then ran
`decodeURIComponent` over the whole search string (to undo the re-serialisation), which decoded values
already written for earlier placeholders, and literal values, a second time.

**Fix.** In `core/misc/routeURL.ts`, replace the search-params block with a single pass over the raw query:

```ts
// Process search params. The query is edited as raw text, pair by pair: every other pair stays
// exactly as written, and each "?:name" placeholder becomes name=value, encoded once, after them —
// or is dropped when absent. Re-serialised through searchParams after each placeholder, the whole
// query was decoded again: an earlier value's "&" split into a new pair and its "+" turned into a
// space, and a literal "%26" on the path became a separator too.
if (url.search) {
    const literals: string[] = [];
    const filled: string[] = [];
    for (const pair of url.search.slice(1).split("&")) {
        const key = _decodeQueryPart(pair.split("=")[0]);
        if (!key.startsWith(":")) {
            literals.push(pair); // don't process non-placeholder parameters
            continue;
        }
        const name = key.slice(1); // strip symbol ':' from param placeholder
        const value = routeParams[name];
        if (!_isAbsent(value)) {
            filled.push(`${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`);
        }
    }
    url.search = [...literals, ...filled].join("&");
}
```

and before `_buildURL`:

```ts
// A query key as URLSearchParams reads it: "+" is a space, then percent-decoded.
function _decodeQueryPart(text: string): string {
    try {
        return decodeURIComponent(text.replace(/\+/g, " "));
    } catch {
        return text;
    }
}
```

Filled placeholders still follow the literal pairs, as `searchParams.set` put them; a value's spaces are
now written `%20` rather than `+`, which reads back the same.

**Verified in demo2.** `routeURL.test.ts`, "query placeholders": "keeps an earlier placeholder's value intact
when another placeholder follows" and "keeps an encoded literal query value intact when the route has a
placeholder" (were `it.fails`), plus the new "encodes a placeholder value with query separators and a hash
once". With the old block, all three fail; the other placeholder tests, including "resolves the same URL as
resolveRouteURL" and its parameter order, pass either way.

**Status**

- **ueca-react-doc — ported in `6ba4a67`.** In the ported `routeURL.ts`. Before: Checked against `5a900d4`:
  `core/infrastructure/appBrowsingHistory.ts` line 272. Porting `routeURL.ts` for entry 59 brings this fix
  with it.

---

## 62. A vetoed navigation rolled back in place loses the anchor on show

**Severity:** low — the page stays where it is, but its address drops the `#section`, so a reload or a
copied link no longer lands on the anchor. Reached when a veto (unsaved changes) refuses a hash-only or
externally pushed entry, which has no distance to travel back.

**Root cause.** The in-place rollback rebuilt the URL from `__baseURL + __activePath` and left out
`__activeSection`, although a section is part of the address everywhere else in AppBrowsingHistory.

**Fix.** In `core/infrastructure/appBrowsingHistory.ts`, `_browserNavigation`, the delta-0 branch:

```ts
// …the URL in place instead — section included, as it is everywhere else in this
// service. Rebuilt from the path alone, the anchor still on show left the address.
const restored = new URL(model.__baseURL + model.__activePath, window.location.origin);
if (model.__activeSection) {
    restored.hash = model.__activeSection;
}
history.replaceState({ index: model.__currentHistoryIndex }, "", restored.href);
```

**Verified in demo2.** `appBrowsingHistory.test.tsx`, "restores the section too when rolling a vetoed
entry back in place" (was `it.fails`); with the old line it fails, and "restores the URL in place, never
with history.go(0)…" passes either way.

**Status**

- **ueca-react-doc — ported in `b362c02`.** On top of entry 11's in-place rollback. Before: Checked against `5a900d4`: the same `history.go` at line 221.

---

## 63. AppBrowsingHistory brought back from the model cache ignores Back and Forward

**Severity:** high when hit — Back and Forward change the address but the app stays on its screen.
Latent: AppBrowsingHistory lives in Application, which is never parked.

**Root cause.** `deinit` detaches the popstate listener and says a following `init` may re-add it, but the
listener was attached only by `syncWithBrowser` in `constr`, which does not run again for a model taken
from the cache.

**Fix.** In `core/infrastructure/appBrowsingHistory.ts`, at the start of `init`:

```ts
// Brought back from the model cache, the model has had its listener detached by deinit,
// and constr — the only other place it is attached — does not run again: Back and
// Forward went unheard. Syncing again also catches up with an address that moved while
// it was parked. On first activation constr has just done this, so it is skipped.
if (!model.__popstateHandler) {
    model.syncWithBrowser();
}
```

**Verified in demo2.** `appBrowsingHistory.test.tsx`, "popstate listener": "keeps following Back and
Forward after being parked in the cache and brought back" (was `it.fails`) and the new "catches up with
the address when brought back, listening once". With the old `init`, both fail.

**Status**

- **ueca-react-doc — ported in `6bec7c6`.** Before: Checked against `5a900d4`: `constr` at line 118 is the only
  attach; `init` follows it.

---

## 64. A focused virtualized Table rings itself once the current row scrolls away

> **Superseded by entry 72**, which removes the ring this entry guards. Do not port it; port entry 72.

**Severity:** medium. Visible in demo2: Showcase › Data, the 5,000-row table.

**Symptom.** Click a row, press an arrow key, then drag the scrollbar away from the row: a 2px focus ring
comes on around the table, drawn only on its right and bottom edges — the sticky header and the pinned
column paint over the other two.

**Root cause.** The ring is the fallback for a focused table with no keyboard cursor, and its guard was
a test on the DOM, `:not(:has(.ueca-table-body-row.current))`. A virtualized table unmounts the current
row once it leaves the rendered window, so the guard stopped seeing a cursor that was still there.

**Fix.** Answer it from the model. In `components/data/table/table.tsx`, the View's class list:

```tsx
const className = "ueca-table"
    + (model.virtualized ? " virtualized" : "")
    + (model.stickyFirstColumn ? " sticky-first" : "")
    + (_hasCurrentRow() ? " has-current" : "");
```

and after `_isSelectable`:

```ts
// Whether the keyboard cursor stands on a displayed row, which is what spares a focused table
// its container ring (table.css). Answered from the model rather than by looking for the
// `.current` row in the DOM: a virtualized table unmounts that row once it scrolls out of the
// window, so dragging the scrollbar away from it switched the ring on.
function _hasCurrentRow(): boolean {
    if (!_isSelectable() || model.selectedKey === undefined) {
        return false;
    }
    return model.displayRows().some((row, i) => rowKeyOf(model, row, i) === model.selectedKey);
}
```

In `table.css` the ring's selector becomes `.ueca-table:focus-visible:not(.has-current)` (update the
comment above it the same way).

**Verified in demo2.** `table.test.tsx`: "says whether the keyboard cursor stands on a displayed row" and
"keeps reporting a current row that has scrolled out of its window" fail without the fix; "has no cursor
while its rows cannot be selected" guards the other side. In the browser, with the old rule injected back
the same state computes the inset ring; with the fix it computes none. A scrollbar drag alone focuses the
table without matching `:focus-visible`, so it never showed the ring by itself.

**See also entry 68.** Where the ring is meant to show — keyboard focus with no current row, which
Chromium also grants for any key pressed after the scrollbar focused the table, Escape included — the
sticky header and pinned column still covered its top and left edges; entry 68 draws it on all four.

**Status**

- **ueca-react-doc — not present.** It has no Table.

---

## 65. A resizable Table whose columns fill it exactly scrolls sideways by 4px

**Severity:** low. Visible in demo2: Playground › Table at 1440px with the sidebar open, once its columns
fitted the preview (a horizontal scrollbar for 4px).

**Root cause.** Each header's resize handle hangs 4px past its cell (`right: -4px`), into the next cell.
After the last column the next cell is the filler track, and the filler can be 0px: a `minmax()` column
takes the free space before the flexible filler gets any, and a theme can collapse the filler with
`--table-filler-track: 0`. The handle then reaches past the table's content and widens what scrolls.

**Fix.** In `components/data/table/table.css`, after the `.ueca-table-header-cell { overflow: visible; }`
rule:

```css
/* …except past the last column, where the next cell is the filler, and the filler can be 0px wide:
   a minmax() column takes the free space before a flexible track gets any. A handle hanging past
   the table's content then widened what scrolls, so a table whose columns filled it exactly
   scrolled sideways by 4px. The last handle stays inside its cell, its line on the cell's edge. */
.ueca-table-header-cell:nth-last-child(2) > .ueca-table-resize-handle {
    right: 0;
}

.ueca-table-header-cell:nth-last-child(2) > .ueca-table-resize-handle::after {
    left: auto;
    right: 0;
}
```

**Verified in demo2.** By hand — jsdom does no layout. Playground › Table at 1440px, sidebar open:
`scrollWidth` 705 against `clientWidth` 701 before, 701 after; no overflow at 1920, 1366 or 1024px either.

**Status**

- **ueca-react-doc — not present.** It has no Table.

---

## 66. Showcase › Data: the 5,000-row table is narrower than the tables around it

**Severity:** low — demo content.

**Symptom.** "Virtualized + multi-select + pinned column" stops at 640px while the tables above and below
it span the page. Its description also says the Site column stays pinned; the pinned column is `#`, the
first.

**Root cause.** The frame was capped with `maxWidth={640}` so that the table's seven columns would scroll
sideways under the pinned one. Uncapped, they fit the page and nothing scrolls.

**Fix.** In `screens/showcase/topics/dataTopic.tsx`:

- drop `maxWidth={640}` from the feature table's `showcase-table-frame`;
- give `Site` four fields, generated in `_sites`, and show them in the feature table only, so its columns
  (1,332px at their minimum) outgrow the widest frame the 1180px band allows:

```ts
const FIRMWARE = ["4.2.1", "4.3.0", "5.0.2"];

// The station-health columns only the feature table shows. They make it wider than the page can
// ever be, so at any window size there are columns to scroll under its pinned first column.
const HEALTH_COLUMNS: TableColumn<Site>[] = [
    { key: "battery", titleView: "Battery (V)", field: "battery", dataType: "number", decimals: 1, sortable: true, width: 110 },
    { key: "signal", titleView: "Signal (dBm)", field: "signal", dataType: "number", sortable: true, width: 120 },
    { key: "alarms", titleView: "Alarms", field: "alarms", dataType: "number", sortable: true, width: 90 },
    { key: "firmware", titleView: "Firmware", field: "firmware", sortable: true, width: 110 }
];

// in _sites:
battery: (118 + ((i * 23) % 22)) / 10,
signal: -58 - ((i * 31) % 51),
alarms: Math.max(0, ((i * 11) % 9) - 5),
firmware: FIRMWARE[(i * 5) % FIRMWARE.length]

// featureTable:
columns: () => [
    ...model._columns().map((c: TableColumn<Site>) => ({ ...c, actionView: undefined as typeof c.actionView })),
    ...HEALTH_COLUMNS
],
```

- end the description with "The first column stays pinned while the others scroll under it."

**Verified in demo2.** `dataTopic.test.tsx`, "spans the page like its neighbours, with columns to scroll
under the pinned one" fails with the old file. In the browser at 1920px all four frames are 1100px wide and
the feature table scrolls 248px sideways.

**Status**

- **ueca-react-doc — not present.**

---

## 67. Row numbers past 999 lose their last digit

**Severity:** medium — the table shows wrong numbers. Visible in demo2: Showcase › Data, the 5,000-row
table, where rows 1,292–1,298 all read "129".

**Root cause.** The `#` column is 56px. The cell keeps 16px of padding on each side, which leaves 24px,
and a 13px IBM Plex Sans digit is 7.8px wide: three digits fit, four (31.2px) do not. The number is a
`<Block>` inside the cell's clipping span, so that span's ellipsis never engages and the last digit is cut
without a trace.

**Fix.** Size the column for the largest row number. In `screens/showcase/topics/dataTopic.tsx`, `_columns`:

```ts
key: "rowNumber",
titleView: "#",
// Room for four digits, the feature table's 5,000. At 56px, 13px digits fitted
// three inside the cell padding: rows 1,292–1,298 all read "129".
width: 72,
```

demo2's Table playground had the same fault at 64px for its 10,000 rows (row 10,000 read "1000") and now
uses 80px; neither reference project has that playground.

**Verified in demo2.** "leaves the row-number column room for its last row number" (`dataTopic.test.tsx`)
and "leaves the row-number column room for the largest row count" (`tablePlayground.test.tsx`) fail with
the old widths. In the browser rows 4,997–5,000 read whole.

**Status**

- **ueca-react-doc — not present.**

---

## 68. A focused Table's ring is cut off on two edges

> **Superseded by entry 72**, which removes the ring. Port only this entry's observer — `_observeViewport`
> for every mounted table and `_syncViewport` publishing `--table-viewport-w` (not `-h`) — which entry 70
> uses; skip the ring element and its CSS.

**Severity:** low — the focus ring shows on the right and bottom edges only. Visible in demo2: Showcase ›
Data, the 5,000-row table: drag its scrollbar, then press Escape.

**Root cause.** The ring was an inset `box-shadow` on the grid, and the grid is its own scroll container:
its sticky header cells and pinned-column cells paint over anything drawn on it, including an `outline`
(tried). What stayed visible was the strip beside the scrollbars.

**Fix.** Draw the ring on an element of its own, pinned to the viewport's top-left corner and sized to the
viewport, above every sticky cell. In `components/data/table/table.tsx`:

- render `{_isSelectable() && <div className="ueca-table-ring" aria-hidden="true" />}` as the grid's first
  child;
- watch the viewport for every mounted table, not only a virtualized one, and publish its size. This
  replaces entry 26's `onChangeVirtualized` / `mount` pair:

```tsx
events: {
    // A table switched to virtualized after mounting — the Table playground's "Virtualized"
    // switch — sizes its window now rather than on the next scroll, which left a first page
    // of 30 rows, and a blank band below them in a taller viewport.
    onChangeVirtualized: () => {
        _syncViewport();
    }
},

mount: () => {
    _observeViewport();
},
```

```ts
// Measures the viewport now, and again whenever it resizes. Only a mounted table has one; an
// unmounted table is measured when it mounts.
function _observeViewport() {
    const el = model.__rootRef.current;
    if (!el || model.__resizeObserver) {
        return;
    }
    model.__resizeObserver = new ResizeObserver(() => { _syncViewport(); });
    model.__resizeObserver.observe(el);
    _syncViewport();
}

// What the viewport's size feeds: the virtualized window, and the focus ring, which table.css
// draws to --table-viewport-w/-h because it cannot take its size from the scrolling grid.
function _syncViewport() {
    const el = model.__rootRef.current;
    if (!el) {
        return;
    }
    el.style.setProperty("--table-viewport-w", `${el.clientWidth}px`);
    el.style.setProperty("--table-viewport-h", `${el.clientHeight}px`);
    model.__derived.viewportH = el.clientHeight;
    updateWindow(model);
}
```

(`_stopObservingViewport` stays, called from `unmount`.) In `table.css`, the ring rule becomes:

```css
.ueca-table-ring {
    grid-row: 1;
    grid-column: 1 / -1;
    position: sticky;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    z-index: 4;
    pointer-events: none;
}

.ueca-table:focus-visible:not(.has-current) > .ueca-table-ring::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: var(--table-viewport-w);
    height: var(--table-viewport-h);
    box-shadow: inset 0 0 0 var(--stroke-emphasis) var(--focus-ring);
}
```

The ring takes grid row 1 at 0px, so the header moves to row 2 with no visible change. It is drawn inside
the scrollbars.

**Verified in demo2.** `table.test.tsx`: "carries a focus ring element while it can take focus" and "keeps
its viewport's size on the grid, virtualized or not" (which replaces "observes nothing when it is not
virtualized" and "stops observing its size when switched off") fail with the old files. In the browser,
scrolled both ways with Escape pressed, the ring shows on all four edges over the header and pinned column.

**Status**

- **ueca-react-doc — not present.** It has no Table.

---

## 69. Row numbers show through a filtered Table's footer

**Severity:** low — row numbers appear on the footer band and hide its first words. Visible in demo2:
Showcase › Data, the 5,000-row table: type a Site filter, then scroll the rows.

**Root cause.** The footer ("Showing 834 of 5,000 rows (filtered)") is sticky at the bottom with no
z-index, and the pinned column's body cells carry `z-index: 1`, so the cells scrolling beneath the footer
painted over it.

**Fix.** In `components/data/table/table.css`, give `.ueca-table-footer` `z-index: 2`:

```css
/* z-index 2: above the pinned column's body cells (z 1) that scroll beneath it. Without one the
   pinned cells painted over the footer, so row numbers showed on its band and hid its first words. */
.ueca-table-footer {
    position: sticky;
    bottom: 0;
    z-index: 2;
    background-color: var(--surface);
    color: var(--warning-ink);
    text-align: left;
}
```

**Verified in demo2.** By hand — jsdom does no layout: the footer's text is whole and no row number shows
on it while rows scroll beneath.

**Status**

- **ueca-react-doc — not present.**

---

## 70. A wide Table's footer and empty message scroll out of sight

**Severity:** low. Visible in demo2: Showcase › Data, the 5,000-row table scrolled sideways, with a
filter (footer) or a filter that matches nothing ("No rows to show").

**Root cause.** Both span the grid's full width, and their text sits at its left end, so it scrolls away
with the columns: at 248px sideways the footer's text was entirely out of view.

**Fix.** In `components/data/table/table.css`, after the footer rule:

```css
/* Both span the grid's full width, which a wide table scrolls: their text stays at the viewport's
   left edge rather than scrolling away with the columns, and wraps within the viewport. */
.ueca-table-empty > *,
.ueca-table-footer > * {
    position: sticky;
    left: var(--space-small);
    width: max-content;
    max-width: calc(var(--table-viewport-w, 100%) - 2 * var(--space-small));
}
```

`--table-viewport-w` comes from entry 68; without it the `100%` fallback applies.

**Verified in demo2.** By hand: scrolled 248px sideways, both texts start 16px inside the viewport.

**Status**

- **ueca-react-doc — not present.**

---

## 71. A Table marks its focus after mouse use

**Severity:** low — inconsistent focus marks. Visible in demo2: Showcase › Data, press a table's scrollbar
knob, then Escape: the single-select table outlines its current row, the multi-select one (whose Escape
clears the current row) rings itself; a table that cannot be selected shows nothing.

**Root cause.** Both focus marks followed `:focus-visible`, and Chromium grants it for any key pressed on an
element the mouse focused — Escape, a lone modifier — not only for keyboard focus. A press on a table's
scrollbar does focus a focusable table.

**Fix.** Show the marks only for keyboard use.

- `components/layout/layoutShared.ts`: add `onPointerDown?: React.PointerEventHandler<HTMLDivElement>` to
  `BlockProps` (with a comment: a focusable composite tells mouse use from keyboard use by it; it fires for
  a press on the element's own scrollbar too), and forward `onPointerDown={props?.onPointerDown}` in
  `block.tsx`, `row.tsx`, `col.tsx` and `grid.tsx`.
- `components/data/table/tableTypes.ts`: a `_keyboardFocus: boolean` prop; `table.tsx` defaults it to
  `false`, adds `(model._keyboardFocus ? " keyboard-focus" : "")` to the class list, and passes
  `onFocus={(e) => { focusIn(model, e); }}`, `onBlur={(e) => { focusOut(model, e); }}` and
  `onPointerDown={() => { pointerDown(model); }}` to the Grid.
- `tableInteractions.ts`:

```ts
function focusIn<T>(model: TableModel<T>, e: React.FocusEvent<HTMLDivElement>) {
    // Focus moving onto the table itself, not into one of its controls. A press has already cleared
    // the mark by now (pointerdown precedes focus), and :focus-visible still tells the keyboard's
    // focus from the mouse's at this moment.
    if (e.target === e.currentTarget) {
        model._keyboardFocus = e.currentTarget.matches(":focus-visible");
    }
}

function focusOut<T>(model: TableModel<T>, e: React.FocusEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
        model._keyboardFocus = false;
    }
}

function pointerDown<T>(model: TableModel<T>) {
    model._keyboardFocus = false;
}
```

  and in `keyDown`, `model._keyboardFocus = true;` in the Space, Ctrl+A and Enter branches and after the
  arrow/Home/End `e.preventDefault()` — not for Escape.
- `table.css`: `.ueca-table.keyboard-focus:focus-visible .ueca-table-body-row.current` for the row outline.
  (The ring, which this entry also gated at first, is removed by entry 72.)

**Verified in demo2.** `table.test.tsx`, "keyboard": "shows its focus for navigation keys, not for a press
followed by Escape" and "shows focus that arrives from the keyboard until the table loses it" fail with the
old files; the four layout "forwards … events" tests fail without the forwarding. In the browser: scrollbar
knob then Escape shows no mark on either table; an arrow key outlines the current row; Tab back in shows it.

**Status**

- **ueca-react-doc — not present.** It has no Table.

---

## 72. A Table with no current row rings itself

**Severity:** low — an inconsistent focus mark. Visible in demo2: Showcase › Data, the 5,000-row table:
select a row, move with the arrow keys, press Escape — the table was ringed where the single-select table
keeps its row outline.

**Root cause.** A focused table without a current row got a ring around itself as a stand-in for the row
outline. It was drawn under the sticky header and pinned column (entry 68), and it marked tables
differently by state: ringed where the cursor had gone — Escape used to clear it (entry 73) — outlined
where it had not.

**Fix.** Remove the ring: the current row's outline is the only focus mark, and a focused table with no
current row shows none until a key moves the cursor.

- `components/data/table/table.css`: delete the `:focus-visible:not(:has(.ueca-table-body-row.current))`
  ring rule (demo2 had moved it to `.ueca-table-ring`) and replace its comment with a note in the keyboard
  navigation section: a table with no current row shows no mark; a ring was removed because sticky cells
  covered it and it marked tables differently.
- In demo2 this also removed the `has-current` class and `_hasCurrentRow()` (entry 64) and the
  `.ueca-table-ring` element (entry 68).

**Verified in demo2.** `table.test.tsx`, "keyboard": "draws no ring around itself" fails with the old files.
In the browser: select a row, arrows, then Escape — the row outline stays and the table has no ring.

**Status**

- **ueca-react-doc — not present.** It has no Table.

---

## 73. Escape clears a multi-select Table's selection, but not a single-select one's

**Severity:** low — inconsistent keys, and a table in a dialog swallowed the Escape meant to close it while
it had a selection. Visible in demo2: Showcase › Data, select a row in the 5,000-row table and press Escape.

**Root cause.** `keyDown` cleared the selection — current row included — on Escape in a multi-select
table only; a single-select table left Escape alone.

**Fix.** Leave Escape to the host in both. In `components/data/table/tableInteractions.ts`, delete the
Escape branch of `keyDown`:

```ts
} else if (e.key === "Escape" && model.multiSelect && (model.selectedKeys?.length ?? 0) > 0) {
    // Only swallow Escape while there is a selection to clear; empty, it bubbles so a host
    // dialog can close on the same key (the SearchField convention).
    e.stopPropagation();
    model.clearSelection();
    return;
```

and say so in the comment above `keyDown`: Escape is not the table's; a screen that offers clearing calls
`clearSelection()`. In `tableTypes.ts`, the `multiSelect` comment drops "while Escape clears". In the
Showcase Data topic the description drops "Escape to clear".

**Verified in demo2.** `tableInteractions.test.tsx`, "leaves the selection to Escape's host" (replacing the
two Escape tests) and `dataTopic.test.tsx`, "reports a desktop-style multi-selection, which Escape leaves
alone", fail with the old files. In the browser: click a row, Escape — still "selected: 1 of 5,000".

**Status**

- **ueca-react-doc — not present.** It has no Table.

---

## 74. The sidebar's focus rings are cut off on both sides

**Severity:** medium (accessibility) — a keyboard user sees only a line above and below the focused menu
row, if that. Visible in demo2 and ueca-react-doc: Tab into the sidebar, expanded or collapsed.

**Symptom.** A focused menu link, group heading or Sign out draws its ring outside the row, and the rows
sit flush with the sidebar's edges, so the rail's clip (`overflow: hidden auto`) and the layout's clip cut
both sides off — and the top or bottom as well when the focused row is scrolled to the rail's edge.
Measured with keyboard focus: every one of demo2's 17 rows, expanded and collapsed, and all 23 rows of
ueca-react-doc's rail.

**Root cause.** NavItem's focus lands on the NavLink `<a>` around its row, which draws NavLink's outward
ring (`outline-offset: 2px`); NavItemExpandable's heading draws the app-wide outward ring. A row that
fills a clipping container cannot show a ring outside itself.

**Fix.** Draw the ring inside the row, on the element that looks like the control, as the hover and active
fills are. NavLinks elsewhere keep their outward ring.

1. `components/navigation/navItem/navItem.tsx`, the View's host:

   ```tsx
   <Block id={model.htmlId()} className="ueca-nav-item-host">
   ```

2. `navItem.css`, after the spine marker rule:

   ```css
   /* Focus lands on the <a> around the row, and an outward ring there was cut off: the rows sit flush
      with the sidebar rail, which clips, so the ring lost both sides (and its top or bottom when the
      focused row was scrolled to the edge). The ring is drawn inside the row instead, on the element
      that looks like the control, as the hover and active fills are. */
   .ueca-nav-item-host .ueca-nav-link:focus-visible {
       outline: none;
   }

   .ueca-nav-item-host .ueca-nav-link:focus-visible .ueca-nav-item {
       outline: var(--stroke-emphasis) solid var(--focus-ring);
       outline-offset: calc(-1 * var(--stroke-emphasis));
   }
   ```

3. `navItemExpandable/navItemExpandable.css`, after `.ueca-nav-item-expandable.active`:

   ```css
   /* Inside the heading, as NavItem's rows draw theirs: the heading is flush with the sidebar rail,
      which clips, so an outward ring lost both sides. */
   .ueca-nav-item-expandable:focus-visible {
       outline: var(--stroke-emphasis) solid var(--focus-ring);
       outline-offset: calc(-1 * var(--stroke-emphasis));
   }
   ```

On the active row the spine marker, a positioned `::before`, is drawn over the ring's left edge — as it
would be over an inset box-shadow too — so the row keeps its position cue while it has focus.

**Verified in demo2** (`5a7a3b6`). No jsdom test can see a clipped ring, so it was measured in the browser:
every focusable control in the sidebar focused by keyboard, its ring compared with each clipping ancestor's
padding box — 18 of 19 cut before (the 17 rows and the collapse button, entry 75), none after, expanded
and collapsed. In ueca-react-doc, both themes, a 6x capture of the focused active row shows the ring on
three sides and the marker as its left edge. The full suite passes.

**Status**

- **ueca-react-doc — ported in `4a0ea9f`.** Branch `reference-fixes`.

---

## 75. The sidebar's collapse button sits above the brand, its ring cut at the top

**Severity:** low — the button is ten pixels higher than the logo and wordmark beside it, and its focus
ring loses its top edge. Visible in demo2 and ueca-react-doc: the button at the right of the expanded
sidebar's header.

**Root cause.** In `core/appLayout/appSideBar.tsx`, the button's `<Row fill horizontalAlign={"right"}>`
fills the 52px header with no vertical alignment, so the 32px button sits at the top — flush with the
page's top edge, where the layout's `overflow: hidden` clips its ring.

**Fix.** Centre it like the brand:

```tsx
{/* Centred like the brand beside it. Top-aligned, the button sat flush with
    the rail's top edge, ten pixels above the wordmark, with the top of its
    focus ring cut off by the layout's clip. */}
<Row fill horizontalAlign={"right"} verticalAlign={"center"}>
```

**Verified in demo2** (`be53306`). The button's centre now matches the wordmark's (25.6px from the top),
and the sweep of entry 74 finds its ring whole. The full suite passes.

**Status**

- **ueca-react-doc — ported in `6c9f03c`.** Branch `reference-fixes`.

---

## 76. A focused breadcrumb's ring is cut off in the top bar

**Severity:** medium (accessibility) — a keyboard user sees little more than a line under the focused
crumb. Visible in demo2 and ueca-react-doc: Tab to the first crumb ("Home", "API Documentation") of any
screen with a trail.

**Symptom.** The ring loses both sides and its top, and half of its bottom stroke. On a narrow bar, where
the crumb is truncated, what is left of it also runs on past the ellipsis.

**Root cause.** `core/screenLayout/screenLayout.css` keeps the trail on one line by clipping every crumb for
an ellipsis (`.app-topbar .ueca-breadcrumbs > *`: `overflow: hidden; text-overflow: ellipsis`). The `<li>`
doing it is exactly the size of the NavLink inside it, so the link's outward ring (2px stroke, 2px offset)
is clipped on every side, and the `<ol>` clips as well (`overflow: hidden`), flush with the first crumb's
left edge. On top of that an inline link keeps the full width of the text an ellipsis hides: its box, and
so its ring, runs past the end of a truncated crumb, where no room reserved at the `<li>` could hold it.

**Fix.** Make the link the ellipsis box — a block, only as wide as its crumb — so the `<li>` no longer
clips; reserve the ring's reach inside the `<ol>`'s clip and pull the list back out by the same margin,
so nothing moves.

```css
.app-topbar .ueca-breadcrumbs {
    flex-wrap: nowrap;
    min-width: 0;
    overflow: hidden;
    font-size: var(--text-sm);
    /* That clip runs flush along the first crumb's left edge and the last one's right, and cut the
       side off a focused crumb's ring. Room inside it for the ring, pulled back out by the same
       margin, so the trail does not move - see --focus-bleed. */
    padding-inline: var(--focus-bleed);
    margin-inline: calc(-1 * var(--focus-bleed));
}

.app-topbar .ueca-breadcrumbs > * {
    white-space: nowrap;
    min-width: 0;
}

.app-topbar .ueca-breadcrumbs-separator {
    overflow: hidden;
}

/* The ellipsis is the crumb's link's, not the <li>'s. The <li> clipped the link flush on every
   side, which cut its focus ring off, and an inline link keeps the full width of the text an
   ellipsis hides, so on a short bar its ring ran on past the end of the crumb. As a block the link
   is only as wide as the crumb, and its ring draws in the gap beside it. */
.app-topbar .ueca-breadcrumbs > li > * {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
}
```

A project without `--focus-bleed` reserves the ring's own reach, `calc(var(--stroke-emphasis) + 2px)`.

Not the inset ring `tokens.css` prescribes for a deliberate ellipsis clip: on a text link it would sit on
the glyphs, and it is not needed once the link is the ellipsis box — the ring then draws outside the
link, in the gap between crumbs, and the only clip around it is the list's, which can take the room.

**Verified in demo2** (`6179921`). No jsdom test can see a clipped ring, so it was measured in headless
Chrome at 100% zoom: every control in the top bar focused by keyboard, its ring compared with each
clipping ancestor's padding box. The ring reaches 4px, so a 4px cut is a whole side.

| app, page, width | crumb | ring cut before | after |
| --- | --- | --- | --- |
| demo2, Showcase · Overview, 1266px | Home | 4px left, 4 right, 2 top, 1 bottom | none |
| demo2, Playground · Text field, 330px (truncated) | Home | 4px left, 11 right, 2 top, 1 bottom | none |
| ueca-react-doc, Tracing, 1266px | API Documentation | 4px left, 4.3 right, 2 top, 1 bottom | none |
| ueca-react-doc, onprop-events, 560px (truncated) | API Documentation | 4px left, 21.3 right, 2 top, 1 bottom | none |

At every width the crumb, separator and toolbar boxes were identical before and after, to the hundredth
of a pixel, and 5x captures show the ring whole in both themes, closing just after the ellipsis on a
truncated crumb. The full suite passes.

**Status**

- **ueca-react-doc — ported in `84c4001`.** Branch `reference-fixes`. Its list reserved
  `calc(var(--stroke-emphasis) + 2px)` by hand until entry 77's port added `--focus-bleed` (`7d2e0e6`),
  which it reads now; the trail measures the same.

---

## 77. The tab panel wears `ueca-focus-bleed`, but nothing defines it

**Severity:** low in demo2 today, since no screen renders a TabsContainer; medium for one that does — a
control flush with the panel's edge loses its focus ring on three sides.

**Symptom.** A button at the top of a tab's content loses its ring on the left, right and top; one at the
bottom, once Tab scrolls to it, on the left, right and bottom.

**Root cause.** `components/tabs/tabsContainer/tabsContainer.tsx` renders the panel as
`<Col className="ueca-focus-bleed" fill overflow="auto">`: it scrolls, so it clips, and tab content starts
flush against it. `tokens.css` defines `--focus-bleed`, but no stylesheet defines `.ueca-focus-bleed` — the
rule was never carried over, so the panel reserves no room.

Copying the rule alone was not enough, for two reasons specific to this panel:

- `fill` writes `width: 100%` inline, which holds the panel to the container's width, so the negative
  margins shift it 5px left instead of widening it; its content comes in 10px on the right.
- Pulled out 5px, the panel sits under its own tab strip: up under a horizontal strip unless a theme
  spaces them apart (`--tab-strip-gap`, unset in demo2), and always sideways under a vertical one. Scrolled
  content then shows through the strip's edge — across a horizontal strip's rule and the selected tab's
  underline. At rest clicks are unaffected, since the strip is positioned and paints over the panel; but a
  control scrolled under the strip is positioned too, comes later, and paints over the strip and takes
  its clicks (measured beside a vertical strip).

**Fix.**

1. `theme.css`, after the scrollbar rule:

   ```css
   .ueca-focus-bleed {
       padding: var(--focus-bleed);
       margin: calc(-1 * var(--focus-bleed));
       /* Padding alone is not enough on the SCROLL axis: scroll-into-view (what Tab and .focus() do)
          stops as soon as the control is just barely visible, parking it flush against the scrollport
          edge — so the reserved room is there but is never scrolled to, and the ring is clipped again
          at the bottom. scroll-padding shrinks the region scroll-into-view aims for, so it keeps the
          bleed clear. */
       scroll-padding: var(--focus-bleed);
   }
   ```

2. `tabsContainer.tsx`, the panel stretches rather than taking fill's 100%:

   ```tsx
   <Col className="ueca-focus-bleed" fill width={"auto"} overflow="auto" spacing="default">
   ```

3. `tabsContainer.css`, a horizontal strip's panel is pulled up only into a theme's gap:

   ```css
   .ueca-tabs-container.horizontal > .ueca-focus-bleed {
       margin-top: calc(-1 * min(var(--focus-bleed), var(--tab-strip-gap, 0px)));
   }
   ```

   With no gap the first row sits the bleed (5px) below the rule instead of flush; with a gap of at least
   the bleed nothing moves. The `.ueca-tabs-header` comment, which said the rule and the first row sit flush
   by default, is updated to match.

4. `tabsContainer.css`, beside a vertical strip the panel is not pulled under it at all — nothing spaces a
   vertical strip from its panel — so its first column sits the bleed to the right of the divider:

   ```css
   .ueca-tabs-container.vertical > .ueca-focus-bleed {
       margin-left: 0;
   }
   ```

   This came a commit later (`2b79658`): steps 1–3 left the vertical case pulled under its strip, which
   drawing the strip's divider (entry 78) made plain.

**Verified in demo2** (`9e6a763`). Two tests in `tabsContainer.test.tsx` fail without the change: `theme.css`
defines the rule, read from disk as the other stylesheet tests do, and the panel's inline width is `auto`.
No screen renders a TabsContainer, so one was mounted in the running app, inside a 24px-padded box as
TabsScreen's content column is, with an outlined Button at the top of the panel and another below 30 lines
of text; measured in headless Chrome at 100% zoom:

| | before | after, no strip gap | after, 24px strip gap |
| --- | --- | --- | --- |
| rings cut | top button 4px left, 4 right, 4 top; bottom button 4 left, 4 right, 3.6 bottom | none | none |
| top button left, top, width | 315, 125, 560 (149 with the gap) | 315, 130, 560 | 315, 149, 560 |
| room below the bottom button, tabbed to | 0.38px | 5.38px | 5.38px |
| click above the strip's bottom edge | the rule at 1px, the tab at 3 and 5px | the same | the same |
| panel scrolled | text stops at the rule | text stops at the rule | text stops in the gap |

With the rule copied alone, the top button was 550px wide and scrolled text showed 4px above the rule.
The full suite passes.

Step 4 (`2b79658`), on a vertical TabsContainer mounted the same way with its panel scrolled 40px sideways: a
click 2px or 4px inside the strip's edge went to the panel's button before and reaches the tab after,
scrolled content stops at the divider instead of sliding under the strip, and a focused button at the
panel's left edge keeps its whole ring, now drawn beside the divider rather than over it.

A guard for step 2 came later (`6bc3683`):
a note beside the utility in `theme.css`, and `src/theme.test.ts`, which scans every `.tsx` for a
`fill` Col that wears the class without `width={"auto"}` and names the tab panel when its width is taken
off. demo2 has no other wearer today. ueca-react-doc took the guard in `4590833`: the same note, and — the doc
has no test runner — a `no-restricted-syntax` rule in `eslint.config.js`, so `npm run lint` reports the tab
panel's line when its width is taken off. The doc has no other wearer either.

**Status**

- **ueca-react-doc — ported in `7d2e0e6`.** Branch `reference-fixes`; all four steps in one commit, after
  entry 78's. It had no class, no rule and no token, so the port adds `--focus-bleed` to `tokens.css` as
  `calc(var(--stroke-emphasis) + 2px)` — the doc's widest focus effect is the 4px ring, with no field glow
  — and the breadcrumb trail of entry 76 reads it instead of its own copy. With no `--tab-strip-gap`,
  step 3 is `margin-top: 0`. Measured the same way (before → after): the top button's ring cut 4px
  left, right and top → none, the bottom one's 4 left, 4 right, 3.6 bottom → none; a horizontal panel's
  content keeps its left edge and width, its first row 4px lower; beside a vertical strip the first
  column sits 4px right of the divider, and a click inside the strip's edge with the panel scrolled
  sideways reaches the tab. The tab buttons' own rings were cut by the strip as well; entry 79 ports
  demo2's inset rings for those. Only its TabsScreen renders a TabsContainer, and no screen uses
  TabsScreen.

---

## 78. A vertical tab strip has no divider, and a rule along its bottom instead

**Severity:** low — only vertical tabs are affected, and no screen in demo2 renders them: nothing separates
the strip from the panel beside it, and a horizontal hairline runs under the strip.

**Root cause.** `components/tabs/tabsContainer/tabsContainer.css` writes the vertical header's rule as
`.ueca-tabs-vertical .ueca-tabs-header`, but the header carries `ueca-tabs-vertical` itself
(`tabsContainer.tsx`: `` <div className={`ueca-tabs-header ${model.orientation === "vertical" ? "ueca-tabs-vertical" : ""}`}> ``).
The descendant selector asks for an ancestor with that class, which does not exist, so the rule never
matches and the strip keeps the horizontal header rule. The other vertical rules
(`.ueca-tabs-vertical .ueca-tabs-wrapper`, `… .ueca-tabs-scroller`, `… .ueca-tabs-list`,
`… .ueca-tabs-scroll-button`) do match: those elements sit inside the header.

**Fix.** A compound selector, and the divider reads the same theme hook as the horizontal rule:

```css
/* The header carries ueca-tabs-vertical itself, so this is a compound selector. Written as a descendant
   one (`.ueca-tabs-vertical .ueca-tabs-header`) it asked for an ancestor that does not exist and never
   matched: a vertical strip kept the horizontal rule under it and had no divider beside the panel. The
   divider reads the same theme hook as that rule. */
.ueca-tabs-header.ueca-tabs-vertical {
    flex-direction: column;
    border-bottom: none;
    border-right: var(--hairline) solid var(--tab-strip-line, var(--border));
}
```

**Verified in demo2** (`8d74f80`). A new test in `tabsContainer.test.tsx` fails without the change. It reads
`tabsContainer.css` from disk and matches its rules against the rendered header, so a selector that cannot
reach its element shows up as a missing declaration: a vertical header gets the column direction, no
bottom border and the right divider; a horizontal one the bottom rule and no right border. On a vertical
TabsContainer mounted in the running app, measured in headless Chrome, the header computed
`flex-direction: row`, `border-right: 0px none` and `border-bottom: 1px solid` before, and `column`,
`1px solid` and `none` after. Captures show the divider along the strip with the selected tab's marker just
inside it; the header is 1px wider for it, so the panel moves 1px right. The full suite passes.

Drawing the divider made entry 77's slide-under beside a vertical strip easy to see; that fix is entry 77's
step 4.

**Status**

- **ueca-react-doc — ported in `8b98426`.** Branch `reference-fixes`. Its divider stays
  `1px solid var(--border)`, like its horizontal rule: the doc has no `--tab-strip-line` hook. Checked the
  same way: the header computed `row`, no right border and a bottom one before, and `column`, a 1px
  divider and none after. No screen renders a TabsContainer.

---

## 79. A tab's focus ring is cut off by its own strip

**Severity:** medium (accessibility) wherever tabs are shown — a keyboard user sees two stray lines that read
as a border rather than a ring. Found in ueca-react-doc, whose screens render no tabs.

**Symptom.** A focused horizontal tab shows only the sides of its ring, a vertical one only its top and
bottom; the first tab loses the side at the strip's end too, and a scroll button the side it shares with
the strip's end.

**Root cause.** A tab sits inside `.ueca-tabs-scroller` and `.ueca-tabs-wrapper`, both `overflow: hidden`,
and fills their height in a horizontal strip and their width in a vertical one, so the app-wide outward
ring (2px stroke, 2px offset) is clipped on those sides. The scroll buttons sit flush with the wrapper's
ends.

**Fix.** Draw both rings inset. `components/tabs/tab/tab.css`, at the end:

```css
/* Focus. INSET rather than an outline: a tab sits inside .ueca-tabs-scroller and .ueca-tabs-wrapper,
   both overflow: hidden, which cut the app-wide outward ring off every tab — top and bottom in a
   horizontal strip, both sides in a vertical one — leaving two stray lines that read as a border. */
.ueca-tab:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 var(--stroke-emphasis) var(--focus-ring);
}
```

`components/tabs/tabsContainer/tabsContainer.css`:

```css
/* Same clipping as the tabs themselves, so the same inset ring. */
.ueca-tabs-scroll-button:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 var(--stroke-emphasis) var(--focus-ring);
}
```

On a selected tab the ring's bottom (or right) edge meets the selection underline, which reads as a thicker
line there. Where the tab keeps `transition: all` (ueca-react-doc), the ring grows in over the transition;
demo2 names its transitioned properties, `box-shadow` among them, which does the same.

**Verified in demo2** — the fix predates this file: demo2 has drawn both rings inset since `0b6fd45`, the
component rebuild. The TabsContainers mounted for entries 77 and 78 confirm it: neither the
horizontal strip's tabs nor the vertical strip's had a ring cut.

**Not covered.** A tab only partly scrolled into a scrollable strip stayed partly hidden when it took focus,
with the hidden part of its ring: Chrome scrolls an element into view on focus only when none of it is
visible. That is entry 80.

**Status**

- **ueca-react-doc — ported in `c2f48e3`.** Branch `reference-fixes`. Measured on two TabsContainers mounted
  in the running app, a scrollable horizontal strip of eight tabs with scroll buttons and a vertical strip of
  four, with every control focused by keyboard: all 14 rings were cut before (a horizontal tab by 4px top
  and bottom, the first tab also 4px left, a vertical tab by 4px either side, the scroll buttons by 4px on
  their outer side), and none is after. Two tabs were still reported, partly scrolled out of the strip
  themselves (see Not covered, and entry 80). 4x captures show whole rings on a selected tab, an unselected
  one, a vertical tab and a scroll button.

---

## 80. A tab partly scrolled out of its strip stays partly hidden when it takes keyboard focus

**Severity:** low (accessibility) — only an overflowing strip shows it: the focused tab, and part of its
focus ring, stays under the scroll button or the strip's edge until the user scrolls by hand.

**Symptom.** Walking a scrollable strip of eight tabs with Tab: in demo2 "Integrations" took focus with 84px
hidden and "Help" with 12px; in ueca-react-doc "Notifications" with 18px and "Audit log" with 50px. A tab
that was entirely out of view was scrolled in; one that was partly in view was not.

**Root cause.** Nothing in `components/tabs/tabsContainer/tabsContainer.tsx` scrolls the focused tab, so it is
left to the browser, and Chrome's focus scrolling only reveals an element none of which is visible (a
partly visible one counts as in view). The strip's own scroll buttons move it 200px at a time.

**Fix.** The scroller scrolls itself on focus, by just enough to show the whole tab, for keyboard focus only.
In `_tabsView`:

```tsx
<div ref={model.__scrollerRef} className={scrollerClasses} onFocus={_revealFocusedTab}>
```

and among the private functions:

```tsx
// A tab partly scrolled out of the strip stayed partly hidden when it took focus, and with it part of
// its focus ring: Chrome scrolls a focused element into view only when none of it is visible. The
// strip is scrolled just far enough to show the whole tab - its start, for a tab wider than the strip.
// Keyboard focus only: a click focuses the tab too, and sliding the tab out from under the pointer
// before the button is released would lose the click.
function _revealFocusedTab(e: React.FocusEvent<HTMLDivElement>) {
    const scroller = e.currentTarget;
    const tab = e.target as HTMLElement;
    if (tab === scroller || !tab.matches(":focus-visible")) {
        return;
    }
    const horizontal = model.orientation === "horizontal";
    const view = scroller.getBoundingClientRect();
    const box = tab.getBoundingClientRect();
    const start = horizontal ? box.left - (view.left + scroller.clientLeft) : box.top - (view.top + scroller.clientTop);
    const pastEnd = horizontal ? start + box.width - scroller.clientWidth : start + box.height - scroller.clientHeight;
    // Rounded towards the edge being revealed: the scroll position snaps to whole pixels, and a
    // fraction short would leave the ring's outer pixel under the strip's edge.
    const delta = start < 0 || pastEnd > start ? Math.floor(start) : Math.ceil(Math.max(0, pastEnd));
    if (!delta) {
        return;
    }
    if (horizontal) {
        scroller.scrollLeft += delta;
    } else {
        scroller.scrollTop += delta;
    }
}
```

It scrolls only the strip. `scrollIntoView` would walk every scrollable ancestor, the app shell's clipping
boxes included. The scroll animates where the strip has `scroll-behavior: smooth` (a scrollable one does).
The focus event comes before the browser's own focus scrolling, so for a tab that is entirely out of view,
Chrome's centring may take over from this; either way the tab ends up in view.

**Verified in demo2** (`16a6e50`). Seven new tests in `tabsContainer.test.tsx`: a tab past the strip's end,
before its start, in full view, wider than the strip, a fraction past the end, a vertical strip, and a click.
The five that scroll fail without the change, and the click test fails without the `:focus-visible` check.
jsdom's `:focus-visible` follows the last input, but its record carries over from earlier tests in the
file, so the tests stub how the focus arrived. In the running app, on a scrollable strip of eight tabs with
scroll buttons, walked with real Tab presses in headless Chrome: every tab is fully inside the strip once
focused, the last within 0.2px, which is as far as the strip scrolls. A real click on the visible part of a
partly hidden tab still selects it and does not scroll. The full suite passes.

**Status**

- **ueca-react-doc — ported in `6732fa2`.** Branch `reference-fixes`. Walked the same way: "Notifications"
  (18px hidden) and "Audit log" (50px) now scroll fully into the strip, the last tab within 0.2px, and a
  click on a partly hidden tab selects it without scrolling. Throwaway tests of the same seven cases pass,
  and the five that scroll fail without the change.
