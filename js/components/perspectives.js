export function initializePerspectives() {
  const API_URL =
    "https://script.google.com/macros/s/AKfycbzJkZKLsfLtODTTviE20IwpIJXwK9KpoLnEjgTGx9DfhO5zWWCEdXv3OkMNz8Eq6X6-yw/exec";

  const root = document.getElementById("ceos-desk");
  if (!root) return;

  const viewport = root.querySelector("#kcBlogsViewport");
  const track = root.querySelector("#kcBlogGrid");
  const status = root.querySelector("#kcBlogsStatus");
  const slider = root.querySelector("#kcBlogsSlider");
  const progress = root.querySelector("#kcBlogsProgress");
  const counter = root.querySelector("#kcBlogsCounter");
  const prevBtn = root.querySelector("#kcBlogsPrev");
  const nextBtn = root.querySelector("#kcBlogsNext");

  if (!viewport || !track || !status || !slider) return;

  const AUTO_SLIDE_DELAY = 3000;
  const LAST_SLIDE_DELAY = 4500;

  let blogs = [];
  let autoTimer = null;
  let isPaused = false;
  let loadingFinished = false;

  function visibleCount() {
    if (window.matchMedia("(max-width: 600px)").matches) {
      return 1;
    }

    if (window.matchMedia("(max-width: 900px)").matches) {
      return 2;
    }

    return 3;
  }

  function getStep() {
    const card = track.querySelector(".kc-perspective-card");
    if (!card) return 0;

    const gap =
      parseFloat(window.getComputedStyle(track).gap) || 0;

    return card.getBoundingClientRect().width + gap;
  }

  function maxIndex() {
    return Math.max(0, blogs.length - visibleCount());
  }

  function currentIndex() {
    const step = getStep();
    if (!step) return 0;

    return Math.min(
      maxIndex(),
      Math.max(0, Math.round(viewport.scrollLeft / step))
    );
  }

  function scrollToIndex(index) {
    const step = getStep();
    if (!step) return;

    const targetIndex = Math.min(
      maxIndex(),
      Math.max(0, index)
    );

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    viewport.scrollTo({
      left: targetIndex * step,
      behavior: reduceMotion ? "auto" : "smooth"
    });
  }

  function updateControls() {
    if (!blogs.length) return;

    const count = Math.min(visibleCount(), blogs.length);
    const index = currentIndex();

    const start = index + 1;
    const end = Math.min(blogs.length, index + count);

    counter.textContent =
      start + "–" + end + " / " +
      blogs.length + " perspectives";

    const maxScroll = Math.max(
      0,
      viewport.scrollWidth - viewport.clientWidth
    );

    prevBtn.disabled = viewport.scrollLeft <= 2;
    nextBtn.disabled =
      viewport.scrollLeft >= maxScroll - 2;

    const visibleRatio = Math.min(
      1,
      viewport.clientWidth / viewport.scrollWidth
    );

    const scrollRatio = maxScroll > 0
      ? viewport.scrollLeft / maxScroll
      : 0;

    progress.style.width =
      (visibleRatio * 100) + "%";

    progress.style.transform =
      "translateX(" +
      (scrollRatio * (100 / visibleRatio - 100)) +
      "%)";
  }

  function stopAutoSlide() {
    if (autoTimer !== null) {
      clearTimeout(autoTimer);
      autoTimer = null;
    }
  }

  function scheduleAutoSlide() {
    stopAutoSlide();

    if (
      isPaused ||
      blogs.length <= visibleCount()
    ) {
      return;
    }

    const atLastSlide =
      currentIndex() >= maxIndex();

    autoTimer = setTimeout(function () {
      autoTimer = null;

      if (isPaused || document.hidden) {
        scheduleAutoSlide();
        return;
      }

      const index = currentIndex();

      if (index >= maxIndex()) {
        scrollToIndex(0);
      } else {
        scrollToIndex(index + 1);
      }

      scheduleAutoSlide();
    }, atLastSlide ? LAST_SLIDE_DELAY : AUTO_SLIDE_DELAY);
  }

  function plainText(value) {
    const element = document.createElement("div");

    element.innerHTML = String(value || "")
      .replace(/<br\s*\/?>/gi, " ");

    return element.textContent || "";
  }

  function formatDate(value) {
    const raw = String(value || "").trim();

    if (!raw) return "";

    const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? new Date(raw + "T12:00:00")
      : new Date(raw);

    if (isNaN(date.getTime())) return raw;

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function createCard(blog) {
    const card = document.createElement("article");
    card.className = "kc-perspective-card";

    const content = document.createElement("div");
    content.className = "kc-perspective-content";

    const meta = document.createElement("div");
    meta.className = "kc-perspective-meta";

    const category = String(
      blog.category || "PERSPECTIVES"
    );

    const date = formatDate(blog.published_date);

    meta.textContent =
      category + (date ? " / " + date : "");

    content.appendChild(meta);

    const title = document.createElement("h3");
    title.className = "kc-perspective-title";
    title.textContent = String(blog.title || "");

    content.appendChild(title);

    const excerpt = document.createElement("p");
    excerpt.className = "kc-perspective-excerpt";

    const description = plainText(
      blog.subtitle || blog.content
    );

    excerpt.textContent =
      description.length > 160
        ? description.slice(0, 157) + "..."
        : description;

    content.appendChild(excerpt);

    const link = document.createElement("a");
    link.className = "kc-perspective-link";
    link.href =
      "blogs/?id=" + encodeURIComponent(blog.id);

    const linkText = document.createElement("span");
    linkText.textContent = "Read perspective";

    const arrow = document.createElement("span");
    arrow.className = "kc-perspective-arrow";
    arrow.textContent = "↗";

    // Keep the text link keyboard-accessible and make the entire card clickable.
    card.style.cursor = "pointer";
    card.addEventListener("click", function (event) {
      if (event.target.closest("a") || window.getSelection()?.toString()) return;
      window.location.assign(link.href);
    });

    link.append(linkText, arrow);
    content.appendChild(link);

    card.appendChild(content);

    return card;
  }

  function renderBlogs(data) {
    loadingFinished = true;

    if (
      !data ||
      !data.success ||
      !Array.isArray(data.blogs)
    ) {
      status.textContent =
        "Unable to load perspectives right now.";
      return;
    }

    // Show ALL blogs returned by Google Sheets
    blogs = data.blogs;

    track.replaceChildren();

    if (!blogs.length) {
      status.textContent =
        "No perspectives published yet.";
      return;
    }

    const fragment =
      document.createDocumentFragment();

    blogs.forEach(function (blog) {
      fragment.appendChild(createCard(blog));
    });

    track.appendChild(fragment);

    status.hidden = true;
    slider.hidden = false;

    requestAnimationFrame(function () {
      updateControls();
      scheduleAutoSlide();
    });
  }

  // Previous and next buttons

  prevBtn.addEventListener("click", function () {
    scrollToIndex(currentIndex() - 1);
    scheduleAutoSlide();
  });

  nextBtn.addEventListener("click", function () {
    scrollToIndex(currentIndex() + 1);
    scheduleAutoSlide();
  });

  // Pause on hover or keyboard focus

  slider.addEventListener("mouseenter", function () {
    isPaused = true;
    stopAutoSlide();
  });

  slider.addEventListener("mouseleave", function () {
    isPaused = false;
    scheduleAutoSlide();
  });

  slider.addEventListener("focusin", function () {
    isPaused = true;
    stopAutoSlide();
  });

  slider.addEventListener("focusout", function (event) {
    if (!slider.contains(event.relatedTarget)) {
      isPaused = false;
      scheduleAutoSlide();
    }
  });

  // Update progress on manual scrolling

  viewport.addEventListener("scroll", updateControls, {
    passive: true
  });

  // Reset timer after manual touch or wheel interaction

  viewport.addEventListener("touchstart", function () {
    stopAutoSlide();
  }, { passive: true });

  viewport.addEventListener("touchend", function () {
    scheduleAutoSlide();
  }, { passive: true });

  viewport.addEventListener("wheel", function () {
    stopAutoSlide();
    scheduleAutoSlide();
  }, { passive: true });

  // Responsive updates

  window.addEventListener("resize", function () {
    const index = currentIndex();
    scrollToIndex(index);
    updateControls();
    scheduleAutoSlide();
  });

  // JSONP request compatible with Zoho Sites

  const callbackName =
    "kcBlogsCallback_" +
    Math.random().toString(36).slice(2);

  const script = document.createElement("script");

  const timeout = setTimeout(function () {
    if (!loadingFinished) {
      status.textContent =
        "Perspectives are taking longer than expected to load.";

      script.remove();
      delete window[callbackName];
    }
  }, 15000);

  window[callbackName] = function (data) {
    clearTimeout(timeout);
    script.remove();
    delete window[callbackName];
    renderBlogs(data);
  };

  script.onerror = function () {
    clearTimeout(timeout);
    script.remove();
    delete window[callbackName];

    status.textContent =
      "Unable to connect to the perspectives service.";
  };

  script.src =
    API_URL +
    "?callback=" +
    encodeURIComponent(callbackName);

  document.head.appendChild(script);
}
