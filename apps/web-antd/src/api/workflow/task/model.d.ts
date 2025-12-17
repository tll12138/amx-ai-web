export interface TaskInfo {
  id: string;
  categoryName: string;
  createTime: string;
  updateTime: string;
  tenantId: string;
  delFlag?: any;
  definitionId: string;
  instanceId: string;
  flowName: string;
  businessId: string;
  nodeCode: string;
  nodeName: string;
  nodeType: number;
  permissionList?: any;
  userList?: any;
  formCustom: string;
  formPath?: any;
  flowCode: string;
  version: string;
  flowStatus: string;
  flowStatusName: string;
  assigneeIds: string;
  assigneeNames: string;
  processedBy: string;
  type: string;
  nodeRatio?: string;
  createBy: string;
  createByName: string;
  targetNodeName?: string;
}

export interface CompleteTaskReqData {
  messageType: string[];
  flowCopyList: { userId: string; userName: string }[];
  taskId: ID;
  taskVariables: Record<string, any>;
  variables: any;
  // 附件ID 1,2,3,4形式
  fileId?: string;
}

export interface StartWorkFlowReqData {
  /**
   * 业务ID
   */
  businessId: ID;
  /**
   * flowCode
   */
  flowCode: string;
  /**
   * 流程变量
   */
  variables: Record<string, any>;
}

export interface TaskOperationData {
  message?: string;
  taskId: ID;
  // 单个操作人
  userId?: ID;
  // 多个操作人
  userIds?: IDS;
}

/**
 * 操作类型，委派 delegateTask、转办 transferTask、加签 addSignature、减签 reductionSignature
 */
export type TaskOperationType =
  | 'addSignature'
  | 'delegateTask'
  | 'reductionSignature'
  | 'transferTask';
