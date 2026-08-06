(function () {
    "use strict";

    const DEFAULT_ORGANIZATION_ID = "cms9eoh7c0000prxue4fvntqp";
    function api() {
        if (!window.HarmoniaApi) throw new Error("Harmonia API is unavailable.");
        return window.HarmoniaApi;
    }
    function organizationId() {
        return api().getOrganizationId() || DEFAULT_ORGANIZATION_ID;
    }
    function notify(name, detail = {}) {
        document.dispatchEvent(new CustomEvent(name, { detail }));
    }

    let items = [];
    let loadingPromise = null;

    const statusToApi = {
        idea: "DRAFT", planning: "SCHEDULED", tentative: "SCHEDULED",
        confirmed: "CONFIRMED", completed: "COMPLETED", cancelled: "CANCELLED"
    };
    const statusFromApi = {
        DRAFT: "idea", SCHEDULED: "planning", CONFIRMED: "confirmed",
        COMPLETED: "completed", CANCELLED: "cancelled"
    };
    const typeToApi = {
        meeting: "MEETING", "public-event": "COMMUNITY",
        "speaking-engagement": "CONFERENCE", deadline: "OTHER",
        "internal-planning": "MEETING", "community-event": "COMMUNITY",
        fundraiser: "FUNDRAISER", other: "OTHER"
    };
    const typeFromApi = {
        MEETING: "meeting", COMMUNITY: "community-event", WORKSHOP: "community-event",
        FUNDRAISER: "fundraiser", TOWN_HALL: "community-event",
        CONFERENCE: "speaking-engagement", SOCIAL: "public-event", OTHER: "other"
    };

    function splitDate(value) {
        if (!value) return { date: "", time: "" };
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return { date: "", time: "" };
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return { date: local.toISOString().slice(0,10), time: local.toISOString().slice(11,16) };
    }
    function combine(date, time, fallbackTime = "00:00") {
        if (!date) return null;
        return new Date(`${date}T${time || fallbackTime}:00`).toISOString();
    }
    function normalize(event) {
        const start = splitDate(event.startAt);
        const end = splitDate(event.endAt);
        return {
            ...event,
            projectId: event.projectId || null,
            status: statusFromApi[event.status] || String(event.status || "planning").toLowerCase(),
            type: typeFromApi[event.type] || String(event.type || "other").toLowerCase(),
            startDate: start.date,
            startTime: start.time,
            endDate: end.date,
            endTime: end.time,
            featured: Array.isArray(event.tags) &&
                event.tags.some(tag => String(tag).toLowerCase() === "featured")
        };
    }
    function payload(data) {
        const startAt = combine(data.startDate, data.startTime, "09:00");
        if (!startAt) throw new Error("Start date is required.");
        return {
            title: data.title,
            description: data.description || undefined,
            type: typeToApi[data.type] || "OTHER",
            status: statusToApi[data.status] || "SCHEDULED",
            startAt,
            endAt: data.endDate ? combine(data.endDate, data.endTime, "17:00") : undefined,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago",
            location: data.location || undefined,
            virtualUrl: data.virtualUrl || undefined,
            registrationUrl: data.registrationUrl || undefined,
            isPublic: Boolean(data.isPublic),
            tags: data.featured ? ["featured"] : [],
            organizationId: organizationId(),
            projectId: data.projectId || undefined
        };
    }
    async function load(options = {}) {
        if (loadingPromise && !options.force) return loadingPromise;
        loadingPromise = (async () => {
            const result = await api().request(`/events?organizationId=${encodeURIComponent(organizationId())}&page=1&limit=100`);
            items = (result?.items || result || []).map(normalize);
            notify("harmonia:events-updated", { items });
            return items;
        })();
        try { return await loadingPromise; } finally { loadingPromise = null; }
    }
    function getAll() { return [...items]; }
    function getById(id) { return items.find(x => String(x.id) === String(id)) || null; }
    function getByProjectId(id) { return items.filter(x => String(x.projectId) === String(id)); }
    async function add(data) {
        const created = normalize(await api().request('/events', { method:'POST', body:JSON.stringify(payload(data)) }));
        items.unshift(created); notify('harmonia:events-updated',{created}); return created;
    }
    async function update(id, data) {
        const updated = normalize(await api().request(`/events/${encodeURIComponent(id)}`, { method:'PATCH', body:JSON.stringify(payload(data)) }));
        items = items.map(x => String(x.id)===String(id)?updated:x); notify('harmonia:events-updated',{updated}); return updated;
    }
    async function remove(id) {
        await api().request(`/events/${encodeURIComponent(id)}`, { method:'DELETE' });
        items = items.filter(x => String(x.id)!==String(id)); notify('harmonia:events-updated',{deletedId:id}); return true;
    }
    window.HarmoniaEvents = { load, getAll, getById, getByProjectId, add, update, delete: remove };
    console.log('✅ Railway Events Manager Loaded');
})();
