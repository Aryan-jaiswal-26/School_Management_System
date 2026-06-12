import { Request, Response } from 'express';
import mongoose, { Schema, Document, Types } from 'mongoose';
import { ParentCommunityPost } from '../models/ParentCommunityPost.js';
import { sendResponse } from '../utils/response.js';

// ---------------------------------------------------------------------------
// Companion reply model (inline – no separate file needed)
// ---------------------------------------------------------------------------
interface ICommunityReply extends Document {
  postId: Types.ObjectId;
  schoolId: Types.ObjectId;
  userId: Types.ObjectId;
  body: string;
  anonymous: boolean;
  createdAt: Date;
}

const communityReplySchema = new Schema<ICommunityReply>(
  {
    postId:   { type: Schema.Types.ObjectId, ref: 'ParentCommunityPost', required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body:     { type: String, required: true, trim: true },
    anonymous:{ type: Boolean, default: false },
  },
  { timestamps: true },
);

communityReplySchema.index({ postId: 1, createdAt: 1 });

const CommunityReply =
  mongoose.models['CommunityReply'] ??
  mongoose.model<ICommunityReply>('CommunityReply', communityReplySchema);

// ---------------------------------------------------------------------------
// Like tracking – simple set stored as a separate collection
// ---------------------------------------------------------------------------
interface ICommunityLike extends Document {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
}

const communityLikeSchema = new Schema<ICommunityLike>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'ParentCommunityPost', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

communityLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

const CommunityLike =
  mongoose.models['CommunityLike'] ??
  mongoose.model<ICommunityLike>('CommunityLike', communityLikeSchema);

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------
export class CommunityController {
  /**
   * GET /community
   * Paginated list of posts for the caller's school, newest first.
   * Optional query: category, page, limit
   */
  static async list(req: Request, res: Response): Promise<Response> {
    const schoolId = (req as any).user?.schoolId;
    const page  = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const skip  = (page - 1) * limit;

    const filter: Record<string, unknown> = { schoolId };
    if (req.query.category) filter.category = req.query.category;

    const [posts, total] = await Promise.all([
      ParentCommunityPost.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email avatar')
        .lean(),
      ParentCommunityPost.countDocuments(filter),
    ]);

    return sendResponse(res, 200, 'Posts fetched successfully', {
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  }

  /**
   * POST /community
   * Create a new community post.
   */
  static async create(req: Request, res: Response): Promise<Response> {
    const user     = (req as any).user;
    const schoolId = user?.schoolId;
    const { title, body, category, anonymous, parentId } = req.body;

    if (!title || !body) {
      return sendResponse(res, 400, 'title and body are required');
    }

    const post = await ParentCommunityPost.create({
      schoolId,
      parentId: parentId ?? user.id, // fall back to userId when caller is not a parent
      userId: user.id,
      title: title.trim(),
      body: body.trim(),
      category: category ?? 'GENERAL',
      anonymous: anonymous ?? false,
    });

    return sendResponse(res, 201, 'Post created successfully', { post });
  }

  /**
   * POST /community/:id/reply
   * Add a reply to a post.
   */
  static async addReply(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const user   = (req as any).user;

    if (!mongoose.isValidObjectId(id)) {
      return sendResponse(res, 400, 'Invalid post id');
    }

    const post = await ParentCommunityPost.findById(id);
    if (!post) return sendResponse(res, 404, 'Post not found');

    const { body, anonymous } = req.body;
    if (!body) return sendResponse(res, 400, 'body is required');

    const reply = await CommunityReply.create({
      postId:    post._id,
      schoolId:  post.schoolId,
      userId:    user.id,
      body:      body.trim(),
      anonymous: anonymous ?? false,
    });

    // Increment denormalised counter
    await ParentCommunityPost.findByIdAndUpdate(id, { $inc: { repliesCount: 1 } });

    return sendResponse(res, 201, 'Reply added successfully', { reply });
  }

  /**
   * DELETE /community/:id
   * Delete a post – only the author or an admin may do this.
   */
  static async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const user   = (req as any).user;

    if (!mongoose.isValidObjectId(id)) {
      return sendResponse(res, 400, 'Invalid post id');
    }

    const post = await ParentCommunityPost.findById(id);
    if (!post) return sendResponse(res, 404, 'Post not found');

    const isAuthor = post.userId.toString() === String(user.id);
    const isAdmin  = ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role);

    if (!isAuthor && !isAdmin) {
      return sendResponse(res, 403, 'You are not authorised to delete this post');
    }

    await Promise.all([
      ParentCommunityPost.findByIdAndDelete(id),
      CommunityReply.deleteMany({ postId: id }),
      CommunityLike.deleteMany({ postId: id }),
    ]);

    return sendResponse(res, 200, 'Post deleted successfully');
  }

  /**
   * POST /community/:id/like
   * Toggle like on a post. Returns new likes count and liked state.
   */
  static async likePost(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const user   = (req as any).user;

    if (!mongoose.isValidObjectId(id)) {
      return sendResponse(res, 400, 'Invalid post id');
    }

    const post = await ParentCommunityPost.findById(id);
    if (!post) return sendResponse(res, 404, 'Post not found');

    const existing = await CommunityLike.findOne({ postId: id, userId: user.id });

    let liked: boolean;
    if (existing) {
      // Unlike
      await CommunityLike.deleteOne({ _id: existing._id });
      await ParentCommunityPost.findByIdAndUpdate(id, { $inc: { likesCount: -1 } });
      liked = false;
    } else {
      // Like
      await CommunityLike.create({ postId: id, userId: user.id });
      await ParentCommunityPost.findByIdAndUpdate(id, { $inc: { likesCount: 1 } });
      liked = true;
    }

    const updated = await ParentCommunityPost.findById(id).select('likesCount').lean();

    return sendResponse(res, 200, liked ? 'Post liked' : 'Post unliked', {
      liked,
      likesCount: (updated as any)?.likesCount ?? 0,
    });
  }
}
