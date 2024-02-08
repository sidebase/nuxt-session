import type { ServerResponse } from 'node:http'

type MiddleWare = () => Promise<void>

// Proxy res.end() to get a callback at the end of all event handlers
export const resEndProxy = (res: ServerResponse, middleWare: MiddleWare) => {
  const end = res.end

  // @ts-ignore Replacing res.end() will lead to type checking error
  res.end = async (chunk: any, encoding: BufferEncoding) => {
    await middleWare()
    return end.call(res, chunk, encoding) as ServerResponse
  }
}
