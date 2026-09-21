# PITCH+ — Politique de confidentialité

**Aucune donnée ne quitte le navigateur.**

- PITCH+ n'a pas de serveur, pas de compte, pas de télémétrie, pas d'analytics, pas d'appel à un service tiers ou à une IA.
- PITCH+ ne demande **jamais** d'identifiant ni de mot de passe. Il lit PITCH à travers la session déjà ouverte dans ton onglet `pitch-icam.rima1.fr`, en **lecture seule** (uniquement des requêtes GET vers `/api/…`). Il n'écrit rien dans PITCH.
- Le lien d'abonnement iCal Hyperplanning que tu colles contient une clé secrète. Il est stocké uniquement dans le stockage local de l'extension (`chrome.storage.local`), n'est jamais affiché en entier (`…71B2`), jamais exporté, jamais inclus dans un rapport.
- Le flux iCal contient ton nom et ta date de naissance dans son titre : PITCH+ n'en extrait que l'année de promotion (`B2`) et le campus (`LIL`) ; le reste n'est ni stocké séparément ni affiché.
- Les données lues (agenda, état des critères, notes personnelles, repère de comparaison) restent sur ton ordinateur. Le bouton **Tout effacer** dans les réglages les supprime intégralement. Désinstaller l'extension les supprime aussi.
- Le jeu de données embarqué (syllabus, mapping cours × critères) est un document de l'école, non personnel.
- Le mode démo utilise un étudiant fictif et des données générées.

Permissions demandées et pourquoi :

| Permission | Usage |
|---|---|
| `storage` | conserver l'agenda, le cache PITCH, les notes et préférences localement |
| `alarms` | relire le flux iCal une fois par jour |
| `tabs`, `scripting` | retrouver ou ouvrir l'onglet PITCH et y exécuter les lectures d'API avec ta session |
| hôte `pitch-icam.rima1.fr` | lecture de l'API PITCH via ta session |
| hôte `planning.icam.fr` | lecture de ton flux iCal |

Outil étudiant open source, non officiel, sans lien avec l'éditeur de PITCH (RimaOne) ni avec l'Icam. Contact : thomas.pitaval@2030.icam.fr.
