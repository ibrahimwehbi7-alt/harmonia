let activeFinanceItemId = null;

function getFinanceModalElement() {
    return document.getElementById("financeModal");
}

function createFinanceModalElement() {
    const existingModal = getFinanceModalElement();
    if (existingModal) return existingModal;

    const modal = document.createElement("div");
    modal.className = "finance-modal";
    modal.id = "financeModal";
    modal.hidden = true;
    document.body.appendChild(modal);
    return modal;
}

function renderFinanceModal(item = null) {
    const modal = createFinanceModalElement();
    const isEditing = Boolean(item);
    item = item || {"title": "", "kind": "", "status": "", "amount": "", "date": "", "organization": "", "category": "", "project": "", "reference": "", "notes": ""};

    modal.innerHTML = `
      <div class="finance-modal-backdrop" data-close-finance-modal></div>

      <section class="finance-modal-panel" role="dialog" aria-modal="true" aria-labelledby="financeModalTitle">
        <div class="finance-modal-header">
          <div>
            <p class="panel-label">Harmonia</p>
            <h3 id="financeModalTitle">${isEditing ? "Edit Finance Record" : "New Finance Record"}</h3>
          </div>

          <button class="finance-modal-close" type="button" data-close-finance-modal aria-label="Close">×</button>
        </div>

        <div class="finance-form-grid">
          
<label class="finance-field">
  <span>Record title</span>
  <input id="financeTitleInput" type="text" />
</label>
<label class="finance-field">
  <span>Kind</span>
  <select id="financeKindInput">
    <option value="income">Income</option>
<option value="expense">Expense</option>
<option value="grant">Grant</option>
<option value="sponsorship">Sponsorship</option>
<option value="donation">Donation</option>
<option value="budget">Budget</option>
  </select>
</label>
<label class="finance-field">
  <span>Status</span>
  <select id="financeStatusInput">
    <option value="planned">Planned</option>
<option value="pending">Pending</option>
<option value="received">Received</option>
<option value="paid">Paid</option>
<option value="overdue">Overdue</option>
<option value="cancelled">Cancelled</option>
  </select>
</label>
<label class="finance-field">
  <span>Amount</span>
  <input id="financeAmountInput" type="number" />
</label>
<label class="finance-field">
  <span>Date</span>
  <input id="financeDateInput" type="date" />
</label>
<label class="finance-field">
  <span>Organization or vendor</span>
  <input id="financeOrganizationInput" type="text" />
</label>
<label class="finance-field">
  <span>Category</span>
  <input id="financeCategoryInput" type="text" />
</label>
<label class="finance-field">
  <span>Related project</span>
  <input id="financeProjectInput" type="text" />
</label>
<label class="finance-field">
  <span>Reference or invoice</span>
  <input id="financeReferenceInput" type="text" />
</label>
<label class="finance-field finance-field-wide">
  <span>Notes</span>
  <textarea id="financeNotesInput" rows="5"></textarea>
</label>
        </div>

        <div class="finance-modal-actions">
          <button class="text-button" type="button" data-close-finance-modal>Cancel</button>
          <button class="primary-button" type="button" id="saveFinanceButton">${isEditing ? "Save changes" : "Create finance record"}</button>
        </div>
      </section>
    `;

    const titleInput = document.getElementById("financeTitleInput");
    if (titleInput) titleInput.value = item.title ?? "";
const kindInput = document.getElementById("financeKindInput");
    if (kindInput) kindInput.value = item.kind ?? "";
const statusInput = document.getElementById("financeStatusInput");
    if (statusInput) statusInput.value = item.status ?? "";
const amountInput = document.getElementById("financeAmountInput");
    if (amountInput) amountInput.value = item.amount ?? "";
const dateInput = document.getElementById("financeDateInput");
    if (dateInput) dateInput.value = item.date ?? "";
const organizationInput = document.getElementById("financeOrganizationInput");
    if (organizationInput) organizationInput.value = item.organization ?? "";
const categoryInput = document.getElementById("financeCategoryInput");
    if (categoryInput) categoryInput.value = item.category ?? "";
const projectInput = document.getElementById("financeProjectInput");
    if (projectInput) projectInput.value = item.project ?? "";
const referenceInput = document.getElementById("financeReferenceInput");
    if (referenceInput) referenceInput.value = item.reference ?? "";
const notesInput = document.getElementById("financeNotesInput");
    if (notesInput) notesInput.value = item.notes ?? "";

    modal.querySelectorAll("[data-close-finance-modal]").forEach((button) => {
        button.addEventListener("click", closeFinanceModal);
    });

    document.getElementById("saveFinanceButton")?.addEventListener("click", saveFinanceModal);
}

function openFinanceModal(itemId = null) {
    activeFinanceItemId = itemId;
    const item = itemId ? window.HarmoniaFinance?.getById(itemId) : null;
    renderFinanceModal(item);

    const modal = getFinanceModalElement();
    if (!modal) return;

    modal.hidden = false;
    document.body.classList.add("finance-modal-open");
    document.addEventListener("keydown", handleFinanceModalKeydown);
}

function closeFinanceModal() {
    const modal = getFinanceModalElement();
    if (modal) modal.hidden = true;

    activeFinanceItemId = null;
    document.body.classList.remove("finance-modal-open");
    document.removeEventListener("keydown", handleFinanceModalKeydown);
}

function handleFinanceModalKeydown(event) {
    if (event.key === "Escape") closeFinanceModal();
}

function collectFinanceModalData() {
    return {
      title: document.getElementById("financeTitleInput")?.value.trim() || "",
      kind: document.getElementById("financeKindInput")?.value || "income",
      status: document.getElementById("financeStatusInput")?.value || "planned",
      amount: Number(document.getElementById("financeAmountInput")?.value || 0),
      date: document.getElementById("financeDateInput")?.value.trim() || "",
      organization: document.getElementById("financeOrganizationInput")?.value.trim() || "",
      category: document.getElementById("financeCategoryInput")?.value.trim() || "",
      project: document.getElementById("financeProjectInput")?.value.trim() || "",
      reference: document.getElementById("financeReferenceInput")?.value.trim() || "",
      notes: document.getElementById("financeNotesInput")?.value.trim() || ""
    };
}

function saveFinanceModal() {
    if (!window.HarmoniaFinance) {
        console.error("HarmoniaFinance is unavailable.");
        return;
    }

    const data = collectFinanceModalData();

    if (!data.title) {
        window.alert("Please complete the first required field.");
        return;
    }

    if (activeFinanceItemId) {
        window.HarmoniaFinance.update(activeFinanceItemId, data);
    } else {
        window.HarmoniaFinance.create(data);
    }

    closeFinanceModal();
}

window.openFinanceModal = openFinanceModal;
window.closeFinanceModal = closeFinanceModal;

console.log("✅ Finance Modal Loaded");