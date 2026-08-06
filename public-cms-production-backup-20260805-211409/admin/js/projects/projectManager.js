function showProjectWorkspacePage() {
    console.log("Showing workspace page");

    const workspacePage =
        document.getElementById("project-workspace");

    if (!workspacePage) {
        console.error(
            "The #project-workspace section was not found."
        );
        return;
    }

    // Hide every admin page.
    document
        .querySelectorAll(".admin-page")
        .forEach(page => {
            page.classList.remove("active");
            page.hidden = true;
        });

    // Explicitly show the project workspace.
    workspacePage.hidden = false;
    workspacePage.removeAttribute("hidden");
    workspacePage.removeAttribute("aria-hidden");
    workspacePage.classList.add("active");
    workspacePage.style.display = "block";
    workspacePage.style.visibility = "visible";
    workspacePage.style.opacity = "1";

    // Make sure the workspace's inner container is visible.
    const workspaceContent =
        workspacePage.querySelector(
            ".project-workspace-page"
        );

    if (workspaceContent) {
        workspaceContent.hidden = false;
        workspaceContent.removeAttribute("hidden");
        workspaceContent.style.display = "";
        workspaceContent.style.visibility = "visible";
        workspaceContent.style.opacity = "1";
    }

    // Support either panel attribute naming system.
    const panels =
        workspacePage.querySelectorAll(
            "[data-project-panel], [data-workspace-panel]"
        );

    let activePanel =
        workspacePage.querySelector(
            "[data-project-panel].active, " +
            "[data-workspace-panel].active"
        );

    // If every panel is hidden, open the overview panel.
    if (!activePanel && panels.length > 0) {
        activePanel =
            workspacePage.querySelector(
                '[data-project-panel="overview"], ' +
                '[data-workspace-panel="overview"]'
            ) || panels[0];

        activePanel.classList.add("active");
    }

    panels.forEach(panel => {
        const shouldShow =
            panel === activePanel ||
            panel.classList.contains("active");

        panel.hidden = !shouldShow;
        panel.style.display =
            shouldShow ? "" : "none";
    });

    // Activate the overview tab when necessary.
    const tabs =
        workspacePage.querySelectorAll(
            "[data-project-tab], [data-workspace-tab]"
        );

    if (
        tabs.length > 0 &&
        !workspacePage.querySelector(
            "[data-project-tab].active, " +
            "[data-workspace-tab].active"
        )
    ) {
        tabs[0].classList.add("active");
    }

    const pageTitle =
        document.getElementById("pageTitle");

    if (pageTitle) {
        pageTitle.textContent =
            currentWorkspaceProject?.title ||
            currentWorkspaceProject?.name ||
            "Project Workspace";
    }

    if (window.location.hash !== "#project-workspace") {
        window.history.replaceState(
            null,
            "",
            "#project-workspace"
        );
    }
}