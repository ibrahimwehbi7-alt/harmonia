const PROJECT_CACHE_KEY = "harmonia_project_cache";

let projectCache = loadCachedProjects();

function getApi() {
    if (!window.HarmoniaApi) {
        throw new Error("Harmonia API client is not loaded.");
    }
    return window.HarmoniaApi;
}

function getAccessToken() {
    return getApi().getToken();
}

function setAccessToken(token) {
    getApi().setToken(token, true);
}

function clearAccessToken() {
    getApi().clearToken();
}

function getOrganizationId() {
    return getApi().getOrganizationId();
}

function setOrganizationId(organizationId) {
    getApi().setOrganizationId(organizationId);
}

function loadCachedProjects() {
    try {
        const stored = localStorage.getItem(PROJECT_CACHE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Could not read cached projects:", error);
        return [];
    }
}

function saveProjectCache(projects) {
    projectCache = Array.isArray(projects) ? projects : [];
    localStorage.setItem(PROJECT_CACHE_KEY, JSON.stringify(projectCache));
}

function notifyProjectsUpdated(detail = {}) {
    document.dispatchEvent(new CustomEvent("harmonia:projects-updated", {
        detail: { projects: [...projectCache], ...detail }
    }));
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

async function apiRequest(path, options = {}) {
    return getApi().request(path, options);
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
    getApi().getBaseUrl()
);