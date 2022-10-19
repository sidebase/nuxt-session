import { createStorage, prefixStorage, StorageValue } from 'unstorage'
import useConfig from '../../../config'

const storage = prefixStorage(createStorage(useConfig().session.storageOptions), useConfig().session.storePrefix)

export const getStorageSession = (sessionId: string) => storage.getItem(sessionId)
export const setStorageSession = (sessionId: string, session: StorageValue) => storage.setItem(sessionId, session)
export const dropStorageSession = (sessionId: string) => storage.removeItem(sessionId)
