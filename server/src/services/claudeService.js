const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config/env');
const fs = require('fs').promises;
const path = require('path');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: config.claude.apiKey
    });
  }

  async judgeTask(task, evidence) {
    try {
      // 构建包含图片的多模态内容
      const content = await this.buildJudgementContent(task, evidence);

      const message = await this.client.messages.create({
        model: config.claude.model,
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: content
        }]
      });

      return this.parseJudgementResponse(message.content[0].text);
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new Error('AI 审判服务暂时不可用');
    }
  }

  async buildJudgementContent(task, evidence) {
    const content = [];

    // 添加文本提示
    const textPrompt = this.buildJudgementPrompt(task, evidence);
    content.push({
      type: 'text',
      text: textPrompt
    });

    // 添加图片（如果有）
    if (evidence.images && evidence.images.length > 0) {
      for (const image of evidence.images) {
        try {
          // 读取图片文件
          const imageBuffer = await fs.readFile(image.path);
          const base64Image = imageBuffer.toString('base64');

          // 从文件扩展名检测格式（更可靠）
          const mediaType = this.getMediaTypeFromPath(image.path);

          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Image
            }
          });
        } catch (error) {
          console.error(`读取图片失败 ${image.path}:`, error);
          // 继续处理其他图片
        }
      }
    }

    return content;
  }

  detectImageType(buffer, filePath) {
    // 通过文件头魔数检测真实图片格式
    if (buffer.length < 12) {
      console.warn(`图片文件太小，使用文件扩展名: ${filePath}`);
      return this.getMediaTypeFromPath(filePath);
    }

    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png';
    }

    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }

    // WebP: RIFF ... WEBP
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return 'image/webp';
    }

    // GIF: GIF87a or GIF89a
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif';
    }

    // 无法识别，尝试从文件扩展名判断
    console.warn(`无法识别图片格式，使用文件扩展名: ${filePath}`);
    return this.getMediaTypeFromPath(filePath);
  }

  getMediaTypeFromPath(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const extMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    };
    return extMap[ext] || 'image/jpeg';
  }

  getMediaType(mimeType) {
    // 将 MIME 类型转换为 Claude API 支持的格式
    const mimeTypeMap = {
      'image/jpeg': 'image/jpeg',
      'image/jpg': 'image/jpeg',
      'image/png': 'image/png',
      'image/webp': 'image/webp',
      'image/gif': 'image/gif'
    };
    return mimeTypeMap[mimeType.toLowerCase()] || 'image/jpeg';
  }

  buildJudgementPrompt(task, evidence) {
    return `你是一个严格的任务审判官。你的职责是判断用户提交的证据是否真实完成了任务。你必须持怀疑态度，严格审查。

【任务信息】
任务标题：${task.title}
任务描述：${task.description || '无'}
任务类别：${task.category}
截止时间：${new Date(task.deadline).toLocaleString('zh-CN')}
提交时间：${new Date(evidence.submittedAt).toLocaleString('zh-CN')}

【用户提交的证据】
文字描述：${evidence.description}
图片数量：${evidence.images.length} 张${evidence.images.length > 0 ? '（图片已在下方显示，请仔细查看每一张图片的内容）' : ''}

⚠️ 关键要求：
- 你必须仔细查看下方的每一张图片，验证其真实性和相关性
- 图片中的数据必须清晰可读，模糊或无法辨认的图片视为无效证据
- 检查图片中的时间戳、数据指标是否与任务要求匹配
- 注意识别可能的造假痕迹（如 PS 痕迹、不合理的数据等）
- 如果图片与用户的文字描述不符，以图片内容为准

【特定任务类型的证据要求】
🏃 运动健身类任务（跑步、健身等）：
- ✅ 必须提供：运动设备的数据截图（Apple Watch、Whoop、小米手环、华为手环、Keep、Nike Run Club 等 APP 的运动数据界面）
- ✅ 数据必须显示：距离、时间、配速等关键指标
- ❌ 不接受：自己跑步的照片、健身房照片、运动服装照片等
- ❌ 不接受：没有数据的模糊截图或无法验证的文字描述

📚 学习进修类任务：
- ✅ 必须提供：学习笔记、完成的作业、考试成绩、课程进度截图等
- ❌ 不接受：只是书本照片或坐在书桌前的照片

🚫 戒除习惯类任务（如减少屏幕时间、戒烟等）：
- ✅ 必须提供：时间跨度证明、打卡记录、第三方监督证明、屏幕使用时间截图等
- ✅ 屏幕时间任务必须提供系统设置中的屏幕使用时间截图，数据必须清晰可见
- ❌ 不接受：简单的文字承诺
- ❌ 不接受：数据不匹配的截图（如任务要求少于1小时，但截图显示5小时）

【严格审判标准 - 必须全部满足】
1. ⚠️ 证据必须符合任务类型的特定要求（见上方要求）
2. ⚠️ 证据必须与任务目标直接相关且格式正确
3. ⚠️ 证据必须充分证明任务已完成（数据量、质量都要达标）
4. ⚠️ 提交时间必须在截止时间之前
5. ⚠️ 描述必须详细、具体、真实（不能是敷衍的文字）

【判定规则 - 严格执行】
❌ 必须判定为"未通过"的情况：
- 运动类任务没有提供运动设备的数据截图（即使有跑步照片也不行）
- 证据类型不符合任务类别的特定要求
- 证据与任务目标完全无关或关联性很弱
- 证据不足以证明任务完成（如任务要求跑步 2 公里，但数据显示只有 1 公里）
- 证据明显造假或可疑
- 描述过于简单、敷衍或空洞
- 提交时间超过截止时间
- 图片数量为 0 且文字描述不充分

✅ 可以判定为"通过"的情况：
- 证据类型完全符合任务类别的要求（如运动任务提供了设备数据截图）
- 数据清晰、完整、真实，能够充分证明任务完成
- 描述详细、具体，与证据相匹配
- 证据真实可信，没有明显疑点

【评分标准 - 严格打分】
- 0-59 分：未通过（证据不足或无关）
- 60-69 分：勉强通过（证据基本符合但质量一般）
- 70-79 分：通过（证据较好）
- 80-89 分：良好（证据充分且质量高）
- 90-100 分：优秀（证据非常充分，完成质量极高）

⚠️ 重要提醒：
- 当你不确定证据是否真实完成任务时，应判定为"未通过"
- 宁可严格，不可宽松
- 如果证据与任务目标不匹配，必须果断判定为"未通过"

请以 JSON 格式返回审判结果（不要包含 markdown 代码块标记）：
{
  "result": "通过" 或 "未通过",
  "score": 0-100 的分数,
  "feedback": "详细的反馈说明（100字以内，要指出具体问题或优点）"
}`;
  }

  parseJudgementResponse(responseText) {
    try {
      // 提取 JSON 内容（处理可能的 markdown 代码块）
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析 AI 响应');
      }

      const result = JSON.parse(jsonMatch[0]);

      // 验证必需字段
      if (!result.result || result.score === undefined || !result.feedback) {
        throw new Error('AI 响应格式不完整');
      }

      return {
        result: result.result,
        score: Math.min(100, Math.max(0, result.score)),
        feedback: result.feedback,
        aiModel: config.claude.model
      };
    } catch (error) {
      console.error('解析 AI 响应失败:', error);
      // 返回默认审判结果
      return {
        result: '未通过',
        score: 0,
        feedback: 'AI 审判失败，请稍后重试',
        aiModel: 'error'
      };
    }
  }
}

module.exports = new ClaudeService();
