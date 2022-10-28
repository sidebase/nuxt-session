import { createStorage } from 'unstorage'
import sessionDriver from '#session-driver'
import sessionConfig from '#session-config'

export const sessionStorage = createStorage({ driver: sessionDriver() }).mount(sessionConfig.session.storePrefix, sessionDriver())
