import { createStorage, prefixStorage, StorageValue } from 'unstorage'
import useConfig from './config'

const storage = prefixStorage(createStorage(), useConfig().sessionStorePrefix)

export const getStorageSession = (sessionId: string) => storage.getItem(sessionId)
export const setStorageSession = (sessionId: string, session: StorageValue) => storage.setItem(sessionId, session)
