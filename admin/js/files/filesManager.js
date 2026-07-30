console.log("✅ Files Manager Loaded");

const HARMONIA_FILES_STORAGE_KEY = "harmonia.files";

function createFileId() {
    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {
        return window.crypto.randomUUID();
    }

    return `file-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;
}

function normalizeFileRecord(fileRecord = {}) {
    return {
        id: fileRecord.id || createFileId(),
        projectId: fileRecord.projectId ?? null,
        title: String(fileRecord.title || "Untitled File").trim(),
        description: String(fileRecord.description || "").trim(),
        category: fileRecord.category || "document",
        sourceType: fileRecord.sourceType || "link",
        url: String(fileRecord.url || "").trim(),
        fileName: String(fileRecord.fileName || "").trim(),
        mimeType: String(fileRecord.mimeType || "").trim(),
        sizeBytes: Number(fileRecord.sizeBytes) || 0,
        dataUrl: String(fileRecord.dataUrl || ""),
        pinned: Boolean(fileRecord.pinned),
        createdAt: fileRecord.createdAt || new Date().toISOString(),
        updatedAt: fileRecord.updatedAt || new Date().toISOString()
    };
}

function loadFiles() {
    try {
        const storedFiles = localStorage.getItem(
            HARMONIA_FILES_STORAGE_KEY
        );

        if (!storedFiles) {
            return [];
        }

        const parsedFiles = JSON.parse(storedFiles);

        if (!Array.isArray(parsedFiles)) {
            return [];
        }

        return parsedFiles.map(normalizeFileRecord);
    } catch (error) {
        console.error("Could not load files:", error);
        return [];
    }
}

function dispatchFilesUpdated() {
    document.dispatchEvent(
        new CustomEvent("harmonia:files-updated")
    );
}

function saveFiles(files) {
    try {
        localStorage.setItem(
            HARMONIA_FILES_STORAGE_KEY,
            JSON.stringify(files)
        );

        dispatchFilesUpdated();
        return true;
    } catch (error) {
        console.error("Could not save files:", error);
        return false;
    }
}

function getAllFiles() {
    return loadFiles();
}

function getFileById(fileId) {
    return (
        loadFiles().find(file => file.id === fileId) ||
        null
    );
}

function getFilesByProjectId(projectId) {
    return loadFiles().filter(file => {
        return file.projectId === projectId;
    });
}

function isImageFile(fileRecord) {
    if (!fileRecord) {
        return false;
    }

    return (
        fileRecord.category === "image" ||
        String(fileRecord.mimeType || "")
            .toLowerCase()
            .startsWith("image/")
    );
}

function getImageFiles() {
    return loadFiles().filter(isImageFile);
}

function resolveFileUrl(fileRecordOrId) {
    const fileRecord =
        typeof fileRecordOrId === "string"
            ? getFileById(fileRecordOrId)
            : fileRecordOrId;

    if (!fileRecord) {
        return "";
    }

    if (
        fileRecord.sourceType === "upload" &&
        fileRecord.dataUrl
    ) {
        return fileRecord.dataUrl;
    }

    return fileRecord.url || "";
}

function addFile(fileData) {
    const files = loadFiles();
    const timestamp = new Date().toISOString();

    const newFile = normalizeFileRecord({
        ...fileData,
        id: createFileId(),
        createdAt: timestamp,
        updatedAt: timestamp
    });

    files.push(newFile);

    if (!saveFiles(files)) {
        throw new Error("File storage failed.");
    }

    return newFile;
}

function updateFile(fileId, updates) {
    const files = loadFiles();
    const fileIndex = files.findIndex(
        file => file.id === fileId
    );

    if (fileIndex === -1) {
        return null;
    }

    files[fileIndex] = normalizeFileRecord({
        ...files[fileIndex],
        ...updates,
        id: files[fileIndex].id,
        createdAt: files[fileIndex].createdAt,
        updatedAt: new Date().toISOString()
    });

    if (!saveFiles(files)) {
        throw new Error("File storage failed.");
    }

    return files[fileIndex];
}

function deleteFile(fileId) {
    const files = loadFiles();
    const remainingFiles = files.filter(
        file => file.id !== fileId
    );

    if (remainingFiles.length === files.length) {
        return false;
    }

    if (!saveFiles(remainingFiles)) {
        throw new Error("File storage failed.");
    }

    return true;
}

window.HarmoniaFiles = {
    load: loadFiles,
    save: saveFiles,
    getAll: getAllFiles,
    getById: getFileById,
    getByProjectId: getFilesByProjectId,
    getImages: getImageFiles,
    isImage: isImageFile,
    resolveUrl: resolveFileUrl,
    add: addFile,
    update: updateFile,
    delete: deleteFile
};