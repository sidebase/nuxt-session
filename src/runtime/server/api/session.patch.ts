import { defineEventHandler, createError, readBody } from 'h3'
import { checkIfObjectAndContainsIllegalKeys } from '../utils'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (checkIfObjectAndContainsIllegalKeys(body)) {
    throw createError({ statusCode: 400, message: 'Trying to pass invalid data to session, likely an object with `id` or `createdAt` fields or a non-object' })
  }

  // Spread in update, keep current data, new data takes precedence
  event.context.session = {
    ...event.context.session,
    ...body
  }

  return event.context.session
})
