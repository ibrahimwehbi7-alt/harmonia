const HARMONIA_ENTITY_DEFINITIONS = {
    project: {
        label: "Project",
        plural: "Projects",
        storageKeys: [
            "harmonia_projects",
            "harmonia.projects",
            "harmoniaProjects"
        ],
        pageId: "projects",
        titleFields: ["title", "name"],
        descriptionFields: ["description", "summary"],
        openFunctions: [
            "openProjectModal",
            "openProjectWorkspace"
        ]
    },

    work: {
        label: "Work",
        plural: "Work",
        storageKeys: ["harmonia_work"],
        pageId: "work",
        titleFields: ["title"],
        descriptionFields: ["description", "notes"],
        openFunctions: ["openWorkEditor"]
    },

    event: {
        label: "Event",
        plural: "Events",
        storageKeys: [
            "harmonia_events",
            "harmonia.events"
        ],
        pageId: "events",
        titleFields: ["title", "name"],
        descriptionFields: ["description", "details"],
        openFunctions: ["openEventModal"]
    },

    note: {
        label: "Note",
        plural: "Notes",
        storageKeys: [
            "harmonia_notes",
            "harmonia.notes"
        ],
        pageId: "notes",
        titleFields: ["title", "name"],
        descriptionFields: ["content", "body", "description"],
        openFunctions: ["openNoteModal"]
    },

    file: {
        label: "File",
        plural: "Files",
        storageKeys: [
            "harmonia.files",
            "harmonia_files"
        ],
        pageId: "files",
        titleFields: ["title", "fileName", "name"],
        descriptionFields: ["description"],
        openFunctions: ["openFileModal"]
    },

    gallery: {
        label: "Gallery Image",
        plural: "Gallery",
        storageKeys: ["harmonia_gallery"],
        pageId: "gallery",
        titleFields: ["title", "altText"],
        descriptionFields: ["description"],
        openFunctions: ["openGalleryModal"]
    },

    partner: {
        label: "Partner",
        plural: "Partners",
        storageKeys: [
            "harmonia_partners",
            "harmonia.partners"
        ],
        pageId: "partners",
        titleFields: [
            "name",
            "organization",
            "title"
        ],
        descriptionFields: [
            "description",
            "notes",
            "contactName"
        ],
        openFunctions: ["openPartnerModal"]
    },

    message: {
        label: "Message",
        plural: "Messages",
        storageKeys: [
            "harmonia_messages",
            "harmonia.messages"
        ],
        pageId: "messages",
        titleFields: [
            "subject",
            "title",
            "recipient",
            "name"
        ],
        descriptionFields: [
            "body",
            "message",
            "description"
        ],
        openFunctions: ["openMessageModal"]
    },

    finance: {
        label: "Finance Record",
        plural: "Finance",
        storageKeys: [
            "harmonia_finance",
            "harmonia.finance"
        ],
        pageId: "finance",
        titleFields: [
            "title",
            "name",
            "description"
        ],
        descriptionFields: [
            "notes",
            "vendor",
            "source"
        ],
        openFunctions: ["openFinanceModal"]
    },

    analytics: {
        label: "Metric",
        plural: "Analytics",
        storageKeys: [
            "harmonia_analytics",
            "harmonia.analytics"
        ],
        pageId: "analytics",
        titleFields: ["title", "name", "metric"],
        descriptionFields: ["description", "notes"],
        openFunctions: ["openAnalyticsModal"]
    },

    marketing: {
        label: "Marketing Record",
        plural: "Marketing",
        storageKeys: [
            "harmonia_marketing",
            "harmonia.marketing"
        ],
        pageId: "marketing",
        titleFields: ["title", "name"],
        descriptionFields: [
            "objective",
            "audience",
            "description"
        ],
        openFunctions: ["openMarketingModal"]
    }
};

function readEntityStorage(definition) {
    for (const storageKey of definition.storageKeys) {
        try {
            const value =
                localStorage.getItem(storageKey);

            if (!value) {
                continue;
            }

            const parsed = JSON.parse(value);

            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch (error) {
            console.warn(
                `Could not read ${storageKey}:`,
                error
            );
        }
    }

    return [];
}

function getEntityTitle(type, record) {
    const definition =
        HARMONIA_ENTITY_DEFINITIONS[type];

    if (!definition || !record) {
        return "Untitled";
    }

    for (
        const field of
        definition.titleFields
    ) {
        const value = record[field];

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim()
        ) {
            return String(value).trim();
        }
    }

    return `${definition.label} ${String(
        record.id || ""
    ).slice(0, 8)}`.trim();
}

function getEntityDescription(type, record) {
    const definition =
        HARMONIA_ENTITY_DEFINITIONS[type];

    if (!definition || !record) {
        return "";
    }

    for (
        const field of
        definition.descriptionFields
    ) {
        const value = record[field];

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim()
        ) {
            return String(value).trim();
        }
    }

    return "";
}

function normalizeEntityRecord(type, record) {
    if (!record || !record.id) {
        return null;
    }

    return {
        type,
        id: String(record.id),
        title: getEntityTitle(type, record),
        description:
            getEntityDescription(type, record),
        raw: record
    };
}

function getEntities(type) {
    const definition =
        HARMONIA_ENTITY_DEFINITIONS[type];

    if (!definition) {
        return [];
    }

    return readEntityStorage(definition)
        .map(record =>
            normalizeEntityRecord(
                type,
                record
            )
        )
        .filter(Boolean);
}

function getEntity(type, id) {
    return (
        getEntities(type).find(
            entity =>
                String(entity.id) === String(id)
        ) || null
    );
}

function getAllEntityTypes() {
    return Object.keys(
        HARMONIA_ENTITY_DEFINITIONS
    );
}

function getEntityDefinition(type) {
    return (
        HARMONIA_ENTITY_DEFINITIONS[type] ||
        null
    );
}

function findSidebarButton(pageId) {
    return (
        document.querySelector(
            `[data-page="${pageId}"]`
        ) ||
        document.querySelector(
            `[data-target="${pageId}"]`
        ) ||
        document.querySelector(
            `[href="#${pageId}"]`
        )
    );
}

function navigateToEntity(type, id) {
    const definition =
        getEntityDefinition(type);

    if (!definition) {
        return false;
    }

    const pageButton =
        findSidebarButton(
            definition.pageId
        );

    pageButton?.click();

    window.setTimeout(() => {
        for (
            const functionName of
            definition.openFunctions
        ) {
            const openFunction =
                window[functionName];

            if (
                typeof openFunction ===
                "function"
            ) {
                openFunction(id);
                return;
            }
        }
    }, 80);

    return true;
}

window.HarmoniaEntities = {
    definitions:
        HARMONIA_ENTITY_DEFINITIONS,
    getTypes:
        getAllEntityTypes,
    getDefinition:
        getEntityDefinition,
    getAll:
        getEntities,
    getById:
        getEntity,
    getTitle:
        getEntityTitle,
    getDescription:
        getEntityDescription,
    navigate:
        navigateToEntity
};

console.log(
    "✅ Harmonia Entity Registry Loaded"
);