console.log("✅ Work Modal Fixed Loaded");

let activeWorkId = null;
let workModalElement = null;

function createWorkModalMarkup() {
    if (document.getElementById("work-modal")) {
        workModalElement = document.getElementById("work-modal");
        return;
    }

    const modal = document.createElement("div");

    modal.id = "work-modal";
    modal.hidden = true;

    modal.innerHTML = `
        <div class="work-modal-backdrop" data-work-modal-close></div>

        <section
            class="work-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="work-modal-title"
        >
            <div class="work-modal-header">
                <div>
                    <p class="work-modal-label">Work Item</p>
                    <h2 id="work-modal-title">Create Work</h2>
                </div>

                <button
                    type="button"
                    class="work-modal-close"
                    aria-label="Close work modal"
                    data-work-modal-close
                >
                    ×
                </button>
            </div>

            <form id="work-modal-form">
                <div class="work-modal-field">
                    <label for="work-title">Title</label>
                    <input
                        id="work-title"
                        name="title"
                        type="text"
                        required
                    >
                </div>

                <div class="work-modal-field">
                    <label for="work-description">Description</label>
                    <textarea
                        id="work-description"
                        name="description"
                        rows="5"
                    ></textarea>
                </div>

                <div class="work-modal-field">
                    <label for="work-assignee">Assignee</label>
                    <input
                        id="work-assignee"
                        name="assignee"
                        type="text"
                    >
                </div>

                <div class="work-modal-row">
                    <div class="work-modal-field">
                        <label for="work-status">Status</label>

                        <select id="work-status" name="status">
                            <option value="planning">Planning</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="paused">Paused</option>
                        </select>
                    </div>

                    <div class="work-modal-field">
                        <label for="work-priority">Priority</label>

                        <select id="work-priority" name="priority">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                <div class="work-modal-field">
                    <label for="work-due-date">Due Date</label>
                    <input
                        id="work-due-date"
                        name="dueDate"
                        type="date"
                    >
                </div>

                <div class="work-modal-field">
    <label for="work-project-id">Project</label>

    <select
        id="work-project-id"
        name="projectId"
    >
        <option value="">No Project</option>
    </select>
</div>

                <div class="work-modal-actions">
                    <button
                        id="work-delete-button"
                        type="button"
                        hidden
                    >
                        Delete
                    </button>

                    <div class="work-modal-action-group">
                        <button
                            type="button"
                            data-work-modal-close
                        >
                            Cancel
                        </button>

                        <button type="submit">
                            Save Work
                        </button>
                    </div>
                </div>
            </form>
        </section>
    `;

    document.body.appendChild(modal);
    workModalElement = modal;

    bindWorkModalEvents();
}

function getWorkModalForm() {
    return document.getElementById("work-modal-form");
}
function populateWorkProjectOptions(selectedProjectId = "") {
    const projectSelect =
        document.getElementById("work-project-id");

    if (!projectSelect) {
        return;
    }

    const projects =
        window.HarmoniaProjects?.getAll?.() || [];

    projectSelect.innerHTML = `
        <option value="">No Project</option>

        ${projects
            .map((project) => {
                const isSelected =
                    project.id === selectedProjectId;

                return `
                    <option
                        value="${escapeWorkModalAttribute(project.id)}"
                        ${isSelected ? "selected" : ""}
                    >
                        ${escapeWorkModalHtml(
                            project.title || "Untitled Project"
                        )}
                    </option>
                `;
            })
            .join("")}
    `;
}

function escapeWorkModalHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function escapeWorkModalAttribute(value) {
    return escapeWorkModalHtml(value)
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function resetWorkModalForm() {
    const form = getWorkModalForm();

    if (!form) {
        return;
    }

    form.reset();

    document.getElementById("work-status").value = "planning";
    document.getElementById("work-priority").value = "medium";
    populateWorkProjectOptions();
    

    activeWorkId = null;
}

function openCreateWorkModal(options = {}) {
    createWorkModalMarkup();
    resetWorkModalForm();
    
    populateWorkProjectOptions(
    options.projectId || ""
);

    document.getElementById("work-modal-title").textContent =
        "Create Work";

    document.getElementById("work-delete-button").hidden = true;

    

    showWorkModal();
}

function openEditWorkModal(workId) {
    createWorkModalMarkup();

    const workItem = window.WorkManager.getWorkById(workId);

    if (!workItem) {
        console.error("Could not open work item:", workId);
        return;
    }

    activeWorkId = workItem.id;

    document.getElementById("work-modal-title").textContent =
        "Edit Work";

    document.getElementById("work-title").value =
        workItem.title || "";

    document.getElementById("work-description").value =
        workItem.description || "";

    document.getElementById("work-assignee").value =
        workItem.assignee || "";

    document.getElementById("work-status").value =
        workItem.status || "planning";

    document.getElementById("work-priority").value =
        workItem.priority || "medium";

    document.getElementById("work-due-date").value =
        workItem.dueDate || "";

    populateWorkProjectOptions(
    workItem.projectId || ""
);

    document.getElementById("work-delete-button").hidden = false;

    showWorkModal();
}

function showWorkModal() {
    if (!workModalElement) {
        return;
    }

    workModalElement.hidden = false;
    document.body.classList.add("work-modal-open");

    requestAnimationFrame(() => {
        document.getElementById("work-title")?.focus();
    });
}

function closeWorkModal() {
    if (!workModalElement) {
        return;
    }

    workModalElement.hidden = true;
    document.body.classList.remove("work-modal-open");

    resetWorkModalForm();
}

function collectWorkFormData() {
    return {
        title: document.getElementById("work-title").value.trim(),

        description:
            document
                .getElementById("work-description")
                .value
                .trim(),

        assignee:
            document
                .getElementById("work-assignee")
                .value
                .trim(),

        status:
            document.getElementById("work-status").value,

        priority:
            document.getElementById("work-priority").value,

        dueDate:
            document.getElementById("work-due-date").value,

        projectId:
            document.getElementById("work-project-id").value || null
    };
}

function handleWorkModalSubmit(event) {
    event.preventDefault();

    const workData = collectWorkFormData();

    if (!workData.title) {
        document.getElementById("work-title").focus();
        return;
    }

    let savedWork;

    if (activeWorkId) {
        savedWork = window.WorkManager.updateWork(
            activeWorkId,
            workData
        );
    } else {
        savedWork = window.WorkManager.createWork(workData);
    }

    if (!savedWork) {
        console.error("The work item could not be saved.");
        return;
    }

    document.dispatchEvent(
        new CustomEvent("harmonia:work-updated", {
            detail: {
                action: activeWorkId ? "updated" : "created",
                workItem: savedWork
            }
        })
    );

    closeWorkModal();
}

function handleDeleteWork() {
    if (!activeWorkId) {
        return;
    }

    const workItem =
        window.WorkManager.getWorkById(activeWorkId);

    const confirmed = window.confirm(
        `Delete "${workItem?.title || "this work item"}"?`
    );

    if (!confirmed) {
        return;
    }

    const deleted = window.WorkManager.deleteWork(activeWorkId);

    if (!deleted) {
        console.error("The work item could not be deleted.");
        return;
    }

    document.dispatchEvent(
        new CustomEvent("harmonia:work-updated", {
            detail: {
                action: "deleted",
                workId: activeWorkId
            }
        })
    );

    closeWorkModal();
}

function handleWorkModalKeydown(event) {
    if (
        event.key === "Escape" &&
        workModalElement &&
        !workModalElement.hidden
    ) {
        closeWorkModal();
    }
}

function bindWorkModalEvents() {
    const form = getWorkModalForm();
    const deleteButton =
        document.getElementById("work-delete-button");

    form?.addEventListener(
        "submit",
        handleWorkModalSubmit
    );

    deleteButton?.addEventListener(
        "click",
        handleDeleteWork
    );

    workModalElement
        ?.querySelectorAll("[data-work-modal-close]")
        .forEach((button) => {
            button.addEventListener(
                "click",
                closeWorkModal
            );
        });

    document.addEventListener(
        "keydown",
        handleWorkModalKeydown
    );
}

window.WorkModal = {
    openCreate: openCreateWorkModal,
    openEdit: openEditWorkModal,
    close: closeWorkModal
};

document.addEventListener("DOMContentLoaded", () => {
    createWorkModalMarkup();
});