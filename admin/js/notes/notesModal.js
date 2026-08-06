console.log("✅ Notes Modal Loaded");

let editingNoteId = null;
let activeNoteProjectId = null;

function getNoteModalElements() {
    return {
        modal:
            document.getElementById("noteModal"),

        title:
            document.getElementById("noteModalTitle"),

        noteTitleInput:
            document.getElementById("noteTitleInput"),

        noteCategoryInput:
            document.getElementById("noteCategoryInput"),

        notePinnedInput:
            document.getElementById("notePinnedInput"),

        noteContentInput:
            document.getElementById("noteContentInput"),

        saveButton:
            document.getElementById("saveNoteButton")
    };
}

function resetNoteForm() {
    const elements = getNoteModalElements();

    editingNoteId = null;
    activeNoteProjectId = null;

    if (elements.title) {
        elements.title.textContent = "New Note";
    }

    if (elements.noteTitleInput) {
        elements.noteTitleInput.value = "";
    }

    if (elements.noteCategoryInput) {
        elements.noteCategoryInput.value = "general";
    }

    if (elements.notePinnedInput) {
        elements.notePinnedInput.checked = false;
    }

    if (elements.noteContentInput) {
        elements.noteContentInput.value = "";
    }
}

function openNoteModal(
    noteData = null,
    options = {}
) {
    const elements = getNoteModalElements();

    if (!elements.modal) {
        console.error(
            "Note modal element was not found."
        );
        return;
    }

    resetNoteForm();

    activeNoteProjectId =
        options.projectId ?? null;

    console.log(
        "Note modal received project ID:",
        activeNoteProjectId
    );

    if (noteData) {
        editingNoteId =
            noteData.id || null;

        activeNoteProjectId =
            noteData.projectId ?? null;

        if (elements.title) {
            elements.title.textContent =
                "Edit Note";
        }

        if (elements.noteTitleInput) {
            elements.noteTitleInput.value =
                noteData.title || "";
        }

        if (elements.noteCategoryInput) {
            elements.noteCategoryInput.value =
                noteData.category || "general";
        }

        if (elements.notePinnedInput) {
            elements.notePinnedInput.checked =
                Boolean(noteData.pinned);
        }

        if (elements.noteContentInput) {
            elements.noteContentInput.value =
                noteData.content || "";
        }
    }

    elements.modal.hidden = false;

    requestAnimationFrame(() => {
        elements.noteTitleInput?.focus();
    });
}

function closeNoteModal() {
    const elements = getNoteModalElements();

    if (!elements.modal) {
        return;
    }

    elements.modal.hidden = true;

    editingNoteId = null;
    activeNoteProjectId = null;
}

function buildNoteData() {
    const elements = getNoteModalElements();

    const title =
        elements.noteTitleInput?.value.trim() || "";

    if (!title) {
        alert("Please enter a note title.");
        elements.noteTitleInput?.focus();
        return null;
    }

    return {
        projectId:
            activeNoteProjectId ?? null,

        title,

        category:
            elements.noteCategoryInput?.value ||
            "general",

        pinned:
            Boolean(
                elements.notePinnedInput?.checked
            ),

        content:
            elements.noteContentInput?.value.trim() ||
            ""
    };
}

async function saveNoteFromModal() {
    const noteData = buildNoteData();

    if (!noteData) {
        return;
    }

    try {
        if (
            editingNoteId &&
            window.HarmoniaNotes &&
            typeof window.HarmoniaNotes.update ===
                "function"
        ) {
            await window.HarmoniaNotes.update(
                editingNoteId,
                noteData
            );
        } else if (
            window.HarmoniaNotes &&
            typeof window.HarmoniaNotes.add ===
                "function"
        ) {
            await window.HarmoniaNotes.add(
                noteData
            );
        } else {
            console.error(
                "No note save function is available."
            );

            alert(
                "The notes manager is not connected yet."
            );

            return;
        }

        closeNoteModal();

        document.dispatchEvent(
            new CustomEvent(
                "harmonia:notes-updated"
            )
        );
    } catch (error) {
        console.error(
            "Could not save note:",
            error
        );

        alert(
            "The note could not be saved."
        );
    }
}

function initializeNoteModal() {
    const elements = getNoteModalElements();

    if (!elements.modal) {
        console.warn(
            "Note modal was not found."
        );
        return;
    }

    document
        .querySelectorAll(
            "[data-close-note-modal]"
        )
        .forEach(button => {
            if (
                button.dataset
                    .noteModalListenerAttached ===
                "true"
            ) {
                return;
            }

            button.addEventListener(
                "click",
                closeNoteModal
            );

            button.dataset
                .noteModalListenerAttached =
                "true";
        });

    if (
        elements.saveButton &&
        elements.saveButton.dataset
            .noteModalListenerAttached !==
            "true"
    ) {
        elements.saveButton.addEventListener(
            "click",
            saveNoteFromModal
        );

        elements.saveButton.dataset
            .noteModalListenerAttached =
            "true";
    }

    if (
        document.body.dataset
            .noteModalKeyboardListenerAttached !==
        "true"
    ) {
        document.addEventListener(
            "keydown",
            event => {
                const currentElements =
                    getNoteModalElements();

                if (
                    event.key === "Escape" &&
                    currentElements.modal &&
                    currentElements.modal.hidden ===
                        false
                ) {
                    closeNoteModal();
                }
            }
        );

        document.body.dataset
            .noteModalKeyboardListenerAttached =
            "true";
    }
}

window.openNoteModal =
    openNoteModal;

window.closeNoteModal =
    closeNoteModal;

window.initializeNoteModal =
    initializeNoteModal;

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeNoteModal,
        { once: true }
    );
} else {
    initializeNoteModal();
}