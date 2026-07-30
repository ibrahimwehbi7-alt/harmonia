const MARKETING_STORAGE_KEY = "harmonia_marketing";

function loadMarketing() {
    try {
        const savedItems = localStorage.getItem(MARKETING_STORAGE_KEY);
        if (!savedItems) return [];
        const parsedItems = JSON.parse(savedItems);
        return Array.isArray(parsedItems) ? parsedItems : [];
    } catch (error) {
        console.error("Could not load marketing:", error);
        return [];
    }
}

function saveMarketing(items) {
    localStorage.setItem(MARKETING_STORAGE_KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("harmonia:marketing-updated"));
}

function createMarketingId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `marketing-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeMarketingItem(data = {}) {
    const timestamp = new Date().toISOString();

    return {
        id: data.id || createMarketingId(),

        title: String(data.title || "").trim(),
        type: String(data.type || "campaign").trim(),
        status: String(data.status || "idea").trim(),
        audience: String(data.audience || "").trim(),
        channel: String(data.channel || "").trim(),
        launchDate: String(data.launchDate || "").trim(),
        owner: String(data.owner || "").trim(),
        objective: String(data.objective || "").trim(),
        message: String(data.message || "").trim(),
        assetUrl: String(data.assetUrl || "").trim(),
        productionNotes: String(data.productionNotes || "").trim(),
        budget: Number(data.budget || 0),

        createdAt: data.createdAt || timestamp,
        updatedAt: timestamp
    };
}

function getAllMarketingItems() {
    return loadMarketing();
}

function getMarketingItemById(itemId) {
    return loadMarketing().find((item) => item.id === itemId) || null;
}

function createMarketingItem(data) {
    const items = loadMarketing();
    const newItem = normalizeMarketingItem(data);
    items.unshift(newItem);
    saveMarketing(items);
    return newItem;
}

function updateMarketingItem(itemId, data) {
    const items = loadMarketing();
    const itemIndex = items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) return null;

    const currentItem = items[itemIndex];
    const updatedItem = normalizeMarketingItem({
        ...currentItem,
        ...data,
        id: currentItem.id,
        createdAt: currentItem.createdAt
    });

    items[itemIndex] = updatedItem;
    saveMarketing(items);
    return updatedItem;
}

function deleteMarketingItem(itemId) {
    const items = loadMarketing();
    const filteredItems = items.filter((item) => item.id !== itemId);

    if (filteredItems.length === items.length) return false;

    saveMarketing(filteredItems);
    return true;
}

window.HarmoniaMarketing = {
    load: getAllMarketingItems,
    getAll: getAllMarketingItems,
    getById: getMarketingItemById,
    create: createMarketingItem,
    update: updateMarketingItem,
    delete: deleteMarketingItem
};

console.log("✅ Marketing Manager Loaded");