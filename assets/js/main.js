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

  // Chargement du catalogue mensuel (data/catalogue.json)
  var catRoot = document.getElementById("catalogue-root");
  if (catRoot) {
    fetch("data/catalogue.json")
      .then(function (res) { return res.json(); })
      .then(renderCatalogue)
      .catch(function () {
        catRoot.innerHTML = "<p>Le catalogue du mois est disponible dans le groupe WhatsApp POPOTE.</p>";
      });
  }

  var catPreview = document.getElementById("catalogue-preview-root");
  if (catPreview) {
    fetch("data/catalogue.json")
      .then(function (res) { return res.json(); })
      .then(function (data) { renderCataloguePreview(data, catPreview); })
      .catch(function () {});
  }

  function renderCatalogue(data) {
    var html = "";
    data.categories.forEach(function (cat) {
      html += '<div class="cat-card">';
      html += '<div class="emoji">' + cat.icone + "</div>";
      html += "<h3>" + cat.nom + "</h3>";
      html += '<ul class="product-list">';
      cat.produits.forEach(function (p) {
        html += "<li><span>" + p.nom + '</span><span class="unit">' + p.unite + "</span></li>";
      });
      html += "</ul></div>";
    });
    catRoot.innerHTML = html;

    var note = document.getElementById("catalogue-note");
    if (note) note.textContent = data.note;
  }

  function renderCataloguePreview(data, root) {
    var html = "";
    data.categories.slice(0, 4).forEach(function (cat) {
      html += '<div class="cat-card"><div class="emoji">' + cat.icone + "</div><h3>" + cat.nom + "</h3></div>";
    });
    root.innerHTML = html;
  }

  // Année dynamique dans le footer
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});
