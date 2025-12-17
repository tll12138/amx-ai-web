// data.ts

// 定义接口
export interface AiGenerateTask {
  id?: string;
  type?: string;
  style?: string;
  model?: string;
  noteId?: string;
  xsecToken?: string;
  noteTitle?: string;
  noteCover?: string;
  noteContent: string;
  productId?: string;
  competitorIds?: string[];
  referenceLatitude?: string;
  otherLimit?: string;
  aiContent: string;
  operationType: string;
  generateStatus: string;
  grade?: number;
  avatar?: string;
  nickname?: string;
  publishTime?: string;
  temperature: number;
  topP: number;
}

export interface AiRespContainer {
  content: string;
  loading: boolean;
  ctrl: AbortController;
  thinkContent: string;
  think: boolean;
}

export interface AiRespData {
  content: string;
  isThinking: boolean;
  isEnd: boolean;
}

// 导出一个默认值（可选）
export const defaultState: AiGenerateTask = {
  id: undefined,
  type: undefined,
  style: undefined,
  model: undefined,
  noteId: '',
  xsecToken: '',
  noteTitle: '',
  noteCover: '',
  noteContent: '',
  productId: undefined,
  competitorIds: [],
  referenceLatitude: undefined,
  otherLimit: undefined,
  aiContent: '',
  operationType: '',
  generateStatus: '',
  grade: undefined,
};
