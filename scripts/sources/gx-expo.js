/**
 * 数据源: 广西国际博览集团 (www.gxexpogp.cn)
 * 采集内容: 中国-东盟博览会系列展会
 * 页面: 展会排期 / 新闻中心
 */

const axios = require('axios');

// 广西国际博览集团官网
const EXPO_URL = 'https://www.gxexpogp.cn';

/**
 * 中国-东盟博览会系列固定展会（每年定期举办）
 * 包含: 东博会、农业展、轻工展等
 */
function getFixedExpoEvents() {
  const year = new Date().getFullYear();
  const events = [];

  const expoEvents = [
    {
      title: '中国-东盟博览会',
      date: `${year}-09-16`,
      summary: '中国与东盟国家经贸合作最高级别展会，参展商超3000家',
      analysis: '全年最大展会，酒店满房率高，建议提前3个月锁定房源和价格'
    },
    {
      title: '中国-东盟博览会农业展',
      date: `${year}-09-16`,
      summary: '东博会农业专题展，聚焦农产品贸易',
      analysis: '与东博会同期举办，叠加效应明显'
    },
    {
      title: '中国-东盟博览会轻工展',
      date: `${year}-09-16`,
      summary: '东博会轻工业专题展',
      analysis: '与东博会同期举办'
    },
    {
      title: '中国-东盟博览会旅游展',
      date: `${year}-10-15`,
      summary: '东博会旅游专题展，在桂林举办',
      analysis: '桂林酒店需求高峰，建议提前准备'
    },
    {
      title: '中国-东盟博览会林木展',
      date: `${year}-11-01`,
      summary: '东博会林木业专题展',
      analysis: '专业展会，参展商住宿需求集中'
    },
  ];

  expoEvents.forEach(e => {
    events.push({
      title: e.title,
      date: e.date,
      province: '广西',
      city: e.title.includes('桂林') ? '桂林' : '南宁',
      type: '展会',
      location: e.title.includes('桂林') ? '桂林国际会展中心' : '南宁国际会展中心',
      sourceUrl: EXPO_URL,
      summary: e.summary,
      analysis: e.analysis
    });
  });

  return events;
}

/**
 * 从网站获取最新展会信息
 */
async function fetchOnlineExhibitions() {
  const events = [];

  try {
    const { data: html } = await axios.get(EXPO_URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // 解析展会列表
    const itemRegex = /<a\s+href="([^"]+)"[^>]*>([^<]+(?:展|博览会|交易会)[^<]*)<\/a>[\s\S]*?(\d{4}-\d{2}-\d{2})/g;

    let match;
    while ((match = itemRegex.exec(html)) !== null) {
      const url = match[1];
      const title = match[2].trim();
      const date = match[3];

      events.push({
        title: title,
        date: date,
        province: '广西',
        city: '南宁',
        type: '展会',
        location: '南宁国际会展中心',
        sourceUrl: url.startsWith('http') ? url : `${EXPO_URL}${url}`,
        summary: title
      });
    }
  } catch (err) {
    console.error('  广西国际博览集团在线采集失败:', err.message);
  }

  return events;
}

module.exports = async function () {
  let events = getFixedExpoEvents();
  console.log(`  广西国际博览集团: 固定展会 ${events.length} 条`);

  // 尝试在线获取最新展会
  try {
    const onlineEvents = await fetchOnlineExhibitions();
    events = events.concat(onlineEvents);
    console.log(`  广西国际博览集团: 在线补充 ${onlineEvents.length} 条`);
  } catch (err) {
    // 在线获取失败不影响固定数据
  }

  return events;
};