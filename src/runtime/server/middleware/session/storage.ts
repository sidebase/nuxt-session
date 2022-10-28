import { prefixStorage, StorageValue } from 'unstorage'
import { sessionStorage } from './sessionStorage'
import { useRuntimeConfig } from '#imports'
const sessionConfig = useRuntimeConfig().session.session
const storage = prefixStorage(sessionStorage, sessionConfig.storePrefix)
export const getStorageSession = (sessionId: string) => storage.getItem(sessionId)
export const setStorageSession = (sessionId: string, session: StorageValue) => storage.setItem(sessionId, session)
export const dropStorageSession = (sessionId: string) => storage.removeItem(sessionId)
