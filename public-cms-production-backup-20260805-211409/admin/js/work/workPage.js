console.log("Loading Railway Work Page");

let activeWorkSelectionId = null;
let activeWorkSearch = "";
let activeWorkStatusFilter = "active";
let activeWorkPriorityFilter = "all";
let activeWorkProjectFilter = "all";
let workPageInitialized = false;

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

function getWorkProjectsForPage() {
    if (
        window.ProjectManager &&
        typeof window.ProjectManager
            .getAllProjects === "function"
    ) {
        const projects =
            window.ProjectManager
                .getAllProjects();

        return Array.isArray(projects)
            ? projects
            : [];
    }

    if (
        window.HarmoniaProjects &&
        typeof window.HarmoniaProjects
            .getAll === "function"
    ) {
        const projects =
            window.HarmoniaProjects
                .getAll();

        return Array.isArray(projects)
            ? projects
            : [];
    }

    return [];
}

function getWorkProjectMap() {
    const map = new Map();
    const projects =
        getWorkProjectsForPage();

    projects.forEach(project => {
        const projectId =
            project.id ||
            project.projectId ||
            "";

        const projectTitle =
            project.title ||
            project.name ||
            "Untitled Project";

        map.set(
            String(projectId),
            projectTitle
        );
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

    const dueDate =
        new Date(
            `${item.dueDate}T23:59:59`
        );

    if (
        Number.isNaN(
            dueDate.getTime()
        )
    ) {
        return false;
    }

    return (
        dueDate.getTime() <
        Date.now()
    );
}

function formatWorkDate(value) {
    if (!value) {
        return "No due date";
    }

    const date =
        new Date(
            `${value}T12:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            day: "numeric"
        }
    ).format(date);
}

function setWorkRailwayStatus(
    message,
    state = ""
) {
    const status =
        document.getElementById(
            "workRailwayStatus"
        );

    if (!status) {
        return;
    }

    status.textContent = message;
    status.dataset.state = state;
}

function buildWorkPageShell() {
    const page =
        document.getElementById(
            "work"
        );

    if (!page) {
        console.error(
            'The admin page with id "work" was not found.'
        );

        return false;
    }

    page.innerHTML = `
        <div class="work-page-v2">
            <div class="work-page-header">
                <div>
                    <p class="eyebrow">
                        Execution
                    </p>

                    <h2>Work</h2>

                    <p class="module-page-intro">
                        Organize tasks, connect them to projects,
                        and keep the next action clear.
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
                    <strong id="workActiveCount">
                        0
                    </strong>
                </button>

                <button
                    class="work-summary-card"
                    type="button"
                    data-work-summary="in-progress"
                >
                    <span>In Progress</span>
                    <strong id="workInProgressCount">
                        0
                    </strong>
                </button>

                <button
                    class="work-summary-card"
                    type="button"
                    data-work-summary="overdue"
                >
                    <span>Overdue</span>
                    <strong id="workOverdueCount">
                        0
                    </strong>
                </button>

                <button
                    class="work-summary-card"
                    type="button"
                    data-work-summary="completed"
                >
                    <span>Completed</span>
                    <strong id="workCompletedCount">
                        0
                    </strong>
                </button>
            </div>

            <div class="work-toolbar-v2">
                <label class="work-search-v2">
                    <span>Search</span>

                    <input
                        id="workSearchInput"
                        type="search"
                        placeholder="Search work"
                    />
                </label>

                <label>
                    <span>Status</span>

                    <select id="workStatusFilter">
                        <option value="active">
                            Active work
                        </option>

                        <option value="all">
                            All statuses
                        </option>

                        <option value="backlog">
                            Backlog
                        </option>

                        <option value="todo">
                            To Do
                        </option>

                        <option value="in-progress">
                            In Progress
                        </option>

                        <option value="waiting">
                            Waiting
                        </option>

                        <option value="overdue">
                            Overdue
                        </option>

                        <option value="completed">
                            Completed
                        </option>
                    </select>
                </label>

                <label>
                    <span>Priority</span>

                    <select id="workPriorityFilter">
                        <option value="all">
                            All priorities
                        </option>

                        <option value="urgent">
                            Urgent
                        </option>

                        <option value="high">
                            High
                        </option>

                        <option value="medium">
                            Medium
                        </option>

                        <option value="low">
                            Low
                        </option>
                    </select>
                </label>

                <label>
                    <span>Project</span>

                    <select id="workProjectFilter">
                        <option value="all">
                            All projects
                        </option>

                        <option value="none">
                            No project
                        </option>
                    </select>
                </label>
            </div>

            <p
                id="workRailwayStatus"
                class="work-editor-save-status"
            ></p>

            <div class="work-split-layout">
                <section class="work-list-pane">
                    <div class="work-list-heading">
                        <div>
                            <p class="panel-label">
                                Queue
                            </p>

                            <h3 id="workListTitle">
                                Active Work
                            </h3>
                        </div>

                        <span id="workVisibleCount">
                            0 items
                        </span>
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
                            Create a work item or
                            adjust the filters.
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

    return true;
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
        activeWorkProjectFilter;

    const projects =
        getWorkProjectsForPage();

    filter.innerHTML = `
        <option value="all">
            All projects
        </option>

        <option value="none">
            No project
        </option>

        ${projects
            .map(project => {
                const projectId =
                    project.id ||
                    project.projectId ||
                    "";

                const projectTitle =
                    project.title ||
                    project.name ||
                    "Untitled Project";

                return `
                    <option
                        value="${escapeWorkPageHtml(
                            projectId
                        )}"
                    >
                        ${escapeWorkPageHtml(
                            projectTitle
                        )}
                    </option>
                `;
            })
            .join("")}
    `;

    const valueExists =
        Array.from(
            filter.options
        ).some(
            option =>
                option.value ===
                currentValue
        );

    filter.value =
        valueExists
            ? currentValue
            : "all";

    activeWorkProjectFilter =
        filter.value;
}

function getFilteredWork(items) {
    const search =
        activeWorkSearch
            .trim()
            .toLowerCase();

    return items.filter(item => {
        const searchableText = [
            item.title,
            item.description,
            item.assignee,
            item.notes
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            !search ||
            searchableText.includes(
                search
            );

        let matchesStatus = true;

        if (
            activeWorkStatusFilter ===
            "active"
        ) {
            matchesStatus =
                item.status !==
                "completed";
        } else if (
            activeWorkStatusFilter ===
            "overdue"
        ) {
            matchesStatus =
                isWorkOverdue(item);
        } else if (
            activeWorkStatusFilter !==
            "all"
        ) {
            matchesStatus =
                item.status ===
                activeWorkStatusFilter;
        }

        const matchesPriority =
            activeWorkPriorityFilter ===
                "all" ||
            item.priority ===
                activeWorkPriorityFilter;

        const matchesProject =
            activeWorkProjectFilter ===
                "all" ||
            (
                activeWorkProjectFilter ===
                    "none" &&
                !item.projectId
            ) ||
            String(
                item.projectId || ""
            ) ===
                String(
                    activeWorkProjectFilter
                );

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

    return [...items].sort(
        (firstItem, secondItem) => {
            if (
                firstItem.status ===
                    "completed" &&
                secondItem.status !==
                    "completed"
            ) {
                return 1;
            }

            if (
                secondItem.status ===
                    "completed" &&
                firstItem.status !==
                    "completed"
            ) {
                return -1;
            }

            const firstOverdue =
                isWorkOverdue(
                    firstItem
                );

            const secondOverdue =
                isWorkOverdue(
                    secondItem
                );

            if (
                firstOverdue !==
                secondOverdue
            ) {
                return firstOverdue
                    ? -1
                    : 1;
            }

            const firstPriority =
                priorityOrder[
                    firstItem.priority
                ] ?? 9;

            const secondPriority =
                priorityOrder[
                    secondItem.priority
                ] ?? 9;

            if (
                firstPriority !==
                secondPriority
            ) {
                return (
                    firstPriority -
                    secondPriority
                );
            }

            const firstStatus =
                statusOrder[
                    firstItem.status
                ] ?? 9;

            const secondStatus =
                statusOrder[
                    secondItem.status
                ] ?? 9;

            if (
                firstStatus !==
                secondStatus
            ) {
                return (
                    firstStatus -
                    secondStatus
                );
            }

            return String(
                firstItem.dueDate ||
                "9999-12-31"
            ).localeCompare(
                String(
                    secondItem.dueDate ||
                    "9999-12-31"
                )
            );
        }
    );
}

function createWorkListItem(
    item,
    projectMap
) {
    const row =
        document.createElement(
            "article"
        );

    row.className =
        "work-list-item";

    if (
        String(item.id) ===
        String(
            activeWorkSelectionId
        )
    ) {
        row.classList.add(
            "selected"
        );
    }

    if (
        item.status ===
        "completed"
    ) {
        row.classList.add(
            "completed"
        );
    }

    if (isWorkOverdue(item)) {
        row.classList.add(
            "overdue"
        );
    }

    const projectName =
        item.projectId
            ? projectMap.get(
                  String(
                      item.projectId
                  )
              ) ||
              item.project?.title ||
              item.project?.name ||
              "Linked project"
            : "No project";

    row.innerHTML = `
        <button
            class="work-complete-toggle"
            type="button"
            data-work-toggle="${escapeWorkPageHtml(
                item.id
            )}"
            aria-label="${
                item.status ===
                "completed"
                    ? "Mark incomplete"
                    : "Mark completed"
            }"
        >
            ${
                item.status ===
                "completed"
                    ? "✓"
                    : ""
            }
        </button>

        <button
            class="work-list-item-main"
            type="button"
            data-work-open="${escapeWorkPageHtml(
                item.id
            )}"
        >
            <div class="work-list-item-title-row">
                <h4>
                    ${escapeWorkPageHtml(
                        item.title ||
                        "Untitled Work"
                    )}
                </h4>

                <span
                    class="work-priority-badge priority-${escapeWorkPageHtml(
                        item.priority
                    )}"
                >
                    ${escapeWorkPageHtml(
                        formatWorkLabel(
                            item.priority
                        )
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
                <span
                    class="work-status-dot status-${escapeWorkPageHtml(
                        item.status
                    )}"
                >
                    ${escapeWorkPageHtml(
                        formatWorkLabel(
                            item.status
                        )
                    )}
                </span>

                <span>
                    ${escapeWorkPageHtml(
                        projectName
                    )}
                </span>

                <span
                    class="${
                        isWorkOverdue(item)
                            ? "work-due-overdue"
                            : ""
                    }"
                >
                    ${escapeWorkPageHtml(
                        formatWorkDate(
                            item.dueDate
                        )
                    )}
                </span>

                ${
                    item.assignee
                        ? `
                            <span>
                                ${escapeWorkPageHtml(
                                    item.assignee
                                )}
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
    const summaryValues = {
        workActiveCount:
            items.filter(
                item =>
                    item.status !==
                    "completed"
            ).length,

        workInProgressCount:
            items.filter(
                item =>
                    item.status ===
                    "in-progress"
            ).length,

        workOverdueCount:
            items.filter(
                isWorkOverdue
            ).length,

        workCompletedCount:
            items.filter(
                item =>
                    item.status ===
                    "completed"
            ).length
    };

    Object.entries(
        summaryValues
    ).forEach(
        ([elementId, value]) => {
            const element =
                document.getElementById(
                    elementId
                );

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
                button.dataset
                    .workSummary;

            button.classList.toggle(
                "active",
                activeWorkStatusFilter ===
                    target
            );
        });
}

function updateWorkListTitle() {
    const listTitle =
        document.getElementById(
            "workListTitle"
        );

    if (!listTitle) {
        return;
    }

    if (
        activeWorkStatusFilter ===
        "all"
    ) {
        listTitle.textContent =
            "All Work";

        return;
    }

    if (
        activeWorkStatusFilter ===
        "active"
    ) {
        listTitle.textContent =
            "Active Work";

        return;
    }

    if (
        activeWorkStatusFilter ===
        "overdue"
    ) {
        listTitle.textContent =
            "Overdue Work";

        return;
    }

    listTitle.textContent =
        formatWorkLabel(
            activeWorkStatusFilter
        );
}

function renderWorkPage() {
    const list =
        document.getElementById(
            "workList"
        );

    const emptyState =
        document.getElementById(
            "workEmptyState"
        );

    if (!list) {
        return;
    }

    if (
        !window.HarmoniaWork ||
        typeof window.HarmoniaWork
            .getAll !== "function"
    ) {
        list.innerHTML = `
            <p>
                Railway Work Manager is unavailable.
            </p>
        `;

        return;
    }

    populateWorkProjectFilter();

    const loadedItems =
        window.HarmoniaWork
            .getAll();

    const allItems =
        Array.isArray(loadedItems)
            ? loadedItems
            : [];

    const filteredItems =
        sortWorkItems(
            getFilteredWork(
                allItems
            )
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
            filteredItems.length >
            0;
    }

    const visibleCount =
        document.getElementById(
            "workVisibleCount"
        );

    if (visibleCount) {
        visibleCount.textContent =
            `${filteredItems.length} ${
                filteredItems.length ===
                1
                    ? "item"
                    : "items"
            }`;
    }

    updateWorkSummary(allItems);
    updateWorkSummaryButtons();
    updateWorkListTitle();

    if (
        activeWorkSelectionId &&
        !window.HarmoniaWork
            .getById(
                activeWorkSelectionId
            )
    ) {
        activeWorkSelectionId =
            null;

        window.openWorkEditor?.();
    }
}

function setActiveWorkSelection(
    workId
) {
    activeWorkSelectionId =
        workId || null;

    renderWorkPage();
}

function attachWorkPageListeners() {
    document
        .getElementById(
            "newWorkButton"
        )
        ?.addEventListener(
            "click",
            () => {
                activeWorkSelectionId =
                    null;

                window.openWorkEditor?.();

                renderWorkPage();
            }
        );

    document
        .getElementById(
            "workSearchInput"
        )
        ?.addEventListener(
            "input",
            event => {
                activeWorkSearch =
                    event.target.value ||
                    "";

                renderWorkPage();
            }
        );

    document
        .getElementById(
            "workStatusFilter"
        )
        ?.addEventListener(
            "change",
            event => {
                activeWorkStatusFilter =
                    event.target.value ||
                    "active";

                renderWorkPage();
            }
        );

    document
        .getElementById(
            "workPriorityFilter"
        )
        ?.addEventListener(
            "change",
            event => {
                activeWorkPriorityFilter =
                    event.target.value ||
                    "all";

                renderWorkPage();
            }
        );

    document
        .getElementById(
            "workProjectFilter"
        )
        ?.addEventListener(
            "change",
            event => {
                activeWorkProjectFilter =
                    event.target.value ||
                    "all";

                renderWorkPage();
            }
        );

    document
        .querySelectorAll(
            "[data-work-summary]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    activeWorkStatusFilter =
                        button.dataset
                            .workSummary ||
                        "active";

                    const statusFilter =
                        document.getElementById(
                            "workStatusFilter"
                        );

                    if (statusFilter) {
                        statusFilter.value =
                            activeWorkStatusFilter;
                    }

                    renderWorkPage();
                }
            );
        });

    document
        .getElementById(
            "workList"
        )
        ?.addEventListener(
            "click",
            async event => {
                const toggleButton =
                    event.target.closest(
                        "[data-work-toggle]"
                    );

                if (toggleButton) {
                    toggleButton.disabled =
                        true;

                    try {
                        await window
                            .HarmoniaWork
                            .toggleComplete(
                                toggleButton
                                    .dataset
                                    .workToggle
                            );
                    } catch (error) {
                        console.error(
                            "Could not update task:",
                            error
                        );

                        window.alert(
                            error?.message ||
                            "The task could not be updated."
                        );
                    } finally {
                        toggleButton.disabled =
                            false;
                    }

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
                    openButton.dataset
                        .workOpen;

                activeWorkSelectionId =
                    workId;

                window.openWorkEditor?.(
                    workId
                );

                renderWorkPage();
            }
        );
}

async function initializeWorkPage() {
    if (workPageInitialized) {
        return;
    }

    const shellCreated =
        buildWorkPageShell();

    if (!shellCreated) {
        return;
    }

    workPageInitialized = true;

    attachWorkPageListeners();

    window.openWorkEditor?.();

    setWorkRailwayStatus(
        "Loading tasks from Railway…",
        "loading"
    );

    if (
        !window.HarmoniaWork ||
        typeof window.HarmoniaWork
            .load !== "function"
    ) {
        setWorkRailwayStatus(
            "Railway Work Manager is unavailable.",
            "error"
        );

        console.error(
            "window.HarmoniaWork.load is unavailable."
        );

        return;
    }

    try {
        await window
            .HarmoniaWork
            .load();

        setWorkRailwayStatus(
            "Connected to Railway.",
            "connected"
        );

        renderWorkPage();
    } catch (error) {
        console.error(
            "Railway work loading failed:",
            error
        );

        setWorkRailwayStatus(
            error?.message ||
            "Tasks could not be loaded.",
            "error"
        );

        renderWorkPage();
    }
}

function startRailwayWorkPage() {
    initializeWorkPage()
        .catch(error => {
            console.error(
                "Work page initialization failed:",
                error
            );

            const page =
                document.getElementById(
                    "work"
                );

            if (page) {
                page.innerHTML = `
                    <div class="work-page-v2">
                        <div class="work-empty-state">
                            <h3>
                                Work could not load
                            </h3>

                            <p>
                                ${escapeWorkPageHtml(
                                    error?.message ||
                                    "An unexpected error occurred."
                                )}
                            </p>
                        </div>
                    </div>
                `;
            }
        });
}

document.addEventListener(
    "harmonia:work-updated",
    renderWorkPage
);

document.addEventListener(
    "harmonia:projects-updated",
    () => {
        populateWorkProjectFilter();
        renderWorkPage();

        if (
            activeWorkSelectionId
        ) {
            window.openWorkEditor?.(
                activeWorkSelectionId
            );
        }
    }
);

window.initializeWorkPage =
    initializeWorkPage;

window.renderWorkPage =
    renderWorkPage;

window.refreshWorkPage =
    renderWorkPage;

window.setActiveWorkSelection =
    setActiveWorkSelection;

document.addEventListener(
    "harmonia:authenticated",
    () => {
        startRailwayWorkPage();
    }
);

if (
    window.HarmoniaApi?.isAuthenticated?.()
) {
    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            startRailwayWorkPage,
            {
                once: true
            }
        );
    } else {
        startRailwayWorkPage();
    }
}

console.log(
    "✅ Railway Work Page Loaded"
);