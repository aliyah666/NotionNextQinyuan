/**
 * 数据源: 广西体育局 (tyj.gxzf.gov.cn)
 * 采集内容: 省级体育赛事、全民健身活动
 * 页面: 政务公开 - 通知公告 / 赛事信息
 */

const axios = require('axios');

// 广西体育局通知公告页
const SPORTS_URL = 'https://tyj.gxzf.gov.cn/zwgk/tzgg/';

// 赛事信息页
const EVENT_URL = 'https://tyj.gxzf.gov.cn/ssxx/';

/**
 * 从通知公告解析赛事信息
 */
function parseNotices(html) {
  const events = [];

  // 匹配列表项: <a href="...">标题</a> YYYY-MM-DD
  const itemRegex = /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?(\d{4}-\d{2}-\d{2})/g;

  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].trim();
    const date = match[3];

    // 过滤赛事相关通知
    if (title.includes('比赛') || title.includes('赛事') || title.includes('运动会') ||
        title.includes('竞赛') || title.includes('锦标赛') || title.includes('公开赛') ||
        title.includes('马拉松') || title.includes('全民健身') || title.includes('体育')) {

      // 提取城市
      const cityMatch = title.match(/南宁|桂林|柳州|北海|玉林|百色|梧州|防城港|钦州|贵港|贺州|河池|来宾|崇左/);
      const city = cityMatch ? cityMatch[0] : '南宁';

      events.push({
        title: title,
        date: date,
        province: '广西',
        city: city,
        type: '赛事',
        location: city,
        sourceUrl: url.startsWith('http') ? url : `https://tyj.gxzf.gov.cn${url}`,
        summary: title
      });
    }
  }

  return events;
}

/**
 * 广西省级常规赛事（每年固定，年初更新）
 */
function getFixedSportsEvents() {
  const year = new Date().getFullYear();
  const events = [];

  // 广西常规体育赛事（每年微调）
  const schedule = [
    { title: '广西青少年体育锦标赛', date: `${year}-07-15`, city: '南宁' },
    { title: '广西全民健身运动会', date: `${year}-10-01`, city: '南宁' },
    { title: '南宁国际马拉松', date: `${year}-12-07`, city: '南宁' },
    { title: '桂林马拉松', date: `${year}-11-16`, city: '桂林' },
    { title: '北海国际帆船赛', date: `${year}-11-01`, city: '北海' },
  ];

  schedule.forEach(s => {
    events.push({
      title: s.title,
      date: s.date,
      province: '广西',
      city: s.city,
      type: '赛事',
      location: s.city,
      sourceUrl: SPORTS_URL,
      summary: `${s.title}在${s.city}举办`,
      analysis: '赛事期间参赛选手和观众带来大量住宿需求'
    });
  });

  return events;
}

module.exports = async function () {
  let events = getFixedSportsEvents();
  console.log(`  广西体育局: 固定赛事 ${events.length} 条`);

  // 尝试在线获取最新赛事
  try {
    const { data: html } = await axios.get(SPORTS_URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const onlineEvents = parseNotices(html);
    events = events.concat(onlineEvents);
    console.log(`  广西体育局: 在线补充 ${onlineEvents.length} 条`);
  } catch (err) {
    console.error('  广西体育局在线采集失败:', err.message);
  }

  return events;
};