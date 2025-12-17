import { requestClient as request } from '#/api/request';

export const baseUrl = '/xhs/common';
export const baseName = '小红书通用接口';

// 图片转换接口
export interface TransformImagesRequest {
  images: string[];
}
export interface TransformImagesResponse {
  code: number;
  message: string;
  data: string[];
}
export interface GenerateContentResponse {
  content: string;
  title: string;
}
export interface BaseResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 小红书分享内容 API
export const CommonApi = {
  // 新增分享内容
  transformImages: async (data: TransformImagesRequest): Promise<string[]> => {
    return await request.post<string[]>(`${baseUrl}/transform/images`, data, {
      timeout: 300_000,
    });
  },

  generateContent: async (data: any): Promise<GenerateContentResponse> => {
    return await request.post<GenerateContentResponse>(
      `${baseUrl}/generate/content`,
      data,
      { timeout: 300_000 },
    );
  },

  addNote: async (data: any) => {
    return await request.post<BaseResponse<boolean>>(
      `${baseUrl}/addNote`,
      data,
      { timeout: 300_000, encrypt: true },
    );
  },
  handleXhsUrl: async (data: any) => {
    return request.post(`${baseUrl}/parse`, data);
  },
};
