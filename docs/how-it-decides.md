# Comment la décision est prise

Les identifiants, dates, dédoublonnages, hôtes autorisés et seuils d’hystérésis restent dans le code. Jev évalue uniquement la pertinence sémantique du document pour le sujet surveillé.

La question et les critères exacts sont versionnés dans [`src/index.mjs`](../src/index.mjs). Les probabilités de la démonstration sont synthétiques. Calibrez les seuils de revue sur des cas français annotés et représentatifs avant tout usage opérationnel.
