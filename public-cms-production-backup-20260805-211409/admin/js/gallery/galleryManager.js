const GALLERY_STORAGE_KEY = "harmonia_gallery";

function loadGallery() {
    try {
        const savedGallery =
            localStorage.getItem(GALLERY_STORAGE_KEY);

        if (!savedGallery) {
            return [];
        }

        const parsedGallery =
            JSON.parse(savedGallery);

        return Array.isArray(parsedGallery)
            ? parsedGallery.map(normalizeGalleryItem)
            : [];
    } catch (error) {
        console.error(
            "Could not load gallery:",
            error
        );

        return [];
    }
}

function saveGallery(galleryItems) {
    localStorage.setItem(
        GALLERY_STORAGE_KEY,
        JSON.stringify(galleryItems)
    );

    document.dispatchEvent(
        new CustomEvent(
            "harmonia:gallery-updated"
        )
    );
}

function createGalleryId() {
    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {
        return window.crypto.randomUUID();
    }

    return `gallery-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;
}

function normalizeGalleryItem(galleryData = {}) {
    const timestamp =
        new Date().toISOString();

    const legacyImageUrl =
        String(galleryData.imageUrl || "").trim();

    const imageSource =
        galleryData.imageSource === "file"
            ? "file"
            : "url";

    return {
        id:
            galleryData.id ||
            createGalleryId(),

        title:
            String(
                galleryData.title || ""
            ).trim(),

        description:
            String(
                galleryData.description || ""
            ).trim(),

        category:
            String(
                galleryData.category ||
                    "event"
            ).trim(),

        imageSource,

        fileId:
            imageSource === "file"
                ? String(
                    galleryData.fileId || ""
                ).trim()
                : "",

        imageUrl:
            imageSource === "url"
                ? legacyImageUrl
                : "",

        altText:
            String(
                galleryData.altText || ""
            ).trim(),

        photographer:
            String(
                galleryData.photographer ||
                    ""
            ).trim(),

        eventName:
            String(
                galleryData.eventName || ""
            ).trim(),

        location:
            String(
                galleryData.location || ""
            ).trim(),

        dateTaken:
            String(
                galleryData.dateTaken || ""
            ).trim(),

        visibility:
            galleryData.visibility ===
            "private"
                ? "private"
                : "public",

        featured:
            Boolean(
                galleryData.featured
            ),

        createdAt:
            galleryData.createdAt ||
            timestamp,

        updatedAt:
            galleryData.updatedAt ||
            timestamp
    };
}

function getAllGalleryItems() {
    return loadGallery();
}

function getGalleryItemById(
    galleryId
) {
    return (
        loadGallery().find(
            (item) =>
                item.id === galleryId
        ) || null
    );
}

function resolveGalleryImageUrl(
    galleryItem
) {
    if (!galleryItem) {
        return "";
    }

    if (
        galleryItem.imageSource === "file" &&
        galleryItem.fileId &&
        window.HarmoniaFiles &&
        typeof window.HarmoniaFiles.resolveUrl ===
            "function"
    ) {
        return (
            window.HarmoniaFiles.resolveUrl(
                galleryItem.fileId
            ) || ""
        );
    }

    return galleryItem.imageUrl || "";
}

function createGalleryItem(
    galleryData
) {
    const galleryItems =
        loadGallery();

    const newGalleryItem =
        normalizeGalleryItem(
            galleryData
        );

    galleryItems.unshift(
        newGalleryItem
    );

    saveGallery(
        galleryItems
    );

    return newGalleryItem;
}

function updateGalleryItem(
    galleryId,
    galleryData
) {
    const galleryItems =
        loadGallery();

    const galleryIndex =
        galleryItems.findIndex(
            (item) =>
                item.id === galleryId
        );

    if (galleryIndex === -1) {
        return null;
    }

    const currentGalleryItem =
        galleryItems[
            galleryIndex
        ];

    const updatedGalleryItem =
        normalizeGalleryItem({
            ...currentGalleryItem,
            ...galleryData,
            id:
                currentGalleryItem.id,
            createdAt:
                currentGalleryItem
                    .createdAt,
            updatedAt:
                new Date().toISOString()
        });

    galleryItems[
        galleryIndex
    ] = updatedGalleryItem;

    saveGallery(
        galleryItems
    );

    return updatedGalleryItem;
}

function deleteGalleryItem(
    galleryId
) {
    const galleryItems =
        loadGallery();

    const filteredGalleryItems =
        galleryItems.filter(
            (item) =>
                item.id !== galleryId
        );

    if (
        filteredGalleryItems.length ===
        galleryItems.length
    ) {
        return false;
    }

    saveGallery(
        filteredGalleryItems
    );

    return true;
}

function toggleGalleryFeatured(
    galleryId
) {
    const galleryItem =
        getGalleryItemById(
            galleryId
        );

    if (!galleryItem) {
        return null;
    }

    return updateGalleryItem(
        galleryId,
        {
            featured:
                !galleryItem.featured
        }
    );
}

function getGallerySummary() {
    const galleryItems =
        loadGallery();

    return {
        total:
            galleryItems.length,

        public:
            galleryItems.filter(
                (item) =>
                    item.visibility ===
                    "public"
            ).length,

        private:
            galleryItems.filter(
                (item) =>
                    item.visibility ===
                    "private"
            ).length,

        featured:
            galleryItems.filter(
                (item) =>
                    item.featured
            ).length
    };
}

window.HarmoniaGallery = {
    load:
        getAllGalleryItems,

    getAll:
        getAllGalleryItems,

    getById:
        getGalleryItemById,

    resolveImageUrl:
        resolveGalleryImageUrl,

    create:
        createGalleryItem,

    update:
        updateGalleryItem,

    delete:
        deleteGalleryItem,

    toggleFeatured:
        toggleGalleryFeatured,

    getSummary:
        getGallerySummary
};

console.log(
    "✅ Gallery Manager Loaded"
);