export function initializeNetwork() {

  var root = document.getElementById('kc-network');

  if (!root || root.dataset.initialized === 'true') {
    return;
  }

  root.dataset.initialized = 'true';

  var slider = root.querySelector('.kc-slider');

  var slides = Array.from(
    root.querySelectorAll('.kc-slide')
  );

  var dotsContainer = root.querySelector('.kc-dots');
  var prev = root.querySelector('.kc-prev');
  var next = root.querySelector('.kc-next');

  if (
    !slider ||
    !slides.length ||
    !dotsContainer ||
    !prev ||
    !next
  ) {
    return;
  }

  var current = 0;
  var timer = null;

  // Auto-slide every 2.5 seconds
  var delay = 2500;

  var reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  /* =====================================
     IMAGE ERROR HANDLING
     ===================================== */

  slides.forEach(function (slide) {

    var img = slide.querySelector('img');

    if (!img) return;

    function handleImageError() {
      img.style.display = 'none';

      slide.style.background =
        'linear-gradient(135deg, #263e5c, #102138)';
    }

    img.addEventListener('error', handleImageError);

    // Handle images that failed before
    // the error listener was attached.
    if (img.complete && img.naturalWidth === 0) {
      handleImageError();
    }
  });

  /* =====================================
     GENERATE NAVIGATION DOTS
     ===================================== */

  slides.forEach(function (slide, index) {

    var dot = document.createElement('button');

    dot.type = 'button';
    dot.className = 'kc-dot';

    dot.setAttribute(
      'aria-label',
      'Go to slide ' + (index + 1)
    );

    dot.addEventListener('click', function () {
      goTo(index);
      restart();
    });

    dotsContainer.appendChild(dot);
  });

  var dots = Array.from(
    dotsContainer.querySelectorAll('.kc-dot')
  );

  /* =====================================
     CHANGE SLIDE
     ===================================== */

  function goTo(index) {

    current = (index + slides.length) % slides.length;

    slides.forEach(function (slide, i) {

      var active = i === current;

      slide.classList.toggle('active', active);

      slide.setAttribute(
        'aria-hidden',
        String(!active)
      );
    });

    dots.forEach(function (dot, i) {

      var active = i === current;

      dot.classList.toggle('active', active);

      if (active) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  }

  /* =====================================
     AUTO-SLIDE
     ===================================== */

  function stop() {

    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function start() {

    stop();

    if (
      document.hidden ||
      reducedMotion.matches ||
      slides.length < 2
    ) {
      return;
    }

    timer = setInterval(function () {
      goTo(current + 1);
    }, delay);
  }

  function restart() {
    start();
  }

  /* =====================================
     PREVIOUS / NEXT
     ===================================== */

  prev.addEventListener('click', function () {
    goTo(current - 1);
    restart();
  });

  next.addEventListener('click', function () {
    goTo(current + 1);
    restart();
  });

  /* =====================================
     PAUSE ON HOVER
     ===================================== */

  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);

  slider.addEventListener('focusin', stop);

  slider.addEventListener('focusout', function (event) {

    if (!slider.contains(event.relatedTarget)) {
      start();
    }
  });

  /* =====================================
     TAB VISIBILITY
     ===================================== */

  document.addEventListener(
    'visibilitychange',
    function () {

      if (document.hidden) {
        stop();
      } else {
        start();
      }
    }
  );

  if (
    typeof reducedMotion.addEventListener === 'function'
  ) {
    reducedMotion.addEventListener('change', start);
  }

  /* =====================================
     INITIALIZE
     ===================================== */

  goTo(0);
  start();

}
