let activeWorkSelectionId = null;
let activeWorkSearch = "";
let activeWorkStatusFilter = "active";
let activeWorkPriorityFilter = "all";
let activeWorkProjectFilter = "all";

function escapeWorkPageHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatWorkLabel(value) {
    const labels = {
        backlog: "Backlog",
        todo: "To Do",
        "in-progress": "In Progress",
        waiting: "Waiting",
        completed: "Completed",
        low: "Low",
        medium: "Medium",
        high: "High",
        urgent: "Urgent"
    };

    return labels[value] || value || "None";
}

function getWorkProjectMap() {
    const map = new Map();

    const projects =
        typeof getWorkProjects === "function"
            ? getWorkProjects()
            : [];

    projects.forEach(project => {
        const id =
            project.id || project.projectId || "";

        const title =
            project.title ||
            project.name ||
            "Untitled Project";

        map.set(String(id), title);
    });

    return map;
}

function isWorkOverdue(item) {
    if (
        !item.dueDate ||
        item.status === "completed"
    ) {
        return false;
    }

    const due = new Date(
        `${item.dueDate}T23:59:59`
    );

    return due.getTime() < Date.now();
}

function formatWorkDate(dateValue) {
    if (!dateValue) {
        return "No due date";
    }

    const date = new Date(
        `${dateValue}T12:00:00`
    );

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            day: "numeric"
        }
    ).format(date);
}

function buildWorkPageShell() {
    const page =
        document.getElementById("work");

    if (!page) {
        return;
    }

    page.innerHTML = `
        <div class="work-page-v2">
            <div class="work-page-header">
                <div>
                    <p class="eyebrow">Execution</p>
                    <h2>Work</h2>
                    <p class="module-page-intro">
                        Organize tasks, connect them to projects, and keep the next action clear.
                    </p>
                </div>

                <button
                    class="primary-button"
                    type="button"
                    id="newWorkButton"
                >
                    + New Work
                </button>
            </div>

            <div class="work-summary-row">
                <button
                    class="work-summary-card active"
                    type="button"
                    data-work-summary="active"
                >
                    <span>Active</span>
                    <strong id="workActiveCount">0</strong>
                </button>

                <button
                    class="work-summary-card"
                    type="button"
                    data-work-summary="in-progress"
                >
                    <span>In Progress</span>
                    <strong id="workInProgressCount">0</strong>
                </button>

                <button
                    class="work-summary-card"
                    type="button"
                    data-work-summary="overdue"
                >
                    <span>Overdue</span>
                    <strong id="workOverdueCount">0</strong>
                </button>

                <button
                    class="work-summary-card"
                    type="button"
                    data-work-summary="completed"
                >
                    <span>Completed</span>
                    <strong id="workCompletedCount">0</strong>
                </button>
            </div>

            <div class="work-toolbar-v2">
                <label class="work-search-v2">
                    <span>Search</span>
                    <input
                        id="workSearchInput"
                        type="search"
                        placeholder="Search work, assignees, or notes"
                    />
                </label>

                <label>
                    <span>Status</span>
                    <select id="workStatusFilter">
                        <option value="active">Active work</option>
                        <option value="all">All statuses</option>
                        <option value="backlog">Backlog</option>
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="waiting">Waiting</option>
                        <option value="overdue">Overdue</option>
                        <option value="completed">Completed</option>
                    </select>
                </label>

                <label>
                    <span>Priority</span>
                    <select id="workPriorityFilter">
                        <option value="all">All priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </label>

                <label>
                    <span>Project</span>
                    <select id="workProjectFilter">
                        <option value="all">All projects</option>
                        <option value="none">No project</option>
                    </select>
                </label>
            </div>

            <div class="work-split-layout">
                <section class="work-list-pane">
                    <div class="work-list-heading">
                        <div>
                            <p class="panel-label">Queue</p>
                            <h3 id="workListTitle">Active Work</h3>
                        </div>

                        <span id="workVisibleCount">0 items</span>
                    </div>

                    <div
                        class="work-list-v2"
                        id="workList"
                    ></div>

                    <div
                        class="work-empty-state"
                        id="workEmptyState"
                        hidden
                    >
                        <h3>No work found</h3>
                        <p>
                            Create a work item or adjust the filters.
                        </p>
                    </div>
                </section>

                <aside
                    class="work-editor-pane"
                    id="workEditorPane"
                ></aside>
            </div>
        </div>
    `;
}

function populateWorkProjectFilter() {
    const filter =
        document.getElementById(
            "workProjectFilter"
        );

    if (!filter) {
        return;
    }

    const currentValue =
        filter.value || activeWorkProjectFilter;

    const projects =
        typeof getWorkProjects === "function"
            ? getWorkProjects()
            : [];

    filter.innerHTML = `
        <option value="all">All projects</option>
        <option value="none">No project</option>
        ${projects
            .map(project => {
                const id =
                    project.id ||
                    project.projectId ||
                    "";

                const title =
                    project.title ||
                    project.name ||
                    "Untitled Project";

                return `
                    <option value="${escapeWorkPageHtml(id)}">
                        ${escapeWorkPageHtml(title)}
                    </option>
                `;
            })
            .join("")}
    `;

    const optionExists = Array.from(
        filter.options
    ).some(
        option =>
            option.value === currentValue
    );

    filter.value =
        optionExists ? currentValue : "all";
}

function getFilteredWork(items) {
    const search =
        activeWorkSearch
            .trim()
            .toLowerCase();

    return items.filter(item => {
        const searchable = [
            item.title,
            item.description,
            item.assignee,
            item.notes
        ]
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            !search ||
            searchable.includes(search);

        let matchesStatus = true;

        if (activeWorkStatusFilter === "active") {
            matchesStatus =
                item.status !== "completed";
        } else if (
            activeWorkStatusFilter === "overdue"
        ) {
            matchesStatus = isWorkOverdue(item);
        } else if (
            activeWorkStatusFilter !== "all"
        ) {
            matchesStatus =
                item.status ===
                activeWorkStatusFilter;
        }

        const matchesPriority =
            activeWorkPriorityFilter === "all" ||
            item.priority ===
                activeWorkPriorityFilter;

        const matchesProject =
            activeWorkProjectFilter === "all" ||
            (
                activeWorkProjectFilter === "none" &&
                !item.projectId
            ) ||
            String(item.projectId || "") ===
                activeWorkProjectFilter;

        return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority &&
            matchesProject
        );
    });
}

function sortWorkItems(items) {
    const priorityOrder = {
        urgent: 0,
        high: 1,
        medium: 2,
        low: 3
    };

    const statusOrder = {
        "in-progress": 0,
        todo: 1,
        waiting: 2,
        backlog: 3,
        completed: 4
    };

    return [...items].sort((a, b) => {
        if (
            a.status === "completed" &&
            b.status !== "completed"
        ) {
            return 1;
        }

        if (
            b.status === "completed" &&
            a.status !== "completed"
        ) {
            return -1;
        }

        const aOverdue = isWorkOverdue(a);
        const bOverdue = isWorkOverdue(b);

        if (aOverdue !== bOverdue) {
            return aOverdue ? -1 : 1;
        }

        const aPriority =
            priorityOrder[a.priority] ?? 9;

        const bPriority =
            priorityOrder[b.priority] ?? 9;

        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }

        const aStatus =
            statusOrder[a.status] ?? 9;

        const bStatus =
            statusOrder[b.status] ?? 9;

        if (aStatus !== bStatus) {
            return aStatus - bStatus;
        }

        return String(a.dueDate || "9999-12-31")
            .localeCompare(
                String(b.dueDate || "9999-12-31")
            );
    });
}

function createWorkListItem(item, projectMap) {
    const row =
        document.createElement("article");

    row.className = "work-list-item";

    if (item.id === activeWorkSelectionId) {
        row.classList.add("selected");
    }

    if (item.status === "completed") {
        row.classList.add("completed");
    }

    if (isWorkOverdue(item)) {
        row.classList.add("overdue");
    }

    const projectName =
        item.projectId
            ? projectMap.get(
                  String(item.projectId)
              ) || "Linked project"
            : "No project";

    row.innerHTML = `
        <button
            class="work-complete-toggle"
            type="button"
            data-work-toggle="${escapeWorkPageHtml(item.id)}"
            aria-label="${
                item.status === "completed"
                    ? "Mark incomplete"
                    : "Mark completed"
            }"
        >
            ${item.status === "completed" ? "✓" : ""}
        </button>

        <button
            class="work-list-item-main"
            type="button"
            data-work-open="${escapeWorkPageHtml(item.id)}"
        >
            <div class="work-list-item-title-row">
                <h4>${escapeWorkPageHtml(item.title)}</h4>

                <span class="work-priority-badge priority-${escapeWorkPageHtml(
                    item.priority
                )}">
                    ${escapeWorkPageHtml(
                        formatWorkLabel(item.priority)
                    )}
                </span>
            </div>

            <p>
                ${escapeWorkPageHtml(
                    item.description ||
                        "No description added."
                )}
            </p>

            <div class="work-list-item-meta">
                <span class="work-status-dot status-${escapeWorkPageHtml(
                    item.status
                )}">
                    ${escapeWorkPageHtml(
                        formatWorkLabel(item.status)
                    )}
                </span>

                <span>
                    ${escapeWorkPageHtml(projectName)}
                </span>

                <span class="${
                    isWorkOverdue(item)
                        ? "work-due-overdue"
                        : ""
                }">
                    ${escapeWorkPageHtml(
                        formatWorkDate(item.dueDate)
                    )}
                </span>

                ${
                    item.assignee
                        ? `
                            <span>
                                ${escapeWorkPageHtml(item.assignee)}
                            </span>
                        `
                        : ""
                }
            </div>
        </button>
    `;

    return row;
}

function updateWorkSummary(items) {
    const summary = {
        active: items.filter(
            item => item.status !== "completed"
        ).length,
        inProgress: items.filter(
            item => item.status === "in-progress"
        ).length,
        overdue: items.filter(isWorkOverdue).length,
        completed: items.filter(
            item => item.status === "completed"
        ).length
    };

    const values = {
        workActiveCount: summary.active,
        workInProgressCount: summary.inProgress,
        workOverdueCount: summary.overdue,
        workCompletedCount: summary.completed
    };

    Object.entries(values).forEach(
        ([id, value]) => {
            const element =
                document.getElementById(id);

            if (element) {
                element.textContent =
                    String(value);
            }
        }
    );
}

function updateWorkSummaryButtons() {
    document
        .querySelectorAll(
            "[data-work-summary]"
        )
        .forEach(button => {
            const target =
                button.dataset.workSummary;

            button.classList.toggle(
                "active",
                activeWorkStatusFilter === target
            );
        });
}

function renderWorkPage() {
    const list =
        document.getElementById("workList");

    const emptyState =
        document.getElementById(
            "workEmptyState"
        );

    if (!list || !window.HarmoniaWork) {
        return;
    }

    populateWorkProjectFilter();

    const allItems =
        window.HarmoniaWork.getAll();

    const filteredItems = sortWorkItems(
        getFilteredWork(allItems)
    );

    const projectMap =
        getWorkProjectMap();

    list.innerHTML = "";

    filteredItems.forEach(item => {
        list.appendChild(
            createWorkListItem(
                item,
                projectMap
            )
        );
    });

    if (emptyState) {
        emptyState.hidden =
            filteredItems.length > 0;
    }

    const count =
        document.getElementById(
            "workVisibleCount"
        );

    if (count) {
        count.textContent =
            `${filteredItems.length} ${
                filteredItems.length === 1
                    ? "item"
                    : "items"
            }`;
    }

    const listTitle =
        document.getElementById(
            "workListTitle"
        );

    if (listTitle) {
        listTitle.textContent =
            activeWorkStatusFilter === "all"
                ? "All Work"
                : activeWorkStatusFilter === "active"
                    ? "Active Work"
                    : formatWorkLabel(
                        activeWorkStatusFilter
                    );
    }

    updateWorkSummary(allItems);
    updateWorkSummaryButtons();

    if (
        activeWorkSelectionId &&
        !window.HarmoniaWork.getById(
            activeWorkSelectionId
        )
    ) {
        activeWorkSelectionId = null;
        window.openWorkEditor?.();
    }
}

function setActiveWorkSelection(workId) {
    activeWorkSelectionId = workId;
    renderWorkPage();
}

function attachWorkPageListeners() {
    document
        .getElementById("newWorkButton")
        ?.addEventListener("click", () => {
            activeWorkSelectionId = null;
            window.openWorkEditor?.();
            renderWorkPage();
        });

    document
        .getElementById("workSearchInput")
        ?.addEventListener("input", event => {
            activeWorkSearch =
                event.target.value;

            renderWorkPage();
        });

    document
        .getElementById("workStatusFilter")
        ?.addEventListener("change", event => {
            activeWorkStatusFilter =
                event.target.value;

            renderWorkPage();
        });

    document
        .getElementById("workPriorityFilter")
        ?.addEventListener("change", event => {
            activeWorkPriorityFilter =
                event.target.value;

            renderWorkPage();
        });

    document
        .getElementById("workProjectFilter")
        ?.addEventListener("change", event => {
            activeWorkProjectFilter =
                event.target.value;

            renderWorkPage();
        });

    document
        .querySelectorAll(
            "[data-work-summary]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    activeWorkStatusFilter =
                        button.dataset.workSummary;

                    const filter =
                        document.getElementById(
                            "workStatusFilter"
                        );

                    if (filter) {
                        filter.value =
                            activeWorkStatusFilter;
                    }

                    renderWorkPage();
                }
            );
        });

    document
        .getElementById("workList")
        ?.addEventListener("click", event => {
            const toggle =
                event.target.closest(
                    "[data-work-toggle]"
                );

            if (toggle) {
                window.HarmoniaWork.toggleComplete(
                    toggle.dataset.workToggle
                );

                return;
            }

            const openButton =
                event.target.closest(
                    "[data-work-open]"
                );

            if (!openButton) {
                return;
            }

            const workId =
                openButton.dataset.workOpen;

            activeWorkSelectionId = workId;
            window.openWorkEditor?.(workId);
            renderWorkPage();
        });
}

function initializeWorkPage() {
    buildWorkPageShell();
    attachWorkPageListeners();
    renderWorkPage();
    window.openWorkEditor?.();
}

document.addEventListener(
    "harmonia:work-updated",
    renderWorkPage
);

document.addEventListener(
    "harmonia:projects-updated",
    () => {
        renderWorkPage();

        if (activeWorkSelectionId) {
            window.openWorkEditor?.(
                activeWorkSelectionId
            );
        }
    }
);

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeWorkPage
    );
} else {
    initializeWorkPage();
}

window.renderWorkPage = renderWorkPage;
window.refreshWorkPage = renderWorkPage;
window.setActiveWorkSelection =
    setActiveWorkSelection;

console.log("✅ Work Page v2 Loaded");