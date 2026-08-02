/**
 * 数据源: 广西文化和旅游厅 (wlt.gxzf.gov.cn)
 * 采集内容: 节庆活动、文旅活动、旅游节
 * 页面: 通知公告 / 文旅活动
 */

const axios = require('axios');

// 广西文旅厅通知公告页
const TOURISM_URL = 'https://wlt.gxzf.gov.cn/zwgk/tzgg/';

/**
 * 从通知公告解析文旅活动信息
 */
function parseNotices(html) {
  const events = [];

  // 匹配列表项
  const itemRegex = /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?(\d{4}-\d{2}-\d{2})/g;

  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].trim();
    const date = match[3];

    if (title.includes('旅游节') || title.includes('文化节') || title.includes('艺术节') ||
        title.includes('民歌节') || title.includes('节日') || title.includes('活动') ||
        title.includes('开幕') || title.includes('庆典') || title.includes('文旅')) {

      const cityMatch = title.match(/南宁|桂林|柳州|北海|玉林|百色|梧州|防城港|钦州|贵港|贺州|河池|来宾|崇左/);
      const city = cityMatch ? cityMatch[0] : '南宁';

      events.push({
        title: title,
        date: date,
        province: '广西',
        city: city,
        type: '节庆',
        location: city,
        sourceUrl: url.startsWith('http') ? url : `https://wlt.gxzf.gov.cn${url}`,
        summary: title
      });
    }
  }

  return events;
}

/**
 * 广西固定节庆活动（每年基本不变）
 */
function getFixedFestivals() {
  const year = new Date().getFullYear();
  const events = [];

  const festivals = [
    { title: '南宁国际民歌艺术节', date: `${year}-09-20`, city: '南宁' },
    { title: '桂林山水文化旅游节', date: `${year}-10-20`, city: '桂林' },
    { title: '北海涠洲岛国际旅游节', date: `${year}-07-15`, city: '北海' },
    { title: '柳州国际水上狂欢节', date: `${year}-09-30`, city: '柳州' },
    { title: '中国-东盟博览会', date: `${year}-09-16`, city: '南宁' },
    { title: '广西"三月三"歌圩节', date: `${year}-04-22`, city: '南宁' },
    { title: '广西"三月三"歌圩节', date: `${year}-04-22`, city: '桂林' },
    { title: '广西"三月三"歌圩节', date: `${year}-04-22`, city: '柳州' },
    { title: '广西"三月三"歌圩节', date: `${year}-04-22`, city: '北海' },
    { title: '玉林中医药博览会', date: `${year}-04-28`, city: '玉林' },
    { title: '百色芒果文化旅游节', date: `${year}-06-15`, city: '百色' },
    { title: '梧州六堡茶文化节', date: `${year}-10-28`, city: '梧州' },
  ];

  festivals.forEach(f => {
    events.push({
      title: f.title,
      date: f.date,
      province: '广西',
      city: f.city,
      type: '节庆',
      location: f.city,
      sourceUrl: TOURISM_URL,
      summary: `${f.title}在${f.city}举办`,
      analysis: '节庆期间游客量激增，酒店需求旺盛，建议提前1个月调整价格策略'
    });
  });

  return events;
}

module.exports = async function () {
  let events = getFixedFestivals();
  console.log(`  广西文旅厅: 固定节庆 ${events.length} 条`);

  // 尝试在线获取最新活动
  try {
    const { data: html } = await axios.get(TOURISM_URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const onlineEvents = parseNotices(html);
    events = events.concat(onlineEvents);
    console.log(`  广西文旅厅: 在线补充 ${onlineEvents.length} 条`);
  } catch (err) {
    console.error('  广西文旅厅在线采集失败:', err.message);
  }

  return events;
};