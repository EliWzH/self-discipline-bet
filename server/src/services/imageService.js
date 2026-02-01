const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class ImageService {
  // 压缩图片
  async compressImage(filePath) {
    try {
      const outputPath = filePath.replace(/\.(jpg|jpeg|png|webp)$/i, '-compressed.jpg');

      await sharp(filePath)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      // 删除原文件
      await fs.unlink(filePath);

      return outputPath;
    } catch (error) {
      console.error('图片压缩失败:', error);
      // 如果压缩失败，返回原文件路径
      return filePath;
    }
  }

  // 删除图片
  async deleteImage(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('删除图片失败:', error);
    }
  }

  // 获取图片 URL
  getImageUrl(filename) {
    return `/uploads/evidences/${filename}`;
  }
}

module.exports = new ImageService();
