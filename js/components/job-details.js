export function initializeJobDetails() {
  const API_URL =
    "https://script.google.com/macros/s/AKfycbzJkZKLsfLtODTTviE20IwpIJXwK9KpoLnEjgTGx9DfhO5zWWCEdXv3OkMNz8Eq6X6-yw/exec";

  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("id");

  const loading = document.getElementById("kcJdLoading");
  const content = document.getElementById("kcJdContent");
  const form = document.getElementById("kcJdForm");
  const submitBtn = document.getElementById("kcJdSubmit");
  const submitText = document.getElementById("kcJdSubmitText");
  const formStatus = document.getElementById("kcJdFormStatus");

  if (!loading || !content || !form || !submitBtn || !submitText || !formStatus) return;

  let currentJob = null;
  let submitting = false;
  if (form.dataset.initialized === "true") return;
  form.dataset.initialized = "true";

  function setText(id, value) {
    document.getElementById(id).textContent =
      String(value || "Not specified");
  }

  function showFormStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className =
      "kc-jd-form-status " + (type || "");
  }

  if (!jobId) {
    loading.textContent =
      "No job selected. Please return to Careers.";
    return;
  }

  // Load the job using JSONP.
  const callbackName =
    "kcJdCallback_" + Math.random().toString(36).slice(2);

  const loader = document.createElement("script");

  window[callbackName] = function (data) {
    clearTimeout(timeout);
    delete window[callbackName];
    loader.remove();

    if (!data || !data.job) {
      loading.textContent =
        "This job opening is no longer available.";
      return;
    }

    currentJob = data.job;
    document.title = String(currentJob.job_title || "Career Opportunity") + " | Kampani Capital";

    setText("kcJdTitle", currentJob.job_title);
    setText("kcJdLocation", currentJob.location);
    setText("kcJdExperience", currentJob.experience);
    setText(
      "kcJdLookingFor",
      currentJob.who_we_are_looking_for
    );
    setText(
      "kcJdOffer",
      currentJob.what_we_will_offer
    );

    loading.hidden = true;
    content.hidden = false;
  };

  loader.src =
    API_URL +
    "?type=jobs&id=" + encodeURIComponent(jobId) +
    "&callback=" + encodeURIComponent(callbackName);

  const timeout = setTimeout(function () {
    loader.remove();
    delete window[callbackName];
    loading.textContent = "Job details are taking longer than expected to load. Please refresh to try again.";
  }, 15000);

  loader.onerror = function () {
    clearTimeout(timeout);
    loader.remove();
    delete window[callbackName];
    loading.textContent =
      "Unable to load job details. Please try again.";
  };

  document.head.appendChild(loader);

  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();

      reader.onload = function () {
        const result = String(reader.result || "");
        resolve(result.split(",")[1] || "");
      };

      reader.onerror = function () {
        reject(new Error("Unable to read resume."));
      };

      reader.readAsDataURL(file);
    });
  }

  function createNonce() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    return Array.from(bytes, byte =>
      byte.toString(16).padStart(2, "0")
    ).join("");
  }

  function checkApplicationStatus(nonce) {
    return new Promise(function(resolve, reject) {
      const callback = "kcApplicationStatus_" + Math.random().toString(36).slice(2);
      const script = document.createElement("script");
      let finished = false;
      const timeout = setTimeout(() => finish(new Error("Status timeout")), 10000);
      function finish(error, data) {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        script.remove();
        delete window[callback];
        error ? reject(error) : resolve(data);
      }
      window[callback] = data => finish(null, data);
      script.onerror = () => finish(new Error("Status request failed"));
      script.src = API_URL + "?type=application-status&nonce=" +
        encodeURIComponent(nonce) + "&callback=" + encodeURIComponent(callback) +
        "&_=" + Date.now();
      document.head.appendChild(script);
    });
  }

  function submitApplication(payload) {
    const iframe = document.createElement("iframe");
    iframe.name = "kcApplication_" + payload.nonce;
    iframe.style.display = "none";
    iframe.setAttribute("aria-hidden", "true");
    const postForm = document.createElement("form");
    postForm.method = "POST";
    postForm.action = API_URL + "?type=application";
    postForm.target = iframe.name;
    postForm.style.display = "none";
    postForm.acceptCharset = "UTF-8";
    const field = document.createElement("textarea");
    field.name = "payload";
    field.value = JSON.stringify(payload);
    postForm.appendChild(field);
    document.body.append(iframe, postForm);
    postForm.submit(); // Exactly one POST; never retry automatically.
    return {iframe, postForm};
  }

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (submitting || !currentJob) return;
    if (!form.reportValidity()) return;

    const file = document.getElementById("kcJdResume").files[0];

    if (!file) {
      showFormStatus("Please upload your resume.", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showFormStatus(
        "Resume must be 2 MB or smaller.",
        "error"
      );
      return;
    }

    const extension =
      file.name.split(".").pop().toLowerCase();

    const types = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };

    if (!types[extension]) {
      showFormStatus(
        "Please upload a PDF, DOC or DOCX resume.",
        "error"
      );
      return;
    }

    submitting = true;
    submitBtn.disabled = true;
    submitText.textContent = "Submitting...";
    showFormStatus(
      "Uploading resume and saving application...",
      ""
    );

    try {

      const payload = {
        nonce: createNonce(),
        job_id: currentJob.id,
        job_title: currentJob.job_title,
        resume_name: file.name,
        resume_type: types[extension],
        resume_base64: await readFileAsBase64(file),
        name: document.getElementById("kcJdName").value.trim(),
        email: document.getElementById("kcJdEmail").value.trim(),
        phone: document.getElementById("kcJdPhone").value.trim(),
        message: document.getElementById("kcJdMessage").value.trim(),
      };

      const transport = submitApplication(payload);
      let result = null;
      try {
        for (let attempt = 0; attempt < 30; attempt++) {
          await delay(2000);
          try {
            const status = await checkApplicationStatus(payload.nonce);
            if (status.status === "saved" || status.status === "error") {
              result = status;
              break;
            }
          } catch (error) {
            console.warn("Application status check:", error);
          }
        }
      } finally {
        transport.postForm.remove();
        transport.iframe.remove();
      }
      if (!result) throw new Error(
        "Submission status could not be confirmed. Please contact us before trying again."
      );
      if (result.status === "error") throw new Error(result.message || "Submission failed.");
      form.reset();
      showFormStatus(
        "Thank you! Your application has been submitted successfully.",
        "success"
      );

    } catch (error) {
      showFormStatus(
        error.message ||
        "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      submitting = false;
      submitBtn.disabled = false;
      submitText.textContent = "Submit Application";
    }
  });
}
