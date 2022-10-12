import { H3Event, defineEventHandler, setCookie, parseCookies } from 'h3'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import useConfig from './config'
import { getStorageSession, setStorageSession } from './storage'

const safeSetCookie = (event: H3Event, name: string, value: string) => setCookie(event, name, value, {
  // Max age of cookie in seconds
  maxAge: useConfig().sessionExpiryInSeconds,
  // Only send cookie via HTTPs to mitigate man-in-the-middle attacks
  secure: true,
  // Only send cookie via HTTP requests, do not allow access of cookie from JS to mitigate XSS attacks
  httpOnly: true,
  // Do not send cookies on many cross-site requests to mitigates CSRF and cross-site attacks, see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite#lax
  sameSite: useConfig().sessionCookieSameSite
})

declare interface Session {
  id: string
  createdAt: Date
}

const getEventSessionId = (event: H3Event) => parseCookies(event).sessionId
const getEventSession = (event: H3Event) => event.context.session

const newSession = async (event: H3Event) => {
  const sessionId = nanoid(useConfig().sessionIdLength)

  // Set cookie
  safeSetCookie(event, 'sessionId', sessionId)

  // Store session data in storage
  const session: Session = { id: sessionId, createdAt: new Date() }
  await setStorageSession(sessionId, session)

  return session
}

const getSession = async (event: H3Event): Promise<null | Session> => {
  const existingSessionId = getEventSessionId(event)
  if (!existingSessionId) {
    return null
  }

  const session = await getStorageSession(existingSessionId)
  if (!isSession(session)) {
    return null
  }

  return session
}

function isSession (shape: unknown): shape is Session {
  if (typeof shape === 'object' && !!shape && 'id' in shape && 'createdAt' in shape) {
    return true
  }

  return false
}

const ensureSession = async (event: H3Event) => {
  let session: null | Session = await getSession(event)
  if (!session) {
    session = await newSession(event)
  }

  // Start a new session if session is expired (aka: too old)
  const now = dayjs()
  if (now.diff(dayjs(session.createdAt), 'seconds') > useConfig().sessionExpiryInSeconds) {
    session = await newSession(event)
  }

  event.context.session = session
  return session
}

export default defineEventHandler(async (event: H3Event) => {
  // 1. Ensure that a session is present by either loading or creating one
  await ensureSession(event)

  // 2. Setup a hook that saves any changed made to the session by the subsequent endpoints
  event.res.on('finish', async () => await setStorageSession(getEventSessionId(event), getEventSession(event)))
})
