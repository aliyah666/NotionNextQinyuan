/**
 * 数据源: 广西人事考试网 (www.gxpta.com.cn)
 * 采集内容: 公务员/事业单位/职业资格考试
 * 页面结构: 考试通知列表，每条包含标题 + 日期 [YYYY-MM-DD]
 */

const axios = require('axios');

// 考试通知列表页
const EXAM_LIST_URL = 'https://www.gxpta.com.cn/sy/kstz/';

// 考试计划页
const EXAM_PLAN_URL = 'https://www.gxpta.com.cn/ksjh/';

/**
 * 从考试通知列表提取考试信息
 * 页面格式: <a href="...">标题</a>[YYYY-MM-DD]
 */
function parseExamList(html) {
  const events = [];

  // 匹配: 标题 + 日期 [YYYY-MM-DD]
  const itemRegex = /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*\[(\d{4}-\d{2}-\d{2})\]/g;

  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].trim();
    const date = match[3];

    // 过滤无关链接
    if (title.includes('关于做好') && title.includes('考试')) {
      // 提取考试类型关键词
      let examType = '考试';
      if (title.includes('公务员')) examType = '公务员考试';
      else if (title.includes('事业单位')) examType = '事业单位考试';
      else if (title.includes('职业资格') || title.includes('执业')) examType = '职业资格考试';
      else if (title.includes('三支一扶')) examType = '公务员考试';
      else if (title.includes('教师资格')) examType = '教师资格考试';
      else if (title.includes('建造师')) examType = '职业资格考试';
      else if (title.includes('经济师')) examType = '职业资格考试';
      else if (title.includes('社会工作者')) examType = '职业资格考试';
      else if (title.includes('二级建造师')) examType = '职业资格考试';

      // 提取城市（从标题或考点信息中）
      const cityMatch = title.match(/广西|南宁|桂林|柳州|北海|玉林|百色|梧州|防城港|钦州|贵港|贺州|河池|来宾|崇左/);
      const city = cityMatch ? cityMatch[0] : '南宁';

      events.push({
        title: title,
        date: date,
        province: '广西',
        city: city,
        type: '考试',
        location: city,
        sourceUrl: url.startsWith('http') ? url : `https://www.gxpta.com.cn${url}`,
        summary: title
      });
    }

    // 三支一扶招募公告
    if (title.includes('三支一扶') && title.includes('招募')) {
      events.push({
        title: title,
        date: date,
        province: '广西',
        city: '南宁',
        type: '考试',
        location: '南宁',
        sourceUrl: url.startsWith('http') ? url : `https://www.gxpta.com.cn${url}`,
        summary: '广西三支一扶招募考试，全区考生集中南宁'
      });
    }
  }

  return events;
}

/**
 * 从考试计划页提取全年考试日历
 */
function parseExamPlan(html) {
  const events = [];

  // 匹配表格中的考试日期和名称
  // 常见格式: <td>考试名称</td><td>日期</td>
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const row = match[1];

    // 提取日期（多种格式）
    const dateMatch = row.match(/(\d{4}[-./年]\d{1,2}[-./月]\d{1,2})/);
    // 提取考试名称
    const nameMatch = row.match(/<td[^>]*>([^<]+(?:考试|资格|职业|等级|录用|招聘)[^<]*)<\/td>/i);

    if (dateMatch && nameMatch) {
      const rawDate = dateMatch[1];
      const title = nameMatch[1].trim();

      // 标准化日期格式
      let date = rawDate;
      date = date.replace(/年/g, '-').replace(/月/g, '-').replace(/日/g, '');
      date = date.replace(/\./g, '-').replace(/\//g, '-');

      events.push({
        title: title,
        date: date,
        province: '广西',
        city: '南宁',
        type: '考试',
        location: '南宁',
        sourceUrl: EXAM_PLAN_URL,
        summary: title
      });
    }
  }

  return events;
}

module.exports = async function () {
  const events = [];

  try {
    // 采集考试通知列表
    const { data: html } = await axios.get(EXAM_LIST_URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const listEvents = parseExamList(html);
    events.push(...listEvents);
    console.log(`  广西人事考试网: 从通知列表提取 ${listEvents.length} 条`);
  } catch (err) {
    console.error('  广西人事考试网采集失败:', err.message);
  }

  // 尝试采集考试计划页
  try {
    const { data: planHtml } = await axios.get(EXAM_PLAN_URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const planEvents = parseExamPlan(planHtml);
    events.push(...planEvents);
    console.log(`  广西人事考试网: 从考试计划提取 ${planEvents.length} 条`);
  } catch (err) {
    console.error('  广西人事考试网考试计划采集失败:', err.message);
  }

  return events;
};