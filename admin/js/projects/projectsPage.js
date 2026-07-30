let activeProjectStatusFilter = "all";
let activeProjectSearch = "";

function formatProjectStatus(status) {
    return (
        {
            idea: "Idea",
            planning: "Planning",
            active: "Active",
            paused: "Paused",
            completed: "Completed",
            cancelled: "Cancelled",
            archived: "Archived"
        }[status] || status
    );
}

function renderProjects() {
    const list = document.getElementById("projectsList");
    const empty = document.getElementById("projectsEmptyState");

    if (!list) return;

    list.innerHTML = "";

    let projects = ProjectManager.getAllProjects();

    if (activeProjectStatusFilter !== "all") {
        projects = projects.filter(
            p => p.status === activeProjectStatusFilter
        );
    }

    if (activeProjectSearch) {
        const search = activeProjectSearch.toLowerCase();

        projects = projects.filter(p =>
            (p.title || "")
                .toLowerCase()
                .includes(search) ||
            (p.description || "")
                .toLowerCase()
                .includes(search)
        );
    }

    projects.sort((a, b) =>
        new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    if (empty) {
        empty.hidden = projects.length > 0;
    }

    const total = document.getElementById("projectTotalCount");
    const active = document.getElementById("projectActiveCount");
    const completed = document.getElementById("projectCompletedCount");

    if (total) total.textContent = projects.length;

    if (active) {
        active.textContent = projects.filter(
            p => p.status === "active"
        ).length;
    }

    if (completed) {
        completed.textContent = projects.filter(
            p => p.status === "completed"
        ).length;
    }

    projects.forEach(project => {
        const card = document.createElement("article");
        card.className = "project-card";

        card.innerHTML = `
            <div class="project-card-content">
                <h3>${project.title}</h3>

                <p>${project.description || ""}</p>

                <p>
                    <strong>Status:</strong>
                    ${formatProjectStatus(project.status)}
                </p>

                <p>
                    <strong>Progress:</strong>
                    ${project.progress || 0}%
                </p>

                <div class="project-card-actions">
                    <button class="text-button open-btn">
                        Open
                    </button>

                    <button class="task-action-button edit-btn">
                        Edit
                    </button>

                    <button class="task-action-button danger delete-btn">
                        Delete
                    </button>
                </div>
            </div>
        `;

        card.querySelector(".open-btn").onclick = () => {
            if (window.openProjectWorkspace) {
                window.openProjectWorkspace(project.id);
            }
        };

        card.querySelector(".edit-btn").onclick = () => {
            if (window.openProjectModal) {
                window.openProjectModal(project);
            }
        };

        card.querySelector(".delete-btn").onclick = () => {
            if (
                confirm(
                    `Delete "${project.title}"?`
                )
            ) {
                ProjectManager.deleteProject(project.id);
                renderProjects();
            }
        };

        list.appendChild(card);
    });
}

function initializeProjectsPage() {
    const search =
        document.getElementById("projectSearchInput");

    if (search) {
        search.addEventListener("input", e => {
            activeProjectSearch = e.target.value.trim();
            renderProjects();
        });
    }

    const filter =
        document.getElementById("projectStatusFilter");

    if (filter) {
        filter.addEventListener("change", e => {
            activeProjectStatusFilter =
                e.target.value;
            renderProjects();
        });
    }

    renderProjects();
}

window.renderProjects = renderProjects;
window.renderProjectsPage = renderProjects;
window.initializeProjectsPage = initializeProjectsPage;

console.log("✅ Projects Page Loaded");