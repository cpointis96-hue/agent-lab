# Agent Lab — PROJECT.md

> **Statut :** spécification produit de référence  
> **Cible initiale :** macOS, local-first  
> **Format de sortie :** application macOS `.app`, distribuable ensuite en `.dmg`  
> **Version du document :** 1.0  
> **Principe directeur :** comprendre avant d’automatiser

---

## 0. Rôle de ce fichier

Ce fichier décrit **ce qu’est Agent Lab, pourquoi il existe, comment il doit se comporter et comment ses concepts doivent être représentés**.

Il ne remplace pas `AGENTS.md`.

- `PROJECT.md` = vérité produit : vision, concepts, UX, architecture fonctionnelle, roadmap, critères d’acceptation.
- `AGENTS.md` = règles de travail données aux coding agents : discipline d’implémentation, conventions techniques, tests, sécurité, style de code.

Quand une décision d’implémentation entre en conflit avec ce document, préserver d’abord :

1. la clarté pédagogique ;
2. la transparence du filesystem ;
3. la simplicité ;
4. la sécurité ;
5. la fiabilité.

### Vocabulaire normatif

Dans ce document :

- **MUST** = obligatoire.
- **SHOULD** = fortement recommandé ; on ne s’en écarte qu’avec une raison concrète.
- **MAY** = optionnel.
- **FUTURE** = prévu conceptuellement, mais ne doit pas être implémenté trop tôt.

---

# 1. Vision du produit

## 1.1 Définition

**Agent Lab** est une petite application desktop locale permettant d’**apprendre, construire, visualiser et expérimenter des architectures d’agents IA** à partir de vrais fichiers lisibles sur le disque.

Agent Lab n’est pas :

- un chatbot généraliste ;
- un clone de n8n ;
- un IDE complet ;
- un orchestrateur enterprise ;
- un marketplace de prompts ;
- un système autonome opaque.

Agent Lab doit donner à l’utilisateur l’impression d’ouvrir un **laboratoire visuel pour systèmes agentiques**.

L’utilisateur doit pouvoir passer naturellement entre quatre niveaux :

1. **Comprendre** un concept.
2. **Créer** manuellement ce concept.
3. **Demander à l’IA** de proposer ou créer ce concept.
4. **Observer** comment les concepts communiquent dans un workflow.

## 1.2 Problème que le produit résout

Les systèmes d’agents sont souvent appris à travers :

- des diagrammes abstraits ;
- de gros frameworks ;
- des fichiers de configuration copiés sans compréhension ;
- des démos multi-agents déjà complexes ;
- des interfaces où l’utilisateur voit des nœuds mais ne sait pas ce qu’ils représentent réellement.

Agent Lab doit faire l’inverse.

À tout moment, l’utilisateur doit pouvoir répondre aux questions :

- Quel agent existe ?
- Pourquoi existe-t-il ?
- Quel est son rôle exact ?
- Quels fichiers définissent cet agent ?
- Lesquels sont nécessaires et lesquels sont facultatifs ?
- Quelles informations cet agent reçoit-il ?
- Quelles informations transmet-il ?
- À quel autre agent ?
- Pourquoi cette liaison existe-t-elle ?
- Où ces données sont-elles stockées sur mon disque ?
- Qu’est-ce qui est permanent ?
- Qu’est-ce qui appartient seulement à une tâche ?
- Qu’est-ce qui appartient seulement à une exécution ?
- Qu’est-ce qui est une skill ?
- Qu’est-ce qui est un tool ?
- Où intervient un humain ?
- Qu’est-ce qui changerait si je supprimais un élément ?
- Est-ce que mon architecture est inutilement compliquée ?

## 1.3 North Star

> **Chaque élément visuel doit correspondre à un concept réel et compréhensible, et chaque concept persistant doit pouvoir être retrouvé dans des fichiers locaux lisibles.**

---

# 2. Utilisateur cible

## 2.1 Utilisateur principal

Le produit est conçu d’abord pour une personne qui :

- découvre les agents IA ;
- sait utiliser Finder et un éditeur de texte ;
- comprend progressivement les notions de prompt, contexte, agent, tool, memory, skill et workflow ;
- veut apprendre en construisant ;
- ne veut pas commencer avec Kubernetes, un gros framework ou une infrastructure complexe ;
- veut voir ce que l’IA fait au lieu de lui déléguer aveuglément l’architecture.

## 2.2 Objectifs pédagogiques

Après utilisation d’Agent Lab, un utilisateur doit être capable d’expliquer avec ses propres mots :

- la différence entre un agent et une tâche ;
- la différence entre un agent et une skill ;
- la différence entre une skill et un tool ;
- la différence entre contexte, état et mémoire ;
- la différence entre délégation et handoff ;
- la différence entre une instruction permanente et une donnée d’exécution ;
- pourquoi un reviewer peut être séparé ou fusionné avec un autre agent ;
- pourquoi certains systèmes ont un orchestrateur et d’autres non ;
- pourquoi plus d’agents n’est pas automatiquement mieux ;
- comment un workflow séquentiel diffère d’un workflow parallèle ;
- où placer une approbation humaine ;
- ce que signifie « filesystem as source of truth » ;
- comment un système peut reprendre après interruption sans dépendre uniquement du contexte conversationnel.

---

# 3. Principes produit non négociables

## 3.1 Local-first

Le fonctionnement de base MUST être utilisable sans compte, sans cloud et sans fournisseur d’IA.

Sans IA, l’utilisateur doit pouvoir :

- créer un projet ;
- créer des agents ;
- créer leurs fichiers ;
- écrire/modifier le Markdown ;
- créer des skills ;
- relier des agents ;
- construire un diagramme ;
- ouvrir le projet dans Finder ;
- apprendre les différents patterns de workflow ;
- utiliser les exemples pédagogiques ;
- sauvegarder et rouvrir son projet.

## 3.2 Filesystem as source of truth

Les vraies définitions du projet MUST être des fichiers locaux lisibles.

Ne jamais stocker le contenu essentiel d’un agent dans une base de données opaque.

Exemples de contenu qui doit rester dans des fichiers :

- instructions ;
- rôle ;
- mémoire explicite ;
- règles ;
- skills ;
- contexte partagé ;
- tâches ;
- handoffs ;
- outputs.

`agent-lab.json` sert uniquement aux métadonnées de l’application.

## 3.3 IA optionnelle, jamais magique

L’IA peut :

- expliquer ;
- proposer ;
- pré-remplir ;
- générer ;
- simplifier ;
- analyser ;
- suggérer des fichiers ;
- suggérer une architecture.

Mais avant de modifier le filesystem à partir d’une génération IA, Agent Lab MUST afficher une **prévisualisation compréhensible**.

Le principe est :

> **Propose → explique → laisse modifier → applique.**

Pas :

> **Prompt → mutation silencieuse.**

## 3.4 Apprendre quand NE PAS ajouter

Agent Lab ne doit jamais donner l’impression qu’un projet sérieux nécessite :

- beaucoup d’agents ;
- beaucoup de fichiers `.md` ;
- une mémoire ;
- un orchestrateur ;
- des sous-agents ;
- un reviewer ;
- une hiérarchie.

L’application doit explicitement pouvoir dire :

> « Un seul agent suffit probablement ici. »

ou :

> « `MEMORY.md` n’apporte rien pour cet agent stateless. »

## 3.5 Pas de faux standard

Agent Lab MUST distinguer :

- les formats réellement documentés comme conventions ouvertes ;
- les conventions répandues ;
- les conventions internes à Agent Lab ;
- les fichiers générés pendant l’exécution ;
- les fichiers personnalisés créés par l’utilisateur.

L’application ne doit jamais faire croire que `SOUL.md`, `MEMORY.md` ou `AGENT.md` constituent un standard universel.

---

# 4. Forme de l’application

## 4.1 Type d’application

Agent Lab est une **vraie application macOS desktop**.

Cible technique :

- Tauri 2 ;
- React ;
- TypeScript ;
- `@xyflow/react` pour le graphe ;
- CodeMirror 6 pour l’édition Markdown, sauf raison forte d’utiliser un autre éditeur ;
- backend Tauri/Rust pour les opérations sensibles sur le filesystem.

La version de production doit pouvoir être compilée en :

- `Agent Lab.app`
- puis `Agent Lab.dmg` pour distribution directe.

## 4.2 Pourquoi pas une simple web app

Agent Lab doit manipuler de vrais fichiers choisis par l’utilisateur, ouvrir Finder, surveiller des changements externes et rester local-first.

L’UI utilise des technologies web, mais le produit final doit se comporter comme une application Mac.

## 4.3 macOS-first, architecture portable

La priorité UX est macOS.

Ne pas bloquer volontairement un futur port Windows/Linux, mais ne pas sacrifier la qualité Mac pour une abstraction prématurée.

---

# 5. Philosophie UX

## 5.1 Impression générale

L’interface doit évoquer un outil développeur moderne, calme et extrêmement lisible.

Référence d’esprit : applications de développement minimalistes comme Codex.

Ne pas copier :

- logo ;
- branding ;
- assets ;
- textes propriétaires ;
- détails visuels propriétaires.

Reprendre seulement les principes :

- densité maîtrisée ;
- navigation directe ;
- peu de boutons ;
- surfaces calmes ;
- hiérarchie typographique nette ;
- icônes fines ;
- transitions discrètes.

## 5.2 À éviter

- dashboard rempli de cartes ;
- gradients ;
- grosses tuiles ;
- couleurs décoratives ;
- menus permanents partout ;
- workflow spaghetti ;
- connecteurs façon usine ;
- gros panneaux modaux ;
- jargon non expliqué ;
- paramètres dispersés.

## 5.3 Règle UX centrale

> **Nothing should be more than one click away from the thing it represents.**

## 5.4 Design visuel verrouillé

Le design natif macOS actuellement livré est une décision produit verrouillée.
La référence détaillée se trouve dans `DESIGN.md` à la racine du projet.

Les futures fonctionnalités doivent réutiliser fidèlement ses proportions,
sa typographie, ses couleurs, ses séparateurs, ses arrondis, ses états de
sélection et sa hiérarchie de panneaux. Une modification visuelle nécessite une
validation explicite du propriétaire. Une demande de changement de comportement
ou de délai d'interaction ne constitue pas une autorisation de redesign.

Exemples :

- cliquer un agent → voir sa définition ;
- cliquer un fichier → l’éditer ;
- cliquer une skill → voir `SKILL.md` ;
- cliquer une liaison → voir son contrat de communication ;
- cliquer un run → voir sa trace ;
- cliquer un handoff → voir ce qui a été transmis.

---

# 6. Structure générale de l’interface

## 6.1 Layout principal

L’écran principal comporte trois zones permanentes :

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Agent Lab                         Project Name              controls │
├──────────────┬────────────────────────────┬──────────────────────────┤
│ PROJECT      │ INSPECTOR / EDITOR         │ FLOW                     │
│              │                            │                          │
│ Agents       │ contenu sélectionné        │ graphe                    │
│ Skills       │                            │                          │
│ Shared       │                            │                          │
│ Runs         │                            │                          │
│              │                            │                          │
├──────────────┴────────────────────────────┴──────────────────────────┤
│ > Ask Agent Lab…                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

La barre de prompt du bas peut être masquée quand aucun fournisseur IA n’est configuré ou fonctionner en mode aide locale pour les actions non-IA.

## 6.2 Panneau gauche — Project Navigator

Sections :

- Agents
- Skills
- Shared
- Workflows
- Runs (quand cette fonction existe)

Actions :

- `+`
- recherche locale
- menu contextuel
- reveal in Finder

Le `+` adapte ses choix au contexte.

Exemple sous `Agents` :

- New Agent
- Import Agent

Exemple sous `Skills` :

- New Skill
- Import Skill

## 6.3 Panneau central — Inspector / Editor

Le panneau central change selon la sélection :

- agent → fiche de l’agent ;
- fichier → éditeur Markdown ;
- skill → fiche + `SKILL.md` ;
- edge → contrat de communication ;
- workflow → résumé ;
- run → trace ;
- approval → décision.

Le breadcrumb doit rester compact.

Exemple :

`Researcher / AGENT.md`

## 6.4 Panneau droit — Flow

Le graphe sert à comprendre l’architecture.

Il ne doit pas devenir un outil low-code surchargé.

Fonctions :

- sélectionner ;
- déplacer ;
- connecter ;
- supprimer une connexion ;
- zoomer ;
- recentrer ;
- auto-layout ;
- visualiser les groupes ;
- afficher/masquer les skills ;
- afficher le sens de circulation.

---

# 7. Modèle mental fondamental

Agent Lab doit enseigner les distinctions suivantes.

## 7.1 Agent

Un **Agent** est une entité possédant une responsabilité relativement stable.

Exemples :

- Researcher
- Analyst
- Reviewer
- Orchestrator
- Writer

Un agent n’est pas une tâche.

## 7.2 Task

Une **Task** est une demande ponctuelle.

Exemple :

> « Compare Tauri et Electron pour notre application. »

La tâche peut être donnée à un agent sans modifier l’identité permanente de cet agent.

## 7.3 Run

Un **Run** est une exécution particulière d’une tâche ou d’un workflow.

Deux runs peuvent utiliser les mêmes agents mais produire des résultats différents.

## 7.4 Context

Le **Context** correspond aux informations rendues disponibles pour agir maintenant.

Il peut provenir de :

- tâche ;
- instructions ;
- fichiers partagés ;
- mémoire ;
- résultats précédents ;
- handoff ;
- outils ;
- paramètres utilisateur.

## 7.5 State

Le **State** représente la situation actuelle de l’exécution :

- étape ;
- progression ;
- attente ;
- erreur ;
- approbation requise ;
- résultat intermédiaire.

## 7.6 Memory

La **Memory** désigne une information volontairement conservée au-delà d’une seule interaction ou d’un seul run.

La mémoire ne doit pas servir de poubelle pour tout l’historique.

## 7.7 Tool

Un **Tool** est une capacité d’action.

Exemples :

- web search ;
- filesystem ;
- shell ;
- API ;
- database ;
- calculator.

Un tool n’est pas un agent.

## 7.8 Skill

Une **Skill** est une procédure réutilisable, un paquet d’instructions ou de ressources permettant à un agent de mieux accomplir un type de tâche.

Une skill n’est pas une personnalité.

Une skill n’est pas obligatoirement un exécutable.

## 7.9 Handoff

Un **Handoff** transmet la responsabilité ou un résultat d’un agent à un autre.

## 7.10 Delegation

Une **Delegation** signifie qu’un agent confie une sous-tâche à un autre, tout en restant conceptuellement responsable du travail global.

## 7.11 Review

Une **Review** est une évaluation d’un résultat selon des critères.

## 7.12 Approval

Une **Approval** est une décision humaine ou politique qui bloque la suite tant qu’elle n’est pas accordée.

---

# 8. Modèle de projet sur disque

## 8.1 Structure par défaut

```text
my-agent-project/
├── PROJECT.md
├── AGENTS.md
├── agent-lab.json
│
├── agents/
│   ├── orchestrator/
│   │   ├── AGENT.md
│   │   └── STATUS.md
│   │
│   ├── researcher/
│   │   ├── AGENT.md
│   │   ├── TOOLS.md
│   │   └── STATUS.md
│   │
│   └── reviewer/
│       └── AGENT.md
│
├── skills/
│   └── fact-check/
│       └── SKILL.md
│
├── shared/
│   └── CONTEXT.md
│
├── workflows/
│
├── runs/
│
└── handoffs/
```

Tous les dossiers non nécessaires peuvent rester vides ou ne pas être créés avant leur première utilisation.

## 8.2 `agent-lab.json`

Ce fichier contient uniquement les métadonnées nécessaires à Agent Lab.

Il MAY contenir :

- version du format ;
- identifiant du projet ;
- nom d’affichage ;
- positions des nœuds ;
- dimensions des nœuds ;
- liaisons ;
- groupes visuels ;
- mode UI ;
- panneau sélectionné ;
- préférences d’affichage.

Il MUST NOT contenir :

- prompts complets d’agents ;
- mémoire métier ;
- contenu de skills ;
- secrets ;
- clés API ;
- outputs principaux.

Exemple conceptuel :

```json
{
  "schemaVersion": 1,
  "project": {
    "id": "local-uuid",
    "name": "My Agent Project"
  },
  "graph": {
    "nodes": [
      {
        "id": "agent:researcher",
        "kind": "agent",
        "path": "agents/researcher",
        "position": { "x": 220, "y": 160 }
      }
    ],
    "edges": [
      {
        "id": "edge:researcher:analyst",
        "source": "agent:researcher",
        "target": "agent:analyst",
        "relation": "handoff",
        "label": "validated research"
      }
    ]
  }
}
```

## 8.3 Compatibilité

Si `agent-lab.json` manque :

- ne pas considérer le projet comme détruit ;
- reconstruire autant que possible l’arborescence à partir des fichiers ;
- proposer de recréer uniquement les métadonnées visuelles.

Les fichiers doivent rester utilisables sans Agent Lab.

---

# 9. Catalogue pédagogique des fichiers

Agent Lab doit avoir un **File Building Block Catalog**.

Chaque type affiche :

- nom ;
- catégorie ;
- description ;
- quand l’utiliser ;
- quand ne pas l’utiliser ;
- exemple ;
- statut de convention.

## 9.1 Badges de convention

Types de badges :

### Open convention
Format documenté en dehors d’Agent Lab.

Exemples :

- `AGENTS.md`
- `SKILL.md` dans une Agent Skill compatible.

### Agent Lab convention
Convention proposée pour apprendre ou structurer le projet.

Exemples :

- `AGENT.md`
- `SOUL.md`
- `MEMORY.md`
- `TOOLS.md`
- `STATUS.md`

### Runtime artifact
Fichier généré par une tâche ou un run.

Exemples :

- `task.md`
- handoff d’un run ;
- event log ;
- output.

### Custom
Fichier libre créé par l’utilisateur.

---

## 9.2 `AGENT.md`

### Rôle

Définit la responsabilité stable d’un agent.

### Sections suggérées

```markdown
# Agent

## Purpose

## Responsibilities

## Inputs

## Outputs

## Boundaries

## Delegation

## Completion criteria
```

### Recommandé quand

Presque toujours pour un agent créé dans Agent Lab.

### À éviter

Ne pas y mettre :

- la tâche du jour ;
- des logs ;
- un historique complet ;
- des secrets.

---

## 9.3 `SOUL.md`

### Rôle

Décrit des principes comportementaux durables :

- ton ;
- posture ;
- valeurs opérationnelles ;
- manière de communiquer ;
- degré de prudence ;
- comportement face à l’incertitude.

### À utiliser quand

La manière d’agir est réellement importante.

Exemples :

- assistant personnel ;
- tuteur ;
- agent conversationnel ;
- reviewer qui doit rester strict.

### À ne pas utiliser quand

Un worker purement fonctionnel peut accomplir sa tâche avec `AGENT.md`.

### Important

Agent Lab doit afficher clairement :

> `SOUL.md` est une convention de conception, pas un standard universel.

---

## 9.4 `TOOLS.md`

### Rôle

Documente les outils autorisés et leurs limites.

Sections possibles :

```markdown
# Tools

## Available tools

## Permission rules

## When to use

## Forbidden actions
```

Un futur moteur d’exécution pourra convertir cette définition en permissions réelles, mais en mode pédagogique le fichier reste explicatif.

---

## 9.5 `MEMORY.md`

### Rôle

Contient uniquement de la mémoire durable et curated.

Exemples :

- décision de projet stable ;
- préférence durable ;
- convention décidée ;
- information qui doit survivre à plusieurs runs.

### Ne doit pas contenir

- logs complets ;
- chain-of-thought ;
- toutes les conversations ;
- état temporaire ;
- données sensibles non nécessaires.

### Principe

> Si l’information ne doit probablement pas être utile dans un futur run, elle n’a probablement pas sa place dans `MEMORY.md`.

---

## 9.6 `STATUS.md`

### Rôle

Représente un état de travail lisible par un humain.

Sections :

```markdown
# Status

## Current objective

## Done

## In progress

## Blockers

## Next action
```

### Important

`STATUS.md` est pédagogique et pratique pour des agents persistants.

Dans un moteur de runs plus avancé, une grande partie de l’état temporaire SHOULD plutôt être rattachée au run.

---

## 9.7 `CONTEXT.md`

### Rôle

Regroupe un contexte utile à une partie du projet.

Peut exister :

- dans `shared/` ;
- dans un agent particulier ;
- dans un workflow.

Éviter de dupliquer les mêmes informations dans plusieurs fichiers.

---

## 9.8 `REVIEW.md`

Deux significations doivent être distinguées.

### Permanent rubric

Un `REVIEW.md` placé dans la configuration d’un reviewer peut définir ses critères permanents.

### Runtime review output

Une review produite pendant un run doit être enregistrée dans le run ou les artifacts, pas écraser la rubric permanente.

---

## 9.9 `AGENTS.md`

`AGENTS.md` doit être traité séparément d’un `AGENT.md`.

Il représente des **instructions de repository/projet destinées aux coding agents compatibles**, et non l’identité d’un agent individuel dans Agent Lab.

Agent Lab peut :

- expliquer le rôle du fichier ;
- permettre de l’éditer ;
- afficher sa portée ;
- montrer qu’un projet peut contenir plusieurs niveaux d’instructions.

---

## 9.10 `TASK.md`

Par défaut, ne pas stocker `TASK.md` dans la définition permanente d’un agent.

Préférer :

```text
runs/
└── run-0001/
    └── task.md
```

Enseigner :

```text
AGENT = ce qu’il est
TASK = ce qu’on lui demande maintenant
RUN = cette exécution précise
MEMORY = ce qui peut survivre à plusieurs runs
```

---

# 10. Skills

## 10.1 Définition

Une skill est une capacité procédurale réutilisable.

Exemple :

```text
skills/
└── fact-check/
    ├── SKILL.md
    ├── references/
    ├── scripts/
    └── assets/
```

Agent Lab doit prendre en charge au minimum les skills basées sur un `SKILL.md`.

## 10.2 Interface

Une skill doit être visuellement différente d’un agent.

Fiche :

- name ;
- description ;
- path ;
- files ;
- compatible agents ;
- usage explanation ;
- trust status.

## 10.3 Relation Agent ↔ Skill

Un agent peut utiliser plusieurs skills.

Une skill peut être partagée par plusieurs agents.

Cette relation n’est pas nécessairement une flèche de workflow.

Le graphe doit pouvoir afficher les skills en mode secondaire :

```text
Researcher
   ├─ fact-check
   └─ web-research
```

## 10.4 Import futur de skills

FUTURE :

- import depuis un dossier local ;
- import depuis une archive ;
- import depuis une URL explicitement fournie ;
- bibliothèque/catalogue.

Avant import :

- afficher les fichiers ;
- afficher les scripts ;
- afficher les permissions potentielles ;
- ne rien exécuter.

Un script contenu dans une skill ne doit jamais être exécuté automatiquement au simple import.

---

# 11. Tools

## 11.1 Tool ≠ Skill

L’interface doit enseigner :

```text
Tool
= capacité d’action

Skill
= procédure / savoir-faire réutilisable

Agent
= entité responsable d’une mission
```

Exemple :

```text
Web search = tool
Source validation = skill
Researcher = agent
```

## 11.2 Représentation

Les tools ne doivent pas être des gros nœuds de workflow par défaut.

Ils sont attachés à l’agent dans son inspector.

---

# 12. Catalogue des patterns de workflow

Agent Lab ne doit pas prétendre qu’il existe une liste exhaustive de workflows.

Il doit enseigner les **grandes familles réutilisables** et permettre ensuite de construire un graphe arbitraire.

Chaque pattern doit avoir :

- diagramme ;
- explication ;
- quand l’utiliser ;
- quand l’éviter ;
- exemple ;
- niveau de difficulté ;
- bouton `Use as template`.

---

## 12.1 Pattern A — Single Agent

```text
User
  │
  ▼
Agent
  │
  ▼
Result
```

### Usage

Tâche cohérente pouvant être accomplie par un seul agent.

### Enseignement

Toujours tester ce pattern avant de multiplier les agents.

### Warning

> « Multi-agent may be unnecessary. »

---

## 12.2 Pattern B — Sequential Pipeline

```text
Agent A
   │
   ▼
Agent B
   │
   ▼
Agent C
```

Exemple :

```text
Researcher → Analyst → Writer
```

### Usage

Chaque étape dépend du résultat précédent.

### Risque

Les erreurs peuvent se propager.

---

## 12.3 Pattern C — Router + Specialists

```text
           Router
         /   |   \
        ▼    ▼    ▼
      A      B     C
```

### Usage

Plusieurs catégories de requêtes nécessitent des spécialistes différents.

### Question pédagogique

> Est-ce que le router fait autre chose que choisir une destination ?

Si non, son rôle doit rester minimal.

---

## 12.4 Pattern D — Manager / Workers

```text
             Manager
           /    |    \
          ▼     ▼     ▼
       Worker Worker Worker
           \    |    /
            ▼   ▼   ▼
             Manager
```

### Usage

Un objectif doit être décomposé en sous-tâches.

### Enseignement

Différence entre :

- délégation ;
- exécution ;
- agrégation ;
- responsabilité finale.

---

## 12.5 Pattern E — Fan-out / Fan-in

```text
              Split
          /     |     \
         ▼      ▼      ▼
        A       B       C
         \      |      /
          ▼     ▼     ▼
              Merge
```

### Usage

Travaux indépendants pouvant être exécutés en parallèle.

Exemples :

- trois recherches ;
- trois analyses de sources ;
- plusieurs variantes.

### Risque

Coût/contextes multipliés inutilement.

---

## 12.6 Pattern F — Reviewer / Critic Loop

```text
Creator
   │
   ▼
Reviewer
   │
   ├── approved ─────► Done
   │
   └── changes needed
            │
            ▼
         Creator
```

### Usage

Qualité importante, critères explicites.

### Limite

Fixer un nombre maximal de boucles dans un vrai moteur d’exécution.

---

## 12.7 Pattern G — Planner / Executor

```text
Planner
   │ plan
   ▼
Executor
   │ result
   ▼
Verifier
```

### Usage

Mission complexe nécessitant un plan explicite avant action.

### Enseignement

Le plan n’est pas l’exécution.

---

## 12.8 Pattern H — Human Approval Gate

```text
Agent
  │
  ▼
Approval
  │
  ├── Reject → correction
  │
  └── Approve
        │
        ▼
      Action
```

### Usage

Action sensible :

- publication ;
- suppression ;
- dépense ;
- envoi ;
- modification externe importante.

### Représentation

L’humain est un nœud distinct `◇`.

---

## 12.9 Pattern I — Handoff Network

```text
Triage
  ├──► Billing
  ├──► Support
  └──► Technical
```

Un agent peut transférer la responsabilité à un spécialiste.

### Enseignement

Différence entre :

- « appeler un spécialiste comme tool »
- « transférer la responsabilité par handoff »

---

## 12.10 Pattern J — Hierarchical Multi-Agent

```text
                Orchestrator
                    │
            ┌───────┴───────┐
            ▼               ▼
         Manager A       Manager B
         /      \         /      \
        ▼        ▼       ▼        ▼
      W1        W2      W3        W4
```

### Usage

Très gros système avec sous-domaines clairement distincts.

### Warning pédagogique

Ce pattern est avancé.

Agent Lab doit afficher :

> « N’utilise pas une hiérarchie si un manager + quelques workers suffit. »

---

## 12.11 Pattern K — Shared Blackboard / Shared Context

```text
Agent A ─┐
Agent B ─┼──► Shared State
Agent C ─┘
```

### Usage

Plusieurs agents lisent/écrivent un état partagé.

### Risque

Conflits, contenu périmé, absence de propriété claire.

---

## 12.12 Pattern L — Event / Scheduled Workflow

FUTURE.

```text
Trigger
  │
  ▼
Agent
  │
  ▼
Condition
  │
  └── action
```

Exemples :

- chaque matin ;
- nouveau fichier ;
- nouvelle release ;
- seuil atteint.

Ce pattern ne doit pas obliger V0.1 à inclure un scheduler.

---

# 13. Sémantique du graphe

## 13.1 Un nœud doit avoir un type clair

Types initiaux :

- `agent`
- `human`
- `group`

Types secondaires :

- `skill`
- `shared-context`

Types futurs :

- `trigger`
- `condition`
- `external-system`

## 13.2 Types de relations

Relations initiales :

- `delegation`
- `handoff`
- `review`
- `approval`
- `route`
- `feedback`
- `data`

Chaque edge doit avoir :

- source ;
- target ;
- type ;
- label ;
- description ;
- payload attendu ;
- blocking ou non ;
- condition optionnelle.

## 13.3 Inspector d’une liaison

Quand on clique sur une flèche :

```text
Connection

Researcher → Analyst

Type
Handoff

Carries
Validated research report

Trigger
When research is complete

Blocking
Yes

Expected payload
Markdown research report
```

## 13.4 Lisibilité

Ne jamais afficher toutes les métadonnées directement sur le graphe.

Le graphe montre l’essentiel.

L’inspector montre les détails.

---

# 14. Création manuelle d’un agent

## 14.1 Interaction minimale

`+ Agent`

Formulaire :

```text
Name
[ Researcher ]

Purpose
[ Find and verify reliable information ]

Create
```

## 14.2 Après création

Afficher :

```text
Researcher created

Recommended
✓ AGENT.md
+ TOOLS.md
+ STATUS.md

Optional
+ MEMORY.md
+ SOUL.md
```

Chaque suggestion a un `Why?`.

## 14.3 Recommandation intelligente locale

Même sans IA, Agent Lab peut appliquer des heuristiques simples.

Exemples :

- agent de recherche → `TOOLS.md` recommandé ;
- worker ponctuel → pas de `MEMORY.md` ;
- reviewer → `REVIEW.md` recommandé ;
- assistant conversationnel → `SOUL.md` peut être pertinent.

Ces règles doivent rester explicables et modifiables.

---

# 15. Ghost Examples

## 15.1 Principe

Quand un fichier est vide, afficher un exemple visuel en gris/italique.

Ce contenu :

- n’est pas écrit sur disque ;
- disparaît dès que l’utilisateur saisit du contenu ;
- peut être accepté avec `Use example`.

## 15.2 Exemple `MEMORY.md`

```text
# Memory

Store only durable information that should remain useful across future runs.

Examples:
- stable project decisions
- durable preferences
- important conventions
```

## 15.3 Valeur pédagogique

L’utilisateur voit immédiatement la fonction d’un fichier sans devoir ouvrir une documentation séparée.

---

# 16. Création d’agent assistée par IA

## 16.1 Prompt

Barre basse :

`Describe the agent you want…`

Exemple :

> Je veux un agent qui cherche des informations techniques, croise les sources et transmet seulement les résultats fiables à un analyste.

## 16.2 L’IA ne modifie pas immédiatement

Elle doit produire un **Agent Proposal**.

Exemple :

```text
Proposed agent
Researcher

Purpose
Find and validate technical information.

Recommended files
AGENT.md
TOOLS.md
STATUS.md

Not recommended
MEMORY.md — current role is stateless
SOUL.md — behavior does not require a distinct persona

Suggested relation
Researcher → Analyst
Type: handoff
```

## 16.3 Actions

- `Create`
- `Edit proposal`
- `Simplify`
- `Explain`
- `Cancel`

## 16.4 Génération structurée

Le modèle IA SHOULD retourner une structure validable avant transformation en fichiers.

Conceptuellement :

```json
{
  "agent": {
    "name": "Researcher",
    "slug": "researcher",
    "purpose": "..."
  },
  "files": [
    {
      "type": "AGENT.md",
      "recommended": true,
      "reason": "...",
      "content": "..."
    }
  ],
  "skills": [],
  "suggestedEdges": [],
  "warnings": []
}
```

Le frontend ne doit pas appliquer directement du texte libre à des chemins filesystem.

---

# 17. Création d’un projet/workflow assistée par IA

## 17.1 Usage

L’utilisateur écrit :

> Je veux un système qui surveille les nouvelles sorties de modèles locaux, compare leur intérêt sur Apple Silicon et me produit un rapport.

## 17.2 Réponse attendue

L’IA doit commencer par proposer **l’architecture la plus simple raisonnable**.

Exemple :

```text
Suggested architecture

Release Researcher ─┐
                    ├──► Analyst ───► Reviewer
Docs Researcher ────┘
```

Si un orchestrateur n’est pas nécessaire, ne pas en créer artificiellement.

## 17.3 Proposal détaillée

Afficher :

- objectif ;
- hypothèses ;
- agents ;
- rôle de chaque agent ;
- fichiers proposés ;
- skills proposées ;
- tools nécessaires ;
- relations ;
- points d’approbation ;
- mémoire nécessaire ou non ;
- niveau de complexité ;
- principaux risques ;
- variante plus simple ;
- variante plus avancée.

## 17.4 Bouton `Simplify`

Le bouton doit rechercher :

- agents redondants ;
- fichiers inutiles ;
- reviewer sans raison ;
- orchestrateur inutile ;
- memory inutile ;
- pipeline pouvant devenir single-agent ;
- multiples agents partageant exactement la même responsabilité.

Sortie :

```text
Possible simplification

Merge Writer into Analyst.

Reason:
Writer only reformats Analyst output and has no independent responsibility.

Agents: 5 → 4
Edges: 6 → 4
```

## 17.5 Bouton `Why this architecture?`

Générer une explication étape par étape du flux d’information sans exposer de chain-of-thought privée.

Montrer :

- entrées ;
- décisions visibles ;
- transferts ;
- outputs ;
- critères.

---

# 18. Mode Learn / Build / Run

Le produit évolue autour de trois modes.

## 18.1 Learn

Objectif : comprendre.

Afficher davantage :

- définitions ;
- exemples ;
- badges ;
- `Why?` ;
- `When not to use`;
- warning d’over-engineering ;
- contexte visualisé ;
- tutoriels guidés.

## 18.2 Build

Objectif : construire efficacement.

Masquer une partie des explications.

Conserver :

- inspector ;
- editor ;
- graph ;
- suggestions à la demande.

## 18.3 Run

FUTURE.

Objectif : exécuter ou simuler le workflow.

Doit rester séparé du mode de conception.

---

# 19. Curriculum intégré

Agent Lab doit pouvoir proposer un parcours progressif.

## Lesson 1 — Single agent

Créer un agent manuellement.

Comprendre `AGENT.md`.

## Lesson 2 — Tools

Ajouter une capacité.

Comprendre `TOOLS.md`.

## Lesson 3 — Task

Créer une tâche séparée de la définition de l’agent.

## Lesson 4 — Second agent

Créer deux responsabilités différentes.

## Lesson 5 — Handoff

Relier deux agents et définir le payload.

## Lesson 6 — Review

Ajouter un reviewer et comprendre son intérêt.

## Lesson 7 — Memory

Ajouter une information durable puis expliquer pourquoi elle doit survivre.

## Lesson 8 — Reset context

Simuler la perte du contexte de travail.

Montrer comment les fichiers persistants permettent de reprendre.

## Lesson 9 — Parallel work

Créer un fan-out/fan-in.

## Lesson 10 — Manager / Workers

Décomposer un objectif.

## Lesson 11 — Human approval

Bloquer une action jusqu’à validation.

## Lesson 12 — Simplification

Transformer une architecture surdimensionnée en architecture plus simple.

---

# 20. Context Inspector

Fonction pédagogique importante.

Pour un agent sélectionné, permettre un futur onglet :

`Context`

Afficher conceptuellement :

```text
Context for Researcher

Permanent
✓ AGENT.md
✓ TOOLS.md

Project
✓ shared/CONTEXT.md

Run
✓ runs/run-0007/task.md

Incoming
✓ handoff from Orchestrator

Memory
○ none
```

Chaque élément affiche :

- source ;
- raison du chargement ;
- portée ;
- taille approximative ;
- permanent/temporaire.

## 20.1 Token awareness

FUTURE :

Afficher une estimation de contexte/tokens.

But pédagogique :

- montrer que chaque fichier ajouté a un coût ;
- éviter le réflexe « injecter tout partout ».

Ne jamais présenter l’estimation comme une mesure parfaitement exacte sans provider précis.

---

# 21. Mode Simulation

Cette fonction est fondamentale pour apprendre les workflows sans payer d’API.

## 21.1 Simulation déterministe

L’utilisateur peut lancer :

- `Play`
- `Step`
- `Pause`
- `Reset`

La simulation ne nécessite pas de LLM.

Elle utilise des payloads fictifs/exemples.

## 21.2 Visualisation

Exemple :

```text
Orchestrator
     │
     ● task
     ▼
Researcher
     │
     ● research report
     ▼
Analyst
```

Le point ou petit paquet animé représente une information.

## 21.3 Trace

Un panneau compact `Trace` peut être ouvert :

```text
00:00 Task created
00:01 Delegated to Researcher
00:02 Researcher received task
00:03 Handoff created
00:04 Analyst received research report
```

## 21.4 Inspection d’un événement

Cliquer sur un événement montre :

- sender ;
- receiver ;
- relation ;
- payload ;
- fichiers lus ;
- fichiers écrits ;
- état avant/après.

## 21.5 Pas de faux raisonnement interne

La simulation ne doit jamais prétendre afficher la chain-of-thought interne d’un modèle.

Elle affiche uniquement :

- instructions ;
- entrées ;
- événements ;
- tool calls ;
- handoffs ;
- outputs ;
- décisions explicitement matérialisées.

---

# 22. Runs réels — architecture future

Ne pas implémenter avant que Learn/Build/Simulation soient stables.

## 22.1 Structure

```text
runs/
└── run-0007/
    ├── task.md
    ├── run.json
    ├── events.jsonl
    ├── approvals/
    ├── handoffs/
    └── outputs/
```

## 22.2 `run.json`

Peut contenir :

- run id ;
- workflow id ;
- start/end ;
- status ;
- provider ;
- agents impliqués ;
- erreurs ;
- coût si disponible ;
- token usage si disponible.

## 22.3 `events.jsonl`

Événements append-only.

Exemples :

- task_created ;
- agent_started ;
- tool_called ;
- tool_completed ;
- handoff_created ;
- approval_requested ;
- approval_resolved ;
- output_created ;
- error ;
- run_completed.

---

# 23. Handoffs

## 23.1 Ne pas utiliser un unique `HANDOFF.md` écrasé

Préférer un historique.

Exemple :

```text
runs/run-0007/handoffs/
├── 0001-orchestrator-to-researcher.md
├── 0002-researcher-to-analyst.md
└── 0003-analyst-to-reviewer.md
```

## 23.2 Contrat de handoff

Un handoff peut contenir :

```markdown
# Handoff

From: Researcher
To: Analyst
Run: run-0007

## Objective

## Summary

## Deliverables

## Open questions

## Files

## Constraints
```

---

# 24. Approvals

## 24.1 Concept

Une approval gate bloque une étape.

États :

- pending ;
- approved ;
- rejected ;
- edited-and-approved ;
- cancelled.

## 24.2 UX

Nœud humain sobre :

`◇ You`

Quand pending :

```text
Approval required

Action:
Publish report

Requested by:
Writer

Review:
[open artifact]

Reject   Edit   Approve
```

## 24.3 Règle future

Les tools sensibles SHOULD pouvoir déclarer une politique d’approbation.

---

# 25. AI Provider abstraction

## 25.1 L’app ne dépend pas d’un seul provider

Interface interne conceptuelle :

```ts
interface AIProvider {
  id: string
  name: string
  generateStructured(request: StructuredGenerationRequest): Promise<StructuredGenerationResult>
}
```

Providers possibles dans le futur :

- OpenAI API ;
- autre API ;
- endpoint local compatible ;
- modèle local.

## 25.2 Secrets

Ne jamais enregistrer les clés API dans :

- `PROJECT.md` ;
- `AGENTS.md` ;
- `agent-lab.json` ;
- agent files.

Utiliser le stockage sécurisé du système quand une intégration réelle est ajoutée.

## 25.3 Sans provider

Toutes les fonctions manuelles et pédagogiques restent utilisables.

---

# 26. AI Safety / mutation policy

## 26.1 Preview obligatoire

Avant qu’une génération IA :

- crée un agent ;
- crée plusieurs fichiers ;
- supprime ;
- renomme ;
- remplace ;
- réorganise ;

afficher un plan/diff.

## 26.2 Aucun chemin arbitraire

Les paths générés par IA doivent être :

- normalisés ;
- validés ;
- confinés dans le project root ;
- convertis depuis des IDs/slugs contrôlés.

## 26.3 Import de contenu non fiable

Une skill ou un fichier importé peut contenir des instructions malveillantes.

Agent Lab doit traiter le contenu importé comme **data** jusqu’à ce que l’utilisateur l’inspecte.

Ne pas exécuter automatiquement :

- shell scripts ;
- binaries ;
- JavaScript ;
- Python ;
- commands.

---

# 27. Création et édition de fichiers

## 27.1 Menu `Add file`

Afficher en premier les types pertinents.

Exemple pour un Researcher :

```text
Recommended
AGENT.md
TOOLS.md
STATUS.md

Optional
MEMORY.md
SOUL.md
CONTEXT.md

Custom
New Markdown file…
```

## 27.2 Descriptions courtes

Chaque item a une phrase.

Exemple :

`MEMORY.md — information that should survive future runs.`

## 27.3 Custom files

L’utilisateur peut créer :

- `.md`
- `.json`
- `.yaml`
- `.txt`

V0.1 peut limiter l’éditeur pédagogique aux `.md` tout en laissant voir les autres fichiers.

---

# 28. Éditeur Markdown

## 28.1 Objectif

Éditeur très simple, pas IDE complet.

Fonctions initiales :

- syntax highlighting ;
- undo/redo ;
- search ;
- autosave prudent ;
- indicateur saved/unsaved ;
- raccourcis macOS ;
- line numbers optionnelles ;
- drag-free interface.

## 28.2 Autosave

Éviter d’écrire à chaque frappe si cela provoque du bruit filesystem.

Utiliser un debounce court et fiable.

Toujours garantir qu’un `⌘S` explicite fonctionne.

## 28.3 Conflits externes

Si un fichier a changé sur disque depuis son ouverture :

- ne pas écraser silencieusement ;
- montrer `File changed externally`;
- proposer :
  - Reload
  - Compare
  - Keep mine

---

# 29. File watcher

Agent Lab doit détecter les changements externes importants :

- nouveau fichier ;
- fichier supprimé ;
- renommage ;
- contenu modifié.

Le watcher ne doit pas :

- créer une boucle avec les propres writes de l’application ;
- spammer l’UI ;
- reconstruire le projet à chaque frappe.

---

# 30. Sécurité filesystem

## 30.1 Project root

Toutes les opérations normales sont confinées à un project root choisi explicitement.

## 30.2 Path traversal

Bloquer :

- `../`
- chemins résolus hors root ;
- symlinks dangereux si l’opération destructive peut sortir du root.

## 30.3 Suppression

Ne jamais supprimer silencieusement un fichier user-authored.

Pour supprimer un agent :

1. lister les fichiers concernés ;
2. afficher les edges concernés ;
3. demander confirmation ;
4. utiliser un comportement récupérable si possible.

## 30.4 Rename

Renommer un agent doit mettre à jour de manière transactionnelle :

- dossier ;
- graph node ;
- edges ;
- métadonnées Agent Lab.

Ne pas réécrire automatiquement le texte libre de tous les fichiers sauf si l’utilisateur l’accepte.

---

# 31. Undo / Recovery

Pour les actions structurelles :

- création ;
- suppression ;
- rename ;
- edge delete ;
- bulk AI generation ;

prévoir un historique minimal d’actions ou un mécanisme de recovery.

Avant opérations bulk IA, générer un snapshot de métadonnées et/ou utiliser Git si le projet est versionné, sans imposer Git.

---

# 32. Finder et transparence

## 32.1 Reveal in Finder

Disponible sur :

- projet ;
- agent ;
- skill ;
- fichier ;
- run.

## 32.2 Filesystem view

Vue secondaire :

```text
my-project/
├── AGENTS.md
├── PROJECT.md
├── agents/
│   └── researcher/
│       ├── AGENT.md
│       └── TOOLS.md
└── skills/
```

Cette vue doit refléter le disque réel, pas une reconstruction fictive.

---

# 33. Workflow Templates

Templates initiaux :

1. Blank
2. Single Agent
3. Research → Analyze → Review
4. Router → Specialists
5. Manager → Workers
6. Parallel Research
7. Planner → Executor → Verifier
8. Human Approval
9. Handoff Support Team
10. Hierarchical — Advanced

Chaque template affiche :

- niveau ;
- nombre d’agents ;
- diagramme miniature ;
- ce qu’il enseigne ;
- quand l’utiliser ;
- warning éventuel.

---

# 34. Project Creation

## 34.1 New Project

Écran très simple :

```text
New Agent Lab Project

Name
[                        ]

Location
[ Choose folder…         ]

Start with
○ Blank
○ Learning project
○ Template

Create
```

## 34.2 Fichiers initiaux

Projet blank minimal :

```text
PROJECT.md
AGENTS.md
agent-lab.json
agents/
skills/
shared/
```

Ne pas générer dix fichiers inutiles.

---

# 35. Import / Open Existing Project

Agent Lab doit pouvoir ouvrir un dossier qui n’a pas été créé par Agent Lab.

## 35.1 Détection

Chercher :

- `AGENTS.md`
- `PROJECT.md`
- `agents/`
- `skills/`
- `SKILL.md`
- conventions reconnues.

## 35.2 Import non destructif

Proposer :

> « J’ai détecté 3 dossiers qui ressemblent à des agents. Les importer dans le graphe ? »

Ne jamais déplacer les fichiers automatiquement lors d’un simple open.

---

# 36. Explication d’architecture

Action :

`Explain architecture`

Sortie structurée :

```text
1. The user gives the objective to Orchestrator.
2. Orchestrator delegates research to Researcher.
3. Researcher produces a validated research report.
4. Analyst receives only the research output.
5. Reviewer checks the final artifact.
6. Human approval is required before publication.
```

L’explication doit parler de flux visibles, pas de raisonnement privé.

---

# 37. `What if I remove this?`

Sur agent, skill, edge ou fichier.

Exemple sur Reviewer :

```text
If you remove Reviewer:

The workflow can still complete.

You lose:
- independent verification
- explicit quality gate

Possible simpler alternative:
move the review checklist into Analyst.

Recommendation:
keep Reviewer for learning;
merge for low-risk production tasks.
```

Cette fonction doit être disponible manuellement et pourra être enrichie par IA.

---

# 38. Architecture Quality Checks

Agent Lab doit pouvoir détecter des smells simples.

## 38.1 Agent sans responsabilité

Un agent n’a pas de purpose clair.

## 38.2 Duplicate agents

Deux agents ont presque le même rôle.

## 38.3 Dead node

Agent sans connexion dans un workflow.

## 38.4 Circular workflow

Boucle sans condition de sortie.

## 38.5 Reviewer loop without limit

Boucle creator/reviewer potentiellement infinie.

## 38.6 Memory everywhere

Trop de mémoire persistante sans justification.

## 38.7 God orchestrator

Orchestrateur qui réalise lui-même toutes les tâches.

## 38.8 Context overload

Trop de fichiers chargés dans chaque agent.

## 38.9 Unnecessary hierarchy

Plusieurs niveaux de management pour peu de workers.

## 38.10 Unclear handoff

Edge sans payload ni condition claire.

---

# 39. Search et Command Palette

Raccourci cible :

`⌘K`

Actions :

- New Agent
- New Skill
- Add File
- Open File
- Search Project
- Explain Selection
- Simplify Workflow
- Reveal in Finder
- Auto-layout
- Switch Learn/Build
- Run Simulation

Éviter d’ajouter des boutons permanents pour tout.

---

# 40. Raccourcis proposés

- `⌘K` command palette
- `⌘S` save
- `⌘P` quick open
- `⌘N` new contextual item
- `⌘F` search current editor
- `⌘⇧F` project search / filesystem
- `⌘0` focus graph
- `⌘1` focus navigator
- `⌘2` focus editor

Les raccourcis doivent suivre les conventions macOS quand possible.

---

# 41. States visuels

## Agent states futurs

- idle
- ready
- running
- waiting
- blocked
- approval
- failed
- complete

Ne pas dépendre uniquement de la couleur.

Utiliser :

- icône ;
- label ;
- animation légère.

---

# 42. Design du graphe

## 42.1 Agent node

Petit nœud compact :

```text
◉ Researcher
  research
```

## 42.2 Human node

```text
◇ You
```

## 42.3 Skill

Petite puce ou satellite :

```text
[ fact-check ]
```

## 42.4 Edge

Ligne fine.

Label affiché seulement si utile.

Type visible au hover/selection.

## 42.5 Auto-layout

Préférer :

- top → bottom ;
- left → right optionnel.

Le layout doit rester stable après reload.

---

# 43. AI Architecture Generator — règles de qualité

Quand l’IA génère un workflow, elle doit suivre cette séquence :

1. Résumer l’objectif.
2. Identifier les grandes responsabilités.
3. Tester mentalement si un seul agent suffit.
4. Séparer uniquement les responsabilités ayant une vraie raison d’être indépendantes.
5. Définir chaque agent.
6. Définir les entrées/sorties.
7. Définir les edges.
8. Identifier les outils.
9. Identifier les skills.
10. Déterminer si une mémoire est nécessaire.
11. Déterminer si une approbation humaine est nécessaire.
12. Rechercher les redondances.
13. Proposer une version simple.
14. Proposer éventuellement une version avancée.
15. Ne rien créer avant validation utilisateur.

---

# 44. AI File Generator

Pour un fichier sélectionné, action :

`Generate draft`

Exemple pour `AGENT.md`.

L’IA produit un draft avec :

- sections ;
- texte ;
- explication.

Afficher un diff :

```text
Current
...

Proposed
...
```

Actions :

- Apply
- Apply section
- Copy
- Cancel

Ne pas remplacer silencieusement le contenu existant.

---

# 45. Projet pédagogique par défaut

Agent Lab peut proposer un projet tutorial :

```text
You
 │
 ▼
Orchestrator
 ├─────────────┐
 ▼             ▼
Docs Research  Web Research
 └──────┬──────┘
        ▼
      Analyst
        │
        ▼
     Reviewer
        │
        ▼
       You
```

Ce projet permet d’enseigner :

- orchestration ;
- parallelism ;
- handoff ;
- merge ;
- review ;
- human approval.

---

# 46. Mémoire — progression pédagogique

Agent Lab doit enseigner au moins quatre niveaux.

## Niveau 0 — No memory

Agent stateless.

## Niveau 1 — Curated memory

`MEMORY.md`.

## Niveau 2 — Run history

Outputs/runs accessibles mais non injectés automatiquement.

## Niveau 3 — Retrieval memory

FUTURE : recherche dans une mémoire plus large.

Ne pas commencer par une vector database.

---

# 47. Context Reset Exercise

Exercice intégré :

1. agent reçoit une tâche ;
2. il écrit son état ;
3. l’utilisateur déclenche `Reset temporary context`;
4. Agent Lab montre ce qui disparaît ;
5. Agent Lab montre ce qui reste sur disque ;
6. l’utilisateur comprend comment reprendre.

But :

comprendre la différence entre :

- contexte temporaire ;
- état persistant ;
- mémoire ;
- files.

---

# 48. Coût et scaling

FUTURE en mode réel.

Pour chaque run :

- calls ;
- input tokens ;
- output tokens ;
- durée ;
- coût estimé si le provider le fournit ;
- nombre d’agents actifs.

Vue pédagogique :

```text
Single Agent
12k tokens

3-Agent Pipeline
28k tokens
```

L’application doit aider à comprendre que scaler le nombre d’agents peut scaler :

- qualité ;
- spécialisation ;
- mais aussi coût ;
- latence ;
- complexité ;
- risque d’erreur de handoff.

---

# 49. Performance

V0.x cible :

- projets de quelques dizaines d’agents ;
- centaines de petits fichiers ;
- graph fluide ;
- ouverture rapide.

Ne pas optimiser prématurément pour 10 000 agents.

Le file watcher et l’éditeur ne doivent pas relire tout le projet à chaque frappe.

---

# 50. Accessibilité

MUST :

- navigation clavier de base ;
- focus visible ;
- labels accessibles ;
- ne pas utiliser uniquement la couleur ;
- contraste suffisant ;
- respect du reduced motion si disponible.

---

# 51. Privacy

Par défaut :

- aucun analytics nécessaire ;
- aucune synchronisation ;
- aucun upload ;
- aucun contenu envoyé à une IA tant que l’utilisateur n’a pas déclenché une action IA.

Lors d’une action IA :

- indiquer quelles informations vont être envoyées ;
- limiter le contexte au nécessaire.

---

# 52. Erreurs

Les erreurs doivent être concrètes.

Mauvais :

> Something went wrong.

Bon :

> Could not rename `agents/researcher` because a folder named `research` already exists.

Toujours proposer l’action corrective quand possible.

---

# 53. Git

Git est utile mais non obligatoire.

Agent Lab MAY détecter si le projet est un repo Git.

FUTURE :

- status léger ;
- checkpoint avant bulk AI edit ;
- diff.

Ne pas construire un Git client complet.

---

# 54. Architecture technique recommandée

## 54.1 Frontend

- React
- TypeScript
- `@xyflow/react`
- CodeMirror 6
- state management minimal ; Context ou Zustand si réellement utile
- CSS sobre ; éviter un gros design system au départ

## 54.2 Backend

Tauri 2 / Rust pour :

- sélection de dossier ;
- path validation ;
- filesystem ;
- reveal in Finder ;
- file watching ;
- opérations atomiques sensibles ;
- future secure storage.

## 54.3 Séparation

```text
UI
│
├── domain
│   ├── Agent
│   ├── Skill
│   ├── Workflow
│   ├── Edge
│   └── Run
│
├── services
│   ├── project
│   ├── filesystem
│   ├── graph
│   └── ai
│
└── Tauri commands
```

Éviter que les composants React appellent partout le filesystem directement.

---

# 55. Modèles TypeScript conceptuels

```ts
type AgentId = string
type SkillId = string
type WorkflowId = string

interface Agent {
  id: AgentId
  name: string
  slug: string
  purpose: string
  path: string
  files: AgentFile[]
  skillIds: SkillId[]
}

interface AgentFile {
  path: string
  kind: AgentFileKind | "custom"
  convention: "open" | "agent-lab" | "runtime" | "custom"
}

interface Skill {
  id: SkillId
  name: string
  path: string
  description?: string
}

type EdgeRelation =
  | "delegation"
  | "handoff"
  | "review"
  | "approval"
  | "route"
  | "feedback"
  | "data"

interface WorkflowEdge {
  id: string
  source: string
  target: string
  relation: EdgeRelation
  label?: string
  description?: string
  payload?: string
  blocking?: boolean
  condition?: string
}
```

Ces interfaces sont indicatives.

Adapter si une représentation plus simple est suffisante.

---

# 56. Versioning du format projet

`agent-lab.json` MUST inclure `schemaVersion`.

Lors d’un changement incompatible :

- migrer explicitement ;
- sauvegarder avant migration ;
- ne jamais silently corrupt un ancien projet.

---

# 57. Packaging macOS

Objectif :

```text
source
  │
  ▼
tauri build
  │
  ├── Agent Lab.app
  └── Agent Lab.dmg
```

Pour utilisation personnelle, un build local suffit.

Pour distribution publique FUTURE :

- signing ;
- notarization ;
- DMG propre ;
- updater seulement si besoin.

Ne pas laisser la distribution bloquer le MVP.

---

# 58. Roadmap

## V0.1 — Foundation / Manual Lab

Objectif : comprendre et construire manuellement.

MUST :

1. Create project.
2. Open project.
3. Three-panel UI.
4. Real filesystem.
5. Create agent.
6. Rename agent.
7. Delete safely.
8. Create Markdown file.
9. Edit/save Markdown.
10. File building block catalog.
11. Ghost examples.
12. Graph.
13. Connect agents.
14. Edge inspector.
15. Persist layout.
16. Reveal in Finder.
17. File watcher minimal.
18. Learn/Build toggle.
19. Workflow template gallery statique.
20. No AI required.

## V0.2 — AI Design Assistant

Objectif : laisser l’IA aider sans rendre l’application opaque.

Ajouter :

1. provider abstraction ;
2. AI agent proposal ;
3. AI file generation ;
4. AI workflow proposal ;
5. preview/diff ;
6. `Why?` ;
7. `Simplify` ;
8. `What if I remove this?` ;
9. architecture quality checks enrichis ;
10. Context Inspector initial.

## V0.3 — Simulation

Objectif : voir circuler l’information.

Ajouter :

1. simulation step-by-step ;
2. animated task/payload ;
3. trace ;
4. synthetic handoffs ;
5. approval simulation ;
6. context reset exercise ;
7. tutorial lessons.

## V0.4 — Skills / Import

Ajouter :

1. création de skill ;
2. validation `SKILL.md` ;
3. assignation Agent ↔ Skill ;
4. import local ;
5. preview sécurisée ;
6. bibliothèque locale.

## V0.5 — Real Runs

Ajouter prudemment :

1. real provider calls ;
2. tasks ;
3. run folders ;
4. events ;
5. handoffs ;
6. approvals ;
7. usage metrics ;
8. resume ;
9. tool permission model.

## V1.0 — Stable Educational Agent Workbench

Objectif :

- Learn ;
- Build ;
- Simulate ;
- Run ;
- local-first ;
- AI-assisted ;
- explainable ;
- robust recovery ;
- exportable project format.

---

# 59. Hors scope initial

Ne pas ajouter en V0.x initial sans demande explicite :

- Kubernetes ;
- multi-machine scheduling ;
- Docker orchestration ;
- distributed queues ;
- enterprise auth ;
- team collaboration ;
- vector database obligatoire ;
- cloud sync ;
- Discord ;
- Telegram ;
- WhatsApp ;
- MCP marketplace ;
- autonomous shell execution ;
- remote browser farms ;
- billing ;
- public account system.

Ces fonctions peuvent être étudiées plus tard mais ne doivent pas contaminer le noyau pédagogique.

---

# 60. Tests minimaux

## 60.1 Project persistence

Test :

1. créer projet ;
2. créer 3 agents ;
3. les positionner ;
4. créer 2 edges ;
5. fermer ;
6. rouvrir ;
7. comparer état.

Attendu : identique.

## 60.2 Filesystem truth

Créer `AGENT.md` via l’app.

Vérifier qu’il existe réellement dans Finder.

Modifier depuis un autre éditeur.

Vérifier qu’Agent Lab détecte le changement.

## 60.3 Rename

Renommer agent.

Vérifier :

- dossier ;
- node ;
- edges ;
- metadata.

## 60.4 Delete safety

Agent avec fichiers et edges.

Delete doit montrer ce qui sera affecté.

## 60.5 AI preview future

Une proposition IA ne doit écrire aucun fichier tant que `Apply/Create` n’a pas été validé.

## 60.6 Path safety

Tester tentatives de sortie du root.

---

# 61. Critères d’acceptation V0.1

V0.1 réussit si un nouvel utilisateur peut, sans documentation externe :

1. créer un projet ;
2. comprendre ce qu’est un agent ;
3. créer `Researcher` ;
4. comprendre pourquoi `AGENT.md` existe ;
5. voir un ghost example ;
6. écrire sa propre définition ;
7. ajouter `Analyst` ;
8. créer `Researcher → Analyst` ;
9. choisir `handoff` ;
10. comprendre ce qui circule ;
11. ouvrir Finder ;
12. reconnaître exactement les dossiers et fichiers créés ;
13. fermer l’app ;
14. rouvrir ;
15. retrouver exactement son architecture.

---

# 62. Critères d’acceptation pédagogiques

Agent Lab est pédagogiquement réussi si l’utilisateur peut expliquer :

```text
Why this agent?
Why this file?
Why this edge?
Why this skill?
Why this memory?
Why this approval?
```

et aussi :

```text
What happens if I remove it?
```

---

# 63. Règle de complexité

Avant d’ajouter n’importe quel concept, appliquer :

```text
Does this teach or enable something concrete?
        │
   ┌────┴────┐
   │         │
  Yes        No
   │         │
   ▼         ▼
 Add       Don't add
```

---

# 64. Règle pour Codex pendant l’implémentation

Codex doit toujours privilégier :

- un vertical slice fonctionnel ;
- testé ;
- ouvrable ;
- persistant ;
- compréhensible.

Plutôt qu’un grand nombre de composants incomplets.

Ordre recommandé :

1. bootstrap Tauri ;
2. project open/create ;
3. filesystem model ;
4. three-panel shell ;
5. create agent ;
6. file editor ;
7. graph ;
8. persistence ;
9. file watcher ;
10. educational catalog ;
11. polish ;
12. puis seulement AI.

---

# 65. Définition d’un vertical slice initial

Le premier vertical slice idéal :

```text
Launch app
  ↓
Create project
  ↓
+ Agent
  ↓
Researcher created on disk
  ↓
Open AGENT.md
  ↓
Edit + save
  ↓
See Researcher node
  ↓
Close app
  ↓
Reopen project
  ↓
Everything is still there
```

Ne pas travailler sur l’IA avant que cette boucle fonctionne parfaitement.

---

# 66. Décisions verrouillées

Ces décisions ne doivent pas être changées sans raison explicite :

- desktop macOS ;
- Tauri 2 ;
- React + TypeScript ;
- real local files ;
- no opaque DB for agent content ;
- three-panel UI ;
- graph architectural, not n8n-like ;
- manual mode works offline ;
- AI always preview-first ;
- Agent ≠ Task ;
- Skill ≠ Tool ;
- run history separated from permanent agent identity ;
- project metadata separated from agent content ;
- learn before execute.

---

# 67. Décisions laissées ouvertes

Codex peut proposer une solution si elle respecte la vision :

- exact CSS approach ;
- exact state management library ;
- exact auto-layout algorithm ;
- exact file watcher implementation ;
- exact icon library ;
- exact modal/popover primitives ;
- CodeMirror wrapper ou intégration directe ;
- structure interne des React components.

Toute dépendance supplémentaire doit résoudre un besoin concret.

---

# 68. Futurs axes d’exploration

Après une V1 stable, Agent Lab peut évoluer vers :

- provider adapters multiples ;
- local model support ;
- tool registry ;
- MCP connections ;
- scheduled workflows ;
- remote workers ;
- multi-machine execution ;
- resource-aware scheduling ;
- resumable durable runs ;
- skill catalog ;
- versioned workflow templates ;
- metrics ;
- cost simulation ;
- comparison of architectures ;
- export toward other agent frameworks.

Mais le produit doit continuer à rendre les mécanismes visibles.

---

# 69. Résumé produit en une phrase

> **Agent Lab est une application Mac locale, minimaliste et pédagogique qui transforme les fichiers, agents, skills, tâches, handoffs et workflows IA en objets visibles et manipulables, tout en permettant à l’utilisateur de les créer lui-même ou de demander à une IA de les proposer sans jamais masquer ce qui est réellement créé sur son disque.**

---

# 70. Final product test

Avant de considérer Agent Lab comme réussi, effectuer ce scénario :

1. Créer un projet vierge.
2. Créer manuellement un Researcher.
3. Ajouter `AGENT.md`.
4. Comprendre son rôle grâce au placeholder.
5. Créer un Analyst.
6. Relier Researcher → Analyst.
7. Définir le lien comme `handoff`.
8. Ajouter une skill `fact-check`.
9. L’associer au Researcher.
10. Ouvrir Finder et voir tous les fichiers.
11. Demander à l’IA :  
   « Je veux maintenant ajouter un contrôle qualité avant le résultat final. »
12. L’IA propose Reviewer + justification.
13. L’utilisateur modifie la proposition.
14. L’utilisateur clique `Create`.
15. Les vrais fichiers apparaissent.
16. Le graphe se met à jour.
17. `Explain architecture` décrit le flux.
18. `Simplify` vérifie si le système est surdimensionné.
19. Lancer une simulation.
20. Voir la tâche passer d’un agent à l’autre.
21. Cliquer un handoff.
22. Comprendre exactement ce qui a été transmis.
23. Fermer l’application.
24. Rouvrir le projet.
25. Retrouver intégralement le projet et son layout.

Si ce scénario est fluide, compréhensible, sûr et visuellement calme, Agent Lab remplit sa mission.
