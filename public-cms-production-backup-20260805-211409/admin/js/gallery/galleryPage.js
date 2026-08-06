let activeGallerySearch = "";
let activeGalleryCategoryFilter =
    "all";
let activeGalleryVisibilityFilter =
    "all";
let activeGalleryFeaturedFilter =
    "all";

function escapeGalleryPageHtml(
    value
) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatGalleryCategory(
    category
) {
    const categoryLabels = {
        event: "Event",
        community: "Community",
        leadership: "Leadership",
        partner: "Partner",
        press: "Press",
        brand: "Brand",
        archive: "Archive"
    };

    return (
        categoryLabels[category] ||
        "Other"
    );
}

function formatGalleryDate(
    dateValue
) {
    if (!dateValue) {
        return "No date";
    }

    const parsedDate =
        new Date(
            `${dateValue}T12:00:00`
        );

    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {
        return dateValue;
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    ).format(parsedDate);
}

function getFilteredGalleryItems(
    galleryItems
) {
    const normalizedSearch =
        activeGallerySearch
            .trim()
            .toLowerCase();

    return galleryItems.filter(
        (item) => {
            const searchableText = [
                item.title,
                item.description,
                item.category,
                item.photographer,
                item.eventName,
                item.location,
                item.altText
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !normalizedSearch ||
                searchableText.includes(
                    normalizedSearch
                );

            const matchesCategory =
                activeGalleryCategoryFilter ===
                    "all" ||
                item.category ===
                    activeGalleryCategoryFilter;

            const matchesVisibility =
                activeGalleryVisibilityFilter ===
                    "all" ||
                item.visibility ===
                    activeGalleryVisibilityFilter;

            const matchesFeatured =
                activeGalleryFeaturedFilter ===
                    "all" ||
                (
                    activeGalleryFeaturedFilter ===
                        "featured" &&
                    item.featured
                ) ||
                (
                    activeGalleryFeaturedFilter ===
                        "not-featured" &&
                    !item.featured
                );

            return (
                matchesSearch &&
                matchesCategory &&
                matchesVisibility &&
                matchesFeatured
            );
        }
    );
}

function sortGalleryItems(
    galleryItems
) {
    return [...galleryItems].sort(
        (firstItem, secondItem) => {
            if (
                firstItem.featured !==
                secondItem.featured
            ) {
                return Number(
                    secondItem.featured
                ) -
                    Number(
                        firstItem.featured
                    );
            }

            return String(
                secondItem.dateTaken ||
                    secondItem.createdAt ||
                    ""
            ).localeCompare(
                String(
                    firstItem.dateTaken ||
                        firstItem.createdAt ||
                        ""
                )
            );
        }
    );
}

function createGalleryCard(
    galleryItem
) {
    const card =
        document.createElement(
            "article"
        );

    card.className =
        "gallery-card";

    const resolvedImageUrl =
        window.HarmoniaGallery
            ?.resolveImageUrl(
                galleryItem
            ) || "";

    card.innerHTML = `
        <div class="gallery-card-image-wrap">
            ${
                resolvedImageUrl
                    ? `
                        <img
                            class="gallery-card-image"
                            src="${escapeGalleryPageHtml(
                                resolvedImageUrl
                            )}"
                            alt="${escapeGalleryPageHtml(
                                galleryItem.altText ||
                                    galleryItem.title
                            )}"
                            loading="lazy"
                        />
                    `
                    : `
                        <div class="gallery-image-placeholder">
                            Image unavailable
                        </div>
                    `
            }

            ${
                galleryItem.featured
                    ? `
                        <span class="gallery-featured-badge">
                            Featured
                        </span>
                    `
                    : ""
            }
        </div>

        <div class="gallery-card-body">
            <div class="gallery-card-heading">
                <div>
                    <p class="gallery-card-category">
                        ${escapeGalleryPageHtml(
                            formatGalleryCategory(
                                galleryItem.category
                            )
                        )}
                    </p>

                    <h3>
                        ${escapeGalleryPageHtml(
                            galleryItem.title
                        )}
                    </h3>
                </div>

                <span class="gallery-visibility-badge ${escapeGalleryPageHtml(
                    galleryItem.visibility
                )}">
                    ${escapeGalleryPageHtml(
                        galleryItem.visibility ===
                            "private"
                            ? "Private"
                            : "Public"
                    )}
                </span>
            </div>

            <p class="gallery-card-description">
                ${escapeGalleryPageHtml(
                    galleryItem.description ||
                        "No description added."
                )}
            </p>

            <div class="gallery-card-meta">
                <span>
                    ${escapeGalleryPageHtml(
                        galleryItem.eventName ||
                            "No event"
                    )}
                </span>

                <span>
                    ${escapeGalleryPageHtml(
                        formatGalleryDate(
                            galleryItem.dateTaken
                        )
                    )}
                </span>

                <span>
                    ${escapeGalleryPageHtml(
                        galleryItem.photographer ||
                            "No credit"
                    )}
                </span>

                <span>
                    ${
                        galleryItem.imageSource ===
                            "file"
                            ? "Harmonia Files"
                            : "External URL"
                    }
                </span>
            </div>

            <div class="gallery-card-actions">
                <button
                    class="text-button"
                    type="button"
                    data-gallery-featured="${escapeGalleryPageHtml(
                        galleryItem.id
                    )}"
                >
                    ${
                        galleryItem.featured
                            ? "Remove feature"
                            : "Feature"
                    }
                </button>

                <button
                    class="text-button"
                    type="button"
                    data-gallery-edit="${escapeGalleryPageHtml(
                        galleryItem.id
                    )}"
                >
                    Edit
                </button>

                <button
                    class="text-button danger"
                    type="button"
                    data-gallery-delete="${escapeGalleryPageHtml(
                        galleryItem.id
                    )}"
                >
                    Delete
                </button>
            </div>
        </div>
    `;

    const image =
        card.querySelector(
            ".gallery-card-image"
        );

    image?.addEventListener(
        "error",
        () => {
            image.remove();

            card
                .querySelector(
                    ".gallery-card-image-wrap"
                )
                ?.insertAdjacentHTML(
                    "afterbegin",
                    `
                        <div class="gallery-image-placeholder">
                            Image unavailable
                        </div>
                    `
                );
        },
        {
            once: true
        }
    );

    return card;
}

function updateGallerySummary(
    galleryItems
) {
    const summary =
        window.HarmoniaGallery
            ?.getSummary() || {
                total: galleryItems.length,
                public: 0,
                private: 0,
                featured: 0
            };

    const summaryValues = {
        galleryTotalCount:
            summary.total,
        galleryPublicCount:
            summary.public,
        galleryPrivateCount:
            summary.private,
        galleryFeaturedCount:
            summary.featured
    };

    Object.entries(
        summaryValues
    ).forEach(
        ([elementId, value]) => {
            const element =
                document.getElementById(
                    elementId
                );

            if (element) {
                element.textContent =
                    String(value);
            }
        }
    );
}

function renderGallery() {
    const galleryGrid =
        document.getElementById(
            "galleryAdminGrid"
        ) ||
        document.getElementById(
            "galleryGrid"
        );

    const emptyState =
        document.getElementById(
            "galleryEmptyState"
        );

    if (
        !galleryGrid ||
        !window.HarmoniaGallery
    ) {
        return;
    }

    const allGalleryItems =
        window.HarmoniaGallery.getAll();

    const filteredGalleryItems =
        sortGalleryItems(
            getFilteredGalleryItems(
                allGalleryItems
            )
        );

    galleryGrid.innerHTML =
        "";

    filteredGalleryItems.forEach(
        (galleryItem) => {
            galleryGrid.appendChild(
                createGalleryCard(
                    galleryItem
                )
            );
        }
    );

    if (emptyState) {
        emptyState.hidden =
            filteredGalleryItems.length >
            0;
    }

    updateGallerySummary(
        allGalleryItems
    );
}

function initializeGalleryFilters() {
    const filterBindings = [
        [
            "gallerySearchInput",
            "input",
            (element) => {
                activeGallerySearch =
                    element.value;
            }
        ],
        [
            "galleryCategoryFilter",
            "change",
            (element) => {
                activeGalleryCategoryFilter =
                    element.value;
            }
        ],
        [
            "galleryVisibilityFilter",
            "change",
            (element) => {
                activeGalleryVisibilityFilter =
                    element.value;
            }
        ],
        [
            "galleryFeaturedFilter",
            "change",
            (element) => {
                activeGalleryFeaturedFilter =
                    element.value;
            }
        ]
    ];

    filterBindings.forEach(
        ([elementId, eventName, update]) => {
            const element =
                document.getElementById(
                    elementId
                );

            if (
                !element ||
                element.dataset
                    .galleryFilterAttached ===
                    "true"
            ) {
                return;
            }

            element.addEventListener(
                eventName,
                () => {
                    update(element);
                    renderGallery();
                }
            );

            element.dataset
                .galleryFilterAttached =
                "true";
        }
    );
}

function initializeNewGalleryButton() {
    const newGalleryButton =
        document.getElementById(
            "newGalleryButton"
        ) ||
        document.getElementById(
            "addGalleryButton"
        ) ||
        document.getElementById(
            "uploadPhotosButton"
        );

    if (
        !newGalleryButton ||
        newGalleryButton.dataset
            .galleryListenerAttached ===
            "true"
    ) {
        return;
    }

    newGalleryButton.addEventListener(
        "click",
        () => {
            window.openGalleryModal?.();
        }
    );

    newGalleryButton.dataset
        .galleryListenerAttached =
        "true";
}

function handleGalleryPageClick(
    event
) {
    const editButton =
        event.target.closest(
            "[data-gallery-edit]"
        );

    if (editButton) {
        window.openGalleryModal?.(
            editButton.dataset
                .galleryEdit
        );

        return;
    }

    const featureButton =
        event.target.closest(
            "[data-gallery-featured]"
        );

    if (featureButton) {
        window.HarmoniaGallery
            ?.toggleFeatured(
                featureButton.dataset
                    .galleryFeatured
            );

        return;
    }

    const deleteButton =
        event.target.closest(
            "[data-gallery-delete]"
        );

    if (!deleteButton) {
        return;
    }

    const galleryId =
        deleteButton.dataset
            .galleryDelete;

    const galleryItem =
        window.HarmoniaGallery
            ?.getById(
                galleryId
            );

    if (
        galleryItem &&
        window.confirm(
            `Delete "${galleryItem.title}" from the gallery?`
        )
    ) {
        window.HarmoniaGallery.delete(
            galleryId
        );
    }
}

function initializeGalleryPage() {
    initializeNewGalleryButton();
    initializeGalleryFilters();
    renderGallery();
}

document.addEventListener(
    "click",
    handleGalleryPageClick
);

document.addEventListener(
    "harmonia:gallery-updated",
    renderGallery
);

document.addEventListener(
    "harmonia:files-updated",
    renderGallery
);

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeGalleryPage
    );
} else {
    initializeGalleryPage();
}

window.renderGallery =
    renderGallery;

console.log(
    "✅ Gallery Page Loaded"
);