# Agent Lab

Application macOS locale pour concevoir et comprendre des architectures d’agents : fichiers Markdown, graphe de rôles et handoffs, édition, exercices, simulation et traces de runs. Les fichiers du projet sont la source de vérité ; `agent-lab.json` conserve les métadonnées de l’application.

## État et périmètre

Le code contient un éditeur CodeMirror, une navigation filesystem, création/renommage de fichiers et agents, suppression récupérable, templates, catalogue pédagogique, import de skills, modes Learn/Build, simulation, approvals et stockage des runs. Interface française/anglaise, avec préférence système.

Les providers livrés sont **locaux et déterministes**. L’assistant génère des propositions à partir de règles ; les runs produisent une sortie locale démonstrative. Ce n’est pas une connexion à OpenAI/Claude ou un moteur d’agents autonomes exécutant les outils du projet. Les métriques de tokens/coûts sont illustratives, pas une facturation réelle.

Vérifié pour cette préparation : 25 tests frontend, typecheck/build et format Rust. La compilation Rust s’arrête actuellement sur la licence Xcode non acceptée dans l’environnement de test. Reconstruction `.app`, lancement natif et nouvelles captures restent à faire. Les validations historiques du `PLAN.md` sont conservées, mais ne remplacent pas cette vérification actuelle.

## Installer et exécuter

Prérequis macOS : Node `^20.19.0 || >=22.12.0`, npm, Rust/Cargo et outils Apple de compilation installés et initialisés. L’utilisateur doit lui-même consulter et accepter les éventuels accords Apple requis.

```sh
npm ci
npm run tauri dev
```

`npm run dev` seul sert le frontend Vite ; les opérations filesystem/dialogue dépendent de Tauri et ne deviennent pas un service web hébergé.

Build de l’application seule :

```sh
npm run tauri build -- --bundles app
```

Sortie attendue : `src-tauri/target/release/bundle/macos/Agent Lab.app`. `npm run bundle:dmg` utilise explicitement un build **debug** et n’est pas une distribution notarifiée. Pas de nouveau binaire/release hébergé fourni pour l’instant ; cette préparation ne contourne pas Gatekeeper.

## Architecture

- React 19, TypeScript, Vite 7, CodeMirror 6, Tauri 2 et backend Rust.
- `src/domain/` : modèles purs, graphe, templates, proposals et reducer de simulation.
- `src/components/`, `src/i18n/` : interface et catalogues FR/EN.
- `src-tauri/src/lib.rs` : commandes, validation des chemins et snapshots.
- Modules Rust `recovery`, `migrations`, `skills`, `runs`, `run_engine`, `permissions` : persistance, import inerte, transitions et approvals.
- Stockage local des agents/skills/runs, écritures atomiques et protections contre traversal/symlink ; pas d’exécution arbitraire du contenu importé.

## Vérifications

```sh
npm run check
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo test --locked --manifest-path src-tauri/Cargo.toml
```

[Rapport actuel](docs/PORTFOLIO-VERIFICATION.md). Le build frontend signale un chunk JavaScript de plus de 500 kB. L’audit npm signale deux entrées modérées liées à Vitest/mocker ; elles restent à traiter par une mise à niveau testée, pas `npm audit fix --force` sans revue.

## Reprendre

Commencer par débloquer l’outil Apple, relancer les tests Rust et reconstruire `.app`. Dans un dossier de démonstration neuf : créer un projet et deux agents, éditer/sauvegarder, relier les rôles, simuler, importer un skill inerte, exercer approval/refus/reprise, fermer et rouvrir ; vérifier les vrais fichiers et capturer ces écrans. Ne pas tester sur un dossier personnel important.

Un futur provider réseau exige un contrat explicite, consentement avant transmission du contenu, permissions et tests de panne ; rien de cela n’est implicitement livré par le provider local. Les conditions de signature/notarisation et de distribution restent à régler.

`PROJECT.md` décrit le produit et ses ambitions ; `PLAN.md` garde l’historique de progression, y compris quelques états de tableau plus anciens que les sections de validation. L’historique Git original a été conservé sans changer ses dates. Les worktrees, caches, dépendances et builds ne font pas partie de l’archive de sources. Le design existant n’a pas été modifié.

## Dépôt et téléchargement

[Voir le dépôt](https://github.com/cpointis96-hue/agent-lab) · [Télécharger les sources ZIP](https://github.com/cpointis96-hue/agent-lab/archive/HEAD.zip). Le ZIP contient les sources ; le bundle natif reste à reconstruire et vérifier.
