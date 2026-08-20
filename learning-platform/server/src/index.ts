import { createApp } from './app.js'

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000

createApp().listen(PORT, () => {
  console.log(`learning-platform server listening on port ${PORT}`)
})
