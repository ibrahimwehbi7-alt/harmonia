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
            project.title ||
            project.name ||
            "Untitled Project";
    }

    if (descriptionElement) {
        descriptionElement.textContent =
            project.description ||
            "No description provided.";
    }

    if (statusElement) {
        statusElement.textContent =
            typeof window.formatProjectStatus ===
            "function"
                ? window.formatProjectStatus(
                    project.status
                )
                : project.status ||
                  "Planning";
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
            project.color ||
            "#cccccc";
    }

    showProjectWorkspacePage();
    renderWorkspaceTasks();
    renderWorkspaceEvents();
    renderWorkspaceNotes();
    renderWorkspaceFiles();
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
            taskCountElement.textContent = "0";
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

    const allWork =
        window.WorkManager.getAllWork();

    const tasks = Array.isArray(allWork)
        ? allWork.filter(task => {
              return (
                  String(task.projectId) ===
                  String(
                      currentWorkspaceProject.id
                  )
              );
          })
        : [];

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

        taskStatus.className =
            "workspace-task-status";

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

function formatWorkspaceEventDate(
    dateValue
) {
    if (!dateValue) {
        return "Date not set";
    }

    const date = new Date(
        `${dateValue}T00:00:00`
    );

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

function formatWorkspaceEventTime(
    timeValue
) {
    if (!timeValue) {
        return "";
    }

    const parts =
        timeValue
            .split(":")
            .map(Number);

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

    const projectEvents =
        window.HarmoniaEvents
            .getByProjectId(
                currentWorkspaceProject.id
            );

    const events =
        Array.isArray(projectEvents)
            ? [...projectEvents].sort(
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

                      return firstDate
                          .localeCompare(
                              secondDate
                          );
                  }
              )
            : [];

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
            event.status ||
            "Planning";

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
                } else {
                    console.error(
                        "openEventModal is unavailable."
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
                        `Delete "${
                            event.title ||
                            "this event"
                        }"?`
                    );

                if (!confirmed) {
                    return;
                }

                if (
                    window.HarmoniaEvents &&
                    typeof window
                        .HarmoniaEvents
                        .delete ===
                        "function"
                ) {
                    window.HarmoniaEvents
                        .delete(event.id);

                    document.dispatchEvent(
                        new CustomEvent(
                            "harmonia:events-updated"
                        )
                    );
                }
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


function renderWorkspaceNotes() {
    const box=document.getElementById("workspaceNotesList");
    const count=document.getElementById("workspaceNoteCount");
    if(!box||!currentWorkspaceProject)return;
    const items=window.HarmoniaNotes?.getByProjectId?.(currentWorkspaceProject.id)||[];
    if(count)count.textContent=String(items.length);
    box.innerHTML=items.length?items.map(n=>`<article class="workspace-task-card"><h4>${escapeWorkspaceHtml(n.title||"Untitled Note")}</h4><p>${escapeWorkspaceHtml((n.content||"").slice(0,240)||"No content")}</p></article>`).join(""):"<p>No notes have been added to this project yet.</p>";
}
function renderWorkspaceFiles() {
    const box=document.getElementById("workspaceFilesList");
    const count=document.getElementById("workspaceFileCount");
    if(!box||!currentWorkspaceProject)return;
    const items=window.HarmoniaFiles?.getByProjectId?.(currentWorkspaceProject.id)||[];
    if(count)count.textContent=String(items.length);
    box.innerHTML="";
    if(!items.length){box.innerHTML="<p>No files have been added to this project yet.</p>";return;}
    for(const file of items){const a=document.createElement("article");a.className="workspace-task-card";a.innerHTML=`<h4>${escapeWorkspaceHtml(file.title||file.originalName||"Untitled File")}</h4><p>${escapeWorkspaceHtml(file.description||file.mimeType||"")}</p>`;a.addEventListener("click",()=>window.open(window.HarmoniaFiles.resolveUrl(file),"_blank","noopener"));box.appendChild(a);}
}
function escapeWorkspaceHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);}

function showProjectWorkspacePage() {
    console.log(
        "Showing workspace page"
    );

    const workspacePage =
        document.getElementById(
            "project-workspace"
        );

    if (!workspacePage) {
        console.error(
            "The #project-workspace section was not found."
        );
        return;
    }

    document
        .querySelectorAll(".admin-page")
        .forEach(page => {
            page.classList.remove(
                "active"
            );
            page.hidden = true;
            page.setAttribute(
                "aria-hidden",
                "true"
            );
        });

    workspacePage.hidden = false;
    workspacePage.removeAttribute(
        "hidden"
    );
    workspacePage.removeAttribute(
        "aria-hidden"
    );
    workspacePage.classList.add(
        "active"
    );
    workspacePage.style.display =
        "block";
    workspacePage.style.visibility =
        "visible";
    workspacePage.style.opacity = "1";

    const workspaceContent =
        workspacePage.querySelector(
            ".project-workspace-page"
        );

    if (workspaceContent) {
        workspaceContent.hidden = false;
        workspaceContent.removeAttribute(
            "hidden"
        );
        workspaceContent.removeAttribute(
            "aria-hidden"
        );
        workspaceContent.style.display =
            "";
        workspaceContent.style.visibility =
            "visible";
        workspaceContent.style.opacity =
            "1";
    }

    const panels =
        workspacePage.querySelectorAll(
            "[data-project-panel], " +
            "[data-workspace-panel]"
        );

    let activePanel =
        workspacePage.querySelector(
            "[data-project-panel].active, " +
            "[data-workspace-panel].active"
        );

    if (
        !activePanel &&
        panels.length > 0
    ) {
        activePanel =
            workspacePage.querySelector(
                '[data-project-panel="overview"], ' +
                '[data-workspace-panel="overview"]'
            ) ||
            panels[0];

        activePanel.classList.add(
            "active"
        );
    }

    panels.forEach(panel => {
        const shouldShow =
            panel === activePanel;

        panel.classList.toggle(
            "active",
            shouldShow
        );

        panel.hidden =
            !shouldShow;

        panel.style.display =
            shouldShow
                ? ""
                : "none";
    });

    const tabs =
        workspacePage.querySelectorAll(
            "[data-project-tab], " +
            "[data-workspace-tab]"
        );

    let activeTab =
        workspacePage.querySelector(
            "[data-project-tab].active, " +
            "[data-workspace-tab].active"
        );

    if (
        !activeTab &&
        tabs.length > 0
    ) {
        activeTab =
            workspacePage.querySelector(
                '[data-project-tab="overview"], ' +
                '[data-workspace-tab="overview"]'
            ) ||
            tabs[0];

        activeTab.classList.add(
            "active"
        );
    }

    tabs.forEach(tab => {
        tab.classList.toggle(
            "active",
            tab === activeTab
        );
    });

    const pageTitle =
        document.getElementById(
            "pageTitle"
        );

    if (pageTitle) {
        pageTitle.textContent =
            currentWorkspaceProject
                ?.title ||
            currentWorkspaceProject
                ?.name ||
            "Project Workspace";
    }

    if (
        window.location.hash !==
        "#project-workspace"
    ) {
        window.history.replaceState(
            null,
            "",
            "#project-workspace"
        );
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
        workspacePage.setAttribute(
            "aria-hidden",
            "true"
        );
        workspacePage.style.display =
            "none";
    }

    if (projectsPage) {
        projectsPage.hidden = false;
        projectsPage.removeAttribute(
            "hidden"
        );
        projectsPage.removeAttribute(
            "aria-hidden"
        );
        projectsPage.classList.add(
            "active"
        );
        projectsPage.style.display =
            "";
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

    if (
        window.location.hash !==
        "#projects"
    ) {
        window.history.replaceState(
            null,
            "",
            "#projects"
        );
    }

    if (
        typeof window
            .renderProjects ===
        "function"
    ) {
        window.renderProjects();
    }
}

function initializeWorkspaceTabs() {
    const workspacePage =
        document.getElementById(
            "project-workspace"
        );

    if (!workspacePage) {
        return;
    }

    const tabs =
        workspacePage.querySelectorAll(
            "[data-project-tab], " +
            "[data-workspace-tab]"
        );

    const panels =
        workspacePage.querySelectorAll(
            "[data-project-panel], " +
            "[data-workspace-panel]"
        );

    tabs.forEach(tab => {
        if (
            tab.dataset
                .workspaceInitialized ===
            "true"
        ) {
            return;
        }

        tab.dataset
            .workspaceInitialized =
            "true";

        tab.addEventListener(
            "click",
            function () {
                const selectedTab =
                    tab.dataset
                        .projectTab ||
                    tab.dataset
                        .workspaceTab;

                tabs.forEach(item => {
                    item.classList.toggle(
                        "active",
                        item === tab
                    );
                });

                panels.forEach(panel => {
                    const panelName =
                        panel.dataset
                            .projectPanel ||
                        panel.dataset
                            .workspacePanel;

                    const shouldShow =
                        panelName ===
                        selectedTab;

                    panel.hidden =
                        !shouldShow;

                    panel.style.display =
                        shouldShow
                            ? ""
                            : "none";

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

                if (selectedTab === "events") renderWorkspaceEvents();
                if (selectedTab === "notes") renderWorkspaceNotes();
                if (selectedTab === "files") renderWorkspaceFiles();
            }
        );
    });
}

function openWorkspaceAdminPage(
    pageId
) {
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
            page.classList.remove(
                "active"
            );
            page.hidden = true;
        });

    targetPage.hidden = false;
    targetPage.removeAttribute(
        "hidden"
    );
    targetPage.classList.add(
        "active"
    );

    return true;
}

function setWorkspaceEditorProject(
    fieldId,
    projectId
) {
    const field =
        document.getElementById(
            fieldId
        );

    if (!field) {
        return false;
    }

    field.value =
        String(projectId);

    field.dispatchEvent(
        new Event(
            "change",
            {
                bubbles: true
            }
        )
    );

    field.dispatchEvent(
        new Event(
            "input",
            {
                bubbles: true
            }
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

    window.requestAnimationFrame(
        () => {
            setWorkspaceEditorProject(
                "workEditorProject",
                projectId
            );
        }
    );
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

        window.requestAnimationFrame(
            () => {
                setWorkspaceEditorProject(
                    "noteEditorProject",
                    projectId
                );
            }
        );

        return;
    }

    if (
        window.NoteModal &&
        typeof window.NoteModal
            .openCreate ===
            "function"
    ) {
        window.NoteModal.openCreate({
            projectId
        });
        return;
    }

    if (
        window.NotesModal &&
        typeof window.NotesModal
            .openCreate ===
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

        window.requestAnimationFrame(
            () => {
                setWorkspaceEditorProject(
                    "fileEditorProject",
                    projectId
                );
            }
        );

        return;
    }

    if (
        window.FileModal &&
        typeof window.FileModal
            .openCreate ===
            "function"
    ) {
        window.FileModal.openCreate({
            projectId
        });
        return;
    }

    if (
        window.FilesModal &&
        typeof window.FilesModal
            .openCreate ===
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

    if (
        addTaskButton &&
        addTaskButton.dataset
            .workspaceInitialized !==
            "true"
    ) {
        addTaskButton.dataset
            .workspaceInitialized =
            "true";

        addTaskButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                openWorkspaceTaskEditor();
            }
        );
    }

    const addNoteButton =
        document.getElementById(
            "addWorkspaceNoteButton"
        );

    if (
        addNoteButton &&
        addNoteButton.dataset
            .workspaceInitialized !==
            "true"
    ) {
        addNoteButton.dataset
            .workspaceInitialized =
            "true";

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

    if (
        addFileButton &&
        addFileButton.dataset
            .workspaceInitialized !==
            "true"
    ) {
        addFileButton.dataset
            .workspaceInitialized =
            "true";

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

    if (
        addEventButton &&
        addEventButton.dataset
            .workspaceInitialized !==
            "true"
    ) {
        addEventButton.dataset
            .workspaceInitialized =
            "true";

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

                window.openEventModal(
                    null,
                    {
                        projectId:
                            currentWorkspaceProject.id
                    }
                );
            }
        );
    }

    const backButton =
        document.getElementById(
            "backToProjectsButton"
        );

    if (
        backButton &&
        backButton.dataset
            .workspaceInitialized !==
            "true"
    ) {
        backButton.dataset
            .workspaceInitialized =
            "true";

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

    if (
        editButton &&
        editButton.dataset
            .workspaceInitialized !==
            "true"
    ) {
        editButton.dataset
            .workspaceInitialized =
            "true";

        editButton.addEventListener(
            "click",
            function () {
                if (
                    !currentWorkspaceProject
                ) {
                    return;
                }

                if (
                    typeof window
                        .openProjectModal ===
                    "function"
                ) {
                    window.openProjectModal(
                        currentWorkspaceProject
                    );
                    return;
                }

                if (
                    window.ProjectModal &&
                    typeof window
                        .ProjectModal
                        .openEdit ===
                        "function"
                ) {
                    window.ProjectModal
                        .openEdit(
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

document.addEventListener(
    "harmonia:projects-updated",
    function () {
        if (!currentWorkspaceProject) {
            return;
        }

        const updatedProject =
            window.ProjectManager
                ?.getProjectById?.(
                    currentWorkspaceProject.id
                );

        if (updatedProject) {
            openProjectWorkspace(
                updatedProject.id
            );
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

console.log(
    "✅ Project Workspace Ready"
);

document.addEventListener("harmonia:notes-updated",()=>{if(currentWorkspaceProject)renderWorkspaceNotes();});
document.addEventListener("harmonia:files-updated",()=>{if(currentWorkspaceProject)renderWorkspaceFiles();});
window.renderWorkspaceNotes=renderWorkspaceNotes;window.renderWorkspaceFiles=renderWorkspaceFiles;
