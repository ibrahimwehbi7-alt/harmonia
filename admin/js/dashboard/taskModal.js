let activeTaskId = null;

function getTaskModalElements() {
  return {
    modal: document.getElementById("taskModal"),
    modalTitle: document.getElementById("taskModalTitle"),
    titleInput: document.getElementById("taskTitleInput"),
    detailsInput: document.getElementById("taskDetailsInput"),
    priorityInput: document.getElementById("taskPriorityInput"),
    dueDateInput: document.getElementById("taskDueDateInput"),
    saveButton: document.getElementById("saveTaskButton")
  };
}

function resetTaskForm() {
  const {
    modalTitle,
    titleInput,
    detailsInput,
    priorityInput,
    dueDateInput,
    saveButton
  } = getTaskModalElements();

  activeTaskId = null;

  modalTitle.textContent = "Add Task";
  titleInput.value = "";
  detailsInput.value = "";
  priorityInput.value = "medium";
  dueDateInput.value = "";
  saveButton.textContent = "Save task";
}

function openTaskModal(task = null) {
  const {
    modal,
    modalTitle,
    titleInput,
    detailsInput,
    priorityInput,
    dueDateInput,
    saveButton
  } = getTaskModalElements();

  if (!modal) return;

  if (task) {
    activeTaskId = task.id;

    modalTitle.textContent = "Edit Task";
    titleInput.value = task.title || "";
    detailsInput.value = task.details || "";
    priorityInput.value = task.priority || "medium";
    dueDateInput.value = task.dueDate || "";
    saveButton.textContent = "Save changes";
  } else {
    resetTaskForm();
  }

  modal.hidden = false;
  document.body.classList.add("modal-open");

  window.setTimeout(() => {
    titleInput.focus();
  }, 0);
}

function closeTaskModal() {
  const { modal } = getTaskModalElements();

  if (!modal) return;

  modal.hidden = true;
  document.body.classList.remove("modal-open");

  resetTaskForm();
}

function saveTaskFromModal() {
  const {
    titleInput,
    detailsInput,
    priorityInput,
    dueDateInput
  } = getTaskModalElements();

  const title = titleInput.value.trim();

  if (!title) {
    titleInput.focus();
    titleInput.setCustomValidity("Please enter a task name.");
    titleInput.reportValidity();
    return;
  }

  titleInput.setCustomValidity("");

  const taskData = {
    title,
    details: detailsInput.value.trim(),
    priority: priorityInput.value,
    dueDate: dueDateInput.value
  };

  if (activeTaskId) {
    window.HarmoniaTasks.update(activeTaskId, taskData);
  } else {
    window.HarmoniaTasks.add(taskData);
  }

  closeTaskModal();

  if (typeof window.renderTasks === "function") {
    window.renderTasks();
  }
}

function initializeTaskModal() {
  const addTaskButton = document.getElementById("addTaskButton");
  const saveTaskButton = document.getElementById("saveTaskButton");
  const titleInput = document.getElementById("taskTitleInput");
  const closeButtons = document.querySelectorAll("[data-close-task-modal]");

  if (!addTaskButton || !saveTaskButton) return;

  addTaskButton.addEventListener("click", () => {
    openTaskModal();
  });

  saveTaskButton.addEventListener("click", saveTaskFromModal);

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeTaskModal);
  });

  titleInput.addEventListener("input", () => {
    titleInput.setCustomValidity("");
  });

  document.addEventListener("keydown", (event) => {
    const { modal } = getTaskModalElements();

    if (!modal || modal.hidden) return;

    if (event.key === "Escape") {
      closeTaskModal();
    }

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      document.activeElement !== document.getElementById("taskDetailsInput")
    ) {
      event.preventDefault();
      saveTaskFromModal();
    }
  });
}

window.openTaskModal = openTaskModal;
window.closeTaskModal = closeTaskModal;
window.initializeTaskModal = initializeTaskModal;