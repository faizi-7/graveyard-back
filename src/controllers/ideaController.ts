import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { z } from 'zod';
import { validateIdea, validateVote, validateParams, validateIdeaUpdate } from '../validators/ideaValidators'; 
import { Idea } from '../models/Idea';

// Create a new idea
export const createIdea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    validateIdea.parse(req.body);
    const newIdea = new Idea(req.body);
    await newIdea.save();
    res.status(201).json(newIdea);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message: string = err.issues.map(issue => issue.message).join(', ');
      next(new AppError(message, 400));
    } else {
      next(new AppError(err.message || 'Unable to create idea', 500));
    }
  }
};

// Get all ideas
export const getAllIdeas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ideas = await Idea.find().populate('creator');
    res.status(200).json(ideas);
  } catch (err: any) {
    next(new AppError(err.message || 'Unable to fetch ideas', 500));
  }
};

// Get a specific idea
export const getIdea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const idea = await Idea.findById(id).populate('creator');
    if (!idea) {
      return next(new AppError('Idea not found', 404));
    }
    res.status(200).json(idea);
  } catch (err: any) {
    next(new AppError(err.message || 'Unable to fetch idea', 500));
  }
};

// Update an idea
export const updateIdea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    validateParams.parse(id);

    const validatedData = validateIdeaUpdate.parse(req.body);

    const { implemented, donationQrCodeUrl } = validatedData;
    const updateFields: any = {};

    if (typeof implemented !== 'undefined') updateFields.implemented = implemented;
    if (typeof donationQrCodeUrl !== 'undefined') updateFields.donationQrCodeUrl = donationQrCodeUrl;

    const updatedIdea = await Idea.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedIdea) {
      return next(new AppError('Idea not found', 404));
    }

    res.status(200).json(updatedIdea);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message: string = err.issues.map(issue => issue.message).join(', ');
      next(new AppError(message, 400));
    } else {
      next(new AppError(err.message || 'Unable to update idea', 500));
    }
  }
};

// Delete an idea
export const deleteIdea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    validateParams.parse(id)
    const deletedIdea = await Idea.findByIdAndDelete(id);
    if (!deletedIdea) {
      return next(new AppError('Idea not found', 404));
    }
    res.status(200).json({ message: 'Idea deleted successfully' });
  } catch (err: any) {
    next(new AppError(err.message || 'Unable to delete idea', 500));
  }
};

// Vote on an idea (upvote/downvote)
export const voteIdea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    validateVote.parse(req.body);

    const { id } = req.params;
    validateParams.parse(id)
    const { vote } = req.body;
    const idea = await Idea.findById(id);
    if (!idea) {
      return next(new AppError('Idea not found', 404));
    }

    if (vote === 'upvote') {
      idea.votes += 1;
    } else if (vote === 'downvote') {
      idea.votes -= 1;
    }

    await idea.save();
    res.status(200).json({ message: 'Vote registered', votes: idea.votes });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message: string = err.issues.map(issue => issue.message).join(', ');
      next(new AppError(message, 400));
    } else {
      next(new AppError(err.message || 'Unable to register vote', 500));
    }
  }
};
