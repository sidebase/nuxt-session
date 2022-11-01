import { createStorage } from 'unstorage'
// @ts-ignore
import sessionDriver from '#session-driver'
import { useRuntimeConfig } from '#imports'
const config = useRuntimeConfig()
const sessionConfig = config.session
const driver = sessionDriver(sessionConfig.session.storageOptions.options)
export const sessionStorage = createStorage({ driver }).mount(sessionConfig.session.storePrefix, driver)
