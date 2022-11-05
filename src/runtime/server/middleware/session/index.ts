import { deleteCookie, eventHandler, H3Event, parseCookies, setCookie } from 'h3'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import type { SameSiteOptions } from '../../../../module'
import { dropStorageSession, getStorageSession, setStorageSession } from './storage'
import { getRequestIpAddress, hashIpAddress, ipAddressesMatch } from './ipPinning'
import { useRuntimeConfig } from '#imports'

const SESSION_COOKIE_NAME = 'sessionId'
const safeSetCookie = (event: H3Event, name: string, value: string) => setCookie(event, name, value, {
  // Max age of cookie in seconds
  maxAge: useRuntimeConfig().session.session.expiryInSeconds,
  // Only send cookie via HTTPs to mitigate man-in-the-middle attacks
  secure: true,
  // Only send cookie via HTTP requests, do not allow access of cookie from JS to mitigate XSS attacks
  httpOnly: true,
  // Do not send cookies on many cross-site requests to mitigates CSRF and cross-site attacks, see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite#lax
  sameSite: useRuntimeConfig().session.session.cookieSameSite as SameSiteOptions
})

export declare interface Session {
  id: string
  createdAt: Date
  ip?: string
  [key: string]: any
}

/**
 * Get the current session id.
 *
 * The session id may be set only on the cookie or only on the context or both. This is because when the
 * session was just created, the session cookie is not yet set on the request (only on the response!). To
 * still function in this scenario the session-middleware sets the cookie on the response and the `sessionId` on the `event.context`.
 *
 * This method extracts the session id and ensures that if the id on cookie and context match if both exist.
 * @param event H3Event Event passing through middleware
 */
const getCurrentSessionId = (event: H3Event) => {
  const sessionIdRequest = parseCookies(event).sessionId
  const sessionIdContext = event.context.sessionId

  if (sessionIdContext && sessionIdRequest && sessionIdContext !== sessionIdRequest) {
    return null
  }

  return sessionIdRequest || sessionIdContext || null
}

export const deleteSession = async (event: H3Event) => {
  const currentSessionId = getCurrentSessionId(event)
  if (currentSessionId) {
    await dropStorageSession(currentSessionId)
  }

  deleteCookie(event, SESSION_COOKIE_NAME)
}

const newSession = async (event: H3Event) => {
  const runtimeConfig = useRuntimeConfig()
  const sessionOptions = runtimeConfig.session.session

  // (Re-)Set cookie
  const sessionId = nanoid(sessionOptions.idLength)
  safeSetCookie(event, SESSION_COOKIE_NAME, sessionId)

  // Store session data in storage
  const session: Session = {
    id: sessionId,
    createdAt: new Date(),
    ip: sessionOptions.ipPinning ? await hashIpAddress(getRequestIpAddress(event)) : undefined
  }
  await setStorageSession(sessionId, session)

  return session
}

const getSession = async (event: H3Event): Promise<null | Session> => {
  // 1. Does the sessionId cookie exist on the request?
  const existingSessionId = getCurrentSessionId(event)
  if (!existingSessionId) {
    return null
  }

  // 2. Does the session exist in our storage?
  const session = await getStorageSession(existingSessionId)
  if (!isSession(session)) {
    return null
  }

  const runtimeConfig = useRuntimeConfig()
  const sessionOptions = runtimeConfig.session.session

  // 3. Is the session not expired?
  const sessionExpiryInSeconds = sessionOptions.expiryInSeconds
  if (sessionExpiryInSeconds !== null) {
    const now = dayjs()
    if (now.diff(dayjs(session.createdAt), 'seconds') > sessionExpiryInSeconds) {
      await deleteSession(event) // Cleanup old session data to avoid leaks
      return null
    }
  }

  // 4. Check for IP pinning logic
  if (sessionOptions.ipPinning) {
    const hashedIP = session.ip

    // 4.1. (Should not happen) No IP address present in the session even though the flag is enabled
    if (!hashedIP) {
      await deleteSession(event) // Cleanup to avoid leaks (and properly recreate a session)
      return null
    }

    // 4.2. Get request's IP
    const requestIP = getRequestIpAddress(event)

    // 4.3. Ensure pinning
    const matches = await ipAddressesMatch(requestIP, hashedIP)
    if (!matches) {
      // 4.4. Report session-jacking attempt
      // TODO: Report session-jacking attempt from requestIP
      // NOTE: DO NOT DELETE SESSION HERE, this would mean we eliminate session-jacking, but users could delete others' sessions
      return null
    }
  }

  return session
}

function isSession (shape: unknown): shape is Session {
  return typeof shape === 'object' && !!shape && 'id' in shape && 'createdAt' in shape
}

const ensureSession = async (event: H3Event) => {
  let session = await getSession(event)
  if (!session) {
    session = await newSession(event)
  }

  event.context.sessionId = session.id
  event.context.session = session
  return session
}

export default eventHandler(async (event: H3Event) => {
  // 1. Ensure that a session is present by either loading or creating one
  await ensureSession(event)

  // 2. Setup a hook that saves any changed made to the session by the subsequent endpoints & middlewares
  event.res.on('finish', async () => {
    // Session id may not exist if session was deleted
    const session = await getSession(event)
    if (!session) {
      return
    }

    await setStorageSession(session.id, event.context.session)
  })
})
