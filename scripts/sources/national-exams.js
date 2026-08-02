/**
 * 数据源: 中国教育考试网 (www.neea.edu.cn)
 * 采集内容: 全国性考试安排（四六级、计算机等级、教师资格等）
 * 城市设为"全区"表示全省适用
 */

const axios = require('axios');

// 全国性考试的固定日期（每年基本不变，年初更新）
function getFixedNationalExams() {
  const year = new Date().getFullYear();
  const events = [];

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

  examSchedule.forEach(exam => {
    events.push({
      title: exam.title,
      date: exam.date,
      province: '广西',
      city: '全区',
      type: '考试',
      sourceUrl: 'https://www.neea.edu.cn',
      summary: `全国统一考试，广西各考点同步`,
      analysis: '考试期间考点周边酒店需求旺盛，建议提前预留房源'
    });
  });

  return events;
}

module.exports = async function () {
  const events = getFixedNationalExams();
  console.log(`  中国教育考试网: ${events.length} 条（全省统一）`);
  return events;
};