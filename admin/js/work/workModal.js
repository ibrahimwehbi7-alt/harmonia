let editingWorkId = null;

function initializeWorkModal() {
    const newWorkButton = document.getElementById("newWorkButton");

    if (!newWorkButton) {
        return;
    }

    newWorkButton.onclick = openNewWorkModal;
}

function openNewWorkModal() {
    editingWorkId = null;

    openWorkModal({
        title: "",
        description: "",
        assignee: "",
        status: "planning",
        priority: "medium",
        dueDate: ""
    });
}

function openEditWorkModal(workId) {
    const workItem = window.WorkManager.getWorkById(workId);

    if (!workItem) {
        alert("This work item could not be found.");
        return;
    }

    editingWorkId = workId;
    openWorkModal(workItem);
}

function openWorkModal(workItem) {
    const existingModal = document.getElementById("workModal");

    if (existingModal) {
        existingModal.remove();
    }

    const isEditing = Boolean(editingWorkId);
    const modal = document.createElement("div");

    modal.className = "work-modal";
    modal.id = "workModal";

    modal.innerHTML = `
        <div
            class="work-modal-backdrop"
            data-close-work-modal
        ></div>

        <section
            class="work-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workModalTitle"
        >
            <div class="work-modal-header">
                <div>
                    <p class="panel-label">
                        ${isEditing ? "Update Assignment" : "Create Assignment"}
                    </p>

                    <h3 id="workModalTitle">
                        ${isEditing ? "Edit Work" : "New Work"}
                    </h3>
                </div>

                <button
                    class="work-modal-close"
                    type="button"
                    data-close-work-modal
                    aria-label="Close"
                >
                    ×
                </button>
            </div>

            <div class="work-form-grid">
                <label class="work-field work-field-wide">
                    <span>Work title</span>

                    <input
                        id="workTitleInput"
                        type="text"
                        maxlength="140"
                        value="${escapeWorkAttribute(workItem.title || "")}"
                        placeholder="What needs to be completed?"
                    />
                </label>

                <label class="work-field work-field-wide">
                    <span>Description</span>

                    <textarea
                        id="workDescriptionInput"
                        rows="4"
                        placeholder="Add context, expectations, or next steps."
                    >${escapeWorkHtml(workItem.description || "")}</textarea>
                </label>

                <label class="work-field">
                    <span>Assignee</span>

                    <input
                        id="workAssigneeInput"
                        type="text"
                        maxlength="100"
                        value="${escapeWorkAttribute(workItem.assignee || "")}"
                        placeholder="Name or team"
                    />
                </label>

                <label class="work-field">
                    <span>Status</span>

                    <select id="workStatusInput">
                        <option
                            value="planning"
                            ${workItem.status === "planning" ? "selected" : ""}
                        >
                            Planning
                        </option>

                        <option
                            value="active"
                            ${workItem.status === "active" ? "selected" : ""}
                        >
                            Active
                        </option>

                        <option
                            value="complete"
                            ${workItem.status === "complete" ? "selected" : ""}
                        >
                            Complete
                        </option>
                    </select>
                </label>

                <label class="work-field">
                    <span>Priority</span>

                    <select id="workPriorityInput">
                        <option
                            value="low"
                            ${workItem.priority === "low" ? "selected" : ""}
                        >
                            Low
                        </option>

                        <option
                            value="medium"
                            ${workItem.priority === "medium" ? "selected" : ""}
                        >
                            Medium
                        </option>

                        <option
                            value="high"
                            ${workItem.priority === "high" ? "selected" : ""}
                        >
                            High
                        </option>
                    </select>
                </label>

                <label class="work-field">
                    <span>Due date</span>

                    <input
                        id="workDueDateInput"
                        type="date"
                        value="${escapeWorkAttribute(workItem.dueDate || "")}"
                    />
                </label>
            </div>

            <div class="work-modal-actions">
                <button
                    class="text-button"
                    type="button"
                    data-close-work-modal
                >
                    Cancel
                </button>

                <button
                    class="primary-button"
                    type="button"
                    id="saveWorkButton"
                >
                    ${isEditing ? "Save Changes" : "Create Work"}
                </button>
            </div>
        </section>
    `;

    document.body.appendChild(modal);

    modal
        .querySelectorAll("[data-close-work-modal]")
        .forEach((button) => {
            button.addEventListener(
                "click",
                closeWorkModal
            );
        });

    document
        .getElementById("saveWorkButton")
        .addEventListener(
            "click",
            saveWorkFromModal
        );

    document.addEventListener(
        "keydown",
        handleWorkModalKeydown
    );

    document
        .getElementById("workTitleInput")
        .focus();
}

function handleWorkModalKeydown(event) {
    if (
        event.key === "Enter" &&
        (event.metaKey || event.ctrlKey)
    ) {
        event.preventDefault();
        saveWorkFromModal();
    }
}

function closeWorkModal() {
    const modal = document.getElementById("workModal");

    if (modal) {
        modal.remove();
    }

    document.removeEventListener(
        "keydown",
        handleWorkModalKeydown
    );

    editingWorkId = null;
}

function saveWorkFromModal() {
    const titleInput =
        document.getElementById("workTitleInput");

    const title = titleInput.value.trim();

    if (!title) {
        titleInput.focus();
        titleInput.classList.add("field-error");

        setTimeout(() => {
            titleInput.classList.remove("field-error");
        }, 1200);

        return;
    }

    const workData = {
        title,
        description: document
            .getElementById("workDescriptionInput")
            .value
            .trim(),

        assignee: document
            .getElementById("workAssigneeInput")
            .value
            .trim(),

        status: document
            .getElementById("workStatusInput")
            .value,

        priority: document
            .getElementById("workPriorityInput")
            .value,

        dueDate: document
            .getElementById("workDueDateInput")
            .value
    };

    if (editingWorkId) {
        window.WorkManager.updateWork(
            editingWorkId,
            workData
        );
    } else {
        window.WorkManager.createWork(workData);
    }

    closeWorkModal();
    renderWorkPage();
    initializeWorkModal();
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

window.initializeWorkModal = initializeWorkModal;
window.openNewWorkModal = openNewWorkModal;
window.openEditWorkModal = openEditWorkModal;

console.log("✅ Work Modal Loaded");