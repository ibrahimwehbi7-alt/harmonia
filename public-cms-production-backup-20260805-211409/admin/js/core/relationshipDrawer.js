let activeRelationshipSource = null;

function escapeRelationshipHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getRelationshipDrawer() {
    return document.getElementById(
        "relationshipDrawer"
    );
}

function ensureRelationshipDrawer() {
    let drawer =
        getRelationshipDrawer();

    if (drawer) {
        return drawer;
    }

    drawer =
        document.createElement("div");

    drawer.id =
        "relationshipDrawer";

    drawer.className =
        "relationship-drawer";

    drawer.hidden =
        true;

    document.body.appendChild(
        drawer
    );

    return drawer;
}

function getRelationshipTypeOptions(
    sourceType
) {
    return window.HarmoniaEntities
        .getTypes()
        .filter(type => type !== sourceType)
        .map(type => {
            const definition =
                window.HarmoniaEntities
                    .getDefinition(type);

            return `
                <option value="${escapeRelationshipHtml(
                    type
                )}">
                    ${escapeRelationshipHtml(
                        definition.plural
                    )}
                </option>
            `;
        })
        .join("");
}

function getRelationshipTargetOptions(
    targetType
) {
    const entities =
        window.HarmoniaEntities.getAll(
            targetType
        );

    if (!entities.length) {
        return `
            <option value="">
                No records available
            </option>
        `;
    }

    return [
        `
            <option value="">
                Choose a record
            </option>
        `,
        ...entities.map(entity => `
            <option value="${escapeRelationshipHtml(
                entity.id
            )}">
                ${escapeRelationshipHtml(
                    entity.title
                )}
            </option>
        `)
    ].join("");
}

function formatRelationshipType(type) {
    return (
        window.HarmoniaEntities
            .getDefinition(type)
            ?.label || type
    );
}

function renderExistingRelationships() {
    const list =
        document.getElementById(
            "relationshipExistingList"
        );

    const empty =
        document.getElementById(
            "relationshipEmptyState"
        );

    if (
        !list ||
        !activeRelationshipSource
    ) {
        return;
    }

    const relationships =
        window.HarmoniaRelationships
            .getFor(
                activeRelationshipSource.type,
                activeRelationshipSource.id
            );

    list.innerHTML = "";

    relationships.forEach(
        relationship => {
            const endpoint =
                window.HarmoniaRelationships
                    .getConnectedEndpoint(
                        relationship,
                        activeRelationshipSource.type,
                        activeRelationshipSource.id
                    );

            const entity =
                window.HarmoniaEntities
                    .getById(
                        endpoint.type,
                        endpoint.id
                    );

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "relationship-card";

            card.innerHTML = `
                <button
                    class="relationship-card-main"
                    type="button"
                    data-relationship-open-type="${escapeRelationshipHtml(
                        endpoint.type
                    )}"
                    data-relationship-open-id="${escapeRelationshipHtml(
                        endpoint.id
                    )}"
                >
                    <span class="relationship-type-label">
                        ${escapeRelationshipHtml(
                            formatRelationshipType(
                                endpoint.type
                            )
                        )}
                    </span>

                    <strong>
                        ${escapeRelationshipHtml(
                            entity?.title ||
                                "Missing record"
                        )}
                    </strong>

                    <span class="relationship-label">
                        ${escapeRelationshipHtml(
                            relationship.label
                        )}
                    </span>

                    ${
                        relationship.notes
                            ? `
                                <p>
                                    ${escapeRelationshipHtml(
                                        relationship.notes
                                    )}
                                </p>
                            `
                            : ""
                    }
                </button>

                <button
                    class="relationship-remove-button"
                    type="button"
                    data-relationship-delete="${escapeRelationshipHtml(
                        relationship.id
                    )}"
                    aria-label="Remove connection"
                    title="Remove connection"
                >
                    ×
                </button>
            `;

            list.appendChild(card);
        }
    );

    if (empty) {
        empty.hidden =
            relationships.length > 0;
    }
}

function renderRelationshipDrawer() {
    const drawer =
        ensureRelationshipDrawer();

    if (!activeRelationshipSource) {
        drawer.hidden = true;
        return;
    }

    const sourceEntity =
        window.HarmoniaEntities
            .getById(
                activeRelationshipSource.type,
                activeRelationshipSource.id
            );

    const firstTargetType =
        window.HarmoniaEntities
            .getTypes()
            .find(
                type =>
                    type !==
                    activeRelationshipSource.type
            );

    drawer.innerHTML = `
        <div
            class="relationship-drawer-backdrop"
            data-close-relationship-drawer
        ></div>

        <aside
            class="relationship-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="relationshipDrawerTitle"
        >
            <header class="relationship-drawer-header">
                <div>
                    <p class="panel-label">
                        Connected Records
                    </p>

                    <h2 id="relationshipDrawerTitle">
                        ${escapeRelationshipHtml(
                            sourceEntity?.title ||
                                "Untitled record"
                        )}
                    </h2>

                    <p>
                        ${escapeRelationshipHtml(
                            formatRelationshipType(
                                activeRelationshipSource.type
                            )
                        )}
                    </p>
                </div>

                <button
                    class="relationship-drawer-close"
                    type="button"
                    data-close-relationship-drawer
                    aria-label="Close"
                >
                    ×
                </button>
            </header>

            <section class="relationship-add-section">
                <div class="relationship-section-heading">
                    <div>
                        <p class="panel-label">
                            New Connection
                        </p>

                        <h3>
                            Link another record
                        </h3>
                    </div>
                </div>

                <div class="relationship-form-grid">
                    <label>
                        <span>Record type</span>

                        <select id="relationshipTargetType">
                            ${getRelationshipTypeOptions(
                                activeRelationshipSource.type
                            )}
                        </select>
                    </label>

                    <label>
                        <span>Record</span>

                        <select id="relationshipTargetId">
                            ${getRelationshipTargetOptions(
                                firstTargetType
                            )}
                        </select>
                    </label>

                    <label>
                        <span>Connection</span>

                        <select id="relationshipLabel">
                            <option value="Connected to">
                                Connected to
                            </option>

                            <option value="Supports">
                                Supports
                            </option>

                            <option value="Required for">
                                Required for
                            </option>

                            <option value="Created for">
                                Created for
                            </option>

                            <option value="Follow-up for">
                                Follow-up for
                            </option>

                            <option value="Funded by">
                                Funded by
                            </option>

                            <option value="Promotes">
                                Promotes
                            </option>

                            <option value="Documents">
                                Documents
                            </option>
                        </select>
                    </label>

                    <label class="relationship-field-wide">
                        <span>Notes</span>

                        <textarea
                            id="relationshipNotes"
                            rows="3"
                            placeholder="Optional context about this connection"
                        ></textarea>
                    </label>
                </div>

                <button
                    class="primary-button relationship-save-button"
                    type="button"
                    id="saveRelationshipButton"
                >
                    Add Connection
                </button>
            </section>

            <section class="relationship-existing-section">
                <div class="relationship-section-heading">
                    <div>
                        <p class="panel-label">
                            Network
                        </p>

                        <h3>
                            Existing connections
                        </h3>
                    </div>
                </div>

                <div
                    class="relationship-existing-list"
                    id="relationshipExistingList"
                ></div>

                <div
                    class="relationship-empty-state"
                    id="relationshipEmptyState"
                >
                    <h3>
                        Nothing connected yet
                    </h3>

                    <p>
                        Link this record to a project, task, event, file, partner, message, or another Harmonia record.
                    </p>
                </div>
            </section>
        </aside>
    `;

    drawer.hidden = false;
    document.body.classList.add(
        "relationship-drawer-open"
    );

    attachRelationshipDrawerListeners();
    renderExistingRelationships();
}

function attachRelationshipDrawerListeners() {
    document
        .querySelectorAll(
            "[data-close-relationship-drawer]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                closeRelationshipDrawer
            );
        });

    document
        .getElementById(
            "relationshipTargetType"
        )
        ?.addEventListener(
            "change",
            event => {
                const targetSelect =
                    document.getElementById(
                        "relationshipTargetId"
                    );

                if (targetSelect) {
                    targetSelect.innerHTML =
                        getRelationshipTargetOptions(
                            event.target.value
                        );
                }
            }
        );

    document
        .getElementById(
            "saveRelationshipButton"
        )
        ?.addEventListener(
            "click",
            saveRelationshipFromDrawer
        );

    document
        .getElementById(
            "relationshipExistingList"
        )
        ?.addEventListener(
            "click",
            handleRelationshipListClick
        );
}

function saveRelationshipFromDrawer() {
    if (!activeRelationshipSource) {
        return;
    }

    const targetType =
        document.getElementById(
            "relationshipTargetType"
        )?.value;

    const targetId =
        document.getElementById(
            "relationshipTargetId"
        )?.value;

    const label =
        document.getElementById(
            "relationshipLabel"
        )?.value || "Connected to";

    const notes =
        document.getElementById(
            "relationshipNotes"
        )?.value.trim() || "";

    if (!targetType || !targetId) {
        window.alert(
            "Choose a record to connect."
        );
        return;
    }

    try {
        window.HarmoniaRelationships
            .create({
                fromType:
                    activeRelationshipSource.type,
                fromId:
                    activeRelationshipSource.id,
                toType:
                    targetType,
                toId:
                    targetId,
                label,
                notes
            });

        document.getElementById(
            "relationshipNotes"
        ).value = "";

        renderExistingRelationships();
    } catch (error) {
        window.alert(
            error.message ||
                "Could not create the connection."
        );
    }
}

function handleRelationshipListClick(
    event
) {
    const deleteButton =
        event.target.closest(
            "[data-relationship-delete]"
        );

    if (deleteButton) {
        window.HarmoniaRelationships
            .delete(
                deleteButton.dataset
                    .relationshipDelete
            );

        renderExistingRelationships();
        return;
    }

    const openButton =
        event.target.closest(
            "[data-relationship-open-type]"
        );

    if (!openButton) {
        return;
    }

    closeRelationshipDrawer();

    window.HarmoniaEntities.navigate(
        openButton.dataset
            .relationshipOpenType,
        openButton.dataset
            .relationshipOpenId
    );
}

function openRelationshipDrawer(
    type,
    id
) {
    activeRelationshipSource = {
        type,
        id: String(id)
    };

    renderRelationshipDrawer();

    document.addEventListener(
        "keydown",
        handleRelationshipDrawerKeydown
    );
}

function closeRelationshipDrawer() {
    const drawer =
        getRelationshipDrawer();

    if (drawer) {
        drawer.hidden = true;
    }

    activeRelationshipSource = null;

    document.body.classList.remove(
        "relationship-drawer-open"
    );

    document.removeEventListener(
        "keydown",
        handleRelationshipDrawerKeydown
    );
}

function handleRelationshipDrawerKeydown(
    event
) {
    if (event.key === "Escape") {
        closeRelationshipDrawer();
    }
}

window.openRelationshipDrawer =
    openRelationshipDrawer;

window.closeRelationshipDrawer =
    closeRelationshipDrawer;

console.log(
    "✅ Relationship Drawer Loaded"
);