import { createStorage, prefixStorage } from 'unstorage'
import { schedule } from 'node-cron'
import { Session, SessionOptions } from '../../../../types'
import { checkSessionExpirationTime } from './index'
// @ts-ignore
import { useRuntimeConfig } from '#imports'
// @ts-ignore
import sessionDriver from '#session-driver'

const CLEANUP_INTERVAL = '* * * * *'

const sessionOptions = useRuntimeConfig().session.session as SessionOptions
const driver = sessionDriver(sessionOptions.storageOptions.options)
const storage = createStorage({ driver }).mount(sessionOptions.storePrefix, driver)
const sessionStorage = prefixStorage(storage, sessionOptions.storePrefix)

// Cleanup expired sessions at a fixed interval
schedule(CLEANUP_INTERVAL, async () => {
  const keys = await sessionStorage.getKeys()
  keys.forEach(async (key) => {
    const session = await sessionStorage.getItem(key) as Session
    try {
      if (sessionOptions.expiryInSeconds) {
        checkSessionExpirationTime(session, sessionOptions.expiryInSeconds)
      }
    } catch {
      await sessionStorage.removeItem(key)
    }
  })
})

export { sessionStorage }
