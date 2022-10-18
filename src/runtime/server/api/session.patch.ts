import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (typeof body.id !== 'undefined' || typeof body.createdAt !== 'undefined') {
    throw createError({ statusCode: 400, message: 'Cannot overwrite session meta-data' })
  }

  event.context.session = {
    ...event.context.session,
    ...body
  }

  return event.context.session
})
