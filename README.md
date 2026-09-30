# Jev Hémicycle

**Suit les documents parlementaires qui affectent matériellement un sujet déclaré.**

[![Tests](https://github.com/gbesse/jev-hemicycle/actions/workflows/test.yml/badge.svg)](https://github.com/gbesse/jev-hemicycle/actions/workflows/test.yml) [MIT](LICENSE) · Node.js 22+ · v0.2.3 · Documentation française

Jev Hémicycle récupère et normalise le flux officiel des publications parlementaires de l’Assemblée nationale. Il évalue amendements, débats et votes par rapport à un sujet précis et n’émet une transition qu’au franchissement des seuils configurés.

## Démarrage rapide

```sh
git clone https://github.com/gbesse/jev-hemicycle.git
cd jev-hemicycle
npm install
npm run demo
```

La démonstration utilise uniquement des données et probabilités synthétiques. Elle n’effectue aucun appel réseau et ne constitue pas une mesure de qualité de Jev.

## Exemple exécutable

Cet exemple évalue un amendement synthétique sur la réparabilité. Il utilise un fournisseur Jev simulé : aucune clé API ni connexion réseau n’est nécessaire. L’assertion intégrée fait échouer la commande si le comportement attendu change.

Le code complet de [`examples/demo.mjs`](examples/demo.mjs) est directement copiable :

```js
// Objectif : démontrer la frontière de décision sans appel réseau.
import assert from "node:assert/strict";
import { evaluateDocument } from "../src/index.mjs";
import { createFakeProvider } from "../src/jev.mjs";
const p = createFakeProvider(() => ({
  model: "jev-1.13.0",
  answers: { relevant: { type: "noul", noul: 0.91 } },
  usage: { input_tokens: 80, output_tokens: 0 },
}));
const resultat = await evaluateDocument(
  {
    id: "amdt-42",
    kind: "amendment",
    title: "Réparabilité",
    text: "Crée une obligation de réparabilité pour les appareils ménagers.",
    sourceUrl: "https://example.test/amdt-42",
  },
  {
    id: "repair",
    description: "Droit à la réparation des appareils électroniques",
  },
  p,
);
assert.equal(resultat.state, "relevant");
console.log(JSON.stringify(resultat, null, 2));
```

Lancez-le avec :

```sh
npm run demo:principal
```

Résultat à repérer : `state: relevant`.

### Cas limite à tester

La bande d’hystérésis conserve l’état précédent lorsque le signal est incertain. Le code se trouve dans [`examples/cas-limite.mjs`](examples/cas-limite.mjs).

```sh
npm run demo:limite
```

Résultat à repérer : `state: relevant · uncertain: true`. La commande `npm run demo` exécute les deux exemples.

## Utilisation de la bibliothèque

Importez les fonctions métier depuis `@gbesse/jev-hemicycle`. Fournissez soit `createJevClient()` depuis l’export `./jev`, soit `createFakeProvider()` pour les tests hors ligne.

Les noms de l’API JavaScript restent stables pour préserver la compatibilité avec les versions précédentes. La documentation, les exemples et les explications destinées aux utilisateurs sont en français.

## Frontière de décision

Les identifiants, dates, dédoublonnages, hôtes autorisés et seuils d’hystérésis restent dans le code. Jev évalue uniquement la pertinence sémantique du document pour le sujet surveillé.

La question exacte envoyée à Jev est versionnée dans [`src/index.mjs`](src/index.mjs). Les identifiants, dates, calculs, filtres, seuils et transitions d’état restent gérés par du code ordinaire.

## Sources

- [https://data.assemblee-nationale.fr](https://data.assemblee-nationale.fr)
- [https://github.com/gbesse/semantic-watch](https://github.com/gbesse/semantic-watch)

Conservez l’attribution amont, les identifiants d’origine, les URL de source et les dates de récupération avec chaque enregistrement dérivé.

## Appels Jev réels

Les appels réels sont facultatifs et payants. Le client fixe le modèle `jev-1.13.0`, valide l’identité du modèle et toutes les probabilités, refuse les redirections, ne retente que les erreurs réseau et les réponses HTTP 429/529, puis bloque les requêtes dépassant une estimation prudente de 24 000 jetons.

```sh
TYPESAFE_API_KEY=... node scripts/live-smoke.mjs
```

N’envoyez jamais de secret, de donnée personnelle ni de dossier sensible non expurgé. Évaluez le comportement sur un jeu représentatif de cas français avant tout usage opérationnel.

## Validation

```sh
npm run check
npm run typecheck
npm test
npm run demo
```

La CI exécute ces vérifications sous Node.js 22 et 24.

Projet indépendant, sans affiliation avec TypeSafe AI ni avec l’administration française. Consultez la [documentation de l’API Jev](https://docs.typesafe.ai/api) et les [limites du modèle](https://docs.typesafe.ai/model-jaggedness/jev-1.13).
