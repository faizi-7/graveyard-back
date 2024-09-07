import express, { Request, Response, NextFunction } from 'express'
import { globalErrorHandler } from './middleware/globalErrorHandler';
import { AppError } from './utils/AppError';
import authRoutes from './routes/authRoutes'

const app= express()
app.use(express.json());



app.get('/', (req, res) => {
  res.send("Hello World!")
})

// Authentication Routes
app.use('/api/auth', authRoutes)



// Handle not-found routes
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler)

export default app
