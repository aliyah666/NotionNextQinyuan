/**
 * Vercel Cron 定时触发接口
 * 由 vercel.json 中的 cron 配置定时调用
 * 
 * 访问: POST /api/cron
 * 需要: Authorization header 匹配 CRON_SECRET
 */

const { Client } = require('@notionhq/client');

const DATABASE_ID = process.env.HOTEL_DATABASE_ID || '749bea0bcb8e82c6928801323a7bad3c';
const CRON_SECRET = process.env.CRON_SECRET || 'hotel-crawler-secret';

export default async function handler(req, res) {
  // 安全校验
  if (req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const notion = new Client({ auth: process.env.NOTION_API_KEY });

  const results = {
    sources: {},
    totalAdded: 0,
    totalSkipped: 0,
    errors: []
  };

  try {
    // 获取已有事件
    const existing = new Map();
    let cursor = undefined;
    do {
      const response = await notion.databases.query({
        database_id: DATABASE_ID,
        page_size: 100,
        start_cursor: cursor,
        sorts: [{ property: '日期', direction: 'descending' }]
      });
      for (const page of response.results) {
        const props = page.properties;
        const date = getPropValue(props['日期'], 'date');
        const title = getPropValue(props['标题'], 'title');
        const city = getPropValue(props['城市'], 'select');
        if (date && title) {
          existing.set(`${date}|${title}|${city || ''}`, page.id);
        }
      }
      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    // 运行数据源（可在 Vercel 环境变量中配置 SOURCES，逗号分隔）
    const sourceNames = (process.env.CRAWLER_SOURCES || 'guangxi-exhibition').split(',').map(s => s.trim());

    for (const sourceName of sourceNames) {
      try {
        // 动态加载数据源
        const sourcePath = `./sources/${sourceName}`;
        let sourceModule;
        try {
          sourceModule = require(sourcePath);
        } catch (e) {
          // 尝试从 scripts/sources 加载
          sourceModule = require(`../../scripts/sources/${sourceName}`);
        }

        if (typeof sourceModule === 'function' || sourceModule.default) {
          const fetchFn = sourceModule.default || sourceModule;
          const events = await fetchFn();
          let added = 0, skipped = 0;

          for (const event of events) {
            if (!event.title || !event.date || !event.province || !event.city || !event.type) {
              skipped++;
              continue;
            }
            const key = `${event.date}|${event.title}|${event.city}`;
            if (existing.has(key)) { skipped++; continue; }

            try {
              const properties = {
                '标题': { title: [{ text: { content: event.title } }] },
                '日期': { date: { start: event.date } },
                '省份': { select: { name: event.province } },
                '城市': { select: { name: event.city } },
                '类型': { select: { name: event.type } }
              };
              if (event.location) properties['地点'] = { rich_text: [{ text: { content: event.location } }] };
              if (event.sourceUrl) properties['信源链接'] = { url: event.sourceUrl };
              if (event.analysis) properties['分析建议'] = { rich_text: [{ text: { content: event.analysis } }] };
              if (event.summary) properties['简介'] = { rich_text: [{ text: { content: event.summary } }] };

              await notion.pages.create({ parent: { database_id: DATABASE_ID }, properties });
              existing.set(key, 'added');
              added++;
            } catch (err) {
              skipped++;
            }
          }

          results.sources[sourceName] = { added, skipped };
          results.totalAdded += added;
          results.totalSkipped += skipped;
        }
      } catch (err) {
        results.errors.push(`${sourceName}: ${err.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function getPropValue(prop, type) {
  if (!prop) return null;
  switch (prop.type) {
    case 'title': return prop.title.map(t => t.plain_text).join('');
    case 'rich_text': return prop.rich_text.map(t => t.plain_text).join('');
    case 'date': return prop.date ? prop.date.start : null;
    case 'select': return prop.select ? prop.select.name : null;
    default: return null;
  }
}