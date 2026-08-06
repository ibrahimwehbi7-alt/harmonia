(function () {
    "use strict";

    const OVERLAY_ID = "harmonia-auth-overlay";
    const FORM_ID = "harmonia-login-form";
    const STYLE_ID = "harmonia-auth-styles";
    const STATUS_ID = "harmonia-auth-status";

    let currentUser = null;
    let initialized = false;
    let loginVisible = false;
    let observer = null;

    function ensureStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            #${OVERLAY_ID} {
                position: fixed !important;
                inset: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: 2147483647 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-sizing: border-box !important;
                padding: 24px !important;
                margin: 0 !important;
                overflow: auto !important;
                background: rgba(7, 26, 53, 0.94) !important;
            }

            #${OVERLAY_ID}[hidden] {
                display: none !important;
            }

            #${OVERLAY_ID} .harmonia-auth-card {
                position: relative !important;
                inset: auto !important;
                width: min(440px, calc(100vw - 48px)) !important;
                max-height: calc(100vh - 48px) !important;
                box-sizing: border-box !important;
                margin: auto !important;
                padding: 32px !important;
                overflow-y: auto !important;
                transform: none !important;
                background: #f8f7f3 !important;
                color: #071a35 !important;
                border-radius: 18px !important;
                box-shadow: 0 28px 80px rgba(0, 0, 0, 0.35) !important;
                font-family: Arial, sans-serif !important;
            }

            #${OVERLAY_ID} .harmonia-auth-card h1 {
                margin: 0 0 8px !important;
                font-family: Georgia, serif !important;
            }

            #${OVERLAY_ID} .harmonia-auth-card p {
                margin: 0 0 20px !important;
                line-height: 1.5 !important;
            }

            #${OVERLAY_ID} .harmonia-auth-field {
                display: grid !important;
                gap: 7px !important;
                margin-bottom: 14px !important;
            }

            #${OVERLAY_ID} .harmonia-auth-field input {
                width: 100% !important;
                box-sizing: border-box !important;
                border: 1px solid rgba(7, 26, 53, 0.25) !important;
                border-radius: 10px !important;
                padding: 12px 14px !important;
                font: inherit !important;
            }

            #${OVERLAY_ID} .harmonia-auth-remember {
                display: flex !important;
                align-items: center !important;
                grid-template-columns: none !important;
                gap: 9px !important;
            }

            #${OVERLAY_ID} .harmonia-auth-remember input {
                width: auto !important;
                flex: 0 0 auto !important;
            }

            #${OVERLAY_ID} .harmonia-auth-actions {
                display: flex !important;
                gap: 12px !important;
                align-items: center !important;
            }

            #${OVERLAY_ID} .harmonia-auth-button {
                border: 0 !important;
                border-radius: 10px !important;
                padding: 12px 18px !important;
                background: #071a35 !important;
                color: white !important;
                font-weight: 700 !important;
                cursor: pointer !important;
            }

            #${OVERLAY_ID} .harmonia-auth-button[disabled] {
                opacity: 0.6 !important;
                cursor: wait !important;
            }

            #${OVERLAY_ID} .harmonia-auth-error {
                color: #a21b1b !important;
                min-height: 22px !important;
                margin-top: 12px !important;
            }

            .harmonia-auth-status {
                position: fixed !important;
                right: 18px !important;
                bottom: 18px !important;
                z-index: 2147483000 !important;
                background: #071a35 !important;
                color: white !important;
                padding: 10px 14px !important;
                border-radius: 999px !important;
                font: 13px Arial, sans-serif !important;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
            }

            .harmonia-auth-status button {
                margin-left: 10px !important;
                border: 0 !important;
                background: transparent !important;
                color: white !important;
                text-decoration: underline !important;
                cursor: pointer !important;
            }
        `;

        (document.head || document.documentElement).appendChild(style);
    }

    function createOverlay() {
        let overlay = document.getElementById(OVERLAY_ID);

        if (overlay) {
            return overlay;
        }

        overlay = document.createElement("div");
        overlay.id = OVERLAY_ID;
        overlay.className = "harmonia-auth-overlay";
        overlay.hidden = !loginVisible;
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "harmonia-auth-title");

        overlay.innerHTML = `
            <form class="harmonia-auth-card" id="${FORM_ID}">
                <h1 id="harmonia-auth-title">Harmonia Admin</h1>
                <p>Sign in to connect the admin workspace to the live Harmonia backend.</p>

                <label class="harmonia-auth-field">
                    <span>Email</span>
                    <input
                        id="harmonia-login-email"
                        type="email"
                        autocomplete="username"
                        value="ibrahim@example.com"
                        required
                    >
                </label>

                <label class="harmonia-auth-field">
                    <span>Password</span>
                    <input
                        id="harmonia-login-password"
                        type="password"
                        autocomplete="current-password"
                        required
                    >
                </label>

                <label class="harmonia-auth-field harmonia-auth-remember">
                    <input id="harmonia-login-remember" type="checkbox" checked>
                    <span>Keep me signed in on this device</span>
                </label>

                <div class="harmonia-auth-actions">
                    <button class="harmonia-auth-button" type="submit">
                        Sign in
                    </button>
                </div>

                <div
                    class="harmonia-auth-error"
                    id="harmonia-auth-error"
                    role="alert"
                ></div>
            </form>
        `;

        (document.body || document.documentElement).appendChild(overlay);

        const form = overlay.querySelector(`#${FORM_ID}`);

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const button = form.querySelector("button");
            const errorBox = form.querySelector("#harmonia-auth-error");

            button.disabled = true;
            errorBox.textContent = "";

            try {
                await login(
                    form.querySelector("#harmonia-login-email").value,
                    form.querySelector("#harmonia-login-password").value,
                    form.querySelector("#harmonia-login-remember").checked
                );

                hideLogin();
            } catch (error) {
                errorBox.textContent =
                    error?.message ||
                    "Sign in failed. Check your email and password.";
            } finally {
                button.disabled = false;
            }
        });

        return overlay;
    }

    function ensureOverlay() {
        ensureStyles();

        let overlay = document.getElementById(OVERLAY_ID);

        if (!overlay) {
            overlay = createOverlay();
        }

        overlay.hidden = !loginVisible;

        if (loginVisible) {
            overlay.style.display = "flex";
        }

        return overlay;
    }

    function startObserver() {
        if (observer || !document.documentElement) {
            return;
        }

        observer = new MutationObserver(() => {
            if (loginVisible && !document.getElementById(OVERLAY_ID)) {
                ensureOverlay();
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    function renderStatus() {
        let status = document.getElementById(STATUS_ID);

        if (!currentUser) {
            status?.remove();
            return;
        }

        if (!status) {
            status = document.createElement("div");
            status.id = STATUS_ID;
            status.className = "harmonia-auth-status";
            (document.body || document.documentElement).appendChild(status);
        }

        status.innerHTML =
            `Signed in as ${escapeHtml(currentUser.email || "user")}` +
            ` <button type="button">Sign out</button>`;

        status.querySelector("button").onclick = logout;
    }

    function escapeHtml(value) {
        return String(value).replace(
            /[&<>'"]/g,
            (character) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;"
            })[character]
        );
    }

    function showLogin(message = "") {
        loginVisible = true;

        const overlay = ensureOverlay();
        overlay.hidden = false;
        overlay.style.display = "flex";

        const errorBox =
            overlay.querySelector("#harmonia-auth-error");

        if (errorBox) {
            errorBox.textContent = message;
        }

        window.requestAnimationFrame(() => {
            overlay
                .querySelector("#harmonia-login-email")
                ?.focus();
        });

        return overlay;
    }

    function hideLogin() {
        loginVisible = false;

        const overlay =
            document.getElementById(OVERLAY_ID);

        if (overlay) {
            overlay.hidden = true;
            overlay.style.display = "none";
        }
    }

    async function login(email, password, remember = true) {
        if (!window.HarmoniaApi) {
            throw new Error("Harmonia API client is unavailable.");
        }

        const result = await window.HarmoniaApi.request(
            "/auth/login",
            {
                method: "POST",
                auth: false,
                body: JSON.stringify({
                    email: String(email || "").trim(),
                    password: String(password || "")
                })
            }
        );

        if (!result?.accessToken) {
            throw new Error("The server did not return an access token.");
        }

        window.HarmoniaApi.setToken(
            result.accessToken,
            remember
        );

        currentUser = result.user || null;

        if (!currentUser) {
            currentUser =
                await window.HarmoniaApi.request("/auth/me");
        }

        renderStatus();

        document.dispatchEvent(
            new CustomEvent("harmonia:login", {
                detail: {
                    user: currentUser
                }
            })
        );

        document.dispatchEvent(
            new CustomEvent(
                "harmonia:authenticated",
                {
                    detail: {
                        user: currentUser
                    }
                }
            )
        );

        return currentUser;
    }

    async function validateSession() {
        if (
            !window.HarmoniaApi ||
            !window.HarmoniaApi.isAuthenticated()
        ) {
            return false;
        }

        try {
            currentUser =
                await window.HarmoniaApi.request("/auth/me");

            renderStatus();
            return true;
        } catch {
            currentUser = null;
            window.HarmoniaApi.clearToken();
            return false;
        }
    }

    function logout() {
        window.HarmoniaApi?.clearToken();
        currentUser = null;
        renderStatus();
        showLogin("You have signed out.");

        document.dispatchEvent(
            new CustomEvent("harmonia:logout")
        );
    }

    async function initialize() {
        if (initialized) {
            ensureOverlay();
            return;
        }

        initialized = true;

        ensureStyles();
        startObserver();
        createOverlay();

        const valid = await validateSession();

        if (!valid) {
            showLogin();
        } else {
            hideLogin();

            document.dispatchEvent(
                new CustomEvent(
                    "harmonia:authenticated",
                    {
                        detail: {
                            user: currentUser
                        }
                    }
                )
            );
        }

        document.dispatchEvent(
            new CustomEvent(
                "harmonia:auth-initialized",
                {
                    detail: {
                        authenticated: valid,
                        user: currentUser
                    }
                }
            )
        );

        return valid;
    }

    document.addEventListener(
        "harmonia:session-expired",
        () => {
            currentUser = null;
            renderStatus();
            showLogin(
                "Your session expired. Please sign in again."
            );
        }
    );

    window.HarmoniaAuth = {
        initialize,
        login,
        logout,
        validateSession,
        showLogin,
        hideLogin,
        getCurrentUser: () => currentUser,
        isAuthenticated: () =>
            Boolean(window.HarmoniaApi?.isAuthenticated()),
        ensureOverlay
    };

    console.log("✅ Harmonia Auth Manager Loaded");
})();