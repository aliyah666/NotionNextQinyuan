/**
 * 数据源模板
 * 
 * 使用方法:
 *   1. 复制此文件，重命名为你的数据源名称（如 nanning-exhibition.js）
 *   2. 修改 fetchEvents() 函数，实现数据采集逻辑
 *   3. 返回符合格式的事件数组
 * 
 * 事件对象格式:
 * {
 *   title: string,      // 必填: 事件标题
 *   date: string,       // 必填: 日期 YYYY-MM-DD
 *   province: string,   // 必填: 省份（如 "广西"）
 *   city: string,       // 必填: 城市（如 "南宁"）
 *   type: string,       // 必填: 类型（展会/演出/赛事/会议/考试/节庆/其他）
 *   location: string,   // 可选: 地点
 *   sourceUrl: string,  // 可选: 信源链接
 *   analysis: string,   // 可选: 分析建议
 *   summary: string     // 可选: 简介
 * }
 */

const axios = require('axios');

/**
 * 主函数：采集事件数据
 * 必须导出一个 async function
 */
module.exports = async function () {
  const events = [];

  // ===== 在此实现你的数据采集逻辑 =====

  // 示例: 从 API 获取数据
  // const response = await axios.get('https://example.com/api/events');
  // const data = response.data;
  // data.forEach(item => {
  //   events.push({
  //     title: item.name,
  //     date: item.date,
  //     province: '广西',
  //     city: '南宁',
  //     type: '展会',
  //     location: item.venue,
  //     sourceUrl: item.url,
  //     summary: item.description
  //   });
  // });

  // 示例: 从 HTML 页面解析
  // const { data: html } = await axios.get('https://example.com/events');
  // 使用正则或字符串解析提取数据...

  // ===== 采集逻辑结束 =====

  return events;
};