const MESSAGES_STORAGE_KEY = "harmonia_messages";

function loadMessages() {
    try {
        const savedItems = localStorage.getItem(MESSAGES_STORAGE_KEY);
        if (!savedItems) return [];
        const parsedItems = JSON.parse(savedItems);
        return Array.isArray(parsedItems) ? parsedItems : [];
    } catch (error) {
        console.error("Could not load messages:", error);
        return [];
    }
}

function saveMessages(items) {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("harmonia:messages-updated"));
}

function createMessagesId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `messages-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeMessagesItem(data = {}) {
    const timestamp = new Date().toISOString();

    return {
        id: data.id || createMessagesId(),

        subject: String(data.subject || "").trim(),
        senderName: String(data.senderName || "").trim(),
        senderEmail: String(data.senderEmail || "").trim(),
        type: String(data.type || "inquiry").trim(),
        status: String(data.status || "unread").trim(),
        receivedDate: String(data.receivedDate || "").trim(),
        followUpDate: String(data.followUpDate || "").trim(),
        body: String(data.body || "").trim(),
        internalNotes: String(data.internalNotes || "").trim(),

        createdAt: data.createdAt || timestamp,
        updatedAt: timestamp
    };
}

function getAllMessagesItems() {
    return loadMessages();
}

function getMessagesItemById(itemId) {
    return loadMessages().find((item) => item.id === itemId) || null;
}

function createMessagesItem(data) {
    const items = loadMessages();
    const newItem = normalizeMessagesItem(data);
    items.unshift(newItem);
    saveMessages(items);
    return newItem;
}

function updateMessagesItem(itemId, data) {
    const items = loadMessages();
    const itemIndex = items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) return null;

    const currentItem = items[itemIndex];
    const updatedItem = normalizeMessagesItem({
        ...currentItem,
        ...data,
        id: currentItem.id,
        createdAt: currentItem.createdAt
    });

    items[itemIndex] = updatedItem;
    saveMessages(items);
    return updatedItem;
}

function deleteMessagesItem(itemId) {
    const items = loadMessages();
    const filteredItems = items.filter((item) => item.id !== itemId);

    if (filteredItems.length === items.length) return false;

    saveMessages(filteredItems);
    return true;
}

window.HarmoniaMessages = {
    load: getAllMessagesItems,
    getAll: getAllMessagesItems,
    getById: getMessagesItemById,
    create: createMessagesItem,
    update: updateMessagesItem,
    delete: deleteMessagesItem
};

console.log("✅ Messages Manager Loaded");