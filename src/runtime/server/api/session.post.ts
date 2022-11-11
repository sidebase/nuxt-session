import { createError, eventHandler, readBody } from 'h3'
import { checkIfObjectAndContainsIllegalKeys } from './session.patch'

export default eventHandler(async (event) => {
  const body = await readBody(event)
  if (checkIfObjectAndContainsIllegalKeys(body)) {
    throw createError({ statusCode: 400, message: 'Trying to pass invalid data to session, likely an object with `id` or `createdAt` fields or a non-object' })
  }

  // Fully overwrite the session with body data, only keep sessions own properties (id, createdAt)
  event.context.session = {
    ...body,
    id: event.context.session.id,
    createdAt: event.context.session.createdAt,
    ip: event.context.session.ip
  }

  return event.context.session
})
