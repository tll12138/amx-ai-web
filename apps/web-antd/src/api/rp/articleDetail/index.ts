import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/rp/articleDetail';
export const baseName = '文章任务明细';

// 文章任务明细 API
export const ArticleDetailApi = {
    // 查询文章任务明细列表
    getList: async (params: PageQuery) => {
        return await request.get(`/rp/articleDetail/list`, { params });
    },

    // 查询文章任务明细详情
    getDetail: async (id: number | string) => {
        return await request.get(`/rp/articleDetail/${id}`);
    },

    // 新增文章任务明细
    create: async (data: any) => {
        return await request.postWithMsg(`/rp/articleDetail`, data);
    },

    // 修改文章任务明细
    update: async (data: any) => {
        return await request.putWithMsg(`/rp/articleDetail`, data);
    },

    // 删除文章任务明细
    delete: async (id: IDS) => {
        return await request.deleteWithMsg(`/rp/articleDetail/${id}`);
    },

    // 导出商品
    export: async (data: any) => {
        return await commonExport(`/rp/articleDetail/export`, data);
    },
};
