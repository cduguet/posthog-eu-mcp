import { ScopedCache } from "./ScopedCache";
const _cacheStore = new Map();
export class MemoryCache extends ScopedCache {
    constructor(scope) {
        super(scope);
        this.cache = new Map();
        this.cache = _cacheStore.get(scope) || new Map();
        _cacheStore.set(scope, this.cache);
    }
    async get(key) {
        return this.cache.get(key);
    }
    async set(key, value) {
        this.cache.set(key, value);
        return;
    }
    async delete(key) {
        this.cache.delete(key);
    }
    async clear() {
        this.cache.clear();
    }
}
