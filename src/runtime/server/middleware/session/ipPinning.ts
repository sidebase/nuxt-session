import { argon2id, hash, verify } from 'argon2'
import { H3Event } from 'h3'

const argon2Options = {
  // cryptographically-secure salt is generated automatically
  type: argon2id, // resistant against GPU & tradeoff attacks
  hashLength: 60
}
/**
 * Get a hashed representation of the given IP address (for GDPR compliance)
 * @param ip string|undefined The IP address to hash
 */
export const hashIpAddress = (ip: string | undefined): Promise<string | undefined> =>
  !ip
    ? Promise.resolve(undefined)
    : hash(ip, argon2Options)
/**
 * Check that the given (raw) IP address and the hashed IP address match
 * @param ip string|undefined The IP address to verify
 * @param ipHash string|undefined The (hashed) IP address to test against
 */
export const ipAddressesMatch = (ip: string | undefined, ipHash: string | undefined): Promise<boolean> => !(ip && ipHash) ? Promise.resolve(false) : verify(ipHash, ip, argon2Options)
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
  const foundIp = [
    'x-forwarded-for',
    'true-client-ip',
    'cf-connecting-ip'
  ].find(headerName => extractIpFromHeader(req.headers[headerName]))

  return foundIp ?? req.connection?.remoteAddress ?? req.socket.remoteAddress
}
