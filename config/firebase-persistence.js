
function getReactNativePersistence(storage) {
    var _a;
    // In the _getInstance() implementation (see src/core/persistence/index.ts),
    // we expect each "externs.Persistence" object passed to us by the user to
    // be able to be instantiated (as a class) using "new". That function also
    // expects the constructor to be empty. Since ReactNativeStorage requires the
    // underlying storage layer, we need to be able to create subclasses
    // (closures, essentially) that have the storage layer but empty constructor.
    return _a = class {
        constructor() {
            this.type = "LOCAL" /* PersistenceType.LOCAL */;
        }
        async _isAvailable() {
            try {
                if (!storage) {
                    return false;
                }
                await storage.setItem(index.STORAGE_AVAILABLE_KEY, '1');
                await storage.removeItem(index.STORAGE_AVAILABLE_KEY);
                return true;
            }
            catch (_b) {
                return false;
            }
        }
        _set(key, value) {
            return storage.setItem(key, JSON.stringify(value));
        }
        async _get(key) {
            const json = await storage.getItem(key);
            return json ? JSON.parse(json) : null;
        }
        _remove(key) {
            return storage.removeItem(key);
        }
        _addListener(_key, _listener) {
            // Listeners are not supported for React Native storage.
            return;
        }
        _removeListener(_key, _listener) {
            // Listeners are not supported for React Native storage.
            return;
        }
    },
        _a.type = 'LOCAL',
        _a;
}

module.exports = getReactNativePersistence;