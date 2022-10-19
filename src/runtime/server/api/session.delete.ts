import { defineEventHandler } from 'h3'
import { deleteSession } from '../middleware/session'

export default defineEventHandler(async (event) => {
  await deleteSession(event)

  return null
})
