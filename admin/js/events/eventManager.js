const EVENT_STORAGE_KEY = "harmonia.events";

function createEventId() {
    return `event-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
}

const defaultEvents = [
    {
        id: createEventId(),
        projectId: null,
        title: "Foundation Board Meeting",
        description: "Mission moment presentation.",
        location: "Wojcik Conference Center",
        type: "meeting",
        status: "confirmed",
        startDate: "2026-09-08",
        endDate: "2026-09-08",
        startTime: "07:30",
        endTime: "09:00",
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: createEventId(),
        projectId: null,
        title: "Hullabaloo",
        description: "Recruitment and outreach.",
        location: "Harper College",
        type: "public-event",
        status: "planning",
        startDate: "2026-09-09",
        endDate: "2026-09-09",
        startTime: "11:00",
        endTime: "13:00",
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

window.HarmoniaEvents = {
    load() {
        const stored =
            localStorage.getItem(EVENT_STORAGE_KEY);

        if (!stored) {
            this.save(defaultEvents);
            return defaultEvents;
        }

        try {
            const parsed = JSON.parse(stored);

            if (!Array.isArray(parsed)) {
                throw new Error(
                    "Stored events are not an array."
                );
            }

            const migratedEvents =
                parsed.map(event => ({
                    projectId: null,
                    ...event
                }));

            this.save(migratedEvents);

            return migratedEvents;
        } catch (error) {
            console.error(
                "Could not load events:",
                error
            );

            this.save(defaultEvents);

            return defaultEvents;
        }
    },

    getAll() {
        try {
            const stored =
                localStorage.getItem(
                    EVENT_STORAGE_KEY
                );

            if (!stored) {
                return [];
            }

            const events = JSON.parse(stored);

            return Array.isArray(events)
                ? events
                : [];
        } catch (error) {
            console.error(
                "Could not read events:",
                error
            );

            return [];
        }
    },

    getById(eventId) {
        return (
            this.getAll().find(event => {
                return (
                    String(event.id) ===
                    String(eventId)
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

        return this.getAll().filter(event => {
            return (
                String(event.projectId) ===
                String(projectId)
            );
        });
    },

    save(events) {
        localStorage.setItem(
            EVENT_STORAGE_KEY,
            JSON.stringify(events)
        );
    },

    add(eventData) {
        const events = this.getAll();

        const timestamp =
            new Date().toISOString();

        const newEvent = {
            id: createEventId(),
            projectId: null,
            createdAt: timestamp,
            updatedAt: timestamp,
            ...eventData
        };

        events.push(newEvent);

        this.save(events);

        return newEvent;
    },

    update(id, changes) {
        let updatedEvent = null;

        const events =
            this.getAll().map(event => {
                if (
                    String(event.id) !==
                    String(id)
                ) {
                    return event;
                }

                updatedEvent = {
                    ...event,
                    ...changes,
                    id: event.id,
                    updatedAt:
                        new Date().toISOString()
                };

                return updatedEvent;
            });

        this.save(events);

        return updatedEvent;
    },

    delete(id) {
        const filtered =
            this.getAll().filter(event => {
                return (
                    String(event.id) !==
                    String(id)
                );
            });

        this.save(filtered);

        return true;
    }
};