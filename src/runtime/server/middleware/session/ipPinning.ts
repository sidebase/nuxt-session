import * as argon2 from 'argon2'
import { H3Event } from 'h3'
import { Session } from '../../../../types'
import { IpMissingFromSession, IpMismatch } from './exceptions'
import { useRuntimeConfig } from '#imports'

const argon2Options = {
  // cryptographically-secure salt is generated automatically
  type: argon2.argon2id, // resistant against GPU & tradeoff attacks
  hashLength: 60
}

/**
 * Get a hashed representation of the given IP address (for GDPR compliance)
 * @param ip string|undefined The IP address to hash
 */
export const hashIpAddress = (ip: string | undefined): Promise<string | undefined> =>
  !ip
    ? Promise.resolve(undefined)
    : argon2.hash(ip, argon2Options)

/**
 * Check that the given (raw) IP address and the hashed IP address match
 * @param ip string|undefined The IP address to verify
 * @param ipHash string|undefined The (hashed) IP address to test against
 */
export const ipAddressesMatch = (ip: string | undefined, ipHash: string | undefined): Promise<boolean> => (!ip && !ipHash) ? Promise.resolve(false) : argon2.verify(ipHash, ip, argon2Options)

/**
 * Extract the IP address from an HTTP header
 * @param header string|string[]|undefined The header value to inspect and extract the IP from
 */
const extractIpFromHeader = (header?: string | string[]): string | undefined => {
  if (Array.isArray(header)) {
    return header[0].split(',')[0]
  }

  if (typeof header === 'string') {
    return header.split(',')[0]
  }

  return undefined
}

/**
 * Get the IP address corresponding to the user's request
 * @param event H3Event Event passing through middleware
 */
export const getRequestIpAddress = ({ req }: H3Event): string | undefined => {
  const sessionOptions = useRuntimeConfig().session.session

  const headerName = sessionOptions.ipPinning?.headerName

  if (typeof sessionOptions.ipPinning === 'object' && 'headerName' in sessionOptions.ipPinning.headerName) {
    return extractIpFromHeader(req.headers[headerName.toLowerCase()])
  }

  return req.socket.remoteAddress
}

export const getHashedIpAddress = (event: H3Event): Promise<string | undefined> => {
  return hashIpAddress(getRequestIpAddress(event))
}

export const processSessionIp = async (event: H3Event, session: Session) => {
  const hashedIP = session.ip

  // 4.1. (Should not happen) No IP address present in the session even though the flag is enabled
  if (!hashedIP) {
    throw new IpMissingFromSession()
  }

  // 4.2. Get request's IP
  const requestIP = getRequestIpAddress(event)

  // 4.3. Ensure pinning
  const matches = await ipAddressesMatch(requestIP, hashedIP)
  if (!matches) {
    // 4.4. Report session-jacking attempt
    // TODO: Report session-jacking attempt from requestIP
    throw new IpMismatch()
  }
}
