const EVENT_STORAGE_KEY = "harmonia.events";

function createEventId() {
  return `event-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
}

const defaultEvents = [
  {
    id: createEventId(),
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
    const stored = localStorage.getItem(EVENT_STORAGE_KEY);

    if (!stored) {
      localStorage.setItem(
        EVENT_STORAGE_KEY,
        JSON.stringify(defaultEvents)
      );
      return;
    }

    try {
      JSON.parse(stored);
    } catch {
      localStorage.setItem(
        EVENT_STORAGE_KEY,
        JSON.stringify(defaultEvents)
      );
    }
  },

  getAll() {
    return JSON.parse(
      localStorage.getItem(EVENT_STORAGE_KEY)
    ) || [];
  },

  save(events) {
    localStorage.setItem(
      EVENT_STORAGE_KEY,
      JSON.stringify(events)
    );
  },

  add(event) {
    const events = this.getAll();

    const newEvent = {
      id: createEventId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...event
    };

    events.push(newEvent);

    this.save(events);

    return newEvent;
  },

  update(id, changes) {
    const events = this.getAll();

    const updated = events.map(event => {

      if (event.id !== id) return event;

      return {
        ...event,
        ...changes,
        updatedAt: new Date().toISOString()
      };

    });

    this.save(updated);
  },

  delete(id) {
    const filtered = this.getAll().filter(
      event => event.id !== id
    );

    this.save(filtered);
  }

};