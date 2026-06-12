import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { sendResponse } from '../utils/response.js';

export class FeedController {
  /**
   * GET /feed
   * List posts for the school.
   * Pinned posts always appear first, then sorted by recency.
   * Supports optional filters: ?audience=, ?tags=
   */
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const { audience, tags, page = '1', limit = '20' } = req.query as Record<string, string>;

      const filter: Record<string, unknown> = { schoolId };
      if (audience) filter.audience = audience;
      if (tags) filter.tags = { $in: tags.split(',').map((t) => t.trim()) };

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      const [posts, total] = await Promise.all([
        Post.find(filter)
          .sort({ pinned: -1, createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Post.countDocuments(filter),
      ]);

      sendResponse(res, 200, 'Feed retrieved successfully', posts, {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /feed
   * Create a new post.
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const authorId = req.user?.id as string;
      const authorRole = req.user?.role as string;
      const authorName = (req.user as any)?.name ?? (req.user as any)?.email ?? 'Unknown';

      const { content, mediaUrls, audience, tags } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({ success: false, message: 'Post content is required' });
        return;
      }

      const post = await Post.create({
        schoolId,
        authorId,
        authorRole,
        authorName,
        content,
        mediaUrls: mediaUrls ?? [],
        audience: audience ?? 'all',
        tags: tags ?? [],
      });

      sendResponse(res, 201, 'Post created successfully', post);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /feed/:id/like
   * Toggle like on a post for the authenticated user.
   */
  static async like(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const userId = req.user?.id as string;
      const { id } = req.params;

      const post = await Post.findOne({ _id: id, schoolId });

      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
      }

      const userObjectId = new mongoose.Types.ObjectId(userId);
      const alreadyLiked = post.likes.some((likeId) => likeId.equals(userObjectId));

      if (alreadyLiked) {
        post.likes = post.likes.filter((likeId) => !likeId.equals(userObjectId));
      } else {
        post.likes.push(userObjectId);
      }

      await post.save();

      sendResponse(res, 200, alreadyLiked ? 'Post unliked' : 'Post liked', {
        liked: !alreadyLiked,
        totalLikes: post.likes.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /feed/:id/comment
   * Add a comment to a post.
   * Body: { content: string }
   */
  static async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const authorId = req.user?.id as string;
      const authorName = (req.user as any)?.name ?? (req.user as any)?.email ?? 'Unknown';
      const { id } = req.params;
      const { content } = req.body;

      if (!content || !String(content).trim()) {
        res.status(400).json({ success: false, message: 'Comment content is required' });
        return;
      }

      const post = await Post.findOne({ _id: id, schoolId });

      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
      }

      const comment = {
        authorId: new mongoose.Types.ObjectId(authorId),
        authorName,
        content: String(content).trim(),
        createdAt: new Date(),
      };

      post.comments.push(comment as any);
      await post.save();

      sendResponse(res, 201, 'Comment added successfully', {
        comment,
        totalComments: post.comments.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /feed/:id/pin
   * Toggle the pinned status of a post (admin only).
   */
  static async pin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const { id } = req.params;

      const post = await Post.findOne({ _id: id, schoolId });

      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
      }

      post.pinned = !post.pinned;
      await post.save();

      sendResponse(res, 200, post.pinned ? 'Post pinned' : 'Post unpinned', { pinned: post.pinned });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /feed/:id
   * Delete a post. Authors can delete their own; admins can delete any.
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const userId = req.user?.id as string;
      const userRole = req.user?.role as string;
      const { id } = req.params;

      const post = await Post.findOne({ _id: id, schoolId });

      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
      }

      const isAdmin = ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(userRole);
      if (!isAdmin && post.authorId.toString() !== userId) {
        res.status(403).json({ success: false, message: 'You can only delete your own posts' });
        return;
      }

      await post.deleteOne();

      sendResponse(res, 200, 'Post deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
