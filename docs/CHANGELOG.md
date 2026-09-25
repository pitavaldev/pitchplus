# Changelog PITCH+

## 1.7.4.1 — 2026-09-25

- Correction : après la première lecture de PITCH, l'écran de bienvenue se réaffichait au lieu du tableau de bord. `finish()` ne ramenait à l'accueil que depuis la vue `boot` ; les vues de passage `welcome` et `auth` y sont désormais incluses.

## 1.7.4.0 — 2026-09-25

- **Lecture de PITCH plus rapide.** Les critères d'un acquis sont lus dès que son bloc de compétence est connu : les deux phases de lecture se recouvrent au lieu de s'enchaîner. À la relecture, un acquis dont le pourcentage n'a pas bougé garde son détail en cache — en pratique quelques dizaines de requêtes au lieu de ~400. « Tout relire (lecture complète) » dans le menu ⋯ force la lecture intégrale ; le Diagnostic indique le mode utilisé, le nombre d'acquis relus et la durée.
- **Barre de progression avec attente estimée.** Le compteur suit les requêtes réellement faites ; l'estimation part du débit observé et de la durée de la lecture précédente.
- **Premier lancement guidé.** Un écran d'accueil permet de coller le lien Hyperplanning avant même la première lecture de PITCH, puis un guide en cinq écrans présente Agenda, Prochaine chance, Trajectoire, Compas et Réglages. « Revoir le guide » dans le menu ⋯.
- Deux tests ajoutés (27 au total) : l'annonce des acquis pendant la phase 1, et l'équivalence exacte des totaux entre un acquis relu et un acquis repris du cache.

## 1.7.3.2 — 2026-09-21

- Numérotation ramenée en V1 : toutes les versions sont préfixées par `1.` (1.7.3.2, 1.7.3.1, … 1.6.0.0). Première version publique sur GitHub.
- Lien Moodle du cours directement sur chaque carte de séance de l'agenda et dans le bandeau « Prochaine séance utile » (181 cours sur 195 ont un lien dans le syllabus). Ouvre moodle.icam.fr dans un nouvel onglet, avec ta session Moodle existante.

## 1.7.3.1 — 2026-09-14

- Correction : l'onglet Trajectoire 70 % ne s'affichait plus (une variable locale `t` masquait la fonction de traduction, TypeError au rendu).
- Légende de la jauge traduite en anglais (démontrés / prévus / à venir restaient en français).

## 1.7.3.0 — 14 septembre 2026

**Français ou anglais**, au choix dans les Réglages. L'interface entière bascule, ainsi que les intitulés de critères, d'acquis, de cours et de compétences, qui existent dans les deux langues dans le syllabus. Les dates suivent la langue. Quand une donnée n'existe que dans une langue, elle s'affiche telle quelle plutôt que d'être traduite à la volée. Les titres d'acquis viennent de PITCH en français et du syllabus en anglais.

**Le sélecteur de seuil 50 / 100 % disparaît.** Un acquis est validé à 50 % de ses critères démontrés, seuil de progression enregistré dans PITCH. La lecture à 100 % n'est plus proposée.

## 1.7.2.0 — 14 septembre 2026

**Compas**, un cinquième onglet pour chercher dans le syllabus. Un champ de recherche plein texte sur les critères, les acquis, les cours et leurs codes ; des filtres par compétence, semestre, domaine et, quand PITCH est lu, par état personnel ; trois niveaux de lecture, critères regroupés par acquis, acquis, ou cours dépliables avec leur lien Moodle. Chaque critère ouvre le panneau de détail habituel. Export CSV de la recherche courante.

Restes de l'audit des libellés : « Unités » devient « Cours » dans le Diagnostic, le groupe des critères sans séance s'appelle « Sans séance ».

## 1.7.1.1 — 14 septembre 2026

**Un mot par statut.** Le même statut de critère portait jusqu'à quatre noms selon l'écran, et « requalification » servait à la fois pour les acquis sous le seuil et pour les critères sans séance, d'où un « 23 requalifications » à côté d'un « 131 requalifications » qui ne comptaient pas la même chose.

- Pour un **critère** : démontré, séance prévue, cours à venir, **sans séance**, pas encore enseigné. « Daté », « perdu », « aucune séance » et « requalification » disparaissent de ce rôle.
- Pour un **acquis** : validé, requalification, rattrapage, en cours, pas commencé. Inchangé, et désormais seul usage de « requalification ».
- La pastille « 23 requalifications » du bandeau ouvre l'écran Acquis filtré sur ces 23 acquis, et non plus la liste des 131 critères.
- « Unité » ne s'affiche plus, on dit « cours ». Le mot « séance » désigne toujours un événement de l'agenda.
- Le groupe « Sans séance » précise où l'outil a cherché : agenda, syllabus, PITCH.

## 1.7.1.0 — 14 septembre 2026

**La Trajectoire change de lecture**, après vérification par Thomas des chiffres de son compte et quatre questions tranchées avec lui.

- **La barre principale couvre tout le Bachelor**, les 8 semestres, et c'est sur elle que porte le repère de 70 %. Avant, elle ne couvrait que l'année en cours.
- **Un chiffre de rythme** l'accompagne : le taux de critères démontrés parmi ceux qui ont déjà donné lieu à une séance. Sur une barre à quatre ans, c'est lui qui dit si l'étudiant est dans les temps.
- **Année par année remplace semestre par semestre.** Chaque année est montrée telle qu'elle se présentait à sa fin : les critères démontrés au plus tard cette année-là comptent, ceux rattrapés après restent en vert clair sans entrer dans le pourcentage, et les rattrapages effectués pendant une année lui sont crédités en texte. Les années passées ne bougent donc plus.
- **Les critères démontrés en avance**, dans un cours de B1 qui évalue un acquis de B2, comptent pour B2. Sur la démo, un cinquième des critères de B3 sont dans ce cas.
- La lecture par compétence porte désormais sur le cursus entier.

Fait de données mis au jour par les tests : un même critère peut appartenir à deux acquis d'années différentes, et quelques acquis rattachés à B1 n'ont de cours évaluateur qu'en B2 ou B3.

## 1.7.0.0 — 14 septembre 2026

Renumérotation en v7 pour lever toute ambiguïté sur la version installée. Aucun changement fonctionnel par rapport à 1.6.1.2.

## 1.6.1.2 — 10 septembre 2026

**Moins de chiffres, moins de texte.** L'écran Trajectoire affichait deux fois le même pourcentage sous trois libellés différents, plus un bloc « Acquis » qui répétait ce que l'onglet Acquis dit déjà. Il passe de 345 à 121 mots.

- **Le bloc « Acquis » disparaît de la Trajectoire** : la barre de statuts, sa légende à cinq entrées et la phrase sur la lecture alternative du seuil.
- **Le sélecteur de seuil 50 / 100 % passe dans les Réglages**, avec son explication. Le principe est conservé : les deux lectures existent dans PITCH, l'outil ne tranche pas, mais il ne le répète plus sur chaque écran.
- **Deux projections au lieu de quatre.** « Aujourd'hui » et « si rien n'est rattrapé » donnaient le même nombre que le titre. Restent le nombre de critères manquants pour atteindre 70 %, et la projection si tout le planifié est démontré.
- Sous-titres d'explication et total redondant de la légende retirés.
- En mode démo, les intitulés de compétence ne s'affichent plus en anglais.

## 1.6.1.1 — 10 septembre 2026

**Le vocabulaire de l'école, dit en clair.** Les codes du référentiel n'apparaissent plus dans aucune liste : ni `AA-EEE-C01-1-01`, ni `CRIT_0001`, ni `RA-…`. Chaque ligne de critère porte désormais sa compétence et l'intitulé de son acquis, en toutes lettres.

- **Les codes sont regroupés en pied de panneau**, sous un titre « Codes PITCH », pour rester trouvables quand il faut chercher dans PITCH ou en parler à un enseignant.
- **Une phrase de glossaire en tête d'écran** explique le mot au moment où il sert : ce qu'est un acquis sur l'écran Acquis, ce qu'est un critère sur l'écran Trajectoire.
- **Les statuts sont dits en français courant** : « Séance prévue », « Cours à venir », « Aucune séance » remplacent « Chance datée », « Chance à venir » et « Perdu ».
- **Les titres de compétence viennent de PITCH**, donc en français, au lieu du syllabus PDF qui est en anglais.

Limite connue : en mode démo, le filtre par compétence affiche les intitulés anglais, parce que les données fictives reprennent le PDF. Sur un compte réel, PITCH fournit le français.

## 1.6.1.0 — 9 septembre 2026

**Simplification de l'interface.** L'outil affichait tout, tout le temps : 8 onglets, 6 boutons d'en-tête et un écran « Prochaine chance » de 202 lignes et 12 500 mots.

- **Prochaine chance regroupée par séance.** Une ligne par cours à venir, avec la date et le nombre de critères à y démontrer, au lieu d'une liste plate de critères. 202 lignes deviennent 31, 12 500 mots deviennent 417.
- **L'onglet « Par cours » disparaît**, absorbé comme mode de regroupement du même écran.
- **Quatre onglets** au lieu de huit : Aujourd'hui, Agenda, Prochaine chance, Trajectoire. Acquis, Changements, Diagnostic et Réglages passent derrière un menu « Plus ».
- **Bandeau ramené à une phrase**, la prochaine séance utile, avec deux pastilles d'alerte au plus.
- **Une seule pastille par séance** dans l'agenda : ce qu'il y a à y démontrer. Le reste est dans le panneau de détail.
- **Le sélecteur de seuil 50 / 100 %** quitte l'en-tête pour l'écran Trajectoire, seul endroit où il change quelque chose.

**Corrections d'affichage.** Le code et le titre des séances se chevauchaient et débordaient de la colonne du jour (des `span` en `display:inline` ignorent la troncature). La séance sélectionnée devenait noire sur noir. Les vues Trajectoire et Diagnostic provoquaient un défilement horizontal en fenêtre étroite, comme les menus déroulants de l'écran Acquis.

**Qualité du code**, après revue sur quatre angles (réutilisation, simplification, efficacité, altitude) :
- La jauge est indexée en un seul passage au lieu de dix balayages quadratiques : le calcul complet passe de 4,6 ms à environ 2,4 ms.
- `normUnit` retire les accents, la table d'alias n'a plus à lister « Férié » et « Ferie ».
- Les codes hors compétences se comparent sur le code entier ou son premier segment, plus sur un préfixe : une future unité commençant par `RIM` ne sera plus avalée.
- Le campus n'est plus une liste blanche dans la lecture du calendrier : un campus inconnu ne fait plus perdre l'année de promotion.
- `critCode` retire le préfixe connu de l'acquis au lieu de le deviner par expression régulière.
- Le générateur de démo lit `aliases.json` au lieu d'en recopier le contenu : tout nouvel alias est désormais exercé par les tests.
- Champs construits et jamais lus supprimés, index d'unités construit une seule fois, code mort retiré du script de build.
- Le service worker ne retélécharge plus l'agenda au démarrage si le flux date de moins de 24 heures.

## 1.6.0.1 — 9 septembre 2026
- **Correction de la jointure PITCH → syllabus** : `TraitCode` est une clé composite `RA-…-AA-…-CRIT_xxxx`, pas le code de critère nu. Sans cela aucun critère ne s'appariait. Vérifié sur compte réel : 1 221/1 221 critères et 99,6 % des séances appariés ([rapport](reports/pitch-join.md)).
- Générateur de démo et tests alignés sur la forme réelle des identifiants.

## 1.6.0.0 — septembre 2026
- Nouvelle forme : extension Chrome (Manifest V3), page d'application plein écran, plus de bookmarklet.
- Trois nouvelles vues à égalité : **Agenda** (Hyperplanning annoté des critères à démontrer), **Prochaine chance** (par critère manquant, la prochaine séance datée, sinon le cours à venir, sinon requalification), **Trajectoire 70 %** (jauge de l'année, par compétence, par semestre, projection).
- Jointure des trois sources : flux iCal Hyperplanning (`DESCRIPTION` structurée), mapping officiel cours × critères (Excel `Mapping_LG_Course`), syllabus PDF (type, heures, Moodle, enseignants, séances PBL), API PITCH (état des critères).
- Dataset embarqué généré hors ligne (`tools/build_data.py`), versionné par programme et année ; mode dégradé si aucun dataset ne correspond au programme lu dans PITCH.
- Hérité de v5.3 et conservé : vue Acquis avec filtres, recherche, seuil 50 / 100 %, notes personnelles, diff depuis la dernière visite, export CSV, impression, symboles ⚠ / ↻ cliquables.
- Mode démo (étudiant fictif, données générées) pour la présentation à l'école.
- Diagnostic intégré : taux d'appariement agenda ↔ syllabus et PITCH ↔ syllabus, cours non appariés, sources et versions.
- Garanties : aucun identifiant saisi, aucune écriture dans PITCH, aucun serveur, aucune télémétrie. La seule requête réseau hors PITCH est la lecture du flux ICS de l'étudiant.

## 1.5.3 — septembre 2026 (bookmarklet)
- Dernière version bookmarklet : vue d'ensemble en quatre graphiques, verdict requalification / rattrapage, par séance, changements, blocs, suivi personnel.
