console.log("Loading Railway Work Editor");

let activeWorkEditorId = null;
let workEditorDirty = false;
let workEditorSaving = false;

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
        window.ProjectManager &&
        typeof window.ProjectManager
            .getAllProjects ===
            "function"
    ) {
        return (
            window.ProjectManager
                .getAllProjects() || []
        );
    }

    if (
        window.HarmoniaProjects &&
        typeof window.HarmoniaProjects
            .getAll === "function"
    ) {
        return (
            window.HarmoniaProjects
                .getAll() || []
        );
    }

    return [];
}

function buildWorkProjectOptions(
    selectedProjectId
) {
    const projects =
        getWorkProjects();

    return [
        `<option value="">Select a project</option>`,
        ...projects.map(project => {
            const projectId =
                project.id || "";

            const projectTitle =
                project.title ||
                project.name ||
                "Untitled Project";

            const selected =
                String(projectId) ===
                String(
                    selectedProjectId ||
                    ""
                )
                    ? "selected"
                    : "";

            return `
                <option
                    value="${escapeWorkEditorHtml(
                        projectId
                    )}"
                    ${selected}
                >
                    ${escapeWorkEditorHtml(
                        projectTitle
                    )}
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

function setWorkEditorStatus(
    message,
    state = ""
) {
    const element =
        document.getElementById(
            "workEditorSaveStatus"
        );

    if (!element) {
        return;
    }

    element.textContent = message;
    element.dataset.state = state;
}

function setWorkEditorSaving(
    saving
) {
    workEditorSaving = saving;

    const saveButton =
        document.getElementById(
            "saveWorkEditorButton"
        );

    if (saveButton) {
        saveButton.disabled =
            saving;

        saveButton.textContent =
            saving
                ? "Saving…"
                : activeWorkEditorId
                    ? "Save Changes"
                    : "Create Work";
    }
}

function renderWorkEditor(
    workItem = null
) {
    const editor =
        document.getElementById(
            "workEditorPane"
        );

    if (!editor) {
        return;
    }

    const item =
        workItem ||
        createBlankWorkItem();

    const isNew =
        !workItem;

    editor.innerHTML = `
        <div class="work-editor-header">
            <div>
                <p class="panel-label">
                    ${isNew
                        ? "New Work"
                        : "Work Details"}
                </p>

                <h3 id="workEditorHeading">
                    ${
                        isNew
                            ? "Create a work item"
                            : escapeWorkEditorHtml(
                                  item.title ||
                                  "Untitled Work"
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

        <form
            class="work-editor-form"
            id="workEditorForm"
        >
            <label class="work-editor-field work-editor-field-wide">
                <span>Title</span>

                <input
                    id="workEditorTitle"
                    type="text"
                    maxlength="180"
                    value="${escapeWorkEditorHtml(
                        item.title
                    )}"
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
                >${escapeWorkEditorHtml(
                    item.description
                )}</textarea>
            </label>

            <label class="work-editor-field">
                <span>Status</span>

                <select id="workEditorStatus">
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
                    <option value="completed">
                        Completed
                    </option>
                </select>
            </label>

            <label class="work-editor-field">
                <span>Priority</span>

                <select id="workEditorPriority">
                    <option value="low">
                        Low
                    </option>
                    <option value="medium">
                        Medium
                    </option>
                    <option value="high">
                        High
                    </option>
                    <option value="urgent">
                        Urgent
                    </option>
                </select>
            </label>

            <label class="work-editor-field">
                <span>Assignee</span>

                <input
                    id="workEditorAssignee"
                    type="text"
                    value="${escapeWorkEditorHtml(
                        item.assignee
                    )}"
                    placeholder="Loaded from Railway"
                    disabled
                />
            </label>

            <label class="work-editor-field">
                <span>Due date</span>

                <input
                    id="workEditorDueDate"
                    type="date"
                    value="${escapeWorkEditorHtml(
                        item.dueDate
                    )}"
                />
            </label>

            <label class="work-editor-field work-editor-field-wide">
                <span>Project</span>

                <select
                    id="workEditorProject"
                    required
                >
                    ${buildWorkProjectOptions(
                        item.projectId
                    )}
                </select>
            </label>

            <label class="work-editor-field work-editor-field-wide">
                <span>Notes</span>

                <textarea
                    id="workEditorNotes"
                    rows="5"
                    placeholder="Notes are not yet stored by the Railway task model"
                    disabled
                >${escapeWorkEditorHtml(
                    item.notes
                )}</textarea>
            </label>
        </form>

        <div class="work-editor-footer">
            <p
                class="work-editor-save-status"
                id="workEditorSaveStatus"
            >
                ${
                    isNew
                        ? "Choose a project and enter a title."
                        : "Changes are not saved yet."
                }
            </p>

            <div class="work-editor-footer-actions">
                <button
                    class="text-button"
                    type="button"
                    id="cancelWorkEditorButton"
                >
                    ${
                        isNew
                            ? "Clear"
                            : "Cancel changes"
                    }
                </button>

                <button
                    class="primary-button"
                    type="submit"
                    form="workEditorForm"
                    id="saveWorkEditorButton"
                >
                    ${
                        isNew
                            ? "Create Work"
                            : "Save Changes"
                    }
                </button>
            </div>
        </div>
    `;

    const statusSelect =
        document.getElementById(
            "workEditorStatus"
        );

    const prioritySelect =
        document.getElementById(
            "workEditorPriority"
        );

    if (statusSelect) {
        statusSelect.value =
            item.status || "todo";
    }

    if (prioritySelect) {
        prioritySelect.value =
            item.priority || "medium";
    }

    attachWorkEditorListeners();
}

function attachWorkEditorListeners() {
    const form =
        document.getElementById(
            "workEditorForm"
        );

    form?.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            await saveActiveWorkEditor();
        }
    );

    form?.addEventListener(
        "input",
        () => {
            if (workEditorSaving) {
                return;
            }

            workEditorDirty = true;

            setWorkEditorStatus(
                "You have unsaved changes.",
                "dirty"
            );
        }
    );

    document
        .getElementById(
            "cancelWorkEditorButton"
        )
        ?.addEventListener(
            "click",
            () => {
                openWorkEditor(
                    activeWorkEditorId
                );
            }
        );

    document
        .getElementById(
            "deleteWorkButton"
        )
        ?.addEventListener(
            "click",
            deleteActiveWorkItem
        );

    document
        .getElementById(
            "duplicateWorkButton"
        )
        ?.addEventListener(
            "click",
            duplicateActiveWorkItem
        );
}

function collectWorkEditorData() {
    return {
        title:
            document
                .getElementById(
                    "workEditorTitle"
                )
                ?.value.trim() || "",

        description:
            document
                .getElementById(
                    "workEditorDescription"
                )
                ?.value.trim() || "",

        status:
            document
                .getElementById(
                    "workEditorStatus"
                )
                ?.value || "todo",

        priority:
            document
                .getElementById(
                    "workEditorPriority"
                )
                ?.value || "medium",

        dueDate:
            document
                .getElementById(
                    "workEditorDueDate"
                )
                ?.value || "",

        projectId:
            document
                .getElementById(
                    "workEditorProject"
                )
                ?.value || null
    };
}

async function saveActiveWorkEditor() {
    if (
        !window.HarmoniaWork ||
        workEditorSaving
    ) {
        return;
    }

    const workData =
        collectWorkEditorData();

    if (!workData.title) {
        window.alert(
            "Please enter a title."
        );

        document
            .getElementById(
                "workEditorTitle"
            )
            ?.focus();

        return;
    }

    if (!workData.projectId) {
        window.alert(
            "Please select a project."
        );

        document
            .getElementById(
                "workEditorProject"
            )
            ?.focus();

        return;
    }

    setWorkEditorSaving(true);

    setWorkEditorStatus(
        "Saving to Railway…",
        "saving"
    );

    try {
        let savedItem;

        if (activeWorkEditorId) {
            savedItem =
                await window
                    .HarmoniaWork
                    .update(
                        activeWorkEditorId,
                        workData
                    );
        } else {
            savedItem =
                await window
                    .HarmoniaWork
                    .create(
                        workData
                    );
        }

        if (!savedItem) {
            throw new Error(
                "Railway did not return the saved task."
            );
        }

        activeWorkEditorId =
            savedItem.id;

        workEditorDirty = false;

        renderWorkEditor(
            savedItem
        );

        setWorkEditorStatus(
            "Saved to Railway.",
            "saved"
        );

        window.setActiveWorkSelection?.(
            savedItem.id
        );
    } catch (error) {
        console.error(
            "Work save failed:",
            error
        );

        setWorkEditorStatus(
            error?.message ||
                "The work item could not be saved.",
            "error"
        );

        window.alert(
            error?.message ||
                "The work item could not be saved."
        );
    } finally {
        setWorkEditorSaving(false);
    }
}

async function deleteActiveWorkItem() {
    if (
        !activeWorkEditorId ||
        !window.HarmoniaWork
    ) {
        return;
    }

    const workItem =
        window.HarmoniaWork
            .getById(
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

    setWorkEditorStatus(
        "Deleting from Railway…",
        "saving"
    );

    try {
        await window
            .HarmoniaWork
            .delete(
                activeWorkEditorId
            );

        activeWorkEditorId = null;
        workEditorDirty = false;

        renderWorkEditor();

        window.setActiveWorkSelection?.(
            null
        );
    } catch (error) {
        console.error(
            "Work deletion failed:",
            error
        );

        window.alert(
            error?.message ||
                "The work item could not be deleted."
        );
    }
}

async function duplicateActiveWorkItem() {
    if (
        !activeWorkEditorId ||
        !window.HarmoniaWork
    ) {
        return;
    }

    setWorkEditorStatus(
        "Duplicating on Railway…",
        "saving"
    );

    try {
        const copy =
            await window
                .HarmoniaWork
                .duplicate(
                    activeWorkEditorId
                );

        if (!copy) {
            return;
        }

        openWorkEditor(copy.id);

        window.setActiveWorkSelection?.(
            copy.id
        );
    } catch (error) {
        console.error(
            "Work duplication failed:",
            error
        );

        window.alert(
            error?.message ||
                "The work item could not be duplicated."
        );
    }
}

function openWorkEditor(
    workId = null
) {
    activeWorkEditorId =
        workId;

    workEditorDirty = false;

    const item =
        workId &&
        window.HarmoniaWork
            ? window.HarmoniaWork
                  .getById(workId)
            : null;

    renderWorkEditor(item);

    document
        .getElementById(
            "workEditorTitle"
        )
        ?.focus();
}

window.openWorkEditor =
    openWorkEditor;

console.log(
    "✅ Railway Work Editor Loaded"
);