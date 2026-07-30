const pageTitles = {
    dashboard: "Dashboard",
    homepage: "Homepage",
    about: "About",
    connect: "Connect",
    projects: "Projects",
    work: "Work",
    events: "Events",
    gallery: "Gallery",
    partners: "Partners",
    messages: "Messages",
    donations: "Donations",
    analytics: "Analytics",
    ai: "Harmonia AI",
    "project-workspace": "Project Workspace"
};

function openAdminPage(pageId) {
    console.log("Opening admin page:", pageId);

    const targetPage =
        document.getElementById(pageId);

    if (!targetPage) {
        console.warn(`Page not found: ${pageId}`);
        return;
    }

    /*
     * Reset every main admin page.
     *
     * This removes both:
     * 1. The active class
     * 2. Any hidden attribute accidentally added earlier
     */
    document
        .querySelectorAll(".admin-page")
        .forEach((page) => {
            page.classList.remove("active");
            page.hidden = true;
        });

    /*
     * Display only the requested page.
     */
    targetPage.hidden = false;
    targetPage.classList.add("active");

    /*
     * Update sidebar navigation.
     */
    document
        .querySelectorAll(".nav-button")
        .forEach((button) => {
            const isCurrentPage =
                button.dataset.page === pageId;

            button.classList.toggle(
                "active",
                isCurrentPage
            );
        });

    /*
     * Update the heading at the top of the admin area.
     */
    const pageTitle =
        document.getElementById("pageTitle");

    if (pageTitle) {
        pageTitle.textContent =
            pageTitles[pageId] ||
            "Harmonia HQ";
    }

    /*
     * Refresh page-specific content.
     */
    if (
        pageId === "work" &&
        typeof window.renderWorkPage === "function"
    ) {
        window.renderWorkPage();
    }

    if (
        pageId === "events" &&
        typeof window.renderEventsPage === "function"
    ) {
        window.renderEventsPage();
    }

    if (
        pageId === "projects" &&
        typeof window.renderProjectsPage === "function"
    ) {
        window.renderProjectsPage();
    }

    /*
     * Update the browser URL without causing
     * another navigation event.
     */
    if (window.location.hash !== `#${pageId}`) {
        window.history.replaceState(
            null,
            "",
            `#${pageId}`
        );
    }
}

function initializeRouter() {
    console.log("Initializing Router");

    document
        .querySelectorAll(".nav-button[data-page]")
        .forEach((button) => {
            button.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    const pageId =
                        button.dataset.page;

                    if (!pageId) {
                        console.warn(
                            "Navigation button has no data-page value."
                        );
                        return;
                    }

                    openAdminPage(pageId);
                }
            );
        });

    /*
     * Support links elsewhere in the application
     * that also use data-page but are not sidebar buttons.
     */
    document
        .querySelectorAll(
            "[data-page]:not(.nav-button)"
        )
        .forEach((element) => {
            element.addEventListener(
                "click",
                function (event) {
                    const pageId =
                        element.dataset.page;

                    if (!pageId) {
                        return;
                    }

                    event.preventDefault();
                    openAdminPage(pageId);
                }
            );
        });

    const requestedPage =
        window.location.hash
            .replace("#", "")
            .trim();

    const requestedElement =
        requestedPage
            ? document.getElementById(
                  requestedPage
              )
            : null;

    const initialPage =
        requestedElement &&
        requestedElement.classList.contains(
            "admin-page"
        )
            ? requestedPage
            : "dashboard";

    openAdminPage(initialPage);

    console.log(
        "Router initialization complete."
    );
}

window.addEventListener(
    "hashchange",
    function () {
        const pageId =
            window.location.hash
                .replace("#", "")
                .trim();

        const page =
            document.getElementById(pageId);

        if (
            page &&
            page.classList.contains(
                "admin-page"
            )
        ) {
            openAdminPage(pageId);
        }
    }
);

window.openAdminPage = openAdminPage;
window.initializeRouter = initializeRouter;

console.log("✅ Router Loaded");