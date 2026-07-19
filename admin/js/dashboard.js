function initializeDashboard() {
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

window.initializeDashboard = initializeDashboard;