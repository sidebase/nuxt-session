import { createStorage } from 'unstorage'
import sessionDriver from '#session-driver'
import sessionConfig from '#session-config'
const driver = sessionDriver(sessionConfig.session.storageOptions.options)
export const sessionStorage = createStorage({ driver }).mount(sessionConfig.session.storePrefix, driver)
