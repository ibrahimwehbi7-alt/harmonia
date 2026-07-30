const PARTNERS_STORAGE_KEY = "harmonia_partners";

function loadPartners() {
    try {
        const savedItems = localStorage.getItem(PARTNERS_STORAGE_KEY);
        if (!savedItems) return [];
        const parsedItems = JSON.parse(savedItems);
        return Array.isArray(parsedItems) ? parsedItems : [];
    } catch (error) {
        console.error("Could not load partners:", error);
        return [];
    }
}

function savePartners(items) {
    localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("harmonia:partners-updated"));
}

function createPartnersId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `partners-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizePartnersItem(data = {}) {
    const timestamp = new Date().toISOString();

    return {
        id: data.id || createPartnersId(),

        name: String(data.name || "").trim(),
        type: String(data.type || "community").trim(),
        status: String(data.status || "prospect").trim(),
        contactName: String(data.contactName || "").trim(),
        contactEmail: String(data.contactEmail || "").trim(),
        phone: String(data.phone || "").trim(),
        website: String(data.website || "").trim(),
        location: String(data.location || "").trim(),
        nextStep: String(data.nextStep || "").trim(),
        followUpDate: String(data.followUpDate || "").trim(),
        notes: String(data.notes || "").trim(),

        createdAt: data.createdAt || timestamp,
        updatedAt: timestamp
    };
}

function getAllPartnersItems() {
    return loadPartners();
}

function getPartnersItemById(itemId) {
    return loadPartners().find((item) => item.id === itemId) || null;
}

function createPartnersItem(data) {
    const items = loadPartners();
    const newItem = normalizePartnersItem(data);
    items.unshift(newItem);
    savePartners(items);
    return newItem;
}

function updatePartnersItem(itemId, data) {
    const items = loadPartners();
    const itemIndex = items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) return null;

    const currentItem = items[itemIndex];
    const updatedItem = normalizePartnersItem({
        ...currentItem,
        ...data,
        id: currentItem.id,
        createdAt: currentItem.createdAt
    });

    items[itemIndex] = updatedItem;
    savePartners(items);
    return updatedItem;
}

function deletePartnersItem(itemId) {
    const items = loadPartners();
    const filteredItems = items.filter((item) => item.id !== itemId);

    if (filteredItems.length === items.length) return false;

    savePartners(filteredItems);
    return true;
}

window.HarmoniaPartners = {
    load: getAllPartnersItems,
    getAll: getAllPartnersItems,
    getById: getPartnersItemById,
    create: createPartnersItem,
    update: updatePartnersItem,
    delete: deletePartnersItem
};

console.log("✅ Partners Manager Loaded");