# DESIGN.md — Mac Native UI System & Final Design Audit

## 0. Purpose

This file is the authoritative design and UI-quality specification for this macOS application.

When working on the interface, Codex must treat this document as a **design contract**, not as inspiration.

The goal is not to redesign the product creatively. The goal is to:

- preserve existing features and behavior,
- remove visual inconsistency,
- simplify the interface,
- unify proportions, spacing, typography, controls, panels and navigation,
- make every interaction obvious and reliable,
- produce a highly polished, native-feeling macOS application,
- finish with a complete functional and visual audit.

When available, use `Wholiver/swiftui-design-skill` as the primary design-system and visual-review skill.

If another SwiftUI engineering skill is available, it may be used for implementation correctness, but this document remains the visual source of truth.

---

# 1. Core Product Direction

The application must feel like a modern native macOS utility.

Target feeling:

- extremely clean,
- minimal,
- dense but not cramped,
- calm,
- precise,
- visually quiet,
- almost no decorative UI,
- very little text,
- high information clarity,
- subtle hierarchy,
- native macOS behavior,
- consistent proportions everywhere.

Reference spirit:

- modern Codex-style desktop interfaces,
- contemporary native macOS developer tools,
- restrained IDE / terminal utility aesthetics,
- Apple-native materials and controls where they improve the experience.

Do **not** imitate another product pixel-for-pixel.

The objective is to reproduce the same design philosophy:
**remove everything that does not help the user act or understand.**

---

# 2. Non-Negotiable Principles

## 2.1 System first

Never fix individual screens independently when the same inconsistency appears elsewhere.

Before polishing isolated views, establish shared tokens and reusable UI primitives.

Prefer:

- shared spacing tokens,
- shared typography tokens,
- shared control sizes,
- shared row styles,
- shared panel styles,
- shared icon treatment,
- shared selection states,
- shared separators,
- shared hover behavior,
- shared light/dark materials.

Avoid local magic numbers whenever possible.

---

## 2.2 Preserve functionality

Do not remove a feature merely to simplify the interface.

Simplify presentation, not capability.

If multiple controls can be consolidated into:

- one sidebar,
- one contextual menu,
- one toolbar action,
- one overflow menu,
- one inspector,

do so only if discoverability and functionality remain intact.

---

## 2.3 Minimal chrome

Avoid:

- decorative cards,
- boxes around every section,
- unnecessary borders,
- repeated section headers,
- oversized titles,
- gradients without functional purpose,
- excessive shadows,
- large empty padding,
- redundant labels,
- duplicate navigation,
- decorative icons,
- unnecessary badges,
- UI containers inside UI containers.

The application should often feel as if there is "almost nothing there".

---

# 3. Global Layout Architecture

## 3.1 Primary navigation

The default architecture should use **one clean left sidebar** for primary navigation.

Avoid multiple competing navigation panels with different visual styles.

Preferred structure:

```text
┌──────────────────────────────────────────────────────────┐
│ Sidebar          │ Main content                          │
│                  │                                       │
│  App             │                                       │
│                  │                                       │
│  ◇ Section 1     │                                       │
│  ◇ Section 2     │                                       │
│  ◇ Section 3     │                                       │
│                  │                                       │
│                  │                                       │
│  ⚙ Settings      │                                       │
└──────────────────┴────────────────────────────────────────┘
```

The sidebar should be:

- visually quiet,
- narrow,
- resizable only if useful,
- consistent in row height,
- aligned precisely,
- based on SF Symbols where appropriate,
- free of unnecessary cards,
- subtle in its active selection treatment.

Selection should preferably be indicated through:

- subtle background/material shift,
- slight text/icon emphasis,
- native selection styling where appropriate.

Avoid giant colored pills unless the product explicitly requires them.

---

## 3.2 Secondary panels

Use secondary panels only when they materially help the workflow.

If required, they must visually belong to the same system as the sidebar and content area.

All panels must share:

- spacing rhythm,
- typography,
- separators,
- row density,
- selection style,
- background treatment,
- corner-radius logic,
- minimum/ideal widths.

Avoid a situation where each panel appears to come from a different application.

---

## 3.3 Resizing

The application must remain coherent when the window is resized.

Every major panel must have:

- a minimum width,
- a sensible ideal width,
- a maximum width when appropriate.

Do not solve long text by permanently making panels wider.

Prefer truncation, tooltips, contextual disclosure, or adaptive layouts.

---

# 4. Design Tokens

Create or consolidate a shared design-token layer.

Names may change to match the existing codebase, but the concept must remain centralized.

Example baseline:

```swift
enum AppDesign {
    enum Spacing {
        static let xxs: CGFloat = 2
        static let xs: CGFloat = 4
        static let sm: CGFloat = 6
        static let md: CGFloat = 8
        static let lg: CGFloat = 12
        static let xl: CGFloat = 16
        static let xxl: CGFloat = 20
        static let xxxl: CGFloat = 24
    }

    enum Radius {
        static let small: CGFloat = 5
        static let medium: CGFloat = 7
        static let large: CGFloat = 10
    }

    enum Control {
        static let compactHeight: CGFloat = 24
        static let regularHeight: CGFloat = 28
        static let prominentHeight: CGFloat = 32
    }
}
```

These values are a starting system, not permission to spread new arbitrary values.

Before adding a new token, verify that an existing token cannot solve the problem.

---

# 5. Spacing & Proportions

All spacing must feel intentional.

Preferred spacing rhythm:

```text
2 / 4 / 6 / 8 / 12 / 16 / 20 / 24
```

Avoid arbitrary values such as:

```text
13 / 17 / 19 / 23 / 27
```

unless they are required by a specific native macOS control or geometry constraint.

Review the entire application for:

- inconsistent leading padding,
- inconsistent trailing padding,
- mismatched vertical rhythm,
- oversized gaps,
- unnecessary empty areas,
- controls with different heights,
- inconsistent icon-to-label spacing,
- misaligned baselines,
- uneven panel margins.

Symmetry matters.

If a panel has 8 pt between its left edge and the first visible content, the right side should not accidentally contain 40 pt of dead space without a functional reason.

---

# 6. Typography

Typography must be coherent across the whole app.

Use native system fonts unless there is a strong product reason not to.

Prefer semantic macOS / SwiftUI text styles over arbitrary point sizes.

Keep the hierarchy restrained.

Suggested hierarchy:

- compact metadata / caption,
- secondary text,
- standard body / row label,
- section label,
- small title where necessary.

Avoid oversized mobile-style headings.

Most screens should not need a giant title.

Rules:

- no inconsistent font weights for equivalent elements,
- no arbitrary font sizes per screen,
- use secondary color for secondary information,
- avoid bold text unless it communicates real hierarchy,
- preserve readable contrast in both light and dark modes,
- keep line heights compact but legible.

---

# 7. Text Length, Truncation & Information Density

The UI must stay compact even when content is long.

Do not widen a whole panel simply because one label is long.

Use, when appropriate:

- `lineLimit(1)`,
- tail truncation,
- middle truncation for paths/identifiers when more useful,
- tooltips with full content,
- context menus,
- expandable details,
- secondary inspector areas,
- abbreviated labels.

Example:

```text
Visible:
qwen3.5-27b-mlx…

Tooltip:
qwen3.5-27b-mlx-instruct-4bit
```

Avoid wrapping short navigation rows to multiple lines.

---

# 8. Icons

Use SF Symbols whenever they communicate the concept clearly.

Icons should be:

- small,
- consistent,
- visually aligned,
- semantically meaningful,
- not decorative,
- paired with text only when text adds real value.

Avoid using multiple unrelated icon styles.

Do not use oversized icons in normal utility navigation.

Keep symbol weight visually consistent across equivalent controls.

---

# 9. Buttons & Clickability

Every visible interactive element must respond correctly and immediately.

The final pass must explicitly verify:

- buttons,
- icon buttons,
- toolbar controls,
- sidebar rows,
- disclosure controls,
- toggles,
- menus,
- context menus,
- segmented controls,
- text-field actions,
- list rows intended to be clickable,
- settings actions,
- navigation actions,
- keyboard shortcuts.

A control that visually looks clickable but does nothing is a release-blocking defect.

A control that works only when clicking directly on a tiny glyph is also a defect when the surrounding visual affordance implies a larger click target.

Use `contentShape`, appropriate button styles, row-level hit areas or equivalent mechanisms when necessary.

The visible icon may remain compact while the hit area is comfortably clickable.

Do not add giant visual padding merely to enlarge the hit target.

---

# 10. Hover, Pressed, Focus & Selection States

Interactive controls must communicate state without becoming visually noisy.

Provide coherent states for:

- hover,
- pressed,
- selected,
- focused,
- disabled.

Prefer subtle changes in:

- opacity,
- background material,
- icon/text contrast,
- native accent behavior.

Avoid dramatic animation or large color changes for ordinary utility controls.

---

# 11. Sidebar Design

The left sidebar is the primary visual anchor of the application.

It must be:

- simple,
- compact,
- consistent,
- visually integrated with the window,
- free from unnecessary containers,
- easy to scan,
- usable with mouse and keyboard.

Sidebar rows should share a common component/style.

Each row should define consistently:

- height,
- horizontal padding,
- icon width,
- icon-label gap,
- typography,
- selected state,
- hover state,
- hit target.

Do not hand-design each sidebar item independently.

---

# 12. Panels, Lists & Rows

All comparable rows should have the same baseline geometry.

Standardize:

- row heights,
- paddings,
- disclosure spacing,
- icon columns,
- text alignment,
- trailing accessory alignment,
- separators,
- hover behavior,
- active states.

Avoid putting every row inside a rounded rectangle.

Use separators sparingly.

Use grouping only when it improves comprehension.

---

# 13. Borders, Corners & Shadows

Use as little as possible.

## Borders

Prefer:

- native separators,
- very subtle strokes,
- material contrast,
- background contrast.

Do not outline every component.

## Corner radii

Use a small centralized radius scale.

Avoid random combinations such as:

```text
6 / 9 / 11 / 14 / 18
```

without a clear semantic purpose.

## Shadows

Use none by default.

If required:

- subtle,
- soft,
- low contrast,
- used only for actual depth/layering.

Do not use card-style shadows throughout the application.

---

# 14. Light Mode

Target:

- off-white rather than harsh pure white where appropriate,
- subtle gray/material separation,
- dark charcoal/gray icons and text,
- restrained contrast,
- no heavy borders.

The app should feel calm and native, not sterile.

---

# 15. Dark Mode

Target:

- charcoal / deep gray rather than pure black everywhere,
- subtle translucent or native material surfaces where appropriate,
- clear but restrained separation between sidebar and content,
- soft secondary text,
- icons that remain legible without glowing.

Avoid neon accents or excessive contrast unless required by the product.

---

# 16. Materials & Translucency

Use native macOS materials where they improve hierarchy or integration with the window.

Translucency must remain subtle.

Do not make every surface glass-like.

The effect should feel native and almost invisible.

Preferred use:

- sidebar/window chrome,
- contextual overlays,
- floating inspector-like elements when needed.

Avoid decorative glass cards.

---

# 17. Menus & Contextual Actions

Do not expose every secondary action permanently.

Use menus when an action is:

- infrequent,
- advanced,
- destructive,
- contextual,
- secondary.

Prefer an unobtrusive overflow/context menu over a row filled with many buttons.

Important primary actions must remain discoverable.

---

# 18. Keyboard & Native macOS Behavior

Where appropriate, important actions should support:

- keyboard shortcuts,
- Escape,
- Return/Enter,
- arrow-key navigation,
- focus movement,
- standard macOS menu behavior.

Do not break existing keyboard shortcuts during visual refactoring.

If a visible shortcut is displayed, verify that it actually works.

---

# 19. Accessibility

Minimalism must not reduce usability.

Verify:

- sufficient contrast,
- useful accessibility labels for icon-only buttons,
- VoiceOver labels where necessary,
- keyboard navigation,
- visible focus behavior,
- click targets,
- disabled-state clarity.

Do not rely exclusively on color to communicate state.

---

# 20. Forbidden Design Patterns

Do not introduce these unless explicitly required:

- giant page titles,
- dashboard card grids for simple settings,
- card inside card inside card,
- gradient decorations,
- excessive pills,
- floating action buttons,
- oversized rounded rectangles,
- excessive blur,
- colored backgrounds behind every row,
- large empty margins,
- decorative illustrations,
- redundant labels beside obvious icons,
- multiple competing sidebars,
- different UI language on each screen,
- arbitrary custom fonts,
- gratuitous animation,
- fake depth everywhere,
- mobile-first interaction patterns transplanted to macOS.

---

# 21. Implementation Rules

Before adding new view-level styling, search for an existing shared token or component.

Prefer reusable primitives such as:

```text
SidebarRow
CompactIconButton
SectionLabel
PanelHeader
InspectorRow
CompactTextField
InlineStatus
EmptyState
```

Names may differ, but equivalent UI should share implementation.

Do not create abstract components purely for abstraction.

Create shared components when they enforce visible consistency.

---

# 22. Refactor Strategy

Perform the design work in this order.

## Phase 1 — Inventory

Inspect the complete UI before changing anything.

List:

- all screens,
- all panels,
- all sidebars,
- all toolbars,
- all menus,
- all recurring row types,
- all button styles,
- all typography styles,
- all spacing patterns,
- all border/radius/shadow patterns,
- all interactive controls.

Identify inconsistencies before implementation.

---

## Phase 2 — Establish tokens

Define or consolidate:

- spacing,
- typography,
- control heights,
- radii,
- colors/materials,
- panel widths,
- row styles,
- separator styles,
- selection styles.

---

## Phase 3 — Navigation cleanup

Reduce competing navigation structures.

Prefer one clean left sidebar for primary destinations.

Do not remove necessary functionality.

---

## Phase 4 — Component unification

Replace visually equivalent but differently implemented components with shared patterns.

Priority:

1. sidebar rows,
2. buttons,
3. list rows,
4. section labels,
5. panels,
6. menus,
7. input fields,
8. status indicators.

---

## Phase 5 — Density & proportions

Review every screen for:

- dead space,
- oversized controls,
- inconsistent padding,
- excessive text,
- unnecessary headers,
- misalignment,
- width imbalance.

Make the interface tighter without making it difficult to use.

---

## Phase 6 — Light/Dark polish

Validate both themes.

Do not optimize one theme at the expense of the other.

---

## Phase 7 — Functional interaction audit

Test every interactive element manually or with appropriate UI tests.

No button or apparent control may remain unverified.

---

# 23. Final QA — Mandatory

The task is **not complete** until the following checklist passes.

## Visual consistency

- [ ] One coherent design language exists across the entire app.
- [ ] Primary navigation uses one clean visual system.
- [ ] Comparable panels use comparable proportions.
- [ ] Equivalent controls have equivalent heights.
- [ ] Spacing follows the shared token system.
- [ ] Typography follows a restrained shared hierarchy.
- [ ] Icon style and sizing are consistent.
- [ ] Corner radii are coherent.
- [ ] Borders and separators are minimal and consistent.
- [ ] No unnecessary card-style containers remain.
- [ ] No obvious arbitrary spacing values remain.
- [ ] Long text behaves correctly.
- [ ] Window resizing does not break composition.
- [ ] Light mode is polished.
- [ ] Dark mode is polished.

## Interaction

- [ ] Every visible button works.
- [ ] Every icon button works.
- [ ] Every clickable row works.
- [ ] Sidebar navigation works.
- [ ] Menus open correctly.
- [ ] Context menus work where present.
- [ ] Toggles update correctly.
- [ ] Text field actions work.
- [ ] Keyboard shortcuts still work.
- [ ] Hover states are coherent.
- [ ] Selection states are coherent.
- [ ] Focus states are coherent.
- [ ] Disabled states are coherent.
- [ ] No visible control has a misleading or tiny hit target.
- [ ] Clicking anywhere that visually appears to be part of a control triggers the intended action.

## Engineering safety

- [ ] Existing user-facing functionality is preserved.
- [ ] The project builds successfully.
- [ ] Existing tests pass.
- [ ] Relevant new tests pass.
- [ ] No visual refactor introduced obvious state-management regressions.
- [ ] No duplicated style systems remain when they can safely be consolidated.
- [ ] No placeholder UI remains from the redesign.

---

# 24. Completion Report

At the end of the work, provide a concise report containing:

1. **Design system created or consolidated**
2. **Major inconsistencies removed**
3. **Navigation changes**
4. **Reusable components created or unified**
5. **Long-text/truncation behavior**
6. **Light/dark-mode verification**
7. **List of interactions tested**
8. **Any remaining exceptions**
9. **Build/test status**

Do not claim completion if an interaction was not tested.

If something cannot be verified, explicitly say so.

---

# 25. Final Design Standard

The finished application should feel as though every visible dimension was chosen intentionally.

The user should notice:

- less visual noise,
- fewer boxes,
- fewer words,
- tighter alignment,
- better proportions,
- one coherent sidebar,
- cleaner panels,
- consistent type,
- subtle materials,
- immediate click response,
- no confusion about what is interactive.

The best result is not an interface that looks "designed".

The best result is an interface where **nothing visually gets in the way of the task**.
