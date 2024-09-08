import { Request, Response, NextFunction } from "express-serve-static-core";
import { Types } from "mongoose";
import { Comment } from "../models/Comment";
import { AppError } from "../utils/AppError";
import { validateCommentBody } from "../validators/commentValidators";
import { z } from "zod";

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
      res.status(201).json({ comment : comment, message : "Comment Saved Successfully!"})
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