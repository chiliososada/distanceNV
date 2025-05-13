// services/firebase-storage-service.ts
import {
    getStorage,
    ref,
    getDownloadURL,
    uploadBytesResumable,
    deleteObject,
    uploadString,
    listAll
} from 'firebase/storage';
import { nanoid } from 'nanoid';

/**
 * Firebase存储服务类，提供图片上传、获取URL和删除功能
 */
class FirebaseStorageService {
    private static instance: FirebaseStorageService;
    private storage = getStorage();

    // 单例模式
    static getInstance(): FirebaseStorageService {
        if (!FirebaseStorageService.instance) {
            FirebaseStorageService.instance = new FirebaseStorageService();
        }
        return FirebaseStorageService.instance;
    }

    private constructor() {
        // 私有构造函数，防止外部直接创建实例
    }

    /**
     * 根据相对路径获取Firebase Storage下载URL
     * @param path 相对路径，如 "topics/9dcced12-55c2-4940-9ccc-1990fcc084e5/image-1"
     * @returns 可用于下载的URL
     */
    async getImageURL(path: string): Promise<string> {
        try {
            // 如果已经是完整URL，则直接返回
            if (path.startsWith('http')) {
                return path;
            }

            // 获取引用
            const storageRef = ref(this.storage, path);

            // 获取下载URL
            const downloadURL = await getDownloadURL(storageRef);

            return downloadURL;
        } catch (error) {
            console.error(`获取图片URL失败: ${path}`, error);
            throw error;
        }
    }

    /**
     * 获取指定目录下的所有图片URL
     * @param category 类别，如 'topics', 'avatars', 'chats'
     * @param itemId 项目ID，如话题ID、用户ID等
     * @returns 目录下所有图片的URL数组
     */
    async getAllImagesInDirectory(category: string, itemId: string): Promise<string[]> {
        try {
            const dirPath = `${category}/${itemId}`;
            const dirRef = ref(this.storage, dirPath);

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
    }

    /**
     * 获取指定目录下的所有图片路径
     * @param category 类别，如 'topics', 'avatars', 'chats'
     * @param itemId 项目ID，如话题ID、用户ID等
     * @returns 目录下所有图片的存储路径数组
     */
    async getAllImagePathsInDirectory(category: string, itemId: string): Promise<string[]> {
        try {
            const dirPath = `${category}/${itemId}`;
            const dirRef = ref(this.storage, dirPath);

            // 列出目录中的所有文件
            const listResult = await listAll(dirRef);

            // 返回所有文件的完整路径
            return listResult.items.map(itemRef => itemRef.fullPath);
        } catch (error) {
            console.error(`获取目录图片路径失败: ${category}/${itemId}`, error);
            return [];
        }
    }

    /**
     * 获取指定目录下的图片数量，用于确定下一个图片的序号
     * @param dirPath 目录路径，例如 "topics/9dcced12-55c2-4940-9ccc-1990fcc084e5"
     * @returns 当前目录下的图片数量
     */
    private async getImageCount(dirPath: string): Promise<number> {
        try {
            const dirRef = ref(this.storage, dirPath);
            const listResult = await listAll(dirRef);
            return listResult.items.length;
        } catch (error) {
            console.error(`获取目录图片数量失败: ${dirPath}`, error);
            return 0;
        }
    }

    /**
     * 上传图片文件到Firebase Storage
     * @param file 图片文件对象（Blob, File或ArrayBuffer）
     * @param category 文件类别，例如 'topics', 'avatars', 'chats'
     * @param itemId 项目ID，如话题ID、用户ID等
     * @param imageIndex 可选的图片序号，如果不提供则自动计算下一个序号
     * @param onProgress 上传进度回调函数
     * @returns 上传完成后的完整路径
     */
    async uploadImage(
        file: Blob | ArrayBuffer,
        category: string,
        itemId: string,
        imageIndex?: number,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        try {
            // 如果未提供itemId，则生成一个新ID
            const actualItemId = itemId || nanoid();

            // 构建目录路径
            const dirPath = `${category}/${actualItemId}`;

            // 如果未提供imageIndex，则获取当前目录下的图片数量作为序号
            let actualImageIndex = imageIndex;
            if (actualImageIndex === undefined) {
                actualImageIndex = await this.getImageCount(dirPath);
            }

            // 构建完整文件路径
            const fullPath = `${dirPath}/image-${actualImageIndex}`;

            // 创建引用
            const storageRef = ref(this.storage, fullPath);

            // 开始上传
            const uploadTask = uploadBytesResumable(storageRef, file);

            // 监听上传进度
            if (onProgress) {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        onProgress(progress);
                    },
                    (error) => {
                        console.error('上传错误:', error);
                        throw error;
                    }
                );
            }

            // 等待上传完成
            await uploadTask;

            return fullPath;
        } catch (error) {
            console.error('上传图片失败:', error);
            throw error;
        }
    }

    /**
     * 上传Base64编码的图片数据
     * @param base64Data Base64编码的图片数据，格式应为"data:image/jpeg;base64,..."
     * @param category 文件类别，例如 'topics', 'avatars', 'chats'
     * @param itemId 项目ID，如话题ID、用户ID等
     * @param imageIndex 可选的图片序号，如果不提供则自动计算下一个序号
     * @returns 上传完成后的完整路径
     */
    async uploadBase64Image(
        base64Data: string,
        category: string,
        itemId: string,
        imageIndex?: number
    ): Promise<string> {
        try {
            // 如果未提供itemId，则生成一个新ID
            const actualItemId = itemId || nanoid();

            // 构建目录路径
            const dirPath = `${category}/${actualItemId}`;

            // 如果未提供imageIndex，则获取当前目录下的图片数量作为序号
            let actualImageIndex = imageIndex;
            if (actualImageIndex === undefined) {
                actualImageIndex = await this.getImageCount(dirPath);
            }

            // 构建完整文件路径
            const fullPath = `${dirPath}/image-${actualImageIndex}`;

            // 创建引用
            const storageRef = ref(this.storage, fullPath);

            // 上传Base64数据
            await uploadString(storageRef, base64Data, 'data_url');

            return fullPath;
        } catch (error) {
            console.error('上传Base64图片失败:', error);
            throw error;
        }
    }

    /**
     * 批量上传多个图片文件
     * @param files 图片文件数组
     * @param category 文件类别，例如 'topics', 'avatars', 'chats'
     * @param itemId 项目ID，如话题ID、用户ID等
     * @param onProgress 上传进度回调函数
     * @returns 上传完成后的路径数组
     */
    async uploadMultipleImages(
        files: (Blob | ArrayBuffer)[],
        category: string,
        itemId: string,
        onProgress?: (progress: number) => void
    ): Promise<string[]> {
        try {
            const actualItemId = itemId || nanoid();
            const paths: string[] = [];

            // 获取当前目录中的图片数量作为起始序号
            const dirPath = `${category}/${actualItemId}`;
            const startIndex = await this.getImageCount(dirPath);

            // 逐个上传每个文件，并使用递增的序号
            for (let i = 0; i < files.length; i++) {
                const path = await this.uploadImage(
                    files[i],
                    category,
                    actualItemId,
                    startIndex + i,
                    onProgress
                );
                paths.push(path);
            }

            return paths;
        } catch (error) {
            console.error('批量上传图片失败:', error);
            throw error;
        }
    }

    /**
     * 删除Firebase Storage中的文件
     * @param path 文件路径
     * @returns Promise<void>
     */
    async deleteFile(path: string): Promise<void> {
        try {
            const storageRef = ref(this.storage, path);
            await deleteObject(storageRef);
        } catch (error) {
            console.error(`删除文件失败: ${path}`, error);
            throw error;
        }
    }

    /**
     * 删除目录下的所有文件
     * @param dirPath 目录路径，例如 "topics/9dcced12-55c2-4940-9ccc-1990fcc084e5"
     * @returns Promise<void>
     */
    async deleteDirectory(dirPath: string): Promise<void> {
        try {
            const dirRef = ref(this.storage, dirPath);
            const listResult = await listAll(dirRef);

            // 并行删除目录下的所有文件
            const deletePromises = listResult.items.map(itemRef =>
                deleteObject(itemRef)
            );

            await Promise.all(deletePromises);
        } catch (error) {
            console.error(`删除目录失败: ${dirPath}`, error);
            throw error;
        }
    }

    /**
     * 批量获取图片URL数组
     * @param paths 路径数组
     * @returns URL数组
     */
    async getImageURLs(paths: string[]): Promise<string[]> {
        if (!paths || !paths.length) {
            return [];
        }

        try {
            // 并行获取所有URL
            const urlPromises = paths.map(path => this.getImageURL(path));
            return await Promise.all(urlPromises);
        } catch (error) {
            console.error('批量获取图片URL失败:', error);
            throw error;
        }
    }
}

export default FirebaseStorageService.getInstance();