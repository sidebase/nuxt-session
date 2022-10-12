import { H3Event, defineEventHandler, setCookie, parseCookies } from 'h3'
import { nanoid } from 'nanoid'
import type { CookieSerializeOptions } from 'cookie-es'
import { StorageValue } from 'unstorage'
import dayjs from 'dayjs'
import useConfig from './config'
import { getStorageSession, setStorageSession } from './storage'

const safeSetCookie = (event: H3Event, name: string, value: string, optionOverwrite: Partial<CookieSerializeOptions> = {}) => setCookie(event, name, value, {
  // Max age of cookie in seconds
  maxAge: useConfig().sessionExpiryInSeconds,
  // Only send cookie via HTTPs to mitigate man-in-the-middle attacks
  secure: true,
  // Only send cookie via HTTP requests, do not allow access of cookie from JS to mitigate XSS attacks
  httpOnly: true,
  // Do not send cookies on many cross-site requests to mitigates CSRF and cross-site attacks, see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite#lax
  sameSite: useConfig().sessionCookieSameSite,
})

declare interface Session {
  id: string
  createdAt: Date
}

const getSessionId = (event: H3Event) => parseCookies(event).sessionId
const ensureSessionId = (event: H3Event) => {
  const existingSessionId = getSessionId(event)
  if (existingSessionId) {
    return existingSessionId
  }

  const newSessionId = nanoid(useConfig().sessionIdLength)
  safeSetCookie(event, 'sessionId', newSessionId)

  return newSessionId
}

const setEventSession = (event: H3Event, session: StorageValue) => {
  event.context.session = session
  return session
}
const useEventSession = (event: H3Event) => event.context.session

const newSession = (id: string): Session => ({ id, createdAt: new Date() })

function isSession(shape: unknown): shape is Session {
  if (typeof shape === 'object' && !!shape && 'id' in shape && 'createdAt' in shape) {
    return true
  }

  return false
}

const ensureSession = async (event: H3Event) => {
  const sessionId = ensureSessionId(event)

  let session: Session

  const existingSession = await getStorageSession(sessionId)
  if (isSession(existingSession)) {
    session = existingSession
  } else {
    session = newSession(sessionId)
  }

  // Start a new session if session is expired (read: too old)
  const now = dayjs()
  if (now.diff(dayjs(session.createdAt), 'seconds') > useConfig().sessionExpiryInSeconds) {
    session = newSession(sessionId)
  }

  setStorageSession(sessionId, session)
  setEventSession(event, session)
}

export default defineEventHandler(async (event: H3Event) => {
  console.log('in handl;er')

  // 1. Ensure that a session is present by either loading or creating one
  await ensureSession(event)

  console.log('heeey', event.context.session)

  // 2. Setup a hook that saves any changed made to the session by the subsequent endpoints
  event.res.on('finish', async () => await setStorageSession(getSessionId(event), useEventSession(event)))
})
