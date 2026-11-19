document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggle.textContent = isOpen ? "Close Menu" : "Open Menu";
    });
  }

  initCarousels();
  initLightbox();
});

function initLightbox() {
  var overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";
  var img = document.createElement("img");
  var closeBtn = document.createElement("button");
  closeBtn.className = "lightbox-close";
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "×";
  overlay.appendChild(img);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);

  function close() {
    overlay.classList.remove("open");
    img.src = "";
  }

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay || e.target === closeBtn) close();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
  });

  document.addEventListener("click", function (e) {
    var target = e.target;
    if (target.tagName !== "IMG") return;
    if (!target.closest(".page-content")) return;
    if (target.closest("a")) return;
    if (target.closest('[data-layout="carousel"]')) return;
    if (target.hasAttribute("data-no-zoom")) return; // turned off in the editor ("Click to enlarge")
    img.src = target.currentSrc || target.src;
    img.alt = target.alt || "";
    overlay.classList.add("open");
  });
}

function initCarousels() {
  document.querySelectorAll('[data-layout="carousel"]').forEach(function (container) {
    if (container.dataset.carouselInit) return;
    container.dataset.carouselInit = "true";

    var slides = Array.prototype.filter.call(container.children, function (el) {
      return el.tagName === "IMG" || el.tagName === "A";
    });
    if (!slides.length) return;

    var track = document.createElement("div");
    track.className = "carousel-track";
    slides.forEach(function (s) { track.appendChild(s); });
    container.appendChild(track);

    if (slides.length < 2) return;

    var index = 0;
    function update() {
      var gap = parseFloat(getComputedStyle(track).gap) || 0;
      var step = slides[0].getBoundingClientRect().width + gap;
      track.style.transform = "translateX(-" + (index * step) + "px)";
      if (count) count.textContent = (index + 1) + " / " + slides.length;
    }
    var count = null;

    slides.forEach(function (slide) {
      slide.addEventListener("click", function () {
        index = (index + 1) % slides.length;
        update();
      });
    });

    var prev = document.createElement("button");
    prev.className = "carousel-nav carousel-nav-prev";
    prev.type = "button";
    prev.setAttribute("aria-label", "Previous image");
    prev.textContent = "‹";
    prev.addEventListener("click", function () {
      index = (index - 1 + slides.length) % slides.length;
      update();
    });

    var next = document.createElement("button");
    next.className = "carousel-nav carousel-nav-next";
    next.type = "button";
    next.setAttribute("aria-label", "Next image");
    next.textContent = "›";
    next.addEventListener("click", function () {
      index = (index + 1) % slides.length;
      update();
    });

    var count = document.createElement("div");
    count.className = "carousel-count";

    // swipe left/right on phones
    var touchX = null;
    container.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    container.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) < 40) return;
      index = dx < 0 ? (index + 1) % slides.length : (index - 1 + slides.length) % slides.length;
      update();
    });

    container.appendChild(prev);
    container.appendChild(next);
    container.appendChild(count);
    window.addEventListener("resize", update);
    update();
  });
}

// Home hero fills the screen under the header: share the header's height with the CSS
(function () {
  var header = document.querySelector(".site-header");
  if (!header || !document.querySelector(".hero")) return;
  function setH() { document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px"); }
  setH();
  window.addEventListener("resize", setH);
})();

// Home hero: a blurred, enlarged copy of the photo fills the space around it,
// so the whole photo shows with no white edges on any screen shape
(function () {
  var hero = document.querySelector(".hero");
  if (!hero) return;
  var back = document.createElement("div");
  back.className = "hero-backdrop";
  back.setAttribute("aria-hidden", "true");
  hero.insertBefore(back, hero.firstChild);
  var last = null;
  function setRatio() {
    var img = hero.querySelector("img");
    if (img && img.naturalWidth && img.naturalHeight) {
      document.documentElement.style.setProperty("--hero-ratio", (img.naturalWidth / img.naturalHeight).toFixed(4));
    }
  }
  hero.addEventListener("load", setRatio, true);
  function setSize() {
    var root = document.documentElement.style;
    root.setProperty("--hero-w", hero.clientWidth + "px");
    root.setProperty("--hero-h", hero.clientHeight + "px");
  }
  setSize();
  if (window.ResizeObserver) new ResizeObserver(setSize).observe(hero);
  else window.addEventListener("resize", setSize);
  function sync() {
    setRatio();
    var img = hero.querySelector("img");
    var src = img ? (img.currentSrc || img.src) : "";
    if (src === last) return;
    last = src;
    back.style.backgroundImage = src ? 'url("' + src.replace(/"/g, '\\"') + '")' : "";
  }
  sync();
  // the site editor can swap the photo
  new MutationObserver(sync).observe(hero, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
})();
