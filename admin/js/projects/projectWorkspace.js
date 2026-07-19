console.log("Project Workspace Loaded");

let currentWorkspaceProject = null;

function openProjectWorkspace(projectId) {
    console.log("Workspace opening:", projectId);

    const project = window.HarmoniaProjects
        .getAll()
        .find((p) => p.id === projectId);

    if (!project) {
        console.error("Project not found:", projectId);
        return;
    }

    currentWorkspaceProject = project;

    document.getElementById("workspaceProjectTitle").textContent =
        project.title;

    document.getElementById("workspaceProjectDescription").textContent =
        project.description || "No description provided.";

    document.getElementById("workspaceProjectStatus").textContent =
        project.status;

    document.getElementById("workspaceProjectProgressText").textContent =
        `${project.progress}%`;

    document.getElementById(
        "workspaceProjectProgressFill"
    ).style.width = `${project.progress}%`;

    document.getElementById(
        "workspaceProjectColor"
    ).style.background =
        project.color || "#1e4d8c";

    showProjectWorkspacePage();
}

function showProjectWorkspacePage() {
    console.log("Showing workspace page");

    document
        .querySelectorAll(".admin-page")
        .forEach((page) => {
            page.classList.remove("active");
        });

    const workspacePage =
        document.getElementById("project-workspace");

    if (!workspacePage) {
        console.error("Project workspace page not found.");
        return;
    }

    workspacePage.classList.add("active");

    const pageTitle =
        document.getElementById("pageTitle");

    if (pageTitle) {
        pageTitle.textContent = "Project Workspace";
    }
}

function backToProjects() {
    document
        .querySelectorAll(".admin-page")
        .forEach((page) => {
            page.classList.remove("active");
        });

    const projectsPage =
        document.getElementById("projects");

    if (projectsPage) {
        projectsPage.classList.add("active");
    }

    const pageTitle =
        document.getElementById("pageTitle");

    if (pageTitle) {
        pageTitle.textContent = "Projects";
    }
}

function initializeProjectWorkspace() {
    const backButton =
        document.getElementById("backToProjectsButton");

    if (backButton) {
        backButton.addEventListener(
            "click",
            backToProjects
        );
    }

    document
        .querySelectorAll(".project-workspace-tab")
        .forEach((button) => {
            button.addEventListener("click", () => {
                document
                    .querySelectorAll(".project-workspace-tab")
                    .forEach((tabButton) => {
                        tabButton.classList.remove("active");
                    });

                button.classList.add("active");

                const selectedTab =
                    button.dataset.projectTab;

                document
                    .querySelectorAll(".project-workspace-panel")
                    .forEach((panel) => {
                        const isActive =
                            panel.dataset.projectPanel ===
                            selectedTab;

                        panel.hidden = !isActive;

                        panel.classList.toggle(
                            "active",
                            isActive
                        );
                    });
            });
        });
}

window.openProjectWorkspace =
    openProjectWorkspace;

window.initializeProjectWorkspace =
    initializeProjectWorkspace;