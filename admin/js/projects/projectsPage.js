console.log("Loading Projects Page");

let activeProjectStatusFilter = "all";
let activeProjectSearch = "";

function formatProjectStatus(status) {
    const normalizedStatus =
        String(status || "")
            .trim()
            .toLowerCase();

    const statusLabels = {
        idea: "Idea",
        planning: "Planning",
        active: "Active",
        paused: "Paused",
        completed: "Completed",
        cancelled: "Cancelled",
        archived: "Archived"
    };

    return (
        statusLabels[normalizedStatus] ||
        status ||
        "Unknown"
    );
}

function getFilteredProjects() {
    if (
        !window.ProjectManager ||
        typeof window.ProjectManager
            .getAllProjects !== "function"
    ) {
        console.error(
            "ProjectManager is not available."
        );

        return [];
    }

    let projects =
        window.ProjectManager.getAllProjects();

    if (!Array.isArray(projects)) {
        projects = [];
    }

    if (
        activeProjectStatusFilter !==
        "all"
    ) {
        projects = projects.filter(
            project =>
                String(
                    project.status || ""
                ).toLowerCase() ===
                activeProjectStatusFilter
        );
    }

    if (activeProjectSearch) {
        const search =
            activeProjectSearch.toLowerCase();

        projects = projects.filter(
            project => {
                const title =
                    project.title ||
                    project.name ||
                    "";

                const description =
                    project.description ||
                    "";

                return (
                    title
                        .toLowerCase()
                        .includes(search) ||
                    description
                        .toLowerCase()
                        .includes(search)
                );
            }
        );
    }

    return projects.sort(
        (
            firstProject,
            secondProject
        ) =>
            new Date(
                secondProject.updatedAt ||
                secondProject.createdAt ||
                0
            ) -
            new Date(
                firstProject.updatedAt ||
                firstProject.createdAt ||
                0
            )
    );
}

function updateProjectCounts(projects) {
    const totalElement =
        document.getElementById(
            "projectTotalCount"
        );

    const activeElement =
        document.getElementById(
            "projectActiveCount"
        );

    const completedElement =
        document.getElementById(
            "projectCompletedCount"
        );

    if (totalElement) {
        totalElement.textContent =
            String(projects.length);
    }

    if (activeElement) {
        const activeCount =
            projects.filter(
                project =>
                    String(
                        project.status || ""
                    ).toLowerCase() ===
                    "active"
            ).length;

        activeElement.textContent =
            String(activeCount);
    }

    if (completedElement) {
        const completedCount =
            projects.filter(
                project =>
                    String(
                        project.status || ""
                    ).toLowerCase() ===
                    "completed"
            ).length;

        completedElement.textContent =
            String(completedCount);
    }
}

function createProjectCard(project) {
    const card =
        document.createElement("article");

    card.className = "project-card";

    const title =
        project.title ||
        project.name ||
        "Untitled Project";

    const description =
        project.description || "";

    const progress =
        Number(project.progress) || 0;

    card.innerHTML = `
        <div class="project-card-content">
            <h3 class="project-card-title"></h3>

            <p class="project-card-description"></p>

            <p>
                <strong>Status:</strong>
                <span class="project-card-status"></span>
            </p>

            <p>
                <strong>Progress:</strong>
                <span class="project-card-progress"></span>
            </p>

            <div class="project-card-actions">
                <button
                    type="button"
                    class="text-button open-btn"
                >
                    Open
                </button>

                <button
                    type="button"
                    class="task-action-button edit-btn"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="task-action-button danger delete-btn"
                >
                    Delete
                </button>
            </div>
        </div>
    `;

    const titleElement =
        card.querySelector(
            ".project-card-title"
        );

    const descriptionElement =
        card.querySelector(
            ".project-card-description"
        );

    const statusElement =
        card.querySelector(
            ".project-card-status"
        );

    const progressElement =
        card.querySelector(
            ".project-card-progress"
        );

    if (titleElement) {
        titleElement.textContent = title;
    }

    if (descriptionElement) {
        descriptionElement.textContent =
            description;
    }

    if (statusElement) {
        statusElement.textContent =
            formatProjectStatus(
                project.status
            );
    }

    if (progressElement) {
        progressElement.textContent =
            `${progress}%`;
    }

    const openButton =
        card.querySelector(".open-btn");

    if (openButton) {
        openButton.addEventListener(
            "click",
            () => {
                if (
                    typeof window
                        .openProjectWorkspace ===
                    "function"
                ) {
                    window.openProjectWorkspace(
                        project.id
                    );
                } else {
                    console.error(
                        "openProjectWorkspace is unavailable."
                    );
                }
            }
        );
    }

    const editButton =
        card.querySelector(".edit-btn");

    if (editButton) {
        editButton.addEventListener(
            "click",
            () => {
                if (
                    typeof window
                        .openProjectModal ===
                    "function"
                ) {
                    window.openProjectModal(
                        project
                    );
                    return;
                }

                if (
                    window.ProjectModal &&
                    typeof window.ProjectModal
                        .openEdit === "function"
                ) {
                    window.ProjectModal.openEdit(
                        project.id
                    );
                    return;
                }

                console.error(
                    "The project editor is unavailable."
                );
            }
        );
    }

    const deleteButton =
        card.querySelector(
            ".delete-btn"
        );

    if (deleteButton) {
        deleteButton.addEventListener(
            "click",
            async () => {
                const confirmed =
                    window.confirm(
                        `Delete "${title}"?`
                    );

                if (!confirmed) {
                    return;
                }

                try {
                    await window
                        .ProjectManager
                        .deleteProject(
                            project.id
                        );

                    renderProjects();
                } catch (error) {
                    console.error(
                        "Project deletion failed:",
                        error
                    );

                    window.alert(
                        error?.message ||
                        "The project could not be deleted."
                    );
                }
            }
        );
    }

    return card;
}

function renderProjects() {
    const list =
        document.getElementById(
            "projectsList"
        );

    const emptyState =
        document.getElementById(
            "projectsEmptyState"
        );

    if (!list) {
        console.error(
            "The #projectsList element was not found."
        );

        return;
    }

    const projects =
        getFilteredProjects();

    list.innerHTML = "";

    updateProjectCounts(projects);

    if (emptyState) {
        emptyState.hidden =
            projects.length > 0;
    }

    projects.forEach(project => {
        const card =
            createProjectCard(project);

        list.appendChild(card);
    });

    console.log(
        `✅ Rendered ${projects.length} projects`
    );
}

async function loadAndRenderProjects() {
    const list =
        document.getElementById(
            "projectsList"
        );

    if (list) {
        list.innerHTML =
            "<p>Loading projects…</p>";
    }

    try {
        if (
            window.ProjectManager &&
            typeof window.ProjectManager
                .loadProjects === "function"
        ) {
            await window.ProjectManager
                .loadProjects();
        }
    } catch (error) {
        console.error(
            "Could not load projects:",
            error
        );
    }

    renderProjects();
}

function initializeProjectsPage() {
    console.log(
        "Initializing Projects Page"
    );

    const searchInput =
        document.getElementById(
            "projectSearchInput"
        );

    if (
        searchInput &&
        searchInput.dataset
            .projectsInitialized !==
            "true"
    ) {
        searchInput.dataset
            .projectsInitialized =
            "true";

        searchInput.addEventListener(
            "input",
            event => {
                activeProjectSearch =
                    event.target.value
                        .trim();

                renderProjects();
            }
        );
    }

    const statusFilter =
        document.getElementById(
            "projectStatusFilter"
        );

    if (
        statusFilter &&
        statusFilter.dataset
            .projectsInitialized !==
            "true"
    ) {
        statusFilter.dataset
            .projectsInitialized =
            "true";

        statusFilter.addEventListener(
            "change",
            event => {
                activeProjectStatusFilter =
                    event.target.value ||
                    "all";

                renderProjects();
            }
        );
    }

    document.addEventListener(
        "harmonia:projects-updated",
        renderProjects
    );

    loadAndRenderProjects();
}

window.formatProjectStatus =
    formatProjectStatus;

window.renderProjects =
    renderProjects;

window.renderProjectsPage =
    renderProjects;

window.loadAndRenderProjects =
    loadAndRenderProjects;

window.initializeProjectsPage =
    initializeProjectsPage;

console.log(
    "✅ Projects Page Loaded"
);