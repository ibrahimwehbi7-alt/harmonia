let activeTaskFilter = "all";

function formatTaskDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getPriorityRank(priority) {
  const ranks = {
    high: 1,
    medium: 2,
    low: 3
  };

  return ranks[priority] || 4;
}

function sortTasks(tasks) {
  return [...tasks].sort((firstTask, secondTask) => {
    if (firstTask.completed !== secondTask.completed) {
      return Number(firstTask.completed) - Number(secondTask.completed);
    }

    const priorityDifference =
      getPriorityRank(firstTask.priority) -
      getPriorityRank(secondTask.priority);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    if (firstTask.dueDate && secondTask.dueDate) {
      return firstTask.dueDate.localeCompare(secondTask.dueDate);
    }

    if (firstTask.dueDate) return -1;
    if (secondTask.dueDate) return 1;

    return new Date(secondTask.createdAt) - new Date(firstTask.createdAt);
  });
}

function filterTasks(tasks) {
  switch (activeTaskFilter) {
    case "open":
      return tasks.filter((task) => !task.completed);

    case "completed":
      return tasks.filter((task) => task.completed);

    case "high":
      return tasks.filter(
        (task) => task.priority === "high" && !task.completed
      );

    default:
      return tasks;
  }
}

function createTaskElement(task) {
  const taskItem = document.createElement("article");
  taskItem.className = "focus-item task-card";

  if (task.completed) {
    taskItem.classList.add("completed");
  }

  taskItem.dataset.taskId = task.id;

  const taskMain = document.createElement("div");
  taskMain.className = "task-main";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute(
    "aria-label",
    task.completed
      ? `Mark ${task.title} as incomplete`
      : `Mark ${task.title} as complete`
  );

  checkbox.addEventListener("change", () => {
    window.HarmoniaTasks.toggle(task.id);
    renderTasks();
  });

  const taskContent = document.createElement("div");
  taskContent.className = "task-content";

  const taskTitle = document.createElement("strong");
  taskTitle.textContent = task.title;

  const taskDetails = document.createElement("small");
  taskDetails.textContent =
    task.details || "No additional details.";

  const taskMeta = document.createElement("div");
  taskMeta.className = "task-meta";

  const priorityBadge = document.createElement("span");
  priorityBadge.className = `task-priority ${task.priority}`;
  priorityBadge.textContent = `${task.priority} priority`;

  taskMeta.appendChild(priorityBadge);

  if (task.dueDate) {
    const dueDate = document.createElement("span");
    dueDate.className = "task-due-date";
    dueDate.textContent = `Due ${formatTaskDate(task.dueDate)}`;
    taskMeta.appendChild(dueDate);
  }

  taskContent.appendChild(taskTitle);
  taskContent.appendChild(taskDetails);
  taskContent.appendChild(taskMeta);

  taskMain.appendChild(checkbox);
  taskMain.appendChild(taskContent);

  const taskActions = document.createElement("div");
  taskActions.className = "task-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "task-action-button";
  editButton.textContent = "Edit";

  editButton.addEventListener("click", () => {
    window.openTaskModal(task);
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "task-action-button danger";
  deleteButton.textContent = "Delete";

  deleteButton.addEventListener("click", () => {
    const confirmed = window.confirm(
      `Delete "${task.title}"?`
    );

    if (!confirmed) return;

    window.HarmoniaTasks.delete(task.id);
    renderTasks();
  });

  taskActions.appendChild(editButton);
  taskActions.appendChild(deleteButton);

  taskItem.appendChild(taskMain);
  taskItem.appendChild(taskActions);

  return taskItem;
}

function renderTasks() {
  const focusList = document.getElementById("focusList");
  const emptyState = document.getElementById("taskEmptyState");

  if (!focusList || !emptyState) return;

  const allTasks = window.HarmoniaTasks.getAll();
  const visibleTasks = sortTasks(filterTasks(allTasks));

  focusList.innerHTML = "";

  visibleTasks.forEach((task) => {
    focusList.appendChild(createTaskElement(task));
  });

  emptyState.hidden = visibleTasks.length > 0;
}

function initializeDashboardDate() {
  const dateElement = document.getElementById("dashboardDate");

  if (!dateElement) return;

  const now = new Date();

  dateElement.textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function initializeTaskFilter() {
  const taskFilter = document.getElementById("taskFilter");

  if (!taskFilter) return;

  taskFilter.addEventListener("change", () => {
    activeTaskFilter = taskFilter.value;
    renderTasks();
  });
}

function initializeDashboard() {
  initializeDashboardDate();

  window.HarmoniaTasks.load();

  initializeTaskFilter();
  window.initializeTaskModal();

  renderTasks();
}

window.renderTasks = renderTasks;
window.initializeDashboard = initializeDashboard;