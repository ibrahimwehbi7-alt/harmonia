console.log("✅ Events Page Loaded");

let activeEventStatusFilter = "all";
let activeEventTypeFilter = "all";
let activeEventSearch = "";
let activeEventDateFrom = "";
let activeEventDateTo = "";

function formatEventDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatEventTime(timeValue) {
  if (!timeValue) return "";

  const [hours, minutes] = timeValue
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return "";
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatEventType(type) {
  const labels = {
    meeting: "Meeting",
    "public-event": "Public Event",
    "speaking-engagement":
      "Speaking Engagement",
    deadline: "Deadline",
    "internal-planning":
      "Internal Planning",
    "community-event":
      "Community Event",
    fundraiser: "Fundraiser",
    other: "Other"
  };

  return labels[type] || "Other";
}

function formatEventStatus(status) {
  const labels = {
    idea: "Idea",
    planning: "Planning",
    tentative: "Tentative",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled"
  };

  return labels[status] || status || "Planning";
}

function isUpcomingEvent(event) {
  if (!event.startDate) return false;

  const eventDate = new Date(
    `${event.startDate}T23:59:59`
  );

  const now = new Date();

  return (
    eventDate >= now &&
    event.status !== "cancelled" &&
    event.status !== "completed"
  );
}

function sortEvents(events) {
  return [...events].sort(
    (firstEvent, secondEvent) => {
      if (
        !firstEvent.startDate &&
        !secondEvent.startDate
      ) {
        return (
          new Date(secondEvent.createdAt) -
          new Date(firstEvent.createdAt)
        );
      }

      if (!firstEvent.startDate) return 1;
      if (!secondEvent.startDate) return -1;

      const firstDateTime =
        `${firstEvent.startDate}T${
          firstEvent.startTime || "00:00"
        }`;

      const secondDateTime =
        `${secondEvent.startDate}T${
          secondEvent.startTime || "00:00"
        }`;

      return (
        new Date(firstDateTime) -
        new Date(secondDateTime)
      );
    }
  );
}

function filterEvents(events) {
  return events.filter((event) => {
    const matchesStatus =
      activeEventStatusFilter === "all" ||
      event.status ===
        activeEventStatusFilter;

    const matchesType =
      activeEventTypeFilter === "all" ||
      event.type === activeEventTypeFilter;

const eventDate = event.startDate || "";

const matchesDateFrom =
    !activeEventDateFrom ||
    (eventDate && eventDate >= activeEventDateFrom);

const matchesDateTo =
    !activeEventDateTo ||
    (eventDate && eventDate <= activeEventDateTo);

    const searchText =
      activeEventSearch.toLowerCase();

    const eventTitle =
      event.title || "";

    const eventLocation =
      event.location || "";

    const eventDescription =
      event.description || "";

    const matchesSearch =
      !searchText ||
      eventTitle
        .toLowerCase()
        .includes(searchText) ||
      eventLocation
        .toLowerCase()
        .includes(searchText) ||
      eventDescription
        .toLowerCase()
        .includes(searchText);

    return (
    matchesStatus &&
    matchesType &&
    matchesDateFrom &&
    matchesDateTo &&
    matchesSearch
);
  });
}


function createEventCard(event) {
  const card =
    document.createElement("article");

  card.className = "event-card";
  card.dataset.eventId = event.id;

  const dateBlock =
    document.createElement("div");

  dateBlock.className = "event-card-date";

  if (event.startDate) {
    const date = new Date(
      `${event.startDate}T00:00:00`
    );

    const month =
      document.createElement("span");

    month.textContent = date
      .toLocaleDateString("en-US", {
        month: "short"
      })
      .toUpperCase();

    const day =
      document.createElement("strong");

    day.textContent =
      date.toLocaleDateString("en-US", {
        day: "2-digit"
      });

    dateBlock.appendChild(month);
    dateBlock.appendChild(day);
  } else {
    const month =
      document.createElement("span");

    month.textContent = "TBD";

    const day =
      document.createElement("strong");

    day.textContent = "—";

    dateBlock.appendChild(month);
    dateBlock.appendChild(day);
  }

  const content =
    document.createElement("div");

  content.className =
    "event-card-content";

  const headingRow =
    document.createElement("div");

  headingRow.className =
    "event-card-heading";

  const title =
    document.createElement("h3");

  title.textContent =
    event.title || "Untitled Event";

  const status =
    document.createElement("span");

  status.className =
    `event-status-badge ${
      event.status || "planning"
    }`;

  status.textContent =
    formatEventStatus(event.status);

  headingRow.appendChild(title);
  headingRow.appendChild(status);

  const type =
    document.createElement("p");

  type.className = "event-card-type";
  type.textContent =
    formatEventType(event.type);

  const details =
    document.createElement("div");

  details.className =
    "event-card-details";

  if (event.startDate) {
    const dateDetail =
      document.createElement("span");

    dateDetail.textContent =
      formatEventDate(event.startDate);

    details.appendChild(dateDetail);
  }

  if (event.startTime) {
    const timeDetail =
      document.createElement("span");

    const timeRange = event.endTime
      ? `${formatEventTime(
          event.startTime
        )} – ${formatEventTime(
          event.endTime
        )}`
      : formatEventTime(
          event.startTime
        );

    timeDetail.textContent = timeRange;
    details.appendChild(timeDetail);
  }

  if (event.location) {
    const locationDetail =
      document.createElement("span");

    locationDetail.textContent =
      event.location;

    details.appendChild(
      locationDetail
    );
  }

  const description =
    document.createElement("p");

  description.className =
    "event-card-description";

  description.textContent =
    event.description ||
    "No description has been added.";

  const flags =
    document.createElement("div");

  flags.className =
    "event-card-flags";

  if (event.isPublic) {
    const publicFlag =
      document.createElement("span");

    publicFlag.textContent =
      "Public website";

    flags.appendChild(publicFlag);
  }

  content.appendChild(headingRow);
  content.appendChild(type);
  content.appendChild(details);
  content.appendChild(description);
  content.appendChild(flags);

  const actions =
    document.createElement("div");

  actions.className =
    "event-card-actions";

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
        typeof window.openEventModal ===
        "function"
      ) {
        window.openEventModal(event);
      } else {
        console.error(
          "openEventModal is not available."
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
          `Delete "${event.title}"?`
        );

      if (!confirmed) return;

      if (
        !window.HarmoniaEvents ||
        typeof window.HarmoniaEvents
          .delete !== "function"
      ) {
        console.error(
          "HarmoniaEvents.delete is unavailable."
        );
        return;
      }

      window.HarmoniaEvents.delete(
        event.id
      );

      renderEvents();
    }
  );

  actions.appendChild(editButton);
  actions.appendChild(deleteButton);

  card.appendChild(dateBlock);
  card.appendChild(content);
  card.appendChild(actions);

  return card;
}

function updateEventSummary(events) {
  const totalCount =
    document.getElementById(
      "eventTotalCount"
    );

  const upcomingCount =
    document.getElementById(
      "eventUpcomingCount"
    );

  const confirmedCount =
    document.getElementById(
      "eventConfirmedCount"
    );

  const planningCount =
    document.getElementById(
      "eventPlanningCount"
    );

  if (totalCount) {
    totalCount.textContent =
      String(events.length);
  }

  if (upcomingCount) {
    upcomingCount.textContent =
      String(
        events.filter(
          isUpcomingEvent
        ).length
      );
  }

  if (confirmedCount) {
    confirmedCount.textContent =
      String(
        events.filter(
          (event) =>
            event.status ===
            "confirmed"
        ).length
      );
  }

  if (planningCount) {
    planningCount.textContent =
      String(
        events.filter(
          (event) =>
            event.status ===
            "planning"
        ).length
      );
  }
}

function renderEvents() {
  const eventsList =
    document.getElementById(
      "eventsList"
    );

  const emptyState =
    document.getElementById(
      "eventsEmptyState"
    );

  if (!eventsList) {
    console.error(
      "The #eventsList element was not found."
    );
    return;
  }

  if (
    !window.HarmoniaEvents ||
    typeof window.HarmoniaEvents
      .getAll !== "function"
  ) {
    console.error(
      "HarmoniaEvents.getAll is unavailable."
    );
    return;
  }

  const allEvents =
    window.HarmoniaEvents.getAll();

  const visibleEvents =
    sortEvents(
      filterEvents(allEvents)
    );

  eventsList.innerHTML = "";

  visibleEvents.forEach((event) => {
    eventsList.appendChild(
      createEventCard(event)
    );
  });

  if (emptyState) {
    emptyState.hidden =
      visibleEvents.length > 0;
  }

  updateEventSummary(allEvents);
}

function initializeEventFilters() {
    const searchInput =
        document.getElementById("eventSearchInput");

    const statusFilter =
        document.getElementById("eventStatusFilter");

    const typeFilter =
        document.getElementById("eventTypeFilter");

    const dateFromFilter =
        document.getElementById("eventDateFromFilter");

    const dateToFilter =
        document.getElementById("eventDateToFilter");

    const clearDateButton =
        document.getElementById("clearEventDateFilter");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            activeEventSearch =
                searchInput.value.trim();

            renderEvents();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            activeEventStatusFilter =
                statusFilter.value;

            renderEvents();
        });
    }

    if (typeFilter) {
        typeFilter.addEventListener("change", () => {
            activeEventTypeFilter =
                typeFilter.value;

            renderEvents();
        });
    }

    if (dateFromFilter) {
        dateFromFilter.addEventListener("change", () => {
            activeEventDateFrom =
                dateFromFilter.value;

            renderEvents();
        });
    }

    if (dateToFilter) {
        dateToFilter.addEventListener("change", () => {
            activeEventDateTo =
                dateToFilter.value;

            renderEvents();
        });
    }

    if (clearDateButton) {
        clearDateButton.addEventListener("click", () => {
            activeEventDateFrom = "";
            activeEventDateTo = "";

            if (dateFromFilter) {
                dateFromFilter.value = "";
            }

            if (dateToFilter) {
                dateToFilter.value = "";
            }

            renderEvents();
        });
    }
}

function openCreateEventModal() {
  console.log(
    "Make Event button clicked."
  );

  if (
    typeof window.openEventModal !==
    "function"
  ) {
    console.error(
      "openEventModal is not available. Check that eventModal.js loads before eventsPage.js."
    );
    return;
  }

  window.openEventModal();
}

function initializeMakeEventButton() {
    const makeEventButton =
        document.getElementById("newEventButton") ||
        document.getElementById("makeEventButton") ||
        document.getElementById("addEventButton") ||
        document.getElementById("createEventButton");

    if (!makeEventButton) {
        console.error(
            "Make Event button was not found."
        );
        return;
    }

    if (
        makeEventButton.dataset.eventListenerAttached ===
        "true"
    ) {
        return;
    }

    makeEventButton.addEventListener("click", () => {
        if (
            typeof window.openEventModal === "function"
        ) {
            window.openEventModal();
        } else {
            console.error(
                "window.openEventModal is not available."
            );
        }
    });

    makeEventButton.dataset.eventListenerAttached = "true";

    console.log("Make Event button listener attached.");
}

function initializeEventsPage() {
  console.log(
    "Initializing Events Page"
  );

  if (
    window.HarmoniaEvents &&
    typeof window.HarmoniaEvents
      .load === "function"
  ) {
    window.HarmoniaEvents.load();
  } else {
    console.error(
      "HarmoniaEvents.load is unavailable."
    );
  }

  initializeMakeEventButton();
  initializeEventFilters();
  renderEvents();

  console.log(
    "✅ Events Page initialization complete"
  );
}

document.addEventListener(
  "harmonia:events-updated",
  () => {
    renderEvents();
  }
);

window.renderEvents = renderEvents;
window.renderEventsPage = renderEvents;
window.initializeEventsPage =
  initializeEventsPage;

console.log(
  "✅ Events Page script ready"
);