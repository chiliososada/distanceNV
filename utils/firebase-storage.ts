// utils/firebase-storage.ts
import { getStorage, ref, getDownloadURL, listAll } from 'firebase/storage';

/**
 * 根据相对路径获取Firebase Storage下载URL
 * @param path 相对路径，如 "topics/9dcced12-55c2-4940-9ccc-1990fcc084e5/image-1"
 * @returns 可用于下载的URL的Promise
 */
export const getFirebaseImageUrl = async (path: string): Promise<string> => {
    try {
        // 如果已经是完整URL，则直接返回
        if (path.startsWith('http')) {
            return path;
        }

        // 如果是无效路径，则返回空字符串或占位图片URL
        if (!path || path.trim() === '') {
            return ''; // 或返回默认图片URL
        }

        // 检查路径格式是否符合规则要求
        if (!path.startsWith('topics/') || !path.startsWith('avatars/')) {
            console.warn(`路径 "${path}" 不符合存储规则要求，返回占位图`);
            return ''; // 或返回默认图片URL而不是抛出错误
        }

        // 获取下载URL
        const storage = getStorage();
        const storageRef = ref(storage, path);

        try {
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (storageError) {
            // 捕获存储错误但不抛出，而是返回占位图
            console.error(`获取图片失败: ${path}`, storageError);
            return ''; // 或返回默认图片URL
        }
    } catch (error) {
        console.error(`处理图片URL时发生错误: ${path}`, error);
        return ''; // 或返回默认图片URL而不是抛出错误
    }
};

/**
 * 批量获取多个图片URL
 * @param paths 多个图片路径数组
 * @returns 对应的URL数组
 */
export const getFirebaseImageUrls = async (paths: string[]): Promise<string[]> => {
    if (!paths || !paths.length) {
        return [];
    }

    try {
        // 使用 Promise.allSettled 替代 Promise.all
        // 这样即使某些请求失败，也能获取到成功的结果
        const results = await Promise.allSettled(
            paths.map(path => getFirebaseImageUrl(path))
        );

        // 过滤并处理结果
        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                // 请求失败时记录错误并返回空字符串
                console.warn(`获取图片 "${paths[index]}" 失败:`, result.reason);
                return ''; // 或者返回默认占位图URL
            }
        });
    } catch (error) {
        console.error('批量获取图片URL过程中发生错误:', error);
        // 返回空URL数组而不是抛出错误，防止应用崩溃
        return new Array(paths.length).fill('');
    }
};

/**
 * 获取某个目录下的所有图片URL
 * @param category 类别，如 'topics', 'avatars', 'chats'
 * @param itemId 项目ID，如话题ID、用户ID等
 * @returns 目录下所有图片的URL数组
 */
export const getFirebaseDirectoryImageUrls = async (category: string, itemId: string): Promise<string[]> => {
    try {
        const dirPath = `${category}/${itemId}`;
        const storage = getStorage();
        const dirRef = ref(storage, dirPath);

        // 列出目录中的所有文件
        const listResult = await listAll(dirRef);

        // 如果目录为空，返回空数组
        if (listResult.items.length === 0) {
            return [];
        }

        // 获取每个文件的下载URL
        const urlPromises = listResult.items.map(itemRef =>
            getDownloadURL(itemRef)
        );

        // 等待所有URL获取完成
        return await Promise.all(urlPromises);
    } catch (error) {
        console.error(`获取目录图片URL失败: ${category}/${itemId}`, error);
        // 出错时返回空数组，而不是抛出异常
        return [];
    }
};

/**
 * 获取目录下的所有图片的存储路径
 * @param category 类别，如 'topics', 'avatars', 'chats'
 * @param itemId 项目ID，如话题ID、用户ID等
 * @returns 目录下所有图片的路径数组
 */
export const getFirebaseDirectoryPaths = async (category: string, itemId: string): Promise<string[]> => {
    try {
        const dirPath = `${category}/${itemId}`;
        const storage = getStorage();
        const dirRef = ref(storage, dirPath);

        // 列出目录中的所有文件
        const listResult = await listAll(dirRef);

        // 返回所有文件的完整路径
        return listResult.items.map(itemRef => itemRef.fullPath);
    } catch (error) {
        console.error(`获取目录图片路径失败: ${category}/${itemId}`, error);
        return [];
    }
};

/**
 * 从Firebase Storage URL中提取路径
 * @param url 完整的Firebase Storage URL
 * @returns Firebase Storage中的路径
 */
export const getPathFromFirebaseUrl = (url: string): string | null => {
    if (!url || !url.includes('firebasestorage.googleapis.com')) {
        return null;
    }

    try {
        // 提取路径部分
        const match = url.match(/\/o\/(.*?)(\?|$)/);
        if (match && match[1]) {
            return decodeURIComponent(match[1]);
        }
        return null;
    } catch (error) {
        console.error('解析Firebase存储URL失败:', error);
        return null;
    }
};