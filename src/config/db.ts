import mongoose from 'mongoose'
export async function connectToDatabase() {
  try {
    const mongoUrl= process.env.MONGO_URI
    await mongoose.connect(mongoUrl || "");
    console.log('Connected to Database ✨')
  } catch(err) {
    console.log(err)
  }
}