import { eventHandler } from 'h3'
import { deleteSession } from '../middleware/session'

export default eventHandler(async (event) => {
  await deleteSession(event)

  return null
})
