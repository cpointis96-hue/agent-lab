# Préparation portfolio — 4 octobre 2026

Copie du checkout propre `master`, commit original `0db20b9` (20 août 2026), historique conservé. Pas de changement d’interface ni de nouveau milestone ; les états et PASS historiques du plan ne sont pas réattribués à cette préparation.

## Résultats actuels

- `npm ci --ignore-scripts` : installation verrouillée réussie, 133 paquets ajoutés.
- `npm run check` : 16 fichiers de tests, 25 tests Vitest 3.2.7 réussis ; typecheck puis `tsc -b` et Vite 7.3.6 réussis. Chunk principal 866,91 kB avant gzip ; avertissement de taille, pas erreur.
- `cargo fmt --check` : succès.
- `cargo test --locked --offline` : dépendances manquantes ; nouvelle tentative réseau verrouillée a téléchargé les crates requises puis échoué au linker Apple : licence Xcode non acceptée, code 69. Les tests Rust n’ont **pas** été exécutés avec succès ici.
- `npm audit --json` : deux entrées modérées, Vitest et `@vitest/mocker`, pour [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9). Pas de mise à jour forcée appliquée.
- Code inspecté : provider frontend `disabled-local`, backend `LocalDeterministicProvider`, sans requête de modèle réseau ; coûts estimés, sorties illustratives.

## À compléter

Après initialisation des outils Apple par l’utilisateur : tests Rust, reconstruction du bundle, parcours réel dans `.app`, preuves filesystem et captures. Computer Use a signalé le Mac verrouillé. Aucun screenshot web n’est utilisé pour faire croire à un parcours desktop complet. Signing, notarisation, DMG et release GitHub actuels non vérifiés.
