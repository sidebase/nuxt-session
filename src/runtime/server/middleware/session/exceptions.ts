export class SessionHijackAttempt extends Error {
  constructor (message = 'session-jacking attempt') {
    super(message)
  }
}

export class IpMissingFromSession extends Error {
  constructor (message = 'no IP in session even though ipPinning is enabled') {
    super(message)
  }
}

export class SessionExpired extends Error {
  constructor (message = 'session expired') {
    super(message)
  }
}
