console.log("✅ Files Modal Loaded");

let editingFileId = null;
let activeFileProjectId = null;
let pendingUploadedFile = null;

const MAX_LOCAL_FILE_SIZE_BYTES = 1_500_000;

function getFileModalElements() {
    return {
        modal: document.getElementById("fileModal"),
        title: document.getElementById("fileModalTitle"),
        titleInput: document.getElementById("fileTitleInput"),
        categoryInput: document.getElementById("fileCategoryInput"),
        sourceInput: document.getElementById("fileSourceInput"),
        urlInput: document.getElementById("fileUrlInput"),
        uploadInput: document.getElementById("fileUploadInput"),
        descriptionInput: document.getElementById("fileDescriptionInput"),
        pinnedInput: document.getElementById("filePinnedInput"),
        linkFields: document.getElementById("fileLinkFields"),
        uploadFields: document.getElementById("fileUploadFields"),
        selectedFileName: document.getElementById("selectedFileName"),
        saveButton: document.getElementById("saveFileButton")
    };
}

function resetFileForm() {
    const elements = getFileModalElements();

    editingFileId = null;
    activeFileProjectId = null;
    pendingUploadedFile = null;

    if (elements.title) elements.title.textContent = "Add File";
    if (elements.titleInput) elements.titleInput.value = "";
    if (elements.categoryInput) elements.categoryInput.value = "document";
    if (elements.sourceInput) elements.sourceInput.value = "link";
    if (elements.urlInput) elements.urlInput.value = "";
    if (elements.uploadInput) elements.uploadInput.value = "";
    if (elements.descriptionInput) elements.descriptionInput.value = "";
    if (elements.pinnedInput) elements.pinnedInput.checked = false;
    if (elements.selectedFileName) elements.selectedFileName.textContent = "No file selected";

    updateFileSourceFields();
}

function updateFileSourceFields() {
    const elements = getFileModalElements();
    const sourceType = elements.sourceInput?.value || "link";

    if (elements.linkFields) {
        elements.linkFields.hidden = sourceType !== "link";
    }

    if (elements.uploadFields) {
        elements.uploadFields.hidden = sourceType !== "upload";
    }
}

function openFileModal(fileData = null, options = {}) {
    const elements = getFileModalElements();

    if (!elements.modal) {
        console.error("File modal element was not found.");
        return;
    }

    resetFileForm();
    activeFileProjectId = options.projectId ?? null;

    if (fileData) {
        editingFileId = fileData.id || null;
        activeFileProjectId = fileData.projectId ?? null;

        if (elements.title) elements.title.textContent = "Edit File";
        if (elements.titleInput) elements.titleInput.value = fileData.title || "";
        if (elements.categoryInput) elements.categoryInput.value = fileData.category || "document";
        if (elements.sourceInput) elements.sourceInput.value = fileData.sourceType || "link";
        if (elements.urlInput) elements.urlInput.value = fileData.url || "";
        if (elements.descriptionInput) elements.descriptionInput.value = fileData.description || "";
        if (elements.pinnedInput) elements.pinnedInput.checked = Boolean(fileData.pinned);
        if (elements.selectedFileName) {
            elements.selectedFileName.textContent = fileData.fileName || "Stored local file";
        }

        pendingUploadedFile = fileData.sourceType === "upload"
            ? {
                fileName: fileData.fileName || "",
                mimeType: fileData.mimeType || "",
                sizeBytes: fileData.sizeBytes || 0,
                dataUrl: fileData.dataUrl || ""
            }
            : null;

        updateFileSourceFields();
    }

    elements.modal.hidden = false;

    requestAnimationFrame(() => {
        elements.titleInput?.focus();
    });
}

function closeFileModal() {
    const elements = getFileModalElements();

    if (!elements.modal) return;

    elements.modal.hidden = true;
    editingFileId = null;
    activeFileProjectId = null;
    pendingUploadedFile = null;
}

function readSelectedFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve({
                fileName: file.name,
                mimeType: file.type,
                sizeBytes: file.size,
                dataUrl: String(reader.result || "")
            });
        };

        reader.onerror = () => {
            reject(reader.error || new Error("Could not read file."));
        };

        reader.readAsDataURL(file);
    });
}

async function handleFileSelection() {
    const elements = getFileModalElements();
    const selectedFile = elements.uploadInput?.files?.[0];

    if (!selectedFile) {
        pendingUploadedFile = null;
        if (elements.selectedFileName) {
            elements.selectedFileName.textContent = "No file selected";
        }
        return;
    }

    if (selectedFile.size > MAX_LOCAL_FILE_SIZE_BYTES) {
        alert("For this local prototype, choose a file smaller than 1.5 MB.");
        elements.uploadInput.value = "";
        pendingUploadedFile = null;
        return;
    }

    try {
        pendingUploadedFile = await readSelectedFile(selectedFile);

        if (elements.selectedFileName) {
            elements.selectedFileName.textContent = selectedFile.name;
        }

        if (
            elements.titleInput &&
            !elements.titleInput.value.trim()
        ) {
            elements.titleInput.value = selectedFile.name;
        }
    } catch (error) {
        console.error("Could not read selected file:", error);
        alert("The selected file could not be read.");
    }
}

function buildFileData() {
    const elements = getFileModalElements();
    const title = elements.titleInput?.value.trim() || "";
    const sourceType = elements.sourceInput?.value || "link";
    const url = elements.urlInput?.value.trim() || "";

    if (!title) {
        alert("Please enter a file title.");
        elements.titleInput?.focus();
        return null;
    }

    if (sourceType === "link" && !url) {
        alert("Please enter a file link.");
        elements.urlInput?.focus();
        return null;
    }

    if (sourceType === "upload" && !pendingUploadedFile) {
        alert("Please select a file to upload.");
        return null;
    }

    return {
        projectId: activeFileProjectId ?? null,
        title,
        category: elements.categoryInput?.value || "document",
        sourceType,
        url: sourceType === "link" ? url : "",
        fileName: sourceType === "upload" ? pendingUploadedFile.fileName : "",
        mimeType: sourceType === "upload" ? pendingUploadedFile.mimeType : "",
        sizeBytes: sourceType === "upload" ? pendingUploadedFile.sizeBytes : 0,
        dataUrl: sourceType === "upload" ? pendingUploadedFile.dataUrl : "",
        description: elements.descriptionInput?.value.trim() || "",
        pinned: Boolean(elements.pinnedInput?.checked)
    };
}

function saveFileFromModal() {
    const fileData = buildFileData();

    if (!fileData) return;

    try {
        if (
            editingFileId &&
            window.HarmoniaFiles &&
            typeof window.HarmoniaFiles.update === "function"
        ) {
            window.HarmoniaFiles.update(editingFileId, fileData);
        } else if (
            window.HarmoniaFiles &&
            typeof window.HarmoniaFiles.add === "function"
        ) {
            window.HarmoniaFiles.add(fileData);
        } else {
            throw new Error("The files manager is unavailable.");
        }

        closeFileModal();

        document.dispatchEvent(
            new CustomEvent("harmonia:files-updated")
        );
    } catch (error) {
        console.error("Could not save file:", error);
        alert("The file could not be saved. Local browser storage may be full.");
    }
}

function initializeFileModal() {
    const elements = getFileModalElements();

    if (!elements.modal) {
        console.warn("File modal was not found.");
        return;
    }

    document
        .querySelectorAll("[data-close-file-modal]")
        .forEach(button => {
            if (button.dataset.fileModalListenerAttached === "true") return;

            button.addEventListener("click", closeFileModal);
            button.dataset.fileModalListenerAttached = "true";
        });

    if (
        elements.sourceInput &&
        elements.sourceInput.dataset.fileListenerAttached !== "true"
    ) {
        elements.sourceInput.addEventListener("change", updateFileSourceFields);
        elements.sourceInput.dataset.fileListenerAttached = "true";
    }

    if (
        elements.uploadInput &&
        elements.uploadInput.dataset.fileListenerAttached !== "true"
    ) {
        elements.uploadInput.addEventListener("change", handleFileSelection);
        elements.uploadInput.dataset.fileListenerAttached = "true";
    }

    if (
        elements.saveButton &&
        elements.saveButton.dataset.fileModalListenerAttached !== "true"
    ) {
        elements.saveButton.addEventListener("click", saveFileFromModal);
        elements.saveButton.dataset.fileModalListenerAttached = "true";
    }

    if (document.body.dataset.fileModalKeyboardListenerAttached !== "true") {
        document.addEventListener("keydown", event => {
            const currentElements = getFileModalElements();

            if (
                event.key === "Escape" &&
                currentElements.modal &&
                currentElements.modal.hidden === false
            ) {
                closeFileModal();
            }
        });

        document.body.dataset.fileModalKeyboardListenerAttached = "true";
    }

    updateFileSourceFields();
}

window.openFileModal = openFileModal;
window.closeFileModal = closeFileModal;
window.initializeFileModal = initializeFileModal;

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeFileModal,
        { once: true }
    );
} else {
    initializeFileModal();
}