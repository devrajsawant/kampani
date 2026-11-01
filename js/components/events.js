export function initializeEvents() {
  const API_URL =
    "https://script.google.com/macros/s/AKfycbzJkZKLsfLtODTTviE20IwpIJXwK9KpoLnEjgTGx9DfhO5zWWCEdXv3OkMNz8Eq6X6-yw/exec";

  const viewport = document.getElementById("kcEventsViewport");
  const track = document.getElementById("kcEventsTrack");
  const status = document.getElementById("kcEventsStatus");
  const content = document.getElementById("kcEventsContent");
  const progress = document.getElementById("kcEventsProgress");
  const counter = document.getElementById("kcEventsCounter");
  const prevBtn = document.getElementById("kcEventsPrev");
  const nextBtn = document.getElementById("kcEventsNext");

  if (!viewport || !track) return;

  let events = [];
  let loadingFinished = false;

const AUTO_SLIDE_DELAY = 2000;
const LAST_SLIDE_DELAY = 4000;

let autoSlideTimer = null;

function stopAutoSlide() {
  if (autoSlideTimer !== null) {
    clearTimeout(autoSlideTimer);
    autoSlideTimer = null;
  }
}

function startAutoSlide() {
  stopAutoSlide();

  if (events.length <= visibleCount()) return;

  function scheduleNext() {
    const maxIndex = Math.max(
      0,
      events.length - visibleCount()
    );

    const atLastSlide = currentIndex() >= maxIndex;

    autoSlideTimer = setTimeout(function () {
      if (document.hidden) {
        scheduleNext();
        return;
      }

      if (atLastSlide) {
        scrollToIndex(0);
      } else {
        scrollToIndex(currentIndex() + 1);
      }

      scheduleNext();
    }, atLastSlide ? LAST_SLIDE_DELAY : AUTO_SLIDE_DELAY);
  }

  scheduleNext();
}

  // Convert YYYY-MM to display month and year.
  function formatEventDate(value) {
    const match = String(value || "")
      .match(/^(\d{4})-(0[1-9]|1[0-2])$/);

    if (!match) {
      return { month: "TBA", year: "" };
    }

    const monthNames = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
    ];

    return {
      month: monthNames[Number(match[2]) - 1],
      year: match[1]
    };
  }

  // Allow only public HTTP(S) image URLs.
  function getImageUrl(value) {
    const raw = String(value || "").trim();

    if (!raw) return "";

    try {
      const url = new URL(raw);
      return ["https:", "http:"].includes(url.protocol)
        ? url.href
        : "";
    } catch (_) {
      return "";
    }
  }

  function createCard(event) {
    const card = document.createElement("article");
    card.className = "kc-event-card";

    const imageUrl = getImageUrl(event.image);

    if (imageUrl) {
      const image = new Image();

      image.onload = function () {
        const bg = document.createElement("div");
        bg.className = "kc-event-card-image";
        bg.style.backgroundImage = 'url("' +
          imageUrl.replace(/"/g, "%22") + '")';

        const overlay = document.createElement("div");
        overlay.className = "kc-event-card-overlay";

        card.prepend(overlay);
        card.prepend(bg);
        card.classList.add("has-image");
      };

      image.src = imageUrl;
    }

    const date = formatEventDate(event.event_date);

    const dateWrapper = document.createElement("div");
    dateWrapper.className = "kc-event-date";

    const month = document.createElement("span");
    month.className = "kc-event-month";
    month.textContent = date.month;

    const year = document.createElement("span");
    year.className = "kc-event-year";
    year.textContent = date.year;

    dateWrapper.append(month, year);

    const title = document.createElement("h3");
    title.className = "kc-event-title";
    title.textContent = String(event.title || "Untitled Event");

    card.append(dateWrapper, title);

    return card;
  }

  function visibleCount() {
    return window.matchMedia("(max-width: 650px)").matches
      ? 1
      : 2;
  }

  function currentIndex() {
    const firstCard = track.querySelector(".kc-event-card");

    if (!firstCard) return 0;

    const gap = parseFloat(
      window.getComputedStyle(track).gap
    ) || 0;

    const step = firstCard.getBoundingClientRect().width + gap;

    if (!step) return 0;

    return Math.min(
      events.length - 1,
      Math.max(0, Math.round(viewport.scrollLeft / step))
    );
  }

function updateControls() {
  if (!events.length) return;

  const count = visibleCount();
  const maxIndex = Math.max(0, events.length - count);
  const index = Math.min(currentIndex(), maxIndex);

  const start = index + 1;
  const end = Math.min(events.length, index + count);

  counter.textContent =
    start + "–" + end + " / " + events.length + " events";

  prevBtn.disabled = viewport.scrollLeft <= 2;

  nextBtn.disabled =
    viewport.scrollLeft >=
    viewport.scrollWidth - viewport.clientWidth - 2;

  // Sliding indicator: fixed-size thumb.
  const visibleRatio = Math.min(
    1,
    viewport.clientWidth / viewport.scrollWidth
  );

  const thumbWidth = visibleRatio * 100;

  const maxScroll = Math.max(
    0,
    viewport.scrollWidth - viewport.clientWidth
  );

  const scrollRatio = maxScroll > 0
    ? viewport.scrollLeft / maxScroll
    : 0;

  progress.style.width = thumbWidth + "%";

  progress.style.transform =
    "translateX(" +
    (scrollRatio * (100 / visibleRatio - 100)) +
    "%)";
}

  function scrollToIndex(index) {
    const cards = track.querySelectorAll(".kc-event-card");

    if (!cards.length) return;

    const maxIndex = Math.max(
      0,
      events.length - visibleCount()
    );

    const targetIndex = Math.min(
      maxIndex,
      Math.max(0, index)
    );

    const target = cards[targetIndex];

    viewport.scrollTo({
      left: target.offsetLeft - track.offsetLeft,
      behavior: window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches ? "auto" : "smooth"
    });
  }

  prevBtn.addEventListener("click", function () {
    scrollToIndex(currentIndex() - 1);
  });

  nextBtn.addEventListener("click", function () {
    scrollToIndex(currentIndex() + 1);
  });

  viewport.addEventListener("scroll", updateControls, {
    passive: true
  });

  window.addEventListener("resize", updateControls);

  function renderEvents(data) {
    loadingFinished = true;

    if (!data || !data.success || !Array.isArray(data.events)) {
      status.textContent =
        "Unable to load events right now.";
      return;
    }

    events = data.events;
    track.replaceChildren();

    if (!events.length) {
      status.textContent =
        "No events are currently available.";
      return;
    }

    const fragment = document.createDocumentFragment();

    events.forEach(function (event) {
      fragment.appendChild(createCard(event));
    });

    track.appendChild(fragment);

    status.hidden = true;
    content.hidden = false;

requestAnimationFrame(function () {
  updateControls();
  startAutoSlide();
});
  }

  // JSONP request: compatible with Zoho Sites.
  const callbackName =
    "kcEventsCallback_" +
    Math.random().toString(36).slice(2);

  const script = document.createElement("script");

  const timeout = setTimeout(function () {
    if (!loadingFinished) {
      status.textContent =
        "Events are taking longer than expected to load.";
      script.remove();
      delete window[callbackName];
    }
  }, 15000);

  window[callbackName] = function (data) {
    clearTimeout(timeout);
    script.remove();
    delete window[callbackName];
    renderEvents(data);
  };

  script.onerror = function () {
    clearTimeout(timeout);
    script.remove();
    delete window[callbackName];
    status.textContent =
      "Unable to connect to the events service.";
  };

  script.src =
    API_URL +
    "?type=events&callback=" +
    encodeURIComponent(callbackName);

  document.head.appendChild(script);
}
