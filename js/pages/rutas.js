

(() => {
  const HERO_CAROUSEL_IMAGES = [
    "img/banners/Nrutas_chacha_banner1.png",
    "img/banners/Nrutas_bagua_banner2.png",
    "img/banners/Nrutas_PedroRuiz_banner3.png",
    "img/banners/Nrutas_Luya_banner4.png",
    "img/banners/Nrutas_Pomacochas_banner5.png",
  ];

  const HERO_FALLBACK_IMAGE = "img/banners/Nrutas_chacha_banner1.png";
  const HERO_CAROUSEL_INTERVAL = 3000;
  const ROUTES = [
    {
      id: "ruta-chachapoyas",
      name: "Chachapoyas",
      province: "Amazonas",
      type: "interprovincial",
      typeLabel: "Interprovincial",
      distance: 71,
      duration: "2 h 20 min aprox.",
      image: "img/rutas/chachapoyas.png",
      href: "detalles-rutas/detalle-chachapoyas.html",
      description:
        "Ruta principal hacia la capital amazonense, ideal para viajes familiares, turismo y gestiones en la ciudad.",
    },
    {
      id: "ruta-bagua-grande",
      name: "Bagua Grande",
      province: "Utcubamba",
      type: "local",
      typeLabel: "Local",
      distance: 30,
      duration: "55 min aprox.",
      image: "img/rutas/bagua.png",
      href: "detalles-rutas/detalle-bagua-grande.html",
      description:
        "Destino cercano con salida practica para pasajeros que se movilizan dentro del eje Utcubamba.",
    },
    {
      id: "ruta-pedro-ruiz",
      name: "Pedro Ruiz",
      province: "Bongar\u00e1",
      type: "regional",
      typeLabel: "Regional",
      distance: 45,
      duration: "1 h 25 min aprox.",
      image: "img/banners/Pedro_Ruiz.png",
      href: "detalles-rutas/detalle-pedro-ruiz.html",
      description:
        "Conexion regional hacia una zona clave para acceder a atractivos naturales y rutas comerciales.",
    },
    {
      id: "ruta-luya",
      name: "Luya",
      province: "Luya",
      type: "interprovincial",
      typeLabel: "Interprovincial",
      distance: 68,
      duration: "2 h aprox.",
      image: "img/rutas/Luya.png",
      href: "detalles-rutas/detalle-luya.html",
      description:
        "Ruta interprovincial pensada para viajes comodos hacia distritos, comunidades y puntos turisticos de Luya.",
    },
    {
      id: "ruta-pomacochas",
      name: "Pomacochas",
      province: "Bongar\u00e1",
      type: "regional",
      typeLabel: "Regional",
      distance: 90,
      duration: "2 h 40 min aprox.",
      image: "img/rutas/Pomacochas.png",
      href: "detalles-rutas/detalle-pomacochas.html",
      description:
        "Destino regional reconocido por su laguna y paisaje natural, recomendado para turismo y descanso.",
    },
  ];

  const normalize = (value) =>
    String(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const createElement = (tagName, className, text) => {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    if (text) {
      element.textContent = text;
    }
    return element;
  };

  document.addEventListener("DOMContentLoaded", () => {
    initHeroCarousel();

    const section = document.querySelector(".rutas-seccion");
    const header = document.querySelector(".rutas-header");
    const viewport = document.querySelector(".rutas-slider-viewport");
    const slider = document.querySelector(".galeria-destinos-bootstrap");
    const dotsContainer = document.querySelector(".rutas-slider-dots");

    if (!section || !header || !viewport || !slider || !dotsContainer) {
      return;
    }

    let routeCards = ROUTES.map((route) => {
      const column = document.getElementById(route.id);
      const card = column?.querySelector(".tarjeta-ruta");
      const link = card?.querySelector("a");

      if (!column || !card || !link) {
        return null;
      }

      column.dataset.routeName = route.name;
      column.dataset.routeProvince = route.province;
      column.dataset.routeType = route.type;
      column.dataset.routeDistance = route.distance;

      const content = card.querySelector(".tarjeta-ruta__contenido");
      if (content && !content.querySelector(".ruta-meta-js")) {
        const meta = createElement("div", "ruta-meta-js");
        meta.innerHTML = `
          <span><i class="bi bi-speedometer2" aria-hidden="true"></i>${route.distance} km</span>
          <span><i class="bi bi-signpost-2" aria-hidden="true"></i>${route.typeLabel}</span>
        `;
        content.insertBefore(meta, link);
      }

      link.dataset.routeAction = "detail";
      link.setAttribute("aria-label", `Ver detalle de ${route.name}`);

      return { ...route, column, card, link };
    }).filter(Boolean);

    if (!routeCards.length) {
      return;
    }

    const state = {
      query: "",
      type: "todos",
      sort: "featured",
      activeMobileIndex: 0,
      pointerStartX: 0,
      pointerStartY: 0,
      selectedId: routeCards[0].id,
      visibleRoutes: [...routeCards],
    };

    const controls = createControls(routeCards.length);
    header.insertAdjacentElement("afterend", controls.wrapper);

    const emptyState = createEmptyState();
    viewport.insertAdjacentElement("afterend", emptyState);

    const modal = createRouteModal();
    document.body.appendChild(modal.overlay);

    const originalDots = Array.from(dotsContainer.querySelectorAll(".rutas-slider-dot"));
    const compactRoutesQuery = window.matchMedia("(max-width: 1024px)");
    let scrollSyncFrame = null;

    const isCompactRoutes = () => compactRoutesQuery.matches;

    const setSelectedRoute = (routeId) => {
      state.selectedId = routeId;
      routeCards.forEach((route) => {
        route.card.classList.toggle("is-selected", route.id === routeId);
      });
    };

    const updateMobileSlideState = (index) => {
      const visible = state.visibleRoutes;

      if (!visible.length) {
        state.activeMobileIndex = 0;
        slider.style.setProperty("--ruta-slide", 0);
        return null;
      }

      state.activeMobileIndex = (index + visible.length) % visible.length;
      slider.style.setProperty("--ruta-slide", state.activeMobileIndex);

      visible.forEach((route, routeIndex) => {
        route.column.classList.toggle("is-active", routeIndex === state.activeMobileIndex);
      });

      Array.from(dotsContainer.querySelectorAll(".rutas-slider-dot")).forEach((dot, dotIndex) => {
        const isActive = dotIndex === state.activeMobileIndex;
        dot.classList.toggle("is-active", isActive);
        if (isActive) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });

      return state.activeMobileIndex;
    };

    const setMobileSlide = (index, options = {}) => {
      const activeIndex = updateMobileSlideState(index);

      if (activeIndex === null || !isCompactRoutes() || options.scroll === false) {
        return;
      }

      state.visibleRoutes[activeIndex]?.column.scrollIntoView({
        behavior: options.behavior || "smooth",
        block: "nearest",
        inline: "start",
      });
    };

    const syncMobileSlideFromScroll = () => {
      if (!isCompactRoutes() || !state.visibleRoutes.length) {
        return;
      }

      const viewportLeft = viewport.getBoundingClientRect().left;
      const closest = state.visibleRoutes.reduce((selected, route, index) => {
        const distance = Math.abs(route.column.getBoundingClientRect().left - viewportLeft);
        return distance < selected.distance ? { index, distance } : selected;
      }, { index: 0, distance: Number.POSITIVE_INFINITY });

      updateMobileSlideState(closest.index);
    };

    const renderDots = () => {
      dotsContainer.innerHTML = "";

      state.visibleRoutes.forEach((route, index) => {
        const dot = originalDots[index]?.cloneNode(false) || document.createElement("button");
        dot.type = "button";
        dot.className = "rutas-slider-dot";
        dot.dataset.rutaSlide = index;
        dot.setAttribute("aria-label", `Ver destino ${route.name}`);
        dot.addEventListener("click", () => setMobileSlide(index));
        dotsContainer.appendChild(dot);
      });
    };

    const sortRoutes = (routes) => {
      const sorted = [...routes];

      if (state.sort === "name") {
        sorted.sort((a, b) => a.name.localeCompare(b.name, "es"));
      }

      if (state.sort === "distance-asc") {
        sorted.sort((a, b) => a.distance - b.distance);
      }

      if (state.sort === "distance-desc") {
        sorted.sort((a, b) => b.distance - a.distance);
      }

      return sorted;
    };

    const updateSummary = () => {
      const total = routeCards.length;
      const shown = state.visibleRoutes.length;
      const label = shown === 1 ? "ruta encontrada" : "rutas encontradas";
      controls.summary.textContent = `${shown} de ${total} ${label}`;
    };

    const applyFilters = () => {
      const query = normalize(state.query);

      const filtered = routeCards.filter((route) => {
        const matchesQuery = !query || normalize([
          route.name,
          route.province,
          route.typeLabel,
          `${route.distance} km`,
        ].join(" ")).includes(query);
        const matchesType = state.type === "todos" || route.type === state.type;

        return matchesQuery && matchesType;
      });

      state.visibleRoutes = sortRoutes(filtered);

      routeCards.forEach((route) => {
        const isVisible = state.visibleRoutes.includes(route);
        route.column.hidden = !isVisible;
        route.column.classList.toggle("ruta-filtrada", !isVisible);
      });

      state.visibleRoutes.forEach((route, index) => {
        route.column.style.order = index;
      });

      const hasResults = state.visibleRoutes.length > 0;
      viewport.hidden = !hasResults;
      dotsContainer.hidden = !hasResults;
      emptyState.hidden = hasResults;

      if (hasResults && !state.visibleRoutes.some((route) => route.id === state.selectedId)) {
        setSelectedRoute(state.visibleRoutes[0].id);
      }

      renderDots();
      if (isCompactRoutes()) {
        viewport.scrollTo({ left: 0, behavior: "auto" });
      }
      setMobileSlide(0, { scroll: false });
      updateSummary();
    };

    const openModal = (route) => {
      setSelectedRoute(route.id);

      modal.image.src = route.image;
      modal.image.alt = `Imagen de ${route.name}`;
      modal.title.textContent = route.name;
      modal.province.textContent = route.province;
      modal.distance.textContent = `${route.distance} km`;
      modal.type.textContent = route.typeLabel;
      modal.duration.textContent = route.duration;
      modal.description.textContent = route.description;
      modal.link.href = route.href;

      modal.overlay.hidden = false;
      document.body.classList.add("modal-ruta-open");
      modal.closeButton.focus();
    };

    const closeModal = () => {
      modal.overlay.hidden = true;
      document.body.classList.remove("modal-ruta-open");
      const selected = routeCards.find((route) => route.id === state.selectedId);
      selected?.link.focus({ preventScroll: true });
    };

    controls.search.addEventListener("input", (event) => {
      state.query = event.target.value;
      controls.clear.disabled = !state.query && state.type === "todos" && state.sort === "featured";
      applyFilters();
    });

    controls.type.addEventListener("change", (event) => {
      state.type = event.target.value;
      controls.clear.disabled = !state.query && state.type === "todos" && state.sort === "featured";
      applyFilters();
    });

    controls.sort.addEventListener("change", (event) => {
      state.sort = event.target.value;
      controls.clear.disabled = !state.query && state.type === "todos" && state.sort === "featured";
      applyFilters();
    });

    controls.clear.addEventListener("click", () => {
      state.query = "";
      state.type = "todos";
      state.sort = "featured";
      controls.search.value = "";
      controls.type.value = "todos";
      controls.sort.value = "featured";
      controls.clear.disabled = true;
      controls.search.focus();
      applyFilters();
    });

    routeCards.forEach((route) => {
      route.card.addEventListener("click", () => setSelectedRoute(route.id));
      route.link.addEventListener("click", (event) => {
        event.preventDefault();
        openModal(route);
      });
    });

    slider.addEventListener("touchstart", (event) => {
      const touch = event.touches[0];
      state.pointerStartX = touch.clientX;
      state.pointerStartY = touch.clientY;
    }, { passive: true });

    slider.addEventListener("touchend", (event) => {
      const touch = event.changedTouches[0];
      const distanceX = touch.clientX - state.pointerStartX;
      const distanceY = touch.clientY - state.pointerStartY;

      if (Math.abs(distanceX) >= 45 && Math.abs(distanceX) > Math.abs(distanceY)) {
        setMobileSlide(state.activeMobileIndex + (distanceX < 0 ? 1 : -1));
      }
    });

    viewport.addEventListener("scroll", () => {
      if (!isCompactRoutes()) {
        return;
      }

      if (scrollSyncFrame) {
        window.cancelAnimationFrame(scrollSyncFrame);
      }

      scrollSyncFrame = window.requestAnimationFrame(() => {
        scrollSyncFrame = null;
        syncMobileSlideFromScroll();
      });
    }, { passive: true });

    modal.closeButton.addEventListener("click", closeModal);
    modal.overlay.addEventListener("click", (event) => {
      if (event.target === modal.overlay) {
        closeModal();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.overlay.hidden) {
        closeModal();
      }
    });

    window.addEventListener("resize", () => {
      setMobileSlide(state.activeMobileIndex, {
        behavior: "auto",
        scroll: isCompactRoutes(),
      });
    });

    setSelectedRoute(state.selectedId);
    controls.clear.disabled = true;
    applyFilters();
  });

  function initHeroCarousel() {
    const hero = document.querySelector(".rutas-hero");
    const track = hero?.querySelector(".rutas-hero__track");
    const dotsContainer = hero?.querySelector(".rutas-hero__dots");

    if (!hero || !track || !dotsContainer) {
      return;
    }

    const imageList = Array.from(new Set(
      HERO_CAROUSEL_IMAGES.filter((image) => typeof image === "string" && image.trim())
    ));
    const fallbackImage = imageList.includes(HERO_FALLBACK_IMAGE)
      ? HERO_FALLBACK_IMAGE
      : imageList[0] || HERO_FALLBACK_IMAGE;

    let activeIndex = 0;
    let carouselTimer = null;

    const setSlideImage = (slide, image) => {
      slide.style.backgroundImage = `url("${image}")`;
      slide.dataset.heroImage = image;
    };

    const preloadImage = (image) =>
      new Promise((resolve) => {
        const preload = new Image();
        preload.decoding = "async";
        preload.onload = () => resolve({ image, loaded: true });
        preload.onerror = () => resolve({ image, loaded: false });
        preload.src = image;
      });

    const getSlides = () => Array.from(track.querySelectorAll(".rutas-hero__slide"));
    const getDots = () => Array.from(dotsContainer.querySelectorAll(".rutas-hero__dot"));

    const stopCarousel = () => {
      if (carouselTimer) {
        window.clearInterval(carouselTimer);
        carouselTimer = null;
      }
    };

    const updateActiveState = (slides, dots) => {
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === activeIndex);
      });

      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle("is-active", isActive);
        if (isActive) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    };

    const setActiveSlide = (index) => {
      const slides = getSlides();
      const dots = getDots();

      if (!slides.length) {
        return;
      }

      activeIndex = (index + slides.length) % slides.length;
      updateActiveState(slides, dots);

      const nextSlide = slides[(activeIndex + 1) % slides.length];
      if (nextSlide?.dataset.heroImage) {
        preloadImage(nextSlide.dataset.heroImage);
      }
    };

    const startCarousel = () => {
      const slides = getSlides();

      stopCarousel();
      if (slides.length < 2) {
        return;
      }

      carouselTimer = window.setInterval(() => {
        setActiveSlide(activeIndex + 1);
      }, HERO_CAROUSEL_INTERVAL);
    };

    const renderCarousel = (images) => {
      stopCarousel();
      track.innerHTML = "";
      dotsContainer.innerHTML = "";

      images.forEach((image, index) => {
        const slide = createElement("div", `rutas-hero__slide${index === 0 ? " is-active" : ""}`);
        setSlideImage(slide, image);
        track.appendChild(slide);
      });

      images.forEach((image, index) => {
        const dot = createElement("button", `rutas-hero__dot${index === 0 ? " is-active" : ""}`);
        dot.type = "button";
        dot.setAttribute("aria-label", `Ver imagen ${index + 1} del banner`);
        if (index === 0) {
          dot.setAttribute("aria-current", "true");
        }
        dot.addEventListener("click", () => {
          setActiveSlide(index);
          startCarousel();
        });
        dotsContainer.appendChild(dot);
      });

      activeIndex = 0;
      setActiveSlide(0);
      hero.dataset.carouselReady = "true";
      startCarousel();
    };

    renderCarousel([fallbackImage]);

    Promise.all(imageList.map(preloadImage)).then((results) => {
      const availableImages = results
        .filter((result) => result.loaded)
        .map((result) => result.image);

      if (!availableImages.includes(fallbackImage)) {
        availableImages.unshift(fallbackImage);
      }

      if (!availableImages.length) {
        return;
      }

      renderCarousel(availableImages);
    });

    window.addEventListener("pagehide", stopCarousel, { once: true });
  }

  function createControls(totalRoutes) {
    const wrapper = createElement("section", "rutas-controles-js");
    wrapper.setAttribute("aria-label", "Filtros de rutas");

    wrapper.innerHTML = `
      <div class="rutas-controles-js__panel">
        <label class="rutas-control-js rutas-control-js--search" for="buscar-ruta-js">
          <span>Buscar destino</span>
          <i class="bi bi-search" aria-hidden="true"></i>
          <input id="buscar-ruta-js" type="search" placeholder="Chachapoyas, Bongar\u00e1, 71 km..." autocomplete="off">
        </label>

        <label class="rutas-control-js" for="tipo-ruta-js">
          <span>Tipo de ruta</span>
          <select id="tipo-ruta-js">
            <option value="todos">Todos los tipos</option>
            <option value="local">Local</option>
            <option value="regional">Regional</option>
            <option value="interprovincial">Interprovincial</option>
          </select>
        </label>

        <label class="rutas-control-js" for="orden-ruta-js">
          <span>Ordenar por</span>
          <select id="orden-ruta-js">
            <option value="featured">Orden original</option>
            <option value="name">Nombre A-Z</option>
            <option value="distance-asc">Distancia menor</option>
            <option value="distance-desc">Distancia mayor</option>
          </select>
        </label>

        <button class="rutas-control-js__limpiar" type="button">
          <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
          Limpiar
        </button>
      </div>

      <div class="rutas-controles-js__status" aria-live="polite">
        <span class="rutas-controles-js__pill">
          <i class="bi bi-lightning-charge-fill" aria-hidden="true"></i>
          Filtro en tiempo real
        </span>
        <strong>${totalRoutes} rutas disponibles</strong>
      </div>
    `;

    return {
      wrapper,
      search: wrapper.querySelector("#buscar-ruta-js"),
      type: wrapper.querySelector("#tipo-ruta-js"),
      sort: wrapper.querySelector("#orden-ruta-js"),
      clear: wrapper.querySelector(".rutas-control-js__limpiar"),
      summary: wrapper.querySelector(".rutas-controles-js__status strong"),
    };
  }

  function createEmptyState() {
    const empty = createElement("div", "rutas-empty-js");
    empty.hidden = true;
    empty.innerHTML = `
      <div class="rutas-empty-js__icon">
        <i class="bi bi-search" aria-hidden="true"></i>
      </div>
      <div>
        <h3>No se encontraron rutas</h3>
        <p>Intenta con otro destino, provincia, tipo de ruta o distancia.</p>
      </div>
    `;
    return empty;
  }

  function createRouteModal() {
    const overlay = createElement("div", "ruta-modal-js");
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "ruta-modal-titulo-js");

    overlay.innerHTML = `
      <article class="ruta-modal-js__dialog">
        <button class="ruta-modal-js__close" type="button" aria-label="Cerrar detalle">
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>

        <div class="ruta-modal-js__media">
          <img src="" alt="">
        </div>

        <div class="ruta-modal-js__body">
          <span class="ruta-modal-js__eyebrow">Detalle de ruta</span>
          <h2 id="ruta-modal-titulo-js"></h2>
          <p class="ruta-modal-js__description"></p>

          <dl class="ruta-modal-js__facts">
            <div>
              <dt><i class="bi bi-geo-alt-fill" aria-hidden="true"></i>Provincia</dt>
              <dd data-field="province"></dd>
            </div>
            <div>
              <dt><i class="bi bi-speedometer2" aria-hidden="true"></i>Distancia</dt>
              <dd data-field="distance"></dd>
            </div>
            <div>
              <dt><i class="bi bi-signpost-2-fill" aria-hidden="true"></i>Tipo</dt>
              <dd data-field="type"></dd>
            </div>
            <div>
              <dt><i class="bi bi-clock-fill" aria-hidden="true"></i>Duraci\u00f3n</dt>
              <dd data-field="duration"></dd>
            </div>
          </dl>

          <div class="ruta-modal-js__actions">
            <a class="ruta-modal-js__link" href="#">
              Ver p\u00e1gina completa
              <i class="bi bi-arrow-right" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </article>
    `;

    return {
      overlay,
      closeButton: overlay.querySelector(".ruta-modal-js__close"),
      image: overlay.querySelector("img"),
      title: overlay.querySelector("#ruta-modal-titulo-js"),
      description: overlay.querySelector(".ruta-modal-js__description"),
      province: overlay.querySelector('[data-field="province"]'),
      distance: overlay.querySelector('[data-field="distance"]'),
      type: overlay.querySelector('[data-field="type"]'),
      duration: overlay.querySelector('[data-field="duration"]'),
      link: overlay.querySelector(".ruta-modal-js__link"),
    };
  }
})();
