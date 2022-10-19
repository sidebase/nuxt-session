export const checkIfObjectAndContainsIllegalKeys = (shape: unknown): shape is Object => {
  if (typeof shape !== 'object' || !shape) {
    return false
  }

  // see https://stackoverflow.com/a/39283005 for this usage
  return Object.prototype.hasOwnProperty.call(shape, 'id') || Object.prototype.hasOwnProperty.call(shape, 'createdAt')
}
