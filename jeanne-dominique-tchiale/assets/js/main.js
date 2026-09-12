(function () {
  "use strict";

  // Menu mobile
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("is-open");
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  // Apparition progressive des sections au scroll
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Année dynamique dans le footer
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  // Formulaire de contact -> ouverture d'un email pré-rempli
  var form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("#name").value.trim();
      var email = form.querySelector("#email").value.trim();
      var phone = form.querySelector("#phone").value.trim();
      var subject = form.querySelector("#subject").value.trim() || "Prise de contact via le site";
      var message = form.querySelector("#message").value.trim();

      var body =
        "Nom : " + name + "\n" +
        "Email : " + email + "\n" +
        "Téléphone : " + (phone || "Non renseigné") + "\n\n" +
        message;

      var mailto =
        "mailto:jeanneproduct_gab@yahoo.fr" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      var successEl = form.querySelector(".form-success");
      if (successEl) { successEl.classList.add("show"); }

      window.location.href = mailto;
    });
  }
})();
