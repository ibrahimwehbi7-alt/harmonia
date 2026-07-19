let activeProjectStatusFilter = "all";
let activeProjectSearch = "";

function formatProjectStatus(status) {
    const labels = {
        planning: "Planning",
        active: "Active",
        completed: "Completed",
        paused: "Paused",
        cancelled: "Cancelled"
    };

    return labels[status] || status;
}

function clampProjectProgress(progress) {
    const value = Number(progress);

    if (Number.isNaN(value)) {
        return 0;
    }

    return Math.min(100, Math.max(0, value));
}

function sortProjects(projects) {
    const statusOrder = {
        active: 1,
        planning: 2,
        paused: 3,
        completed: 4,
        cancelled: 5
    };

    return [...projects].sort((firstProject, secondProject) => {
        const firstStatus =
            statusOrder[firstProject.status] || 99;

        const secondStatus =
            statusOrder[secondProject.status] || 99;

        if (firstStatus !== secondStatus) {
            return firstStatus - secondStatus;
        }

        return (
            new Date(secondProject.updatedAt) -
            new Date(firstProject.updatedAt)
        );
    });
}

function filterProjects(projects) {
    const searchText = activeProjectSearch.toLowerCase();

    return projects.filter((project) => {
        const matchesStatus =
            activeProjectStatusFilter === "all" ||
            project.status === activeProjectStatusFilter;

        const matchesSearch =
            !searchText ||
            project.title.toLowerCase().includes(searchText) ||
            (project.description || "")
                .toLowerCase()
                .includes(searchText);

        return matchesStatus && matchesSearch;
    });
}

function createProjectCard(project) {
    const card = document.createElement("article");
    card.className = "project-card";
    card.dataset.projectId = project.id;

    const accent = document.createElement("div");
    accent.className = "project-card-accent";
    accent.style.backgroundColor =
        project.color || "#1E4D8C";

    const content = document.createElement("div");
    content.className = "project-card-content";

    const heading = document.createElement("div");
    heading.className = "project-card-heading";

    const titleBlock = document.createElement("div");

    const label = document.createElement("p");
    label.className = "project-card-label";
    label.textContent = "Project";

    const title = document.createElement("h3");
    title.textContent = project.title;

    titleBlock.appendChild(label);
    titleBlock.appendChild(title);

    const status = document.createElement("span");
    status.className = `project-status-badge ${project.status}`;
    status.textContent = formatProjectStatus(project.status);

    heading.appendChild(titleBlock);
    heading.appendChild(status);

    const description = document.createElement("p");
    description.className = "project-card-description";
    description.textContent =
        project.description || "No description has been added.";

    const progressValue =
        clampProjectProgress(project.progress);

    const progressSection = document.createElement("div");
    progressSection.className = "project-progress-section";

    const progressHeading = document.createElement("div");
    progressHeading.className = "project-progress-heading";

    const progressLabel = document.createElement("span");
    progressLabel.textContent = "Progress";

    const progressAmount = document.createElement("strong");
    progressAmount.textContent = `${progressValue}%`;

    progressHeading.appendChild(progressLabel);
    progressHeading.appendChild(progressAmount);

    const progressTrack = document.createElement("div");
    progressTrack.className = "project-progress-track";

    const progressBar = document.createElement("div");
    progressBar.className = "project-progress-bar";
    progressBar.style.width = `${progressValue}%`;
    progressBar.style.backgroundColor =
        project.color || "#1E4D8C";

    progressTrack.appendChild(progressBar);

    progressSection.appendChild(progressHeading);
    progressSection.appendChild(progressTrack);

    const metadata = document.createElement("div");
    metadata.className = "project-card-metadata";

    const tasks = document.createElement("span");
    tasks.textContent = "0 tasks";

    const events = document.createElement("span");
    events.textContent = "0 events";

    const updated = document.createElement("span");
    updated.textContent = `Updated ${new Date(
        project.updatedAt
    ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    })}`;

    metadata.appendChild(tasks);
    metadata.appendChild(events);
    metadata.appendChild(updated);

    content.appendChild(heading);
    content.appendChild(description);
    content.appendChild(progressSection);
    content.appendChild(metadata);

    const actions = document.createElement("div");
    actions.className = "project-card-actions";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "text-button";
    openButton.textContent = "Open";

openButton.addEventListener("click", () => {
    if (typeof window.openProjectWorkspace === "function") {
        window.openProjectWorkspace(project.id);
    }
});

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "task-action-button";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", () => {
        if (typeof window.openProjectModal === "function") {
            window.openProjectModal(project);
        }
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "task-action-button danger";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
        const confirmed = window.confirm(
            `Delete "${project.title}"?`
        );

        if (!confirmed) return;

        window.HarmoniaProjects.delete(project.id);
        renderProjects();
    });

    actions.appendChild(openButton);
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    card.appendChild(accent);
    card.appendChild(content);
    card.appendChild(actions);

    return card;
}

function updateProjectSummary(projects) {
    const totalCount =
        document.getElementById("projectTotalCount");

    const activeCount =
        document.getElementById("projectActiveCount");

    const completedCount =
        document.getElementById("projectCompletedCount");

    if (totalCount) {
        totalCount.textContent = projects.length;
    }

    if (activeCount) {
        activeCount.textContent = projects.filter(
            (project) => project.status === "active"
        ).length;
    }

    if (completedCount) {
        completedCount.textContent = projects.filter(
            (project) => project.status === "completed"
        ).length;
    }
}

function renderProjects() {
    const projectsList =
        document.getElementById("projectsList");

    const emptyState =
        document.getElementById("projectsEmptyState");

    if (!projectsList || !emptyState) return;

    const allProjects =
        window.HarmoniaProjects.getAll();

    const visibleProjects =
        sortProjects(filterProjects(allProjects));

    projectsList.innerHTML = "";

    visibleProjects.forEach((project) => {
        projectsList.appendChild(
            createProjectCard(project)
        );
    });

    emptyState.hidden = visibleProjects.length > 0;

    updateProjectSummary(allProjects);
}

function initializeProjectFilters() {
    const searchInput =
        document.getElementById("projectSearchInput");

    const statusFilter =
        document.getElementById("projectStatusFilter");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            activeProjectSearch =
                searchInput.value.trim();

            renderProjects();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            activeProjectStatusFilter =
                statusFilter.value;

            renderProjects();
        });
    }
}

function initializeProjectsPage() {
    window.HarmoniaProjects.load();
    initializeProjectFilters();
    renderProjects();
}

window.renderProjects = renderProjects;
window.initializeProjectsPage =
    initializeProjectsPage;