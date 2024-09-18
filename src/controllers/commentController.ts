import { Request, Response, NextFunction } from "express-serve-static-core";
import { Types } from "mongoose";
import { Comment } from "../models/Comment";
import { AppError } from "../utils/AppError";
import { validateCommentBody } from "../validators/commentValidators";
import { z } from "zod";


export async function getCommentByIdea(req, res, next) {
  try {
    const { ideaId } = req.params;

    const allComments = await Comment.find({ idea: ideaId, parentComment: null })
    .populate('creator', '-password -favorites -about')
    .populate({
      path: 'replies',
      options: { sort: { createdAt: -1 } },
      populate: { path: 'creator', select: '-password -favorites -about' }
    })
      .sort({ createdAt: -1 })
      .lean()
    
    let result= allComments.filter(comment => !comment.parentComment)
    res.status(200).json({
      message: 'Comments retrieved successfully',
      data: result
    });
  }
  catch (err: any) {
    if (err instanceof z.ZodError) {
      const message: string = err.issues.map(issue => issue.message).join(', ');
      next(new AppError(message, 400));
    } else {
      next(new AppError(err.message + ' , Unable to retrieve comments', 500));
    }
  }
}
export async function addComment(req, res:Response, next: NextFunction) {
  try {

    const {ideaId} = req.params;
    console.log(req.params)
    const creator= req.user.userId
    const { content, parentId }= validateCommentBody.parse(req.body)
    if(parentId) {
      const parentComment= await Comment.findById(parentId)
      
      if(!parentComment) {
        return next(new AppError('Parent Comment Doesnt exits!', 404))
      }
      if(parentComment.parentComment) {
        return next(new AppError('Cannot Reply further then one level', 400))
      }
      const comment= new Comment({ content, creator, idea : ideaId, parentComment : parentId })
      parentComment.replies.push(comment._id)
      await parentComment.save()
      await comment.save()
      res.status(201).json({ comment : comment, message : "Comment Saved Successfully!"})
    } else {
      const comment= new Comment({ content, creator, idea : ideaId })
      await comment.save()
      res.status(201).json({ data : comment, message : "Comment Saved Successfully!"})
    } 
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message: string = err.issues.map(issue => issue.message).join(', ');
      next(new AppError(message, 400));
    } else {
      next(new AppError(err.message + ' , Unable to create comment', 500));
    }
  }
}
