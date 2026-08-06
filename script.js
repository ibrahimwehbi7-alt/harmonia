const API_URL = (window.HARMONIA_CONFIG?.apiBaseUrl || "https://harmonia-production-720f.up.railway.app").replace(/\/+$/, "");
const SLUG = "the-harmonia-project";
const fallback = {
  homepage: { aboutPanelLabel: "What is\nThe Harmonia\nProject", connectPanelLabel: "Connect", upcomingPanelLabel: "Upcoming", galleryPanelLabel: "Gallery" },
  about: { title: "What is The Harmonia Project", paragraph1: "The Harmonia Project is a philanthropic initiative dedicated to fostering greater community harmony. In a time of increasing division, we believe meaningful progress begins by finding common ground, encouraging understanding, and bringing people together around shared values and shared purpose.", paragraph2: "Each year, the Harmonia Project focuses on a pressing issue affecting our communities. Through dialogue, education, service, advocacy, and collaborative action, we strive to create lasting, positive change while empowering individuals to become active leaders and engaged citizens.", paragraph3: "Our mission is rooted in the belief that lasting harmony is not achieved through agreement alone, but through respectful conversation, genuine connection, and collective action." },
  connect: { title: "Connection is where change begins.", paragraph1: "The Harmonia Project exists because meaningful progress starts when people choose to listen, collaborate, and act together. Whether you're an individual with an idea, a nonprofit seeking a partner, a business looking to give back, or someone searching for a way to make a difference, we'd love to hear from you.", paragraph2: "Every conversation has the potential to spark a new initiative, every partnership can strengthen a community, and every person has something valuable to contribute." },
  gallery: { title: "Moments of connection.", items: [] },
  partners: { title: "Organizations building harmony with us.", items: [] }
};
const state = { pages: structuredClone(fallback), events: [], eventsUnavailable: false };
const pages = [...document.querySelectorAll(".page")];
const home = document.getElementById("home");
const back = document.getElementById("backButton");
function openPage(id) { home.classList.add("leaving"); setTimeout(() => { home.classList.remove("active", "leaving"); pages.forEach(p => p.classList.toggle("active", p.id === id)); document.body.classList.add("internal-page"); back.hidden = false; window.scrollTo(0, 0); }, 260); }
function showHome() { pages.forEach(p => p.classList.remove("active")); document.body.classList.remove("internal-page"); home.classList.add("active"); back.hidden = true; window.scrollTo(0, 0); }
document.querySelectorAll(".panel").forEach(p => p.addEventListener("click", () => openPage(p.dataset.target)));
back.addEventListener("click", showHome);
document.getElementById("homeButton").addEventListener("click", showHome);
function text(sel, value) { const el = document.querySelector(sel); if (el && value) el.textContent = value; }
function paras(sel, values) { const el = document.querySelector(sel); if (!el) return; el.innerHTML = ""; values.filter(Boolean).forEach(value => { const p = document.createElement("p"); p.textContent = value; el.appendChild(p); }); }
function apply() {
  const h = state.pages.homepage, a = state.pages.about, c = state.pages.connect;
  [[".panel-about span", h.aboutPanelLabel], [".panel-connect span", h.connectPanelLabel], [".panel-upcoming span", h.upcomingPanelLabel], [".panel-gallery span", h.galleryPanelLabel]].forEach(([sel, value]) => { const el = document.querySelector(sel); if (el) { el.textContent = String(value || "").replace(/\\n/g, "\n"); el.style.whiteSpace = "pre-line"; } });
  text("#about-title", a.title); paras("#about .editable-copy", [a.paragraph1, a.paragraph2, a.paragraph3]);
  text("#connect-title", c.title); paras("#connect .editable-copy", [c.paragraph1, c.paragraph2]);
  text("#gallery-title", state.pages.gallery.title); text("#partners-title", state.pages.partners.title);
  renderEvents(); renderGallery(); renderPartners();
}
function eventDate(event) {
  const options = { dateStyle: "long", timeStyle: "short", timeZone: event.timezone || "America/Chicago" };
  try { return new Intl.DateTimeFormat("en-US", options).format(new Date(event.startAt)); }
  catch { return new Date(event.startAt).toLocaleString(); }
}
function renderEvents() {
  const grid = document.getElementById("eventGrid"); grid.innerHTML = "";
  if (state.eventsUnavailable) { grid.innerHTML = '<article class="event-card event-card-message"><div><div class="event-date">Temporarily unavailable</div><h2>Upcoming events could not be loaded.</h2><p>Please check again shortly.</p></div></article>'; return; }
  if (!state.events.length) { grid.innerHTML = '<article class="event-card event-card-message"><div><div class="event-date">Coming Soon</div><h2>New gatherings are being planned.</h2></div></article>'; return; }
  state.events.forEach(event => {
    const card = document.createElement("article");
    card.className = `event-card${event.featured ? " event-card-featured" : ""}`;
    const content = document.createElement("div");
    const date = document.createElement("div"); date.className = "event-date"; date.textContent = eventDate(event);
    if (event.featured) { const badge = document.createElement("span"); badge.className = "event-featured-badge"; badge.textContent = "Featured"; date.appendChild(badge); }
    const title = document.createElement("h2"); title.textContent = event.title;
    const description = document.createElement("p"); description.textContent = event.description || "";
    const place = document.createElement("strong"); place.textContent = event.location || (event.virtualUrl ? "Online" : "Details forthcoming");
    content.append(date, title, description, place); card.appendChild(content);
    const href = event.registrationUrl || event.virtualUrl;
    if (href) { const link = document.createElement("a"); link.className = "secondary-button"; link.href = href; link.target = "_blank"; link.rel = "noopener"; link.textContent = event.registrationUrl ? "Learn more" : "Join online"; card.appendChild(link); }
    grid.appendChild(card);
  });
}
function renderGallery() { const grid = document.getElementById("galleryGrid"); grid.innerHTML = ""; const items = state.pages.gallery.items || []; if (!items.length) { grid.innerHTML = '<div class="gallery-item"><div style="height:100%;display:grid;place-items:center;padding:2rem;text-align:center">Published Harmonia photos will appear here.</div></div>'; return; } items.forEach(item => { const figure = document.createElement("figure"); figure.className = "gallery-item"; const image = document.createElement("img"); image.src = item.imageUrl; image.alt = item.altText || item.title || "Harmonia photo"; figure.appendChild(image); grid.appendChild(figure); }); }
function renderPartners() { const grid = document.getElementById("partnersPublicGrid"); if (!grid) return; grid.innerHTML = ""; const items = state.pages.partners.items || []; if (!items.length) { grid.innerHTML = "<p>Partner organizations will appear here as they are published.</p>"; return; } items.forEach(item => { const card = document.createElement("article"); card.className = "partner-public-card"; const h = document.createElement("h3"); h.textContent = item.name; const p = document.createElement("p"); p.textContent = item.description || item.sector || ""; card.append(h, p); if (item.website) { const link = document.createElement("a"); link.href = item.website; link.target = "_blank"; link.rel = "noopener"; link.textContent = "Visit website"; card.appendChild(link); } grid.appendChild(card); }); }
async function fetchJson(url, timeoutMs = 10000) { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs); try { const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } }); if (!response.ok) throw new Error(`${response.status} ${response.statusText}`); return await response.json(); } finally { clearTimeout(timer); } }
async function load() {
  const [siteResult, eventResult] = await Promise.allSettled([fetchJson(`${API_URL}/public/site/${SLUG}`), fetchJson(`${API_URL}/public/site/${SLUG}/events?limit=12`)]);
  if (siteResult.status === "fulfilled") { for (const [key, value] of Object.entries(siteResult.value.pages || {})) state.pages[key] = { ...(fallback[key] || {}), ...(value.data || {}) }; }
  else console.warn("Using website fallback content", siteResult.reason);
  if (eventResult.status === "fulfilled") { state.events = Array.isArray(eventResult.value) ? eventResult.value : []; state.eventsUnavailable = false; }
  else { state.events = []; state.eventsUnavailable = true; console.warn("Upcoming events could not be loaded", eventResult.reason); }
  apply();
}
document.getElementById("contactForm").addEventListener("submit", async event => { event.preventDefault(); const form = event.currentTarget, status = document.getElementById("formStatus"), endpoint = window.HARMONIA_CONFIG?.formspreeEndpoint || ""; if (!endpoint || endpoint.includes("PASTE_")) { status.textContent = "The contact inbox has not been connected yet."; return; } try { const response = await fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } }); if (!response.ok) throw new Error("Request failed"); form.reset(); status.textContent = "Thank you. Your inquiry has been sent."; } catch { status.textContent = "We could not send your inquiry."; } });
document.getElementById("donateButton").addEventListener("click", () => { const url = window.HARMONIA_CONFIG?.stripePaymentLink || ""; if (url && !url.includes("PASTE_")) window.open(url, "_blank", "noopener"); });
document.getElementById("privacyButton")?.addEventListener("click", () => alert("Personal information is used only for submitted inquiries and authorized updates."));
document.getElementById("year").textContent = new Date().getFullYear();
apply(); load();
