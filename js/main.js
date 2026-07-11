
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

  const DEFAULT_BANNER_IMAGES = [
    "img/rutas/chachapoyas.png",
    "img/rutas/kuelap.png",
    "img/banners/Pedro_Ruiz.png",
    "img/rutas/Luya.png",
    "img/rutas/Pomacochas.png",
    "img/rutas/bagua.png",
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
    if (/^(https?:|data:|\/)/.test(path)) {
      return path;
    }

    return `${isNestedRoutePage() ? "../" : ""}${path}`;
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
    return Array.from(new Set([firstImage, ...DEFAULT_BANNER_IMAGES].filter(Boolean))).map(resolveAssetPath);
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
