import { message } from 'ant-design-vue';

/**
 * 通用的复制内容到剪贴板的方法
 * @param content - 要复制的内容
 * @returns 一个 Promise，成功时返回 true，失败时返回 false
 */
export const copyToClipboard = async (content: string): Promise<boolean> => {
  try {
    // 检查是否支持 Clipboard API
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(content);
      return true;
    } else {
      // 兼容性处理，创建 textarea 元素来实现复制
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.append(textarea);
      textarea.select();
      const result = document.execCommand('copy');
      textarea.remove();
      return result;
    }
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
};

/**
 * 通用的复制内容到剪贴板的方法
 * @param content - 要复制的内容
 * @returns 一个 Promise，成功时返回 true，失败时返回 false
 */
export const copyWithMsg = async (
  content: string,
  msg: string,
): Promise<void> => {
  try {
    // 检查是否支持 Clipboard API
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(content);
      message.success(`复制${msg}成功`);
    } else {
      // 兼容性处理，创建 textarea 元素来实现复制
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.append(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      message.success(`复制${msg}成功`);
    }
  } catch (error) {
    console.log(error);
    message.error(`复制${msg}失败`);
  }
};
