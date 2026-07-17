const state = {
  editMode: false,
  events: JSON.parse(localStorage.getItem("harmonia-events") || "null") || [
    {
      date: "September 2026",
      title: "Community Conversation",
      description: "A facilitated gathering centered on listening, shared experience, and practical next steps."
    },
    {
      date: "Fall 2026",
      title: "Harmonia Service Day",
      description: "Students, partners, and neighbors working together on a community-defined need."
    },
    {
      date: "Coming Soon",
      title: "The Harmonia Gala",
      description: "An evening recognizing people and organizations creating meaningful connection."
    }
  ],
  photos: JSON.parse(localStorage.getItem("harmonia-photos") || "[]")
};

const pages = [...document.querySelectorAll(".page")];
const home = document.getElementById("home");
const backButton = document.getElementById("backButton");

const editNotice = document.getElementById("editNotice");

function openPage(id) {
  home.classList.add("leaving");
  setTimeout(() => {
    home.classList.remove("active", "leaving");
    pages.forEach(page => page.classList.toggle("active", page.id === id));
    document.body.classList.add("internal-page");
    backButton.hidden = false;
    window.scrollTo(0, 0);
  }, 260);
}

function showHome() {
  pages.forEach(page => page.classList.remove("active"));
  document.body.classList.remove("internal-page");
  home.classList.add("active");
  backButton.hidden = true;
  window.scrollTo(0, 0);
}

document.querySelectorAll(".panel").forEach(panel => {
  panel.addEventListener("click", () => openPage(panel.dataset.target));
});

backButton.addEventListener("click", showHome);
document.getElementById("homeButton").addEventListener("click", showHome);



  renderEvents();
  renderPhotos();


function saveEditable(event) {
  localStorage.setItem(`harmonia-${event.currentTarget.dataset.editable}`, event.currentTarget.innerHTML);
}

document.querySelectorAll("[data-editable]").forEach(el => {
  const saved = localStorage.getItem(`harmonia-${el.dataset.editable}`);
  if (saved) el.innerHTML = saved;
});



function renderEvents() {
  const grid = document.getElementById("eventGrid");
  grid.innerHTML = "";
  state.events.forEach((event, index) => {
    const card = document.createElement("article");
    card.className = "event-card";
    card.innerHTML = `
      <div>
        <div class="event-date">${event.date}</div>
        <h2>${event.title}</h2>
        <p>${event.description}</p>
      </div>
      ${state.editMode ? `<button class="secondary-button" data-remove-event="${index}">Remove event</button>` : ""}
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll("[data-remove-event]").forEach(button => {
    button.addEventListener("click", () => {
      state.events.splice(Number(button.dataset.removeEvent), 1);
      localStorage.setItem("harmonia-events", JSON.stringify(state.events));
      renderEvents();
    });
  });
}

document.getElementById("addEvent").addEventListener("click", () => {
  const date = prompt("Event date or timeframe:");
  if (!date) return;
  const title = prompt("Event title:");
  if (!title) return;
  const description = prompt("Short description:") || "";
  state.events.push({date, title, description});
  localStorage.setItem("harmonia-events", JSON.stringify(state.events));
  renderEvents();
});

function renderPhotos() {
  const grid = document.getElementById("galleryGrid");
  grid.innerHTML = "";

  if (!state.photos.length) {
    const placeholder = document.createElement("div");
    placeholder.className = "gallery-item";
    placeholder.innerHTML = `<div style="height:100%;display:grid;place-items:center;padding:2rem;text-align:center;">Photos from events, service projects, and conversations will appear here.</div>`;
    grid.appendChild(placeholder);
    return;
  }

  state.photos.forEach((src, index) => {
    const item = document.createElement("figure");
    item.className = "gallery-item";
    item.innerHTML = `
      <img src="${src}" alt="Harmonia Project gallery image ${index + 1}" />
      ${state.editMode ? `<button class="remove-control" data-remove-photo="${index}" aria-label="Remove photo">×</button>` : ""}
    `;
    grid.appendChild(item);
  });

  grid.querySelectorAll("[data-remove-photo]").forEach(button => {
    button.addEventListener("click", () => {
      state.photos.splice(Number(button.dataset.removePhoto), 1);
      localStorage.setItem("harmonia-photos", JSON.stringify(state.photos));
      renderPhotos();
    });
  });
}

document.getElementById("photoInput").addEventListener("change", event => {
  [...event.target.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      state.photos.push(e.target.result);
      try {
        localStorage.setItem("harmonia-photos", JSON.stringify(state.photos));
      } catch {
        alert("The browser's local storage is full. A deployed version would store images in cloud storage.");
        state.photos.pop();
      }
      renderPhotos();
    };
    reader.readAsDataURL(file);
  });
  event.target.value = "";
});

document.getElementById("contactForm").addEventListener("submit", async event => {
  event.preventDefault();

  const form = event.currentTarget;
  const formStatus = document.getElementById("formStatus");
  const submitButton = form.querySelector('button[type="submit"]');
  const config = window.HARMONIA_CONFIG || {};
  const endpoint = config.formspreeEndpoint || "";

  if (!endpoint || endpoint.includes("PASTE_")) {
    formStatus.textContent = "The contact inbox has not been connected yet.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Sending…";
  formStatus.textContent = "";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: new FormData(form),
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      throw new Error("Submission failed");
    }

    form.reset();
    formStatus.textContent = "Thank you. Your inquiry has been sent to the Harmonia Project.";
    trackHarmoniaEvent("contact_form_submitted");
  } catch (error) {
    const fallback = config.contactEmail && !config.contactEmail.includes("PASTE_")
      ? ` Please email ${config.contactEmail}.`
      : "";
    formStatus.textContent = `We could not send your inquiry.${fallback}`;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send inquiry";
  }
});

document.getElementById("donateButton").addEventListener("click", () => {
  const config = window.HARMONIA_CONFIG || {};
  const paymentLink = config.stripePaymentLink || "";

  if (!paymentLink || paymentLink.includes("PASTE_")) {
    alert("The secure payment page has not been connected yet.");
    return;
  }

  trackHarmoniaEvent("support_button_clicked");
  window.open(paymentLink, "_blank", "noopener,noreferrer");
});

document.getElementById("year").textContent = new Date().getFullYear();

renderEvents();
renderPhotos();


function loadCloudflareAnalytics() {
  const config = window.HARMONIA_CONFIG || {};
  const token = config.cloudflareAnalyticsToken || "";

  if (!token || token.includes("PASTE_")) return;

  const beacon = document.createElement("script");
  beacon.defer = true;
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.dataset.cfBeacon = JSON.stringify({ token });
  document.head.appendChild(beacon);
}

function trackHarmoniaEvent(eventName, details = {}) {
  window.harmoniaEventLog = window.harmoniaEventLog || [];
  window.harmoniaEventLog.push({
    event: eventName,
    details,
    timestamp: new Date().toISOString()
  });

  // Cloudflare Web Analytics automatically measures visits and page activity.
  // This local event log is retained for future custom analytics integration.
}

document.querySelectorAll(".panel").forEach(panel => {
  panel.addEventListener("click", () => {
    trackHarmoniaEvent("section_opened", { section: panel.dataset.target });
  });
});

document.getElementById("privacyButton")?.addEventListener("click", () => {
  alert("Harmonia uses privacy-focused website analytics. Personal contact information is collected only when you voluntarily submit a form or payment.");
});

loadCloudflareAnalytics();
async function loadEditableContent() {
  try {
    const response = await fetch("/content/site.json?v=1");

    if (!response.ok) {
      throw new Error("Could not load site content.");
    }

    const content = await response.json();

    const editableElements = document.querySelectorAll("[data-content]");

    editableElements.forEach((element) => {
      const key = element.dataset.content;

      if (content[key]) {
        element.textContent = content[key];
      }
    });
  } catch (error) {
    console.error("Harmonia content error:", error);
  }
}

loadEditableContent();