import { createStorage, prefixStorage } from 'unstorage'
import { useRuntimeConfig } from '#imports'
// @ts-ignore
import sessionDriver from '#session-driver'
const sessionConfig = useRuntimeConfig().session.session
const driver = sessionDriver({ ...sessionConfig.storageOptions.options })
const storage = createStorage({ driver }).mount(sessionConfig.storePrefix, driver)
export const sessionStorage = prefixStorage(storage, sessionConfig.storePrefix)
