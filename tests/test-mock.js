// Tests sur un document Illustrator simulé / tests on a simulated Illustrator document
var n = 0, fail = 0;
function eq(a, b, msg) { n++; var A = JSON.stringify(a), B = JSON.stringify(b); if (A !== B) { fail++; console.log("ÉCHEC " + msg + "\n  obtenu  " + A + "\n  attendu " + B); } }
function ok(c, msg) { eq(!!c, true, msg); }

function Coll(arr) { arr = arr || []; arr.getByName = function (nm) { for (var i = 0; i < this.length; i++) if (this[i].name === nm) return this[i]; throw new Error("no " + nm); }; return arr; }
function makeDoc() {
  var doc = { typename: "Document", name: "affiche.ai", documentColorSpace: "CMYK", path: { fsName: "/tmp" }, selection: [], artboards: [], textFrames: Coll(), layers: Coll(), log: [] };
  doc.layers.add = function () {
    var l = { typename: "Layer", name: "", visible: true, locked: false, printable: true, parent: doc, items: [] };
    l.pathItems = { rectangle: function (t, lf, w, h) { var r = { typename: "PathItem", top: t, left: lf, width: w, height: h }; l.items.push(r); return r; } };
    l.textFrames = { add: function () { var t = { typename: "TextFrame", contents: "", textRange: { characterAttributes: {} } }; l.items.push(t); return t; } };
    l.remove = function () { var i = doc.layers.indexOf(l); if (i >= 0) doc.layers.splice(i, 1); };
    l.zOrder = function () {};
    doc.layers.push(l); return l;
  };
  return doc;
}
function layer(doc, name, visible) { var l = doc.layers.add(); l.name = name; l.visible = visible !== false; return l; }
function frame(doc, lay, text, b, extra) {
  var tf = { typename: "TextFrame", contents: text, geometricBounds: b, parent: lay, hidden: false, locked: false, nextFrame: null, previousFrame: null };
  if (extra) for (var k in extra) tf[k] = extra[k];
  doc.textFrames.push(tf); return tf;
}
var C = require("./load.js")({ DocumentColorSpace: { CMYK: "CMYK", RGB: "RGB" }, CMYKColor: function () {}, RGBColor: function () {}, ZOrderMethod: { BRINGTOFRONT: 1 } });
var BASE = { numbers: true, phones: true, dates: true, web: true, hashtags: true, codes: true, words: true, ignoreSmall: true, cc: "213", countOcc: false, perArtboard: true, abFilter: "", selectionOnly: false, skipHidden: false };
function opts(o) { var r = {}, k; for (k in BASE) r[k] = BASE[k]; for (k in o) r[k] = o[k]; return r; }

// --- Mode écriture par plan : affiche bilingue FR/AR sur deux plans ---
var d = makeDoc();
d.artboards = [{ name: "Recto", artboardRect: [0, 800, 600, 0] }, { name: "Verso", artboardRect: [700, 800, 1300, 0] }];
var L1 = layer(d, "Texte");
var fFR = frame(d, L1, "Grande promo\rPrix : 1 250 DA\rTél : 0555 12 34 56\rJusqu'au 31 octobre 2026", [20, 780, 280, 600]);
var fAR = frame(d, L1, "\u062A\u062E\u0641\u064A\u0636\u0627\u062A \u0643\u0628\u0631\u0649\r\u0627\u0644\u0633\u0639\u0631 : \u0661\u0663\u0665\u0660 \u062F\u062C\r\u0627\u0644\u0647\u0627\u062A\u0641 : \u0660\u0665\u0665\u0665 \u0661\u0662 \u0663\u0664 \u0665\u0666\r\u062D\u062A\u0649 31 \u0623\u0643\u062A\u0648\u0628\u0631 2026", [320, 780, 580, 600]);
var fShared = frame(d, L1, "www.exemple.dz", [20, 100, 580, 60]);
var fV1 = frame(d, L1, "Livraison 48h \u2014 contact@exemple.dz", [720, 780, 1000, 700]);
var fV2 = frame(d, L1, "\u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u062E\u0644\u0627\u0644 \u0664\u0668 \u0633\u0627\u0639\u0629 \u2014 contact@exemple.dz", [1020, 780, 1280, 700]);
var res = C.cvlAnalyse(d, opts({ mode: "scriptAb" }));
eq(res.frames.length, 5, "5 textes lus");
eq(res.groups.length, 2, "2 plans comparés");
eq(res.groups[0].group.versions.map(function (v) { return v.name; }), ["Latin", "Arabe"], "versions du recto");
eq(res.nIssues, 1, "1 écart (prix 1250/1350) au recto, verso cohérent");
var iss0 = res.groups[0].issues;
eq(iss0.length, 2, "écart apparié (2 entrées)");
eq(C.cvlCountReal(res.groups[1].issues), 0, "verso sans écart (48h = 48 ساعة)");
var rep = C.cvlReportText(d, res, opts({}));
ok(/1 250/.test(rep) && /1350/.test(rep) && /faute de frappe probable/.test(rep), "rapport mentionne 1250 / 1350");
ok(/aucun \u00E9cart/.test(rep), "rapport : verso sans écart");
var nm = C.cvlDrawMarkers(d, res);
var ml = d.layers.getByName(C.CVL.MARKER_LAYER);
eq(ml.printable, false, "calque de repères non imprimable");
eq(nm, 4, "4 repères (2 cadres orange + 2 versions rouges)");
eq(ml.items.filter(function (x) { return x.typename === "PathItem"; }).length, 4, "4 rectangles");
ok(ml.items.some(function (x) { return x.typename === "TextFrame" && /Manque dans Arabe/.test(x.contents) && /1 250 \u2192 1350/.test(x.contents); }), "étiquette « Manque dans Arabe : 1250 → 1350 »");
var ns = C.cvlSelectFrames(d, res);
eq(ns, 2, "2 textes sélectionnés");
eq(d.selection.indexOf(fFR) >= 0 && d.selection.indexOf(fAR) >= 0, true, "FR et AR sélectionnés");
// relance : l'ancien calque de repères est remplacé, ses étiquettes ne sont pas relues
d.textFrames.push({ typename: "TextFrame", contents: "Manque 9999", geometricBounds: [0, 10, 10, 0], parent: ml, hidden: false, locked: false });
var res2 = C.cvlAnalyse(d, opts({ mode: "scriptAb" }));
eq(res2.frames.length, 5, "étiquettes de repères ignorées");
C.cvlDrawMarkers(d, res2);
eq(d.layers.filter(function (l) { return l.name === C.CVL.MARKER_LAYER; }).length, 1, "un seul calque de repères");
eq(C.cvlRemoveMarkers(d), true, "Effacer les repères");
eq(C.cvlRemoveMarkers(d), false, "plus rien à effacer");
// filtre de plans
eq(C.cvlAnalyse(d, opts({ mode: "scriptAb", abFilter: "2" })).groups.length, 1, "filtre plan 2");
// sélection seulement
d.selection = [fV1, fV2];
var rs = C.cvlAnalyse(d, opts({ mode: "scriptAb", selectionOnly: true }));
eq(rs.frames.length, 2, "sélection : 2 textes");
// texte partagé neutre compté pour les deux versions
ok(res.groups[0].group.versions[1].tokens["web:exemple.dz"], "site neutre partagé avec l'arabe");

// --- Mode calques : une langue par calque, calque masqué lu ---
var d2 = makeDoc();
d2.artboards = [{ name: "", artboardRect: [0, 500, 500, 0] }];
var LF = layer(d2, "FR"), LA = layer(d2, "AR", false), LT = layer(d2, "TZ", false);
frame(d2, LF, "Ouvert de 9h00 à 17h30, le 16/10", [10, 490, 300, 400]);
frame(d2, LA, "\u0645\u0641\u062A\u0648\u062D \u0645\u0646 9:00 \u0625\u0644\u0649 17:30 \u060C 16 \u0623\u0643\u062A\u0648\u0628\u0631", [10, 490, 300, 400]);
frame(d2, LT, "\u2D30\u2D63\u2D53\u2D4D 9:00 - 17:00 16/10", [10, 490, 300, 400]);
var r2 = C.cvlAnalyse(d2, opts({ mode: "layer" }));
eq(r2.frames.length, 3, "calques masqués lus");
eq(r2.groups[0].group.versions.length, 3, "3 versions (FR, AR, TZ)");
eq(C.cvlCountReal(r2.groups[0].issues), 1, "un écart : 17:30 / 17:00 (TZ)");
var r2b = C.cvlAnalyse(d2, opts({ mode: "layer", skipHidden: true }));
eq(r2b.groups.length, 0, "masqués ignorés : une seule version");
eq(r2b.single.length, 1, "groupe à une seule version signalé");

// --- Mode plans de travail + textes chaînés ---
var d3 = makeDoc();
d3.artboards = [{ name: "FR", artboardRect: [0, 500, 500, 0] }, { name: "EN", artboardRect: [600, 500, 1100, 0] }];
var L3 = layer(d3, "Calque 1");
var head = frame(d3, L3, "Partie 1", [10, 490, 200, 300], { story: { textRange: { contents: "Offre valable jusqu'au 30/11/2026\rRéf. A4-220\rPrix 2 500,00 DA" } } });
var tail = frame(d3, L3, "Partie 2", [250, 490, 450, 300], { story: head.story });
head.nextFrame = tail; tail.previousFrame = head;
frame(d3, L3, "Offer valid until 11/30/2026\rRef. A4-220\rPrice DZD 2,500.00\rsee www.exemple.dz", [610, 490, 1000, 300]);
var r3 = C.cvlAnalyse(d3, opts({ mode: "artboard" }));
eq(r3.frames.length, 2, "texte chaîné lu une seule fois");
eq(r3.frames[0].bounds, [10, 490, 450, 300], "contour de la chaîne");
eq(r3.groups[0].issues.length, 1, "seul écart : site absent de FR (date US 11/30 reconnue, 2,500.00 = 2 500,00)");
eq(r3.groups[0].issues[0].key, "web:exemple.dz", "écart = site");
eq(r3.groups[0].issues[0].missing, [0], "manque dans le plan FR");

// --- Groupes et sélection imbriquée ---
var d4 = makeDoc(); d4.artboards = [{ name: "", artboardRect: [0, 100, 100, 0] }];
var L4 = layer(d4, "L");
var t1 = frame(d4, L4, "Tel 0555 11 22 33", [0, 90, 50, 80]);
var t2 = frame(d4, L4, "\u0647\u0627\u062A\u0641 0555 11 22 33", [50, 90, 100, 80]);
var grp = { typename: "GroupItem", pageItems: [t1, t2], parent: L4, hidden: false };
d4.selection = [grp];
var r4 = C.cvlAnalyse(d4, opts({ mode: "scriptDoc", selectionOnly: true }));
eq(r4.frames.length, 2, "textes trouvés dans un groupe sélectionné");
eq(r4.nIssues, 0, "aucun écart");

console.log((n - fail) + "/" + n + " tests OK");
process.exit(fail ? 1 : 0);
