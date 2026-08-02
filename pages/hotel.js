/**
 * /hotel 路由 → 转发到 hotel-calendar.html
 * 不修改 NotionNext 任何原有代码，仅新增此文件
 */
export async function getServerSideProps({ res }) {
  res.writeHead(302, { Location: '/hotel-calendar.html' });
  res.end();
  return { props: {} };
}

export default function Hotel() {
  return null;
}