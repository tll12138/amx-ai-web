import type { IDS, PageQuery } from '#/api/common';
import type { DropDownOptionsGroup } from '#/views/rp/account/types';

import { requestClient as request } from '#/api/request';

export const baseUrl = '/rp/accountGroup';
export const baseName = '账号分组';

// 账号分组 API
export const AccountGroupApi = {
  // 查询账号分组列表
  getList: async (params: PageQuery) => {
    return await request.get(`/rp/accountGroup/list`, { params });
  },
  // 查询账号分组列表，包含账号
  listGroupAndAccount: async (platform: string) => {
    return await request.get(`/rp/accountGroup/groupsWithAccounts?platform=${platform}`);
  },

  // 查询账号分组详情
  getDetail: async (id: number | string) => {
    return await request.get(`/rp/accountGroup/${id}`);
  },

  // 新增账号分组
  create: async (data: any) => {
    return await request.postWithMsg(`/rp/accountGroup`, data);
  },

  // 修改账号分组
  update: async (data: any) => {
    return await request.putWithMsg(`/rp/accountGroup`, data);
  },

  // 删除账号分组
  delete: async (id: IDS) => {
    return await request.deleteWithMsg(`/rp/accountGroup/${id}`);
  },

  // 获取账号分组下拉列表
  options: async () => {
    return await request.get<DropDownOptionsGroup[]>(`/rp/accountGroup/options`);
  },
};
