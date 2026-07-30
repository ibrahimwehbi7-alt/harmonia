console.log("Project Workspace Loaded");

let currentWorkspaceProject = null;

function openProjectWorkspace(projectId) {
    console.log(
        "Workspace opening:",
        projectId
    );

    if (
        !window.ProjectManager ||
        typeof window.ProjectManager
            .getProjectById !== "function"
    ) {
        console.error(
            "ProjectManager.getProjectById is not available."
        );
        return;
    }

    const project =
        window.ProjectManager
            .getProjectById(projectId);

    if (!project) {
        console.error(
            "Project could not be found:",
            projectId
        );
        return;
    }

    currentWorkspaceProject = project;

    const titleElement =
        document.getElementById(
            "workspaceProjectTitle"
        );

    const descriptionElement =
        document.getElementById(
            "workspaceProjectDescription"
        );

    const statusElement =
        document.getElementById(
            "workspaceProjectStatus"
        );

    const progressTextElement =
        document.getElementById(
            "workspaceProjectProgressText"
        );

    const progressFillElement =
        document.getElementById(
            "workspaceProjectProgressFill"
        );

    const colorElement =
        document.getElementById(
            "workspaceProjectColor"
        );

    if (titleElement) {
        titleElement.textContent =
            project.name ||
            project.title ||
            "Untitled Project";
    }

    if (descriptionElement) {
        descriptionElement.textContent =
            project.description ||
            "No description provided.";
    }

    if (statusElement) {
        statusElement.textContent =
            project.status || "Planning";
    }

    const progress = Math.max(
        0,
        Math.min(
            100,
            Number(project.progress) || 0
        )
    );

    if (progressTextElement) {
        progressTextElement.textContent =
            `${progress}%`;
    }

    if (progressFillElement) {
        progressFillElement.style.width =
            `${progress}%`;
    }

    if (colorElement) {
        colorElement.style.backgroundColor =
            project.color || "#cccccc";
    }

    showProjectWorkspacePage();
    renderWorkspaceTasks();
    renderWorkspaceEvents();
}

function renderWorkspaceTasks() {
    const taskContainer =
        document.getElementById(
            "workspaceTasksList"
        );

    const taskCountElement =
        document.getElementById(
            "workspaceTaskCount"
        );

    if (!taskContainer) {
        console.error(
            "workspaceTasksList was not found."
        );
        return;
    }

    if (!currentWorkspaceProject) {
        taskContainer.innerHTML =
            "<p>No project is currently open.</p>";

        if (taskCountElement) {
            taskCountElement.textContent =
                "0";
        }

        return;
    }

    if (
        !window.WorkManager ||
        typeof window.WorkManager
            .getAllWork !== "function"
    ) {
        taskContainer.innerHTML =
            "<p>Work Manager is unavailable.</p>";

        console.error(
            "WorkManager.getAllWork is not available."
        );
        return;
    }

    const tasks =
        window.WorkManager
            .getAllWork()
            .filter(task => {
                return (
                    String(task.projectId) ===
                    String(
                        currentWorkspaceProject.id
                    )
                );
            });

    if (taskCountElement) {
        taskCountElement.textContent =
            String(tasks.length);
    }

    taskContainer.innerHTML = "";

    if (tasks.length === 0) {
        taskContainer.innerHTML =
            "<p>No tasks have been added to this project yet.</p>";
        return;
    }

    tasks.forEach(task => {
        const taskCard =
            document.createElement("article");

        taskCard.className =
            "workspace-task-card";

        const taskTitle =
            document.createElement("h4");

        taskTitle.textContent =
            task.title ||
            task.name ||
            "Untitled Task";

        const taskDescription =
            document.createElement("p");

        taskDescription.textContent =
            task.description ||
            task.details ||
            "No description provided.";

        const taskStatus =
            document.createElement("span");

        taskStatus.textContent =
            task.status ||
            "Not started";

        taskCard.appendChild(taskTitle);
        taskCard.appendChild(
            taskDescription
        );
        taskCard.appendChild(taskStatus);

        taskContainer.appendChild(
            taskCard
        );
    });
}

function formatWorkspaceEventDate(dateValue) {
    if (!dateValue) {
        return "Date not set";
    }

    const date =
        new Date(`${dateValue}T00:00:00`);

    if (
        Number.isNaN(date.getTime())
    ) {
        return dateValue;
    }

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}

function formatWorkspaceEventTime(timeValue) {
    if (!timeValue) {
        return "";
    }

    const parts =
        timeValue.split(":").map(Number);

    const hours = parts[0];
    const minutes = parts[1];

    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
    ) {
        return timeValue;
    }

    const date = new Date();

    date.setHours(
        hours,
        minutes,
        0,
        0
    );

    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}

function renderWorkspaceEvents() {
    const eventContainer =
        document.getElementById(
            "workspaceEventsList"
        );

    const eventCountElement =
        document.getElementById(
            "workspaceEventCount"
        );

    if (!eventContainer) {
        console.error(
            "workspaceEventsList was not found."
        );
        return;
    }

    if (!currentWorkspaceProject) {
        eventContainer.innerHTML =
            "<p>No project is currently open.</p>";

        if (eventCountElement) {
            eventCountElement.textContent =
                "0";
        }

        return;
    }

    if (
        !window.HarmoniaEvents ||
        typeof window.HarmoniaEvents
            .getByProjectId !== "function"
    ) {
        eventContainer.innerHTML =
            "<p>Events Manager is unavailable.</p>";

        console.error(
            "HarmoniaEvents.getByProjectId is unavailable."
        );
        return;
    }

    const events =
        window.HarmoniaEvents
            .getByProjectId(
                currentWorkspaceProject.id
            )
            .sort(
                (
                    firstEvent,
                    secondEvent
                ) => {
                    const firstDate =
                        firstEvent.startDate ||
                        "9999-12-31";

                    const secondDate =
                        secondEvent.startDate ||
                        "9999-12-31";

                    return firstDate.localeCompare(
                        secondDate
                    );
                }
            );

    if (eventCountElement) {
        eventCountElement.textContent =
            String(events.length);
    }

    eventContainer.innerHTML = "";

    if (events.length === 0) {
        eventContainer.innerHTML =
            "<p>No events have been added to this project yet.</p>";
        return;
    }

    events.forEach(event => {
        const eventCard =
            document.createElement(
                "article"
            );

        eventCard.className =
            "workspace-task-card workspace-event-card";

        const heading =
            document.createElement("div");

        heading.className =
            "workspace-event-heading";

        const title =
            document.createElement("h4");

        title.textContent =
            event.title ||
            "Untitled Event";

        const status =
            document.createElement("span");

        status.textContent =
            event.status || "Planning";

        heading.appendChild(title);
        heading.appendChild(status);

        const date =
            document.createElement("p");

        let dateText =
            formatWorkspaceEventDate(
                event.startDate
            );

        if (event.startTime) {
            dateText +=
                ` · ${formatWorkspaceEventTime(
                    event.startTime
                )}`;
        }

        date.textContent = dateText;

        const location =
            document.createElement("p");

        location.textContent =
            event.location ||
            "Location not set";

        const description =
            document.createElement("p");

        description.textContent =
            event.description ||
            "No description provided.";

        const actions =
            document.createElement("div");

        actions.className =
            "event-card-actions";

        const editButton =
            document.createElement(
                "button"
            );

        editButton.type = "button";
        editButton.className =
            "task-action-button";
        editButton.textContent = "Edit";

        editButton.addEventListener(
            "click",
            () => {
                if (
                    typeof window
                        .openEventModal ===
                    "function"
                ) {
                    window.openEventModal(
                        event
                    );
                }
            }
        );

        const deleteButton =
            document.createElement(
                "button"
            );

        deleteButton.type = "button";
        deleteButton.className =
            "task-action-button danger";
        deleteButton.textContent =
            "Delete";

        deleteButton.addEventListener(
            "click",
            () => {
                const confirmed =
                    window.confirm(
                        `Delete "${event.title}"?`
                    );

                if (!confirmed) {
                    return;
                }

                window.HarmoniaEvents
                    .delete(event.id);

                document.dispatchEvent(
                    new CustomEvent(
                        "harmonia:events-updated"
                    )
                );
            }
        );

        actions.appendChild(
            editButton
        );

        actions.appendChild(
            deleteButton
        );

        eventCard.appendChild(heading);
        eventCard.appendChild(date);
        eventCard.appendChild(location);
        eventCard.appendChild(
            description
        );
        eventCard.appendChild(actions);

        eventContainer.appendChild(
            eventCard
        );
    });
}

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

    document
        .querySelectorAll(".admin-page")
        .forEach(page => {
            page.classList.remove("active");
            page.hidden = true;
        });

    workspacePage.hidden = false;
    workspacePage.removeAttribute("hidden");
    workspacePage.classList.add("active");

    const pageTitle =
        document.getElementById("pageTitle");

    if (pageTitle) {
        pageTitle.textContent =
            currentWorkspaceProject?.title ||
            currentWorkspaceProject?.name ||
            "Project Workspace";
    }
}


function backToProjects() {
    const workspacePage =
        document.getElementById(
            "project-workspace"
        );

    const projectsPage =
        document.getElementById(
            "projects"
        );

    if (workspacePage) {
        workspacePage.classList.remove(
            "active"
        );
        workspacePage.hidden = true;
    }

    if (projectsPage) {
        projectsPage.hidden = false;
        projectsPage.removeAttribute("hidden");
        projectsPage.classList.add(
            "active"
        );
    }

    const pageTitle =
        document.getElementById(
            "pageTitle"
        );

    if (pageTitle) {
        pageTitle.textContent =
            "Projects";
    }

    currentWorkspaceProject = null;
}

function initializeWorkspaceTabs() {
    const tabs =
        document.querySelectorAll(
            "[data-project-tab]"
        );

    const panels =
        document.querySelectorAll(
            "[data-project-panel]"
        );

    tabs.forEach(tab => {
        tab.addEventListener(
            "click",
            function () {
                const selectedTab =
                    tab.dataset
                        .projectTab;

                tabs.forEach(item => {
                    item.classList.toggle(
                        "active",
                        item === tab
                    );
                });

                panels.forEach(panel => {
                    const shouldShow =
                        panel.dataset
                            .projectPanel ===
                        selectedTab;

                    panel.hidden =
                        !shouldShow;

                    panel.classList.toggle(
                        "active",
                        shouldShow
                    );
                });

                if (
                    selectedTab ===
                    "tasks"
                ) {
                    renderWorkspaceTasks();
                }

                if (
                    selectedTab ===
                    "events"
                ) {
                    renderWorkspaceEvents();
                }
            }
        );
    });
}


function openWorkspaceAdminPage(pageId) {
    if (
        typeof window.openAdminPage ===
        "function"
    ) {
        window.openAdminPage(pageId);
        return true;
    }

    const targetPage =
        document.getElementById(pageId);

    if (!targetPage) {
        console.error(
            `Admin page "${pageId}" was not found.`
        );
        return false;
    }

    document
        .querySelectorAll(".admin-page")
        .forEach(page => {
            page.classList.remove("active");
            page.hidden = true;
        });

    targetPage.hidden = false;
    targetPage.removeAttribute("hidden");
    targetPage.classList.add("active");

    return true;
}

function setWorkspaceEditorProject(
    fieldId,
    projectId
) {
    const field =
        document.getElementById(fieldId);

    if (!field) {
        return false;
    }

    field.value = String(projectId);

    field.dispatchEvent(
        new Event(
            "change",
            { bubbles: true }
        )
    );

    field.dispatchEvent(
        new Event(
            "input",
            { bubbles: true }
        )
    );

    return true;
}

function openWorkspaceTaskEditor() {
    if (!currentWorkspaceProject) {
        console.error(
            "No project is currently open."
        );
        return;
    }

    if (
        typeof window.openWorkEditor !==
        "function"
    ) {
        console.error(
            "openWorkEditor is unavailable."
        );
        return;
    }

    const projectId =
        currentWorkspaceProject.id;

    openWorkspaceAdminPage("work");
    window.openWorkEditor();

    window.requestAnimationFrame(() => {
        setWorkspaceEditorProject(
            "workEditorProject",
            projectId
        );
    });
}

function openWorkspaceNoteEditor() {
    if (!currentWorkspaceProject) {
        console.error(
            "No project is currently open."
        );
        return;
    }

    const projectId =
        currentWorkspaceProject.id;

    openWorkspaceAdminPage("notes");

    if (
        typeof window.openNoteEditor ===
        "function"
    ) {
        window.openNoteEditor();

        window.requestAnimationFrame(() => {
            setWorkspaceEditorProject(
                "noteEditorProject",
                projectId
            );
        });

        return;
    }

    if (
        window.NoteModal &&
        typeof window.NoteModal.openCreate ===
        "function"
    ) {
        window.NoteModal.openCreate({
            projectId
        });
        return;
    }

    if (
        window.NotesModal &&
        typeof window.NotesModal.openCreate ===
        "function"
    ) {
        window.NotesModal.openCreate({
            projectId
        });
        return;
    }

    console.error(
        "No compatible Note editor was found."
    );
}

function openWorkspaceFileEditor() {
    if (!currentWorkspaceProject) {
        console.error(
            "No project is currently open."
        );
        return;
    }

    const projectId =
        currentWorkspaceProject.id;

    openWorkspaceAdminPage("files");

    if (
        typeof window.openFileEditor ===
        "function"
    ) {
        window.openFileEditor();

        window.requestAnimationFrame(() => {
            setWorkspaceEditorProject(
                "fileEditorProject",
                projectId
            );
        });

        return;
    }

    if (
        window.FileModal &&
        typeof window.FileModal.openCreate ===
        "function"
    ) {
        window.FileModal.openCreate({
            projectId
        });
        return;
    }

    if (
        window.FilesModal &&
        typeof window.FilesModal.openCreate ===
        "function"
    ) {
        window.FilesModal.openCreate({
            projectId
        });
        return;
    }

    console.error(
        "No compatible File editor was found."
    );
}

function initializeProjectWorkspace() {
    console.log(
        "Initializing Project Workspace"
    );

    const addTaskButton =
        document.getElementById(
            "addWorkspaceTaskButton"
        );

    if (addTaskButton) {
        addTaskButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                openWorkspaceTaskEditor();
            }
        );
    } else {
        console.error(
            "Add Workspace Task button was not found."
        );
    }

    const addNoteButton =
        document.getElementById(
            "addWorkspaceNoteButton"
        );

    if (addNoteButton) {
        addNoteButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                openWorkspaceNoteEditor();
            }
        );
    }

    const addFileButton =
        document.getElementById(
            "addWorkspaceFileButton"
        );

    if (addFileButton) {
        addFileButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                openWorkspaceFileEditor();
            }
        );
    }

    const addEventButton =
        document.getElementById(
            "addWorkspaceEventButton"
        );

    if (addEventButton) {
        addEventButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();

                if (
                    !currentWorkspaceProject
                ) {
                    console.error(
                        "No project is currently open."
                    );
                    return;
                }

                if (
                    typeof window
                        .openEventModal !==
                    "function"
                ) {
                    console.error(
                        "openEventModal is unavailable."
                    );
                    return;
                }

                window.openEventModal(null, {
                    projectId:
                        currentWorkspaceProject.id
                });
            }
        );
    } else {
        console.error(
            "Add Workspace Event button was not found."
        );
    }

    const backButton =
        document.getElementById(
            "backToProjectsButton"
        );

    if (backButton) {
        backButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                backToProjects();
            }
        );
    }

    const editButton =
        document.getElementById(
            "editWorkspaceProjectButton"
        );

    if (editButton) {
        editButton.addEventListener(
            "click",
            function () {
                if (
                    currentWorkspaceProject &&
                    window.ProjectModal &&
                    typeof window.ProjectModal
                        .openEdit ===
                        "function"
                ) {
                    window.ProjectModal.openEdit(
                        currentWorkspaceProject.id
                    );
                }
            }
        );
    }

    initializeWorkspaceTabs();
}

document.addEventListener(
    "harmonia:work-updated",
    function () {
        if (currentWorkspaceProject) {
            renderWorkspaceTasks();
        }
    }
);

document.addEventListener(
    "harmonia:events-updated",
    function () {
        if (currentWorkspaceProject) {
            renderWorkspaceEvents();
        }
    }
);

window.openProjectWorkspace =
    openProjectWorkspace;

window.renderWorkspaceTasks =
    renderWorkspaceTasks;

window.renderWorkspaceEvents =
    renderWorkspaceEvents;

window.showProjectWorkspacePage =
    showProjectWorkspacePage;

window.backToProjects =
    backToProjects;

window.initializeProjectWorkspace =
    initializeProjectWorkspace;

window.openWorkspaceTaskEditor =
    openWorkspaceTaskEditor;

window.openWorkspaceNoteEditor =
    openWorkspaceNoteEditor;

window.openWorkspaceFileEditor =
    openWorkspaceFileEditor;