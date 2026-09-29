# PITCH+ v7 — note pour la direction Icam Lille

**Thomas Pitaval, Bachelor International, promo 2030 — septembre 2026**

## Le problème

Un étudiant du Bachelor International doit ouvrir quatre outils pour répondre à trois questions simples. Hyperplanning dit *quand* a lieu un cours. Le syllabus (450 pages) dit *quels critères* ce cours évalue. PITCH dit *quels critères* l'étudiant a déjà démontrés. Aucun ne relie les trois. Résultat : l'étudiant ne sait pas, avant une séance, ce qu'il y a à démontrer ; il découvre tard qu'un critère manqué n'est plus enseigné nulle part ; il n'a aucune vue de sa trajectoire vers le seuil de 70 % de l'année.

## La solution

PITCH+ est une extension de navigateur, gratuite et open source, qui relie les trois sources déjà fournies par l'école et répond aux trois questions :

1. **Qu'est-ce qui arrive ?** L'agenda Hyperplanning, chaque séance annotée : *n critères à démontrer ici, m déjà démontrés*. Le TE et les phases de PBL sont identifiés.
2. **Où est ma prochaine chance ?** Pour chaque critère manquant : la prochaine séance datée qui l'évalue, sinon le prochain cours du syllabus, sinon l'alerte *requalification*.
3. **Suis-je sur la trajectoire ?** Une jauge de l'année (démontré / planifié / à venir / perdu) et sa projection contre le seuil de 70 %, par compétence et par semestre. Les lectures alternatives du seuil (50 / 70 / 100 %) sont affichées côte à côte ; l'outil ne tranche pas.

Sur l'agenda réel de septembre 2026 : 176 séances académiques, 174 reliées automatiquement au syllabus (99 %).

## Ce qui est garanti

- Aucun identifiant demandé, aucune donnée qui quitte le navigateur, aucune écriture dans PITCH. L'extension lit PITCH avec la session déjà ouverte de l'étudiant, en lecture seule.
- Code source public, réutilisable par l'école.
- Programme et année sont des paramètres : le même outil sert aux autres cursus (ingénieur intégré, apprentissage) dès qu'un export cours × critères existe.

## Ce qu'il faudrait de l'école pour passer à l'échelle

1. **L'export Excel `Mapping_LG_Course` de l'année en cours**, publié chaque rentrée (aujourd'hui : 2025-2026 pour un syllabus 2026-2027). C'est le seul fichier nécessaire pour regénérer le jeu de données.
2. **Une clarification écrite de la règle du seuil** : 70 % de l'ensemble des critères de l'année, ou 70 % par compétence ? 50 % ou 100 % par acquis ? L'outil affiche les deux lectures faute de réponse.
3. **Un code d'unité dans chaque événement Hyperplanning** identique à celui du syllabus (`MEO_PBL8` plutôt que `MEO PBL8`, `CROSS_PP5` plutôt que `CROSSDISCIP BOAT`). Aujourd'hui une table d'alias comble l'écart.
4. À terme, **une clé API PITCH en lecture** ou un export officiel, pour ne plus dépendre d'un onglet ouvert.
5. Éventuellement, une **distribution officielle** aux étudiants du BI, puis aux autres campus.

Contact : thomas.pitaval@2030.icam.fr — pitproductionpro@gmail.com — pitproduction.com
