(function initializeHarmoniaModels() {
    if (!window.Harmonia) {
        console.error(
            "Harmonia core must load before models.js."
        );
        return;
    }

    function now() {
        return new Date().toISOString();
    }

    function cleanString(value, fallback = "") {
        if (typeof value !== "string") {
            return fallback;
        }

        return value.trim();
    }

    function cleanArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function cleanNumber(value, fallback = 0) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;
    }

    function createProject(data = {}) {
        const timestamp = now();

        return {
            id:
                data.id ||
                Harmonia.Storage.createId("project"),

            organizationId:
                data.organizationId || "harmonia",

            title:
                cleanString(
                    data.title,
                    "Untitled Project"
                ),

            description:
                cleanString(data.description),

            status:
                cleanString(
                    data.status,
                    "planning"
                ),

            priority:
                cleanString(
                    data.priority,
                    "medium"
                ),

            startDate:
                cleanString(data.startDate),

            endDate:
                cleanString(data.endDate),

            ownerUserId:
                data.ownerUserId || null,

            tags:
                cleanArray(data.tags),

            createdAt:
                data.createdAt || timestamp,

            updatedAt:
                data.updatedAt || timestamp
        };
    }

    function createWork(data = {}) {
        const timestamp = now();

        return {
            id:
                data.id ||
                Harmonia.Storage.createId("work"),

            organizationId:
                data.organizationId || "harmonia",

            projectId:
                data.projectId || null,

            title:
                cleanString(
                    data.title,
                    "Untitled Work"
                ),

            description:
                cleanString(data.description),

            status:
                cleanString(
                    data.status,
                    "planning"
                ),

            priority:
                cleanString(
                    data.priority,
                    "medium"
                ),

            assignedToUserId:
                data.assignedToUserId || null,

            createdByUserId:
                data.createdByUserId || "owner",

            dueDate:
                cleanString(data.dueDate),

            tags:
                cleanArray(data.tags),

            createdAt:
                data.createdAt || timestamp,

            updatedAt:
                data.updatedAt || timestamp
        };
    }

    function createEvent(data = {}) {
        const timestamp = now();

        return {
            id:
                data.id ||
                Harmonia.Storage.createId("event"),

            organizationId:
                data.organizationId || "harmonia",

            projectId:
                data.projectId || null,

            title:
                cleanString(
                    data.title,
                    "Untitled Event"
                ),

            description:
                cleanString(data.description),

            status:
                cleanString(
                    data.status,
                    "planning"
                ),

            eventType:
                cleanString(
                    data.eventType,
                    "general"
                ),

            startDateTime:
                cleanString(data.startDateTime),

            endDateTime:
                cleanString(data.endDateTime),

            location:
                cleanString(data.location),

            capacity:
                cleanNumber(data.capacity),

            registrationUrl:
                cleanString(data.registrationUrl),

            tags:
                cleanArray(data.tags),

            createdAt:
                data.createdAt || timestamp,

            updatedAt:
                data.updatedAt || timestamp
        };
    }

    function createNetworkRecord(data = {}) {
        const timestamp = now();

        return {
            id:
                data.id ||
                Harmonia.Storage.createId("network"),

            organizationId:
                data.organizationId || "harmonia",

            recordType:
                cleanString(
                    data.recordType,
                    "person"
                ),

            displayName:
                cleanString(
                    data.displayName,
                    "Unnamed Contact"
                ),

            firstName:
                cleanString(data.firstName),

            lastName:
                cleanString(data.lastName),

            organizationName:
                cleanString(
                    data.organizationName
                ),

            email:
                cleanString(data.email),

            phone:
                cleanString(data.phone),

            website:
                cleanString(data.website),

            relationshipType:
                cleanString(
                    data.relationshipType,
                    "contact"
                ),

            relationshipStatus:
                cleanString(
                    data.relationshipStatus,
                    "active"
                ),

            notes:
                cleanString(data.notes),

            tags:
                cleanArray(data.tags),

            createdAt:
                data.createdAt || timestamp,

            updatedAt:
                data.updatedAt || timestamp
        };
    }

    function createFinancialTransaction(data = {}) {
        const timestamp = now();

        return {
            id:
                data.id ||
                Harmonia.Storage.createId(
                    "transaction"
                ),

            organizationId:
                data.organizationId || "harmonia",

            transactionType:
                cleanString(
                    data.transactionType,
                    "expense"
                ),

            category:
                cleanString(
                    data.category,
                    "other"
                ),

            amount:
                cleanNumber(data.amount),

            currency:
                cleanString(
                    data.currency,
                    "USD"
                ),

            date:
                cleanString(data.date),

            description:
                cleanString(data.description),

            status:
                cleanString(
                    data.status,
                    "pending"
                ),

            networkRecordId:
                data.networkRecordId || null,

            projectId:
                data.projectId || null,

            paymentMethod:
                cleanString(data.paymentMethod),

            reference:
                cleanString(data.reference),

            createdAt:
                data.createdAt || timestamp,

            updatedAt:
                data.updatedAt || timestamp
        };
    }

    Harmonia.Models = {
        Project: createProject,
        Work: createWork,
        Event: createEvent,
        NetworkRecord: createNetworkRecord,
        FinancialTransaction:
            createFinancialTransaction
    };

    console.log("✅ Harmonia Models Loaded");
})();