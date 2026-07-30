let activeMarketingSearch = "";
let activeMarketingTypeFilter = "all";
let activeMarketingStatusFilter = "all";

const MARKETING_PIPELINE_STATUSES = [
    "idea",
    "draft",
    "review",
    "approved",
    "published"
];

function escapeMarketingHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatMarketingValue(value) {
    return String(value || "")
        .replaceAll("-", " ")
        .replace(/\b\w/g, character =>
            character.toUpperCase()
        );
}

function getFilteredMarketingItems(items) {
    const search =
        activeMarketingSearch
            .trim()
            .toLowerCase();

    return items.filter((item) => {
        const searchableText =
            Object.values(item)
                .join(" ")
                .toLowerCase();

        const matchesSearch =
            !search ||
            searchableText.includes(
                search
            );

        const matchesType =
            activeMarketingTypeFilter ===
                "all" ||
            item.type ===
                activeMarketingTypeFilter;

        const matchesStatus =
            activeMarketingStatusFilter ===
                "all" ||
            item.status ===
                activeMarketingStatusFilter;

        return (
            matchesSearch &&
            matchesType &&
            matchesStatus
        );
    });
}

function createMarketingCard(item) {
    const card =
        document.createElement(
            "article"
        );

    card.className =
        "marketing-card";

    card.innerHTML = `
      <div class="marketing-card-main">
        <div class="marketing-card-topline">
            <span class="marketing-status-badge status-${escapeMarketingHtml(
                item.status || "idea"
            )}">
                ${escapeMarketingHtml(
                    formatMarketingValue(
                        item.status || "idea"
                    )
                )}
            </span>

            <span class="marketing-type-label">
                ${escapeMarketingHtml(
                    formatMarketingValue(
                        item.type || "campaign"
                    )
                )}
            </span>
        </div>

        <h3>
            ${escapeMarketingHtml(
                item.title || "Untitled"
            )}
        </h3>

        <p>
            ${escapeMarketingHtml(
                item.audience ||
                item.objective ||
                "No additional details."
            )}
        </p>
      </div>

      <div class="marketing-card-actions">
        <button
            class="text-button"
            type="button"
            data-marketing-edit="${escapeMarketingHtml(
                item.id
            )}"
        >
            Edit
        </button>

        <button
            class="text-button danger"
            type="button"
            data-marketing-delete="${escapeMarketingHtml(
                item.id
            )}"
        >
            Delete
        </button>
      </div>
    `;

    return card;
}

function updateMarketingPipelineState() {
    document
        .querySelectorAll(
            ".marketing-pipeline [data-marketing-stage]"
        )
        .forEach((stage) => {
            const isActive =
                stage.dataset
                    .marketingStage ===
                activeMarketingStatusFilter;

            stage.classList.toggle(
                "active",
                isActive
            );

            stage.setAttribute(
                "aria-pressed",
                String(isActive)
            );
        });
}

function renderMarketing() {
    const list =
        document.getElementById(
            "marketingList"
        );

    const emptyState =
        document.getElementById(
            "marketingEmptyState"
        );

    if (
        !list ||
        !window.HarmoniaMarketing
    ) {
        return;
    }

    const allItems =
        window.HarmoniaMarketing.getAll();

    const filteredItems =
        getFilteredMarketingItems(
            allItems
        );

    list.innerHTML =
        "";

    filteredItems.forEach(
        (item) =>
            list.appendChild(
                createMarketingCard(
                    item
                )
            )
    );

    if (emptyState) {
        emptyState.hidden =
            filteredItems.length > 0;
    }

    updateMarketingPipelineState();
}

function initializeMarketingPipeline() {
    const pipeline =
        document.querySelector(
            ".marketing-pipeline"
        );

    if (
        !pipeline ||
        pipeline.dataset
            .marketingPipelineReady ===
            "true"
    ) {
        return;
    }

    const originalStages =
        Array.from(
            pipeline.querySelectorAll(
                "span"
            )
        );

    originalStages.forEach(
        (stage, index) => {
            const status =
                MARKETING_PIPELINE_STATUSES[
                    index
                ];

            if (!status) {
                return;
            }

            stage.dataset
                .marketingStage =
                status;

            stage.setAttribute(
                "role",
                "button"
            );

            stage.setAttribute(
                "tabindex",
                "0"
            );

            stage.setAttribute(
                "aria-pressed",
                "false"
            );

            stage.title =
                `Filter by ${formatMarketingValue(
                    status
                )}`;

            const activateStage = () => {
                activeMarketingStatusFilter =
                    activeMarketingStatusFilter ===
                    status
                        ? "all"
                        : status;

                const statusFilter =
                    document.getElementById(
                        "marketingStatusFilter"
                    );

                if (statusFilter) {
                    statusFilter.value =
                        activeMarketingStatusFilter;
                }

                renderMarketing();
            };

            stage.addEventListener(
                "click",
                activateStage
            );

            stage.addEventListener(
                "keydown",
                (event) => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();
                        activateStage();
                    }
                }
            );
        }
    );

    pipeline.dataset
        .marketingPipelineReady =
        "true";
}

function initializeMarketingFilters() {
    const searchInput =
        document.getElementById(
            "marketingSearchInput"
        );

    const typeFilter =
        document.getElementById(
            "marketingTypeFilter"
        );

    const statusFilter =
        document.getElementById(
            "marketingStatusFilter"
        );

    if (
        searchInput &&
        searchInput.dataset
            .marketingListenerAttached !==
            "true"
    ) {
        searchInput.addEventListener(
            "input",
            () => {
                activeMarketingSearch =
                    searchInput.value;

                renderMarketing();
            }
        );

        searchInput.dataset
            .marketingListenerAttached =
            "true";
    }

    if (
        typeFilter &&
        typeFilter.dataset
            .marketingListenerAttached !==
            "true"
    ) {
        typeFilter.addEventListener(
            "change",
            () => {
                activeMarketingTypeFilter =
                    typeFilter.value;

                renderMarketing();
            }
        );

        typeFilter.dataset
            .marketingListenerAttached =
            "true";
    }

    if (
        statusFilter &&
        statusFilter.dataset
            .marketingListenerAttached !==
            "true"
    ) {
        statusFilter.addEventListener(
            "change",
            () => {
                activeMarketingStatusFilter =
                    statusFilter.value;

                renderMarketing();
            }
        );

        statusFilter.dataset
            .marketingListenerAttached =
            "true";
    }
}

function initializeNewMarketingButton() {
    const button =
        document.getElementById(
            "newMarketingButton"
        );

    if (
        !button ||
        button.dataset
            .listenerAttached ===
            "true"
    ) {
        return;
    }

    button.addEventListener(
        "click",
        () =>
            window.openMarketingModal?.()
    );

    button.dataset
        .listenerAttached =
        "true";
}

function handleMarketingPageClick(event) {
    const editButton =
        event.target.closest(
            "[data-marketing-edit]"
        );

    if (editButton) {
        window.openMarketingModal?.(
            editButton.dataset
                .marketingEdit
        );

        return;
    }

    const deleteButton =
        event.target.closest(
            "[data-marketing-delete]"
        );

    if (!deleteButton) {
        return;
    }

    const itemId =
        deleteButton.dataset
            .marketingDelete;

    const item =
        window.HarmoniaMarketing
            ?.getById(itemId);

    if (
        item &&
        window.confirm(
            `Delete "${item.title || "this item"}"?`
        )
    ) {
        window.HarmoniaMarketing.delete(
            itemId
        );
    }
}

function initializeMarketingPage() {
    initializeNewMarketingButton();
    initializeMarketingFilters();
    initializeMarketingPipeline();
    renderMarketing();
}

document.addEventListener(
    "click",
    handleMarketingPageClick
);

document.addEventListener(
    "harmonia:marketing-updated",
    renderMarketing
);

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeMarketingPage
    );
} else {
    initializeMarketingPage();
}

window.renderMarketing =
    renderMarketing;

console.log(
    "✅ Marketing Page Loaded"
);