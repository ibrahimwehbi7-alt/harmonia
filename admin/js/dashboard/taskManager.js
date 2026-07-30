const TASK_STORAGE_KEY = "harmonia.tasks";

let tasks = [];

function createTaskId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDefaultTasks() {
  return [
    {
      id: createTaskId(),
      title: "Finish Foundation Board remarks",
      details: "Prepare the five-minute leadership dinner reflection.",
      priority: "high",
      dueDate: "2026-09-07",
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: createTaskId(),
      title: "Publish Welcome Week information",
      details: "Confirm the event details before making the page public.",
      priority: "medium",
      dueDate: "",
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: createTaskId(),
      title: "Follow up with community partners",
      details: "Send the next partnership outreach messages.",
      priority: "low",
      dueDate: "",
      completed: false,
      createdAt: new Date().toISOString()
    }
  ];
}

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(TASK_STORAGE_KEY);

    if (!savedTasks) {
      tasks = getDefaultTasks();
      saveTasks();
      return tasks;
    }

    const parsedTasks = JSON.parse(savedTasks);

    tasks = Array.isArray(parsedTasks)
      ? parsedTasks
      : getDefaultTasks();
  } catch (error) {
    console.error("Unable to load Harmonia tasks:", error);
    tasks = getDefaultTasks();
    saveTasks();
  }

  return tasks;
}

function saveTasks() {
  localStorage.setItem(
    TASK_STORAGE_KEY,
    JSON.stringify(tasks)
  );
}

function getTasks() {
  return [...tasks];
}

function addTask(taskData) {
  const newTask = {
    id: createTaskId(),
    title: taskData.title.trim(),
    details: taskData.details.trim(),
    priority: taskData.priority || "medium",
    dueDate: taskData.dueDate || "",
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask);
  saveTasks();

  return newTask;
}

function updateTask(taskId, updates) {
  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    return null;
  }

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...updates
  };

  saveTasks();

  return tasks[taskIndex];
}

function toggleTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return null;
  }

  task.completed = !task.completed;
  saveTasks();

  return task;
}

function deleteTask(taskId) {
  const originalLength = tasks.length;

  tasks = tasks.filter((task) => task.id !== taskId);

  if (tasks.length === originalLength) {
    return false;
  }

  saveTasks();

  return true;
}

window.HarmoniaTasks = {
  load: loadTasks,
  save: saveTasks,
  getAll: getTasks,
  add: addTask,
  update: updateTask,
  toggle: toggleTask,
  delete: deleteTask
};