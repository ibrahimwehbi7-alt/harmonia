let activePartnersItemId = null;

function getPartnersModalElement() {
    return document.getElementById("partnersModal");
}

function createPartnersModalElement() {
    const existingModal = getPartnersModalElement();
    if (existingModal) return existingModal;

    const modal = document.createElement("div");
    modal.className = "partners-modal";
    modal.id = "partnersModal";
    modal.hidden = true;
    document.body.appendChild(modal);
    return modal;
}

function renderPartnersModal(item = null) {
    const modal = createPartnersModalElement();
    const isEditing = Boolean(item);
    item = item || {"name": "", "type": "", "status": "", "contactName": "", "contactEmail": "", "phone": "", "website": "", "location": "", "nextStep": "", "followUpDate": "", "notes": ""};

    modal.innerHTML = `
      <div class="partners-modal-backdrop" data-close-partners-modal></div>

      <section class="partners-modal-panel" role="dialog" aria-modal="true" aria-labelledby="partnersModalTitle">
        <div class="partners-modal-header">
          <div>
            <p class="panel-label">Harmonia</p>
            <h3 id="partnersModalTitle">${isEditing ? "Edit Partner" : "New Partner"}</h3>
          </div>

          <button class="partners-modal-close" type="button" data-close-partners-modal aria-label="Close">×</button>
        </div>

        <div class="partners-form-grid">
          
<label class="partners-field">
  <span>Organization name</span>
  <input id="partnersNameInput" type="text" />
</label>
<label class="partners-field">
  <span>Partner type</span>
  <select id="partnersTypeInput">
    <option value="community">Community</option>
<option value="corporate">Corporate</option>
<option value="education">Education</option>
<option value="government">Government</option>
<option value="foundation">Foundation</option>
<option value="media">Media</option>
<option value="vendor">Vendor</option>
<option value="other">Other</option>
  </select>
</label>
<label class="partners-field">
  <span>Status</span>
  <select id="partnersStatusInput">
    <option value="prospect">Prospect</option>
<option value="contacted">Contacted</option>
<option value="active">Active</option>
<option value="paused">Paused</option>
<option value="former">Former</option>
  </select>
</label>
<label class="partners-field">
  <span>Primary contact</span>
  <input id="partnersContactNameInput" type="text" />
</label>
<label class="partners-field">
  <span>Email</span>
  <input id="partnersContactEmailInput" type="email" />
</label>
<label class="partners-field">
  <span>Phone</span>
  <input id="partnersPhoneInput" type="text" />
</label>
<label class="partners-field">
  <span>Website</span>
  <input id="partnersWebsiteInput" type="url" />
</label>
<label class="partners-field">
  <span>Location</span>
  <input id="partnersLocationInput" type="text" />
</label>
<label class="partners-field">
  <span>Next step</span>
  <input id="partnersNextStepInput" type="text" />
</label>
<label class="partners-field">
  <span>Follow-up date</span>
  <input id="partnersFollowUpDateInput" type="date" />
</label>
<label class="partners-field partners-field-wide">
  <span>Notes</span>
  <textarea id="partnersNotesInput" rows="5"></textarea>
</label>
        </div>

        <div class="partners-modal-actions">
          <button class="text-button" type="button" data-close-partners-modal>Cancel</button>
          <button class="primary-button" type="button" id="savePartnersButton">${isEditing ? "Save changes" : "Create partner"}</button>
        </div>
      </section>
    `;

    const nameInput = document.getElementById("partnersNameInput");
    if (nameInput) nameInput.value = item.name ?? "";
const typeInput = document.getElementById("partnersTypeInput");
    if (typeInput) typeInput.value = item.type ?? "";
const statusInput = document.getElementById("partnersStatusInput");
    if (statusInput) statusInput.value = item.status ?? "";
const contactNameInput = document.getElementById("partnersContactNameInput");
    if (contactNameInput) contactNameInput.value = item.contactName ?? "";
const contactEmailInput = document.getElementById("partnersContactEmailInput");
    if (contactEmailInput) contactEmailInput.value = item.contactEmail ?? "";
const phoneInput = document.getElementById("partnersPhoneInput");
    if (phoneInput) phoneInput.value = item.phone ?? "";
const websiteInput = document.getElementById("partnersWebsiteInput");
    if (websiteInput) websiteInput.value = item.website ?? "";
const locationInput = document.getElementById("partnersLocationInput");
    if (locationInput) locationInput.value = item.location ?? "";
const nextStepInput = document.getElementById("partnersNextStepInput");
    if (nextStepInput) nextStepInput.value = item.nextStep ?? "";
const followUpDateInput = document.getElementById("partnersFollowUpDateInput");
    if (followUpDateInput) followUpDateInput.value = item.followUpDate ?? "";
const notesInput = document.getElementById("partnersNotesInput");
    if (notesInput) notesInput.value = item.notes ?? "";

    modal.querySelectorAll("[data-close-partners-modal]").forEach((button) => {
        button.addEventListener("click", closePartnersModal);
    });

    document.getElementById("savePartnersButton")?.addEventListener("click", savePartnersModal);
}

function openPartnersModal(itemId = null) {
    activePartnersItemId = itemId;
    const item = itemId ? window.HarmoniaPartners?.getById(itemId) : null;
    renderPartnersModal(item);

    const modal = getPartnersModalElement();
    if (!modal) return;

    modal.hidden = false;
    document.body.classList.add("partners-modal-open");
    document.addEventListener("keydown", handlePartnersModalKeydown);
}

function closePartnersModal() {
    const modal = getPartnersModalElement();
    if (modal) modal.hidden = true;

    activePartnersItemId = null;
    document.body.classList.remove("partners-modal-open");
    document.removeEventListener("keydown", handlePartnersModalKeydown);
}

function handlePartnersModalKeydown(event) {
    if (event.key === "Escape") closePartnersModal();
}

function collectPartnersModalData() {
    return {
      name: document.getElementById("partnersNameInput")?.value.trim() || "",
      type: document.getElementById("partnersTypeInput")?.value || "community",
      status: document.getElementById("partnersStatusInput")?.value || "prospect",
      contactName: document.getElementById("partnersContactNameInput")?.value.trim() || "",
      contactEmail: document.getElementById("partnersContactEmailInput")?.value.trim() || "",
      phone: document.getElementById("partnersPhoneInput")?.value.trim() || "",
      website: document.getElementById("partnersWebsiteInput")?.value.trim() || "",
      location: document.getElementById("partnersLocationInput")?.value.trim() || "",
      nextStep: document.getElementById("partnersNextStepInput")?.value.trim() || "",
      followUpDate: document.getElementById("partnersFollowUpDateInput")?.value.trim() || "",
      notes: document.getElementById("partnersNotesInput")?.value.trim() || ""
    };
}

async function savePartnersModal() {
    if (!window.HarmoniaPartners) {
        console.error("HarmoniaPartners is unavailable.");
        return;
    }

    const data = collectPartnersModalData();

    if (!data.name) {
        window.alert("Please complete the first required field.");
        return;
    }

    if (activePartnersItemId) {
        await window.HarmoniaPartners.update(activePartnersItemId, data);
    } else {
        await window.HarmoniaPartners.create(data);
    }

    closePartnersModal();
}

window.openPartnersModal = openPartnersModal;
window.closePartnersModal = closePartnersModal;

console.log("✅ Partners Modal Loaded");