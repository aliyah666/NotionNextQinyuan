/**
 * 数据源: 南宁国际会展中心 (www.nicec.cn)
 * 采集内容: 展会排期表
 * 页面: 展会排期 / 展会预告
 */

const axios = require('axios');

// 南宁国际会展中心官网
const NICEC_URL = 'https://www.nicec.cn';

// 展会排期页
const EXHIBITION_URL = 'https://www.nicec.cn/exhibition';

/**
 * 从展会排期页解析展会信息
 * 常见格式: 展会名称 | 日期 | 展厅
 */
function parseExhibitions(html) {
  const events = [];

  // 方法1: 匹配表格行
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;

  while ((match = rowRegex.exec(html)) !== null) {
    const row = match[1];

    // 提取日期 YYYY-MM-DD 或 YYYY.MM.DD
    const dateMatch = row.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2})/);
    // 提取展会名称
    const nameMatch = row.match(/>([^<]+(?:展|博览会|交易会|洽谈会)[^<]*)</i);

    if (dateMatch && nameMatch) {
      let date = dateMatch[1].replace(/\./g, '-').replace(/\//g, '-');

      events.push({
        title: nameMatch[1].trim(),
        date: date,
        province: '广西',
        city: '南宁',
        type: '展会',
        location: '南宁国际会展中心',
        sourceUrl: EXHIBITION_URL,
        summary: `${nameMatch[1].trim()} 在南宁国际会展中心举办`,
        analysis: '展会期间参展商和观众带来大量住宿需求，建议提前预留房源'
      });
    }
  }

  // 方法2: 匹配 div 列表中的展会信息
  const divRegex = /<div[^>]*class="[^"]*exhibition[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  while ((match = divRegex.exec(html)) !== null) {
    const block = match[1];
    const dateMatch = block.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2})/);
    const nameMatch = block.match(/>([^<]+(?:展|博览会|交易会)[^<]*)</i);

    if (dateMatch && nameMatch) {
      let date = dateMatch[1].replace(/\./g, '-').replace(/\//g, '-');
      events.push({
        title: nameMatch[1].trim(),
        date: date,
        province: '广西',
        city: '南宁',
        type: '展会',
        location: '南宁国际会展中心',
        sourceUrl: EXHIBITION_URL,
        summary: `${nameMatch[1].trim()} 在南宁国际会展中心举办`,
        analysis: '展会期间参展商和观众带来大量住宿需求'
      });
    }
  }

  return events;
}

module.exports = async function () {
  const events = [];

  try {
    const { data: html } = await axios.get(EXHIBITION_URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const exhibitions = parseExhibitions(html);
    events.push(...exhibitions);
    console.log(`  南宁国际会展中心: 提取 ${exhibitions.length} 条展会`);
  } catch (err) {
    console.error('  南宁国际会展中心采集失败:', err.message);
  }

  return events;
};