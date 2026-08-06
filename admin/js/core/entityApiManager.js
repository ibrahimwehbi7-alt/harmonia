(function () {
  "use strict";

  const TYPE_MAP = Object.freeze({
    project: "PROJECT", work: "TASK", task: "TASK", event: "EVENT",
    note: "NOTE", file: "FILE", contact: "CONTACT", organization: "ORGANIZATION",
    partner: "PARTNER", message: "MESSAGE", finance: "FINANCE", gallery: "GALLERY",
    marketing: "MARKETING", user: "USER"
  });

  function organizationId() {
    return window.HarmoniaApi?.getOrganizationId?.() || "";
  }

  function normalizeType(type) {
    const key = String(type || "").trim();
    return TYPE_MAP[key.toLowerCase()] || key.toUpperCase();
  }

  function query(params) {
    const values = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") values.set(key, value);
    });
    return values.toString();
  }

  async function relationships(type, id) {
    return window.HarmoniaApi.request(`/entities/relationships?${query({
      organizationId: organizationId(), entityType: normalizeType(type), entityId: id
    })}`);
  }

  async function connect(fromType, fromId, toType, toId, label, notes = "") {
    return window.HarmoniaApi.request('/entities/relationships', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: organizationId(),
        fromType: normalizeType(fromType), fromId: String(fromId),
        toType: normalizeType(toType), toId: String(toId), label, notes
      })
    });
  }

  async function disconnect(relationshipId) {
    return window.HarmoniaApi.request(`/entities/relationships/${encodeURIComponent(relationshipId)}`, { method: 'DELETE' });
  }

  async function activity(type, id, limit = 50) {
    return window.HarmoniaApi.request(`/entities/activity?${query({
      organizationId: organizationId(), entityType: normalizeType(type), entityId: id, limit
    })}`);
  }

  async function record(type, id, action, summary, metadata = {}) {
    return window.HarmoniaApi.request('/entities/activity', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: organizationId(), entityType: normalizeType(type),
        entityId: String(id), action, summary, metadata
      })
    });
  }

  window.HarmoniaEntities = {
    types: TYPE_MAP, normalizeType, relationships, connect, disconnect, activity, record
  };

  document.dispatchEvent(new CustomEvent('harmonia:entities-ready'));
  console.log('✅ Harmonia Entity Foundation Loaded');
})();
