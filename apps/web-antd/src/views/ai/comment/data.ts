export interface AICommentVO {
  id: string; // 评论ID
  type?: string;
  style?: string;
  model?: string;
  productId?: string;
  example?: string;
  sentiment?: string;
  guideline?: string;
  keywords?: string | string[];
  aiContent: string;
  operationType: string;
  generateStatus: string;
  commentCount: number;
  maxWords: number;
  temperature: number;
  topP: number;
}
