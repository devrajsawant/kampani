export function initializeReader() {
  const API_URL =
    "https://script.google.com/macros/s/AKfycbzJkZKLsfLtODTTviE20IwpIJXwK9KpoLnEjgTGx9DfhO5zWWCEdXv3OkMNz8Eq6X6-yw/exec";

  const params = new URLSearchParams(window.location.search);
  const blogId = params.get("id");

  const loading = document.getElementById("kcReaderLoading");
  const article = document.getElementById("kcReaderArticle");

  if (!loading || !article) return;

  if (!blogId) {
    loading.textContent =
      "No article selected. Please open a perspective from the homepage.";
    return;
  }

  function formatDate(value) {
    const date = new Date(String(value) + "T12:00:00");

    if (isNaN(date.getTime())) return String(value || "");

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function renderContent(value) {
    const container = document.getElementById("kcReaderBody");

    const text = String(value || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/\r\n/g, "\n");

    const paragraphs = text.split(/\n\s*\n/);

    container.replaceChildren();

    paragraphs.forEach(part => {
      if (!part.trim()) return;

      const p = document.createElement("p");
      p.textContent = part.trim();
      p.style.whiteSpace = "pre-line";
      container.appendChild(p);
    });
  }

  window.kcReaderCallback = function (data) {
    clearTimeout(timeout);
    script.remove();
    delete window.kcReaderCallback;
    if (!data || !data.success || !data.blog) {
      loading.textContent = "Article not found or not published.";
      return;
    }

    const blog = data.blog;

    document.getElementById("kcReaderTitle").textContent =
      String(blog.title || "");

    document.getElementById("kcReaderSubtitle").textContent =
      String(blog.subtitle || "");

    document.getElementById("kcReaderMeta").textContent =
      String(blog.category || "PERSPECTIVES") +
      " / " + formatDate(blog.published_date);

    document.getElementById("kcReaderAuthor").textContent =
      String(blog.author || "Kampani Capital");

    const imageUrl = String(blog.image || "").trim();

    if (/^https:\/\//i.test(imageUrl)) {
      const image = document.getElementById("kcReaderImage");
      image.src = imageUrl;
      image.alt = String(blog.title || "");

      document.getElementById("kcReaderCover").hidden = false;
    }

    renderContent(blog.content);

    document.title =
      String(blog.title || "Blog") + " | Kampani Capital";

    loading.hidden = true;
    article.hidden = false;
  };

  const script = document.createElement("script");

  script.src =
    API_URL +
    "?id=" + encodeURIComponent(blogId) +
    "&callback=kcReaderCallback";

  const timeout = setTimeout(function () {
    script.remove();
    delete window.kcReaderCallback;
    loading.textContent = "The article is taking longer than expected to load. Please refresh to try again.";
  }, 15000);

  script.onerror = function () {
    clearTimeout(timeout);
    script.remove();
    delete window.kcReaderCallback;
    loading.textContent = "Unable to load the article.";
  };

  document.head.appendChild(script);
}
