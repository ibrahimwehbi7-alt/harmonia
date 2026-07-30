console.log("✅ Notes Manager Loaded");

const NOTE_STORAGE_KEY = "harmonia.notes";

function createNoteId() {
    return `note-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
}

const defaultNotes = [];

window.HarmoniaNotes = {
    load() {
        const stored =
            localStorage.getItem(
                NOTE_STORAGE_KEY
            );

        if (!stored) {
            this.save(defaultNotes);
            return defaultNotes;
        }

        try {
            const parsed =
                JSON.parse(stored);

            if (!Array.isArray(parsed)) {
                throw new Error(
                    "Stored notes are not an array."
                );
            }

            const migratedNotes =
                parsed.map(note => ({
                    projectId: null,
                    title: "",
                    content: "",
                    category: "general",
                    pinned: false,
                    createdAt:
                        new Date().toISOString(),
                    updatedAt:
                        new Date().toISOString(),
                    ...note
                }));

            this.save(migratedNotes);

            return migratedNotes;
        } catch (error) {
            console.error(
                "Could not load notes:",
                error
            );

            this.save(defaultNotes);

            return defaultNotes;
        }
    },

    getAll() {
        try {
            const stored =
                localStorage.getItem(
                    NOTE_STORAGE_KEY
                );

            if (!stored) {
                return [];
            }

            const notes =
                JSON.parse(stored);

            return Array.isArray(notes)
                ? notes
                : [];
        } catch (error) {
            console.error(
                "Could not read notes:",
                error
            );

            return [];
        }
    },

    getById(noteId) {
        return (
            this.getAll().find(note => {
                return (
                    String(note.id) ===
                    String(noteId)
                );
            }) || null
        );
    },

    getByProjectId(projectId) {
        if (
            projectId === null ||
            projectId === undefined
        ) {
            return [];
        }

        return this.getAll().filter(note => {
            return (
                String(note.projectId) ===
                String(projectId)
            );
        });
    },

    save(notes) {
        localStorage.setItem(
            NOTE_STORAGE_KEY,
            JSON.stringify(notes)
        );
    },

    add(noteData) {
        const notes =
            this.getAll();

        const timestamp =
            new Date().toISOString();

        const newNote = {
            id: createNoteId(),

            projectId: null,

            title: "",
            content: "",
            category: "general",
            pinned: false,

            createdAt: timestamp,
            updatedAt: timestamp,

            ...noteData
        };

        notes.push(newNote);

        this.save(notes);

        return newNote;
    },

    update(id, changes) {
        let updatedNote = null;

        const notes =
            this.getAll().map(note => {
                if (
                    String(note.id) !==
                    String(id)
                ) {
                    return note;
                }

                updatedNote = {
                    ...note,
                    ...changes,

                    id: note.id,

                    updatedAt:
                        new Date().toISOString()
                };

                return updatedNote;
            });

        this.save(notes);

        return updatedNote;
    },

    delete(id) {
        const filtered =
            this.getAll().filter(note => {
                return (
                    String(note.id) !==
                    String(id)
                );
            });

        this.save(filtered);

        return true;
    }
};