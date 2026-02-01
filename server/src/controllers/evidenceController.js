const Evidence = require('../models/Evidence');
const Task = require('../models/Task');
const TaskStatus = require('../constants/taskStatus');
const imageService = require('../services/imageService');
const path = require('path');

// 提交证据
exports.submitEvidence = async (req, res, next) => {
  try {
    const { taskId, description } = req.body;
    const userId = req.user._id;
    const files = req.files;

    // 验证必填字段
    if (!taskId || !description) {
      return res.status(400).json({ error: '请填写任务ID和证据描述' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: '请至少上传一张图片' });
    }

    // 验证任务
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    if (task.status !== TaskStatus.IN_PROGRESS) {
      return res.status(400).json({ error: '任务状态不正确，只能为进行中的任务提交证据' });
    }

    // 检查是否过期
    if (new Date() > new Date(task.deadline)) {
      task.status = TaskStatus.EXPIRED;
      await task.save();
      return res.status(400).json({ error: '任务已过期' });
    }

    // 处理图片（压缩）
    const images = await Promise.all(
      files.map(async (file) => {
        const compressedPath = await imageService.compressImage(file.path);
        const filename = path.basename(compressedPath);
        return {
          filename: filename,
          originalName: file.originalname,
          path: `uploads/evidences/${filename}`,  // 使用相对路径
          size: file.size,
          mimeType: file.mimetype
        };
      })
    );

    // 创建证据记录
    const evidence = new Evidence({
      taskId,
      userId,
      description,
      images
    });
    await evidence.save();

    // 更新任务状态
    task.status = TaskStatus.SUBMITTED;
    task.submittedAt = new Date();
    task.evidence = evidence._id;
    await task.save();

    res.status(201).json({
      success: true,
      evidence,
      task
    });
  } catch (error) {
    next(error);
  }
};

// 获取证据
exports.getEvidence = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    // 验证任务所属
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const evidence = await Evidence.findOne({ taskId });
    if (!evidence) {
      return res.status(404).json({ error: '未找到证据' });
    }

    res.json({
      success: true,
      evidence
    });
  } catch (error) {
    next(error);
  }
};
