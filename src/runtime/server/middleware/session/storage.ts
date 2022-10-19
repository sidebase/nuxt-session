import { createStorage, prefixStorage, StorageValue } from 'unstorage'
import { useRuntimeConfig } from '#imports'

const storage = prefixStorage(createStorage(useRuntimeConfig().session.session.storageOptions), useRuntimeConfig().session.session.storePrefix)

export const getStorageSession = (sessionId: string) => storage.getItem(sessionId)
export const setStorageSession = (sessionId: string, session: StorageValue) => storage.setItem(sessionId, session)
export const dropStorageSession = (sessionId: string) => storage.removeItem(sessionId)
