// Page Catalogue POPOTE — générée entièrement depuis data/popote_catalogue_octobre_2026.json
(function () {
  "use strict";

  var WA_NUMBER = "24166980927";
  var PAIEMENT_NUMBER = "+241 74 12 82 48";
  var CATALOGUE_LABEL = "Catalogue Octobre 2026";
  var CAMPAGNE_LABEL = "Octobre 2026";
  var DATA_URL = "data/catalogue-produits.json";
  var STORAGE_KEY = "popote_ma_liste_octobre_2026";
  var ADHERENTE_KEY = "popote_adherente_info";
  var REF_STATE_KEY = "popote_proforma_ref_state";
  var COMMISSION_RATE = 0.10;
  var PANIER_MINIMUM = 50000;
  var ABONNEMENT_STANDARD = 3500;

  var FAMILY_SLUGS = {
    "Riz": "riz",
    "Conserves": "conserves",
    "Poissons": "poissons",
    "Volailles": "volailles",
    "Viandes": "viandes",
    "Produits d’épicerie": "epicerie",
    "Produits d’entretien": "entretien",
    "Épices et assaisonnements": "epices",
    "Féculents": "feculents"
  };

  function formatPrice(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function waLink(message) {
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message);
  }

  function productMessage(p) {
    var ref = p.reference || "Référence à attribuer";
    return "Bonjour POPOTE 👋\n" +
      "Je souhaite commander :\n" +
      "• " + p.nom + " — Réf. " + ref + "\n" +
      "• Conditionnement : " + p.conditionnement + "\n" +
      "• Option : Lot complet / Lot partagé\n" +
      "• Quantité : …\n" +
      "Merci !";
  }

  function listMessage(items, info, refInfo) {
    var totals = computeTotals(items);
    var lines = items.map(function (it, i) {
      var ref = it.reference || "Référence à attribuer";
      return (i + 1) + ". " + it.nom + " — Réf. " + ref + " — " + it.option + " — Qté : " + it.quantite;
    });
    var refLabel = refInfo.ref + (refInfo.version > 1 ? " (v" + refInfo.version + ")" : "");
    var budget = "Budget estimatif : " + formatPrice(totals.total) + " FCFA" +
      (totals.unpriced > 0 ? " (partiel)" : "");
    var lignesInfo = [
      "NOUVELLE PRÉCOMMANDE POPOTE",
      "Référence : " + refLabel,
      "Nom : " + info.nom,
      "Téléphone : " + info.tel,
      "Quartier : " + info.quartier
    ];
    if (info.adresse) lignesInfo.push("Adresse / repère : " + info.adresse);
    if (info.obs) lignesInfo.push("Observations : " + info.obs);
    return lignesInfo.join("\n") + "\n\n" +
      "Produits commandés :\n" + lines.join("\n") + "\n\n" +
      budget + "\n" +
      "Produits à confirmer : " + totals.unpriced + "\n" +
      "Statut : En attente de validation.";
  }

  function generalMessage() {
    return "Bonjour POPOTE 👋 J'ai consulté le catalogue d'octobre 2026 et je souhaite passer une précommande.";
  }

  function pad2(n) { return n < 10 ? "0" + n : String(n); }
  function padN(n, width) {
    var s = String(n);
    while (s.length < width) s = "0" + s;
    return s;
  }

  function lineAmount(it) {
    if (it.prix_gros_fcfa === null || it.prix_gros_fcfa === undefined) return null;
    return it.prix_gros_fcfa * it.quantite;
  }

  function computeTotals(items) {
    var subtotal = 0;
    var unpriced = 0;
    items.forEach(function (it) {
      var amt = lineAmount(it);
      if (amt === null) { unpriced += 1; } else { subtotal += amt; }
    });
    var commission = Math.ceil(subtotal * COMMISSION_RATE);
    var total = subtotal + commission;
    return { subtotal: subtotal, commission: commission, total: total, unpriced: unpriced };
  }

  // --- Validation du numéro de téléphone gabonais (avec ou sans +241) ---
  function validatePhoneGabon(raw) {
    var digits = (raw || "").replace(/\D/g, "");
    if (digits.indexOf("241") === 0 && digits.length > 8) digits = digits.slice(3);
    if (digits.charAt(0) === "0" && digits.length === 9) digits = digits.slice(1);
    return /^\d{8}$/.test(digits);
  }

  // --- Numérotation des proformas (POP-PRO-AAAAMM-NNNN), best-effort côté navigateur ---
  // Remarque technique : sans serveur, cette numérotation est séquentielle par appareil,
  // pas garantie unique entre adhérentes différentes (voir section 4 du cahier des charges).
  function currentYearMonth() {
    var now = new Date();
    return String(now.getFullYear()) + pad2(now.getMonth() + 1);
  }

  function listHash(list) {
    return list.map(function (it) {
      return (it.reference || it.nom) + ":" + it.option + ":" + it.quantite;
    }).join("|");
  }

  function loadRefState() {
    if (!storageAvailable) return null;
    try {
      var raw = window.localStorage.getItem(REF_STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveRefState(state) {
    if (!storageAvailable) return;
    try {
      if (state === null) {
        window.localStorage.removeItem(REF_STATE_KEY);
      } else {
        window.localStorage.setItem(REF_STATE_KEY, JSON.stringify(state));
      }
    } catch (e) { /* ignore */ }
  }

  function getOrCreateProformaRef() {
    var ym = currentYearMonth();
    var hash = listHash(maListe);
    var state = loadRefState();

    if (state && state.yearMonth === ym && state.listHash === hash) {
      return { ref: state.ref, version: state.version };
    }
    if (state && state.yearMonth === ym && state.ref) {
      state.version += 1;
      state.listHash = hash;
      saveRefState(state);
      return { ref: state.ref, version: state.version };
    }

    var counterKey = "popote_ref_counter_" + ym;
    var counter = 1;
    try {
      var rawCounter = window.localStorage.getItem(counterKey);
      counter = rawCounter ? parseInt(rawCounter, 10) + 1 : 1;
    } catch (e) { /* ignore */ }
    try { window.localStorage.setItem(counterKey, String(counter)); } catch (e) { /* ignore */ }

    var ref = "POP-PRO-" + ym + "-" + padN(counter, 4);
    saveRefState({ yearMonth: ym, ref: ref, version: 1, listHash: hash });
    return { ref: ref, version: 1 };
  }

  function generateProformaPDF() {
    if (!maListe.length) return;
    if (!adherenteInfo || !adherenteInfo.nom || !adherenteInfo.tel || !adherenteInfo.quartier) return;
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("Le générateur de PDF n'a pas pu se charger. Réessayez ou contactez-nous sur WhatsApp.");
      return;
    }
    var jsPDFlib = window.jspdf.jsPDF;
    var doc = new jsPDFlib({ unit: "mm", format: "a4" });
    var pageWidth = doc.internal.pageSize.getWidth();
    var pageHeight = doc.internal.pageSize.getHeight();
    var margin = 15;
    var refInfo = getOrCreateProformaRef();
    var refLabel = refInfo.ref + (refInfo.version > 1 ? " — Version " + refInfo.version : "");
    var totals = computeTotals(maListe);

    function header() {
      doc.setFillColor(9, 128, 44);
      doc.rect(0, 0, pageWidth, 32, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.text("POPOTE LIBREVILLE", margin, 11);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("Ensemble achetons mieux !", margin, 17);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("PROFORMA DE PRÉCOMMANDE", margin, 26);
    }

    header();
    var y = 42;
    doc.setTextColor(19, 34, 26);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Référence : " + refLabel, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text("Date : " + new Date().toLocaleDateString("fr-FR"), pageWidth - margin, y, { align: "right" });
    y += 6;
    doc.text("Campagne : " + CAMPAGNE_LABEL, margin, y);
    doc.text("Statut : Estimation — en attente de validation.", pageWidth - margin, y, { align: "right" });
    y += 10;

    // Identification de l'adhérente
    doc.setFillColor(234, 244, 236);
    var idBoxLines = 3 + (adherenteInfo.adresse ? 1 : 0);
    var idBoxH = idBoxLines * 5.5 + 6;
    doc.roundedRect(margin, y, pageWidth - margin * 2, idBoxH, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(6, 83, 29);
    doc.text("IDENTIFICATION DE L'ADHÉRENTE", margin + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(19, 34, 26);
    var idY = y + 12;
    doc.text("Nom et prénom : " + adherenteInfo.nom, margin + 4, idY);
    idY += 5.5;
    doc.text("Téléphone / WhatsApp : " + adherenteInfo.tel, margin + 4, idY);
    idY += 5.5;
    doc.text("Quartier : " + adherenteInfo.quartier, margin + 4, idY);
    if (adherenteInfo.adresse) {
      idY += 5.5;
      doc.text("Adresse / repère : " + adherenteInfo.adresse, margin + 4, idY);
    }
    y += idBoxH + 8;

    // Colonnes du tableau
    var colRef = margin;
    var colProduit = margin + 20;
    var colMode = margin + 84;
    var colQte = margin + 108;
    var colPu = margin + 140;
    var colTotal = pageWidth - margin;
    var produitWidth = colMode - colProduit - 3;
    var modeWidth = colQte - colMode - 2;

    function tableHeader() {
      doc.setFillColor(234, 244, 236);
      doc.rect(margin, y - 5, pageWidth - margin * 2, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(6, 83, 29);
      doc.text("RÉF.", colRef + 1, y);
      doc.text("PRODUIT", colProduit, y);
      doc.text("MODE", colMode, y);
      doc.text("QTÉ", colQte, y, { align: "right" });
      doc.text("PRIX EST.", colPu, y, { align: "right" });
      doc.text("SOUS-TOTAL", colTotal, y, { align: "right" });
      y += 7;
      doc.setTextColor(19, 34, 26);
    }

    tableHeader();

    var hasFromPrice = false;

    maListe.forEach(function (it, idx) {
      var refTxt = it.reference || "À attribuer";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      var nomLines = doc.splitTextToSize(it.nom, produitWidth);
      doc.setFontSize(7);
      var condLines = doc.splitTextToSize(it.conditionnement, produitWidth);
      var modeLines = doc.splitTextToSize(it.option, modeWidth);
      var rowH = Math.max(10, nomLines.length * 4 + condLines.length * 3.3 + 3, modeLines.length * 3.3 + 6);

      if (y + rowH > pageHeight - 45) {
        doc.addPage();
        y = 20;
        tableHeader();
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 248);
        doc.rect(margin, y - 5, pageWidth - margin * 2, rowH, "F");
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(90, 100, 94);
      doc.text(refTxt, colRef + 1, y);

      doc.setFontSize(8.5);
      doc.setTextColor(19, 34, 26);
      doc.text(nomLines, colProduit, y);
      doc.setFontSize(7);
      doc.setTextColor(90, 100, 94);
      doc.text(condLines, colProduit, y + nomLines.length * 4);

      doc.setFontSize(7.5);
      doc.setTextColor(19, 34, 26);
      doc.text(modeLines, colMode, y);

      doc.setFontSize(8.5);
      doc.text(String(it.quantite), colQte, y, { align: "right" });

      var amount = lineAmount(it);
      if (amount === null) {
        doc.text("Sur demande", colPu, y, { align: "right" });
        doc.text("—", colTotal, y, { align: "right" });
      } else {
        var prefix = it.prix_a_partir_de ? "~" : "";
        if (it.prix_a_partir_de) hasFromPrice = true;
        doc.text(prefix + formatPrice(it.prix_gros_fcfa) + " F", colPu, y, { align: "right" });
        doc.text(prefix + formatPrice(amount) + " F", colTotal, y, { align: "right" });
      }

      y += rowH;
    });

    // Récapitulatif financier
    y += 2;
    doc.setDrawColor(219, 230, 222);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    var totalLabel = totals.unpriced > 0 ? "Total partiel estimatif" : "Total estimatif";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(19, 34, 26);
    doc.text("Sous-total produits (prix de gros)", colPu, y, { align: "right" });
    doc.text(formatPrice(totals.subtotal) + " FCFA", colTotal, y, { align: "right" });
    y += 6;
    doc.text("Commission POPOTE (10%)", colPu, y, { align: "right" });
    doc.text(formatPrice(totals.commission) + " FCFA", colTotal, y, { align: "right" });
    y += 6;
    if (totals.unpriced > 0) {
      doc.text("Références à confirmer", colPu, y, { align: "right" });
      doc.text(String(totals.unpriced), colTotal, y, { align: "right" });
      y += 6;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(6, 83, 29);
    doc.text(totalLabel, colPu, y, { align: "right" });
    doc.text(formatPrice(totals.total) + " FCFA", colTotal, y, { align: "right" });
    y += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(19, 34, 26);
    doc.text("Panier minimum : " + formatPrice(PANIER_MINIMUM) + " FCFA", margin, y);
    y += 5;
    doc.text("Abonnement POPOTE : " + formatPrice(ABONNEMENT_STANDARD) + " FCFA (statut non renseigné — distinct du panier)", margin, y);
    y += 10;

    // Mentions obligatoires
    var warnLines = [
      "Cette proforma constitue une estimation budgétaire. Elle ne représente ni une facture définitive ni une demande de paiement. " +
      "Les prix définitifs seront communiqués après consolidation des commandes et validation des conditions fournisseurs.",
      "Aucun paiement n'est exigé sur la base de cette estimation."
    ];
    if (hasFromPrice) warnLines.push("Le symbole ~ signifie « à partir de ».");
    if (totals.unpriced > 0) warnLines.push("Certains produits sont au prix sur demande et ne sont pas inclus dans le total ci-dessus.");

    var warnTextWidth = pageWidth - margin * 2 - 10;
    var warnWrapped = [];
    warnLines.forEach(function (l) {
      warnWrapped = warnWrapped.concat(doc.splitTextToSize("• " + l, warnTextWidth));
    });
    var warnH = warnWrapped.length * 4.2 + 8;
    if (y + warnH > pageHeight - 30) { doc.addPage(); y = 20; }
    doc.setFillColor(255, 199, 39);
    doc.roundedRect(margin, y, pageWidth - margin * 2, warnH, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.3);
    doc.setTextColor(19, 34, 26);
    doc.text(warnWrapped, margin + 5, y + 6);
    y += warnH + 10;

    // Pied de page
    if (y > pageHeight - 24) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(6, 83, 29);
    doc.text("POPOTE LIBREVILLE", margin, pageHeight - 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 100, 94);
    doc.text("Paiement : " + PAIEMENT_NUMBER, margin, pageHeight - 15);
    doc.text("Assistance : +241 66 98 09 27", margin, pageHeight - 10);
    doc.setFont("helvetica", "italic");
    doc.text("Ensemble achetons mieux !", margin, pageHeight - 5);

    doc.save(refInfo.ref + ".pdf");
  }

  // --- Ma liste (localStorage) ---
  var storageAvailable = (function () {
    try {
      var k = "__popote_test__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  })();

  function loadList() {
    if (!storageAvailable) return [];
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveList(list) {
    if (!storageAvailable) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  }

  var maListe = loadList();

  // --- Identification de l'adhérente (localStorage, jamais transmise à un serveur) ---
  function loadAdherente() {
    if (!storageAvailable) return null;
    try {
      var raw = window.localStorage.getItem(ADHERENTE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function saveAdherente(info) {
    if (!storageAvailable) return;
    try { window.localStorage.setItem(ADHERENTE_KEY, JSON.stringify(info)); } catch (e) { /* ignore */ }
  }
  var adherenteInfo = loadAdherente();

  function findInList(reference, nom) {
    var key = reference || nom;
    return maListe.find(function (it) { return (it.reference || it.nom) === key; });
  }

  function addToList(p) {
    var existing = findInList(p.reference, p.nom);
    if (existing) {
      existing.quantite += 1;
    } else {
      maListe.push({
        reference: p.reference,
        nom: p.nom,
        conditionnement: p.conditionnement,
        unite_prix: p.unite_prix,
        prix_gros_fcfa: p.prix_gros_fcfa,
        prix_a_partir_de: !!p.prix_a_partir_de,
        option: "Lot complet",
        quantite: 1
      });
    }
    saveList(maListe);
    renderListUI();
  }

  function removeFromList(index) {
    maListe.splice(index, 1);
    saveList(maListe);
    if (!maListe.length) saveRefState(null);
    renderListUI();
  }

  function updateListItem(index, field, value) {
    maListe[index][field] = value;
    saveList(maListe);
    renderListUI();
  }

  // ---- Ma liste UI (éléments statiques, présents dès le chargement du script) ----
  var floatBtn = document.getElementById("cat-list-floatbtn");
  var panel = document.getElementById("cat-list-panel");
  var overlay = document.getElementById("cat-list-overlay");
  var itemsRoot = document.getElementById("cat-list-items");
  var closeBtn = document.getElementById("cat-list-closebtn");
  var sendBtn = document.getElementById("cat-list-sendbtn");
  var pdfBtn = document.getElementById("cat-list-pdfbtn");

  function renderListUI() {
    if (!floatBtn) return;
    var count = maListe.reduce(function (sum, it) { return sum + it.quantite; }, 0);
    if (maListe.length) {
      floatBtn.classList.add("visible");
      floatBtn.textContent = "🛒 Ma liste (" + count + ")";
    } else {
      floatBtn.classList.remove("visible");
    }

    if (!maListe.length) {
      itemsRoot.innerHTML = '<p class="cat-list-empty">Votre liste est vide. Ajoutez des produits depuis le catalogue.</p>';
    } else {
      itemsRoot.innerHTML = maListe.map(function (it, i) {
        return '' +
          '<div class="cat-list-item">' +
            '<div class="cat-list-item-head">' +
              '<strong>' + it.nom + "</strong>" +
              '<button type="button" class="cat-list-remove" data-i="' + i + '">Retirer</button>' +
            "</div>" +
            '<div class="cat-list-options">' +
              '<label><input type="radio" name="opt-' + i + '" value="Lot complet" ' + (it.option === "Lot complet" ? "checked" : "") + '> Lot complet</label>' +
              '<label><input type="radio" name="opt-' + i + '" value="Lot partagé" ' + (it.option === "Lot partagé" ? "checked" : "") + '> Lot partagé</label>' +
              '<label>Qté <input type="number" min="1" class="cat-list-qty" value="' + it.quantite + '" data-i="' + i + '"></label>' +
            "</div>" +
          "</div>";
      }).join("");
    }
  }

  if (itemsRoot) {
    itemsRoot.addEventListener("click", function (e) {
      var rm = e.target.closest(".cat-list-remove");
      if (rm) removeFromList(parseInt(rm.getAttribute("data-i"), 10));
    });
    itemsRoot.addEventListener("change", function (e) {
      var i = e.target.getAttribute("data-i");
      if (e.target.type === "radio") {
        updateListItem(parseInt(e.target.name.replace("opt-", ""), 10), "option", e.target.value);
      } else if (e.target.classList.contains("cat-list-qty")) {
        var v = Math.max(1, parseInt(e.target.value, 10) || 1);
        updateListItem(parseInt(i, 10), "quantite", v);
      }
    });
  }

  function openPanel() {
    panel.classList.add("open");
    overlay.classList.add("open");
  }
  function closePanel() {
    panel.classList.remove("open");
    overlay.classList.remove("open");
  }

  if (floatBtn) floatBtn.addEventListener("click", openPanel);
  if (closeBtn) closeBtn.addEventListener("click", closePanel);
  if (overlay) overlay.addEventListener("click", closePanel);

  // ---- Identification de l'adhérente (avant proforma PDF ou envoi WhatsApp) ----
  var idOverlay = document.getElementById("cat-id-overlay");
  var idPanel = document.getElementById("cat-id-panel");
  var idCloseBtn = document.getElementById("cat-id-closebtn");
  var idForm = document.getElementById("cat-id-form");
  var idError = document.getElementById("cat-id-error");
  var idNom = document.getElementById("cat-id-nom");
  var idTel = document.getElementById("cat-id-tel");
  var idQuartier = document.getElementById("cat-id-quartier");
  var idAdresse = document.getElementById("cat-id-adresse");
  var idEmail = document.getElementById("cat-id-email");
  var idObs = document.getElementById("cat-id-obs");
  var idConsent = document.getElementById("cat-id-consent");
  var pendingAction = null;

  function hasValidIdentification() {
    return !!(adherenteInfo && adherenteInfo.nom && adherenteInfo.tel && adherenteInfo.quartier);
  }

  function openIdPanel(action) {
    pendingAction = action;
    if (adherenteInfo) {
      idNom.value = adherenteInfo.nom || "";
      idTel.value = adherenteInfo.tel || "";
      idQuartier.value = adherenteInfo.quartier || "";
      idAdresse.value = adherenteInfo.adresse || "";
      idEmail.value = adherenteInfo.email || "";
      idObs.value = adherenteInfo.obs || "";
      idConsent.checked = !!adherenteInfo.consent;
    }
    idError.hidden = true;
    closePanel();
    idPanel.classList.add("open");
    idOverlay.classList.add("open");
  }
  function closeIdPanel() {
    idPanel.classList.remove("open");
    idOverlay.classList.remove("open");
    pendingAction = null;
  }
  if (idCloseBtn) idCloseBtn.addEventListener("click", closeIdPanel);
  if (idOverlay) idOverlay.addEventListener("click", closeIdPanel);

  function sendListWhatsApp() {
    var refInfo = getOrCreateProformaRef();
    var msg = listMessage(maListe, adherenteInfo, refInfo);
    window.open(waLink(msg), "_blank", "noopener");
  }

  if (idForm) {
    idForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var nom = idNom.value.trim();
      var tel = idTel.value.trim();
      var quartier = idQuartier.value.trim();

      if (!nom || !tel || !quartier) {
        idError.textContent = "Merci de renseigner votre nom, votre téléphone et votre quartier.";
        idError.hidden = false;
        return;
      }
      if (!validatePhoneGabon(tel)) {
        idError.textContent = "Ce numéro ne semble pas valide. Utilisez un numéro gabonais, avec ou sans +241.";
        idError.hidden = false;
        return;
      }
      if (!idConsent.checked) {
        idError.textContent = "Merci de cocher la case de consentement pour continuer.";
        idError.hidden = false;
        return;
      }

      adherenteInfo = {
        nom: nom,
        tel: tel,
        quartier: quartier,
        adresse: idAdresse.value.trim(),
        email: idEmail.value.trim(),
        obs: idObs.value.trim(),
        consent: true
      };
      saveAdherente(adherenteInfo);
      idError.hidden = true;

      var action = pendingAction;
      closeIdPanel();
      if (action === "pdf") generateProformaPDF();
      else if (action === "whatsapp") sendListWhatsApp();
    });
  }

  if (pdfBtn) {
    pdfBtn.addEventListener("click", function () {
      if (!maListe.length) return;
      if (hasValidIdentification()) generateProformaPDF();
      else openIdPanel("pdf");
    });
  }
  if (sendBtn) {
    sendBtn.addEventListener("click", function () {
      if (!maListe.length) return;
      if (hasValidIdentification()) sendListWhatsApp();
      else openIdPanel("whatsapp");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.getElementById("cat-products-root");
    var tabsRoot = document.getElementById("cat-tabs-root");
    var countRoot = document.getElementById("cat-count-root");
    var searchInput = document.getElementById("cat-search-input");

    if (!grid) return;

    if (window.__POPOTE_CATALOGUE_DATA__) {
      init(window.__POPOTE_CATALOGUE_DATA__);
    } else {
      fetch(DATA_URL)
        .then(function (res) { return res.json(); })
        .then(function (products) {
          init(products);
        })
        .catch(function () {
          grid.innerHTML = '<p class="cat-empty">Le catalogue est momentanément indisponible. Contactez-nous sur WhatsApp pour le consulter.</p>';
        });
    }

    function init(products) {
      products.sort(function (a, b) { return a.ordre_famille - b.ordre_famille; });

      var families = [];
      products.forEach(function (p) {
        if (families.indexOf(p.famille) === -1) families.push(p.famille);
      });

      renderTabs(families);
      renderGrid(products, families);
      renderListUI();

      searchInput.addEventListener("input", function () {
        renderGrid(products, families, searchInput.value.trim().toLowerCase());
      });
    }

    var suspendSpy = false;
    var suspendSpyTimer = null;
    var spyTicking = false;

    function stickyOffset() {
      var header = document.querySelector(".site-header");
      var filterbar = document.querySelector(".cat-filterbar");
      var h = header ? header.getBoundingClientRect().height : 0;
      var f = filterbar ? filterbar.getBoundingClientRect().height : 0;
      return h + f + 14;
    }

    function setActiveTab(slug) {
      tabsRoot.querySelectorAll(".cat-tab").forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("data-slug") === slug);
      });
      var activeLink = tabsRoot.querySelector('.cat-tab[data-slug="' + slug + '"]');
      if (activeLink && activeLink.scrollIntoView) {
        activeLink.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }

    function scrollToSection(slug) {
      var target = document.getElementById(slug);
      if (!target) return;
      var top = target.getBoundingClientRect().top + window.pageYOffset - stickyOffset();
      window.scrollTo({ top: top, behavior: "smooth" });
    }

    function updateActiveFromScroll() {
      if (suspendSpy) return;
      var line = stickyOffset() + 1;
      var sections = document.querySelectorAll(".cat-family-section");
      var current = null;
      sections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= line) current = section;
      });
      if (!current) current = sections[0];
      if (current) setActiveTabQuiet(current.id);
    }

    function setActiveTabQuiet(slug) {
      tabsRoot.querySelectorAll(".cat-tab").forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("data-slug") === slug);
      });
    }

    function onScroll() {
      if (spyTicking) return;
      spyTicking = true;
      window.requestAnimationFrame(function () {
        updateActiveFromScroll();
        spyTicking = false;
      });
    }

    function renderTabs(families) {
      var html = families.map(function (f) {
        var slug = FAMILY_SLUGS[f] || f.toLowerCase();
        return '<a href="#' + slug + '" class="cat-tab" data-slug="' + slug + '">' + f + "</a>";
      }).join("");
      tabsRoot.innerHTML = html;

      tabsRoot.addEventListener("click", function (e) {
        var link = e.target.closest(".cat-tab");
        if (!link) return;
        e.preventDefault();
        var slug = link.getAttribute("data-slug");
        setActiveTab(slug);
        scrollToSection(slug);
        if (history.replaceState) history.replaceState(null, "", "#" + slug);
        suspendSpy = true;
        window.clearTimeout(suspendSpyTimer);
        suspendSpyTimer = window.setTimeout(function () {
          suspendSpy = false;
          setActiveTabQuiet(slug);
        }, 1500);
      });

      window.addEventListener("scrollend", function () {
        if (!suspendSpy) return;
        suspendSpy = false;
        window.clearTimeout(suspendSpyTimer);
        updateActiveFromScroll();
      });

      window.addEventListener("scroll", onScroll, { passive: true });
    }

    function norm(s) {
      return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    }

    function renderGrid(products, families, query) {
      var filtered = query
        ? products.filter(function (p) {
            return norm(p.nom).indexOf(norm(query)) !== -1 ||
                   norm(p.reference).indexOf(norm(query)) !== -1;
          })
        : products;

      countRoot.textContent = filtered.length + (filtered.length > 1 ? " produits" : " produit");

      if (!filtered.length) {
        grid.innerHTML = '<p class="cat-empty">Aucun produit ne correspond à votre recherche. Essayez un autre mot-clé ou contactez-nous directement sur WhatsApp.</p>';
        return;
      }

      var html = "";
      families.forEach(function (fam, famIndex) {
        var famProducts = filtered.filter(function (p) { return p.famille === fam; });
        if (!famProducts.length) return;
        var slug = FAMILY_SLUGS[fam] || fam.toLowerCase();
        html += '<section class="cat-family-section" id="' + slug + '">';
        html += '<div class="cat-family-title"><span class="num">' + (famIndex + 1) + '</span><h2>' + fam + "</h2></div>";
        html += '<div class="cat-grid">';
        famProducts.forEach(function (p) { html += productCard(p); });
        html += "</div></section>";
      });
      grid.innerHTML = html;
      updateActiveFromScroll();

      grid.querySelectorAll(".cat-btn-add").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var ref = btn.getAttribute("data-ref");
          var nom = btn.getAttribute("data-nom");
          var product = products.find(function (p) { return (p.reference || p.nom) === (ref || nom); });
          if (product) {
            addToList(product);
            btn.classList.add("added");
            btn.textContent = "✓ Ajouté";
            setTimeout(function () {
              btn.classList.remove("added");
              btn.textContent = "+ Ajouter à ma liste";
            }, 1400);
          }
        });
      });
    }

    function priceBox(p) {
      var unit = p.unite_prix || "";
      if (p.prix_gros_fcfa === null || p.prix_gros_fcfa === undefined) {
        return '<div class="cat-price-box"><span class="cat-price-label">PRIX DE GROS</span>' +
          '<div class="cat-price-amount">Prix sur demande</div></div>';
      }
      var amount = formatPrice(p.prix_gros_fcfa) + " FCFA";
      var prefix = p.prix_a_partir_de ? "À partir de " : "";
      var unitLine = unit ? '<div class="cat-price-unit">/ ' + unit + "</div>" : "";
      return '<div class="cat-price-box"><span class="cat-price-label">PRIX DE GROS</span>' +
        '<div class="cat-price-amount">' + prefix + amount + '</div>' +
        unitLine + "</div>";
    }

    function productCard(p) {
      var ref = p.reference || "Référence à attribuer";
      var badge = p.badge_format ? '<span class="cat-badge-format">' + p.badge_format + "</span>" : "";
      var illustratif = p.visuel_illustratif ? '<p class="cat-illustratif">Visuel illustratif</p>' : "";
      return '' +
        '<article class="cat-card">' +
          '<div class="cat-card-banner">' + p.nom.toUpperCase() + "</div>" +
          '<div class="cat-card-photo">' +
            '<img src="' + p.image + '" alt="' + p.nom.replace(/"/g, "&quot;") + '" loading="lazy">' +
            badge +
          "</div>" +
          illustratif +
          '<div class="cat-card-body">' +
            '<span class="cat-ref">Réf. ' + ref + "</span>" +
            '<span class="cat-cond">' + p.conditionnement + "</span>" +
            priceBox(p) +
            '<div class="cat-card-actions">' +
              '<a class="cat-btn-order" href="' + waLink(productMessage(p)) + '" target="_blank" rel="noopener" aria-label="Commander ' + p.nom.replace(/"/g, "&quot;") + ' sur WhatsApp">' +
                '<img src="assets/img/whatsapp-icon.png" alt="" aria-hidden="true"> Commander sur WhatsApp</a>' +
              '<button type="button" class="cat-btn-add" data-ref="' + (p.reference || "") + '" data-nom="' + p.nom.replace(/"/g, "&quot;") + '">+ Ajouter à ma liste</button>' +
            "</div>" +
          "</div>" +
        "</article>";
    }

    // Liens WhatsApp "généraux" (hero + bandeau contacts)
    document.querySelectorAll("[data-wa-general]").forEach(function (a) {
      a.href = waLink(generalMessage());
    });
  });
})();
