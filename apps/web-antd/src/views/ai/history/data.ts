export interface AiTaskHistory {
  id: string;
  type: string;
  styleName: string;
  modelName: string;
  noteId: string;
  xsecToken: string;
  noteTitle: string;
  noteCover: string;
  noteContent: string;
  productName: string;
  competitors: string[];
  referenceLatitude: string;
  otherLimit: string;
  aiContent: string;
  operationType: string;
  generateStatus: string;
  grade: undefined;
  createTime: string;
}
