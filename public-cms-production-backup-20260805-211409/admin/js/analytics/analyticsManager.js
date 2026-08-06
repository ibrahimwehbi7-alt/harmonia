const ANALYTICS_STORAGE_KEY = "harmonia_analytics";

function loadAnalytics() {
    try {
        const savedItems = localStorage.getItem(ANALYTICS_STORAGE_KEY);
        if (!savedItems) return [];
        const parsedItems = JSON.parse(savedItems);
        return Array.isArray(parsedItems) ? parsedItems : [];
    } catch (error) {
        console.error("Could not load analytics:", error);
        return [];
    }
}

function saveAnalytics(items) {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("harmonia:analytics-updated"));
}

function createAnalyticsId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `analytics-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeAnalyticsItem(data = {}) {
    const timestamp = new Date().toISOString();

    return {
        id: data.id || createAnalyticsId(),

        name: String(data.name || "").trim(),
        value: Number(data.value || 0),
        unit: String(data.unit || "").trim(),
        category: String(data.category || "website").trim(),
        period: String(data.period || "").trim(),
        date: String(data.date || "").trim(),
        notes: String(data.notes || "").trim(),

        createdAt: data.createdAt || timestamp,
        updatedAt: timestamp
    };
}

function getAllAnalyticsItems() {
    return loadAnalytics();
}

function getAnalyticsItemById(itemId) {
    return loadAnalytics().find((item) => item.id === itemId) || null;
}

function createAnalyticsItem(data) {
    const items = loadAnalytics();
    const newItem = normalizeAnalyticsItem(data);
    items.unshift(newItem);
    saveAnalytics(items);
    return newItem;
}

function updateAnalyticsItem(itemId, data) {
    const items = loadAnalytics();
    const itemIndex = items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) return null;

    const currentItem = items[itemIndex];
    const updatedItem = normalizeAnalyticsItem({
        ...currentItem,
        ...data,
        id: currentItem.id,
        createdAt: currentItem.createdAt
    });

    items[itemIndex] = updatedItem;
    saveAnalytics(items);
    return updatedItem;
}

function deleteAnalyticsItem(itemId) {
    const items = loadAnalytics();
    const filteredItems = items.filter((item) => item.id !== itemId);

    if (filteredItems.length === items.length) return false;

    saveAnalytics(filteredItems);
    return true;
}

window.HarmoniaAnalytics = {
    load: getAllAnalyticsItems,
    getAll: getAllAnalyticsItems,
    getById: getAnalyticsItemById,
    create: createAnalyticsItem,
    update: updateAnalyticsItem,
    delete: deleteAnalyticsItem
};

console.log("✅ Analytics Manager Loaded");