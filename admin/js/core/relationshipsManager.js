const HARMONIA_RELATIONSHIPS_KEY =
    "harmonia_relationships";

function createRelationshipId() {
    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {
        return window.crypto.randomUUID();
    }

    return `relationship-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;
}

function normalizeRelationship(
    relationship = {}
) {
    const now =
        new Date().toISOString();

    return {
        id:
            relationship.id ||
            createRelationshipId(),

        fromType:
            String(
                relationship.fromType || ""
            ).trim(),

        fromId:
            String(
                relationship.fromId || ""
            ).trim(),

        toType:
            String(
                relationship.toType || ""
            ).trim(),

        toId:
            String(
                relationship.toId || ""
            ).trim(),

        label:
            String(
                relationship.label ||
                    "Connected to"
            ).trim(),

        notes:
            String(
                relationship.notes || ""
            ).trim(),

        createdAt:
            relationship.createdAt ||
            now,

        updatedAt:
            relationship.updatedAt ||
            now
    };
}

function loadRelationships() {
    try {
        const stored =
            localStorage.getItem(
                HARMONIA_RELATIONSHIPS_KEY
            );

        if (!stored) {
            return [];
        }

        const parsed =
            JSON.parse(stored);

        return Array.isArray(parsed)
            ? parsed.map(
                normalizeRelationship
            )
            : [];
    } catch (error) {
        console.error(
            "Could not load relationships:",
            error
        );

        return [];
    }
}

function saveRelationships(
    relationships
) {
    try {
        localStorage.setItem(
            HARMONIA_RELATIONSHIPS_KEY,
            JSON.stringify(
                relationships
            )
        );

        document.dispatchEvent(
            new CustomEvent(
                "harmonia:relationships-updated"
            )
        );

        return true;
    } catch (error) {
        console.error(
            "Could not save relationships:",
            error
        );

        return false;
    }
}

function isSameEndpoint(
    relationship,
    type,
    id
) {
    return (
        (
            relationship.fromType ===
                type &&
            relationship.fromId ===
                String(id)
        ) ||
        (
            relationship.toType ===
                type &&
            relationship.toId ===
                String(id)
        )
    );
}

function getRelationshipsFor(
    type,
    id
) {
    return loadRelationships().filter(
        relationship =>
            isSameEndpoint(
                relationship,
                type,
                id
            )
    );
}

function getConnectedEndpoint(
    relationship,
    type,
    id
) {
    if (
        relationship.fromType === type &&
        relationship.fromId ===
            String(id)
    ) {
        return {
            type:
                relationship.toType,
            id:
                relationship.toId
        };
    }

    return {
        type:
            relationship.fromType,
        id:
            relationship.fromId
    };
}

function relationshipExists(
    fromType,
    fromId,
    toType,
    toId
) {
    return loadRelationships().some(
        relationship => {
            const direct =
                relationship.fromType ===
                    fromType &&
                relationship.fromId ===
                    String(fromId) &&
                relationship.toType ===
                    toType &&
                relationship.toId ===
                    String(toId);

            const reverse =
                relationship.fromType ===
                    toType &&
                relationship.fromId ===
                    String(toId) &&
                relationship.toType ===
                    fromType &&
                relationship.toId ===
                    String(fromId);

            return direct || reverse;
        }
    );
}

function createRelationship(data) {
    if (
        !data.fromType ||
        !data.fromId ||
        !data.toType ||
        !data.toId
    ) {
        throw new Error(
            "Both relationship endpoints are required."
        );
    }

    if (
        data.fromType === data.toType &&
        String(data.fromId) ===
            String(data.toId)
    ) {
        throw new Error(
            "A record cannot connect to itself."
        );
    }

    if (
        relationshipExists(
            data.fromType,
            data.fromId,
            data.toType,
            data.toId
        )
    ) {
        throw new Error(
            "These records are already connected."
        );
    }

    const relationships =
        loadRelationships();

    const relationship =
        normalizeRelationship(data);

    relationships.unshift(
        relationship
    );

    if (
        !saveRelationships(
            relationships
        )
    ) {
        throw new Error(
            "Could not save the connection."
        );
    }

    return relationship;
}

function updateRelationship(
    relationshipId,
    updates
) {
    const relationships =
        loadRelationships();

    const index =
        relationships.findIndex(
            relationship =>
                relationship.id ===
                relationshipId
        );

    if (index === -1) {
        return null;
    }

    relationships[index] =
        normalizeRelationship({
            ...relationships[index],
            ...updates,
            id:
                relationships[index].id,
            createdAt:
                relationships[index]
                    .createdAt,
            updatedAt:
                new Date().toISOString()
        });

    saveRelationships(
        relationships
    );

    return relationships[index];
}

function deleteRelationship(
    relationshipId
) {
    const relationships =
        loadRelationships();

    const filtered =
        relationships.filter(
            relationship =>
                relationship.id !==
                relationshipId
        );

    if (
        filtered.length ===
        relationships.length
    ) {
        return false;
    }

    return saveRelationships(
        filtered
    );
}

function deleteRelationshipsFor(
    type,
    id
) {
    const relationships =
        loadRelationships();

    const filtered =
        relationships.filter(
            relationship =>
                !isSameEndpoint(
                    relationship,
                    type,
                    id
                )
        );

    if (
        filtered.length ===
        relationships.length
    ) {
        return false;
    }

    return saveRelationships(
        filtered
    );
}

window.HarmoniaRelationships = {
    load:
        loadRelationships,
    getAll:
        loadRelationships,
    getFor:
        getRelationshipsFor,
    getConnectedEndpoint,
    exists:
        relationshipExists,
    create:
        createRelationship,
    update:
        updateRelationship,
    delete:
        deleteRelationship,
    deleteFor:
        deleteRelationshipsFor
};

console.log(
    "✅ Harmonia Relationships Manager Loaded"
);