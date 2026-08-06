(function () {
  "use strict";

  const ORG_FALLBACK = "cms9eoh7c0000prxue4fvntqp";
  const defaults = {
    homepage: {
      aboutPanelLabel: "What is\nThe Harmonia\nProject",
      connectPanelLabel: "Connect",
      upcomingPanelLabel: "Upcoming",
      galleryPanelLabel: "Gallery"
    },
    about: {
      title: "What is The Harmonia Project",
      paragraph1: "The Harmonia Project is a philanthropic initiative dedicated to fostering greater community harmony.",
      paragraph2: "Each year, the Harmonia Project focuses on a pressing issue affecting our communities.",
      paragraph3: "Lasting harmony grows through respectful conversation, genuine connection, and collective action."
    },
    connect: {
      title: "Connection is where change begins.",
      paragraph1: "The Harmonia Project exists because meaningful progress starts when people choose to listen, collaborate, and act together.",
      paragraph2: "Every conversation has the potential to spark a new initiative, and every person has something valuable to contribute."
    }
  };

  const org = () => window.HarmoniaApi.getOrganizationId() || ORG_FALLBACK;
  const endpoint = (key, suffix = "") =>
    `/site-content/${encodeURIComponent(key)}${suffix}?organizationId=${encodeURIComponent(org())}`;
  const val = (id) => document.getElementById(id)?.value?.trim() || "";
  const put = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.value = value || "";
  };
  const status = (key, message, bad = false) => {
    const element = document.getElementById(`${key}EditorStatus`);
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("error", bad);
  };

  function collect(key) {
    if (key === "homepage") {
      return {
        aboutPanelLabel: val("homepageAboutLabel"),
        connectPanelLabel: val("homepageConnectLabel"),
        upcomingPanelLabel: val("homepageUpcomingLabel"),
        galleryPanelLabel: val("homepageGalleryLabel")
      };
    }
    if (key === "about") {
      return {
        title: val("aboutEditorTitle"),
        paragraph1: val("aboutEditorParagraph1"),
        paragraph2: val("aboutEditorParagraph2"),
        paragraph3: val("aboutEditorParagraph3")
      };
    }
    return {
      title: val("connectEditorTitle"),
      paragraph1: val("connectEditorParagraph1"),
      paragraph2: val("connectEditorParagraph2")
    };
  }

  async function load(key) {
    const response = await window.HarmoniaApi.request(endpoint(key));
    const source = response.draftData || response.data || {};
    return {
      page: response,
      data: { ...(defaults[key] || {}), ...source }
    };
  }

  async function saveDraft(key, data) {
    return window.HarmoniaApi.request(endpoint(key, "/draft"), {
      method: "PUT",
      body: JSON.stringify({ data })
    });
  }

  async function publishDraft(key) {
    return window.HarmoniaApi.request(endpoint(key, "/publish"), {
      method: "POST"
    });
  }

  async function publishDirect(key, data) {
    return window.HarmoniaApi.request(endpoint(key), {
      method: "PUT",
      body: JSON.stringify({ data })
    });
  }

  async function hydrate(key) {
    try {
      status(key, "Loading draft…");
      const { page, data } = await load(key);
      if (key === "homepage") {
        put("homepageAboutLabel", data.aboutPanelLabel);
        put("homepageConnectLabel", data.connectPanelLabel);
        put("homepageUpcomingLabel", data.upcomingPanelLabel);
        put("homepageGalleryLabel", data.galleryPanelLabel);
      }
      if (key === "about") {
        put("aboutEditorTitle", data.title);
        put("aboutEditorParagraph1", data.paragraph1);
        put("aboutEditorParagraph2", data.paragraph2);
        put("aboutEditorParagraph3", data.paragraph3);
      }
      if (key === "connect") {
        put("connectEditorTitle", data.title);
        put("connectEditorParagraph1", data.paragraph1);
        put("connectEditorParagraph2", data.paragraph2);
      }
      const published = page.publishedAt
        ? `Live version ${page.publishedVersion || 1}`
        : "Not published yet";
      status(key, `${published}. Draft ready.`);
    } catch (error) {
      status(key, error.message, true);
    }
  }

  async function save(key) {
    try {
      status(key, "Saving draft…");
      await saveDraft(key, collect(key));
      status(key, "Draft saved. Preview it before publishing.");
    } catch (error) {
      status(key, error.message, true);
    }
  }

  async function publish(key) {
    try {
      status(key, "Publishing saved draft…");
      await saveDraft(key, collect(key));
      const result = await publishDraft(key);
      status(
        key,
        `Published version ${result.publishedVersion} at ${new Date(result.publishedAt).toLocaleTimeString()}.`
      );
    } catch (error) {
      status(key, error.message, true);
    }
  }

  function ensurePreview() {
    let overlay = document.getElementById("sitePreviewOverlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "sitePreviewOverlay";
    overlay.className = "site-preview-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="site-preview-shell" role="dialog" aria-modal="true">
        <div class="site-preview-toolbar">
          <div><strong>Website Preview</strong><span>Unpublished draft</span></div>
          <button type="button" class="secondary-button" id="closeSitePreview">Close</button>
        </div>
        <div class="site-preview-canvas" id="sitePreviewCanvas"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector("#closeSitePreview").addEventListener("click", () => {
      overlay.hidden = true;
    });
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) overlay.hidden = true;
    });
    return overlay;
  }

  function preview(key) {
    const data = collect(key);
    const overlay = ensurePreview();
    const canvas = overlay.querySelector("#sitePreviewCanvas");
    if (key === "homepage") {
      canvas.innerHTML = `<div class="preview-home-grid">${[
        data.aboutPanelLabel,
        data.connectPanelLabel,
        data.upcomingPanelLabel,
        data.galleryPanelLabel
      ].map((label) => `<article>${escapeHtml(label).replace(/\n/g, "<br>")}</article>`).join("")}</div>`;
    } else {
      const paragraphs = [data.paragraph1, data.paragraph2, data.paragraph3]
        .filter(Boolean)
        .map((text) => `<p>${escapeHtml(text)}</p>`)
        .join("");
      canvas.innerHTML = `<article class="preview-copy"><p class="preview-eyebrow">The Harmonia Project</p><h1>${escapeHtml(data.title)}</h1>${paragraphs}</article>`;
    }
    overlay.hidden = false;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  async function publishGallery() {
    const items = (
      window.HarmoniaGallery?.getAll?.() ||
      window.HarmoniaGallery?.getAllGalleryItems?.() ||
      []
    )
      .filter((item) => item.visibility !== "private")
      .map((item) => ({
        title: item.title,
        description: item.description,
        imageUrl: window.HarmoniaGallery?.resolveImageUrl?.(item) || item.imageUrl || "",
        altText: item.altText,
        photographer: item.photographer,
        eventName: item.eventName,
        location: item.location,
        dateTaken: item.dateTaken,
        featured: Boolean(item.featured)
      }));
    await publishDirect("gallery", { title: "Moments of connection.", items });
    alert(`Published ${items.length} gallery item(s).`);
  }

  async function publishPartners() {
    const items = (window.HarmoniaPartners?.getAll?.() || [])
      .filter((item) => String(item.status || "active").toLowerCase() === "active")
      .map((item) => ({
        name: item.name,
        description: item.description || item.notes || "",
        website: item.website || "",
        sector: item.sector || item.type || "",
        location: item.address || item.location || ""
      }));
    await publishDirect("partners", {
      title: "Organizations building harmony with us.",
      items
    });
    alert(`Published ${items.length} partner(s).`);
  }

  function initialize() {
    ["homepage", "about", "connect"].forEach((key) => {
      const saveButton = document.getElementById(`${key}SaveDraftButton`);
      const previewButton = document.getElementById(`${key}PreviewButton`);
      const publishButton = document.getElementById(`${key}PublishButton`);
      if (saveButton && !saveButton.dataset.ready) {
        saveButton.dataset.ready = "1";
        saveButton.addEventListener("click", () => save(key));
        previewButton?.addEventListener("click", () => preview(key));
        publishButton?.addEventListener("click", () => publish(key));
      }
      hydrate(key);
    });

    document.getElementById("publishGalleryButton")?.addEventListener("click", publishGallery);
    document.getElementById("publishPartnersButton")?.addEventListener("click", publishPartners);

    console.log("✅ Draft, Preview, Publish workflow initialized");
  }

  window.initializeSiteContentEditors = initialize;
  window.HarmoniaSiteContent = {
    load,
    saveDraft,
    publishDraft,
    publishDirect,
    preview,
    publishGallery,
    publishPartners
  };
})();
