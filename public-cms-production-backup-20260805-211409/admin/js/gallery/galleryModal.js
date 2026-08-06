let activeGalleryItemId = null;

function escapeGalleryModalHtml(
    value
) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getGalleryModalElement() {
    return document.getElementById(
        "galleryModal"
    );
}

function createGalleryModalElement() {
    const existingModal =
        getGalleryModalElement();

    if (existingModal) {
        return existingModal;
    }

    const modal =
        document.createElement(
            "div"
        );

    modal.className =
        "gallery-modal";

    modal.id =
        "galleryModal";

    modal.hidden =
        true;

    document.body.appendChild(
        modal
    );

    return modal;
}

function getAvailableGalleryFiles() {
    if (
        !window.HarmoniaFiles ||
        typeof window.HarmoniaFiles.getImages !==
            "function"
    ) {
        return [];
    }

    return window.HarmoniaFiles.getImages();
}

function buildGalleryFileOptions(
    selectedFileId
) {
    const imageFiles =
        getAvailableGalleryFiles();

    if (!imageFiles.length) {
        return `
            <option value="">
                No image files available
            </option>
        `;
    }

    return [
        `
            <option value="">
                Choose an image file
            </option>
        `,
        ...imageFiles.map(
            (file) => `
                <option
                    value="${escapeGalleryModalHtml(
                        file.id
                    )}"
                    ${
                        file.id === selectedFileId
                            ? "selected"
                            : ""
                    }
                >
                    ${escapeGalleryModalHtml(
                        file.title ||
                            file.fileName ||
                            "Untitled image"
                    )}
                </option>
            `
        )
    ].join("");
}

function renderGalleryModal(
    galleryItem = null
) {
    const modal =
        createGalleryModalElement();

    const isEditing =
        Boolean(galleryItem);

    const item =
        galleryItem || {
            title: "",
            description: "",
            category: "event",
            imageSource: "file",
            fileId: "",
            imageUrl: "",
            altText: "",
            photographer: "",
            eventName: "",
            location: "",
            dateTaken: "",
            visibility: "public",
            featured: false
        };

    modal.innerHTML = `
        <div
            class="gallery-modal-backdrop"
            data-close-gallery-modal
        ></div>

        <section
            class="gallery-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="galleryModalTitle"
        >
            <div
                class="gallery-modal-header"
            >
                <div>
                    <p class="panel-label">
                        Media Library
                    </p>

                    <h3 id="galleryModalTitle">
                        ${
                            isEditing
                                ? "Edit Image"
                                : "Add Image"
                        }
                    </h3>
                </div>

                <button
                    class="gallery-modal-close"
                    type="button"
                    data-close-gallery-modal
                    aria-label="Close"
                >
                    ×
                </button>
            </div>

            <div class="gallery-form-grid">
                <label class="gallery-field gallery-field-wide">
                    <span>Image title</span>

                    <input
                        id="galleryTitleInput"
                        type="text"
                        maxlength="160"
                        value="${escapeGalleryModalHtml(
                            item.title
                        )}"
                        placeholder="Name this image"
                    />
                </label>

                <label class="gallery-field">
                    <span>Category</span>

                    <select id="galleryCategoryInput">
                        <option value="event">Event</option>
                        <option value="community">Community</option>
                        <option value="leadership">Leadership</option>
                        <option value="partner">Partner</option>
                        <option value="press">Press</option>
                        <option value="brand">Brand</option>
                        <option value="archive">Archive</option>
                    </select>
                </label>

                <label class="gallery-field">
                    <span>Visibility</span>

                    <select id="galleryVisibilityInput">
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                    </select>
                </label>

                <label class="gallery-field gallery-field-wide">
                    <span>Image source</span>

                    <select id="galleryImageSourceInput">
                        <option value="file">
                            Choose from Harmonia Files
                        </option>

                        <option value="url">
                            Use an external URL
                        </option>
                    </select>
                </label>

                <div
                    class="gallery-field gallery-field-wide"
                    id="galleryFileSourceFields"
                >
                    <label>
                        <span>Choose image file</span>

                        <select id="galleryFileIdInput">
                            ${buildGalleryFileOptions(
                                item.fileId
                            )}
                        </select>
                    </label>

                    <p class="gallery-source-help">
                        Upload an image in the Files tab first, then select it here.
                    </p>
                </div>

                <div
                    class="gallery-field gallery-field-wide"
                    id="galleryUrlSourceFields"
                    hidden
                >
                    <label>
                        <span>External image URL</span>

                        <input
                            id="galleryImageUrlInput"
                            type="url"
                            value="${escapeGalleryModalHtml(
                                item.imageUrl
                            )}"
                            placeholder="https://..."
                        />
                    </label>
                </div>

                <label class="gallery-field gallery-field-wide">
                    <span>Alternative text</span>

                    <input
                        id="galleryAltTextInput"
                        type="text"
                        maxlength="220"
                        value="${escapeGalleryModalHtml(
                            item.altText
                        )}"
                        placeholder="Describe the image for accessibility"
                    />
                </label>

                <label class="gallery-field">
                    <span>Photographer</span>

                    <input
                        id="galleryPhotographerInput"
                        type="text"
                        maxlength="140"
                        value="${escapeGalleryModalHtml(
                            item.photographer
                        )}"
                    />
                </label>

                <label class="gallery-field">
                    <span>Date taken</span>

                    <input
                        id="galleryDateTakenInput"
                        type="date"
                        value="${escapeGalleryModalHtml(
                            item.dateTaken
                        )}"
                    />
                </label>

                <label class="gallery-field">
                    <span>Event or campaign</span>

                    <input
                        id="galleryEventNameInput"
                        type="text"
                        maxlength="160"
                        value="${escapeGalleryModalHtml(
                            item.eventName
                        )}"
                    />
                </label>

                <label class="gallery-field">
                    <span>Location</span>

                    <input
                        id="galleryLocationInput"
                        type="text"
                        maxlength="180"
                        value="${escapeGalleryModalHtml(
                            item.location
                        )}"
                    />
                </label>

                <label class="gallery-field gallery-field-wide">
                    <span>Description</span>

                    <textarea
                        id="galleryDescriptionInput"
                        rows="5"
                        placeholder="Add context about this image"
                    >${escapeGalleryModalHtml(
                        item.description
                    )}</textarea>
                </label>

                <label class="gallery-checkbox-field gallery-field-wide">
                    <input
                        id="galleryFeaturedInput"
                        type="checkbox"
                        ${
                            item.featured
                                ? "checked"
                                : ""
                        }
                    />

                    <span>
                        Feature this image
                    </span>
                </label>
            </div>

            <div class="gallery-modal-actions">
                <button
                    class="text-button"
                    type="button"
                    data-close-gallery-modal
                >
                    Cancel
                </button>

                <button
                    class="primary-button"
                    type="button"
                    id="saveGalleryButton"
                >
                    ${
                        isEditing
                            ? "Save changes"
                            : "Add image"
                    }
                </button>
            </div>
        </section>
    `;

    document.getElementById(
        "galleryCategoryInput"
    ).value =
        item.category || "event";

    document.getElementById(
        "galleryVisibilityInput"
    ).value =
        item.visibility || "public";

    document.getElementById(
        "galleryImageSourceInput"
    ).value =
        item.imageSource || "file";

    updateGallerySourceFields();

    modal
        .querySelectorAll(
            "[data-close-gallery-modal]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                closeGalleryModal
            );
        });

    document
        .getElementById(
            "galleryImageSourceInput"
        )
        ?.addEventListener(
            "change",
            updateGallerySourceFields
        );

    document
        .getElementById(
            "saveGalleryButton"
        )
        ?.addEventListener(
            "click",
            saveGalleryModal
        );
}

function updateGallerySourceFields() {
    const source =
        document.getElementById(
            "galleryImageSourceInput"
        )?.value || "file";

    const fileFields =
        document.getElementById(
            "galleryFileSourceFields"
        );

    const urlFields =
        document.getElementById(
            "galleryUrlSourceFields"
        );

    if (fileFields) {
        fileFields.hidden =
            source !== "file";
    }

    if (urlFields) {
        urlFields.hidden =
            source !== "url";
    }
}

function openGalleryModal(
    galleryId = null
) {
    activeGalleryItemId =
        galleryId;

    const galleryItem =
        galleryId &&
        window.HarmoniaGallery
            ? window.HarmoniaGallery.getById(
                galleryId
            )
            : null;

    renderGalleryModal(
        galleryItem
    );

    const modal =
        getGalleryModalElement();

    if (!modal) {
        return;
    }

    modal.hidden =
        false;

    document.body.classList.add(
        "gallery-modal-open"
    );

    document.addEventListener(
        "keydown",
        handleGalleryModalKeydown
    );

    window.setTimeout(
        () =>
            document
                .getElementById(
                    "galleryTitleInput"
                )
                ?.focus(),
        0
    );
}

function closeGalleryModal() {
    const modal =
        getGalleryModalElement();

    if (modal) {
        modal.hidden =
            true;
    }

    activeGalleryItemId =
        null;

    document.body.classList.remove(
        "gallery-modal-open"
    );

    document.removeEventListener(
        "keydown",
        handleGalleryModalKeydown
    );
}

function handleGalleryModalKeydown(
    event
) {
    if (event.key === "Escape") {
        closeGalleryModal();
    }
}

function collectGalleryModalData() {
    const imageSource =
        document.getElementById(
            "galleryImageSourceInput"
        )?.value || "file";

    return {
        title:
            document
                .getElementById(
                    "galleryTitleInput"
                )
                ?.value.trim() || "",

        description:
            document
                .getElementById(
                    "galleryDescriptionInput"
                )
                ?.value.trim() || "",

        category:
            document
                .getElementById(
                    "galleryCategoryInput"
                )
                ?.value || "event",

        imageSource,

        fileId:
            imageSource === "file"
                ? document
                    .getElementById(
                        "galleryFileIdInput"
                    )
                    ?.value || ""
                : "",

        imageUrl:
            imageSource === "url"
                ? document
                    .getElementById(
                        "galleryImageUrlInput"
                    )
                    ?.value.trim() || ""
                : "",

        altText:
            document
                .getElementById(
                    "galleryAltTextInput"
                )
                ?.value.trim() || "",

        photographer:
            document
                .getElementById(
                    "galleryPhotographerInput"
                )
                ?.value.trim() || "",

        eventName:
            document
                .getElementById(
                    "galleryEventNameInput"
                )
                ?.value.trim() || "",

        location:
            document
                .getElementById(
                    "galleryLocationInput"
                )
                ?.value.trim() || "",

        dateTaken:
            document
                .getElementById(
                    "galleryDateTakenInput"
                )
                ?.value || "",

        visibility:
            document
                .getElementById(
                    "galleryVisibilityInput"
                )
                ?.value || "public",

        featured:
            Boolean(
                document.getElementById(
                    "galleryFeaturedInput"
                )?.checked
            )
    };
}

function validateGalleryModalData(
    galleryData
) {
    if (!galleryData.title) {
        window.alert(
            "Please enter an image title."
        );

        return false;
    }

    if (
        galleryData.imageSource === "file" &&
        !galleryData.fileId
    ) {
        window.alert(
            "Choose an image from Harmonia Files. Upload one in the Files tab first if the list is empty."
        );

        return false;
    }

    if (
        galleryData.imageSource === "url" &&
        !galleryData.imageUrl
    ) {
        window.alert(
            "Please enter an external image URL."
        );

        return false;
    }

    return true;
}

function saveGalleryModal() {
    if (
        !window.HarmoniaGallery
    ) {
        console.error(
            "HarmoniaGallery is unavailable."
        );

        return;
    }

    const galleryData =
        collectGalleryModalData();

    if (
        !validateGalleryModalData(
            galleryData
        )
    ) {
        return;
    }

    if (activeGalleryItemId) {
        window.HarmoniaGallery.update(
            activeGalleryItemId,
            galleryData
        );
    } else {
        window.HarmoniaGallery.create(
            galleryData
        );
    }

    closeGalleryModal();
}

window.openGalleryModal =
    openGalleryModal;

window.closeGalleryModal =
    closeGalleryModal;

console.log(
    "✅ Gallery Modal Loaded"
);