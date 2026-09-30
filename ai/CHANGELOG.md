# Journal des modifications assistées par IA

## 0.2.3 — 2026-09-30

- Ajout d’un second exemple consacré aux cas limites et aux garde-fous métier.
- `npm run demo` exécute désormais les scénarios nominal et limite avec assertions.

## 0.2.2 — 2026-09-29

- Ajout d’un exemple exécutable, lisible et directement copiable dans le README.
- Données synthétiques françaises, fournisseur Jev simulé et assertion de non-régression.

## 0.2.1 — 2026-09-29

- Documentation, métadonnées et parcours contributeur entièrement francisés.
- Noms de l’API publique conservés pour assurer la compatibilité.

## 2026-09-25 — 0.2.0

- Added bounded ingestion of the official Assemblée nationale parliamentary-publications RSS feed.
- Normalizes titles/descriptions, deduplicates GUIDs, validates official HTTPS links and exposes an injectable fetcher
  for deterministic tests and downstream products.
- Updated the public TypeScript contract and documented the legal-monitoring boundary.

## 2026-09-21 — 0.1.0

Création de la première version alpha publique autour d’une décision bornée du domaine français. Ajout d’un client Jev validé et épinglé, d’un fournisseur simulé hors ligne, de garde-fous déterministes, de tests, de la CI, de la documentation et d’une démonstration synthétique. Aucun appel Jev réel ni banc de précision métier n’a été exécuté.