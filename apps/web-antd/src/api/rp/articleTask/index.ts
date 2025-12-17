import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/rp/articleTask';
export const baseName = '文章任务主';

// 文章任务主 API
export const ArticleTaskApi = {
    // 查询文章任务主列表
    getList: async (params: PageQuery) => {
        return await request.get(`/rp/articleTask/list`, { params });
    },

    // 查询文章任务主详情
    getDetail: async (id: number | string) => {
        return await request.get(`/rp/articleTask/${id}`);
    },

    // 新增文章任务主
    create: async (data: any) => {
        return await request.postWithMsg(`/rp/articleTask`, data);
    },

    // 修改文章任务主
    update: async (data: any) => {
        return await request.putWithMsg(`/rp/articleTask`, data);
    },

    // 删除文章任务主
    delete: async (id: IDS) => {
        return await request.deleteWithMsg(`/rp/articleTask/${id}`);
    },

    // 导出商品
    export: async (data: any) => {
        return await commonExport(`/rp/articleTask/export`, data);
    },
};
