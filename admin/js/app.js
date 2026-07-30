console.log("App Loaded");

function initializeApp() {
    console.log("Initializing Harmonia Admin");

    if (typeof window.initializeRouter === "function") {
        window.initializeRouter();
    } else {
        console.warn("initializeRouter is not available.");
    }

    if (typeof window.initializeDashboard === "function") {
        window.initializeDashboard();
    } else {
        console.warn("initializeDashboard is not available.");
    }

    if (typeof window.initializeEventsPage === "function") {
        window.initializeEventsPage();
    } else {
        console.warn("initializeEventsPage is not available.");
    }

    if (typeof window.initializeProjectsPage === "function") {
        window.initializeProjectsPage();
    } else {
        console.warn("initializeProjectsPage is not available.");
    }

    if (typeof window.initializeProjectModal === "function") {
        window.initializeProjectModal();
    } else {
        console.warn("initializeProjectModal is not available.");
    }

    if (
        typeof window.initializeProjectWorkspace ===
        "function"
    ) {
        window.initializeProjectWorkspace();
    } else {
        console.warn(
            "initializeProjectWorkspace is not available."
        );
    }

    console.log(
        "Harmonia Admin initialization complete"
    );
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeApp,
        { once: true }
    );
} else {
    initializeApp();
}