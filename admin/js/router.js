(function () {
    "use strict";

    const pageTitles = {
        dashboard: "Dashboard",
        homepage: "Homepage",
        about: "About",
        connect: "Connect",
        projects: "Projects",
        work: "Work",
        events: "Events",
        notes: "Notes",
        files: "Files",
        gallery: "Gallery",
        partners: "Partners",
        messages: "Messages",
        finance: "Finance",
        analytics: "Analytics",
        marketing: "Marketing",
        users: "Users & Access",
        audience: "People & Audience",
        "project-workspace":
            "Project Workspace"
    };

    const pageRenderers = {
        dashboard: "renderDashboard",
        projects: "renderProjectsPage",
        work: "renderWorkPage",
        events: "renderEventsPage",
        notes: "renderNotesPage",
        files: "renderFilesPage",
        gallery: "renderGallery",
        partners: "renderPartners",
        messages: "renderMessages",
        finance: "renderFinance",
        analytics: "renderAnalytics",
        marketing: "renderMarketing",
        users: "renderUsersPage",
        audience: "renderAudiencePage"
    };

    let initialized = false;

    function refreshPage(pageId) {
        const rendererName =
            pageRenderers[pageId];

        const renderer =
            rendererName
                ? window[rendererName]
                : null;

        if (
            typeof renderer ===
            "function"
        ) {
            try {
                renderer();
            } catch (error) {
                console.error(
                    `Could not render ${pageId}:`,
                    error
                );
            }
        }
    }

    function openAdminPage(
        pageId,
        options = {}
    ) {
        const targetPage =
            document.getElementById(
                pageId
            );

        if (
            !targetPage ||
            !targetPage.classList.contains(
                "admin-page"
            )
        ) {
            console.warn(
                `Page not found: ${pageId}`
            );
            return false;
        }

        document
            .querySelectorAll(
                ".admin-page"
            )
            .forEach(page => {
                const active =
                    page === targetPage;

                page.classList.toggle(
                    "active",
                    active
                );

                page.hidden =
                    !active;

                page.setAttribute(
                    "aria-hidden",
                    String(!active)
                );
            });

        document
            .querySelectorAll(
                ".nav-button[data-page]"
            )
            .forEach(button => {
                button.classList.toggle(
                    "active",
                    button.dataset.page ===
                        pageId
                );
            });

        const title =
            document.getElementById(
                "pageTitle"
            );

        if (title) {
            title.textContent =
                pageTitles[pageId] ||
                "Harmonia HQ";
        }

        if (
            options.refresh !== false
        ) {
            refreshPage(pageId);
        }

        if (
            options.updateHash !==
                false &&
            window.location.hash !==
                `#${pageId}`
        ) {
            window.history.replaceState(
                null,
                "",
                `#${pageId}`
            );
        }

        document.dispatchEvent(
            new CustomEvent(
                "harmonia:page-opened",
                {
                    detail: {
                        pageId
                    }
                }
            )
        );

        return true;
    }

    function getRequestedPage() {
        const requested =
            window.location.hash
                .replace("#", "")
                .trim();

        const element =
            requested
                ? document.getElementById(
                    requested
                )
                : null;

        return (
            element &&
            element.classList.contains(
                "admin-page"
            )
        )
            ? requested
            : "dashboard";
    }

    function initializeRouter() {
        if (initialized) {
            openAdminPage(
                getRequestedPage()
            );
            return;
        }

        initialized = true;

        document.addEventListener(
            "click",
            event => {
                const trigger =
                    event.target.closest(
                        "[data-page]"
                    );

                if (!trigger) {
                    return;
                }

                const pageId =
                    trigger.dataset.page;

                if (!pageId) {
                    return;
                }

                event.preventDefault();

                openAdminPage(pageId);
            }
        );

        window.addEventListener(
            "hashchange",
            () => {
                openAdminPage(
                    getRequestedPage(),
                    {
                        updateHash: false
                    }
                );
            }
        );

        openAdminPage(
            getRequestedPage()
        );

        console.log(
            "✅ Router initialized"
        );
    }

    window.openAdminPage =
        openAdminPage;

    window.initializeRouter =
        initializeRouter;

    window.refreshAdminPage =
        refreshPage;

    console.log(
        "✅ Router Loaded"
    );
})();