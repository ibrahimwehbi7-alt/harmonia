let activeAnalyticsItemId = null;

function getAnalyticsModalElement() {
    return document.getElementById("analyticsModal");
}

function createAnalyticsModalElement() {
    const existingModal = getAnalyticsModalElement();
    if (existingModal) return existingModal;

    const modal = document.createElement("div");
    modal.className = "analytics-modal";
    modal.id = "analyticsModal";
    modal.hidden = true;
    document.body.appendChild(modal);
    return modal;
}

function renderAnalyticsModal(item = null) {
    const modal = createAnalyticsModalElement();
    const isEditing = Boolean(item);
    item = item || {"name": "", "value": "", "unit": "", "category": "", "period": "", "date": "", "notes": ""};

    modal.innerHTML = `
      <div class="analytics-modal-backdrop" data-close-analytics-modal></div>

      <section class="analytics-modal-panel" role="dialog" aria-modal="true" aria-labelledby="analyticsModalTitle">
        <div class="analytics-modal-header">
          <div>
            <p class="panel-label">Harmonia</p>
            <h3 id="analyticsModalTitle">${isEditing ? "Edit Metric" : "New Metric"}</h3>
          </div>

          <button class="analytics-modal-close" type="button" data-close-analytics-modal aria-label="Close">×</button>
        </div>

        <div class="analytics-form-grid">
          
<label class="analytics-field">
  <span>Metric name</span>
  <input id="analyticsNameInput" type="text" />
</label>
<label class="analytics-field">
  <span>Value</span>
  <input id="analyticsValueInput" type="number" />
</label>
<label class="analytics-field">
  <span>Unit</span>
  <input id="analyticsUnitInput" type="text" />
</label>
<label class="analytics-field">
  <span>Category</span>
  <select id="analyticsCategoryInput">
    <option value="website">Website</option>
<option value="events">Events</option>
<option value="volunteers">Volunteers</option>
<option value="partners">Partners</option>
<option value="finance">Finance</option>
<option value="community-impact">Community Impact</option>
<option value="marketing">Marketing</option>
<option value="other">Other</option>
  </select>
</label>
<label class="analytics-field">
  <span>Period or label</span>
  <input id="analyticsPeriodInput" type="text" />
</label>
<label class="analytics-field">
  <span>Metric date</span>
  <input id="analyticsDateInput" type="date" />
</label>
<label class="analytics-field analytics-field-wide">
  <span>Notes</span>
  <textarea id="analyticsNotesInput" rows="5"></textarea>
</label>
        </div>

        <div class="analytics-modal-actions">
          <button class="text-button" type="button" data-close-analytics-modal>Cancel</button>
          <button class="primary-button" type="button" id="saveAnalyticsButton">${isEditing ? "Save changes" : "Create metric"}</button>
        </div>
      </section>
    `;

    const nameInput = document.getElementById("analyticsNameInput");
    if (nameInput) nameInput.value = item.name ?? "";
const valueInput = document.getElementById("analyticsValueInput");
    if (valueInput) valueInput.value = item.value ?? "";
const unitInput = document.getElementById("analyticsUnitInput");
    if (unitInput) unitInput.value = item.unit ?? "";
const categoryInput = document.getElementById("analyticsCategoryInput");
    if (categoryInput) categoryInput.value = item.category ?? "";
const periodInput = document.getElementById("analyticsPeriodInput");
    if (periodInput) periodInput.value = item.period ?? "";
const dateInput = document.getElementById("analyticsDateInput");
    if (dateInput) dateInput.value = item.date ?? "";
const notesInput = document.getElementById("analyticsNotesInput");
    if (notesInput) notesInput.value = item.notes ?? "";

    modal.querySelectorAll("[data-close-analytics-modal]").forEach((button) => {
        button.addEventListener("click", closeAnalyticsModal);
    });

    document.getElementById("saveAnalyticsButton")?.addEventListener("click", saveAnalyticsModal);
}

function openAnalyticsModal(itemId = null) {
    activeAnalyticsItemId = itemId;
    const item = itemId ? window.HarmoniaAnalytics?.getById(itemId) : null;
    renderAnalyticsModal(item);

    const modal = getAnalyticsModalElement();
    if (!modal) return;

    modal.hidden = false;
    document.body.classList.add("analytics-modal-open");
    document.addEventListener("keydown", handleAnalyticsModalKeydown);
}

function closeAnalyticsModal() {
    const modal = getAnalyticsModalElement();
    if (modal) modal.hidden = true;

    activeAnalyticsItemId = null;
    document.body.classList.remove("analytics-modal-open");
    document.removeEventListener("keydown", handleAnalyticsModalKeydown);
}

function handleAnalyticsModalKeydown(event) {
    if (event.key === "Escape") closeAnalyticsModal();
}

function collectAnalyticsModalData() {
    return {
      name: document.getElementById("analyticsNameInput")?.value.trim() || "",
      value: Number(document.getElementById("analyticsValueInput")?.value || 0),
      unit: document.getElementById("analyticsUnitInput")?.value.trim() || "",
      category: document.getElementById("analyticsCategoryInput")?.value || "website",
      period: document.getElementById("analyticsPeriodInput")?.value.trim() || "",
      date: document.getElementById("analyticsDateInput")?.value.trim() || "",
      notes: document.getElementById("analyticsNotesInput")?.value.trim() || ""
    };
}

function saveAnalyticsModal() {
    if (!window.HarmoniaAnalytics) {
        console.error("HarmoniaAnalytics is unavailable.");
        return;
    }

    const data = collectAnalyticsModalData();

    if (!data.name) {
        window.alert("Please complete the first required field.");
        return;
    }

    if (activeAnalyticsItemId) {
        window.HarmoniaAnalytics.update(activeAnalyticsItemId, data);
    } else {
        window.HarmoniaAnalytics.create(data);
    }

    closeAnalyticsModal();
}

window.openAnalyticsModal = openAnalyticsModal;
window.closeAnalyticsModal = closeAnalyticsModal;

console.log("✅ Analytics Modal Loaded");