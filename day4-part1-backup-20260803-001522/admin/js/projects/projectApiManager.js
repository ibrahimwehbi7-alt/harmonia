const HARMONIA_API_URL =
    "https://harmonia-production-720f.up.railway.app";

const PROJECT_CACHE_KEY = "harmonia_project_cache";
const AUTH_TOKEN_KEY = "harmonia_access_token";
const ORGANIZATION_ID_KEY =
    "harmonia_organization_id";

let projectCache = loadCachedProjects();

function loadCachedProjects() {
    try {
        const stored =
            localStorage.getItem(
                PROJECT_CACHE_KEY
            );

        if (!stored) {
            return [];
        }

        const parsed = JSON.parse(stored);

        return Array.isArray(parsed)
            ? parsed
            : [];
    } catch (error) {
        console.error(
            "Could not read cached projects:",
            error
        );

        return [];
    }
}

function saveProjectCache(projects) {
    projectCache = Array.isArray(projects)
        ? projects
        : [];

    localStorage.setItem(
        PROJECT_CACHE_KEY,
        JSON.stringify(projectCache)
    );
}

function notifyProjectsUpdated(detail = {}) {
    document.dispatchEvent(
        new CustomEvent(
            "harmonia:projects-updated",
            {
                detail: {
                    projects: [
                        ...projectCache
                    ],
                    ...detail
                }
            }
        )
    );
}

function getAccessToken() {
    return (
        localStorage.getItem(
            AUTH_TOKEN_KEY
        ) ||
        localStorage.getItem(
            "accessToken"
        ) ||
        localStorage.getItem(
            "token"
        ) ||
        sessionStorage.getItem(
            AUTH_TOKEN_KEY
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

function setAccessToken(token) {
    if (!token) {
        localStorage.removeItem(
            AUTH_TOKEN_KEY
        );

        return;
    }

    localStorage.setItem(
        AUTH_TOKEN_KEY,
        token
    );
}

function clearAccessToken() {
    localStorage.removeItem(
        AUTH_TOKEN_KEY
    );

    localStorage.removeItem(
        "accessToken"
    );

    localStorage.removeItem(
        "token"
    );

    sessionStorage.removeItem(
        AUTH_TOKEN_KEY
    );

    sessionStorage.removeItem(
        "accessToken"
    );

    sessionStorage.removeItem(
        "token"
    );
}

function getOrganizationId() {
    return (
        localStorage.getItem(
            ORGANIZATION_ID_KEY
        ) ||
        localStorage.getItem(
            "organizationId"
        ) ||
        ""
    );
}

function setOrganizationId(
    organizationId
) {
    if (!organizationId) {
        localStorage.removeItem(
            ORGANIZATION_ID_KEY
        );

        return;
    }

    localStorage.setItem(
        ORGANIZATION_ID_KEY,
        organizationId
    );
}

function createSlug(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

function normalizeStatus(status) {
    return String(
        status || "PLANNING"
    ).toLowerCase();
}

function toFrontendProject(project) {
    if (!project) {
        return null;
    }

    const title =
        project.title ||
        project.name ||
        "Untitled Project";

    return {
        ...project,

        title,

        name:
            project.name ||
            project.title ||
            title,

        status:
            normalizeStatus(
                project.status
            ),

        progress:
            Number(
                project.progress
            ) || 0,

        createdAt:
            project.createdAt ||
            null,

        updatedAt:
            project.updatedAt ||
            project.createdAt ||
            null
    };
}

function toBackendProject(
    projectData,
    options = {}
) {
    const title =
        projectData.title ||
        projectData.name ||
        "Untitled Project";

    const body = {
        name: String(title).trim(),

        slug:
            projectData.slug ||
            createSlug(title),

        description:
            String(
                projectData.description ||
                ""
            ).trim(),

        status:
            String(
                projectData.status ||
                "PLANNING"
            ).toUpperCase()
    };

    if (projectData.startDate) {
        body.startDate =
            new Date(
                projectData.startDate
            ).toISOString();
    }

    if (projectData.endDate) {
        body.endDate =
            new Date(
                projectData.endDate
            ).toISOString();
    }

    if (options.includeOrganization) {
        const organizationId =
            projectData.organizationId ||
            getOrganizationId();

        if (organizationId) {
            body.organizationId =
                organizationId;
        }
    }

    return body;
}

async function apiRequest(
    path,
    options = {}
) {
    const token = getAccessToken();

    const headers = {
        Accept: "application/json",
        ...(options.headers || {})
    };

    if (
        options.body &&
        !(
            options.body instanceof
            FormData
        )
    ) {
        headers["Content-Type"] =
            "application/json";
    }

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    const response = await fetch(
        `${HARMONIA_API_URL}${path}`,
        {
            ...options,
            headers
        }
    );

    if (response.status === 204) {
        return null;
    }

    const responseText =
        await response.text();

    let responseBody = null;

    if (responseText) {
        try {
            responseBody =
                JSON.parse(
                    responseText
                );
        } catch {
            responseBody =
                responseText;
        }
    }

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error(
                "Your Harmonia session is missing or expired. Please sign in again."
            );
        }

        if (response.status === 403) {
            throw new Error(
                "You do not have permission to perform this action."
            );
        }

        const message =
            responseBody?.message
                ?.message ||
            responseBody?.message ||
            responseBody?.error ||
            `Request failed with status ${response.status}`;

        throw new Error(
            typeof message === "string"
                ? message
                : JSON.stringify(
                    message
                )
        );
    }

    return responseBody;
}

async function loadProjects() {
    try {
        const projects =
            await apiRequest(
                "/projects"
            );

        const normalized =
            Array.isArray(projects)
                ? projects
                    .map(
                        toFrontendProject
                    )
                    .filter(Boolean)
                : [];

        saveProjectCache(
            normalized
        );

        notifyProjectsUpdated({
            action: "loaded"
        });

        return [
            ...normalized
        ];
    } catch (error) {
        console.error(
            "Could not load projects from Railway:",
            error
        );

        return [
            ...projectCache
        ];
    }
}

function getAllProjects() {
    return [
        ...projectCache
    ];
}

function getProjectById(projectId) {
    return (
        projectCache.find(
            project =>
                String(
                    project.id
                ) ===
                String(
                    projectId
                )
        ) || null
    );
}

async function createProject(
    projectData
) {
    const organizationId =
        projectData.organizationId ||
        getOrganizationId();

    if (!organizationId) {
        throw new Error(
            "No organization is selected. Set the Harmonia organization ID before creating a project."
        );
    }

    if (!getAccessToken()) {
        throw new Error(
            "You must sign in before creating a project."
        );
    }

    const body =
        toBackendProject(
            {
                ...projectData,
                organizationId
            },
            {
                includeOrganization: true
            }
        );

    const created =
        await apiRequest(
            "/projects",
            {
                method: "POST",
                body: JSON.stringify(
                    body
                )
            }
        );

    const normalized =
        toFrontendProject(
            created
        );

    saveProjectCache([
        normalized,
        ...projectCache.filter(
            project =>
                String(
                    project.id
                ) !==
                String(
                    normalized.id
                )
        )
    ]);

    notifyProjectsUpdated({
        action: "created",
        project: normalized
    });

    return normalized;
}

async function updateProject(
    projectId,
    projectData
) {
    if (!getAccessToken()) {
        throw new Error(
            "You must sign in before editing a project."
        );
    }

    const body =
        toBackendProject(
            projectData
        );

    const updated =
        await apiRequest(
            `/projects/${encodeURIComponent(
                projectId
            )}`,
            {
                method: "PATCH",
                body: JSON.stringify(
                    body
                )
            }
        );

    const normalized =
        toFrontendProject(
            updated
        );

    const projectExists =
        projectCache.some(
            project =>
                String(
                    project.id
                ) ===
                String(
                    projectId
                )
        );

    if (projectExists) {
        saveProjectCache(
            projectCache.map(
                project =>
                    String(
                        project.id
                    ) ===
                    String(
                        projectId
                    )
                        ? normalized
                        : project
            )
        );
    } else {
        saveProjectCache([
            normalized,
            ...projectCache
        ]);
    }

    notifyProjectsUpdated({
        action: "updated",
        project: normalized
    });

    return normalized;
}

async function deleteProject(
    projectId
) {
    if (!getAccessToken()) {
        throw new Error(
            "You must sign in before deleting a project."
        );
    }

    await apiRequest(
        `/projects/${encodeURIComponent(
            projectId
        )}`,
        {
            method: "DELETE"
        }
    );

    saveProjectCache(
        projectCache.filter(
            project =>
                String(
                    project.id
                ) !==
                String(
                    projectId
                )
        )
    );

    notifyProjectsUpdated({
        action: "deleted",
        projectId
    });

    return true;
}

async function testConnection() {
    try {
        const projects =
            await apiRequest(
                "/projects"
            );

        console.log(
            "✅ Harmonia Railway connection successful",
            projects
        );

        return {
            connected: true,
            projects
        };
    } catch (error) {
        console.error(
            "❌ Harmonia Railway connection failed:",
            error
        );

        return {
            connected: false,
            error
        };
    }
}

window.ProjectManager = {
    loadProjects,
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,

    getAccessToken,
    setAccessToken,
    clearAccessToken,

    getOrganizationId,
    setOrganizationId,

    testConnection
};

console.log(
    "✅ Railway Project Manager Loaded:",
    HARMONIA_API_URL
);