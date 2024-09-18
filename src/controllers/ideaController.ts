import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { z } from 'zod';
import { validateIdea, validateVote, validateParams, validateIdeaUpdate } from '../validators/ideaValidators'; 
import { Idea } from '../models/Idea';
import { User } from '../models/User';
import { validateObjectId } from '../validators/commentValidators';
import { categories } from '../constants/constants';
import { uploadToCloudinary } from '../services/uploadService';

// Create a new idea
export const createIdea = async (req, res: Response, next: NextFunction) => {
  try {
    if(req.body.tags)
    req.body.tags= JSON.parse(req.body.tags)
    let ideaData= validateIdea.parse(req.body);
    ideaData['creator']= req.user.userId
    if(ideaData.isOriginal == "true" && req.file) {
      let donationQrCodeUrl= ''
      const base64Image = req.file.buffer.toString('base64');
      donationQrCodeUrl = await uploadToCloudinary(`data:image/jpeg;base64,${base64Image}`)
      ideaData['donationQrCodeUrl']= donationQrCodeUrl
    }
    const newIdea = new Idea(ideaData);
    await newIdea.save();
    res.status(201).send({
      data : newIdea, 
      message : "Idea Created Successful"
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message: string = err.issues.map(issue => issue.message).join(', ');
      next(new AppError(message, 400));
    } else {
      next(new AppError(err.message || 'Unable to create idea', 500));
    }
  }
};

export const getAllIdeas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cursor = parseInt(req.query.cursor as string) || 0;
    const limit = parseInt(process.env.PAGE_LIMIT as string, 10) || 10;
    const sortBy = req.query.sortBy as string | undefined;
    const tags = req.query.tags as string | undefined;
    const isOriginal = req.query.isOriginal;

    let sortCriteria: any = { _id: -1 };
    if (sortBy === 'votes') {
      sortCriteria = { votes: -1 };
    }

    const query: any = {};

    if (tags) {
      query.tags = { $in: tags?.split(',') };
    }

    if (isOriginal == "true") {
      query.isOriginal = "true";
    }

    const ideas = await Idea.find(query)
      .sort(sortCriteria)
      .skip(cursor)
      .limit(limit)
      .populate({
        path: 'creator',
        select: '-password -favorites -role', // Exclude multiple fields
      });

    const nextCursor = ideas.length < limit ? null : cursor + limit;

    res.status(200).json({
      data: {
        ideas,
        nextCursor
      },
      message: "Ideas Fetch Successful"
    });
  } catch (err: any) {
    next(new AppError(err.message || 'Unable to fetch ideas', 500));
  }
};

// Get top ideas
export const getTopIdeas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const topIdeas = await Idea.find({})
      .sort({ votes: -1 })
      .limit(3)
      .populate({
        path: 'creator',
        select: '-password -favorites -role',
      });

    res.status(200).json({
      data: topIdeas,
      message: "Top 3 Ideas Fetch Successful"
    });
  } catch (err: any) {
    next(new AppError(err.message || 'Unable to fetch top ideas', 500));
  }
};


// Get a specific idea
export const getIdea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const idea = await Idea.findById(id).populate({
      path: 'creator',
      select: '-password -favorites -role',
    });
    if (!idea) {
      return next(new AppError('Idea not found', 404));
    }
    res.status(200).json({
      data: idea,
      message : "Idea Fetch Successful"
    });
  } catch (err: any) {
    next(new AppError(err.message || 'Unable to fetch idea', 500));
  }
};

export const getIdeaByUser= async (req, res, next) => {
  try {
    const userId= req.params.userId
    const ideas= await Idea.find({creator : userId});
    res.status(200).json({
      data : ideas, 
      message : "Ideas Fetched by User Successful!"
    })
  } catch (err: any) {
    next(new AppError(err.message || 'Unable to fetch ideas by user', 500));
  }
}

export const getIdeaTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      message : "Tags Fetch Successful",
      data : categories
    });
  } catch (err: any) {
    next(new AppError(err.message || 'Unable to fetch idea tags', 500));
  }
};

export const updateIdea = async (req, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    validateParams.parse(id);

    const idea = await Idea.findById(id);
    if (!idea) {
      return next(new AppError('Idea not found!', 404));
    }

    if (!req.user) {
      return next(new AppError('Unauthorized access! User not authenticated', 401));
    }

    if (idea.creator) {
      if (idea.creator.toString() !== req.user.userId.toString()) {
        return next(new AppError('Only the idea creator can update the idea!', 403));
      }
    } else {
      return next(new AppError('Creator not found on the idea!', 404));
    }

    const validatedData = validateIdeaUpdate.parse(req.body);

    const { implemented } = validatedData;
    const updateFields: any = {};

    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      const donationQrCodeUrl = await uploadToCloudinary(`data:image/jpeg;base64,${base64Image}`);
      updateFields['donationQrCodeUrl'] = donationQrCodeUrl;
    }
    if (typeof implemented !== 'undefined') {
      updateFields.implemented = implemented;
    }
    const updatedIdea = await Idea.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });
    if (!updatedIdea) {
      return next(new AppError('Idea not found', 404));
    }
    res.status(200).json({
      message: "Idea Update Successful",
      data: updatedIdea
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message = err.issues.map(issue => issue.message).join(', ');
      return next(new AppError(message, 400));
    }
    return next(new AppError(err.message || 'Unable to update idea', 500));
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
    res.status(200).json({ message: 'Idea Deleted Successfully' });
  } catch (err: any) {
    next(new AppError(err.message || 'Unable to delete idea', 500));
  }
};

export const voteIdea = async (req, res: Response, next: NextFunction) => {
  try {
    console.log(req.body);
    validateVote.parse(req.body);

    const { id } = req.params;
    validateParams.parse(id);
    const { vote } = req.body;
    const userId = req.user.userId;
    const idea = await Idea.findById(id);
    if (!idea) {
      return next(new AppError('Idea not found', 404));
    }
    const hasVotedIndex = idea.voters.findIndex(
      voter => voter.userId.toString() === userId.toString()
    );
    if (hasVotedIndex !== -1) {
      const existingVote = idea.voters[hasVotedIndex].vote;
      if (existingVote === vote) {
        return next(new AppError('You have already cast this vote', 403));
      }
      if (vote === 'upvote') {
        idea.votes += 2;
      } else if (vote === 'downvote') {
        idea.votes -= 2;
      }

      idea.voters[hasVotedIndex].vote = vote;

    } else {
      if (vote === 'upvote') {
        idea.votes += 1;
      } else if (vote === 'downvote') {
        idea.votes -= 1;
      }

      idea.voters.push({ userId, vote });
    }

    await idea.save();

    res.status(200).json({ message: 'Vote Registered', data: idea.votes });

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message: string = err.issues.map(issue => issue.message).join(', ');
      next(new AppError(message, 400));
    } else {
      next(new AppError(err.message || 'Unable to register vote', 500));
    }
  }
};



export const addFavoriteIdea = async (req, res: Response, next: NextFunction) => {
  try {
    const { ideaId } = req.params;
    validateObjectId.parse(ideaId)
    const idea = await Idea.findById(ideaId);
    if (!idea) {
      return next(new AppError('Idea not found', 404));
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    if (user.favorites.includes(ideaId)) {
      return next(new AppError('Idea is already in your favorites', 400));
    }
    user.favorites.push(ideaId);
    await user.save();
    res.status(200).json({
      message: 'Idea Added to Favorites',
      data: user.favorites,
    });
  } catch (err: any) {
    next(new AppError(err.message || 'Failed to add idea to favorites', 500));
  }
};
