# Rapport QA — passe de localisation

Date : 2026-08-19

## Bug fonctionnel / rédactionnel observé

- **État vide du flux** : le texte « Faites glisser un nœud pour enregistrer sa disposition. » est rendu deux fois à la suite. Le problème existe aussi en anglais avec la phrase correspondante. Il ne bloque pas l’utilisation, mais le texte est redondant.

## Points contrôlés

- Écran d’accueil et création/ouverture de projet.
- Aperçu d’import sans écriture.
- Navigateur, guide des fichiers, fichiers optionnels et inspecteur.
- Flux vide, simulation, trace et récupération.
- Menu d’actions, modèles et sélecteur Système / English / Français.
- Basculement anglais/français observé dans le bundle `.app` ; le français est bien répercuté immédiatement dans les libellés inspectés.

## Limite de cette passe

Le parcours a été effectué sur un projet sans agent ni exécution persistée. Les écrans qui dépendent de données réelles (agent sélectionné, exécution, skill importée, conflit d’édition) doivent encore être parcourus avec des fixtures dédiées pour une couverture complète de leurs contenus dynamiques.
