import express, { Request, Response, NextFunction } from 'express'
import { globalErrorHandler } from './middleware/globalErrorHandler';
import { AppError } from './utils/AppError';
import authRoutes from './routes/authRoutes'
import ideaRoutes from './routes/ideaRoutes'
import commentRoutes from './routes/commentRoutes'
import cors from 'cors'

const app= express()
app.use(express.json());
app.use(cors())

// Get Test Routes
app.get('/', (req, res) => {
  res.send("API Developed by Faiz Iqbal!")
})

// Authentication Routes
app.use('/api/auth', authRoutes)

// Idea Routes
app.use('/api/ideas', ideaRoutes)

// Comment Routes
app.use('/api/comments', commentRoutes)

  // Handle not-found routes
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler)

export default app
