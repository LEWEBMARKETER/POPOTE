// Menu mobile
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
      });
    });
  }

  var FAMILY_ICONS = {
    "Riz": "🌾",
    "Conserves": "🥫",
    "Poissons": "🐟",
    "Volailles": "🍗",
    "Viandes": "🥩",
    "Produits d’épicerie": "🛒",
    "Produits d’entretien": "🧼",
    "Épices et assaisonnements": "🧂",
    "Féculents": "🍌"
  };

  // Aperçu du catalogue sur l'accueil (familles réelles du catalogue du mois)
  var catPreview = document.getElementById("catalogue-preview-root");
  if (catPreview) {
    fetch("data/catalogue-produits.json?v=20261017")
      .then(function (res) { return res.json(); })
      .then(function (products) { renderCataloguePreview(products, catPreview); })
      .catch(function () {});
  }

  function renderCataloguePreview(products, root) {
    products.sort(function (a, b) { return a.ordre_famille - b.ordre_famille; });
    var families = [];
    products.forEach(function (p) {
      if (families.indexOf(p.famille) === -1) families.push(p.famille);
    });
    var html = families.map(function (fam) {
      var icon = FAMILY_ICONS[fam] || "🛍️";
      return '<div class="cat-preview-card"><div class="emoji">' + icon + "</div><h3>" + fam + "</h3></div>";
    }).join("");
    root.innerHTML = html;
  }

  // Année dynamique dans le footer
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});
