/**
 * 数据源: 固定规则 — 法定节假日 + 寒暑假
 * 无需爬取，每年更新一次数据即可
 * 
 * 数据来源: 国务院办公厅节假日安排通知
 */

module.exports = async function () {
  const year = new Date().getFullYear();
  const events = [];

  // ========== 法定节假日（2026年） ==========
  // 每年初根据国务院通知更新
  const holidays = [
    {
      title: '元旦假期',
      date: `${year}-01-01`,
      summary: '法定节假日，出行高峰，酒店需求旺盛',
      analysis: '建议提前1个月做好价格调整和房源预留'
    },
    {
      title: '春节假期',
      date: `${year}-02-17`,
      summary: '法定节假日，全年最大出行高峰',
      analysis: '建议提前2个月制定春节价格策略，重点关注返乡和旅游双重需求'
    },
    {
      title: '清明节假期',
      date: `${year}-04-05`,
      summary: '法定节假日，短途出行和祭扫高峰',
      analysis: '关注周边游和返乡客流'
    },
    {
      title: '劳动节假期',
      date: `${year}-05-01`,
      summary: '法定节假日，5天长假，旅游出行高峰',
      analysis: '建议提前1个月做好价格调整，旅游城市酒店需求旺盛'
    },
    {
      title: '端午节假期',
      date: `${year}-05-31`,
      summary: '法定节假日，短途出行高峰',
      analysis: '关注龙舟赛事举办城市的额外需求'
    },
    {
      title: '中秋节假期',
      date: `${year}-10-04`,
      summary: '法定节假日，可能与国庆连休',
      analysis: '关注是否与国庆连休，连休期间需求叠加'
    },
    {
      title: '国庆节假期',
      date: `${year}-10-01`,
      summary: '法定节假日，7天长假，全年第二大出行高峰',
      analysis: '建议提前2个月制定国庆价格策略，旅游城市满房率高'
    }
  ];

  // 为每个节假日生成广西各城市的事件
  const cities = ['南宁', '桂林', '柳州', '北海', '玉林', '百色', '梧州', '防城港', '钦州', '贵港', '贺州', '河池', '来宾', '崇左'];

  holidays.forEach(h => {
    cities.forEach(city => {
      events.push({
        title: h.title,
        date: h.date,
        province: '广西',
        city: city,
        type: '节庆',
        location: city,
        summary: h.summary,
        analysis: h.analysis
      });
    });
  });

  // ========== 寒暑假（仅教育核心城市） ==========
  const eduCities = ['南宁', '桂林', '柳州'];

  // 寒假
  eduCities.forEach(city => {
    events.push({
      title: '中小学寒假开始',
      date: `${year}-01-15`,
      province: '广西',
      city: city,
      type: '其他',
      location: city,
      summary: '中小学寒假，家庭出游需求增加',
      analysis: '关注亲子酒店和家庭房需求'
    });
  });

  // 暑假
  eduCities.forEach(city => {
    events.push({
      title: '中小学暑假开始',
      date: `${year}-07-01`,
      province: '广西',
      city: city,
      type: '其他',
      location: city,
      summary: '中小学暑假开始，旅游旺季',
      analysis: '暑期是旅游酒店旺季，建议提前做好价格策略'
    });
  });

  return events;
};