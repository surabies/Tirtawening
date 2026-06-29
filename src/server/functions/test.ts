import { createServerFn } from '@tanstack/react-start'

export const testApi = createServerFn({
  method: 'GET',
}).handler(async () => {
  return {
    message: 'Hello from ServerFn!',
  }
})
