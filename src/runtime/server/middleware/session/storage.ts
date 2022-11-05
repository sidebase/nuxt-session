import type { StorageValue } from 'unstorage'
import { sessionStorage } from './sessionStorage'
export const getStorageSession = (sessionId: string) => sessionStorage.getItem(sessionId)
export const setStorageSession = (sessionId: string, session: StorageValue) => sessionStorage.setItem(sessionId, session)
export const dropStorageSession = (sessionId: string) => sessionStorage.removeItem(sessionId)
