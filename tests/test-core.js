// Tests de la logique texte / text logic tests (node tests/test-core.js)
var C = require("./load.js")();
var n = 0, fail = 0;
function eq(a, b, msg) { n++; var A = JSON.stringify(a), B = JSON.stringify(b); if (A !== B) { fail++; console.log("ÉCHEC " + msg + "\n  obtenu  " + A + "\n  attendu " + B); } }
var O = { numbers: true, phones: true, dates: true, web: true, hashtags: true, codes: true, words: true, ignoreSmall: true, cc: "213" };
function keys(t) { return C.cvlTokenize(t, O).tokens.map(function (x) { return x.key; }); }

// nombres / numbers
eq(C.cvlCanonNumber("12,5"), "12.5", "décimale virgule");
eq(C.cvlCanonNumber("12.50"), "12.5", "décimale point");
eq(C.cvlCanonNumber("1,250"), "1250", "milliers virgule");
eq(C.cvlCanonNumber("1 250"), "1250", "milliers espace");
eq(C.cvlCanonNumber("1.250.000"), "1250000", "milliers points");
eq(C.cvlCanonNumber("1.250,50"), "1250.5", "mixte FR");
eq(C.cvlCanonNumber("1,250.50"), "1250.5", "mixte EN");
eq(C.cvlCanonNumber("2 500,00"), "2500", "espace + décimales");
eq(C.cvlCanonNumber("0,250"), "0.25", "0,250");
eq(C.cvlCanonNumber("12\u066B5"), "12.5", "séparateur décimal arabe");
eq(C.cvlCanonNumber("1\u066C250"), "1250", "séparateur milliers arabe");
eq(C.cvlCanonNumber("1,2,3"), null, "liste");
eq(keys("Prix : 1 250,00 DA"), ["num:1250"], "prix FR");
eq(keys("\u0627\u0644\u0633\u0639\u0631 : \u0661\u0662\u0665\u0660 \u062F\u062C"), ["num:1250"], "prix chiffres arabes");
eq(keys("\u0627\u0644\u0633\u0639\u0631 \u06F1\u06F2\u06F5\u06F0"), ["num:1250"], "chiffres persans");
eq(keys("1200DA"), ["num:1200"], "nombre + unité collée");
eq(keys("3 pièces et 7 jours"), [], "petits nombres ignorés");
eq(keys("12,5%"), ["num:12.5"], "pourcentage");
eq(keys("\u0661\u0662\u066B\u0665\u066A"), ["num:12.5"], "pourcentage arabe");

// téléphones / phones
eq(C.cvlCanonPhone("0555 12 34 56", "213"), "0555123456", "mobile");
eq(C.cvlCanonPhone("+213 555 12 34 56", "213"), "0555123456", "+213");
eq(C.cvlCanonPhone("00213 555 12 34 56", "213"), "0555123456", "00213");
eq(C.cvlCanonPhone("+213 (0) 555 12 34 56", "213"), "0555123456", "(0)");
eq(C.cvlCanonPhone("+33 6 12 34 56 78", "213"), "+33612345678", "autre pays");
eq(C.cvlCanonPhone("1 250 000", "213"), null, "pas un numéro");
eq(keys("Tél : 0555 12 34 56"), ["tel:0555123456"], "tél FR");
eq(keys("\u0627\u0644\u0647\u0627\u062A\u0641 : \u0660\u0665\u0665\u0665 \u0661\u0662 \u0663\u0664 \u0665\u0666"), ["tel:0555123456"], "tél AR");
eq(keys("0555.12.34.56 / 021-23-45-67"), ["tel:0555123456", "tel:021234567"], "deux numéros");
eq(keys("0555 12 34 56 0661 22 33 44"), ["tel:0555123456", "tel:0661223344"], "deux numéros collés");
eq(keys("+213 555 12 34 56"), ["tel:0555123456"], "tél international");
eq(keys("Fixe 021 23 45 67"), ["tel:021234567"], "fixe 9 chiffres");

// dates & heures
eq(keys("le 16/10/2026"), ["date:16/10/2026"], "date numérique");
eq(keys("2026-10-16"), ["date:16/10/2026"], "date ISO");
eq(keys("05.10.2026"), ["date:05/10/2026"], "date points (pas un tél.)");
eq(keys("16 octobre 2026"), ["date:16/10/2026"], "mois FR");
eq(keys("1er février 2027"), ["date:01/02/2027"], "1er février");
eq(keys("October 16, 2026"), ["num:16", "num:2026"], "mois avant jour non reconnu (documenté)");
eq(keys("16 \u0623\u0643\u062A\u0648\u0628\u0631 2026"), ["date:16/10/2026"], "mois AR (Machrek)");
eq(keys("16 \u0623\u0641\u0631\u064A\u0644"), ["date:16/04"], "mois AR (Maghreb) sans année");
eq(keys("16 \u062A\u0634\u0631\u064A\u0646 \u0627\u0644\u0623\u0648\u0644 2026"), ["date:16/10/2026"], "mois AR (Levant, deux mots)");
eq(keys("16 \u0645\u0627\u0631\u0633 \u0633\u064A\u0628\u062F\u0623"), ["date:16/03"], "mois AR suivi d'un mot");
eq(keys("de 10h30 à 18:00"), ["heure:10:30", "heure:18:00"], "heures");
eq(keys("10 h 30"), ["heure:10:30"], "heure espacée");
eq(keys("le 16/10"), ["date:16/10"], "jour/mois");

// web, codes
eq(keys("contact@Exemple.dz"), ["web:contact@exemple.dz"], "e-mail");
eq(keys("www.exemple.dz/promo."), ["web:exemple.dz/promo"], "site + ponctuation");
eq(keys("https://Exemple.com/"), ["web:exemple.com"], "https");
eq(keys("Suivez @Ma.Boutique"), ["web:@ma.boutique"], "@compte");
eq(keys("#Promo2026 #\u062A\u062E\u0641\u064A\u0636\u0627\u062A"), ["tag:promo2026"], "hashtag latin seulement");
eq(keys("format A4, COVID-19"), ["code:A4", "code:COVID19"], "codes");
eq(keys("M. Dupont, p. 12"), ["num:12"], "abréviations ≠ sites");

// écriture / script
eq(C.cvlTokenize("Bonjour à tous", O).script, "latn", "latin");
eq(C.cvlTokenize("\u0645\u0631\u062D\u0628\u0627 \u0628\u0643\u0645", O).script, "arab", "arabe");
eq(C.cvlTokenize("\u2D30\u2D63\u2D53\u2D4D", O).script, "tfng", "tifinagh");
eq(C.cvlTokenize("0555 12 34 56", O).script, "neutral", "neutre");
eq(C.cvlTokenize("T\u00E9l / \u0627\u0644\u0647\u0627\u062A\u0641 : 0555 12 34 56", O).script, "mixed", "mixte");
eq(C.cvlTokenize("\u0627\u0644\u0647\u0627\u062A\u0641 \u0627\u0644\u062C\u062F\u064A\u062F Tel 0555 12 34 56", O).script, "arab", "pas de séparateur = majorité");
eq(keys("021 23 45 67 0555 12 34 56"), ["tel:021234567", "tel:0555123456"], "fixe + mobile collés");
eq(C.cvlTokenize("\u0647\u0627\u062A\u0641 Samsung Galaxy \u0627\u0644\u062C\u062F\u064A\u062F \u0628\u0633\u0639\u0631 \u0645\u0645\u062A\u0627\u0632 \u062C\u062F\u0627 \u0627\u0644\u064A\u0648\u0645 \u0641\u0642\u0637", O).script, "arab", "arabe avec marque");
eq(C.cvlTokenize("\u0647\u0627\u062A\u0641 Samsung", O).words, ["Samsung"], "mots latins");

// divers
eq(C.cvlLev("0555123456", "0555123465"), 2, "levenshtein");
eq(C.cvlParseList("1-3, 5", 6), [0, 1, 2, 4], "liste plans");
eq(C.cvlMonthNumber("Décembre"), 12, "mois accentué");
eq(C.cvlMonthNumber("\u0627\u063A\u0633\u0637\u0633"), 8, "أغسطس");

// comparaison
function ver(name, texts) { var v = C.cvlNewVersion(name); texts.forEach(function (t, i) { C.cvlAddParagraph(v, C.cvlTokenize(t, O), i, true); }); return v; }
var FR = ver("FR", ["Promo -20 % jusqu'au 31/10/2026", "Prix : 1 250 DA", "Tél : 0555 12 34 56", "www.exemple.dz", "Nouveau Samsung Galaxy"]);
var AR = ver("AR", ["\u062A\u062E\u0641\u064A\u0636 20 % \u062D\u062A\u0649 31 \u0623\u0643\u062A\u0648\u0628\u0631 2026", "\u0627\u0644\u0633\u0639\u0631 : \u0661\u0663\u0665\u0660 \u062F\u062C", "\u0627\u0644\u0647\u0627\u062A\u0641 : \u0660\u0665\u0665\u0665 \u0661\u0662 \u0663\u0664 \u0666\u0665", "www.exemple.dz", "\u062C\u062F\u064A\u062F Samsung Galaxie"]);
var G = { name: "Plan 1", versions: [FR, AR] };
var iss = C.cvlCompareGroup(G, { words: true, countOcc: false });
var sum = iss.map(function (a) { return a.type + " " + a.key + " in " + a.present.join(",") + (a.pair !== null ? " pair" : ""); }).sort();
eq(sum, ["missing num:1250 in 0 pair", "missing num:1350 in 1 pair", "missing tel:0555123456 in 0 pair", "missing tel:0555123465 in 1 pair", "word mot:galaxie in 1"], "comparaison FR/AR");
eq(C.cvlCountReal(iss), 3, "écarts comptés (paires = 1)");
var lines = C.cvlDescribe(G, iss);
eq(lines.length, 3, "description 3 lignes");
eq(/faute de frappe/.test(lines.join("\n")), true, "faute de frappe signalée");

// dates sans année tolérées / yearless tolerated
var A1 = ver("A", ["le 16/10"]), B1 = ver("B", ["16 octobre 2026"]);
eq(C.cvlCompareGroup({ name: "g", versions: [A1, B1] }, {}).length, 0, "date sans année = date avec année");
// occurrences
var A2 = ver("A", ["1500", "1500"]), B2 = ver("B", ["1500"]);
eq(C.cvlCompareGroup({ name: "g", versions: [A2, B2] }, {}).length, 0, "ensembles");
eq(C.cvlCompareGroup({ name: "g", versions: [A2, B2] }, { countOcc: true })[0].type, "count", "occurrences");
// trois versions / three versions
var V3 = [ver("FR", ["0555 12 34 56"]), ver("AR", ["0555 12 34 56"]), ver("TZ", ["\u2D30\u2D63\u2D53\u2D4D 0555 12 34 57"])];
var i3 = C.cvlCompareGroup({ name: "g", versions: V3 }, {});
eq(i3.length, 2, "3 versions : 2 écarts");
eq(C.cvlCountReal(i3), 1, "3 versions : 1 faute probable");

// essai aléatoire : un même contenu écrit de façons différentes ne donne aucun écart
// random: same content written differently gives no difference
function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
function toAr(s) { return s.replace(/[0-9]/g, function (d) { return String.fromCharCode(0x0660 + (+d)); }); }
var bad = 0, typo = 0;
for (var r = 0; r < 2000; r++) {
  var price = Math.floor(Math.random() * 99000) + 100, ph = "0" + rnd(["5", "6", "7"]) + String(Math.floor(Math.random() * 1e8 + 1e8)).substring(1), d = 1 + Math.floor(Math.random() * 28), m = 1 + Math.floor(Math.random() * 12);
  var th = String(price).replace(/\B(?=(\d{3})+$)/g, " ");
  var phS = ph.substring(0, 4) + " " + ph.substring(4, 6) + " " + ph.substring(6, 8) + " " + ph.substring(8);
  var frMonths = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var arMonths = ["\u062C\u0627\u0646\u0641\u064A", "\u0641\u064A\u0641\u0631\u064A", "\u0645\u0627\u0631\u0633", "\u0623\u0641\u0631\u064A\u0644", "\u0645\u0627\u064A", "\u062C\u0648\u0627\u0646", "\u062C\u0648\u064A\u0644\u064A\u0629", "\u0623\u0648\u062A", "\u0633\u0628\u062A\u0645\u0628\u0631", "\u0623\u0643\u062A\u0648\u0628\u0631", "\u0646\u0648\u0641\u0645\u0628\u0631", "\u062F\u064A\u0633\u0645\u0628\u0631"];
  var f = ver("FR", ["Prix " + th + ",00 DA", "Appelez le " + phS, "Jusqu'au " + d + " " + frMonths[m - 1] + " 2026"]);
  var aTexts = ["\u0627\u0644\u0633\u0639\u0631 " + toAr(String(price)) + " \u062F\u062C", "\u0627\u062A\u0635\u0644\u0648\u0627 " + rnd([toAr(ph), "+213 " + ph.substring(1)]), "\u062D\u062A\u0649 " + rnd([toAr(d + "/" + m + "/2026"), d + " " + arMonths[m - 1] + " 2026"])];
  var a = ver("AR", aTexts);
  if (C.cvlCompareGroup({ name: "g", versions: [f, a] }, {}).length) { bad++; if (bad < 4) console.log("faux écart", JSON.stringify(aTexts), th, phS); }
  // faute de frappe : deux chiffres permutés dans le téléphone / swapped digits
  var ph2 = ph.substring(0, 8) + ph.charAt(9) + ph.charAt(8);
  if (ph2 !== ph) {
    var a2 = ver("AR", ["\u0627\u062A\u0635\u0644\u0648\u0627 " + toAr(ph2)]), f2 = ver("FR", ["Appelez le " + phS]);
    var ii = C.cvlCompareGroup({ name: "g", versions: [f2, a2] }, {});
    if (!(ii.length === 2 && ii[0].pair === 1)) typo++;
  }
}
eq(bad, 0, "2000 paires aléatoires sans faux écart");
eq(typo, 0, "2000 fautes de frappe trouvées et appariées");

console.log((n - fail) + "/" + n + " tests OK");
process.exit(fail ? 1 : 0);
