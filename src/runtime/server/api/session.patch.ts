import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  event.context.session = {
    ...event.context.session,
    ...body
  }

  return event.context.session
})
