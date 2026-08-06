console.log("App Loaded");

let harmoniaAdminStarted = false;

async function initializeFeaturePages() {
    if (harmoniaAdminStarted) {
        return;
    }

    harmoniaAdminStarted = true;

    console.log(
        "Initializing Harmonia Admin"
    );

    if (
        typeof window.initializeRouter ===
        "function"
    ) {
        window.initializeRouter();
    } else {
        console.warn(
            "initializeRouter is not available."
        );
    }

    if (
        typeof window.initializeDashboard ===
        "function"
    ) {
        window.initializeDashboard();
    } else {
        console.warn(
            "initializeDashboard is not available."
        );
    }

    if (
        typeof window.initializeEventsPage ===
        "function"
    ) {
        window.initializeEventsPage();
    } else {
        console.warn(
            "initializeEventsPage is not available."
        );
    }

    if (
        typeof window.initializeProjectsPage ===
        "function"
    ) {
        window.initializeProjectsPage();
    } else {
        console.warn(
            "initializeProjectsPage is not available."
        );
    }

    if (
        typeof window.initializeProjectModal ===
        "function"
    ) {
        window.initializeProjectModal();
    } else {
        console.warn(
            "initializeProjectModal is not available."
        );
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

    if (
        typeof window.initializeWorkPage ===
        "function"
    ) {
        await window.initializeWorkPage();
    } else {
        console.warn(
            "initializeWorkPage is not available."
        );
    }

    console.log(
        "Harmonia Admin initialization complete"
    );
}

async function initializeApp() {
    if (
        !window.HarmoniaApi ||
        !window.HarmoniaAuth
    ) {
        console.error(
            "Harmonia authentication scripts did not load."
        );
        return;
    }

    const authenticated =
        await window.HarmoniaAuth.initialize();

    if (authenticated) {
        await initializeFeaturePages();
    }
}

document.addEventListener(
    "harmonia:authenticated",
    () => {
        initializeFeaturePages()
            .catch(error => {
                console.error(
                    "Harmonia feature initialization failed:",
                    error
                );
            });
    }
);

document.addEventListener(
    "harmonia:logout",
    () => {
        harmoniaAdminStarted = false;
    }
);

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        () => {
            initializeApp()
                .catch(error => {
                    console.error(
                        "Harmonia initialization failed:",
                        error
                    );
                });
        },
        {
            once: true
        }
    );
} else {
    initializeApp()
        .catch(error => {
            console.error(
                "Harmonia initialization failed:",
                error
            );
        });
}