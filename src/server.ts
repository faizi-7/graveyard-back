import app from './app'
import dotenv from 'dotenv'
import { connectToDatabase } from './config/db'

dotenv.config()
const PORT= process.env.PORT || 3000
app.listen(PORT, async () => {
  await connectToDatabase()
  console.log(`App is listening to port ${PORT}`)
})