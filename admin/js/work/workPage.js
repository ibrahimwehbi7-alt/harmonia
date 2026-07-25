console.log("WORK PAGE VERSION 4 — PROJECT CONNECTION");

function renderWorkPage() {
    const pageContainer = document.getElementById("work");

    if (!pageContainer) {
        console.error("Could not find #work.");
        return;
    }

    if (
        !window.WorkManager ||
        typeof window.WorkManager.getAllWork !== "function"
    ) {
        console.error("WorkManager is not available.");
        return;
    }

    const workItems = window.WorkManager.getAllWork();

    pageContainer.innerHTML = `
        <div class="work-page">
            <div class="work-page-header">
                <div class="work-page-heading">
                    <p class="eyebrow">Operations</p>
                    <h2>Work</h2>

                    <p class="work-page-intro">
                        Create assignments, track progress, and organize
                        Harmonia's active work.
                    </p>
                </div>

                <button
                    class="primary-button"
                    id="newWorkButton"
                    type="button"
                >
                    + New Work
                </button>
            </div>

            ${renderWorkSummary(workItems)}

            <div class="work-list" id="workList">
                ${renderWorkList(workItems)}
            </div>
        </div>
    `;

    bindWorkPageEvents();
}

function renderWorkSummary(workItems) {
    const total = workItems.length;

    const active = workItems.filter((item) => {
        return ["active", "in-progress"].includes(item.status);
    }).length;

    const completed = workItems.filter((item) => {
        return item.status === "completed";
    }).length;

    const highPriority = workItems.filter((item) => {
        return ["high", "urgent"].includes(item.priority);
    }).length;

    return `
        <div class="work-summary">
            <div class="work-summary-card">
                <span>Total Work</span>
                <strong>${total}</strong>
            </div>

            <div class="work-summary-card">
                <span>Active</span>
                <strong>${active}</strong>
            </div>

            <div class="work-summary-card">
                <span>Completed</span>
                <strong>${completed}</strong>
            </div>

            <div class="work-summary-card">
                <span>High Priority</span>
                <strong>${highPriority}</strong>
            </div>
        </div>
    `;
}

function renderWorkList(workItems) {
    if (!workItems.length) {
        return `
            <div class="work-empty-state">
                <p class="eyebrow">No assignments yet</p>
                <h3>Create your first work item</h3>

                <p>
                    Add a task or assignment to begin tracking
                    Harmonia's work.
                </p>

                <button
                    class="primary-button"
                    type="button"
                    data-create-work
                >
                    Create Work
                </button>
            </div>
        `;
    }

    return workItems
        .map((workItem) => renderWorkCard(workItem))
        .join("");
}

function renderWorkCard(workItem) {
    const status = workItem.status || "planning";
    const priority = workItem.priority || "medium";

    const statusLabel = formatWorkLabel(status);
    const priorityLabel = formatWorkLabel(priority);
    const dueDate = formatWorkDueDate(workItem.dueDate);

    const project = getWorkProject(workItem.projectId);

    const projectTitle = project
        ? project.title || "Untitled Project"
        : "No Project";

    return `
        <article
            class="work-card"
            data-work-id="${escapeWorkAttribute(workItem.id)}"
        >
            <div class="work-card-main">
                <div class="work-card-topline">
                    <span
                        class="work-badge"
                        data-work-status="${escapeWorkAttribute(status)}"
                    >
                        ${escapeWorkHtml(statusLabel)}
                    </span>

                    <span
                        class="work-badge"
                        data-work-priority="${escapeWorkAttribute(priority)}"
                    >
                        ${escapeWorkHtml(priorityLabel)} Priority
                    </span>
                </div>

                <h3>
                    ${escapeWorkHtml(
                        workItem.title || "Untitled Work"
                    )}
                </h3>

                <div class="work-card-project">
                    <span>Project:</span>

                    <strong>
                        ${escapeWorkHtml(projectTitle)}
                    </strong>
                </div>

                ${
                    workItem.description
                        ? `
                            <p>
                                ${escapeWorkHtml(
                                    workItem.description
                                )}
                            </p>
                        `
                        : ""
                }

                <div class="work-card-meta">
                    <span>
                        Assignee:
                        <strong>
                            ${escapeWorkHtml(
                                workItem.assignee || "Unassigned"
                            )}
                        </strong>
                    </span>

                    <span>
                        Due:
                        <strong>
                            ${escapeWorkHtml(dueDate)}
                        </strong>
                    </span>
                </div>
            </div>

            <div class="work-card-actions">
                <button
                    class="text-button"
                    type="button"
                    data-edit-work="${escapeWorkAttribute(workItem.id)}"
                >
                    Edit
                </button>
            </div>
        </article>
    `;
}

function getWorkProject(projectId) {
    if (!projectId) {
        return null;
    }

    if (
        window.HarmoniaProjects &&
        typeof window.HarmoniaProjects.getById === "function"
    ) {
        return window.HarmoniaProjects.getById(projectId);
    }

    const projects =
        window.HarmoniaProjects?.getAll?.() || [];

    return (
        projects.find((project) => {
            return project.id === projectId;
        }) || null
    );
}

function bindWorkPageEvents() {
    const newWorkButton =
        document.getElementById("newWorkButton");

    newWorkButton?.addEventListener("click", () => {
        if (
            window.WorkModal &&
            typeof window.WorkModal.openCreate === "function"
        ) {
            window.WorkModal.openCreate();
        }
    });

    document
        .querySelectorAll("[data-create-work]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                if (
                    window.WorkModal &&
                    typeof window.WorkModal.openCreate === "function"
                ) {
                    window.WorkModal.openCreate();
                }
            });
        });

    document
        .querySelectorAll("[data-edit-work]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                const workId =
                    button.getAttribute("data-edit-work");

                if (
                    workId &&
                    window.WorkModal &&
                    typeof window.WorkModal.openEdit === "function"
                ) {
                    window.WorkModal.openEdit(workId);
                }
            });
        });
}

function refreshWorkPage() {
    const workPage = document.getElementById("work");

    if (!workPage) {
        return;
    }

    renderWorkPage();
}

function formatWorkLabel(value) {
    return String(value)
        .split("-")
        .map((word) => {
            return (
                word.charAt(0).toUpperCase() +
                word.slice(1)
            );
        })
        .join(" ");
}

function formatWorkDueDate(dateValue) {
    if (!dateValue) {
        return "No due date";
    }

    const parsedDate = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
        return dateValue;
    }

    return parsedDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function escapeWorkHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function escapeWorkAttribute(value) {
    return escapeWorkHtml(value)
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

document.addEventListener(
    "harmonia:work-updated",
    refreshWorkPage
);

window.renderWorkPage = renderWorkPage;
window.refreshWorkPage = refreshWorkPage;

console.log("✅ Work Page Loaded");