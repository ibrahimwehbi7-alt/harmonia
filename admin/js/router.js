const pageTitles = {
  dashboard: "Dashboard",
  homepage: "Homepage",
  about: "About",
  connect: "Connect",
  events: "Events",
  gallery: "Gallery",
  partners: "Partners",
  messages: "Messages",
  donations: "Donations",
  analytics: "Analytics",
  ai: "Harmonia AI"
};

function openAdminPage(pageId) {
  const targetPage = document.getElementById(pageId);

  if (!targetPage) {
    console.warn(`Page not found: ${pageId}`);
    return;
  }

  document.querySelectorAll(".admin-page").forEach((page) => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  const pageTitle = document.getElementById("pageTitle");

  if (pageTitle) {
    pageTitle.textContent = pageTitles[pageId] || "Harmonia HQ";
  }

  window.location.hash = pageId;
}

function initializeRouter() {
  document.querySelectorAll("[data-page]").forEach((element) => {
    element.addEventListener("click", () => {
      openAdminPage(element.dataset.page);
    });
  });

  const requestedPage = window.location.hash.replace("#", "");
  const initialPage = document.getElementById(requestedPage)
    ? requestedPage
    : "dashboard";

  openAdminPage(initialPage);
}

window.openAdminPage = openAdminPage;
window.initializeRouter = initializeRouter;