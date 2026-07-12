"use strict";

(function () {
  const TEMPLATE_PATHS = {
    header: "templates/header.html",
    footer: "templates/footer.html"
  };

  const ACTIVE_NAV_BY_PAGE = {
    index: "index",
    servicios: "servicios",
    rutas: "rutas",
    encomiendas: "encomiendas",
    promociones: "promociones",
    reserva: "reserva",
    contacto: "contacto",
    nosotros: "nosotros",
    testimonios: "testimonios",
    "preguntas-frecuentes": "preguntas-frecuentes",
    "info-viaje": "info-viaje",
    libro_reclamos: "libro_reclamos",
    "terminos-viaje": "terminos-viaje",
    "terminos-encomiendas": "terminos-encomiendas"
  };

  const RESERVA_DESKTOP_PAGES = new Set(["index", "info-viaje", "libro_reclamos"]);
  const scriptElement = document.currentScript || document.querySelector('script[src*="layout-loader.js"]');
  const rootPrefix = obtenerPrefijoRaiz(scriptElement?.getAttribute("src") || "");
  const pageKey = obtenerClavePagina();

  window.EtsaLayoutReady = cargarLayout();

  function obtenerPrefijoRaiz(src) {
    const ruta = src.split("?")[0].split("#")[0].replace(/\\/g, "/");
    const marcador = "js/components/layout-loader.js";
    const indice = ruta.indexOf(marcador);

    return indice >= 0 ? ruta.slice(0, indice) : "";
  }

  function obtenerClavePagina() {
    const ruta = decodeURIComponent(window.location.pathname).replace(/\\/g, "/");

    if (ruta.includes("/detalles-rutas/")) {
      return "rutas";
    }

    const archivo = ruta.split("/").filter(Boolean).pop() || "index.html";
    return archivo.replace(/\.html$/i, "") || "index";
  }

  async function cargarLayout() {
    try {
      const [headerHtml, footerHtml] = await Promise.all([
        cargarTemplate(TEMPLATE_PATHS.header),
        cargarTemplate(TEMPLATE_PATHS.footer)
      ]);

      inyectarTemplate("header", headerHtml);
      inyectarTemplate("footer", footerHtml);
      aplicarEstadoDePagina();

      document.dispatchEvent(new CustomEvent("etsa:layout-ready", {
        detail: {
          pageKey,
          rootPrefix
        }
      }));
    } catch (error) {
      console.error("No se pudo cargar el layout compartido de ETSA.", error);
    }
  }

  async function cargarTemplate(path) {
    const respuesta = await fetch(`${rootPrefix}${path}`);

    if (!respuesta.ok) {
      throw new Error(`No se pudo cargar ${path}. Codigo ${respuesta.status}.`);
    }

    return (await respuesta.text()).split("{{ROOT}}").join(rootPrefix);
  }

  function inyectarTemplate(nombre, html) {
    const destino = document.querySelector(`[data-layout="${nombre}"]`);
    if (!destino) return;

    destino.outerHTML = html;
  }

  function aplicarEstadoDePagina() {
    const header = document.querySelector("[data-layout-header]");
    const reserva = document.querySelector("[data-layout-reserva]");
    const navActivo = ACTIVE_NAV_BY_PAGE[pageKey] || null;

    header?.classList.toggle("index-fixed-header", pageKey === "index");
    if (header && pageKey === "index") {
      configurarScrollHeader(header);
    }

    if (reserva) {
      reserva.classList.remove("d-sm-flex", "d-lg-flex");
      reserva.classList.add(RESERVA_DESKTOP_PAGES.has(pageKey) ? "d-lg-flex" : "d-sm-flex");
    }

    document.querySelectorAll("[data-nav-id]").forEach(function (enlace) {
      enlace.classList.remove("activo");
      enlace.removeAttribute("aria-current");
    });

    if (!navActivo) return;

    document.querySelectorAll(`[data-nav-id="${navActivo}"]`).forEach(function (enlace) {
      enlace.classList.add("activo");
      enlace.setAttribute("aria-current", "page");
    });
  }

  function configurarScrollHeader(header) {
    if (header.dataset.layoutScrollReady === "true") return;

    let esperandoAnimacion = false;

    const actualizar = function () {
      header.classList.toggle("etsa-header-scrolled", window.scrollY > 24);
      esperandoAnimacion = false;
    };

    window.addEventListener("scroll", function () {
      if (esperandoAnimacion) return;

      esperandoAnimacion = true;
      window.requestAnimationFrame(actualizar);
    }, { passive: true });

    header.dataset.layoutScrollReady = "true";
    actualizar();
  }
})();
