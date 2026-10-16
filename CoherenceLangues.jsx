/*
 * CoherenceLangues.jsx — v1.0.0
 * Contrôle de cohérence des versions linguistiques / Language versions consistency check
 * Adobe Illustrator CC 2018–2026 (ExtendScript ES3)
 *
 * FR : Compare les versions linguistiques d'un même visuel (français / arabe / tifinagh / anglais…)
 *      et signale les nombres, prix, téléphones, dates, heures, e-mails, sites, @comptes, codes
 *      et noms latins qui ne sont pas les mêmes d'une version à l'autre. Lecture seule :
 *      seuls des repères sont ajoutés sur un calque non imprimable.
 * EN : Compares the language versions of the same artwork and flags numbers, prices, phone numbers,
 *      dates, times, e-mails, websites, @handles, codes and Latin names that differ between versions.
 *      Read-only: only markers are added on a non-printing layer.
 *
 * Copyright (c) 2026 Amirouche Amwanes — MIT License
 * Aucun appel réseau, aucune collecte de données. / No network access, no data collection.
 * Conseil : travaillez sur une copie du fichier. / Tip: work on a copy of your file.
 */

#target illustrator

var CVL = {};
CVL.VERSION = "1.0.0";
CVL.MARKER_LAYER = "Coherence langues (reperes)";
CVL.FR = true;
try { CVL.FR = String(app.locale || "fr").toLowerCase().indexOf("fr") === 0; } catch (eLoc) { CVL.FR = true; }

/* Traduction / translation */
function L(fr, en) { return CVL.FR ? fr : en; }

/* ===================================================================== */
/*  1. Outils texte purs (testables hors Illustrator) / pure text tools  */
/* ===================================================================== */

function cvlRepeat(ch, n) { var s = ""; for (var i = 0; i < n; i++) { s += ch; } return s; }
function cvlTrim(s) { return String(s).replace(/^\s+|\s+$/g, ""); }
function cvlInArray(a, v) { for (var i = 0; i < a.length; i++) { if (a[i] === v) { return true; } } return false; }

/* Normalisation 1:1 quand c'est possible : chiffres arabes/persans -> ASCII, espaces spéciales -> espace,
   caractères invisibles bidi retirés. / Digits to ASCII, special spaces to space, bidi controls removed. */
function cvlNormalize(text) {
    var s = String(text), out = "", i, c, code;
    for (i = 0; i < s.length; i++) {
        c = s.charAt(i); code = s.charCodeAt(i);
        if (code >= 0x0660 && code <= 0x0669) { out += String.fromCharCode(48 + code - 0x0660); }
        else if (code >= 0x06F0 && code <= 0x06F9) { out += String.fromCharCode(48 + code - 0x06F0); }
        else if (code === 0x00A0 || code === 0x202F || code === 0x2009 || code === 0x2007 || code === 0x200A || code === 0x2008 || code === 0x2002 || code === 0x2003 || code === 0x3000) { out += " "; }
        else if (code === 0x0003 || code === 0x000A || code === 0x0009 || code === 0x2028) { out += " "; }
        else if (code === 0x066A) { out += "%"; }
        else if (code === 0x200E || code === 0x200F || code === 0x061C || code === 0x200B || code === 0xFEFF || (code >= 0x202A && code <= 0x202E) || (code >= 0x2066 && code <= 0x2069)) { /* retiré / removed */ }
        else if (code === 0x2212 || code === 0x2010 || code === 0x2011 || code === 0x2013) { out += "-"; }
        else { out += c; }
    }
    return out;
}

/* Variantes d'alif et de ya pour reconnaître les mois arabes / alef & ya variants (month names only) */
function cvlFoldArabic(s) {
    return String(s).replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627").replace(/\u0649/g, "\u064A").replace(/[\u064B-\u0652\u0640]/g, "");
}

/* Accents latins retirés pour comparer les mots / Latin accents folded */
function cvlFoldLatin(s) {
    var from = "àáâãäåāçćčèéêëēěìíîïīñńòóôõöøōœùúûüūýÿžšß", to = "aaaaaaacccdeeeeeeiiiiinnoooooooouuuuuyyzss";
    var r = "", i, c, k;
    s = String(s).toLowerCase();
    for (i = 0; i < s.length; i++) { c = s.charAt(i); k = from.indexOf(c); r += (k >= 0) ? to.charAt(k) : c; }
    return r.replace(/['\u2019\-]/g, "");
}

CVL.MONTHS = [
    /* 1 */ ["janvier", "janv", "january", "jan", "\u062C\u0627\u0646\u0641\u064A", "\u064A\u0646\u0627\u064A\u0631", "\u0643\u0627\u0646\u0648\u0646 \u0627\u0644\u062B\u0627\u0646\u064A"],
    /* 2 */ ["fevrier", "fevr", "fev", "february", "feb", "\u0641\u064A\u0641\u0631\u064A", "\u0641\u0628\u0631\u0627\u064A\u0631", "\u0634\u0628\u0627\u0637"],
    /* 3 */ ["mars", "march", "mar", "\u0645\u0627\u0631\u0633", "\u0627\u0630\u0627\u0631"],
    /* 4 */ ["avril", "avr", "april", "apr", "\u0627\u0641\u0631\u064A\u0644", "\u0627\u0628\u0631\u064A\u0644", "\u0646\u064A\u0633\u0627\u0646"],
    /* 5 */ ["mai", "may", "\u0645\u0627\u064A", "\u0645\u0627\u064A\u0648", "\u0627\u064A\u0627\u0631"],
    /* 6 */ ["juin", "june", "jun", "\u062C\u0648\u0627\u0646", "\u064A\u0648\u0646\u064A\u0648", "\u064A\u0648\u0646\u064A\u0629", "\u062D\u0632\u064A\u0631\u0627\u0646"],
    /* 7 */ ["juillet", "juil", "july", "jul", "\u062C\u0648\u064A\u0644\u064A\u0629", "\u064A\u0648\u0644\u064A\u0648", "\u064A\u0648\u0644\u064A\u0629", "\u062A\u0645\u0648\u0632"],
    /* 8 */ ["aout", "august", "aug", "\u0627\u0648\u062A", "\u063A\u0634\u062A", "\u0627\u063A\u0633\u0637\u0633", "\u0627\u0628"],
    /* 9 */ ["septembre", "sept", "september", "sep", "\u0633\u0628\u062A\u0645\u0628\u0631", "\u0627\u064A\u0644\u0648\u0644"],
    /* 10 */ ["octobre", "oct", "october", "\u0627\u0643\u062A\u0648\u0628\u0631", "\u062A\u0634\u0631\u064A\u0646 \u0627\u0644\u0627\u0648\u0644"],
    /* 11 */ ["novembre", "nov", "november", "\u0646\u0648\u0641\u0645\u0628\u0631", "\u062A\u0634\u0631\u064A\u0646 \u0627\u0644\u062B\u0627\u0646\u064A"],
    /* 12 */ ["decembre", "dec", "december", "\u062F\u064A\u0633\u0645\u0628\u0631", "\u0643\u0627\u0646\u0648\u0646 \u0627\u0644\u0627\u0648\u0644"]
];

/* Numéro du mois (1–12) ou 0 / month number or 0 */
function cvlMonthNumber(word) {
    var w = cvlFoldArabic(cvlFoldLatin(cvlTrim(word))).replace(/\.$/, "");
    var m, k;
    for (m = 0; m < 12; m++) { for (k = 0; k < CVL.MONTHS[m].length; k++) { if (CVL.MONTHS[m][k] === w) { return m + 1; } } }
    return 0;
}

CVL.UNITS = ["da", "dzd", "dinar", "dinars", "eur", "euro", "euros", "usd", "mad", "tnd", "k", "kg", "g", "mg", "t", "l", "ml", "cl", "dl", "mm", "cm", "m", "km", "m2", "m3", "h", "min", "mn", "s", "ms", "j", "w", "kw", "kwh", "v", "a", "mah", "go", "mo", "to", "gb", "mb", "tb", "px", "pt", "x", "pcs", "ans", "an", "st", "nd", "rd", "th", "er", "e", "eme", "ere"];

/* Analyse d'un nombre écrit / parse a written number. Retourne la forme canonique ou null. */
function cvlCanonNumber(raw) {
    var s = String(raw).replace(/'/g, " "), groups = [], seps = [], cur = "", i, c, dec = -1;
    for (i = 0; i < s.length; i++) {
        c = s.charAt(i);
        if (c >= "0" && c <= "9") { cur += c; }
        else { groups.push(cur); seps.push(c); cur = ""; }
    }
    groups.push(cur);
    if (seps.length === 0) { return cvlCleanInt(groups[0]); }
    var last = seps[seps.length - 1], lastG = groups[groups.length - 1];
    var hasDot = false, hasComma = false, nLast = 0;
    for (i = 0; i < seps.length; i++) {
        if (seps[i] === ".") { hasDot = true; }
        if (seps[i] === ",") { hasComma = true; }
        if (seps[i] === last) { nLast++; }
    }
    if (last === "\u066B") { dec = seps.length - 1; }
    else if (last === "." || last === ",") {
        if (hasDot && hasComma) { if (nLast === 1) { dec = seps.length - 1; } }
        else if (nLast === 1) {
            if (seps.length > 1) { dec = seps.length - 1; } /* milliers déjà marqués par des espaces / thousands already spaced */
            else if (!(lastG.length === 3 && groups[0].length <= 3 && groups[0] !== "0")) { dec = 0; }
        }
    }
    /* les groupes de milliers doivent avoir 3 chiffres / thousands groups must have 3 digits */
    var lim = (dec >= 0) ? dec : seps.length;
    for (i = 1; i <= lim; i++) { if (groups[i].length !== 3) { return null; } }
    if (groups[0].length === 0 || groups[0].length > 3 && lim > 0) { return null; }
    var intPart = "", fracPart = "";
    for (i = 0; i <= lim; i++) { intPart += groups[i]; }
    if (dec >= 0) { fracPart = groups[groups.length - 1]; }
    intPart = cvlCleanInt(intPart);
    fracPart = fracPart.replace(/0+$/, "");
    return fracPart.length ? intPart + "." + fracPart : intPart;
}
function cvlCleanInt(d) { d = String(d).replace(/^0+/, ""); return d.length ? d : "0"; }

/* Téléphone : forme canonique nationale / phone canonical form */
function cvlCanonPhone(raw, cc) {
    var s = String(raw).replace(/\(0\)/g, ""), d = s.replace(/[^0-9]/g, ""), intl = false;
    if (/^\s*\+/.test(s)) { intl = true; }
    else if (d.indexOf("00") === 0) { intl = true; d = d.substring(2); }
    if (d.length < 9 || d.length > 15) { return null; }
    if (intl) {
        if (cc && d.indexOf(cc) === 0) { d = d.substring(cc.length); if (d.charAt(0) !== "0") { d = "0" + d; } return (d.length >= 9) ? d : null; }
        return (d.length >= 10) ? "+" + d : null;
    }
    if (d.charAt(0) !== "0") { return null; }
    return d;
}

/* Cherche les numéros valides dans une suite de groupes de chiffres (deux numéros collés, date suivie d'un numéro…)
   Find valid phone numbers inside a run of digit groups. Returns the run with phones blanked. */
function cvlFindPhones(m, opts, push) {
    var starts = [], ends = [], i, j, re = /\d+/g, r, out = m, sub, k, s0;
    while ((r = re.exec(m)) !== null) { starts.push(r.index); ends.push(r.index + r[0].length); }
    i = 0;
    while (i < starts.length) {
        var best = null;
        for (j = i; j < starts.length; j++) {
            s0 = starts[i];
            /* préfixe + ou ( collé au premier groupe / leading + or ( */
            while (s0 > 0 && /[+( ]/.test(m.charAt(s0 - 1)) && (m.charAt(s0 - 1) !== " " || (s0 > 1 && m.charAt(s0 - 2) === "+"))) { s0--; }
            sub = m.substring(s0, ends[j]);
            if (sub.charAt(0) === " ") { sub = sub.substring(1); s0++; }
            k = cvlCanonPhone(sub, opts.cc);
            if (k === null) { continue; }
            /* longueur préférée : 10 chiffres, puis 9, puis la plus longue / preferred length 10, then 9, then longest */
            var score = (k.length === 10) ? 1000 : ((k.length === 9) ? 900 : k.length);
            if (!best || score > best.score) { best = { score: score, j: j, s0: s0, sub: sub, k: k }; }
        }
        if (best) {
            if (opts.phones) { push("tel", best.k, best.sub); }
            out = out.substring(0, best.s0) + cvlRepeat(" ", ends[best.j] - best.s0) + out.substring(ends[best.j]);
            i = best.j + 1;
        } else { i++; }
    }
    return out;
}

function cvlPad2(n) { n = String(n); return n.length < 2 ? "0" + n : n; }
function cvlDate(d, m, y) {
    d = parseInt(d, 10); m = parseInt(m, 10);
    if (isNaN(d) || isNaN(m) || m < 1 || m > 12 || d < 1 || d > 31) { return null; }
    var r = cvlPad2(d) + "/" + cvlPad2(m);
    if (y !== null && y !== undefined && String(y).length) {
        y = parseInt(y, 10); if (isNaN(y)) { return null; }
        if (y < 100) { y += 2000; }
        if (y < 1900 || y > 2200) { return null; }
        r += "/" + y;
    }
    return r;
}

/* Écritures / scripts */
CVL.SCRIPTS = ["arab", "hebr", "latn", "cyrl", "grek", "tfng", "cjk"];
function cvlScriptName(k) {
    var fr = { arab: "Arabe", hebr: "H\u00E9breu", latn: "Latin", cyrl: "Cyrillique", grek: "Grec", tfng: "Tifinagh", cjk: "CJC", mixed: "Mixte", neutral: "Neutre" };
    var en = { arab: "Arabic", hebr: "Hebrew", latn: "Latin", cyrl: "Cyrillic", grek: "Greek", tfng: "Tifinagh", cjk: "CJK", mixed: "Mixed", neutral: "Neutral" };
    return (CVL.FR ? fr : en)[k] || k;
}
function cvlCharScript(code) {
    if ((code >= 0x0621 && code <= 0x064A) || (code >= 0x066E && code <= 0x06D3) || code === 0x06D5 || (code >= 0x06FA && code <= 0x06FF) || (code >= 0x0750 && code <= 0x077F) || (code >= 0x08A0 && code <= 0x08FF) || (code >= 0xFB50 && code <= 0xFDFF) || (code >= 0xFE70 && code <= 0xFEFC)) { return "arab"; }
    if ((code >= 0x05D0 && code <= 0x05EA) || (code >= 0x05F0 && code <= 0x05F2) || (code >= 0xFB1D && code <= 0xFB4F)) { return "hebr"; }
    if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122) || (code >= 0x00C0 && code <= 0x024F && code !== 0x00D7 && code !== 0x00F7) || (code >= 0x1E00 && code <= 0x1EFF)) { return "latn"; }
    if (code >= 0x0400 && code <= 0x04FF) { return "cyrl"; }
    if (code >= 0x0370 && code <= 0x03FF) { return "grek"; }
    if (code >= 0x2D30 && code <= 0x2D7F) { return "tfng"; }
    if ((code >= 0x3040 && code <= 0x30FF) || (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0xAC00 && code <= 0xD7AF)) { return "cjk"; }
    return "";
}
/* Compte des lettres par écriture / letter count per script */
function cvlCountScripts(s) {
    var counts = {}, i, k;
    for (i = 0; i < s.length; i++) { k = cvlCharScript(s.charCodeAt(i)); if (k) { counts[k] = (counts[k] || 0) + 1; } }
    return counts;
}
/* Écriture principale, "neutral" si aucune lettre ; sans noMixed : "mixed" si deux écritures fortes
   Main script, "neutral" without letters; without noMixed: "mixed" when two strong scripts */
function cvlClassify(counts, noMixed) {
    var best = "", bestN = 0, second = 0, total = 0, k;
    for (k in counts) { if (counts.hasOwnProperty(k)) { total += counts[k]; if (counts[k] > bestN) { second = bestN; bestN = counts[k]; best = k; } else if (counts[k] > second) { second = counts[k]; } } }
    if (total === 0) { return "neutral"; }
    if (!noMixed && second >= 3 && second / total >= 0.25) { return "mixed"; }
    return best;
}
function cvlIsRTL(k) { return k === "arab" || k === "hebr" || k === "tfng"; }

/* ---------------------------------------------------------------------
   Extraction des éléments à comparer / extract comparable tokens
   opts : numbers, phones, dates, web, hashtags, codes, words, ignoreSmall, cc
   Retour / returns { tokens:[{kind,key,raw}], words:[mots latins], counts:{}, script:"" }
   --------------------------------------------------------------------- */
function cvlTokenize(text, opts) {
    var w = cvlNormalize(text), tokens = [];
    function push(kind, key, raw) { tokens.push({ kind: kind, key: kind + ":" + key, raw: cvlTrim(raw) }); }
    function blank(m) { return cvlRepeat(" ", m.length); }

    /* e-mails */
    w = w.replace(/[A-Za-z0-9][A-Za-z0-9._%+\-]*@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}/g, function (m) {
        if (opts.web) { push("web", m.toLowerCase(), m); }
        return blank(m);
    });
    /* sites web / websites */
    w = w.replace(/(?:https?:\/\/[^\s]+|(?:www\.)?[A-Za-z0-9][A-Za-z0-9\-]*(?:\.[A-Za-z0-9\-]+)*\.(?:com|net|org|dz|fr|info|biz|io|co|ma|tn|eu|be|ch|ca|uk|de|es|it|app|shop|store|online|site|tv|me|edu|gov)\b(?:\/[^\s]*)?)/gi, function (m) {
        var raw = m.replace(/[.,;:!?\u00BB"')\]\u060C\u061F\u061B]+$/, "");
        var k = raw.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
        if (opts.web) { push("web", k, raw); }
        return blank(m);
    });
    /* @comptes / @handles */
    w = w.replace(/(^|[^A-Za-z0-9_.@])@([A-Za-z0-9_][A-Za-z0-9_.]*[A-Za-z0-9_])/g, function (m, pre, h) {
        if (opts.web) { push("web", "@" + h.toLowerCase(), "@" + h); }
        return pre + blank(m.substring(pre.length));
    });
    /* #hashtags latins / Latin hashtags */
    w = w.replace(/#([A-Za-z][A-Za-z0-9_]*)/g, function (m, h) {
        if (opts.hashtags) { push("tag", h.toLowerCase(), m); }
        return blank(m);
    });
    /* téléphones (9 à 15 chiffres) / phones */
    w = w.replace(/(?:\+ ?|\b00 ?)?\(?\b\d{1,4}\)?(?:[ .\-]?\(?\d{1,4}\)?){2,9}/g, function (m) {
        return cvlFindPhones(m, opts, push);
    });
    /* dates numériques / numeric dates */
    w = w.replace(/\b(\d{4})([\/.\-])(\d{1,2})\2(\d{1,2})\b|\b(\d{1,2})([\/.\-])(\d{1,2})\6(\d{2}|\d{4})\b/g, function (m, y1, s1, m1, d1, d2, s2, m2, y2) {
        var k = null;
        if (y1) { k = cvlDate(d1, m1, y1); }
        else { k = cvlDate(d2, m2, y2); if (k === null) { k = cvlDate(m2, d2, y2); } }
        if (k === null) { return m; }
        if (opts.dates) { push("date", k, m); }
        return blank(m);
    });
    /* dates avec nom du mois (FR / EN / AR) / dates with month names */
    w = w.replace(/\b(\d{1,2})(?:er|st|nd|rd|th)? ?([A-Za-z\u00E9\u00FB\u00C9\u00DB]{3,9}\.?|[\u0621-\u064A]{2,7}(?: [\u0621-\u064A]{4,6})?)(?: (\d{4}))?/g, function (m, d, mon, y) {
        var mn = cvlMonthNumber(mon), k;
        if (!mn && mon.indexOf(" ") > 0) {
            /* « 16 مارس سنة » : on réessaie avec le premier mot / retry with first word */
            var first = mon.substring(0, mon.indexOf(" "));
            mn = cvlMonthNumber(first);
            if (mn) { k = cvlDate(d, mn, null); if (k && opts.dates) { push("date", k, d + " " + first); } return k ? blank(d + " " + first) + m.substring((d + " " + first).length) : m; }
        }
        if (!mn) { return m; }
        k = cvlDate(d, mn, y || null);
        if (k === null) { return m; }
        if (opts.dates) { push("date", k, m); }
        return blank(m);
    });
    /* heures / times */
    w = w.replace(/\b(\d{1,2}) ?[:hH] ?(\d{2})(?!\d)/g, function (m, h, mi) {
        var hh = parseInt(h, 10), mm = parseInt(mi, 10);
        if (hh > 24 || mm > 59) { return m; }
        if (opts.dates) { push("heure", hh + ":" + cvlPad2(mm), m); }
        return blank(m);
    });
    /* jours/mois sans année 16/10 / day/month without year */
    w = w.replace(/\b(\d{1,2})\/(\d{1,2})\b(?![\/\d])/g, function (m, d, mo) {
        var k = cvlDate(d, mo, null);
        if (k === null) { return m; }
        if (opts.dates) { push("date", k, m); }
        return blank(m);
    });
    /* codes lettres+chiffres (A4, COVID-19, REF-245) / alphanumeric codes */
    w = w.replace(/\b[A-Za-z]{1,8}-?\d+[A-Za-z0-9\-]*\b|\b\d+-?[A-Za-z]+[A-Za-z0-9\-]*\b/g, function (m) {
        var mm = /^(\d+)-?([A-Za-z]+)$/.exec(m);
        if (mm && cvlInArray(CVL.UNITS, mm[2].toLowerCase())) {
            return mm[1] + blank(m.substring(mm[1].length));
        }
        if (opts.codes) { push("code", m.toUpperCase().replace(/-/g, ""), m); }
        return blank(m);
    });
    /* nombres / numbers */
    w = w.replace(/\d+(?:(?:[.,\u066B\u066C]|[ '](?=\d{3}(?!\d)))\d+)*/g, function (m) {
        var parts = [], k = cvlCanonNumber(m), i;
        if (k === null) { parts = m.split(/[^0-9]+/); } else { parts = [k]; }
        for (i = 0; i < parts.length; i++) {
            var p = (k === null) ? cvlCleanInt(parts[i]) : parts[i];
            if (!parts[i].length) { continue; }
            if (opts.ignoreSmall && /^\d$/.test(p)) { continue; }
            if (opts.numbers) { push("num", p, (k === null) ? parts[i] : m); }
        }
        return blank(m);
    });

    var counts = cvlCountScripts(w), segs = w.split(/[\/|\u2022\u00B7\u2013\u2014]| - /), segScripts = [], si, sc;
    for (si = 0; si < segs.length; si++) {
        sc = cvlClassify(cvlCountScripts(segs[si]), true);
        if (sc !== "neutral" && !cvlInArray(segScripts, sc)) { segScripts.push(sc); }
    }
    var words = [], wm, re = /[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F'\u2019\-]*[A-Za-z\u00C0-\u024F]/g;
    while ((wm = re.exec(w)) !== null) { words.push(wm[0]); }
    return { tokens: tokens, words: words, counts: counts, script: (segScripts.length > 1) ? "mixed" : cvlClassify(counts, true) };
}

/* Distance d'édition / edit distance */
function cvlLev(a, b) {
    var i, j, prev = [], cur = [];
    for (j = 0; j <= b.length; j++) { prev[j] = j; }
    for (i = 1; i <= a.length; i++) {
        cur = [i];
        for (j = 1; j <= b.length; j++) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
        }
        prev = cur;
    }
    return prev[b.length];
}

/* ---------------------------------------------------------------------
   Modèle de comparaison / comparison model
   group = { name, versions:[ver] } ; ver = { name, tokens:{key:{kind,raw,count,occ:[frameId]}},
   latinAll:{folded:true}, rtlWords:{folded:{raw,occ}}, letters:{}, frames:[ids], hasText:bool }
   --------------------------------------------------------------------- */
function cvlNewVersion(name) { return { name: name, tokens: {}, latinAll: {}, rtlWords: {}, letters: {}, frames: [], nTok: 0 }; }

function cvlAddToken(ver, tok, frameId) {
    var t = ver.tokens[tok.key];
    if (!t) { t = ver.tokens[tok.key] = { kind: tok.kind, raw: tok.raw, count: 0, occ: [] }; ver.nTok++; }
    t.count++;
    if (frameId !== null && frameId !== undefined && !cvlInArray(t.occ, frameId)) { t.occ.push(frameId); }
}
function cvlAddFrame(ver, frameId) { if (!cvlInArray(ver.frames, frameId)) { ver.frames.push(frameId); } }

/* Ajoute un paragraphe analysé à une version / add analysed paragraph */
function cvlAddParagraph(ver, an, frameId, forWords) {
    var i, k, f;
    for (i = 0; i < an.tokens.length; i++) { cvlAddToken(ver, an.tokens[i], frameId); }
    for (k in an.counts) { if (an.counts.hasOwnProperty(k)) { ver.letters[k] = (ver.letters[k] || 0) + an.counts[k]; } }
    for (i = 0; i < an.words.length; i++) {
        f = cvlFoldLatin(an.words[i]);
        ver.latinAll[f] = true;
        if (forWords && ((an.counts.arab || 0) + (an.counts.hebr || 0) + (an.counts.tfng || 0)) >= 3) {
            if (!ver.rtlWords[f]) { ver.rtlWords[f] = { raw: an.words[i], occ: [] }; }
            if (!cvlInArray(ver.rtlWords[f].occ, frameId)) { ver.rtlWords[f].occ.push(frameId); }
        }
    }
    cvlAddFrame(ver, frameId);
}
function cvlMainScript(ver) { return cvlClassify(ver.letters, true); }

/* Un élément est-il présent dans une version ? (dates sans année tolérées) */
function cvlFind(ver, key, kind) {
    if (ver.tokens[key]) { return ver.tokens[key]; }
    if (kind === "date") {
        var base = key.substring(5), k;
        for (k in ver.tokens) {
            if (ver.tokens.hasOwnProperty(k) && k.indexOf("date:") === 0) {
                var o = k.substring(5);
                if (o.length !== base.length && (o.indexOf(base) === 0 || base.indexOf(o) === 0)) { return ver.tokens[k]; }
            }
        }
    }
    return null;
}

/* Compare les versions d'un groupe / compare versions of a group */
function cvlCompareGroup(group, opts) {
    var issues = [], vs = group.versions, i, j, k, seen = {};
    for (i = 0; i < vs.length; i++) {
        for (k in vs[i].tokens) {
            if (!vs[i].tokens.hasOwnProperty(k) || seen[k]) { continue; }
            seen[k] = true;
            var t = vs[i].tokens[k], present = [], missing = [], counts = [], same = true, c0 = -1;
            for (j = 0; j < vs.length; j++) {
                var f = cvlFind(vs[j], k, t.kind);
                if (f) { present.push(j); counts.push(f.count); if (c0 < 0) { c0 = f.count; } else if (f.count !== c0) { same = false; } }
                else { missing.push(j); }
            }
            if (missing.length) {
                issues.push({ type: "missing", kind: t.kind, key: k, raw: t.raw, present: present, missing: missing, pair: null });
            } else if (opts.countOcc && !same) {
                issues.push({ type: "count", kind: t.kind, key: k, raw: t.raw, present: present, missing: [], counts: counts, pair: null });
            }
        }
    }
    /* mots latins dans le texte de droite à gauche / Latin names in RTL text */
    if (opts.words) {
        for (i = 0; i < vs.length; i++) {
            if (!cvlIsRTL(cvlMainScript(vs[i]))) { continue; }
            for (k in vs[i].rtlWords) {
                if (!vs[i].rtlWords.hasOwnProperty(k)) { continue; }
                var miss = [], pres = [i];
                for (j = 0; j < vs.length; j++) {
                    if (j === i) { continue; }
                    if (cvlMainScript(vs[j]) !== "latn") { continue; }
                    if (!vs[j].latinAll[k]) { miss.push(j); }
                }
                if (miss.length) { issues.push({ type: "word", kind: "mot", key: "mot:" + k, raw: vs[i].rtlWords[k].raw, present: pres, missing: miss, pair: null, occ: vs[i].rtlWords[k].occ }); }
            }
        }
    }
    cvlPairIssues(issues);
    return issues;
}

/* Rapproche les écarts probables (faute de frappe) / pair probable typos */
function cvlPairIssues(issues) {
    var i, j, a, b, best, bestD, d, ka, kb, lim;
    for (i = 0; i < issues.length; i++) {
        a = issues[i];
        if (a.type !== "missing" || a.pair !== null) { continue; }
        best = -1; bestD = 99;
        for (j = 0; j < issues.length; j++) {
            b = issues[j];
            if (j === i || b.type !== "missing" || b.pair !== null || b.kind !== a.kind) { continue; }
            if (!cvlSameSet(a.present, b.missing) || !cvlSameSet(a.missing, b.present)) { continue; }
            ka = a.key.substring(a.key.indexOf(":") + 1); kb = b.key.substring(b.key.indexOf(":") + 1);
            lim = Math.max(1, Math.floor(Math.max(ka.length, kb.length) / 4));
            d = cvlLev(ka, kb);
            if (d <= lim && d < bestD) { bestD = d; best = j; }
        }
        if (best >= 0) { a.pair = best; issues[best].pair = i; }
    }
}
function cvlSameSet(a, b) {
    if (a.length !== b.length) { return false; }
    for (var i = 0; i < a.length; i++) { if (!cvlInArray(b, a[i])) { return false; } }
    return true;
}

function cvlKindLabel(kind) {
    var fr = { num: "nombre", tel: "t\u00E9l\u00E9phone", date: "date", heure: "heure", web: "web", tag: "hashtag", code: "code", mot: "nom latin" };
    var en = { num: "number", tel: "phone", date: "date", heure: "time", web: "web", tag: "hashtag", code: "code", mot: "Latin name" };
    return (CVL.FR ? fr : en)[kind] || kind;
}

/* Texte lisible des écarts d'un groupe / readable lines */
function cvlDescribe(group, issues) {
    var lines = [], i, a, names, j, done = {};
    for (i = 0; i < issues.length; i++) {
        if (done[i]) { continue; }
        a = issues[i]; done[i] = true;
        names = function (idx) { var r = []; for (var q = 0; q < idx.length; q++) { r.push(group.versions[idx[q]].name); } return r.join(", "); };
        if (a.pair !== null && a.pair !== undefined && issues[a.pair]) {
            var b = issues[a.pair]; done[a.pair] = true;
            lines.push("  \u2260 " + cvlKindLabel(a.kind) + " : \u00AB " + a.raw + " \u00BB (" + names(a.present) + ") / \u00AB " + b.raw + " \u00BB (" + names(b.present) + ")" + L("  \u2190 faute de frappe probable", "  \u2190 probable typo"));
        } else if (a.type === "count") {
            var cs = []; for (j = 0; j < a.present.length; j++) { cs.push(group.versions[a.present[j]].name + " \u00D7" + a.counts[j]); }
            lines.push("  # " + cvlKindLabel(a.kind) + " \u00AB " + a.raw + " \u00BB " + L("nombre d'occurrences diff\u00E9rent : ", "different occurrence count: ") + cs.join(", "));
        } else {
            lines.push("  ! " + cvlKindLabel(a.kind) + " \u00AB " + a.raw + " \u00BB " + L("pr\u00E9sent dans ", "found in ") + names(a.present) + L(", absent de ", ", missing from ") + names(a.missing));
        }
    }
    return lines;
}

/* Liste « 1-3, 5 » -> [0,1,2,4] (indices) */
function cvlParseList(s, max) {
    var r = [], parts = String(s).split(/[,; ]+/), i, a, b, m, k;
    for (i = 0; i < parts.length; i++) {
        if (!parts[i].length) { continue; }
        m = /^(\d+)(?:-(\d+))?$/.exec(parts[i]);
        if (!m) { continue; }
        a = parseInt(m[1], 10); b = m[2] ? parseInt(m[2], 10) : a;
        if (b < a) { k = a; a = b; b = k; }
        for (k = a; k <= b; k++) { if (k >= 1 && k <= max && !cvlInArray(r, k - 1)) { r.push(k - 1); } }
    }
    return r;
}

/* ===================================================================== */
/*  2. Lecture du document Illustrator / reading the Illustrator document */
/* ===================================================================== */

function cvlTopLayer(item) {
    var p = item, lay = null, guard = 0;
    while (p && guard < 200) {
        guard++;
        if (p.typename === "Layer") { lay = p; }
        if (p.typename === "Document") { break; }
        try { p = p.parent; } catch (e) { break; }
    }
    return lay;
}
function cvlIsHidden(item) {
    var p = item, guard = 0;
    while (p && guard < 200) {
        guard++;
        try {
            if (p.typename === "Document") { return false; }
            if (p.typename === "Layer") { if (!p.visible) { return true; } }
            else if (p.hidden) { return true; }
            p = p.parent;
        } catch (e) { return false; }
    }
    return false;
}
function cvlHeadFrame(tf) {
    var p = tf, guard = 0;
    try { while (p.previousFrame && guard < 500) { p = p.previousFrame; guard++; } } catch (e) {}
    return p;
}
function cvlFrameText(tf) {
    var threaded = false;
    try { threaded = !!(tf.nextFrame || tf.previousFrame); } catch (e) {}
    if (threaded) { try { return String(tf.story.textRange.contents); } catch (e2) {} }
    try { return String(tf.contents); } catch (e3) { return ""; }
}
function cvlUnion(b, c) { if (!b) { return [c[0], c[1], c[2], c[3]]; } return [Math.min(b[0], c[0]), Math.max(b[1], c[1]), Math.max(b[2], c[2]), Math.min(b[3], c[3])]; }
function cvlChainBounds(head) {
    var b = null, p = head, guard = 0;
    while (p && guard < 500) { guard++; try { b = cvlUnion(b, p.geometricBounds); } catch (e) {} try { p = p.nextFrame; } catch (e2) { p = null; } }
    return b;
}

/* Rassemble les textes à lire / collect text frames
   Retour : [{ id, frame, text, bounds, layer, artboard }] */
function cvlCollectFrames(doc, opts) {
    var src = [], out = [], keys = {}, i, tf, head, key, b, lay;
    if (opts.selectionOnly) {
        var sel = doc.selection;
        if (sel && sel.length) { for (i = 0; i < sel.length; i++) { cvlCollectFromItem(sel[i], src); } }
    } else {
        for (i = 0; i < doc.textFrames.length; i++) { src.push(doc.textFrames[i]); }
    }
    for (i = 0; i < src.length; i++) {
        tf = src[i];
        head = cvlHeadFrame(tf);
        lay = cvlTopLayer(head);
        if (lay && lay.name === CVL.MARKER_LAYER) { continue; }
        if (opts.skipHidden && cvlIsHidden(head)) { continue; }
        b = cvlChainBounds(head);
        if (!b) { continue; }
        key = Math.round(b[0] * 10) + "_" + Math.round(b[1] * 10) + "_" + Math.round(b[2] * 10) + "_" + Math.round(b[3] * 10);
        var txt = cvlFrameText(head);
        key += "_" + txt.length + "_" + txt.substring(0, 20);
        if (keys[key]) { continue; }
        keys[key] = true;
        out.push({ id: out.length, frame: head, text: txt, bounds: b, layer: lay, artboard: cvlArtboardOf(doc, b) });
    }
    return out;
}
function cvlCollectFromItem(it, arr) {
    var i;
    try {
        if (it.typename === "TextFrame") { arr.push(it); return; }
        if (it.typename === "GroupItem" || it.typename === "Layer") { for (i = 0; i < it.pageItems.length; i++) { cvlCollectFromItem(it.pageItems[i], arr); } return; }
        if (it.typename === "TextRange" || it.typename === "InsertionPoint") { if (it.parent && it.parent.typename === "TextFrame") { arr.push(it.parent); } else { try { arr.push(it.story.textFrames[0]); } catch (e) {} } }
    } catch (e2) {}
}
function cvlArtboardOf(doc, b) {
    var cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, i, r, best = 0, bestD = 1e12, dx, dy, d;
    for (i = 0; i < doc.artboards.length; i++) {
        r = doc.artboards[i].artboardRect;
        if (cx >= r[0] && cx <= r[2] && cy <= r[1] && cy >= r[3]) { return i; }
        dx = cx < r[0] ? r[0] - cx : (cx > r[2] ? cx - r[2] : 0);
        dy = cy > r[1] ? cy - r[1] : (cy < r[3] ? r[3] - cy : 0);
        d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = i; }
    }
    return best;
}

/* Construit groupes et versions selon le mode / build groups & versions
   mode : "scriptAb" (écriture par plan), "scriptDoc" (écriture, document), "artboard", "layer" */
function cvlBuildGroups(doc, frames, opts) {
    var groups = [], gmap = {}, i, p, fr, gk, vk, g, v, paras, an, abName, abList = null;
    if (opts.abFilter && cvlTrim(opts.abFilter).length) { abList = cvlParseList(opts.abFilter, doc.artboards.length); }
    function abLabel(n) { var nm = ""; try { nm = doc.artboards[n].name; } catch (e) {} return L("Plan ", "Artboard ") + (n + 1) + (nm ? " \u00AB " + nm + " \u00BB" : ""); }
    function getGroup(key, name) { if (!gmap[key]) { gmap[key] = { name: name, versions: [], vmap: {}, shared: [] }; groups.push(gmap[key]); } return gmap[key]; }
    function getVersion(gr, key, name) { if (gr.vmap[key] === undefined) { gr.vmap[key] = gr.versions.length; gr.versions.push(cvlNewVersion(name)); } return gr.versions[gr.vmap[key]]; }

    for (i = 0; i < frames.length; i++) {
        fr = frames[i];
        if (abList && !cvlInArray(abList, fr.artboard)) { continue; }
        abName = abLabel(fr.artboard);
        paras = fr.text.split(/[\r\u2029]/);
        for (p = 0; p < paras.length; p++) {
            if (!cvlTrim(paras[p]).length) { continue; }
            an = cvlTokenize(paras[p], opts);
            if (opts.mode === "scriptAb" || opts.mode === "scriptDoc") {
                g = (opts.mode === "scriptAb") ? getGroup("ab" + fr.artboard, abName) : getGroup("doc", L("Document", "Document"));
                if (an.script === "neutral" || an.script === "mixed") { g.shared.push({ an: an, frame: fr.id }); continue; }
                v = getVersion(g, an.script, cvlScriptName(an.script));
                cvlAddParagraph(v, an, fr.id, true);
            } else if (opts.mode === "artboard") {
                g = getGroup("doc", L("Plans de travail", "Artboards"));
                v = getVersion(g, "ab" + fr.artboard, abName);
                cvlAddParagraph(v, an, fr.id, true);
            } else {
                gk = opts.perArtboard ? "ab" + fr.artboard : "doc";
                g = getGroup(gk, opts.perArtboard ? abName : L("Calques", "Layers"));
                vk = fr.layer ? fr.layer.name : "?";
                v = getVersion(g, "L" + vk, L("calque \u00AB ", "layer \u201C") + vk + L(" \u00BB", "\u201D"));
                cvlAddParagraph(v, an, fr.id, true);
            }
        }
    }
    /* paragraphes neutres ou mixtes : communs à toutes les versions du groupe / shared paragraphs */
    for (i = 0; i < groups.length; i++) {
        g = groups[i];
        for (p = 0; p < g.shared.length; p++) {
            for (var q = 0; q < g.versions.length; q++) {
                var sh = g.shared[p].an, t;
                for (t = 0; t < sh.tokens.length; t++) { cvlAddToken(g.versions[q], sh.tokens[t], g.shared[p].frame); }
                for (t = 0; t < sh.words.length; t++) { g.versions[q].latinAll[cvlFoldLatin(sh.words[t])] = true; }
            }
        }
    }
    return groups;
}

/* Analyse complète / full analysis */
function cvlAnalyse(doc, opts) {
    var frames = cvlCollectFrames(doc, opts), groups = cvlBuildGroups(doc, frames, opts), res = { frames: frames, groups: [], nIssues: 0, single: [] }, i, g, iss;
    for (i = 0; i < groups.length; i++) {
        g = groups[i];
        if (g.versions.length < 2) { res.single.push(g); continue; }
        iss = cvlCompareGroup(g, opts);
        res.groups.push({ group: g, issues: iss });
        res.nIssues += cvlCountReal(iss);
    }
    return res;
}
function cvlCountReal(iss) { var n = 0, i; for (i = 0; i < iss.length; i++) { if (iss[i].pair === null || iss[i].pair === undefined || iss[i].pair > i) { n++; } } return n; }

function cvlReportText(doc, res, opts) {
    var lines = [], i, j, g, d;
    lines.push("CoherenceLangues.jsx v" + CVL.VERSION + " \u2014 " + (doc ? doc.name : ""));
    lines.push(L("Textes lus : ", "Text frames read: ") + res.frames.length + L("   \u00C9carts : ", "   Differences: ") + res.nIssues);
    lines.push("");
    for (i = 0; i < res.groups.length; i++) {
        g = res.groups[i].group;
        var vn = []; for (j = 0; j < g.versions.length; j++) { vn.push(g.versions[j].name + " (" + g.versions[j].nTok + ")"); }
        lines.push("\u25A0 " + g.name + " \u2014 " + vn.join(" | "));
        d = cvlDescribe(g, res.groups[i].issues);
        if (!d.length) { lines.push(L("  \u2713 aucun \u00E9cart", "  \u2713 no difference")); }
        for (j = 0; j < d.length; j++) { lines.push(d[j]); }
        lines.push("");
    }
    for (i = 0; i < res.single.length; i++) {
        lines.push("\u25A1 " + res.single[i].name + L(" \u2014 une seule version trouv\u00E9e, rien \u00E0 comparer", " \u2014 only one version found, nothing to compare"));
    }
    return lines.join("\n");
}

/* ===================================================================== */
/*  3. Repères / markers                                                 */
/* ===================================================================== */

function cvlColor(doc, r, g, b, c, m, y, k) {
    var col;
    if (doc.documentColorSpace === DocumentColorSpace.CMYK) { col = new CMYKColor(); col.cyan = c; col.magenta = m; col.yellow = y; col.black = k; }
    else { col = new RGBColor(); col.red = r; col.green = g; col.blue = b; }
    return col;
}
function cvlRemoveMarkers(doc) {
    try { var l = doc.layers.getByName(CVL.MARKER_LAYER); l.locked = false; l.visible = true; l.remove(); return true; } catch (e) { return false; }
}
function cvlMarkerLayer(doc) {
    cvlRemoveMarkers(doc);
    var l = doc.layers.add();
    l.name = CVL.MARKER_LAYER;
    l.printable = false;
    try { l.zOrder(ZOrderMethod.BRINGTOFRONT); } catch (e) {}
    return l;
}
function cvlRect(layer, b, col, pad, dashed) {
    var r = layer.pathItems.rectangle(b[1] + pad, b[0] - pad, (b[2] - b[0]) + 2 * pad, (b[1] - b[3]) + 2 * pad);
    r.filled = false; r.stroked = true; r.strokeColor = col; r.strokeWidth = 1.2;
    if (dashed) { r.strokeDashes = [4, 2]; }
    return r;
}
function cvlLabel(layer, x, y, txt, col) {
    var t = layer.textFrames.add();
    t.contents = txt;
    try { t.textRange.characterAttributes.size = 7; t.textRange.characterAttributes.fillColor = col; } catch (e) {}
    t.position = [x, y + 9 * txt.split("\r").length];
    return t;
}

/* Pose les repères : orange = présent ici seulement, rouge pointillé = manque dans cette version */
function cvlDrawMarkers(doc, res) {
    var layer = cvlMarkerLayer(doc), orange = cvlColor(doc, 255, 120, 0, 0, 60, 100, 0), red = cvlColor(doc, 230, 0, 30, 0, 100, 90, 0);
    var frameNotes = {}, verNotes = [], i, j, q, g, iss, a, occ, n = 0, maxItems = 6;
    for (i = 0; i < res.groups.length; i++) {
        g = res.groups[i].group; iss = res.groups[i].issues;
        for (j = 0; j < iss.length; j++) {
            a = iss[j];
            for (q = 0; q < a.present.length; q++) {
                var ver = g.versions[a.present[q]], t = ver.tokens[a.key];
                occ = a.occ ? a.occ : (t ? t.occ : ver.frames);
                for (var o = 0; o < occ.length; o++) {
                    if (!frameNotes[occ[o]]) { frameNotes[occ[o]] = []; }
                    var tag = (a.type === "count") ? "# " + a.raw : "\u2260 " + a.raw;
                    if (!cvlInArray(frameNotes[occ[o]], tag)) { frameNotes[occ[o]].push(tag); }
                }
            }
            for (q = 0; q < a.missing.length; q++) {
                var key = i + "_" + a.missing[q];
                if (!verNotes[key]) { verNotes[key] = { g: g, v: g.versions[a.missing[q]], items: [] }; verNotes.push(key); }
                var mtxt = (a.pair !== null && a.pair !== undefined && iss[a.pair]) ? a.raw + " \u2192 " + iss[a.pair].raw : a.raw;
                if (!cvlInArray(verNotes[key].items, mtxt)) { verNotes[key].items.push(mtxt); }
            }
        }
    }
    for (var fid in frameNotes) {
        if (!frameNotes.hasOwnProperty(fid)) { continue; }
        var fr = res.frames[parseInt(fid, 10)], notes = frameNotes[fid];
        cvlRect(layer, fr.bounds, orange, 3, false);
        cvlLabel(layer, fr.bounds[0] - 3, fr.bounds[1] + 3, cvlShortList(notes, maxItems), orange);
        n++;
    }
    for (i = 0; i < verNotes.length; i++) {
        var vn = verNotes[verNotes[i]], vb = null;
        for (j = 0; j < vn.v.frames.length; j++) { vb = cvlUnion(vb, res.frames[vn.v.frames[j]].bounds); }
        if (!vb) { continue; }
        cvlRect(layer, vb, red, 7, true);
        cvlLabel(layer, vb[0] - 7, vb[3] - 7 - 9 * Math.min(vn.items.length + 1, maxItems + 2), L("Manque dans ", "Missing in ") + vn.v.name + " :\r" + cvlShortList(vn.items, maxItems), red);
        n++;
    }
    return n;
}
function cvlShortList(a, max) {
    var r = a.slice(0, max);
    if (a.length > max) { r.push("+" + (a.length - max)); }
    return r.join("\r");
}
function cvlSelectFrames(doc, res) {
    var ids = {}, list = [], i, j, q, g, a, ver, t;
    for (i = 0; i < res.groups.length; i++) {
        g = res.groups[i].group;
        for (j = 0; j < res.groups[i].issues.length; j++) {
            a = res.groups[i].issues[j];
            for (q = 0; q < a.present.length; q++) {
                ver = g.versions[a.present[q]]; t = ver.tokens[a.key];
                var occ = a.occ ? a.occ : (t ? t.occ : []);
                for (var o = 0; o < occ.length; o++) { ids[occ[o]] = true; }
            }
            for (q = 0; q < a.missing.length; q++) { ver = g.versions[a.missing[q]]; for (var f = 0; f < ver.frames.length; f++) { ids[ver.frames[f]] = true; } }
        }
    }
    for (var k in ids) { if (ids.hasOwnProperty(k)) { try { var fr = res.frames[parseInt(k, 10)].frame; if (!cvlIsHidden(fr) && !fr.locked) { list.push(fr); } } catch (e) {} } }
    try { doc.selection = null; doc.selection = list; } catch (e2) {}
    return list.length;
}
function cvlSaveReport(doc, text) {
    var f, base = "CoherenceLangues";
    try { base = doc.name.replace(/\.[^.]+$/, "") + "_coherence-langues"; } catch (e) {}
    var folder = Folder.desktop;
    try { if (doc.path && String(doc.path.fsName).length) { folder = doc.path; } } catch (e2) { folder = Folder.desktop; }
    f = new File(folder.fsName + "/" + base + ".txt");
    f.encoding = "UTF-8";
    f.lineFeed = ($.os.indexOf("Windows") >= 0) ? "Windows" : "Unix";
    if (!f.open("w")) { f = new File(Folder.desktop.fsName + "/" + base + ".txt"); f.encoding = "UTF-8"; if (!f.open("w")) { return null; } }
    f.write("\uFEFF" + text); f.close();
    return f;
}

/* ===================================================================== */
/*  4. Dialogue / dialog                                                 */
/* ===================================================================== */

function cvlDialog(doc) {
    var w = new Window("dialog", L("Coh\u00E9rence des versions linguistiques", "Language versions consistency") + " v" + CVL.VERSION);
    w.orientation = "column"; w.alignChildren = "fill";

    var pV = w.add("panel", undefined, L("Versions \u00E0 comparer", "Versions to compare"));
    pV.alignChildren = "left";
    var rA = pV.add("radiobutton", undefined, L("Par \u00E9criture (arabe, latin, tifinagh\u2026) sur chaque plan de travail", "By script (Arabic, Latin, Tifinagh\u2026) on each artboard"));
    var rD = pV.add("radiobutton", undefined, L("Par \u00E9criture dans tout le document", "By script across the whole document"));
    var rB = pV.add("radiobutton", undefined, L("Chaque plan de travail est une version", "Each artboard is a version"));
    var rC = pV.add("radiobutton", undefined, L("Chaque calque principal est une version", "Each top-level layer is a version"));
    var cPer = pV.add("checkbox", undefined, L("   \u2026 comparer les calques plan de travail par plan de travail", "   \u2026 compare layers artboard by artboard"));
    var gAb = pV.add("group"); gAb.add("statictext", undefined, L("Plans de travail (vide = tous, ex. 1-3, 5) :", "Artboards (empty = all, e.g. 1-3, 5):"));
    var eAb = gAb.add("edittext", undefined, ""); eAb.characters = 12;
    rA.value = true; cPer.value = true;

    var pS = w.add("panel", undefined, L("Port\u00E9e", "Scope"));
    pS.alignChildren = "left";
    var cSel = pS.add("checkbox", undefined, L("Textes s\u00E9lectionn\u00E9s seulement", "Selected text only"));
    var cHid = pS.add("checkbox", undefined, L("Ignorer les textes masqu\u00E9s (sinon les calques de langue masqu\u00E9s sont lus)", "Ignore hidden text (otherwise hidden language layers are read)"));
    try { cSel.value = doc.selection && doc.selection.length > 0; } catch (e) { cSel.value = false; }

    var pE = w.add("panel", undefined, L("\u00C9l\u00E9ments compar\u00E9s", "Compared items"));
    pE.orientation = "row"; pE.alignChildren = "top";
    var c1 = pE.add("group"); c1.orientation = "column"; c1.alignChildren = "left";
    var c2 = pE.add("group"); c2.orientation = "column"; c2.alignChildren = "left";
    var xNum = c1.add("checkbox", undefined, L("Nombres et prix", "Numbers and prices"));
    var gTel = c1.add("group"); var xTel = gTel.add("checkbox", undefined, L("T\u00E9l\u00E9phones, indicatif +", "Phones, country code +")); var eCC = gTel.add("edittext", undefined, "213"); eCC.characters = 4;
    var xDate = c1.add("checkbox", undefined, L("Dates et heures (mois FR / EN / AR reconnus)", "Dates and times (FR / EN / AR months)"));
    var xWeb = c1.add("checkbox", undefined, L("E-mails, sites web, @comptes", "E-mails, websites, @handles"));
    var xTag = c2.add("checkbox", undefined, L("#hashtags latins", "Latin #hashtags"));
    var xCode = c2.add("checkbox", undefined, L("Codes (A4, COVID-19, R\u00C9F-245)", "Codes (A4, COVID-19, REF-245)"));
    var xWord = c2.add("checkbox", undefined, L("Noms latins cit\u00E9s dans le texte arabe / h\u00E9breu", "Latin names quoted in Arabic / Hebrew text"));
    var xSmall = c2.add("checkbox", undefined, L("Ignorer les nombres d'un seul chiffre", "Ignore single-digit numbers"));
    var xCount = c2.add("checkbox", undefined, L("Comparer aussi le nombre d'occurrences", "Also compare occurrence counts"));
    xNum.value = xTel.value = xDate.value = xWeb.value = xTag.value = xCode.value = xWord.value = xSmall.value = true; xCount.value = false;

    var pR = w.add("panel", undefined, L("R\u00E9sultat", "Output"));
    pR.alignChildren = "left";
    var xMark = pR.add("checkbox", undefined, L("Rep\u00E8res sur un calque non imprimable (orange = seulement ici, rouge = manque)", "Markers on a non-printing layer (orange = only here, red = missing)"));
    var xSelO = pR.add("checkbox", undefined, L("S\u00E9lectionner les textes concern\u00E9s", "Select the frames involved"));
    var xRep = pR.add("checkbox", undefined, L("Enregistrer un rapport .txt", "Save a .txt report"));
    xMark.value = true; xSelO.value = true; xRep.value = false;

    w.add("statictext", undefined, L("Lecture seule : le texte n'est jamais modifi\u00E9. Conseil : travaillez sur une copie.", "Read-only: text is never changed. Tip: work on a copy."));

    var gB = w.add("group"); gB.alignment = "right";
    var bClear = gB.add("button", undefined, L("Effacer les rep\u00E8res", "Clear markers"));
    var bAn = gB.add("button", undefined, L("Analyser", "Analyse"));
    var bCancel = gB.add("button", undefined, L("Annuler", "Cancel"), { name: "cancel" });
    var bOk = gB.add("button", undefined, L("Contr\u00F4ler", "Check"), { name: "ok" });

    function refresh() { cPer.enabled = rC.value; }
    rA.onClick = rD.onClick = rB.onClick = rC.onClick = refresh; refresh();

    function readOpts() {
        return {
            mode: rA.value ? "scriptAb" : (rD.value ? "scriptDoc" : (rB.value ? "artboard" : "layer")),
            perArtboard: cPer.value, abFilter: eAb.text, selectionOnly: cSel.value, skipHidden: cHid.value,
            numbers: xNum.value, phones: xTel.value, cc: cvlTrim(eCC.text).replace(/[^0-9]/g, ""), dates: xDate.value, web: xWeb.value,
            hashtags: xTag.value, codes: xCode.value, words: xWord.value, ignoreSmall: xSmall.value, countOcc: xCount.value,
            markers: xMark.value, selectOut: xSelO.value, report: xRep.value
        };
    }
    var result = { action: "cancel", opts: null };
    bClear.onClick = function () { result.action = "clear"; w.close(2); };
    bAn.onClick = function () {
        var o = readOpts();
        if (o.selectionOnly && (!doc.selection || !doc.selection.length)) { alert(L("Rien n'est s\u00E9lectionn\u00E9.", "Nothing is selected.")); return; }
        var res = cvlAnalyse(doc, o);
        cvlShowText(L("Analyse (aucune modification)", "Analysis (no change)"), cvlReportText(doc, res, o));
    };
    bOk.onClick = function () { result.action = "run"; result.opts = readOpts(); w.close(1); };
    w.show();
    return result;
}
function cvlShowText(title, txt) {
    var w = new Window("dialog", title);
    var e = w.add("edittext", undefined, txt, { multiline: true, readonly: true, scrollable: true });
    e.preferredSize = [640, 380];
    w.add("button", undefined, "OK", { name: "ok" });
    w.show();
}

/* ===================================================================== */
/*  5. Programme principal / main                                        */
/* ===================================================================== */

function cvlMain() {
    if (app.documents.length === 0) { alert(L("Aucun document ouvert. Ouvrez un fichier puis relancez le script.", "No document open. Open a file and run the script again.")); return; }
    var doc = app.activeDocument;
    if (doc.textFrames.length === 0) { alert(L("Ce document ne contient aucun texte \u00E0 comparer (les textes vectoris\u00E9s ne sont pas lisibles).", "This document has no text to compare (outlined text cannot be read).")); return; }
    var r = cvlDialog(doc);
    if (r.action === "clear") { alert(cvlRemoveMarkers(doc) ? L("Rep\u00E8res effac\u00E9s.", "Markers cleared.") : L("Aucun rep\u00E8re \u00E0 effacer.", "No markers to clear.")); return; }
    if (r.action !== "run") { return; }
    var o = r.opts;
    if (o.selectionOnly && (!doc.selection || !doc.selection.length)) { alert(L("Rien n'est s\u00E9lectionn\u00E9.", "Nothing is selected.")); return; }
    var res = cvlAnalyse(doc, o), msg = [], nm = 0, ns = 0, rep = cvlReportText(doc, res, o), f;
    if (!res.groups.length) {
        alert(L("Une seule version trouv\u00E9e : rien \u00E0 comparer. Essayez un autre mode (par plan de travail ou par calque).", "Only one version found: nothing to compare. Try another mode (by artboard or by layer).")); return;
    }
    if (o.markers) { if (res.nIssues) { nm = cvlDrawMarkers(doc, res); } else { cvlRemoveMarkers(doc); } }
    if (o.selectOut && res.nIssues) { ns = cvlSelectFrames(doc, res); }
    if (o.report) { f = cvlSaveReport(doc, rep); }
    msg.push(res.nIssues ? L("\u00C9carts trouv\u00E9s : ", "Differences found: ") + res.nIssues : L("Aucun \u00E9cart : les versions contiennent les m\u00EAmes nombres, dates et coordonn\u00E9es.", "No difference: versions contain the same numbers, dates and contacts."));
    if (nm) { msg.push(L("Rep\u00E8res pos\u00E9s : ", "Markers placed: ") + nm + L(" (calque \u00AB ", " (layer \u201C") + CVL.MARKER_LAYER + L(" \u00BB)", "\u201D)")); }
    if (ns) { msg.push(L("Textes s\u00E9lectionn\u00E9s : ", "Frames selected: ") + ns); }
    if (f) { msg.push(L("Rapport : ", "Report: ") + f.fsName); }
    if (res.nIssues) { cvlShowText(L("Coh\u00E9rence des versions", "Versions consistency"), msg.join("\n") + "\n\n" + rep); } else { alert(msg.join("\n")); }
}

if (typeof CVL_NO_RUN === "undefined") {
    try { cvlMain(); } catch (err) { alert(L("Erreur : ", "Error: ") + err.message + (err.line ? " (ligne " + err.line + ")" : "")); }
}
