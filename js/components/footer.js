export function initializeFooter() {
  const year = document.getElementById("kcFooterYear");
  if (year) year.textContent = new Date().getFullYear();
}
