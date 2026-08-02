/**
 * 数据源: 广西招生考试院 (www.gxeea.cn)
 * 采集内容: 高考/自考/教资/学业水平考试
 * 核心页面: 2026年自治区招生考试院考试历
 */

const axios = require('axios');

// 考试历页面（每年1月发布）
const EXAM_CALENDAR_URL = 'https://www.gxeea.cn/view/content_1013_32387.htm';

// 通知公告列表
const NOTICE_URL = 'https://www.gxeea.cn/view/notice_list.html';

/**
 * 从考试历页面提取考试安排
 */
function parseExamCalendar(html) {
  const events = [];

  // 考试历通常以表格形式呈现
  // 格式: 序号 | 考试名称 | 考试日期 | 类别
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;

  while ((match = rowRegex.exec(html)) !== null) {
    const row = match[1];
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);

    if (cells && cells.length >= 2) {
      // 提取纯文本
      const texts = cells.map(cell =>
        cell.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
      ).filter(t => t.length > 0);

      if (texts.length >= 2) {
        // 查找日期格式的文本
        const dateText = texts.find(t => /\d{4}[-./年]\d{1,2}[-./月]\d{1,2}/.test(t));
        // 考试名称通常在日期之前
        const nameText = texts.find(t =>
          t.includes('考试') || t.includes('招生') || t.includes('报名') ||
          t.includes('高考') || t.includes('自考') || t.includes('资格')
        );

        if (dateText && nameText) {
          let date = dateText;
          date = date.replace(/年/g, '-').replace(/月/g, '-').replace(/日/g, '');
          date = date.replace(/\./g, '-').replace(/\//g, '-');
          // 提取 YYYY-MM-DD
          const dateMatch = date.match(/(\d{4}-\d{1,2}-\d{1,2})/);
          if (dateMatch) {
            events.push({
              title: nameText,
              date: dateMatch[1],
              province: '广西',
              city: '南宁',
              type: '考试',
              location: '南宁',
              sourceUrl: EXAM_CALENDAR_URL,
              summary: `${nameText} - ${dateMatch[1]}`
            });
          }
        }
      }
    }
  }

  return events;
}

/**
 * 从通知公告列表提取考试信息
 */
function parseNotices(html) {
  const events = [];

  // 匹配: <a href="...">标题</a> MM-DD
  const itemRegex = /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*(\d{2}-\d{2})/g;

  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].trim();
    const datePart = match[3]; // MM-DD

    if (title.includes('考试') || title.includes('招生') || title.includes('报名')) {
      const year = new Date().getFullYear();
      const date = `${year}-${datePart}`;

      events.push({
        title: title,
        date: date,
        province: '广西',
        city: '南宁',
        type: '考试',
        location: '南宁',
        sourceUrl: url.startsWith('http') ? url : `https://www.gxeea.cn${url}`,
        summary: title
      });
    }
  }

  return events;
}

module.exports = async function () {
  const events = [];

  // 采集考试历
  try {
    const { data: html } = await axios.get(EXAM_CALENDAR_URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const calendarEvents = parseExamCalendar(html);
    events.push(...calendarEvents);
    console.log(`  广西招生考试院: 从考试历提取 ${calendarEvents.length} 条`);
  } catch (err) {
    console.error('  广西招生考试院考试历采集失败:', err.message);
  }

  // 采集通知公告
  try {
    const { data: noticeHtml } = await axios.get(NOTICE_URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const noticeEvents = parseNotices(noticeHtml);
    events.push(...noticeEvents);
    console.log(`  广西招生考试院: 从通知公告提取 ${noticeEvents.length} 条`);
  } catch (err) {
    console.error('  广西招生考试院通知公告采集失败:', err.message);
  }

  return events;
};