export function initializeCareers() {
  const API_URL =
    "https://script.google.com/macros/s/AKfycbzJkZKLsfLtODTTviE20IwpIJXwK9KpoLnEjgTGx9DfhO5zWWCEdXv3OkMNz8Eq6X6-yw/exec";

  const list = document.getElementById("kcJobsList");
  if (!list) return;

  function createMeta(labelText, valueText) {
    const item = document.createElement("div");
    item.className = "kc-job-meta-item";

    const label = document.createElement("strong");
    label.textContent = labelText + ": ";

    item.append(
      label,
      document.createTextNode(String(valueText || "Not specified"))
    );

    return item;
  }

  function createJobCard(job) {
    const card = document.createElement("article");
    card.className = "kc-job-card";

    const label = document.createElement("span");
    label.className = "kc-job-label";
    label.textContent = "CURRENT OPENING";

    const title = document.createElement("h3");
    title.className = "kc-job-title";
    title.textContent = job.job_title || "";

    const meta = document.createElement("div");
    meta.className = "kc-job-meta";

    meta.append(
      createMeta("Location", job.location),
      createMeta("Experience", job.experience)
    );

    const bottom = document.createElement("div");
    bottom.className = "kc-job-bottom";

    const link = document.createElement("a");
    link.className = "kc-job-link";
    link.href =
      "job-details/?id=" + encodeURIComponent(job.id);

    const linkText = document.createElement("span");
    linkText.textContent = "Explore Role";

    const arrow = document.createElement("span");
    arrow.className = "kc-job-link-arrow";
    arrow.textContent = "↗";

    // Keep the text link keyboard-accessible and make the entire card clickable.
    card.style.cursor = "pointer";
    card.addEventListener("click", function (event) {
      if (event.target.closest("a") || window.getSelection()?.toString()) return;
      window.location.assign(link.href);
    });

    link.append(linkText, arrow);
    bottom.appendChild(link);

    card.append(label, title, meta, bottom);
    return card;
  }

  window.kcJobsCallback = function(data) {
    list.replaceChildren();

    if (!data || !data.success || !Array.isArray(data.jobs)) {
      const message = document.createElement("div");
      message.className = "kc-careers-message";
      message.textContent = "Unable to load job openings.";
      list.appendChild(message);
      return;
    }

    if (!data.jobs.length) {
      const message = document.createElement("div");
      message.className = "kc-careers-message";
      message.textContent =
        "There are no open positions at the moment. Please check back soon.";
      list.appendChild(message);
      return;
    }

    data.jobs.forEach(job => {
      list.appendChild(createJobCard(job));
    });
  };

  const script = document.createElement("script");

  script.src =
    API_URL + "?type=jobs&callback=kcJobsCallback";

  script.onerror = function() {
    list.textContent = "Unable to load job openings.";
  };

  document.head.appendChild(script);
}
