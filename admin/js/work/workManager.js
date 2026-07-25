const WORK_STORAGE_KEY = "harmonia_work";

function loadWork() {
    try {
        const savedWork = localStorage.getItem(WORK_STORAGE_KEY);

        if (!savedWork) {
            return [];
        }

        const parsedWork = JSON.parse(savedWork);

        return Array.isArray(parsedWork) ? parsedWork : [];
    } catch (error) {
        console.error("Could not load work:", error);
        return [];
    }
}

function saveWork(workItems) {
    localStorage.setItem(
        WORK_STORAGE_KEY,
        JSON.stringify(workItems)
    );
}

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

function getAllWork() {
    return loadWork();
}

function getWorkById(workId) {
    return loadWork().find((item) => item.id === workId) || null;
}

function createWork(workData) {
    const workItems = loadWork();
    const timestamp = new Date().toISOString();

    const newWork = {
        id: createWorkId(),

        organizationId:
            workData.organizationId || "harmonia",

        projectId:
            workData.projectId || null,

        title:
            workData.title || "Untitled Work",

        description:
            workData.description || "",

        assignee:
            workData.assignee || "",

        assignedToUserId:
            workData.assignedToUserId || null,

        status:
            workData.status || "planning",

        priority:
            workData.priority || "medium",

        dueDate:
            workData.dueDate || "",

        createdByUserId:
            workData.createdByUserId || "owner",

        createdAt: timestamp,
        updatedAt: timestamp
    };

    workItems.unshift(newWork);
    saveWork(workItems);

    return newWork;
}

function updateWork(workId, updates) {
    const workItems = loadWork();
    const workIndex = workItems.findIndex(
        (item) => item.id === workId
    );

    if (workIndex === -1) {
        console.error("Work item not found:", workId);
        return null;
    }

    const updatedWork = {
        ...workItems[workIndex],
        ...updates,
        id: workItems[workIndex].id,
        updatedAt: new Date().toISOString()
    };

    workItems[workIndex] = updatedWork;
    saveWork(workItems);

    return updatedWork;
}

function deleteWork(workId) {
    const workItems = loadWork();
    const filteredWork = workItems.filter(
        (item) => item.id !== workId
    );

    if (filteredWork.length === workItems.length) {
        return false;
    }

    saveWork(filteredWork);
    return true;
}

window.WorkManager = {
    getAllWork,
    getWorkById,
    createWork,
    updateWork,
    deleteWork
};

console.log("✅ Work Manager Loaded");