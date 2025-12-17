import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/ai/goods';
export const baseName = '商品信息';

// 产品信息 API
export const GoodsApi = {
  // 查询产品信息列表
  getList: async (params: PageQuery) => {
    return await request.get(`/ai/goods/list`, { params });
  },

  // 查询产品信息详情
  getDetail: async (id: number | string) => {
    return await request.get(`/ai/goods/${id}`);
  },

  // 新增产品信息
  create: async (data: any) => {
    return await request.postWithMsg(`/ai/goods`, data);
  },

  // 修改产品信息
  update: async (data: any) => {
    return await request.putWithMsg(`/ai/goods`, data);
  },

  // 删除产品信息
  delete: async (ids: IDS) => {
    return await request.deleteWithMsg(`/ai/goods/${ids}`);
  },

  // 导出商品
  export: async (data: any) => {
    return await commonExport(`/ai/goods/export`, data);
  },

  // 获取自己的商品
  getSelfProduct: async () => {
    return await request.get(`/ai/goods/getSelfGoods`);
  },
  // 获取竞品信息
  getCompetitorOptions: async (id: string) => {
    return await request.get(`/ai/goods/getCompetitorOptions/${id}`);
  },
};
