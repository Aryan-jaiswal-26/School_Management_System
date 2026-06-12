import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComment {
  _id?: Types.ObjectId;
  authorId: Types.ObjectId;
  authorName: string;
  content: string;
  createdAt: Date;
}

export interface IPost extends Document {
  schoolId: Types.ObjectId;
  authorId: Types.ObjectId;
  authorRole: string;
  authorName: string;
  content: string;
  mediaUrls: string[];
  likes: Types.ObjectId[];
  comments: IComment[];
  pinned: boolean;
  audience: 'all' | 'teachers' | 'parents' | 'students';
  tags: string[];
}

const CommentSchema = new Schema<IComment>(
  {
    authorId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    authorName: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const PostSchema = new Schema<IPost>(
  {
    schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'School' },
    authorId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    authorRole: { type: String, required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true },
    mediaUrls: [{ type: String }],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema],
    pinned: { type: Boolean, default: false },
    audience: {
      type: String,
      enum: ['all', 'teachers', 'parents', 'students'],
      default: 'all',
    },
    tags: [{ type: String }],
  },
  { timestamps: true },
);

PostSchema.index({ schoolId: 1, createdAt: -1 });
PostSchema.index({ schoolId: 1, pinned: -1, createdAt: -1 });
PostSchema.index({ schoolId: 1, audience: 1, createdAt: -1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);
