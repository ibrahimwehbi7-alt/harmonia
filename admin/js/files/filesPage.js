console.log("✅ Files Page Loaded");

let activeFileSearch = "";
let activeFileCategoryFilter = "all";
let activeFileSourceFilter = "all";

function formatFileCategory(category) {
    const labels = {
        document: "Document",
        image: "Image",
        video: "Video",
        audio: "Audio",
        presentation: "Presentation",
        spreadsheet: "Spreadsheet",
        form: "Form",
        contract: "Contract",
        reference: "Reference",
        other: "Other"
    };

    return labels[category] || "Other";
}

function formatFileDate(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function formatFileSize(sizeBytes) {
    const size = Number(sizeBytes) || 0;

    if (size <= 0) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function sortFiles(files) {
    return [...files].sort((firstFile, secondFile) => {
        if (Boolean(firstFile.pinned) !== Boolean(secondFile.pinned)) {
            return firstFile.pinned ? -1 : 1;
        }

        return new Date(secondFile.updatedAt || 0) -
            new Date(firstFile.updatedAt || 0);
    });
}

function filterFiles(files) {
    const searchText = activeFileSearch.toLowerCase();

    return files.filter(file => {
        const matchesSearch =
            !searchText ||
            String(file.title || "").toLowerCase().includes(searchText) ||
            String(file.description || "").toLowerCase().includes(searchText) ||
            String(file.fileName || "").toLowerCase().includes(searchText);

        const matchesCategory =
            activeFileCategoryFilter === "all" ||
            file.category === activeFileCategoryFilter;

        const matchesSource =
            activeFileSourceFilter === "all" ||
            file.sourceType === activeFileSourceFilter;

        return matchesSearch && matchesCategory && matchesSource;
    });
}

function getFileOpenTarget(file) {
    if (file.sourceType === "upload") {
        return file.dataUrl || "";
    }

    return file.url || "";
}

function createFileCard(file) {
    const card = document.createElement("article");
    card.className = "file-card";
    card.dataset.fileId = file.id;

    const heading = document.createElement("div");
    heading.className = "file-card-heading";

    const titleArea = document.createElement("div");
    titleArea.className = "file-card-title-area";

    const title = document.createElement("h3");
    title.textContent = file.title || "Untitled File";

    const metadata = document.createElement("div");
    metadata.className = "file-card-metadata";

    const category = document.createElement("span");
    category.className = "file-category-badge";
    category.textContent = formatFileCategory(file.category);
    metadata.appendChild(category);

    const source = document.createElement("span");
    source.className = "file-source-badge";
    source.textContent = file.sourceType === "upload" ? "Uploaded" : "Linked";
    metadata.appendChild(source);

    if (file.pinned) {
        const pinned = document.createElement("span");
        pinned.className = "file-pinned-badge";
        pinned.textContent = "Pinned";
        metadata.appendChild(pinned);
    }

    titleArea.appendChild(title);
    titleArea.appendChild(metadata);

    const date = document.createElement("span");
    date.className = "file-card-date";
    const formattedDate = formatFileDate(file.updatedAt || file.createdAt);
    date.textContent = formattedDate ? `Updated ${formattedDate}` : "";

    heading.appendChild(titleArea);
    heading.appendChild(date);

    const description = document.createElement("p");
    description.className = "file-card-description";
    description.textContent = file.description || "No description has been added.";

    const details = document.createElement("p");
    details.className = "file-card-details";

    if (file.sourceType === "upload") {
        const sizeText = formatFileSize(file.sizeBytes);
        details.textContent = [file.fileName, sizeText]
            .filter(Boolean)
            .join(" · ");
    } else {
        details.textContent = file.url || "No link available";
    }

    const actions = document.createElement("div");
    actions.className = "file-card-actions";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "task-action-button";
    openButton.textContent = file.sourceType === "upload" ? "Open" : "Visit";
    openButton.addEventListener("click", () => {
        const target = getFileOpenTarget(file);

        if (!target) {
            alert("This file does not have an available source.");
            return;
        }

        window.open(target, "_blank", "noopener,noreferrer");
    });

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "task-action-button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
        if (typeof window.openFileModal === "function") {
            window.openFileModal(file);
        }
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "task-action-button danger";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
        const confirmed = window.confirm(`Delete "${file.title}"?`);

        if (!confirmed) return;

        try {
            window.HarmoniaFiles.delete(file.id);
            document.dispatchEvent(
                new CustomEvent("harmonia:files-updated")
            );
        } catch (error) {
            console.error("Could not delete file:", error);
            alert("The file could not be deleted.");
        }
    });

    actions.appendChild(openButton);
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    card.appendChild(heading);
    card.appendChild(description);
    card.appendChild(details);
    card.appendChild(actions);

    return card;
}

function updateFileSummary(files) {
    const totalCount = document.getElementById("fileTotalCount");
    const uploadedCount = document.getElementById("fileUploadedCount");
    const linkedCount = document.getElementById("fileLinkedCount");

    if (totalCount) totalCount.textContent = String(files.length);
    if (uploadedCount) {
        uploadedCount.textContent = String(
            files.filter(file => file.sourceType === "upload").length
        );
    }
    if (linkedCount) {
        linkedCount.textContent = String(
            files.filter(file => file.sourceType === "link").length
        );
    }
}

function renderFiles() {
    const filesList = document.getElementById("filesList");
    const emptyState = document.getElementById("filesEmptyState");

    if (!filesList) {
        console.error("The #filesList element was not found.");
        return;
    }

    if (
        !window.HarmoniaFiles ||
        typeof window.HarmoniaFiles.getAll !== "function"
    ) {
        console.error("HarmoniaFiles.getAll is unavailable.");
        return;
    }

    const allFiles = window.HarmoniaFiles.getAll();
    const visibleFiles = sortFiles(filterFiles(allFiles));

    filesList.innerHTML = "";

    visibleFiles.forEach(file => {
        filesList.appendChild(createFileCard(file));
    });

    if (emptyState) {
        emptyState.hidden = visibleFiles.length > 0;
    }

    updateFileSummary(allFiles);
}

function initializeFileFilters() {
    const searchInput = document.getElementById("fileSearchInput");
    const categoryFilter = document.getElementById("fileCategoryFilter");
    const sourceFilter = document.getElementById("fileSourceFilter");

    if (
        searchInput &&
        searchInput.dataset.fileListenerAttached !== "true"
    ) {
        searchInput.addEventListener("input", () => {
            activeFileSearch = searchInput.value.trim();
            renderFiles();
        });
        searchInput.dataset.fileListenerAttached = "true";
    }

    if (
        categoryFilter &&
        categoryFilter.dataset.fileListenerAttached !== "true"
    ) {
        categoryFilter.addEventListener("change", () => {
            activeFileCategoryFilter = categoryFilter.value;
            renderFiles();
        });
        categoryFilter.dataset.fileListenerAttached = "true";
    }

    if (
        sourceFilter &&
        sourceFilter.dataset.fileListenerAttached !== "true"
    ) {
        sourceFilter.addEventListener("change", () => {
            activeFileSourceFilter = sourceFilter.value;
            renderFiles();
        });
        sourceFilter.dataset.fileListenerAttached = "true";
    }
}

function initializeNewFileButton() {
    const newFileButton = document.getElementById("newFileButton");

    if (!newFileButton) {
        console.error("The Add File button was not found.");
        return;
    }

    if (newFileButton.dataset.fileListenerAttached === "true") return;

    newFileButton.addEventListener("click", () => {
        if (typeof window.openFileModal === "function") {
            window.openFileModal();
        }
    });

    newFileButton.dataset.fileListenerAttached = "true";
}

function initializeFilesPage() {
    initializeNewFileButton();
    initializeFileFilters();
    renderFiles();
}

document.addEventListener("harmonia:files-updated", renderFiles);

window.renderFiles = renderFiles;
window.renderFilesPage = renderFiles;
window.initializeFilesPage = initializeFilesPage;

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeFilesPage,
        { once: true }
    );
} else {
    initializeFilesPage();
}

document.addEventListener("harmonia:files-updated", () => {
    if (typeof window.renderFiles === "function") window.renderFiles();
});
