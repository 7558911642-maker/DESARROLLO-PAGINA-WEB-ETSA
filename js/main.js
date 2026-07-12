
(() => {
  const syncMobileMenuState = () => {
    const menu = document.getElementById("menuPrincipal");
    if (!menu || menu.dataset.etsaMenuStateReady === "true") {
      return;
    }

    menu.dataset.etsaMenuStateReady = "true";

    const openMenu = () => document.body.classList.add("menu-mobile-abierto");
    const closeMenu = () => document.body.classList.remove("menu-mobile-abierto");

    menu.addEventListener("show.bs.offcanvas", openMenu);
    menu.addEventListener("shown.bs.offcanvas", openMenu);
    menu.addEventListener("hide.bs.offcanvas", closeMenu);
    menu.addEventListener("hidden.bs.offcanvas", closeMenu);

    if (menu.classList.contains("show")) {
      openMenu();
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    syncMobileMenuState();

    if (window.EtsaLayoutReady?.then) {
      window.EtsaLayoutReady.then(syncMobileMenuState).catch(() => {});
    }

    const observer = new MutationObserver(() => {
      syncMobileMenuState();
      if (document.getElementById("menuPrincipal")?.dataset.etsaMenuStateReady === "true") {
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
})();

(() => {
  const BREADCRUMB_SELECTOR = [
    ".breadcrumb-etsa",
    ".breadcrumb-encomiendas",
    ".breadcrumb-rutas",
    ".breadcrumb-info-viaje",
    ".breadcrumb-libro-reclamos",
    ".breadcrumb-reserva",
    ".breadcrumb-terminos-encomiendas",
    ".breadcrumb-terminos-viaje",
  ].join(",");

  let breadcrumb = null;
  let ticking = false;

  const getHeaderHeight = () => {
    const header = document.querySelector("[data-layout-header], .site-header.fixed-top, .site-header");
    if (header) {
      const headerHeight = Math.round(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--site-header-height", `${headerHeight}px`);
      document.body.style.setProperty("--breadcrumb-header-height", `${headerHeight}px`);
      return headerHeight;
    }

    const cssHeight = window.getComputedStyle(document.documentElement).getPropertyValue("--site-header-height");
    return Number.parseFloat(cssHeight) || 84;
  };

  const updateBreadcrumbState = () => {
    ticking = false;

    if (!breadcrumb || !document.body.contains(breadcrumb)) {
      breadcrumb = document.querySelector(BREADCRUMB_SELECTOR);
    }

    if (!breadcrumb) {
      return;
    }

    const headerHeight = getHeaderHeight();
    const isStuck = window.scrollY > 2 && breadcrumb.getBoundingClientRect().top <= headerHeight + 2;
    breadcrumb.classList.toggle("breadcrumb-pegado", isStuck);
  };

  const requestBreadcrumbUpdate = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(updateBreadcrumbState);
  };

  const initBreadcrumbStickyState = () => {
    breadcrumb = document.querySelector(BREADCRUMB_SELECTOR);
    requestBreadcrumbUpdate();
  };

  document.addEventListener("DOMContentLoaded", () => {
    initBreadcrumbStickyState();

    if (window.EtsaLayoutReady?.then) {
      window.EtsaLayoutReady.then(initBreadcrumbStickyState).catch(() => {});
    }

    window.addEventListener("scroll", requestBreadcrumbUpdate, { passive: true });
    window.addEventListener("resize", requestBreadcrumbUpdate);
  });
})();

(() => {
  const BANNER_SELECTORS = [
    "body.pagina-index > main > .hero",
    ".contacto-hero:not(.contacto-hero--index)",
    ".encomiendas-hero",
    ".hero-viaje",
    ".libro-reclamos-hero",
    ".nosotros-hero",
    ".faq-hero",
    ".promociones-hero",
    ".reserva-hero",
    ".servicios-hero",
    ".terminos-encomiendas-hero",
    ".terminos-viaje-hero",
    ".testimonios-hero",
    ".detalle-destino-hero",
  ];

  const FIRST_IMAGE_BY_SELECTOR = [
    ["body.pagina-index > main > .hero", "img/rutas/chachapoyas.png"],
    [".contacto-hero", "img/banners/contacto-banner.png"],
    [".encomiendas-hero", "img/banners/encomiendas-banner.png"],
    [".hero-viaje", "img/banners/info-viaje-banner.png"],
    [".libro-reclamos-hero", "img/banners/libro-recomendaciones-banner.png"],
    [".nosotros-hero", "img/banners/nosotros-banner.png"],
    [".faq-hero", "img/banners/preguntas-frecuentes-banner.png"],
    [".promociones-hero", "img/banners/Promociones-banner.png"],
    [".reserva-hero", "img/banners/watermarked_img_2461339827978530461.jpg"],
    [".rutas-hero", "img/rutas/chachapoyas.png"],
    [".servicios-hero", "img/banners/servicios-banner.png"],
    [".terminos-encomiendas-hero", "img/banners/encomiendas-banner.png"],
    [".terminos-viaje-hero", "img/banners/terminos_condiciones_viaje_banner.png"],
    [".testimonios-hero", "img/banners/testimonios-banner.png"],
    [".detalle-destino-hero--chachapoyas", "img/rutas/chachapoyas.png"],
    [".detalle-destino-hero--bagua", "img/rutas/bagua.png"],
    [".detalle-destino-hero--pedro-ruiz", "img/banners/Pedro_Ruiz.png"],
    [".detalle-destino-hero--luya", "img/rutas/Luya.png"],
    [".detalle-destino-hero--pomacochas", "img/rutas/Pomacochas.png"],
  ];

  const DEFAULT_BANNER_IMAGES = [
    "img/rutas/chachapoyas.png",
    "img/rutas/kuelap.png",
    "img/banners/Pedro_Ruiz.png",
    "img/rutas/Luya.png",
    "img/rutas/Pomacochas.png",
    "img/rutas/bagua.png",
  ];

  const BANNER_INTERVAL_MS = 3000;

  const createElement = (tagName, className) => {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    return element;
  };

  const isNestedRoutePage = () =>
    window.location.pathname.replace(/\\/g, "/").includes("/detalles-rutas/");

  const resolveAssetPath = (path) => {
    if (!path) {
      return "";
    }

    if (/^(https?:|data:|\/|\.{1,2}\/)/.test(path)) {
      return new URL(path, document.baseURI).href;
    }

    return new URL(`${isNestedRoutePage() ? "../" : ""}${path}`, document.baseURI).href;
  };

  const preloadImage = (src) =>
    new Promise((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve({ src, loaded: true });
      image.onerror = () => resolve({ src, loaded: false });
      image.src = src;
    });

  const getImagesForBanner = (banner) => {
    const firstImage = FIRST_IMAGE_BY_SELECTOR.find(([selector]) => banner.matches(selector))?.[1];

    // Excluir imagenes dentro de contenedores especificos que no son parte del banner
    const excludeSelectors = [".valor-card", ".ruta-index-card", ".promo-index-card", ".servicio-card", ".detalle-destino-card"];

    const pageImages = Array.from(document.querySelectorAll("main img[src]"))
      .filter(img => {
        // Verificar que la imagen no este dentro de ninguno de los contenedores excluidos
        return !excludeSelectors.some(selector => img.closest(selector));
      })
      .map((image) => image.getAttribute("src"))
      .filter(Boolean);

    const bannerImages = Array.from(new Set(
      [firstImage, ...pageImages].filter(Boolean).map(resolveAssetPath)
    ));

    if (banner.matches(".reserva-hero")) {
      return bannerImages;
    }

    if (bannerImages.length > 1) {
      return bannerImages;
    }

    return Array.from(new Set([
      ...bannerImages,
      ...DEFAULT_BANNER_IMAGES.map(resolveAssetPath),
    ]));
  };

  const initBannerCarousel = (banner) => {
    if (banner.dataset.etsaBannerCarousel === "ready" || banner.querySelector(".rutas-hero__carousel")) {
      return;
    }

    const imagePaths = getImagesForBanner(banner);
    const fallbackImage = imagePaths[0];

    let activeIndex = 0;
    let timer = null;

    const carousel = createElement("div", "etsa-banner-carousel");
    const track = createElement("div", "etsa-banner-carousel__track");
    const shade = createElement("div", "etsa-banner-carousel__shade");
    const dots = createElement("div", "etsa-banner-carousel__dots");

    carousel.setAttribute("aria-hidden", "true");
    dots.setAttribute("aria-label", "Imagenes del banner");
    carousel.appendChild(track);
    banner.prepend(carousel, shade);
    banner.appendChild(dots);
    banner.classList.add("etsa-banner-carousel-ready");
    banner.dataset.etsaBannerCarousel = "ready";

    const getSlides = () => Array.from(track.querySelectorAll(".etsa-banner-carousel__slide"));
    const getDots = () => Array.from(dots.querySelectorAll(".etsa-banner-carousel__dot"));

    const stopAutoplay = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const updateActiveState = (slides, dotButtons) => {
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === activeIndex);
      });

      dotButtons.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle("is-active", isActive);
        if (isActive) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    };

    const setActive = (index) => {
      const slides = getSlides();
      const dotButtons = getDots();

      if (!slides.length) {
        return;
      }

      activeIndex = (index + slides.length) % slides.length;
      updateActiveState(slides, dotButtons);

      const nextSlide = slides[(activeIndex + 1) % slides.length];
      if (nextSlide?.dataset.bannerImage) {
        preloadImage(nextSlide.dataset.bannerImage);
      }
    };

    const startAutoplay = () => {
      const slides = getSlides();

      stopAutoplay();
      if (slides.length < 2) {
        return;
      }

      timer = window.setInterval(() => {
        setActive(activeIndex + 1);
      }, BANNER_INTERVAL_MS);
    };

    const render = (images) => {
      stopAutoplay();
      track.innerHTML = "";
      dots.innerHTML = "";

      images.forEach((src, index) => {
        const slide = createElement("div", `etsa-banner-carousel__slide${index === 0 ? " is-active" : ""}`);
        slide.dataset.bannerImage = src;
        slide.style.backgroundImage = `url("${src}")`;
        track.appendChild(slide);
      });

      images.forEach((src, index) => {
        const dot = createElement("button", `etsa-banner-carousel__dot${index === 0 ? " is-active" : ""}`);
        dot.type = "button";
        dot.setAttribute("aria-label", `Ver imagen ${index + 1} del banner`);
        if (index === 0) {
          dot.setAttribute("aria-current", "true");
        }
        dot.addEventListener("click", () => {
          setActive(index);
          startAutoplay();
        });
        dots.appendChild(dot);
      });

      activeIndex = 0;
      setActive(0);
      startAutoplay();
    };

    render([fallbackImage]);

    Promise.all(imagePaths.map(preloadImage)).then((results) => {
      const availableImages = results
        .filter((result) => result.loaded)
        .map((result) => result.src);

      if (!availableImages.includes(fallbackImage)) {
        availableImages.unshift(fallbackImage);
      }

      render(availableImages);
    });

    window.addEventListener("pagehide", stopAutoplay, { once: true });
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(BANNER_SELECTORS.join(",")).forEach(initBannerCarousel);
  });
})();

(() => {
  const mobileQuery = window.matchMedia("(max-width: 767.98px)");

  const initDetalleDatosSlider = (track) => {
    if (track.dataset.detalleDatosSlider === "ready") {
      return;
    }

    const slides = Array.from(track.children);
    if (slides.length < 2) {
      return;
    }

    let activeSlide = 0;

    track.classList.add("detalle-datos-slider");
    track.dataset.detalleDatosSlider = "ready";

    const dots = document.createElement("div");
    dots.className = "detalle-datos-slider-dots";
    dots.setAttribute("aria-label", "Selector de tarjetas informativas");

    slides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.className = "detalle-datos-slider-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Ver dato ${index + 1}`);
      dot.addEventListener("click", () => setActiveSlide(index));
      dots.appendChild(dot);
    });

    track.insertAdjacentElement("afterend", dots);

    const dotButtons = Array.from(dots.children);

    function updateActiveState(index) {
      activeSlide = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === activeSlide);
      });

      dotButtons.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeSlide;
        dot.classList.toggle("is-active", isActive);
        if (isActive) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    }

    function setActiveSlide(index) {
      updateActiveState(index);

      if (!mobileQuery.matches) {
        return;
      }

      if (!track.clientWidth) {
        return;
      }

      track.scrollTo({
        left: activeSlide * track.clientWidth,
        behavior: "smooth",
      });
    }

    track.addEventListener("scroll", () => {
      if (!mobileQuery.matches || !track.clientWidth) {
        return;
      }

      const nextSlide = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
      if (nextSlide !== activeSlide) {
        updateActiveState(nextSlide);
      }
    }, { passive: true });

    window.addEventListener("resize", () => {
      if (!mobileQuery.matches || !track.clientWidth) {
        return;
      }

      track.scrollLeft = activeSlide * track.clientWidth;
    });

    updateActiveState(0);
  };

  document.addEventListener("DOMContentLoaded", () => {
    document
      .querySelectorAll(".detalle-destino-texto > .row.g-3.mt-4")
      .forEach(initDetalleDatosSlider);
  });
})();

(() => {
  const pairQuery = window.matchMedia("(max-width: 991.98px)");

  const initActividadesParesSlider = (track) => {
    if (track.dataset.actividadesParesSlider === "ready") {
      return;
    }

    const slides = Array.from(track.children);
    const pageCount = Math.ceil(slides.length / 2);
    if (pageCount < 2) {
      return;
    }

    let activePage = 0;
    let startX = 0;
    let startY = 0;

    track.classList.add("actividades-pares-slider");
    track.dataset.actividadesParesSlider = "ready";

    const oldDots = track.nextElementSibling;
    if (oldDots?.classList.contains("detalle-slider-dots")) {
      oldDots.remove();
    }

    const dots = document.createElement("div");
    dots.className = "actividades-pares-dots";
    dots.setAttribute("aria-label", "Selector de actividades recomendadas");

    Array.from({ length: pageCount }).forEach((_, index) => {
      const dot = document.createElement("button");
      dot.className = "actividades-pares-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Ver actividades ${index * 2 + 1} y ${Math.min(index * 2 + 2, slides.length)}`);
      dot.addEventListener("click", () => setActivePage(index));
      dots.appendChild(dot);
    });

    track.insertAdjacentElement("afterend", dots);
    const dotButtons = Array.from(dots.children);

    function setActivePage(index) {
      activePage = Math.max(0, Math.min(pageCount - 1, index));
      track.style.setProperty("--actividad-pair-slide", activePage);

      dotButtons.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activePage;
        dot.classList.toggle("is-active", isActive);
        if (isActive) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    }

    const handleSwipe = (endX, endY) => {
      if (!pairQuery.matches) {
        return;
      }

      const distanceX = endX - startX;
      const distanceY = endY - startY;

      if (Math.abs(distanceX) < 45 || Math.abs(distanceX) < Math.abs(distanceY)) {
        return;
      }

      setActivePage(activePage + (distanceX < 0 ? 1 : -1));
    };

    track.addEventListener("touchstart", (event) => {
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    }, { passive: true });

    track.addEventListener("touchend", (event) => {
      const touch = event.changedTouches[0];
      handleSwipe(touch.clientX, touch.clientY);
    });

    window.addEventListener("resize", () => setActivePage(activePage));
    setActivePage(0);
  };

  document.addEventListener("DOMContentLoaded", () => {
    document
      .querySelectorAll(".actividades-destino .col-12.col-lg-7 > .row")
      .forEach(initActividadesParesSlider);
  });
})();
