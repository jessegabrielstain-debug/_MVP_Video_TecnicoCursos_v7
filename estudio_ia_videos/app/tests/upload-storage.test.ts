import { createStorage } from '../lib/storage'

describe('Storage adapter', () => {
  it('saves file locally when provider is local', async () => {
    process.env.STORAGE_PROVIDER = 'local'
    const storage = createStorage()
    const buffer = Buffer.from('test')
    const result = await storage.saveFile(buffer, 'pptx/test-file.pptx', 'application/octet-stream')
    expect(result.url.startsWith('/uploads/')).toBe(true)
  })
})

