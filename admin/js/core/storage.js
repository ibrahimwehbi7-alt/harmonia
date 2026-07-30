(function () {
    if (!window.Harmonia) {
        throw new Error(
            "Harmonia Core must be loaded before Storage."
        );
    }

    const STORAGE_PREFIX = "harmonia_";

    function getKey(collection) {
        return `${STORAGE_PREFIX}${collection}`;
    }

    function read(collection, fallback = []) {
        try {
            const data = localStorage.getItem(getKey(collection));

            if (!data) {
                return fallback;
            }

            return JSON.parse(data);
        } catch (error) {
            console.error(
                `Could not load ${collection}:`,
                error
            );

            return fallback;
        }
    }

    function write(collection, value) {
        localStorage.setItem(
            getKey(collection),
            JSON.stringify(value)
        );
    }

    function remove(collection) {
        localStorage.removeItem(getKey(collection));
    }

    function createId(prefix = "record") {
        if (
            window.crypto &&
            typeof crypto.randomUUID === "function"
        ) {
            return crypto.randomUUID();
        }

        return `${prefix}-${Date.now()}-${Math.random()
            .toString(16)
            .slice(2)}`;
    }

    Harmonia.Storage = {
        read,
        write,
        remove,
        createId
    };

    console.log("✅ Harmonia Storage Ready");
})();