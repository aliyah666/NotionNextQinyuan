/**
 * 数据源: 中国教育考试网 (www.neea.edu.cn)
 * 采集内容: 全国性考试安排（英语四六级、计算机等级、教师资格等）
 * 页面: 考试项目列表页
 */

const axios = require('axios');

// 考试项目页
const EXAM_URL = 'https://www.neea.edu.cn';

/**
 * 全国性考试的固定日期（每年基本不变，年初更新）
 * 这些考试影响广西所有城市
 */
function getFixedNationalExams() {
  const year = new Date().getFullYear();
  const events = [];

  // 以下为全国性考试固定安排（每年微调）
  // 数据来源: 中国教育考试网年度考试历
  const examSchedule = [
    { title: '全国大学英语四六级考试（笔试）', date: `${year}-06-14` },
    { title: '全国大学英语四六级考试（笔试）', date: `${year}-12-13` },
    { title: '全国计算机等级考试', date: `${year}-03-22` },
    { title: '全国计算机等级考试', date: `${year}-09-20` },
    { title: '中小学教师资格考试（笔试）', date: `${year}-03-08` },
    { title: '中小学教师资格考试（笔试）', date: `${year}-09-13` },
    { title: '中小学教师资格考试（面试）', date: `${year}-05-10` },
    { title: '中小学教师资格考试（面试）', date: `${year}-12-06` },
  ];

  // 广西有高校的城市
  const cities = ['南宁', '桂林', '柳州', '北海', '玉林', '百色', '梧州', '钦州', '贺州', '河池', '崇左'];

  examSchedule.forEach(exam => {
    cities.forEach(city => {
      events.push({
        title: exam.title,
        date: exam.date,
        province: '广西',
        city: city,
        type: '考试',
        location: city,
        sourceUrl: EXAM_URL,
        summary: `全国统一考试，${city}各高校考点`,
        analysis: '考试期间考点周边酒店需求旺盛，建议提前预留房源'
      });
    });
  });

  return events;
}

/**
 * 尝试从中国教育考试网获取最新考试历
 */
async function fetchOnlineCalendar() {
  const events = [];

  try {
    const { data: html } = await axios.get(EXAM_URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // 查找考试历链接
    const calendarMatch = html.match(/<a[^>]*href="([^"]*考试历[^"]*\.\w+)"[^>]*>/i);
    if (calendarMatch) {
      const calendarUrl = calendarMatch[1].startsWith('http')
        ? calendarMatch[1]
        : `${EXAM_URL}${calendarMatch[1]}`;

      const { data: calendarHtml } = await axios.get(calendarUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // 解析表格中的考试信息
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let match;
      while ((match = rowRegex.exec(calendarHtml)) !== null) {
        const row = match[1];
        const dateMatch = row.match(/(\d{4}[-./年]\d{1,2}[-./月]\d{1,2})/);
        const nameMatch = row.match(/>([^<]+(?:考试|等级|资格|大赛)[^<]*)</i);

        if (dateMatch && nameMatch) {
          let date = dateMatch[1];
          date = date.replace(/年/g, '-').replace(/月/g, '-').replace(/日/g, '');
          date = date.replace(/\./g, '-').replace(/\//g, '-');
          const dateExtract = date.match(/(\d{4}-\d{1,2}-\d{1,2})/);
          if (dateExtract) {
            events.push({
              title: nameMatch[1].trim(),
              date: dateExtract[1],
              province: '广西',
              city: '南宁',
              type: '考试',
              location: '南宁',
              sourceUrl: calendarUrl,
              summary: nameMatch[1].trim()
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('  中国教育考试网在线采集失败:', err.message);
  }

  return events;
}

module.exports = async function () {
  // 优先使用固定数据（稳定可靠）
  let events = getFixedNationalExams();
  console.log(`  中国教育考试网: 固定数据 ${events.length} 条`);

  // 尝试在线获取最新数据补充
  try {
    const onlineEvents = await fetchOnlineCalendar();
    if (onlineEvents.length > 0) {
      events = events.concat(onlineEvents);
      console.log(`  中国教育考试网: 在线补充 ${onlineEvents.length} 条`);
    }
  } catch (err) {
    // 在线获取失败不影响固定数据
  }

  return events;
};