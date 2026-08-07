(function () {
    "use strict";

    const DEFAULT_API_URL =
        "https://harmonia-production-720f.up.railway.app";

    const TOKEN_KEY = "harmonia_access_token";
    const ORGANIZATION_KEY = "harmonia_organization_id";

    function getConfig() {
        return window.HARMONIA_CONFIG || {};
    }

    function getBaseUrl() {
        return String(
            getConfig().apiBaseUrl ||
            DEFAULT_API_URL
        ).replace(/\/+$/, "");
    }

    function getToken() {
        if (window.HarmoniaIdentity?.getToken) return window.HarmoniaIdentity.getToken();
        return (localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || "");
    }

    function setToken(token, remember = true) {
        if (window.HarmoniaIdentity?.SESSION_KEY) {
            const store = remember ? localStorage : sessionStorage;
            localStorage.removeItem(window.HarmoniaIdentity.SESSION_KEY);
            sessionStorage.removeItem(window.HarmoniaIdentity.SESSION_KEY);
            store.setItem(window.HarmoniaIdentity.SESSION_KEY, JSON.stringify({ accessToken: token, user: window.HarmoniaIdentity.getCurrentUser?.() || null, savedAt: new Date().toISOString() }));
        } else {
            localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY);
            (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
        }
        document.dispatchEvent(new CustomEvent("harmonia:auth-changed", { detail: { authenticated: Boolean(token) } }));
    }

    function clearToken() {
        if (window.HarmoniaIdentity?.clear) window.HarmoniaIdentity.clear();
        else { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); }
        document.dispatchEvent(new CustomEvent("harmonia:auth-changed", { detail: { authenticated: false } }));
    }

    function getOrganizationId() {
        return (
            localStorage.getItem(
                ORGANIZATION_KEY
            ) ||
            ""
        );
    }

    function setOrganizationId(
        organizationId
    ) {
        if (!organizationId) {
            localStorage.removeItem(
                ORGANIZATION_KEY
            );
            return;
        }

        localStorage.setItem(
            ORGANIZATION_KEY,
            organizationId
        );
    }

    async function request(
        path,
        options = {}
    ) {
        const token = getToken();

        const headers = {
            Accept: "application/json",
            ...(options.headers || {})
        };

        if (
            options.body &&
            !(options.body instanceof FormData)
        ) {
            headers["Content-Type"] =
                "application/json";
        }

        if (
            token &&
            options.auth !== false
        ) {
            headers.Authorization =
                `Bearer ${token}`;
        }

        const controller =
            new AbortController();

        const timeout =
            window.setTimeout(
                () => controller.abort(),
                Number(options.timeout) ||
                    20000
            );

        let response;

        try {
            response = await fetch(
                `${getBaseUrl()}${path}`,
                {
                    ...options,
                    headers,
                    credentials: "omit",
                    signal:
                        options.signal ||
                        controller.signal
                }
            );
        } catch (error) {
            if (error?.name === "AbortError") {
                throw new Error(
                    "The Harmonia server took too long to respond."
                );
            }

            throw new Error(
                "Harmonia could not reach the server. Check your internet connection and try again."
            );
        } finally {
            window.clearTimeout(timeout);
        }

        const text =
            await response.text();

        let data = null;

        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                data = text;
            }
        }

        if (!response.ok) {
            if (
                response.status === 401 &&
                options.auth !== false
            ) {
                clearToken();

                document.dispatchEvent(
                    new CustomEvent(
                        "harmonia:session-expired"
                    )
                );
            }

            const rawMessage =
                data?.message?.message ||
                data?.message ||
                data?.error ||
                `Request failed with status ${response.status}`;

            const message =
                Array.isArray(rawMessage)
                    ? rawMessage.join(" ")
                    : String(rawMessage);

            const error =
                new Error(message);

            error.status =
                response.status;

            error.data =
                data;

            throw error;
        }

        return data;
    }

    window.HarmoniaApi = {
        request,
        getBaseUrl,
        getToken,
        setToken,
        clearToken,
        getOrganizationId,
        setOrganizationId,
        isAuthenticated:
            () => Boolean(getToken())
    };

    console.log(
        "✅ Harmonia API Client Loaded",
        getBaseUrl()
    );
})();