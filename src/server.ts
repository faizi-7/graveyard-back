import app from './app'
import dotenv from 'dotenv'
import { connectToDatabase } from './config/db'

dotenv.config()
app.listen(8080,"0.0.0.0", async () => {
  await connectToDatabase()
  console.log(`App is listening to port`)
})