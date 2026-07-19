let editingProjectId = null;

function getProjectModalElements() {
    return {
        modal: document.getElementById("projectModal"),
        modalTitle: document.getElementById("projectModalTitle"),
        titleInput: document.getElementById("projectTitleInput"),
        statusInput: document.getElementById("projectStatusInput"),
        progressInput: document.getElementById("projectProgressInput"),
        colorInput: document.getElementById("projectColorInput"),
        descriptionInput: document.getElementById("projectDescriptionInput"),
        saveButton: document.getElementById("saveProjectButton"),
        newProjectButton: document.getElementById("newProjectButton")
    };
}

function resetProjectForm() {
    const elements = getProjectModalElements();

    editingProjectId = null;

    elements.modalTitle.textContent = "New Project";
    elements.titleInput.value = "";
    elements.statusInput.value = "planning";
    elements.progressInput.value = "0";
    elements.colorInput.value = "#1e4d8c";
    elements.descriptionInput.value = "";
}

function openProjectModal(project = null) {
    const elements = getProjectModalElements();

    if (!elements.modal) {
        console.error("Project modal was not found.");
        return;
    }

    resetProjectForm();

    if (project) {
        editingProjectId = project.id;

        elements.modalTitle.textContent = "Edit Project";
        elements.titleInput.value = project.title || "";
        elements.statusInput.value = project.status || "planning";
        elements.progressInput.value = project.progress ?? 0;
        elements.colorInput.value = project.color || "#1e4d8c";
        elements.descriptionInput.value = project.description || "";
    }

    elements.modal.hidden = false;
    document.body.classList.add("modal-open");

    setTimeout(() => {
        elements.titleInput.focus();
    }, 0);
}

function closeProjectModal() {
    const elements = getProjectModalElements();

    if (!elements.modal) return;

    elements.modal.hidden = true;
    document.body.classList.remove("modal-open");

    resetProjectForm();
}

function saveProjectFromModal() {
    const elements = getProjectModalElements();

    const title = elements.titleInput.value.trim();
    const description = elements.descriptionInput.value.trim();

    const progress = Math.min(
        100,
        Math.max(
            0,
            Number(elements.progressInput.value) || 0
        )
    );

    if (!title) {
        elements.titleInput.focus();
        return;
    }

    const projectData = {
        title,
        description,
        status: elements.statusInput.value,
        progress,
        color: elements.colorInput.value
    };

    if (editingProjectId) {
        window.HarmoniaProjects.update(editingProjectId, projectData);
    } else {
        window.HarmoniaProjects.add(projectData);
    }

    closeProjectModal();

    if (typeof window.renderProjects === "function") {
        window.renderProjects();
    }
}

function initializeProjectModal() {
    const elements = getProjectModalElements();

    if (!elements.modal) {
        console.error("Project modal could not initialize.");
        return;
    }

    if (elements.newProjectButton) {
        elements.newProjectButton.addEventListener("click", () => {
            openProjectModal();
        });
    }

    if (elements.saveButton) {
        elements.saveButton.addEventListener("click", saveProjectFromModal);
    }

    document
        .querySelectorAll("[data-close-project-modal]")
        .forEach((button) => {
            button.addEventListener("click", closeProjectModal);
        });

    document.addEventListener("keydown", (event) => {
        if (elements.modal.hidden) return;

        if (event.key === "Escape") {
            closeProjectModal();
        }

        if (
            event.key === "Enter" &&
            event.target.tagName !== "TEXTAREA"
        ) {
            event.preventDefault();
            saveProjectFromModal();
        }
    });
}

window.openProjectModal = openProjectModal;
window.closeProjectModal = closeProjectModal;
window.initializeProjectModal = initializeProjectModal;