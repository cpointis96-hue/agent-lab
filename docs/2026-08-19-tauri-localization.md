# Agent Lab Tauri Localization Implementation Plan

**Goal:** Localize the existing Tauri/React macOS application in English and French with an immediate, local-only language preference.

**Architecture:** Use a small typed translation runtime in the React frontend because this project has no SwiftUI/AppKit target and cannot consume Apple `LocalizedStringResource` or `.xcstrings` at runtime. Keep stable semantic keys, locale catalogs checked into the repository, a `LanguageProvider` around the app, and `localStorage` for the app-wide preference. `System` resolves from the macOS/WebView preferred languages and updates when the system preference changes; explicit English/French choices override it.

**Tech Stack:** React, TypeScript, Tauri 2, Vitest, localStorage, `Intl.PluralRules`/`Intl.NumberFormat` where needed; no new dependency and no network translation.

**Spec:** User request in the conversation, adapted to the confirmed Tauri architecture.

## Global Constraints

- Only English, French, and System selection are exposed.
- No external translation API, network request, or runtime machine translation.
- Keep filesystem behavior, navigation, layout, light/dark appearance, and local-first boundaries unchanged.
- Do not translate internal file names, project metadata keys, logs, code examples, or user-authored project content.
- Preserve compact macOS developer-tool styling from `DESIGN.md`.
- One writer; update `PLAN.md` only when implementation evidence changes.

### Task 1: Add the typed local catalog and language runtime

**Files:**
- Create: `src/i18n/catalog.ts`
- Create: `src/i18n/language.tsx`
- Create: `src/i18n/language.test.ts`
- Modify: `src/main.tsx`

Implement stable dotted keys, English source strings, French translations, interpolation helpers, plural helpers, system-locale resolution, and a React context exposing `language`, `resolvedLocale`, `setLanguage`, and `t`. Persist only `system`, `en`, or `fr` in `localStorage`.

### Task 2: Migrate shared app chrome and settings access

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/LanguageSettings.tsx`

Wrap the app with the provider, replace visible app-shell strings and dynamic notices with translation keys, and expose a compact language selector from the existing overflow/actions area. Keep the selector as a native `select`/menu-like control with System, English, and Français; changing it must rerender immediately without reopening the app.

### Task 3: Migrate feature components and accessible labels

**Files:**
- Modify: all user-facing files under `src/components/`, `src/content/lessons.ts`, `src/domain/fileCatalog.ts`, and `src/templates/workflows.ts` where strings are rendered as UI copy.

Replace hardcoded labels, buttons, headings, empty states, error copy, tooltips, placeholders, accessibility labels, pluralized counts, and status text. Leave internal identifiers, Markdown starters, filenames, test fixtures, and user/project content unchanged.

### Task 4: Verify the localization surface

**Files:**
- Modify: `src/i18n/language.test.ts` and focused component tests if needed.

Test catalog completeness, interpolation, plural behavior, persisted selection, System fallback, and immediate rerender semantics. Run `npm run check`, `cargo fmt --check --manifest-path src-tauri/Cargo.toml`, `cargo test --offline --manifest-path src-tauri/Cargo.toml`, and `git diff --check`.

### Task 5: Build and inspect the actual macOS bundle

Build the app-only debug bundle, inspect the resulting `.app`, and verify English, French, System, light mode, dark mode, resizing, settings access, and no visible missing keys. Report frontend/build evidence separately from packaged-app evidence; do not claim installed-app validation unless the rebuilt app is explicitly copied and launched there.
