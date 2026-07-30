let activeMarketingItemId = null;

function getMarketingModalElement() {
    return document.getElementById("marketingModal");
}

function createMarketingModalElement() {
    const existingModal = getMarketingModalElement();
    if (existingModal) return existingModal;

    const modal = document.createElement("div");
    modal.className = "marketing-modal";
    modal.id = "marketingModal";
    modal.hidden = true;
    document.body.appendChild(modal);
    return modal;
}

function renderMarketingModal(item = null) {
    const modal = createMarketingModalElement();
    const isEditing = Boolean(item);
    item = item || {"title": "", "type": "", "status": "", "audience": "", "channel": "", "launchDate": "", "owner": "", "objective": "", "message": "", "assetUrl": "", "productionNotes": "", "budget": ""};

    modal.innerHTML = `
      <div class="marketing-modal-backdrop" data-close-marketing-modal></div>

      <section class="marketing-modal-panel" role="dialog" aria-modal="true" aria-labelledby="marketingModalTitle">
        <div class="marketing-modal-header">
          <div>
            <p class="panel-label">Harmonia</p>
            <h3 id="marketingModalTitle">${isEditing ? "Edit Marketing Material" : "New Marketing Material"}</h3>
          </div>

          <button class="marketing-modal-close" type="button" data-close-marketing-modal aria-label="Close">×</button>
        </div>

        <div class="marketing-form-grid">
          
<label class="marketing-field">
  <span>Title</span>
  <input id="marketingTitleInput" type="text" />
</label>
<label class="marketing-field">
  <span>Material type</span>
  <select id="marketingTypeInput">
    <option value="campaign">Campaign</option>
<option value="flyer">Flyer</option>
<option value="poster">Poster</option>
<option value="brochure">Brochure</option>
<option value="email">Email</option>
<option value="press">Press</option>
<option value="social">Social</option>
<option value="brand">Brand</option>
<option value="merch">Merch</option>
<option value="production">Production</option>
  </select>
</label>
<label class="marketing-field">
  <span>Status</span>
  <select id="marketingStatusInput">
    <option value="idea">Idea</option>
<option value="draft">Draft</option>
<option value="review">Review</option>
<option value="approved">Approved</option>
<option value="published">Published</option>
<option value="archived">Archived</option>
  </select>
</label>
<label class="marketing-field">
  <span>Target audience</span>
  <input id="marketingAudienceInput" type="text" />
</label>
<label class="marketing-field">
  <span>Channel or placement</span>
  <input id="marketingChannelInput" type="text" />
</label>
<label class="marketing-field">
  <span>Launch date</span>
  <input id="marketingLaunchDateInput" type="date" />
</label>
<label class="marketing-field">
  <span>Owner</span>
  <input id="marketingOwnerInput" type="text" />
</label>
<label class="marketing-field marketing-field-wide">
  <span>Objective</span>
  <textarea id="marketingObjectiveInput" rows="5"></textarea>
</label>
<label class="marketing-field marketing-field-wide">
  <span>Core message or copy</span>
  <textarea id="marketingMessageInput" rows="5"></textarea>
</label>
<label class="marketing-field">
  <span>Asset URL</span>
  <input id="marketingAssetUrlInput" type="url" />
</label>
<label class="marketing-field marketing-field-wide">
  <span>Production notes</span>
  <textarea id="marketingProductionNotesInput" rows="5"></textarea>
</label>
<label class="marketing-field">
  <span>Budget</span>
  <input id="marketingBudgetInput" type="number" />
</label>
        </div>

        <div class="marketing-modal-actions">
          <button class="text-button" type="button" data-close-marketing-modal>Cancel</button>
          <button class="primary-button" type="button" id="saveMarketingButton">${isEditing ? "Save changes" : "Create marketing material"}</button>
        </div>
      </section>
    `;

    const titleInput = document.getElementById("marketingTitleInput");
    if (titleInput) titleInput.value = item.title ?? "";
const typeInput = document.getElementById("marketingTypeInput");
    if (typeInput) typeInput.value = item.type ?? "";
const statusInput = document.getElementById("marketingStatusInput");
    if (statusInput) statusInput.value = item.status ?? "";
const audienceInput = document.getElementById("marketingAudienceInput");
    if (audienceInput) audienceInput.value = item.audience ?? "";
const channelInput = document.getElementById("marketingChannelInput");
    if (channelInput) channelInput.value = item.channel ?? "";
const launchDateInput = document.getElementById("marketingLaunchDateInput");
    if (launchDateInput) launchDateInput.value = item.launchDate ?? "";
const ownerInput = document.getElementById("marketingOwnerInput");
    if (ownerInput) ownerInput.value = item.owner ?? "";
const objectiveInput = document.getElementById("marketingObjectiveInput");
    if (objectiveInput) objectiveInput.value = item.objective ?? "";
const messageInput = document.getElementById("marketingMessageInput");
    if (messageInput) messageInput.value = item.message ?? "";
const assetUrlInput = document.getElementById("marketingAssetUrlInput");
    if (assetUrlInput) assetUrlInput.value = item.assetUrl ?? "";
const productionNotesInput = document.getElementById("marketingProductionNotesInput");
    if (productionNotesInput) productionNotesInput.value = item.productionNotes ?? "";
const budgetInput = document.getElementById("marketingBudgetInput");
    if (budgetInput) budgetInput.value = item.budget ?? "";

    modal.querySelectorAll("[data-close-marketing-modal]").forEach((button) => {
        button.addEventListener("click", closeMarketingModal);
    });

    document.getElementById("saveMarketingButton")?.addEventListener("click", saveMarketingModal);
}

function openMarketingModal(itemId = null) {
    activeMarketingItemId = itemId;
    const item = itemId ? window.HarmoniaMarketing?.getById(itemId) : null;
    renderMarketingModal(item);

    const modal = getMarketingModalElement();
    if (!modal) return;

    modal.hidden = false;
    document.body.classList.add("marketing-modal-open");
    document.addEventListener("keydown", handleMarketingModalKeydown);
}

function closeMarketingModal() {
    const modal = getMarketingModalElement();
    if (modal) modal.hidden = true;

    activeMarketingItemId = null;
    document.body.classList.remove("marketing-modal-open");
    document.removeEventListener("keydown", handleMarketingModalKeydown);
}

function handleMarketingModalKeydown(event) {
    if (event.key === "Escape") closeMarketingModal();
}

function collectMarketingModalData() {
    return {
      title: document.getElementById("marketingTitleInput")?.value.trim() || "",
      type: document.getElementById("marketingTypeInput")?.value || "campaign",
      status: document.getElementById("marketingStatusInput")?.value || "idea",
      audience: document.getElementById("marketingAudienceInput")?.value.trim() || "",
      channel: document.getElementById("marketingChannelInput")?.value.trim() || "",
      launchDate: document.getElementById("marketingLaunchDateInput")?.value.trim() || "",
      owner: document.getElementById("marketingOwnerInput")?.value.trim() || "",
      objective: document.getElementById("marketingObjectiveInput")?.value.trim() || "",
      message: document.getElementById("marketingMessageInput")?.value.trim() || "",
      assetUrl: document.getElementById("marketingAssetUrlInput")?.value.trim() || "",
      productionNotes: document.getElementById("marketingProductionNotesInput")?.value.trim() || "",
      budget: Number(document.getElementById("marketingBudgetInput")?.value || 0)
    };
}

function saveMarketingModal() {
    if (!window.HarmoniaMarketing) {
        console.error("HarmoniaMarketing is unavailable.");
        return;
    }

    const data = collectMarketingModalData();

    if (!data.title) {
        window.alert("Please complete the first required field.");
        return;
    }

    if (activeMarketingItemId) {
        window.HarmoniaMarketing.update(activeMarketingItemId, data);
    } else {
        window.HarmoniaMarketing.create(data);
    }

    closeMarketingModal();
}

window.openMarketingModal = openMarketingModal;
window.closeMarketingModal = closeMarketingModal;

console.log("✅ Marketing Modal Loaded");