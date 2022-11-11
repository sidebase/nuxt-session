export class IpMismatch extends Error {
  constructor (message = 'User IP doesn\'t match the one in session') {
    super(message)
  }
}

export class IpMissingFromSession extends Error {
  constructor (message = 'No IP in session even though ipPinning is enabled') {
    super(message)
  }
}

export class SessionExpired extends Error {
  constructor (message = 'Session expired') {
    super(message)
  }
}
