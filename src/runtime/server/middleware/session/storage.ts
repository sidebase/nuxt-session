import { prefixStorage, StorageValue } from 'unstorage'
import { useRuntimeConfig, useStorage } from '#imports'
const baseStorage = useStorage()
const storage = prefixStorage(baseStorage, useRuntimeConfig().session.session.storePrefix)
export const getStorageSession = (sessionId: string) => storage.getItem(sessionId)
export const setStorageSession = (sessionId: string, session: StorageValue) => storage.setItem(sessionId, session)
export const dropStorageSession = (sessionId: string) => storage.removeItem(sessionId)
