// Page Catalogue POPOTE — générée entièrement depuis data/popote_catalogue_octobre_2026.json
(function () {
  "use strict";

  var WA_NUMBER = "24166980927";
  var CATALOGUE_LABEL = "Catalogue Octobre 2026";
  var DATA_URL = "data/catalogue-produits.json";
  var STORAGE_KEY = "popote_ma_liste_octobre_2026";

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

  function listMessage(items) {
    var lines = items.map(function (it, i) {
      var ref = it.reference || "Référence à attribuer";
      return (i + 1) + ". " + it.nom + " — Réf. " + ref + " — " + it.option + " — Qté : " + it.quantite;
    });
    return "Bonjour POPOTE 👋\n" +
      "Voici ma liste de précommande (" + CATALOGUE_LABEL + ") :\n" +
      lines.join("\n") + "\n" +
      "Merci de me confirmer le montant de mon panier.";
  }

  function generalMessage() {
    return "Bonjour POPOTE 👋 J'ai consulté le catalogue d'octobre 2026 et je souhaite passer une précommande.";
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

    if (sendBtn) {
      sendBtn.href = waLink(listMessage(maListe));
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

    function renderTabs(families) {
      var html = families.map(function (f) {
        var slug = FAMILY_SLUGS[f] || f.toLowerCase();
        return '<a href="#' + slug + '" class="cat-tab" data-slug="' + slug + '">' + f + "</a>";
      }).join("");
      tabsRoot.innerHTML = html;

      tabsRoot.addEventListener("click", function (e) {
        var link = e.target.closest(".cat-tab");
        if (!link) return;
        tabsRoot.querySelectorAll(".cat-tab").forEach(function (a) { a.classList.remove("active"); });
        link.classList.add("active");
      });
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
      return '<div class="cat-price-box"><span class="cat-price-label">PRIX DE GROS</span>' +
        '<div class="cat-price-amount">' + prefix + amount + '</div>' +
        '<div class="cat-price-unit">/ ' + unit + "</div></div>";
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
