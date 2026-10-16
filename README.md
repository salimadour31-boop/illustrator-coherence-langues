# CoherenceLangues.jsx : cohérence des versions linguistiques (Adobe Illustrator)

Script Adobe Illustrator (ExtendScript) qui compare les **versions linguistiques d'un même visuel** (français / arabe / tifinagh / anglais…) et signale tout ce qui devrait être identique d'une langue à l'autre mais ne l'est pas : **prix et nombres, téléphones, dates, heures, e-mails, sites web, @comptes, #hashtags, codes (A4, COVID-19, réf.) et noms latins** cités dans le texte arabe ou hébreu.

Exemple typique : l'affiche bilingue où le prix est « 1 250 DA » en français et « ١٣٥٠ دج » en arabe, ou le numéro « 0555 12 34 56 » devenu « ٠٥٥٥ ١٢ ٣٤ ٦٥ » dans la version arabe. Le script le voit, l'entoure et propose « faute de frappe probable ».

**Lecture seule** : le texte n'est jamais modifié. Seuls des repères sont posés sur un calque non imprimable (supprimables par le bouton *Effacer les repères* ou Ctrl+Z).

## Ce que fait le script

- **Quatre façons de définir les versions** :
  - par écriture (arabe, latin, tifinagh, hébreu, cyrillique, grec, CJC) **sur chaque plan de travail** : le cas de l'affiche ou du flyer bilingue sur la même page ;
  - par écriture dans tout le document ;
  - **chaque plan de travail est une version** (une langue par plan) ; filtre « 1-3, 5 » possible ;
  - **chaque calque principal est une version** (calques « FR », « AR », « TZ »…), comparés plan de travail par plan de travail ou sur tout le document. Les calques de langue masqués sont lus aussi.
- **Normalisation avant comparaison**, pour ne pas crier au loup :
  - chiffres arabes ٠١٢٣ et persans ۰۱۲۳ = 0123 ; séparateurs ٫ ٬ ٪ reconnus ;
  - `1 250,00` = `1,250.00` = `1250` = `١٢٥٠` ; `12,5 %` = `12.5%` ;
  - téléphones : `0555 12 34 56` = `0555.12.34.56` = `+213 555 12 34 56` = `00213 (0)555…` (indicatif réglable), deux numéros collés séparés correctement ;
  - dates : `16/10/2026` = `2026-10-16` = `16 octobre 2026` = `16 أكتوبر 2026` = `16 أفريل` (mois français, anglais, arabes du Maghreb, du Machrek et du Levant, comme تشرين الأول) ; une date sans année correspond à la même date avec année ; ordre américain 11/30/2026 reconnu ;
  - heures : `10h30` = `10 h 30` = `10:30` ;
  - sites : `https://www.Exemple.dz/` = `exemple.dz` ; e-mails et @comptes sans tenir compte de la casse.
- **Paragraphes neutres ou bilingues** (une ligne avec seulement un numéro, ou « Tél / الهاتف : … ») : comptés pour toutes les versions du groupe, donc pas de faux écart.
- **Faute de frappe probable** : un élément absent d'un côté et un élément voisin présent de l'autre (même type, une ou deux différences) sont présentés ensemble : `0555123456 (Latin) / 0555123465 (Arabe)`.
- **Noms latins dans le texte arabe / hébreu** (marques, noms de produits) : vérifiés dans la version latine (Samsung **Galaxie** ≠ Samsung **Galaxy**).
- Options : ignorer les nombres d'un seul chiffre (par défaut), comparer aussi le nombre d'occurrences, textes sélectionnés seulement, ignorer les textes masqués.
- **Résultat** : repères sur le calque non imprimable « Coherence langues (reperes) » (cadre orange = élément présent seulement ici, cadre rouge pointillé = élément manquant dans cette version, avec la liste), sélection des textes concernés, rapport `.txt` en option. Le bouton **Analyser** affiche le rapport sans rien toucher.
- Textes chaînés lus une seule fois, textes dans des groupes, dialogue en français ou en anglais selon la langue d'Illustrator.

## Pourquoi c'est nouveau

Vérifications faites le 16 octobre 2026 avant d'écrire le script :

- **Illustrator** n'a aucune fonction de comparaison entre langues (les variables / jeux de données servent à remplir les textes, pas à les contrôler).
- **Adobe Community** : « Know-how on working with multiple language on packaging in Illustrator » : copier-coller à la main, renvoi vers Esko Dynamic Content (gestion de contenu payante) et TextSync de rj-graffix (synchronisation, pas de contrôle) ; les autres fils parlent d'extraire / remplacer du texte pour la traduction.
- **GitHub** : rien pour Illustrator (recherches « illustrator translation numbers jsx », « illustrator bilingual check », « multilingual artwork numbers check », « illustrator script compare text artboards ») ; Illustrator-Asset-Localiser exporte des jeux de données par langue sans contrôle.
- **Auteurs connus** (creold, Hiroyuki Sato, John Wundes, Alexander Ladygin, wckdtall, Kelso Cartography, Josh Duncan, vexy, swwwitch) : aucun script de ce type (seulement numérotation, mise en forme des nombres, comparaison de versions de scripts).
- **Ce qui existe, hors d'Illustrator** : des services payants qui comparent des **PDF exportés** à un fichier maître : LYNCE Translation QA, GoVisually, InformaIT Text Compare, GlobalVision Verify. Ils ne travaillent pas dans le document ouvert, ne savent pas séparer deux langues posées sur la même page, et ne reconnaissent pas les équivalences locales (chiffres ٠١٢٣, mois جانفي / أفريل du Maghreb, indicatif +213, « 1 250,00 DA » = « 1250 دج »).

## Installation

1. Téléchargez `CoherenceLangues.jsx`.
2. Soit **Fichier > Scripts > Autre script…** (Ctrl+F12 / Cmd+F12) et choisissez le fichier ;
3. soit copiez-le dans le dossier des scripts d'Illustrator puis relancez Illustrator :
   - Windows : `C:\Program Files\Adobe\Adobe Illustrator <version>\Presets\fr_FR\Scripts\`
   - macOS : `/Applications/Adobe Illustrator <version>/Presets/fr_FR/Scripts/`

   Il apparaît alors dans **Fichier > Scripts**.

## Utilisation

1. Ouvrez le document (conseil : travaillez sur une copie).
2. Lancez le script, choisissez comment les versions sont rangées (même page, un plan par langue, un calque par langue).
3. Cochez les éléments à comparer, puis **Analyser** pour lire le rapport sans rien modifier, ou **Contrôler** pour poser les repères et sélectionner les textes concernés.
4. Corrigez, relancez : les anciens repères sont remplacés. **Effacer les repères** supprime le calque de repères.

Limites connues : le texte vectorisé ne peut pas être lu ; le français et l'anglais posés sur le même plan sont tous deux « latins » (utilisez alors un calque ou un plan de travail par langue) ; les dates écrites mois avant jour (« October 16 ») et les nombres écrits en toutes lettres ne sont pas reconnus ; « 1.250 » est lu comme 1250.

## Version et statut des tests

- Cible : Adobe Illustrator CC 2018 à 2026 (ExtendScript ES3), Windows et macOS.
- **Non testé dans Illustrator.**
- Vérifié sur ordinateur : syntaxe ES3 et ES5 (acorn) ; 75 tests de la logique texte (nombres, téléphones, dates, heures, sites, codes, écritures, comparaison, appariement des fautes), dont 2 000 paires FR/AR aléatoires écrites de façons différentes sans faux écart et 2 000 fautes de frappe retrouvées ; 33 tests sur un document Illustrator simulé (quatre modes, calques masqués, textes chaînés, groupes, sélection, repères, rapport). Lancer : `node tests/test-core.js` et `node tests/test-mock.js`.
- Aucun appel réseau, aucune collecte de données.

## English summary

**CoherenceLangues.jsx** compares the language versions of the same artwork (on the same artboard by script, one artboard per language, or one layer per language) and flags prices, numbers, phone numbers, dates, times, e-mails, websites, @handles, hashtags, codes and Latin brand names that differ between versions. It normalizes Arabic-Indic digits, number formats, phone formats (country code), French/English/Arabic month names and time formats, pairs probable typos, and marks results on a non-printing layer without ever changing the text. Untested in Illustrator; syntax and logic tested with Node (see `tests/`).

## Licence

MIT © 2026 Amirouche Amwanes
