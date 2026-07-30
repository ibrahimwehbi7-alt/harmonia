let activeMessagesItemId = null;

function getMessagesModalElement() {
    return document.getElementById("messagesModal");
}

function createMessagesModalElement() {
    const existingModal = getMessagesModalElement();
    if (existingModal) return existingModal;

    const modal = document.createElement("div");
    modal.className = "messages-modal";
    modal.id = "messagesModal";
    modal.hidden = true;
    document.body.appendChild(modal);
    return modal;
}

function renderMessagesModal(item = null) {
    const modal = createMessagesModalElement();
    const isEditing = Boolean(item);
    item = item || {"subject": "", "senderName": "", "senderEmail": "", "type": "", "status": "", "receivedDate": "", "followUpDate": "", "body": "", "internalNotes": ""};

    modal.innerHTML = `
      <div class="messages-modal-backdrop" data-close-messages-modal></div>

      <section class="messages-modal-panel" role="dialog" aria-modal="true" aria-labelledby="messagesModalTitle">
        <div class="messages-modal-header">
          <div>
            <p class="panel-label">Harmonia</p>
            <h3 id="messagesModalTitle">${isEditing ? "Edit Message" : "New Message"}</h3>
          </div>

          <button class="messages-modal-close" type="button" data-close-messages-modal aria-label="Close">×</button>
        </div>

        <div class="messages-form-grid">
          
<label class="messages-field">
  <span>Subject</span>
  <input id="messagesSubjectInput" type="text" />
</label>
<label class="messages-field">
  <span>Sender name</span>
  <input id="messagesSenderNameInput" type="text" />
</label>
<label class="messages-field">
  <span>Sender email</span>
  <input id="messagesSenderEmailInput" type="email" />
</label>
<label class="messages-field">
  <span>Message type</span>
  <select id="messagesTypeInput">
    <option value="inquiry">Inquiry</option>
<option value="partnership">Partnership</option>
<option value="sponsorship">Sponsorship</option>
<option value="volunteer">Volunteer</option>
<option value="press">Press</option>
<option value="internal">Internal</option>
<option value="other">Other</option>
  </select>
</label>
<label class="messages-field">
  <span>Status</span>
  <select id="messagesStatusInput">
    <option value="unread">Unread</option>
<option value="open">Open</option>
<option value="waiting">Waiting</option>
<option value="resolved">Resolved</option>
<option value="archived">Archived</option>
  </select>
</label>
<label class="messages-field">
  <span>Received date</span>
  <input id="messagesReceivedDateInput" type="date" />
</label>
<label class="messages-field">
  <span>Follow-up date</span>
  <input id="messagesFollowUpDateInput" type="date" />
</label>
<label class="messages-field messages-field-wide">
  <span>Message</span>
  <textarea id="messagesBodyInput" rows="5"></textarea>
</label>
<label class="messages-field messages-field-wide">
  <span>Internal notes</span>
  <textarea id="messagesInternalNotesInput" rows="5"></textarea>
</label>
        </div>

        <div class="messages-modal-actions">
          <button class="text-button" type="button" data-close-messages-modal>Cancel</button>
          <button class="primary-button" type="button" id="saveMessagesButton">${isEditing ? "Save changes" : "Create message"}</button>
        </div>
      </section>
    `;

    const subjectInput = document.getElementById("messagesSubjectInput");
    if (subjectInput) subjectInput.value = item.subject ?? "";
const senderNameInput = document.getElementById("messagesSenderNameInput");
    if (senderNameInput) senderNameInput.value = item.senderName ?? "";
const senderEmailInput = document.getElementById("messagesSenderEmailInput");
    if (senderEmailInput) senderEmailInput.value = item.senderEmail ?? "";
const typeInput = document.getElementById("messagesTypeInput");
    if (typeInput) typeInput.value = item.type ?? "";
const statusInput = document.getElementById("messagesStatusInput");
    if (statusInput) statusInput.value = item.status ?? "";
const receivedDateInput = document.getElementById("messagesReceivedDateInput");
    if (receivedDateInput) receivedDateInput.value = item.receivedDate ?? "";
const followUpDateInput = document.getElementById("messagesFollowUpDateInput");
    if (followUpDateInput) followUpDateInput.value = item.followUpDate ?? "";
const bodyInput = document.getElementById("messagesBodyInput");
    if (bodyInput) bodyInput.value = item.body ?? "";
const internalNotesInput = document.getElementById("messagesInternalNotesInput");
    if (internalNotesInput) internalNotesInput.value = item.internalNotes ?? "";

    modal.querySelectorAll("[data-close-messages-modal]").forEach((button) => {
        button.addEventListener("click", closeMessagesModal);
    });

    document.getElementById("saveMessagesButton")?.addEventListener("click", saveMessagesModal);
}

function openMessagesModal(itemId = null) {
    activeMessagesItemId = itemId;
    const item = itemId ? window.HarmoniaMessages?.getById(itemId) : null;
    renderMessagesModal(item);

    const modal = getMessagesModalElement();
    if (!modal) return;

    modal.hidden = false;
    document.body.classList.add("messages-modal-open");
    document.addEventListener("keydown", handleMessagesModalKeydown);
}

function closeMessagesModal() {
    const modal = getMessagesModalElement();
    if (modal) modal.hidden = true;

    activeMessagesItemId = null;
    document.body.classList.remove("messages-modal-open");
    document.removeEventListener("keydown", handleMessagesModalKeydown);
}

function handleMessagesModalKeydown(event) {
    if (event.key === "Escape") closeMessagesModal();
}

function collectMessagesModalData() {
    return {
      subject: document.getElementById("messagesSubjectInput")?.value.trim() || "",
      senderName: document.getElementById("messagesSenderNameInput")?.value.trim() || "",
      senderEmail: document.getElementById("messagesSenderEmailInput")?.value.trim() || "",
      type: document.getElementById("messagesTypeInput")?.value || "inquiry",
      status: document.getElementById("messagesStatusInput")?.value || "unread",
      receivedDate: document.getElementById("messagesReceivedDateInput")?.value.trim() || "",
      followUpDate: document.getElementById("messagesFollowUpDateInput")?.value.trim() || "",
      body: document.getElementById("messagesBodyInput")?.value.trim() || "",
      internalNotes: document.getElementById("messagesInternalNotesInput")?.value.trim() || ""
    };
}

function saveMessagesModal() {
    if (!window.HarmoniaMessages) {
        console.error("HarmoniaMessages is unavailable.");
        return;
    }

    const data = collectMessagesModalData();

    if (!data.subject) {
        window.alert("Please complete the first required field.");
        return;
    }

    if (activeMessagesItemId) {
        window.HarmoniaMessages.update(activeMessagesItemId, data);
    } else {
        window.HarmoniaMessages.create(data);
    }

    closeMessagesModal();
}

window.openMessagesModal = openMessagesModal;
window.closeMessagesModal = closeMessagesModal;

console.log("✅ Messages Modal Loaded");