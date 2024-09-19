import app from './app'
import dotenv from 'dotenv'
import { connectToDatabase } from './config/db'

dotenv.config()
app.listen(process.env.PORT || 3000, async () => {
  await connectToDatabase()
  console.log(`App is listening to port`)
})