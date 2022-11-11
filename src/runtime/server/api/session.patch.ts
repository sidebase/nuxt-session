import { eventHandler, createError, readBody } from 'h3'

export const checkIfObjectAndContainsIllegalKeys = (shape: unknown): shape is Object => {
  if (typeof shape !== 'object' || !shape) {
    return false
  }

  // see https://stackoverflow.com/a/39283005 for this usage
  return !!['id', 'createdAt', 'ip'].find(key => Object.prototype.hasOwnProperty.call(shape, key))
}

export default eventHandler(async (event) => {
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
