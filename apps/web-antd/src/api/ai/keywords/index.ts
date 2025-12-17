import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/ai/keywords';
export const baseName = '关键词';

// 关键词 API
export const KeywordsApi = {
    // 查询关键词列表
    getList: async (params: PageQuery) => {
        return await request.get(`/ai/keywords/list`, { params });
    },

    // 查询关键词详情
    getDetail: async (id: number | string) => {
        return await request.get(`/ai/keywords/${id}`);
    },

    // 新增关键词
    create: async (data: any) => {
        return await request.postWithMsg(`/ai/keywords`, data);
    },

    // 修改关键词
    update: async (data: any) => {
        return await request.putWithMsg(`/ai/keywords`, data);
    },

    // 删除关键词
    delete: async (id: IDS) => {
        return await request.deleteWithMsg(`/ai/keywords/${id}`);
    },

    // 导出商品
    export: async (data: any) => {
        return await commonExport(`/ai/keywords/export`, data);
    },

    // 获取关键词
    options: async (productId: string) => {
        return await request.get(`/ai/keywords/option?productId=${productId}`);
    },
};
