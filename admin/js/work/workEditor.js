let activeWorkEditorId = null;
let workEditorDirty = false;

function escapeWorkEditorHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getWorkProjects() {
    if (
        window.HarmoniaProjects &&
        typeof window.HarmoniaProjects.getAll === "function"
    ) {
        return window.HarmoniaProjects.getAll();
    }

    if (
        window.HarmoniaProjects &&
        typeof window.HarmoniaProjects.load === "function"
    ) {
        return window.HarmoniaProjects.load();
    }

    const possibleKeys = [
        "harmonia_projects",
        "harmonia.projects",
        "harmoniaProjects"
    ];

    for (const key of possibleKeys) {
        try {
            const parsed = JSON.parse(
                localStorage.getItem(key) || "[]"
            );

            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch (error) {
            console.warn(
                `Could not read projects from ${key}:`,
                error
            );
        }
    }

    return [];
}

function buildWorkProjectOptions(selectedProjectId) {
    const projects = getWorkProjects();

    return [
        `<option value="">No project</option>`,
        ...projects.map(project => {
            const projectId =
                project.id || project.projectId || "";

            const projectTitle =
                project.title ||
                project.name ||
                "Untitled Project";

            return `
                <option
                    value="${escapeWorkEditorHtml(projectId)}"
                    ${
                        String(projectId) ===
                        String(selectedProjectId || "")
                            ? "selected"
                            : ""
                    }
                >
                    ${escapeWorkEditorHtml(projectTitle)}
                </option>
            `;
        })
    ].join("");
}

function createBlankWorkItem() {
    return {
        title: "",
        description: "",
        assignee: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
        projectId: "",
        notes: ""
    };
}

function renderWorkEditor(workItem = null) {
    const editor =
        document.getElementById("workEditorPane");

    if (!editor) {
        return;
    }

    const item = workItem || createBlankWorkItem();
    const isNew = !workItem;

    editor.innerHTML = `
        <div class="work-editor-header">
            <div>
                <p class="panel-label">
                    ${isNew ? "New Work" : "Work Details"}
                </p>

                <h3 id="workEditorHeading">
                    ${
                        isNew
                            ? "Create a work item"
                            : escapeWorkEditorHtml(
                                item.title || "Untitled Work"
                            )
                    }
                </h3>
            </div>

            <div class="work-editor-header-actions">
                ${
                    !isNew
                        ? `
                            <button
                                class="text-button"
                                type="button"
                                id="duplicateWorkButton"
                            >
                                Duplicate
                            </button>

                            <button
                                class="text-button danger"
                                type="button"
                                id="deleteWorkButton"
                            >
                                Delete
                            </button>
                        `
                        : ""
                }
            </div>
        </div>

        <form class="work-editor-form" id="workEditorForm">
            <label class="work-editor-field work-editor-field-wide">
                <span>Title</span>

                <input
                    id="workEditorTitle"
                    type="text"
                    maxlength="180"
                    value="${escapeWorkEditorHtml(item.title)}"
                    placeholder="What needs to be done?"
                    required
                />
            </label>

            <label class="work-editor-field work-editor-field-wide">
                <span>Description</span>

                <textarea
                    id="workEditorDescription"
                    rows="4"
                    placeholder="Add context, instructions, or the desired outcome"
                >${escapeWorkEditorHtml(item.description)}</textarea>
            </label>

            <label class="work-editor-field">
                <span>Status</span>

                <select id="workEditorStatus">
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="waiting">Waiting</option>
                    <option value="completed">Completed</option>
                </select>
            </label>

            <label class="work-editor-field">
                <span>Priority</span>

                <select id="workEditorPriority">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </select>
            </label>

            <label class="work-editor-field">
                <span>Assignee</span>

                <input
                    id="workEditorAssignee"
                    type="text"
                    maxlength="120"
                    value="${escapeWorkEditorHtml(item.assignee)}"
                    placeholder="Name or team"
                />
            </label>

            <label class="work-editor-field">
                <span>Due date</span>

                <input
                    id="workEditorDueDate"
                    type="date"
                    value="${escapeWorkEditorHtml(item.dueDate)}"
                />
            </label>

            <label class="work-editor-field work-editor-field-wide">
                <span>Project</span>

                <select id="workEditorProject">
                    ${buildWorkProjectOptions(item.projectId)}
                </select>
            </label>

            <label class="work-editor-field work-editor-field-wide">
                <span>Notes</span>

                <textarea
                    id="workEditorNotes"
                    rows="7"
                    placeholder="Progress notes, follow-ups, links, or decisions"
                >${escapeWorkEditorHtml(item.notes)}</textarea>
            </label>
        </form>

        <div class="work-editor-footer">
            <p class="work-editor-save-status" id="workEditorSaveStatus">
                ${isNew ? "Complete the title to save." : "Changes are not saved yet."}
            </p>

            <div class="work-editor-footer-actions">
                <button
                    class="text-button"
                    type="button"
                    id="cancelWorkEditorButton"
                >
                    ${isNew ? "Clear" : "Cancel changes"}
                </button>

                <button
                    class="primary-button"
                    type="submit"
                    form="workEditorForm"
                    id="saveWorkEditorButton"
                >
                    ${isNew ? "Create Work" : "Save Changes"}
                </button>
            </div>
        </div>
    `;

    document.getElementById("workEditorStatus").value =
        item.status || "todo";

    document.getElementById("workEditorPriority").value =
        item.priority || "medium";

    attachWorkEditorListeners();
}

function attachWorkEditorListeners() {
    const form =
        document.getElementById("workEditorForm");

    form?.addEventListener("submit", event => {
        event.preventDefault();
        saveActiveWorkEditor();
    });

    form?.addEventListener("input", () => {
        workEditorDirty = true;

        const saveStatus =
            document.getElementById(
                "workEditorSaveStatus"
            );

        if (saveStatus) {
            saveStatus.textContent =
                "You have unsaved changes.";
        }
    });

    document
        .getElementById("cancelWorkEditorButton")
        ?.addEventListener("click", () => {
            openWorkEditor(activeWorkEditorId);
        });

    document
        .getElementById("deleteWorkButton")
        ?.addEventListener("click", deleteActiveWorkItem);

    document
        .getElementById("duplicateWorkButton")
        ?.addEventListener("click", duplicateActiveWorkItem);
}

function collectWorkEditorData() {
    return {
        title:
            document
                .getElementById("workEditorTitle")
                ?.value.trim() || "",
        description:
            document
                .getElementById("workEditorDescription")
                ?.value.trim() || "",
        status:
            document
                .getElementById("workEditorStatus")
                ?.value || "todo",
        priority:
            document
                .getElementById("workEditorPriority")
                ?.value || "medium",
        assignee:
            document
                .getElementById("workEditorAssignee")
                ?.value.trim() || "",
        dueDate:
            document
                .getElementById("workEditorDueDate")
                ?.value || "",
        projectId:
            document
                .getElementById("workEditorProject")
                ?.value || null,
        notes:
            document
                .getElementById("workEditorNotes")
                ?.value.trim() || ""
    };
}

function saveActiveWorkEditor() {
    if (!window.HarmoniaWork) {
        return;
    }

    const workData = collectWorkEditorData();

    if (!workData.title) {
        window.alert("Please enter a title.");
        document.getElementById("workEditorTitle")?.focus();
        return;
    }

    let savedItem;

    if (activeWorkEditorId) {
        savedItem = window.HarmoniaWork.update(
            activeWorkEditorId,
            workData
        );
    } else {
        savedItem = window.HarmoniaWork.create(workData);
    }

    if (!savedItem) {
        return;
    }

    activeWorkEditorId = savedItem.id;
    workEditorDirty = false;
    renderWorkEditor(savedItem);
    window.setActiveWorkSelection?.(savedItem.id);
}

function deleteActiveWorkItem() {
    if (
        !activeWorkEditorId ||
        !window.HarmoniaWork
    ) {
        return;
    }

    const workItem =
        window.HarmoniaWork.getById(
            activeWorkEditorId
        );

    if (
        !workItem ||
        !window.confirm(
            `Delete "${workItem.title}"?`
        )
    ) {
        return;
    }

    window.HarmoniaWork.delete(activeWorkEditorId);
    activeWorkEditorId = null;
    workEditorDirty = false;
    renderWorkEditor();
    window.setActiveWorkSelection?.(null);
}

function duplicateActiveWorkItem() {
    if (
        !activeWorkEditorId ||
        !window.HarmoniaWork
    ) {
        return;
    }

    const copy =
        window.HarmoniaWork.duplicate(
            activeWorkEditorId
        );

    if (!copy) {
        return;
    }

    openWorkEditor(copy.id);
    window.setActiveWorkSelection?.(copy.id);
}

function openWorkEditor(workId = null) {
    activeWorkEditorId = workId;
    workEditorDirty = false;

    const item =
        workId && window.HarmoniaWork
            ? window.HarmoniaWork.getById(workId)
            : null;

    renderWorkEditor(item);

    document
        .getElementById("workEditorTitle")
        ?.focus();
}

window.openWorkEditor = openWorkEditor;

console.log("✅ Work Editor Loaded");