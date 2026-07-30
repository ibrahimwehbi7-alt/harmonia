const WORK_STORAGE_KEY = "harmonia_work";
const WORK_UPDATED_EVENT = "harmonia:work-updated";

function createWorkId() {
    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {
        return window.crypto.randomUUID();
    }

    return `work-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;
}

function normalizeWorkItem(workData = {}) {
    const now = new Date().toISOString();

    return {
        id: workData.id || createWorkId(),
        title: String(workData.title || "Untitled Work").trim(),
        description: String(workData.description || "").trim(),
        assignee: String(workData.assignee || "").trim(),
        status: [
            "backlog",
            "todo",
            "in-progress",
            "waiting",
            "completed"
        ].includes(workData.status)
            ? workData.status
            : "todo",
        priority: [
            "low",
            "medium",
            "high",
            "urgent"
        ].includes(workData.priority)
            ? workData.priority
            : "medium",
        dueDate: String(workData.dueDate || "").trim(),
        projectId: workData.projectId || null,
        notes: String(workData.notes || "").trim(),
        completedAt:
            workData.status === "completed"
                ? workData.completedAt || now
                : null,
        createdAt: workData.createdAt || now,
        updatedAt: workData.updatedAt || now
    };
}

function loadWork() {
    try {
        const storedWork =
            localStorage.getItem(WORK_STORAGE_KEY);

        if (!storedWork) {
            return [];
        }

        const parsedWork = JSON.parse(storedWork);

        return Array.isArray(parsedWork)
            ? parsedWork.map(normalizeWorkItem)
            : [];
    } catch (error) {
        console.error("Could not load work:", error);
        return [];
    }
}

function saveWork(workItems) {
    try {
        localStorage.setItem(
            WORK_STORAGE_KEY,
            JSON.stringify(workItems)
        );

        document.dispatchEvent(
            new CustomEvent(WORK_UPDATED_EVENT)
        );

        return true;
    } catch (error) {
        console.error("Could not save work:", error);
        return false;
    }
}

function getAllWork() {
    return loadWork();
}

function getWorkById(workId) {
    return (
        loadWork().find(item => item.id === workId) ||
        null
    );
}

function createWork(workData) {
    const workItems = loadWork();
    const newWorkItem = normalizeWorkItem({
        ...workData,
        id: createWorkId()
    });

    workItems.unshift(newWorkItem);

    if (!saveWork(workItems)) {
        throw new Error("Could not save the work item.");
    }

    return newWorkItem;
}

function updateWork(workId, updates) {
    const workItems = loadWork();
    const workIndex = workItems.findIndex(
        item => item.id === workId
    );

    if (workIndex === -1) {
        return null;
    }

    const currentItem = workItems[workIndex];
    const nextStatus =
        updates.status || currentItem.status;

    workItems[workIndex] = normalizeWorkItem({
        ...currentItem,
        ...updates,
        id: currentItem.id,
        createdAt: currentItem.createdAt,
        completedAt:
            nextStatus === "completed"
                ? currentItem.completedAt ||
                  new Date().toISOString()
                : null,
        updatedAt: new Date().toISOString()
    });

    if (!saveWork(workItems)) {
        throw new Error("Could not update the work item.");
    }

    return workItems[workIndex];
}

function deleteWork(workId) {
    const workItems = loadWork();
    const remainingWork = workItems.filter(
        item => item.id !== workId
    );

    if (remainingWork.length === workItems.length) {
        return false;
    }

    if (!saveWork(remainingWork)) {
        throw new Error("Could not delete the work item.");
    }

    return true;
}

function toggleWorkComplete(workId) {
    const item = getWorkById(workId);

    if (!item) {
        return null;
    }

    return updateWork(workId, {
        status:
            item.status === "completed"
                ? "todo"
                : "completed"
    });
}

function duplicateWork(workId) {
    const item = getWorkById(workId);

    if (!item) {
        return null;
    }

    return createWork({
        ...item,
        id: undefined,
        title: `${item.title} Copy`,
        status: "todo",
        completedAt: null,
        createdAt: undefined,
        updatedAt: undefined
    });
}

window.HarmoniaWork = {
    load: getAllWork,
    getAll: getAllWork,
    getById: getWorkById,
    getByProjectId: getWorkByProjectId,
    create: createWork,
    update: updateWork,
    delete: deleteWork,
    toggleComplete: toggleWorkComplete,
    duplicate: duplicateWork
};

console.log("✅ Work Manager v2 Loaded");

/*
 * Legacy compatibility layer
 * --------------------------
 * Older Harmonia modules, including Project Workspace, use
 * window.WorkManager.getAllWork(). The redesigned Work module
 * uses window.HarmoniaWork. Keep both APIs available so all
 * existing pages can communicate with the same work records.
 */
function getWorkByProjectId(projectId) {
    return loadWork().filter(item => {
        return String(item.projectId || "") ===
            String(projectId || "");
    });
}

function getWorkByStatus(status) {
    return loadWork().filter(item => {
        return item.status === status;
    });
}

function getActiveWork() {
    return loadWork().filter(item => {
        return item.status !== "completed";
    });
}

function getCompletedWork() {
    return getWorkByStatus("completed");
}

window.WorkManager = {
    loadWork,
    saveWork,
    getAllWork,
    getWorkById,
    getWorkByProjectId,
    getWorkByStatus,
    getActiveWork,
    getCompletedWork,
    createWork,
    updateWork,
    deleteWork,
    toggleWorkComplete,
    duplicateWork,

    // Short aliases used by newer modules.
    load: getAllWork,
    getAll: getAllWork,
    getById: getWorkById,
    getByProjectId: getWorkByProjectId,
    create: createWork,
    update: updateWork,
    delete: deleteWork,
    toggleComplete: toggleWorkComplete,
    duplicate: duplicateWork
};

console.log("✅ WorkManager compatibility API loaded");