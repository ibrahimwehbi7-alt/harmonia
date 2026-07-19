document.addEventListener("DOMContentLoaded", () => {
    if (typeof initializeRouter === "function") {
        initializeRouter();
    }

    if (typeof initializeDashboard === "function") {
        initializeDashboard();
    }

    if (typeof initializeEventsPage === "function") {
        initializeEventsPage();
    }

    if (typeof initializeProjectsPage === "function") {
        initializeProjectsPage();
    }

    if (typeof initializeProjectModal === "function") {
        initializeProjectModal();
    }

    if (typeof initializeProjectWorkspace === "function") {
        initializeProjectWorkspace();
    }
});