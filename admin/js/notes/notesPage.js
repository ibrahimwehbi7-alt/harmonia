console.log("✅ Notes Page Loaded");

let activeNoteSearch = "";
let activeNoteCategoryFilter = "all";
let activeNotePinnedFilter = "all";

function formatNoteCategory(category) {
    const labels = {
        general: "General",
        meeting: "Meeting",
        idea: "Idea",
        research: "Research",
        decision: "Decision",
        journal: "Journal",
        strategy: "Strategy",
        reference: "Reference"
    };

    return labels[category] || "General";
}

function formatNoteUpdatedDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}

function sortNotes(notes) {
    return [...notes].sort(
        (firstNote, secondNote) => {
            if (
                Boolean(firstNote.pinned) !==
                Boolean(secondNote.pinned)
            ) {
                return firstNote.pinned ? -1 : 1;
            }

            const firstDate =
                new Date(
                    firstNote.updatedAt ||
                    firstNote.createdAt ||
                    0
                );

            const secondDate =
                new Date(
                    secondNote.updatedAt ||
                    secondNote.createdAt ||
                    0
                );

            return secondDate - firstDate;
        }
    );
}

function filterNotes(notes) {
    return notes.filter(note => {
        const searchText =
            activeNoteSearch.toLowerCase();

        const title =
            note.title || "";

        const content =
            note.content || "";

        const matchesSearch =
            !searchText ||
            title
                .toLowerCase()
                .includes(searchText) ||
            content
                .toLowerCase()
                .includes(searchText);

        const matchesCategory =
            activeNoteCategoryFilter === "all" ||
            note.category ===
                activeNoteCategoryFilter;

        let matchesPinned = true;

        if (
            activeNotePinnedFilter ===
            "pinned"
        ) {
            matchesPinned =
                Boolean(note.pinned);
        }

        if (
            activeNotePinnedFilter ===
            "unpinned"
        ) {
            matchesPinned =
                !Boolean(note.pinned);
        }

        return (
            matchesSearch &&
            matchesCategory &&
            matchesPinned
        );
    });
}

function createNoteCard(note) {
    const card =
        document.createElement("article");

    card.className = "note-card";
    card.dataset.noteId = note.id;

    const heading =
        document.createElement("div");

    heading.className =
        "note-card-heading";

    const titleArea =
        document.createElement("div");

    titleArea.className =
        "note-card-title-area";

    const title =
        document.createElement("h3");

    title.textContent =
        note.title || "Untitled Note";

    const metadata =
        document.createElement("div");

    metadata.className =
        "note-card-metadata";

    const category =
        document.createElement("span");

    category.className =
        "note-category-badge";

    category.textContent =
        formatNoteCategory(
            note.category
        );

    metadata.appendChild(category);

    if (note.pinned) {
        const pinned =
            document.createElement("span");

        pinned.className =
            "note-pinned-badge";

        pinned.textContent = "Pinned";

        metadata.appendChild(pinned);
    }

    titleArea.appendChild(title);
    titleArea.appendChild(metadata);

    const updatedDate =
        document.createElement("span");

    updatedDate.className =
        "note-card-date";

    const formattedDate =
        formatNoteUpdatedDate(
            note.updatedAt ||
            note.createdAt
        );

    updatedDate.textContent =
        formattedDate
            ? `Updated ${formattedDate}`
            : "";

    heading.appendChild(titleArea);
    heading.appendChild(updatedDate);

    const content =
        document.createElement("p");

    content.className =
        "note-card-content";

    content.textContent =
        note.content ||
        "No content has been added.";

    const projectLabel =
        document.createElement("p");

    projectLabel.className =
        "note-card-project";

    projectLabel.textContent =
        note.projectId
            ? "Connected to a project"
            : "General note";

    const actions =
        document.createElement("div");

    actions.className =
        "note-card-actions";

    const editButton =
        document.createElement("button");

    editButton.type = "button";
    editButton.className =
        "task-action-button";
    editButton.textContent = "Edit";

    editButton.addEventListener(
        "click",
        () => {
            if (
                typeof window.openNoteModal ===
                "function"
            ) {
                window.openNoteModal(note);
            } else {
                console.error(
                    "openNoteModal is unavailable."
                );
            }
        }
    );

    const deleteButton =
        document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className =
        "task-action-button danger";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener(
        "click",
        () => {
            const confirmed =
                window.confirm(
                    `Delete "${note.title}"?`
                );

            if (!confirmed) {
                return;
            }

            if (
                !window.HarmoniaNotes ||
                typeof window.HarmoniaNotes
                    .delete !== "function"
            ) {
                console.error(
                    "HarmoniaNotes.delete is unavailable."
                );

                return;
            }

            window.HarmoniaNotes.delete(
                note.id
            );

            document.dispatchEvent(
                new CustomEvent(
                    "harmonia:notes-updated"
                )
            );
        }
    );

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    card.appendChild(heading);
    card.appendChild(content);
    card.appendChild(projectLabel);
    card.appendChild(actions);

    return card;
}

function updateNoteSummary(notes) {
    const totalCount =
        document.getElementById(
            "noteTotalCount"
        );

    const pinnedCount =
        document.getElementById(
            "notePinnedCount"
        );

    const projectCount =
        document.getElementById(
            "noteProjectCount"
        );

    if (totalCount) {
        totalCount.textContent =
            String(notes.length);
    }

    if (pinnedCount) {
        pinnedCount.textContent =
            String(
                notes.filter(note => {
                    return Boolean(
                        note.pinned
                    );
                }).length
            );
    }

    if (projectCount) {
        projectCount.textContent =
            String(
                notes.filter(note => {
                    return (
                        note.projectId !==
                            null &&
                        note.projectId !==
                            undefined
                    );
                }).length
            );
    }
}

function renderNotes() {
    const notesList =
        document.getElementById(
            "notesList"
        );

    const emptyState =
        document.getElementById(
            "notesEmptyState"
        );

    if (!notesList) {
        console.error(
            "The #notesList element was not found."
        );

        return;
    }

    if (
        !window.HarmoniaNotes ||
        typeof window.HarmoniaNotes
            .getAll !== "function"
    ) {
        console.error(
            "HarmoniaNotes.getAll is unavailable."
        );

        return;
    }

    const allNotes =
        window.HarmoniaNotes.getAll();

    const visibleNotes =
        sortNotes(
            filterNotes(allNotes)
        );

    notesList.innerHTML = "";

    visibleNotes.forEach(note => {
        notesList.appendChild(
            createNoteCard(note)
        );
    });

    if (emptyState) {
        emptyState.hidden =
            visibleNotes.length > 0;
    }

    updateNoteSummary(allNotes);
}

function initializeNoteFilters() {
    const searchInput =
        document.getElementById(
            "noteSearchInput"
        );

    const categoryFilter =
        document.getElementById(
            "noteCategoryFilter"
        );

    const pinnedFilter =
        document.getElementById(
            "notePinnedFilter"
        );

    if (
        searchInput &&
        searchInput.dataset
            .noteListenerAttached !==
            "true"
    ) {
        searchInput.addEventListener(
            "input",
            () => {
                activeNoteSearch =
                    searchInput.value.trim();

                renderNotes();
            }
        );

        searchInput.dataset
            .noteListenerAttached =
            "true";
    }

    if (
        categoryFilter &&
        categoryFilter.dataset
            .noteListenerAttached !==
            "true"
    ) {
        categoryFilter.addEventListener(
            "change",
            () => {
                activeNoteCategoryFilter =
                    categoryFilter.value;

                renderNotes();
            }
        );

        categoryFilter.dataset
            .noteListenerAttached =
            "true";
    }

    if (
        pinnedFilter &&
        pinnedFilter.dataset
            .noteListenerAttached !==
            "true"
    ) {
        pinnedFilter.addEventListener(
            "change",
            () => {
                activeNotePinnedFilter =
                    pinnedFilter.value;

                renderNotes();
            }
        );

        pinnedFilter.dataset
            .noteListenerAttached =
            "true";
    }
}

function initializeNewNoteButton() {
    const newNoteButton =
        document.getElementById(
            "newNoteButton"
        );

    if (!newNoteButton) {
        console.error(
            "The New Note button was not found."
        );

        return;
    }

    if (
        newNoteButton.dataset
            .noteListenerAttached ===
        "true"
    ) {
        return;
    }

    newNoteButton.addEventListener(
        "click",
        () => {
            if (
                typeof window.openNoteModal ===
                "function"
            ) {
                window.openNoteModal();
            } else {
                console.error(
                    "openNoteModal is unavailable."
                );
            }
        }
    );

    newNoteButton.dataset
        .noteListenerAttached =
        "true";
}

function initializeNotesPage() {
    console.log(
        "Initializing Notes Page"
    );

    if (
        window.HarmoniaNotes &&
        typeof window.HarmoniaNotes.load ===
            "function"
    ) {
        window.HarmoniaNotes.load();
    } else {
        console.error(
            "HarmoniaNotes.load is unavailable."
        );
    }

    initializeNewNoteButton();
    initializeNoteFilters();
    renderNotes();

    console.log(
        "✅ Notes Page initialization complete"
    );
}

document.addEventListener(
    "harmonia:notes-updated",
    () => {
        renderNotes();
    }
);

window.renderNotes =
    renderNotes;

window.renderNotesPage =
    renderNotes;

window.initializeNotesPage =
    initializeNotesPage;

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeNotesPage,
        { once: true }
    );
} else {
    initializeNotesPage();
}

console.log(
    "✅ Notes Page script ready"
);