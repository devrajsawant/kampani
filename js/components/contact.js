export function initializeContact() {
  const API_URL =
    "https://script.google.com/macros/s/AKfycbzJkZKLsfLtODTTviE20IwpIJXwK9KpoLnEjgTGx9DfhO5zWWCEdXv3OkMNz8Eq6X6-yw/exec";

  const form = document.getElementById("kcContactForm");
  const button = document.getElementById("kcContactSubmit");
  const feedback = document.getElementById("kcContactFeedback");

  if (!form || !button || !feedback) return;

  // Prevent duplicate event listeners if the snippet runs more than once.
  if (form.dataset.contactInitialized === "true") return;
  form.dataset.contactInitialized = "true";

  let submitting = false;

  function checkStatus(nonce) {
    return new Promise(function (resolve, reject) {
      const callback =
        "kcContactStatus_" +
        Math.random().toString(36).slice(2);

      const script = document.createElement("script");
      let finished = false;
      let timeout;

      function cleanup() {
        clearTimeout(timeout);
        script.remove();
        delete window[callback];
      }

      window[callback] = function (data) {
        if (finished) return;
        finished = true;
        cleanup();
        resolve(data);
      };

      script.onerror = function () {
        if (finished) return;
        finished = true;
        cleanup();
        reject(new Error("Status request failed"));
      };

      timeout = setTimeout(function () {
        if (finished) return;
        finished = true;
        cleanup();
        reject(new Error("Status request timed out"));
      }, 8000);

      script.src =
        API_URL +
        "?type=contact-status" +
        "&nonce=" + encodeURIComponent(nonce) +
        "&callback=" + encodeURIComponent(callback) +
        "&_=" + Date.now();

      document.head.appendChild(script);
    });
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (submitting || !form.reportValidity()) return;

    submitting = true;
    button.disabled = true;
    button.textContent = "Sending...";
    feedback.textContent = "";

    const nonce =
      Date.now().toString(36) +
      Math.random().toString(36).slice(2);

    const iframe = document.createElement("iframe");
    iframe.name = "kcContactFrame_" + nonce;
    iframe.style.display = "none";
    iframe.setAttribute("aria-hidden", "true");

    const postForm = document.createElement("form");
    postForm.method = "POST";
    postForm.action = API_URL + "?type=contact";
    postForm.target = iframe.name;
    postForm.style.display = "none";

    const fields = {
      nonce: nonce,
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim()
    };

    Object.entries(fields).forEach(function (entry) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = entry[0];
      input.value = entry[1];
      postForm.appendChild(input);
    });

    document.body.appendChild(iframe);
    document.body.appendChild(postForm);

    try {
      // Submit exactly once.
      postForm.submit();

      let result = null;

      // Poll the backend for submission status.
      for (let attempt = 0; attempt < 12; attempt++) {
        await delay(1500);

        try {
          const response = await checkStatus(nonce);

          if (
            response.status === "saved" ||
            response.status === "error"
          ) {
            result = response;
            break;
          }
        } catch (error) {
          console.warn("Contact status check:", error);
        }
      }

      if (result && result.status === "saved") {
        feedback.textContent =
          "Thank you! Your message has been sent successfully.";
        feedback.style.color = "#286b47";
        form.reset();

      } else if (result && result.status === "error") {
        feedback.textContent =
          result.message || "Unable to send your message.";
        feedback.style.color = "#b04747";

      } else {
        feedback.textContent =
          "We couldn't confirm your submission. " +
          "Please check before sending again.";
        feedback.style.color = "#b04747";
      }

    } catch (error) {
      console.error("Contact submission error:", error);

      feedback.textContent =
        "Unable to submit the form. Please try again.";
      feedback.style.color = "#b04747";

    } finally {
      submitting = false;
      button.disabled = false;
      button.innerHTML =
        'Send Message <span aria-hidden="true">↗</span>';

      postForm.remove();
      iframe.remove();
    }
  });
}
