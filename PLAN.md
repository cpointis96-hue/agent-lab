# Agent Lab — Master Plan

## Sources de vérité

- Produit et roadmap : `PROJECT.md`
- Règles du repository : `AGENTS.md` puis `AGENT.md`
- Boucle d’agents : `SUPERVISION.md`
- Plan exécutable complet : `docs/superpowers/plans/2026-08-18-agent-lab-m2-to-v1.md`

Les dépendances, sorties de build et schémas générés ne constituent pas des
spécifications. Aucun fichier `JAM.md` ou `jam.md` n’existe dans ce repository ;
le fichier concerné par les instructions d’agents est `AGENT.md`, avec
`AGENTS.md` comme point d’entrée compatible pour les coding agents.

## Organisation d’exécution

```text
Primary Codex — Builder + Orchestrator
  │
  ├── milestone-worker — exceptionnel, seulement si le gain dépasse le coût de contexte
  │
  └── supervisor — vérification indépendante après intégration
```

- Le primary possède les décisions, l’intégration, `PLAN.md` et la progression.
- Le travail normal est direct : lecture ciblée → implémentation → check ciblé.
- Un seul writer, aucun nested subagent ; le supervisor intervient au gate final.
- Computer Use est réservé au scénario UI touché et au gate `.app` final.

## Roadmap complète

| Milestone | Version | Résultat attendu | État |
|---|---|---|---|
| 1 | Foundation | Projet local, agent réel, édition, nœud et persistance | COMPLETE |
| 2 | V0.1 | Navigation filesystem, CodeMirror, conflits externes, Finder | COMPLETE |
| 3 | V0.1 | Création de fichiers, rename, suppression récupérable | COMPLETE |
| 4 | V0.1 | Catalogue pédagogique, ghost examples, Learn/Build | COMPLETE |
| 5 | V0.1 | Relations du graphe et contrats de handoff | COMPLETE |
| 6 | V0.1 | Templates, import non destructif et gate V0.1 | COMPLETE |
| 7 | V0.2 | AI Design Assistant preview-first | COMPLETE |
| 8 | V0.3 | Simulation déterministe et curriculum | COMPLETE |
| 9 | V0.4 | Skills, assignation et import sécurisé | COMPLETE |
| 10 | V0.5 | Runs réels, handoffs, approvals et reprise | COMPLETE |
| 11 | V1.0 | Stabilisation, recovery, accessibilité et distribution | IN PROGRESS |

Un milestone ne passe à `COMPLETE` qu’après :

1. tests ciblés et suite complète ;
2. typecheck et build frontend ;
3. tests Rust et contrôle du format ;
4. reconstruction du bundle `.app` ;
5. parcours Computer Use dans le vrai bundle ;
6. vérification des vrais fichiers sur disque ;
7. verdict `PASS` du supervisor.

Le milestone suivant reste verrouillé tant qu’un défaut bloquant du milestone
actif est connu.

## Milestone actif

### Milestone 11 — COMPLETE / final PASS (2026-08-19)

M1 à M11 sont `COMPLETE` avec PASS supervisor. Aucun milestone futur n’est commencé.

M11 est validé et clôturé.

### Milestone 8 — COMPLETE / PASS evidence (2026-08-18)

- Added a pure deterministic simulation reducer with Play, Step, Pause, Reset, approval blocking/resolution, synthetic payloads, trace events, and accessible payload motion with reduced-motion fallback.
- Added 12 ordered local curriculum lessons and a context-reset exercise that clears temporary UI context without touching project files.
- Added symlink-safe project inspection/scanning with a Rust regression proving escaped agent directories/files are never loaded.
- `npm run check` passed: 11 Vitest files / 15 tests, typecheck, and frontend build.
- Rust `cargo fmt --check` and `cargo test --offline` passed: 22 tests; `git diff --check` passed.
- Fresh debug `.app` rebuilt successfully at `src-tauri/target/debug/bundle/macos/Agent Lab.app`.
- Packaged Computer Use verified payload, Play/Pause, Step, Reset, trace inspection, approval blocking/resolution, curriculum, context reset, and unchanged project files.
- Supervisor verdict: `PASS`.

### Milestone 9 — COMPLETE / PASS evidence (2026-08-18)

- Added local skill discovery from `skills/<slug>/SKILL.md`, inert trust metadata, and visual Agent ↔ Skill assignment persisted in `agent-lab.json`.
- Added explicit local import preview with complete file inventory, executable-looking file warnings, collision checks, Cancel, and inert import apply.
- Import confinement rejects source/destination symlinks, stages atomically, rolls back failed copies, and never executes imported content.
- `npm run check` passed: 12 Vitest files / 17 tests, typecheck, and frontend build.
- Rust `cargo fmt --check` and `cargo test --offline` passed: 26 tests; `git diff --check` passed.
- Rebuilt debug `.app` and verified the packaged skill discovery, assignment persistence, inert preview/import, cancellation, and reopen journey with Computer Use.
- Filesystem evidence confirmed byte-identical imported files, no symlinks or staging leftovers, and no script process or execution marker.
- Supervisor verdict: `PASS`.

### Milestone 10 — COMPLETE / PASS evidence (2026-08-19)

- Added durable `runs/run-XXXX/` storage with `task.md`, `run.json`, append-only `events.jsonl`, `approvals`, `handoffs`, and `outputs` boundaries.
- Added an explicit local provider abstraction with controlled provider failure, approval/rejection, cancellation, resume, and permission-gated state transitions.
- Added durable handoff artifacts from graph edges and local usage metrics with estimated-cost provenance and no telemetry.
- Enforced project-root and interior-artifact confinement, symlink rejection, atomic JSON replacement, and locked event sequence allocation.
- `npm run check` passed: 12 Vitest files / 17 tests; Rust `cargo fmt --check` and `cargo test --offline` passed: 28 tests; `git diff --check` passed.
- Rebuilt the debug `.app`; packaged Computer Use verified approval completion, rejection, cancel → resume → approval, run history, append-only events, and persisted output after relaunch.
- Filesystem evidence confirmed run artifacts remain under `runs/`, permanent agent files are unchanged, and imported scripts remain inert.
- Supervisor verdict: `PASS`.

### Milestone 11 — COMPLETE / PASS evidence (2026-08-19)

- Added explicit schema migration with metadata backup, atomic commit, future-schema refusal, missing/corrupt metadata handling, and watcher snapshot batching coverage.
- Added actionable accessible missing-skill errors, reduced-motion fallback coverage, and cleanup of skill assignments when an agent moves to recovery, with restore preservation.
- Completed the V1 packaged journey: fresh project, Researcher, Analyst, handoff, local inert `fact-check`, edited AI Reviewer proposal/apply without overwriting existing agents, simulation, handoff inspection, close/reopen, and layout/state persistence.
- Debug and release `.app` bundles built; final checks pass: `npm run check` (14 Vitest files / 19 tests), Rust format/tests (32 tests), and `git diff --check`.
- Final packaged evidence: release app reopened 3 agents, 2 handoffs, inert `fact-check`, persisted assignment, actionable missing-skill error, no secret-like strings or unintended run artifacts; reduced-motion fallback verified in source.
- Supervisor verdict: `PASS`.

### Milestone 7 — COMPLETE / PASS evidence (2026-08-18)

- Added a deterministic offline provider abstraction and AI Design Assistant preview.
- Generate, Explain, Simplify, and Cancel remain non-writing; proposal role purposes are editable before Apply.
- Apply reuses the confined atomic template path and persists only the displayed proposal.
- `npm run check` passed: 9 Vitest files / 10 tests, typecheck, and frontend build.
- Rust `cargo fmt --check` and `cargo test --offline` passed: 21 tests; `git diff --check` passed.
- Fresh debug `.app` rebuilt successfully at `src-tauri/target/debug/bundle/macos/Agent Lab.app`.
- Packaged Computer Use verified disabled-provider messaging, no filesystem writes before Apply, editable preview, Explain, Simplify, Cancel, explicit Apply, 2 agents, 1 relation, and preservation of the original `AGENTS.md`.
- Supervisor verdict: `PASS`.

### Milestone 5 — Manual graph relations and handoff contracts

### Milestone 5 — COMPLETE / PASS evidence (2026-08-18)

- Added validated graph relations with deterministic IDs, endpoint/self-edge/duplicate checks, and tolerant legacy metadata defaults.
- Added persisted Rust `upsert_edge` / `delete_edge` commands and an accessible relation inspector for type, label, description, payload, blocking, and condition.
- Fixed new-connection identity so changing endpoints or relation cannot orphan or replace an existing edge; existing edits preserve their ID.
- `npm run check` passed: 6 Vitest files / 7 tests, typecheck, and frontend build.
- Rust passed: `cargo fmt --check` and 18 offline tests; `git diff --check` passed.
- Fresh debug `.app` rebuilt successfully at `src-tauri/target/debug/bundle/macos/Agent Lab.app` (app-only bundle; the unrelated DMG helper remains outside M5 scope).
- Packaged Computer Use verified 3 agents, 2 saved relations, handoff payload persistence, close/reopen persistence, and direct `agent-lab.json` evidence.
- Supervisor verdict: `PASS`.

### Milestone 2 — COMPLETE

**Objectif**

Afficher l’arborescence réelle du projet, éditer les fichiers Markdown avec un
éditeur adapté, préserver l’état saved/unsaved, détecter les changements
externes sans écrasement silencieux et révéler les éléments dans Finder.

**Ordre d’exécution**

1. Séparer les responsabilités de `App.tsx` et `lib.rs` sans changer le comportement.
2. Ajouter l’inventaire de fichiers et un contrat de révision conflict-safe.
3. Afficher le vrai filesystem dans le navigator.
4. Intégrer CodeMirror avec `⌘S`, undo/redo et recherche.
5. Détecter les changements externes par polling de métadonnées borné.
6. Ajouter Reload, Compare et Keep mine.
7. Exposer Reveal in Finder.
8. Exécuter le gate complet Milestone 2 puis demander le verdict supervisor.

Les fichiers, interfaces, tests, commandes et parcours Computer Use exacts sont
décrits dans le plan exécutable lié en tête de ce document.

### Milestone 2 — PASS evidence (2026-08-18)

- `npm run check` passed: typecheck, 3 Vitest files / 3 tests, and frontend build.
- `cargo fmt --check --manifest-path src-tauri/Cargo.toml` and offline Rust tests passed: 6 tests.
- Rebuilt debug bundle passed: `src-tauri/target/debug/bundle/macos/Agent Lab.app`.
- Computer Use in the rebuilt bundle verified the real filesystem tree, CodeMirror Markdown editing, `Unsaved`, `⌘S` / `Saved`, external conflict detection, `Compare`, `Reload`, `Keep mine`, and Finder reveal.
- Direct filesystem evidence confirmed `Mine survives the conflict.` after `Keep mine`.
- Delegation governance was hardened with two lifecycle slots, inherited local agent models, explicit close/fallback rules, and a sequential single-writer policy. The saturated worker was closed explicitly before supervisor recovery.
- Supervisor verdict: `PASS`.
- UI polish follow-up also passed: save confirmation toasts removed, bottom Save action removed, compact accessible header save control verified in the rebuilt bundle, including normal Save and Keep mine persistence after reopen. Independent supervisor verdict: `PASS`.

M1 à M7 sont COMPLETE ; M8 est maintenant autorisé mais n’a pas commencé.

### Milestone 4 — COMPLETE / PASS evidence (2026-08-18)

- Task 10: static file building-block catalog with use/avoid explanations and convention badges.
- Task 11: render-only ghost examples with explicit `Use example` insertion.
- Task 12: Learn/Build mode persisted in `agent-lab.json`, defaulting to Learn for older metadata.
- Targeted checks pass: catalog/ghost Vitest tests, UI-mode Rust test, typecheck, and `git diff --check`.
- Tier 3 gate PASS: `npm run check`, 16 Rust tests, `cargo fmt --check`, `git diff --check`, rebuilt `.app`, packaged Computer Use journey, and filesystem evidence.
- Build mode hides catalog explanations until `Why?`; convention badges use Open, Agent Lab, Runtime, and Custom categories.
- Ghost example remained zero bytes until explicit use/save; Learn/Build persisted in `agent-lab.json` and survived reopen.
- Supervisor verdict: `PASS`.

### Milestone 3 — COMPLETE / PASS evidence (2026-08-18)

- Task 7: `create_project_file`, Add file dialog, supported-extension/traversal/duplicate tests, and `TOOLS.md` UI/filesystem evidence.
- Task 8: transactional `rename_agent`, metadata rollback, edge endpoint update, dialog, and Rust conflict/edge test.
- Task 9: preview, recoverable trash, manifest, restore, symlink guard, dialogs/panel, and recovery tests.
- Targeted checks pass: 15 Rust tests, `cargo fmt --check`, `npm run check`, and `git diff --check`.
- Tier 3 gate PASS: `npm run check`, 15 Rust tests, `cargo fmt --check`, `git diff --check`, rebuilt `.app`, packaged Computer Use journey, and direct filesystem evidence.
- Computer Use verified Add file/cancel/create, transactional rename, delete preview/cancel, recoverable move, restore, relaunch, and retained node/content.
- Supervisor verdict: `PASS`.

## Milestone 1 — COMPLETE

Le premier vertical slice a été validé dans le vrai bundle `.app` avec Computer Use :

- création et ouverture de projets locaux ;
- création de `agents/<slug>/AGENT.md` réel ;
- édition et sauvegarde atomique ;
- nœud visible, déplacement et position persistée dans `agent-lab.json` ;
- fermeture complète, relance, réouverture et restauration ;
- validation des chemins et blocage du path traversal ;
- aucune fonctionnalité IA ni exécution de contenu projet.

### Incident bundle corrigé

Cause exacte : `src-tauri/icons/icon.png` était un PNG RGBA 16 bits. Tauri
attendait un buffer RGBA 8 bits et paniquait pendant `did_finish_launching` avec :

```text
invalid icon: The specified dimensions (512x512) don't match the number of pixels supplied by the rgba argument (524288)
```

Correction : icône `512x512`, `8-bit/color RGBA`. Le bundle reconstruit démarre
sans panic ni nouveau crash report.

### Incident d’interactivité corrigé

Cause exacte : `window.prompt()` ouvrait un dialogue WebView invisible et
bloquant. Le cercle `◌` était un glyph d’état vide, pas un spinner.

Correction : formulaire React contrôlé, sans suppression du `busy` ni
contournement CSS global.

Validation Computer Use : ouverture du formulaire `+`, création d’un agent,
édition/sauvegarde, déplacement du nœud, fermeture, relance et restauration. Les
vrais fichiers et la position enregistrée ont été inspectés sur disque.

Commandes de baseline actuellement réussies :

```bash
npm run typecheck
npm run build
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo test --offline --manifest-path src-tauri/Cargo.toml
```

## Packaging

- `scripts/bundle-dmg.sh` est le point d’entrée versionné pour le build DMG.
- Le bundle `.app` debug est généré avec succès.
- La création physique du DMG a déjà rencontré `hdiutil: Périphérique non configuré`.
- Le DMG ne bloque pas le développement produit ; il sera revérifié au gate V1.0.
- Signing, notarization et publication nécessiteront une autorisation et les credentials correspondants.

## Scope discipline

### Milestone 6 — COMPLETE / PASS evidence (2026-08-18)

- Added ten workflow templates with exact no-write previews listing every generated `AGENT.md` path and edge endpoint.
- Added atomic Rust `apply_template` with full proposal validation and rollback of staged agent folders on failure.
- Added read-only existing-project inspection and confirmation before opening; original files remain in place.
- Added `⌘K` and `⌘P` command-palette access.
- `npm run check` passed: 7 Vitest files / 8 tests, typecheck, and frontend build.
- Rust passed: `cargo fmt --check` and 21 offline tests; `git diff --check` passed.
- Fresh debug `.app` rebuilt at `src-tauri/target/debug/bundle/macos/Agent Lab.app`.
- Packaged Computer Use verified import review, exact template preview, apply, 3 agents, 2 handoff edges, and both palette shortcuts.
- Filesystem evidence confirmed 3 agent files, 2 persisted edges, preserved `AGENTS.md`, and no original `PROJECT.md` created.
- Supervisor verdict: `PASS`.

Tous les milestones V1 planifiés sont validés. Aucun milestone futur n’est commencé.
