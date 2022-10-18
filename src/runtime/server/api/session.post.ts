import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (typeof body.id !== 'undefined' || typeof body.createdAt !== 'undefined') {
    throw createError({ statusCode: 400, message: 'Cannot overwrite session meta-data' })
  }

  // Fully overwrite the session with body data, only keep sessions own properties (id, createdAt)
  event.context.session = {
    id: event.context.session.id,
    createdAt: event.context.session.createdAt,
    ...body
  }

  return event.context.session
})
