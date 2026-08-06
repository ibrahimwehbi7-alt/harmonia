console.log("✅ Event Modal Loaded");

let editingEventId = null;
let activeEventProjectId = null;

function getEventModalElements() {
    return {
        modal:
            document.getElementById("eventModal"),

        title:
            document.getElementById("eventModalTitle"),

        eventTitleInput:
            document.getElementById("eventTitleInput"),

        eventTypeInput:
            document.getElementById("eventTypeInput"),

        eventStatusInput:
            document.getElementById("eventStatusInput"),

        eventStartDateInput:
            document.getElementById("eventStartDateInput"),

        eventEndDateInput:
            document.getElementById("eventEndDateInput"),

        eventStartTimeInput:
            document.getElementById("eventStartTimeInput"),

        eventEndTimeInput:
            document.getElementById("eventEndTimeInput"),

        eventLocationInput:
            document.getElementById("eventLocationInput"),

        eventDescriptionInput:
            document.getElementById(
                "eventDescriptionInput"
            ),

        eventPublicInput:
            document.getElementById("eventPublicInput"),

        saveButton:
            document.getElementById("saveEventButton")
    };
}

function resetEventForm() {
    const elements = getEventModalElements();

    editingEventId = null;
    activeEventProjectId = null;

    if (elements.title) {
        elements.title.textContent = "New Event";
    }

    if (elements.eventTitleInput) {
        elements.eventTitleInput.value = "";
    }

    if (elements.eventTypeInput) {
        elements.eventTypeInput.value = "meeting";
    }

    if (elements.eventStatusInput) {
        elements.eventStatusInput.value = "planning";
    }

    if (elements.eventStartDateInput) {
        elements.eventStartDateInput.value = "";
    }

    if (elements.eventEndDateInput) {
        elements.eventEndDateInput.value = "";
    }

    if (elements.eventStartTimeInput) {
        elements.eventStartTimeInput.value = "";
    }

    if (elements.eventEndTimeInput) {
        elements.eventEndTimeInput.value = "";
    }

    if (elements.eventLocationInput) {
        elements.eventLocationInput.value = "";
    }

    if (elements.eventDescriptionInput) {
        elements.eventDescriptionInput.value = "";
    }

    if (elements.eventPublicInput) {
        elements.eventPublicInput.checked = false;
    }
}

function openEventModal(
    eventData = null,
    options = {}
) {
    const elements = getEventModalElements();

    if (!elements.modal) {
        console.error(
            "Event modal element was not found."
        );
        return;
    }

    resetEventForm();

    activeEventProjectId =
        options.projectId ?? null;

    console.log(
        "Event modal received project ID:",
        activeEventProjectId
    );

    if (eventData) {
        editingEventId =
            eventData.id || null;

        activeEventProjectId =
            eventData.projectId ?? null;

        if (elements.title) {
            elements.title.textContent =
                "Edit Event";
        }

        if (elements.eventTitleInput) {
            elements.eventTitleInput.value =
                eventData.title || "";
        }

        if (elements.eventTypeInput) {
            elements.eventTypeInput.value =
                eventData.type || "meeting";
        }

        if (elements.eventStatusInput) {
            elements.eventStatusInput.value =
                eventData.status || "planning";
        }

        if (elements.eventStartDateInput) {
            elements.eventStartDateInput.value =
                eventData.startDate || "";
        }

        if (elements.eventEndDateInput) {
            elements.eventEndDateInput.value =
                eventData.endDate || "";
        }

        if (elements.eventStartTimeInput) {
            elements.eventStartTimeInput.value =
                eventData.startTime || "";
        }

        if (elements.eventEndTimeInput) {
            elements.eventEndTimeInput.value =
                eventData.endTime || "";
        }

        if (elements.eventLocationInput) {
            elements.eventLocationInput.value =
                eventData.location || "";
        }

        if (elements.eventDescriptionInput) {
            elements.eventDescriptionInput.value =
                eventData.description || "";
        }

        if (elements.eventPublicInput) {
            elements.eventPublicInput.checked =
                Boolean(eventData.isPublic);
        }
    }

    elements.modal.hidden = false;

    requestAnimationFrame(() => {
        elements.eventTitleInput?.focus();
    });
}

function closeEventModal() {
    const elements = getEventModalElements();

    if (!elements.modal) {
        return;
    }

    elements.modal.hidden = true;

    editingEventId = null;
    activeEventProjectId = null;
}

function buildEventData() {
    const elements = getEventModalElements();

    const title =
        elements.eventTitleInput?.value.trim() || "";

    if (!title) {
        alert("Please enter an event title.");
        elements.eventTitleInput?.focus();
        return null;
    }

    console.log(
        "Saving event with project ID:",
        activeEventProjectId
    );

    return {
        projectId:
            activeEventProjectId ?? null,

        title,

        type:
            elements.eventTypeInput?.value ||
            "meeting",

        status:
            elements.eventStatusInput?.value ||
            "planning",

        startDate:
            elements.eventStartDateInput?.value ||
            "",

        endDate:
            elements.eventEndDateInput?.value ||
            "",

        startTime:
            elements.eventStartTimeInput?.value ||
            "",

        endTime:
            elements.eventEndTimeInput?.value ||
            "",

        location:
            elements.eventLocationInput?.value.trim() ||
            "",

        description:
            elements.eventDescriptionInput?.value.trim() ||
            "",

        isPublic:
            Boolean(
                elements.eventPublicInput?.checked
            )
    };
}

async function saveEventFromModal() {
    const eventData = buildEventData();

    if (!eventData) {
        return;
    }

    try {
        if (
            editingEventId &&
            window.HarmoniaEvents &&
            typeof window.HarmoniaEvents.update ===
                "function"
        ) {
            await window.HarmoniaEvents.update(
                editingEventId,
                eventData
            );
        } else if (
            window.HarmoniaEvents &&
            typeof window.HarmoniaEvents.add ===
                "function"
        ) {
            await window.HarmoniaEvents.add(
                eventData
            );
        } else {
            console.error(
                "No event save function is available."
            );

            alert(
                "The event manager is not connected yet."
            );

            return;
        }

closeEventModal();

document.dispatchEvent(
    new CustomEvent("harmonia:events-updated")
);
    } catch (error) {
        console.error(
            "Could not save event:",
            error
        );

        alert(
            "The event could not be saved."
        );
    }
}

function initializeEventModal() {
    const elements = getEventModalElements();

    if (!elements.modal) {
        console.warn(
            "Event modal was not found."
        );
        return;
    }

    document
        .querySelectorAll(
            "[data-close-event-modal]"
        )
        .forEach(button => {
            if (
                button.dataset
                    .eventModalListenerAttached ===
                "true"
            ) {
                return;
            }

            button.addEventListener(
                "click",
                closeEventModal
            );

            button.dataset
                .eventModalListenerAttached =
                "true";
        });

    if (
        elements.saveButton &&
        elements.saveButton.dataset
            .eventModalListenerAttached !==
            "true"
    ) {
        elements.saveButton.addEventListener(
            "click",
            saveEventFromModal
        );

        elements.saveButton.dataset
            .eventModalListenerAttached =
            "true";
    }

    if (
        document.body.dataset
            .eventModalKeyboardListenerAttached !==
        "true"
    ) {
        document.addEventListener(
            "keydown",
            event => {
                const currentElements =
                    getEventModalElements();

                if (
                    event.key === "Escape" &&
                    currentElements.modal &&
                    currentElements.modal.hidden ===
                        false
                ) {
                    closeEventModal();
                }
            }
        );

        document.body.dataset
            .eventModalKeyboardListenerAttached =
            "true";
    }
}

window.openEventModal =
    openEventModal;

window.closeEventModal =
    closeEventModal;

window.initializeEventModal =
    initializeEventModal;

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeEventModal,
        { once: true }
    );
} else {
    initializeEventModal();
}