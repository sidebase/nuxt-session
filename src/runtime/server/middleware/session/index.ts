import { deleteCookie, eventHandler, H3Event, parseCookies, setCookie } from 'h3'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import equal from 'fast-deep-equal'
import { SameSiteOptions, Session, SessionOptions, SessionContent } from '../../../../types'
import { dropStorageSession, getStorageSession, setStorageSession } from './storage'
import { processSessionIp, getHashedIpAddress } from './ipPinning'
import { SessionExpired } from './exceptions'
import { resEndProxy } from './resEndProxy'
import { useRuntimeConfig } from '#imports'

const SESSION_COOKIE_NAME = 'sessionId'
const safeSetCookie = (event: H3Event, name: string, value: string, createdAt: Date) => {
  const sessionOptions = useRuntimeConfig().session.session as SessionOptions
  const expirationDate = sessionOptions.expiryInSeconds !== false
    ? new Date(createdAt.getTime() + sessionOptions.expiryInSeconds * 1000)
    : undefined

  setCookie(event, name, value, {
    // Set cookie expiration date to now + expiryInSeconds
    expires: expirationDate,
    // Wether to send cookie via HTTPs to mitigate man-in-the-middle attacks
    secure: sessionOptions.cookieSecure,
    // Wether to send cookie via HTTP requests and not allowing access of cookie from JS to mitigate XSS attacks
    httpOnly: sessionOptions.cookieHttpOnly,
    // Do not send cookies on many cross-site requests to mitigates CSRF and cross-site attacks, see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite#lax
    sameSite: sessionOptions.cookieSameSite as SameSiteOptions,
    // Set cookie for subdomain
    domain: sessionOptions.domain || undefined
  })
}

const checkSessionExpirationTime = (session: Session, sessionExpiryInSeconds: number) => {
  const now = dayjs()
  if (now.diff(dayjs(session.createdAt), 'seconds') > sessionExpiryInSeconds) {
    throw new SessionExpired()
  }
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

const newSession = async (event: H3Event, sessionContent?: SessionContent) => {
  const runtimeConfig = useRuntimeConfig()
  const sessionOptions = runtimeConfig.session.session as SessionOptions
  const now = new Date()

  // (Re-)Set cookie
  const sessionId = nanoid(sessionOptions.idLength)
  safeSetCookie(event, SESSION_COOKIE_NAME, sessionId, now)

  // Store session data in storage
  const session: Session = {
    id: sessionId,
    createdAt: now,
    ip: sessionOptions.ipPinning ? await getHashedIpAddress(event) : undefined
  }
  if (sessionContent) {
    Object.assign(session, sessionContent)
  }
  await setStorageSession(sessionId, session)

  return session
}

const newSessionIfModified = (event: H3Event, sessionContent: SessionContent) => {
  const source = { ...sessionContent }
  resEndProxy(event.res, async () => {
    if (!equal(sessionContent, source)) {
      await newSession(event, sessionContent)
    }
  })
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
  const sessionOptions = runtimeConfig.session.session as SessionOptions
  const sessionExpiryInSeconds = sessionOptions.expiryInSeconds

  try {
    // 3. Is the session not expired?
    if (sessionExpiryInSeconds !== false) {
      checkSessionExpirationTime(session, sessionExpiryInSeconds)
    }

    // 4. Check for IP pinning logic
    if (sessionOptions.ipPinning) {
      await processSessionIp(event, session)
    }
  } catch {
    await deleteSession(event) // Cleanup old session data to avoid leaks

    return null
  }

  return session
}

const updateSessionExpirationDate = (session: Session, event: H3Event) => {
  const now = new Date()
  safeSetCookie(event, SESSION_COOKIE_NAME, session.id, now)
  return { ...session, createdAt: now }
}

function isSession (shape: unknown): shape is Session {
  return typeof shape === 'object' && !!shape && 'id' in shape && 'createdAt' in shape
}

const ensureSession = async (event: H3Event) => {
  const sessionOptions = useRuntimeConfig().session.session as SessionOptions

  let session = await getSession(event)
  if (!session) {
    if (sessionOptions.saveUninitialized) {
      session = await newSession(event)
    } else {
      // 1. Create an empty session object in the event context
      event.context.session = {}
      // 2. Create a new session if the object has been modified by any event handler
      newSessionIfModified(event, event.context.session)
      return null
    }
  } else if (sessionOptions.rolling) {
    session = updateSessionExpirationDate(session, event)
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
