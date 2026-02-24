import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/ai/generatedContent';
export const baseName = 'AI生成内容解析';

// AI生成内容解析 API
export const GeneratedContentApi = {
    // 查询AI生成内容解析列表
    getList: async (params: PageQuery) => {
        return await request.get(`/ai/generatedContent/list`, { params });
    },

    // 查询AI生成内容解析详情
    getDetail: async (id: number | string) => {
        return await request.get(`/ai/generatedContent/${id}`);
    },

    // 新增AI生成内容解析
    create: async (data: any) => {
        return await request.postWithMsg(`/ai/generatedContent`, data);
    },

    // 修改AI生成内容解析
    update: async (data: any) => {
        return await request.putWithMsg(`/ai/generatedContent`, data);
    },

    // 删除AI生成内容解析
    delete: async (id: IDS) => {
        return await request.deleteWithMsg(`/ai/generatedContent/${id}`);
    },

    // 导出商品
    export: async (data: any) => {
        return await commonExport(`/ai/generatedContent/export`, data);
    },
};
