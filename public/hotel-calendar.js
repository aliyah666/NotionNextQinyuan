// ========== 配置区 ==========
var DATABASE_ID = '749bea0bcb8e82c6928801323a7bad3c';
var API_URL = '/api/notion-proxy';

// 省份-城市映射（后续加省份只需在这里加）
var provinceCities = {
  "广西": ["南宁","桂林","柳州","北海","玉林","百色","梧州","防城港","钦州","贵港","贺州","河池","来宾","崇左"]
};

// 事件类型映射
var typeMap = {
  "展会": "t1","演出": "t2","赛事": "t3","会议": "t4","考试": "t5","节庆": "t6","其他": "t7"
};
var typeLabels = ["展会","演出","赛事","会议","考试","节庆","其他"];
var typeKeys = ["t1","t2","t3","t4","t5","t6","t7"];

// ========== 数据 ==========
var allEvents = [];
var Y = 2026, M = 8;
var activeFilters = new Set(typeKeys);

// ========== Notion 数据解析 ==========
function getProp(props, name) {
  var p = props[name];
  if (!p) return null;
  switch(p.type) {
    case 'title': return p.title.map(function(t){return t.plain_text;}).join('');
    case 'rich_text': return p.rich_text.map(function(t){return t.plain_text;}).join('');
    case 'date': return p.date ? p.date.start : null;
    case 'select': return p.select ? p.select.name : null;
    case 'multi_select': return p.multi_select.map(function(s){return s.name;});
    case 'url': return p.url || null;
    case 'number': return p.number;
    default: return null;
  }
}

function parseEvent(page) {
  var props = page.properties;
  var rawType = getProp(props, '类型') || getProp(props, 'tags');
  var typeLabel = '';
  var typeKey = 't7';
  if (rawType) {
    if (Array.isArray(rawType)) { rawType = rawType[0]; }
    typeLabel = rawType;
    typeKey = typeMap[rawType] || 't7';
  }

  var dateVal = getProp(props, '日期') || getProp(props, 'date');
  if (!dateVal) return null;

  return {
    id: page.id,
    d: dateVal.substring(0, 10),
    province: getProp(props, '省份') || '广西',
    city: getProp(props, '城市') || '',
    t: typeKey,
    l: typeLabel || '其他',
    tt: getProp(props, '标题') || getProp(props, 'title') || getProp(props, 'Name') || '未命名',
    s: getProp(props, '简介') || getProp(props, 'summary') || '',
    loc: getProp(props, '地点') || '',
    src: getProp(props, '信源链接') || '',
    ad: getProp(props, '分析建议') || ''
  };
}

// ========== 数据加载 ==========
function loadData() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('error').style.display = 'none';
  document.getElementById('main').style.display = 'none';

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ database_id: DATABASE_ID })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.error) throw new Error(data.error);
    allEvents = [];
    if (data.results) {
      data.results.forEach(function(page) {
        var ev = parseEvent(page);
        if (ev) allEvents.push(ev);
      });
    }
    initProvinceSelect();
    document.getElementById('loading').style.display = 'none';
    document.getElementById('main').style.display = 'flex';
    R();
  })
  .catch(function(e) {
    console.error(e);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
  });
}

// ========== 省份/城市选择 ==========
function initProvinceSelect() {
  var ps = document.getElementById('province');
  ps.innerHTML = '<option value="全部">全部省份</option>';
  var provinces = Object.keys(provinceCities);
  provinces.forEach(function(p) {
    ps.innerHTML += '<option value="' + p + '">' + p + '</option>';
  });
  // 默认选中第一个省份
  if (provinces.length > 0) {
    ps.value = provinces[0];
  }
  ps.onchange = function() {
    updateCitySelect();
    R();
  };
  updateCitySelect();
}

function updateCitySelect() {
  var cs = document.getElementById('city');
  var pv = document.getElementById('province').value;
  cs.innerHTML = '<option value="全部">全部城市</option>';
  if (pv !== '全部' && provinceCities[pv]) {
    provinceCities[pv].forEach(function(c) {
      cs.innerHTML += '<option value="' + c + '">' + c + '</option>';
    });
  }
  cs.onchange = function() { R(); };
}

// ========== 事件过滤 ==========
function FE() {
  var pv = document.getElementById('province').value;
  var cv = document.getElementById('city').value;
  return allEvents.filter(function(e) {
    if (!activeFilters.has(e.t)) return false;
    if (pv !== '全部' && e.province !== pv) return false;
    if (cv !== '全部' && e.city !== cv && e.city !== '全区') return false;
    return true;
  });
}

function GD(ds) {
  return FE().filter(function(e) { return e.d === ds; });
}

// ========== 日历渲染 ==========
function p2(n) { return n < 10 ? '0' + n : '' + n; }

function R() {
  document.getElementById('ct').textContent = Y + '年' + M + '月';
  var grid = document.getElementById('g');
  grid.innerHTML = '';
  var fd = new Date(Y, M - 1, 1);
  var ld = new Date(Y, M, 0);
  var sd = (fd.getDay() + 6) % 7;
  var dim = ld.getDate();
  var pld = new Date(Y, M - 1, 0).getDate();
  var td = new Date();
  var ts = td.getFullYear() + '-' + p2(td.getMonth() + 1) + '-' + p2(td.getDate());

  for (var i = sd - 1; i >= 0; i--) {
    var dd = pld - i;
    var ym = M === 1 ? 12 : M - 1;
    var yy = M === 1 ? Y - 1 : Y;
    grid.appendChild(C(dd, yy + '-' + p2(ym) + '-' + p2(dd), true, ts));
  }
  for (var d = 1; d <= dim; d++) {
    grid.appendChild(C(d, Y + '-' + p2(M) + '-' + p2(d), false, ts));
  }
  var tot = sd + dim;
  var rm = (7 - tot % 7) % 7;
  for (var d = 1; d <= rm; d++) {
    var ym = M === 12 ? 1 : M + 1;
    var yy = M === 12 ? Y + 1 : Y;
    grid.appendChild(C(d, yy + '-' + p2(ym) + '-' + p2(d), true, ts));
  }
  RS();
  RL();
}

function C(n, ds, io, ts) {
  var div = document.createElement('div');
  div.className = 'd';
  if (io) div.classList.add('other');
  if (ds === ts) div.classList.add('today');
  var num = document.createElement('div');
  num.className = 'dn';
  num.textContent = n;
  div.appendChild(num);
  var evs = GD(ds);
  var evd = document.createElement('div');
  evd.className = 'ev';
  if (evs.length > 0) {
    evs.slice(0, 3).forEach(function(e) {
      var tag = document.createElement('div');
      tag.className = 'et ' + e.t;
      tag.textContent = e.tt;
      tag.onclick = function(evt) { evt.stopPropagation(); OD(e); };
      evd.appendChild(tag);
    });
    if (evs.length > 3) {
      var m = document.createElement('div');
      m.className = 'em';
      m.textContent = '+' + (evs.length - 3) + ' 条更多';
      m.onclick = function(evt) { evt.stopPropagation(); ODL(ds); };
      evd.appendChild(m);
    }
    div.appendChild(evd);
  } else {
    evd.style.flex = '1';
    div.appendChild(evd);
  }
  return div;
}

// ========== 事件列表弹窗 ==========
function ODL(ds) {
  var evs = GD(ds);
  document.getElementById('ltitle').textContent = ds + ' 全部事件（' + evs.length + '）';
  var list = document.getElementById('llist');
  list.innerHTML = '';
  evs.forEach(function(e) {
    var item = document.createElement('div');
    item.className = 'litem';
    item.innerHTML = '<span class="ltag ' + e.t + '">' + e.l + '</span><span class="lname">' + e.tt + '</span>';
    item.onclick = function() {
      hideList();
      OD(e);
    };
    list.appendChild(item);
  });
  document.getElementById('lmk').classList.add('show');
}

function hideList(e) {
  if (e && e.target !== document.getElementById('lmk')) return;
  document.getElementById('lmk').classList.remove('show');
}

// ========== 事件详情弹窗 ==========
function OD(ev) {
  document.getElementById('mt').className = 'mtag ' + ev.t;
  document.getElementById('mt').textContent = ev.l;
  document.getElementById('mtt').textContent = ev.tt;
  document.getElementById('md').innerHTML = '<b>时间：</b>' + ev.d;
  document.getElementById('mc').innerHTML = '<b>城市：</b>' + (ev.province ? ev.province + ' · ' : '') + (ev.city || '未知');
  document.getElementById('ml').innerHTML = ev.loc ? '<b>地点：</b>' + ev.loc : '';
  document.getElementById('ms').innerHTML = ev.s ? '<b>简介：</b>' + ev.s : '';
  document.getElementById('msrc').innerHTML = ev.src ? '<b>官方信源：</b> <a href="' + ev.src + '" target="_blank">' + ev.src + '</a>' : '';
  document.getElementById('mad').innerHTML = ev.ad ? '<b>分析建议：</b>' + ev.ad : '';
  document.getElementById('mk').classList.add('show');
}

function cm(e) {
  if (e && e.target !== document.getElementById('mk')) return;
  document.getElementById('mk').classList.remove('show');
}

// ========== 月份切换 ==========
function pm() { if (M === 1) { M = 12; Y--; } else { M--; } R(); }
function nm() { if (M === 12) { M = 1; Y++; } else { M++; } R(); }
function gt() { var t = new Date(); Y = t.getFullYear(); M = t.getMonth() + 1; R(); }

// ========== 统计 ==========
function RS() {
  var fe = FE();
  var mp = Y + '-' + p2(M);
  var me = fe.filter(function(e) { return e.d.indexOf(mp) === 0; });
  var ct = { t1: 0, t2: 0, t3: 0, t4: 0, t5: 0, t6: 0, t7: 0 };
  me.forEach(function(e) { if (ct[e.t] !== undefined) ct[e.t]++; });
  var total = 0;
  for (var k in ct) total += ct[k];
  document.getElementById('st').innerHTML =
    '<div class="sti x1"><div class="n">' + ct.t1 + '</div><div class="l">展会</div></div>' +
    '<div class="sti x2"><div class="n">' + ct.t2 + '</div><div class="l">演出</div></div>' +
    '<div class="sti x3"><div class="n">' + ct.t3 + '</div><div class="l">赛事</div></div>' +
    '<div class="sti x4"><div class="n">' + ct.t4 + '</div><div class="l">会议</div></div>' +
    '<div class="sti x5"><div class="n">' + ct.t5 + '</div><div class="l">考试</div></div>' +
    '<div class="sti x6"><div class="n">' + ct.t6 + '</div><div class="l">节庆</div></div>' +
    '<div class="sti x7" style="grid-column:1/-1;"><div class="n">' + total + '</div><div class="l">本月合计</div></div>';
}

function RL() {
  var mp = Y + '-' + p2(M);
  var me = FE().filter(function(e) { return e.d.indexOf(mp) === 0; });
  me.sort(function(a, b) { return a.d.localeCompare(b.d); });
  var list = document.getElementById('el');
  list.innerHTML = '';
  me.slice(0, 10).forEach(function(e) {
    var li = document.createElement('li');
    li.innerHTML = '<div class="ed">' + e.d + ' · ' + e.city + '</div><span class="etag ' + e.t + '">' + e.l + '</span>' + e.tt;
    li.onclick = function() { OD(e); };
    list.appendChild(li);
  });
}

// ========== 类型筛选 ==========
(function() {
  var ft = document.getElementById('ft');
  typeLabels.forEach(function(lb, i) {
    var sp = document.createElement('span');
    sp.className = typeKeys[i] + ' on';
    sp.textContent = lb;
    sp.onclick = function() {
      this.classList.toggle('on');
      if (this.classList.contains('on')) {
        activeFilters.add(typeKeys[i]);
      } else {
        activeFilters.delete(typeKeys[i]);
      }
      R();
    };
    ft.appendChild(sp);
  });
})();

// ========== 启动 ==========
loadData();