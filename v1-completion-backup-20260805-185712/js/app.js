(function () {
    "use strict";

    console.log("App Loaded");

    let featuresInitialized = false;
    let startupPromise = null;

    const initializers = [
        "initializeDashboard",
        "initializeEventsPage",
        "initializeProjectsPage",
        "initializeProjectModal",
        "initializeProjectWorkspace",
        "initializeNotesPage",
        "initializeFilesPage",
        "initializeGalleryPage",
        "initializePartnersPage",
        "initializeMessagesPage",
        "initializeFinancePage",
        "initializeAnalyticsPage",
        "initializeMarketingPage"
    ];

    async function runInitializer(
        name
    ) {
        const initializer =
            window[name];

        if (
            typeof initializer !==
            "function"
        ) {
            return;
        }

        try {
            await initializer();
        } catch (error) {
            console.error(
                `${name} failed:`,
                error
            );
        }
    }

    async function initializeFeatures() {
        if (featuresInitialized) {
            return;
        }

        featuresInitialized = true;

        console.log(
            "Initializing Harmonia Admin"
        );

        for (
            const initializerName of
            initializers
        ) {
            await runInitializer(
                initializerName
            );
        }

        if (
            typeof window
                .initializeWorkPage ===
            "function"
        ) {
            await runInitializer(
                "initializeWorkPage"
            );
        }

        if (
            typeof window
                .initializeRouter ===
            "function"
        ) {
            window.initializeRouter();
        }

        document.dispatchEvent(
            new CustomEvent(
                "harmonia:admin-ready"
            )
        );

        console.log(
            "✅ Harmonia Admin ready"
        );
    }

    async function startApplication() {
        if (startupPromise) {
            return startupPromise;
        }

        startupPromise =
            (async () => {
                if (
                    !window.HarmoniaApi ||
                    !window.HarmoniaAuth
                ) {
                    throw new Error(
                        "Authentication runtime is unavailable."
                    );
                }

                const authenticated =
                    await window
                        .HarmoniaAuth
                        .initialize();

                if (authenticated) {
                    await initializeFeatures();
                }
            })();

        try {
            await startupPromise;
        } finally {
            startupPromise = null;
        }
    }

    document.addEventListener(
        "harmonia:authenticated",
        () => {
            initializeFeatures()
                .catch(error => {
                    console.error(
                        "Authenticated startup failed:",
                        error
                    );
                });
        }
    );

    document.addEventListener(
        "harmonia:logout",
        () => {
            featuresInitialized = false;
        }
    );

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            () => {
                startApplication()
                    .catch(error => {
                        console.error(
                            "Harmonia startup failed:",
                            error
                        );
                    });
            },
            {
                once: true
            }
        );
    } else {
        startApplication()
            .catch(error => {
                console.error(
                    "Harmonia startup failed:",
                    error
                );
            });
    }

    window.initializeHarmoniaAdmin =
        initializeFeatures;
})();
