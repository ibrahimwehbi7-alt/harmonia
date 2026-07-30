(function initializeHarmoniaRepository() {
    if (!window.Harmonia?.Storage) {
        console.error(
            "Harmonia Storage must load before repository.js."
        );
        return;
    }

    function createRepository(config = {}) {
        const {
            storageKey,
            model,
            validate,
            beforeDelete
        } = config;

        if (!storageKey) {
            throw new Error(
                "Repository requires a storageKey."
            );
        }

        if (typeof model !== "function") {
            throw new Error(
                `Repository "${storageKey}" requires a model function.`
            );
        }

        function getAll() {
            const records =
                Harmonia.Storage.read(storageKey, []);

            return Array.isArray(records)
                ? records
                : [];
        }

        function getById(recordId) {
            if (!recordId) {
                return null;
            }

            return (
                getAll().find(
                    (record) => record.id === recordId
                ) || null
            );
        }

        function exists(recordId) {
            return Boolean(getById(recordId));
        }

        function runValidation(record, context) {
            if (typeof validate !== "function") {
                return;
            }

            const result = validate(record, context);

            if (result === true || result == null) {
                return;
            }

            if (typeof result === "string") {
                throw new Error(result);
            }

            if (
                result &&
                result.valid === false
            ) {
                throw new Error(
                    result.message ||
                    "Record validation failed."
                );
            }
        }

        function create(data = {}) {
            const records = getAll();
            const record = model(data);

            runValidation(record, {
                operation: "create",
                existingRecord: null,
                records
            });

            records.push(record);

            Harmonia.Storage.write(
                storageKey,
                records
            );

            return record;
        }

        function update(recordId, updates = {}) {
            if (!recordId) {
                throw new Error(
                    "A record ID is required."
                );
            }

            const records = getAll();

            const recordIndex = records.findIndex(
                (record) => record.id === recordId
            );

            if (recordIndex === -1) {
                throw new Error(
                    `Record "${recordId}" was not found.`
                );
            }

            const existingRecord =
                records[recordIndex];

            const updatedRecord = model({
                ...existingRecord,
                ...updates,
                id: existingRecord.id,
                createdAt:
                    existingRecord.createdAt,
                updatedAt:
                    new Date().toISOString()
            });

            runValidation(updatedRecord, {
                operation: "update",
                existingRecord,
                records
            });

            records[recordIndex] =
                updatedRecord;

            Harmonia.Storage.write(
                storageKey,
                records
            );

            return updatedRecord;
        }

        function remove(recordId) {
            if (!recordId) {
                throw new Error(
                    "A record ID is required."
                );
            }

            const records = getAll();
            const record = getById(recordId);

            if (!record) {
                return false;
            }

            if (
                typeof beforeDelete ===
                "function"
            ) {
                beforeDelete(record, {
                    records
                });
            }

            const remainingRecords =
                records.filter(
                    (item) =>
                        item.id !== recordId
                );

            Harmonia.Storage.write(
                storageKey,
                remainingRecords
            );

            return true;
        }

        function replaceAll(records = []) {
            if (!Array.isArray(records)) {
                throw new TypeError(
                    "replaceAll requires an array."
                );
            }

            const normalizedRecords =
                records.map((record) =>
                    model(record)
                );

            normalizedRecords.forEach(
                (record) => {
                    runValidation(record, {
                        operation:
                            "replaceAll",
                        existingRecord: null,
                        records:
                            normalizedRecords
                    });
                }
            );

            Harmonia.Storage.write(
                storageKey,
                normalizedRecords
            );

            return normalizedRecords;
        }

        function clear() {
            Harmonia.Storage.write(
                storageKey,
                []
            );
        }

        return Object.freeze({
            storageKey,
            getAll,
            getById,
            exists,
            create,
            update,
            delete: remove,
            replaceAll,
            clear
        });
    }

    Harmonia.Repository = {
        create: createRepository
    };

    console.log(
        "✅ Harmonia Repository Loaded"
    );
})();