const HARMONIA_INTEGRATION_TARGETS = {
    project: [
        "data-project-edit",
        "data-project-open"
    ],
    work: [
        "data-work-open"
    ],
    event: [
        "data-event-edit"
    ],
    note: [
        "data-note-edit"
    ],
    file: [
        "data-file-edit"
    ],
    gallery: [
        "data-gallery-edit"
    ],
    partner: [
        "data-partner-edit"
    ],
    message: [
        "data-message-edit"
    ],
    finance: [
        "data-finance-edit"
    ],
    analytics: [
        "data-analytics-edit"
    ],
    marketing: [
        "data-marketing-edit"
    ]
};

function getIntegrationRecordFromElement(
    element
) {
    for (
        const [
            type,
            attributes
        ] of Object.entries(
            HARMONIA_INTEGRATION_TARGETS
        )
    ) {
        for (const attribute of attributes) {
            if (
                element.hasAttribute(
                    attribute
                )
            ) {
                return {
                    type,
                    id:
                        element.getAttribute(
                            attribute
                        )
                };
            }
        }
    }

    return null;
}

function findConnectionActionContainer(
    trigger
) {
    return (
        trigger.closest(
            [
                ".project-card-actions",
                ".work-card-actions",
                ".event-card-actions",
                ".note-card-actions",
                ".file-card-actions",
                ".gallery-card-actions",
                ".partner-card-actions",
                ".message-card-actions",
                ".finance-card-actions",
                ".analytics-card-actions",
                ".marketing-card-actions",
                ".work-list-item-meta"
            ].join(",")
        ) ||
        trigger.parentElement
    );
}

function createConnectionButton(
    type,
    id
) {
    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

    button.className =
        "text-button harmonia-connect-button";

    button.dataset
        .relationshipSourceType =
        type;

    button.dataset
        .relationshipSourceId =
        id;

    button.textContent =
        "Connections";

    button.title =
        "View and add connected records";

    return button;
}

function injectConnectionButtons() {
    Object.values(
        HARMONIA_INTEGRATION_TARGETS
    )
        .flat()
        .forEach(attribute => {
            document
                .querySelectorAll(
                    `[${attribute}]`
                )
                .forEach(trigger => {
                    const record =
                        getIntegrationRecordFromElement(
                            trigger
                        );

                    if (
                        !record ||
                        !record.id
                    ) {
                        return;
                    }

                    const container =
                        findConnectionActionContainer(
                            trigger
                        );

                    if (!container) {
                        return;
                    }

                    const selector =
                        `[data-relationship-source-type="${record.type}"]` +
                        `[data-relationship-source-id="${CSS.escape(
                            String(record.id)
                        )}"]`;

                    if (
                        container.querySelector(
                            selector
                        )
                    ) {
                        return;
                    }

                    container.appendChild(
                        createConnectionButton(
                            record.type,
                            record.id
                        )
                    );
                });
        });
}

function attachGlobalConnectionListener() {
    document.addEventListener(
        "click",
        event => {
            const button =
                event.target.closest(
                    "[data-relationship-source-type]"
                );

            if (!button) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            window.openRelationshipDrawer?.(
                button.dataset
                    .relationshipSourceType,
                button.dataset
                    .relationshipSourceId
            );
        }
    );
}

function observeHarmoniaInterface() {
    let queued = false;

    const observer =
        new MutationObserver(() => {
            if (queued) {
                return;
            }

            queued = true;

            window.requestAnimationFrame(
                () => {
                    queued = false;
                    injectConnectionButtons();
                }
            );
        });

    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );
}

function initializeHarmoniaIntegration() {
    attachGlobalConnectionListener();
    injectConnectionButtons();
    observeHarmoniaInterface();

    document.addEventListener(
        "harmonia:relationships-updated",
        injectConnectionButtons
    );
}

if (
    document.readyState === "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeHarmoniaIntegration
    );
} else {
    initializeHarmoniaIntegration();
}

window.refreshHarmoniaConnections =
    injectConnectionButtons;

console.log(
    "✅ Harmonia Integration Bootstrap Loaded"
);