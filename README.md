# Jev Hémicycle

**Suit les documents parlementaires qui affectent matériellement un sujet déclaré.**

[![Tests](https://github.com/gbesse/jev-hemicycle/actions/workflows/test.yml/badge.svg)](https://github.com/gbesse/jev-hemicycle/actions/workflows/test.yml) [MIT](LICENSE) · Node.js 22+ · v0.2.4 · Documentation française

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

## Parcours comparatif

`npm run demo:parcours` produit un rapport JSON partageable pour **jev-hemicycle** : le scénario principal et la frontière déterministe. Chaque scénario garde sa sortie propre et échoue si son assertion ne passe plus. Les données et probabilités sont synthétiques ; aucun appel Jev n’est effectué.

Cette vue permet de comparer rapidement les chemins de décision et de choisir quel exemple adapter à vos propres données sourcées.

## Validation

```sh
npm run check
npm run typecheck
npm test
npm run demo
```

La CI exécute ces vérifications sous Node.js 22 et 24.

Projet indépendant, sans affiliation avec TypeSafe AI ni avec l’administration française. Consultez la [documentation de l’API Jev](https://docs.typesafe.ai/api) et les [limites du modèle](https://docs.typesafe.ai/model-jaggedness/jev-1.13).

## Hysteresis preflight / Prévalidation / Validación previa

EN: Thresholds and previous state are now validated before any semantic call. Nonfinite/out-of-range replies fail instead of retaining a seemingly valid prior state with misleading uncertainty. Topic data is snapshotted before asynchronous evaluation. This validates the decision contract, not parliamentary facts, legal consequences or model quality.

FR : Les seuils et l’état précédent sont désormais validés avant tout appel sémantique. Une réponse non finie/hors limites échoue au lieu de conserver un état apparemment valide et une incertitude trompeuse. Le sujet est capturé avant évaluation asynchrone. Cela valide le contrat de décision, pas les faits parlementaires, conséquences juridiques ou qualité du modèle.

ES: Umbrales y estado anterior se validan antes de llamar. Respuestas no finitas/fuera de rango fallan en lugar de conservar un estado aparentemente válido e incertidumbre engañosa. Captura el tema antes de evaluar asíncronamente. Valida contrato de decisión, no hechos parlamentarios, consecuencias jurídicas ni calidad del modelo.


FR : `evaluateDocument(..., previous, { lang: 'fr' })` propose des instructions sémantiques FR/EN/ES (défaut historique `en`) sans traduire le document ni le sujet. Le résultat conserve une copie de l’identité du sujet et du document antérieure à l’appel ; les mutations de l’appelant ou du fournisseur ne peuvent plus les réécrire pendant l’attente. Cela protège la cohérence des preuves déclarées, pas la pertinence réelle d’un document ni une interprétation juridique.

EN: `evaluateDocument(..., previous, { lang: 'en' })` supports FR/EN/ES semantic instructions (existing default `en`) without translating the document or topic. Results retain topic identity and document copies from before the call; caller or provider mutations cannot rewrite them while awaiting a response. This protects declared-evidence consistency, not actual relevance or legal interpretation.

ES: `evaluateDocument(..., previous, { lang: 'es' })` admite instrucciones semánticas FR/EN/ES (valor histórico `en`) sin traducir documentos ni temas. El resultado conserva copias previas del documento y la identidad del tema; las mutaciones del llamante o proveedor no las reescriben durante la espera. Protege la coherencia de pruebas declaradas, no la pertinencia real ni la interpretación jurídica.
## Troncature explicite / Explicit truncation / Truncado explícito

**FR.** Les documents RSS exposent maintenant `truncation.title` et `truncation.text`. Un titre affiché à 1 000 caractères peut être tronqué alors que le contexte reste complet ; seul un texte limité à 20 000 caractères impose la revue. `evaluateDocument` conserve alors l’état précédent, retourne `probability: null`, `transition: null` et `reason: truncated_text`, sans appel Jev. Les GUID dépassant 500 caractères sont refusés au lieu de créer des collisions par troncature. L’absence de ce reçu sur un document fourni manuellement ne prouve pas sa complétude ; un extrait RSS n’est pas le texte parlementaire intégral.

**EN.** RSS documents now expose `truncation.title` and `truncation.text`. A displayed title may be clipped to 1,000 characters while context remains complete; only text clipped to 20,000 characters forces review. `evaluateDocument` then preserves prior state and returns `probability: null`, `transition: null`, `reason: truncated_text`, without a Jev call. GUIDs longer than 500 characters fail instead of colliding after truncation. Missing receipts on manually supplied documents do not prove completeness; an RSS excerpt is not the full parliamentary text.

**ES.** Los documentos RSS exponen `truncation.title` y `truncation.text`. Un título limitado a 1 000 caracteres puede estar cortado con contexto completo; solo texto limitado a 20 000 exige revisión. `evaluateDocument` conserva el estado anterior y devuelve `probability: null`, `transition: null`, `reason: truncated_text`, sin llamada Jev. GUID de más de 500 caracteres se rechazan, evitando colisiones por truncado. La ausencia del recibo en documentos manuales no demuestra integridad; un extracto RSS no es el texto parlamentario completo.

```sh
npm run demo:truncated
```

