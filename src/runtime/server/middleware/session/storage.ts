import { createStorage, prefixStorage, StorageValue } from 'unstorage'
import { useRuntimeConfig, sessionStorageDriver } from '#imports'

const sessionConfig = useRuntimeConfig().session.session
const baseStorage = setupStorage(sessionConfig)
const storage = prefixStorage(baseStorage, sessionConfig.storePrefix)
export const getStorageSession = (sessionId: string) => storage.getItem(sessionId)
export const setStorageSession = (sessionId: string, session: StorageValue) => storage.setItem(sessionId, session)
export const dropStorageSession = (sessionId: string) => storage.removeItem(sessionId)

function setupStorage (storageConfig) {
  const { options } = storageConfig
  const storage = createStorage({ driver: sessionStorageDriver(options) })
  return storage
}
