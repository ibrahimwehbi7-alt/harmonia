console.log("Loading Railway Work Manager");

const HARMONIA_WORK_API_URL =
    "https://harmonia-production-720f.up.railway.app";

const WORK_UPDATED_EVENT =
    "harmonia:work-updated";

let railwayWorkItems = [];
let workLoadingPromise = null;

function getWorkAuthToken() {
    return (
        localStorage.getItem(
            "harmonia_access_token"
        ) ||
        localStorage.getItem(
            "accessToken"
        ) ||
        localStorage.getItem(
            "token"
        ) ||
        sessionStorage.getItem(
            "harmonia_access_token"
        ) ||
        sessionStorage.getItem(
            "accessToken"
        ) ||
        sessionStorage.getItem(
            "token"
        ) ||
        ""
    );
}

async function workApiRequest(
    path,
    options = {}
) {
    const controller =
        new AbortController();

    const timeoutId =
        window.setTimeout(
            () => controller.abort(),
            20000
        );

    const token =
        getWorkAuthToken();

    const headers = {
        Accept: "application/json",
        ...(options.body
            ? {
                  "Content-Type":
                      "application/json"
              }
            : {}),
        ...(token
            ? {
                  Authorization:
                      `Bearer ${token}`
              }
            : {}),
        ...(options.headers || {})
    };

    try {
        const response =
            await fetch(
                `${HARMONIA_WORK_API_URL}${path}`,
                {
                    ...options,
                    headers,
                    signal:
                        controller.signal
                }
            );

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        let body = null;

        if (
            contentType.includes(
                "application/json"
            )
        ) {
            body =
                await response.json();
        } else {
            const text =
                await response.text();

            body =
                text || null;
        }

        if (!response.ok) {
            const message =
                body?.message?.message ||
                body?.message ||
                body?.error ||
                (
                    typeof body ===
                    "string"
                        ? body
                        : ""
                ) ||
                `Request failed with status ${response.status}.`;

            throw new Error(message);
        }

        return body;
    } catch (error) {
        if (
            error?.name ===
            "AbortError"
        ) {
            throw new Error(
                "The Railway request timed out."
            );
        }

        throw error;
    } finally {
        window.clearTimeout(
            timeoutId
        );
    }
}

function normalizeFrontendStatus(
    value
) {
    const normalized =
        String(value || "")
            .trim()
            .toUpperCase()
            .replaceAll("-", "_")
            .replaceAll(" ", "_");

    const statusMap = {
        BACKLOG: "backlog",
        TODO: "todo",
        TO_DO: "todo",
        IN_PROGRESS: "in-progress",
        WAITING: "waiting",
        BLOCKED: "waiting",
        COMPLETED: "completed",
        COMPLETE: "completed",
        DONE: "completed"
    };

    return (
        statusMap[normalized] ||
        "todo"
    );
}

function normalizeApiStatus(value) {
    const statusMap = {
        backlog: "BACKLOG",
        todo: "TODO",
        "in-progress":
            "IN_PROGRESS",
        waiting: "WAITING",
        completed: "COMPLETED"
    };

    return (
        statusMap[
            String(value || "")
                .toLowerCase()
        ] ||
        "TODO"
    );
}

function normalizeFrontendPriority(
    value
) {
    const normalized =
        String(value || "")
            .trim()
            .toLowerCase();

    return [
        "low",
        "medium",
        "high",
        "urgent"
    ].includes(normalized)
        ? normalized
        : "medium";
}

function normalizeApiPriority(
    value
) {
    return normalizeFrontendPriority(
        value
    ).toUpperCase();
}

function normalizeDueDate(value) {
    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value).slice(
            0,
            10
        );
    }

    return date
        .toISOString()
        .slice(0, 10);
}

function buildAssigneeName(task) {
    const assignedTo =
        task.assignedTo;

    if (!assignedTo) {
        return "";
    }

    const fullName = [
        assignedTo.firstName,
        assignedTo.lastName
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return (
        fullName ||
        assignedTo.email ||
        ""
    );
}

function normalizeWorkItem(
    task = {}
) {
    return {
        id:
            String(
                task.id || ""
            ),

        title:
            task.title ||
            task.name ||
            "Untitled Work",

        description:
            task.description ||
            "",

        assignee:
            task.assignee ||
            buildAssigneeName(
                task
            ),

        assignedToId:
            task.assignedToId ||
            null,

        status:
            normalizeFrontendStatus(
                task.status
            ),

        priority:
            normalizeFrontendPriority(
                task.priority
            ),

        dueDate:
            normalizeDueDate(
                task.dueDate
            ),

        projectId:
            task.projectId ||
            null,

        notes:
            task.notes ||
            "",

        completedAt:
            task.completedAt ||
            null,

        createdAt:
            task.createdAt ||
            new Date()
                .toISOString(),

        updatedAt:
            task.updatedAt ||
            task.createdAt ||
            new Date()
                .toISOString(),

        project:
            task.project ||
            null,

        assignedTo:
            task.assignedTo ||
            null,

        createdBy:
            task.createdBy ||
            null
    };
}

function dispatchWorkUpdated() {
    document.dispatchEvent(
        new CustomEvent(
            WORK_UPDATED_EVENT,
            {
                detail: {
                    items:
                        getAllWork()
                }
            }
        )
    );
}

function getAllWork() {
    return [
        ...railwayWorkItems
    ];
}

function getWorkById(workId) {
    return (
        railwayWorkItems.find(
            item =>
                String(item.id) ===
                String(workId)
        ) ||
        null
    );
}

function getWorkByProjectId(
    projectId
) {
    return railwayWorkItems.filter(
        item =>
            String(
                item.projectId ||
                ""
            ) ===
            String(
                projectId ||
                ""
            )
    );
}

function getWorkByStatus(
    status
) {
    return railwayWorkItems.filter(
        item =>
            item.status ===
            status
    );
}

function getActiveWork() {
    return railwayWorkItems.filter(
        item =>
            item.status !==
            "completed"
    );
}

function getCompletedWork() {
    return getWorkByStatus(
        "completed"
    );
}

async function loadWork(
    options = {}
) {
    if (
        workLoadingPromise &&
        !options.force
    ) {
        return workLoadingPromise;
    }

    workLoadingPromise =
        (async () => {
            const response =
                await workApiRequest(
                    "/tasks",
                    {
                        method:
                            "GET"
                    }
                );

            const rawItems =
                Array.isArray(
                    response
                )
                    ? response
                    : Array.isArray(
                          response?.tasks
                      )
                        ? response.tasks
                        : Array.isArray(
                              response?.data
                          )
                            ? response.data
                            : [];

            railwayWorkItems =
                rawItems.map(
                    normalizeWorkItem
                );

            dispatchWorkUpdated();

            console.log(
                `✅ Loaded ${railwayWorkItems.length} work items from Railway`
            );

            return getAllWork();
        })();

    try {
        return await workLoadingPromise;
    } finally {
        workLoadingPromise =
            null;
    }
}

function buildTaskPayload(
    workData = {},
    options = {}
) {
    const payload = {};

    if (
        options.isCreate ||
        Object.prototype
            .hasOwnProperty.call(
                workData,
                "title"
            )
    ) {
        payload.title =
            String(
                workData.title ||
                ""
            ).trim();
    }

    if (
        options.isCreate ||
        Object.prototype
            .hasOwnProperty.call(
                workData,
                "description"
            )
    ) {
        payload.description =
            String(
                workData.description ||
                ""
            ).trim();
    }

    if (
        options.isCreate ||
        Object.prototype
            .hasOwnProperty.call(
                workData,
                "status"
            )
    ) {
        payload.status =
            normalizeApiStatus(
                workData.status
            );
    }

    if (
        options.isCreate ||
        Object.prototype
            .hasOwnProperty.call(
                workData,
                "priority"
            )
    ) {
        payload.priority =
            normalizeApiPriority(
                workData.priority
            );
    }

    if (
        options.isCreate ||
        Object.prototype
            .hasOwnProperty.call(
                workData,
                "projectId"
            )
    ) {
        payload.projectId =
            workData.projectId ||
            null;
    }

    if (
        options.isCreate ||
        Object.prototype
            .hasOwnProperty.call(
                workData,
                "dueDate"
            )
    ) {
        payload.dueDate =
            workData.dueDate
                ? new Date(
                      `${workData.dueDate}T12:00:00`
                  ).toISOString()
                : null;
    }

    if (
        Object.prototype
            .hasOwnProperty.call(
                workData,
                "assignedToId"
            )
    ) {
        payload.assignedToId =
            workData.assignedToId ||
            null;
    }

    return payload;
}

async function createWork(
    workData
) {
    const payload =
        buildTaskPayload(
            workData,
            {
                isCreate: true
            }
        );

    if (!payload.title) {
        throw new Error(
            "A task title is required."
        );
    }

    if (!payload.projectId) {
        throw new Error(
            "Railway tasks must be connected to a project."
        );
    }

    const created =
        await workApiRequest(
            "/tasks",
            {
                method: "POST",
                body:
                    JSON.stringify(
                        payload
                    )
            }
        );

    const normalized =
        normalizeWorkItem(
            created
        );

    railwayWorkItems = [
        normalized,
        ...railwayWorkItems.filter(
            item =>
                item.id !==
                normalized.id
        )
    ];

    dispatchWorkUpdated();

    return normalized;
}

async function updateWork(
    workId,
    updates
) {
    const existing =
        getWorkById(workId);

    if (!existing) {
        throw new Error(
            "The work item could not be found."
        );
    }

    const payload =
        buildTaskPayload(
            updates
        );

    const updated =
        await workApiRequest(
            `/tasks/${encodeURIComponent(
                workId
            )}`,
            {
                method: "PATCH",
                body:
                    JSON.stringify(
                        payload
                    )
            }
        );

    const normalized =
        normalizeWorkItem(
            updated
        );

    railwayWorkItems =
        railwayWorkItems.map(
            item =>
                item.id ===
                normalized.id
                    ? normalized
                    : item
        );

    dispatchWorkUpdated();

    return normalized;
}

async function deleteWork(
    workId
) {
    await workApiRequest(
        `/tasks/${encodeURIComponent(
            workId
        )}`,
        {
            method: "DELETE"
        }
    );

    railwayWorkItems =
        railwayWorkItems.filter(
            item =>
                String(item.id) !==
                String(workId)
        );

    dispatchWorkUpdated();

    return true;
}

async function toggleWorkComplete(
    workId
) {
    const item =
        getWorkById(workId);

    if (!item) {
        return null;
    }

    return updateWork(
        workId,
        {
            status:
                item.status ===
                "completed"
                    ? "todo"
                    : "completed"
        }
    );
}

async function duplicateWork(
    workId
) {
    const item =
        getWorkById(workId);

    if (!item) {
        return null;
    }

    return createWork({
        title:
            `${item.title} Copy`,

        description:
            item.description,

        status:
            "todo",

        priority:
            item.priority,

        dueDate:
            item.dueDate,

        projectId:
            item.projectId,

        assignedToId:
            item.assignedToId
    });
}

async function testWorkConnection() {
    try {
        const items =
            await loadWork({
                force: true
            });

        return {
            connected: true,
            items
        };
    } catch (error) {
        console.error(
            "Railway Work connection failed:",
            error
        );

        return {
            connected: false,
            error
        };
    }
}

const HarmoniaWorkApi = {
    load:
        loadWork,

    loadWork,

    getAll:
        getAllWork,

    getAllWork,

    getById:
        getWorkById,

    getWorkById,

    getByProjectId:
        getWorkByProjectId,

    getWorkByProjectId,

    getByStatus:
        getWorkByStatus,

    getWorkByStatus,

    getActiveWork,

    getCompletedWork,

    create:
        createWork,

    createWork,

    update:
        updateWork,

    updateWork,

    delete:
        deleteWork,

    deleteWork,

    toggleComplete:
        toggleWorkComplete,

    toggleWorkComplete,

    duplicate:
        duplicateWork,

    duplicateWork,

    testConnection:
        testWorkConnection
};

window.HarmoniaWork =
    HarmoniaWorkApi;

window.WorkManager =
    HarmoniaWorkApi;

console.log(
    "✅ Railway Work Manager Loaded"
);