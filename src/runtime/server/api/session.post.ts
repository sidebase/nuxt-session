import { defineEventHandler, readBody } from 'h3'
import { checkIfObjectAndContainsIllegalKeys } from '../utils'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (checkIfObjectAndContainsIllegalKeys(body)) {
    throw createError({ statusCode: 400, message: 'Trying to pass invalid data to session, likely an object with `id` or `createdAt` fields or a non-object' })
  }

  // Fully overwrite the session with body data, only keep sessions own properties (id, createdAt)
  event.context.session = {
    id: event.context.session.id,
    createdAt: event.context.session.createdAt,
    ...body
  }

  return event.context.session
})
