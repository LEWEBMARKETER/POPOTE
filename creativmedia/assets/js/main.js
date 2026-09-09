(function () {
  "use strict";

  var WHATSAPP_NUMBER = "24166499028";

  function waLink(message) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  }

  function setWhatsAppLinks() {
    var defaultMessage = "Bonjour CRÉATIV'MEDIA, je souhaite avoir plus d'informations sur l'Offre Rentrée 2026.";
    document.querySelectorAll("[data-wa]").forEach(function (el) {
      var custom = el.getAttribute("data-wa-message");
      el.setAttribute("href", waLink(custom || defaultMessage));
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    });
  }

  /* Header scroll state + mobile nav */
  function initHeader() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".hamburger");
    var mobileNav = document.querySelector(".mobile-nav");

    function onScroll() {
      if (window.scrollY > 12) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle && mobileNav) {
      toggle.addEventListener("click", function () {
        var isOpen = mobileNav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        document.body.style.overflow = isOpen ? "hidden" : "";
      });

      mobileNav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          mobileNav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
        });
      });
    }
  }

  /* Scroll reveal animations */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || items.length === 0) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach(function (el) { observer.observe(el); });
  }

  /* Radio pill highlight */
  function initRadioPills() {
    document.querySelectorAll(".radio-pill").forEach(function (pill) {
      var input = pill.querySelector("input");
      if (!input) return;
      function sync() {
        var name = input.name;
        document.querySelectorAll('input[name="' + name + '"]').forEach(function (sibling) {
          sibling.closest(".radio-pill").classList.toggle("is-checked", sibling.checked);
        });
      }
      input.addEventListener("change", sync);
      sync();
    });
  }

  /* Pricing pack CTA -> pre-select the pack in the contact form and scroll to it */
  function initPricingLinks() {
    document.querySelectorAll("[data-pack]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var pack = btn.getAttribute("data-pack");
        var radio = document.querySelector('input[name="pack"][value="' + pack + '"]');
        if (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event("change"));
        }
        var target = document.querySelector("#contact");
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  /* Contact form -> builds a WhatsApp message from the fields, shows confirmation */
  function initContactForm() {
    var form = document.querySelector(".contact-form");
    if (!form) return;
    var card = document.querySelector(".contact-card");
    var success = document.querySelector(".form-success");
    var waButton = document.querySelector(".form-success .btn-whatsapp");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = new FormData(form);
      var packInput = form.querySelector('input[name="pack"]:checked');
      var packLabel = packInput ? packInput.closest(".radio-pill").textContent.trim() : "Je ne sais pas encore";
      var lines = [
        "Bonjour CRÉATIV'MEDIA, je souhaite en savoir plus sur l'Offre Rentrée 2026.",
        "",
        "Nom : " + (data.get("name") || ""),
        "Entreprise : " + (data.get("company") || ""),
        "Téléphone / WhatsApp : " + (data.get("phone") || ""),
        "Email : " + (data.get("email") || ""),
        "Secteur : " + (data.get("sector") || ""),
        "Besoin : " + (data.get("need") || ""),
        "Pack souhaité : " + packLabel
      ];
      var message = data.get("message");
      if (message) {
        lines.push("Message : " + message);
      }

      var link = waLink(lines.join("\n"));
      if (waButton) {
        waButton.setAttribute("href", link);
        waButton.setAttribute("target", "_blank");
        waButton.setAttribute("rel", "noopener");
      }

      card.classList.add("is-submitted");
      success.classList.add("is-visible");
      success.setAttribute("tabindex", "-1");
      success.focus({ preventScroll: true });
    });
  }

  /* Footer year */
  function initYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", function () {
    setWhatsAppLinks();
    initHeader();
    initReveal();
    initRadioPills();
    initPricingLinks();
    initContactForm();
    initYear();
  });
})();
