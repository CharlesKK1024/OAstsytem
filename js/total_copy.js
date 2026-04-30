
// 实际全贝壳总额计算逻辑

/**
 * 计算实际全贝壳总额
 * @param {Array} list - 工资明细列表
 * @returns {Object} - 包含总额、明细、每年的统计数据
 */
function calculateRealTotalShell(list) {
  if (!list || list.length === 0) return { total: 0, details: [], yearStats: {} };

  let totalRealShell = 0;
  const yearStats = {};
  const allColumns = Object.keys(list[0]);

  // 识别相关列
  const columns = {
    netSalary: '本月实发',
    personalProvidentFund: findColumn(allColumns, ['个人公积金', '公积金个人', '代扣公积金', '住房公积金']),
    companyProvidentFund: findColumn(allColumns, ['单位公积金', '公司公积金', '单位住房公积金']),
    personalSocialSecurity: findColumn(allColumns, ['个人社保', '社保个人', '代扣社保']),
    companySocialSecurity: findColumn(allColumns, ['单位社保', '公司社保', '单位医保', '公司医保', '单位基本养老保险', '单位基本医疗保险', '单位失业保险', '单位工伤保险', '单位生育保险']),
    computerSubsidy: findColumn(allColumns, ['电脑补贴']),
    leaveCashOut: findColumn(allColumns, ['年假折现', '假期折算', '未休年假', '年假折算补贴']),
    otherBenefits: findColumns(allColumns, ['过节费', '高温补贴', '通讯补贴', '交通补贴', '餐补', '出工补贴', '加班补贴'])
  };

  // 社保分项列（如果找不到统一的个人社保列时使用）
  const ssDetailCols = {
    pension: findColumn(allColumns, ['基本养老保险', '养老保险']),
    medical: findColumn(allColumns, ['基本医疗保险', '医疗保险', '个人医保']),
    unemployment: findColumn(allColumns, ['失业保险']),
    majorDisease: findColumn(allColumns, ['大病保险', '大病医疗'])
  };

  // 遍历数据
  const details = list.map(item => {
    const net = Number(item[columns.netSalary] || 0);
    const personalPF = Number(item[columns.personalProvidentFund] || 0);
    const companyPF = Number(item[columns.companyProvidentFund] || 0);
    
    // 个人社保：优先用聚合列，没有则用分项累加
    let personalSS = Number(item[columns.personalSocialSecurity] || 0);
    if (!columns.personalSocialSecurity) {
        personalSS = Number(item[ssDetailCols.pension] || 0) + 
                     Number(item[ssDetailCols.medical] || 0) + 
                     Number(item[ssDetailCols.unemployment] || 0) + 
                     Number(item[ssDetailCols.majorDisease] || 0);
    }

    const companySS = Number(item[columns.companySocialSecurity] || 0);
    const compSubsidy = Number(item[columns.computerSubsidy] || 0);
    const leaveCash = Number(item[columns.leaveCashOut] || 0);
    
    // 其他福利求和
    let otherSum = 0;
    columns.otherBenefits.forEach(col => {
      otherSum += Number(item[col] || 0);
    });

    // 计算单月实际总价值
    // 逻辑：实发 + 个人扣除部分(公积金+社保) + 公司缴纳部分(公积金+社保) + 电脑补贴 + 假期折算 + 其他
    
    // 基础计算：实发 + 公积金(个人+公司) + 社保(个人+公司)
    let realTotal = net + personalPF + companyPF + personalSS + companySS;
    
    // 加上假期折算 (通常是额外发的)
    realTotal += leaveCash;
    
    // 加上电脑补贴 (如果配置了或者它不在实发里)
    // 这里我们默认加上，但在UI中可以通过勾选去掉
    realTotal += compSubsidy;
    
    // 加上其他福利
    realTotal += otherSum;
    
    totalRealShell += realTotal;

    const year = item.月份 ? item.月份.substring(0, 4) : '未知';
    if (!yearStats[year]) {
      yearStats[year] = {
        year: year,
        net: 0,
        personalPF: 0,
        companyPF: 0,
        personalSS: 0,
        companySS: 0,
        leaveCash: 0,
        computerSubsidy: 0,
        otherSum: 0,
        total: 0,
        count: 0
      };
    }
    
    yearStats[year].net += net;
    yearStats[year].personalPF += personalPF;
    yearStats[year].companyPF += companyPF;
    yearStats[year].personalSS += personalSS;
    yearStats[year].companySS += companySS;
    yearStats[year].leaveCash += leaveCash;
    yearStats[year].computerSubsidy += compSubsidy;
    yearStats[year].otherSum += otherSum;
    yearStats[year].total += realTotal;
    yearStats[year].count++;

    return {
      month: item.月份,
      net,
      personalPF,
      companyPF,
      personalSS,
      companySS,
      leaveCash,
      computerSubsidy: compSubsidy,
      otherSum,
      realTotal
    };
  });

  return {
    total: totalRealShell,
    details,
    yearStats,
    columns
  };
}

// 辅助函数：查找列名 (优先匹配关键字)
function findColumn(columns, keywords) {
  for (const kw of keywords) {
    for (const key of columns) {
      if (key.includes(kw)) return key;
    }
  }
  return null;
}

function findColumns(columns, keywords) {
  return columns.filter(key => keywords.some(kw => key.includes(kw)));
}

// 渲染模态框内容
function renderRealTotalModal(data) {
  const modal = document.getElementById('realTotalModal');
  const tbody = document.getElementById('realTotalBody');
  const totalDisplay = document.getElementById('modalTotalDisplay');
  
  // 默认勾选状态（首次渲染）
  if (!window.realTotalConfig) {
    window.realTotalConfig = {
      net: true,
      personalPF: true,
      companyPF: true,
      personalSS: true,
      companySS: true,
      leaveCash: true,
      computerSubsidy: false, // 默认不加
      otherBenefits: false    // 默认不加
    };
  }

  // 渲染表头勾选框状态
  updateCheckboxState();

  // 绑定复选框事件
  bindCheckboxEvents(data);

  // 计算并渲染
  recalcAndRender(data);
  
  modal.style.display = 'flex';
  // 触发重绘以显示动画
  requestAnimationFrame(() => {
      modal.classList.add('show');
  });
}

function updateCheckboxState() {
    document.getElementById('checkNet').checked = window.realTotalConfig.net;
    document.getElementById('checkPPF').checked = window.realTotalConfig.personalPF;
    document.getElementById('checkCPF').checked = window.realTotalConfig.companyPF;
    document.getElementById('checkPSS').checked = window.realTotalConfig.personalSS;
    document.getElementById('checkCSS').checked = window.realTotalConfig.companySS;
    document.getElementById('checkLeave').checked = window.realTotalConfig.leaveCash;
    document.getElementById('checkComp').checked = window.realTotalConfig.computerSubsidy;
    document.getElementById('checkOther').checked = window.realTotalConfig.otherBenefits;
}

// 重新计算并渲染表格
function recalcAndRender(data) {
    const { yearStats } = data;
    const sortedYears = Object.keys(yearStats).sort().reverse();
    const tbody = document.getElementById('realTotalBody');
    let grandTotal = 0;

    tbody.innerHTML = sortedYears.map(year => {
        const stat = yearStats[year];
        let yearTotal = 0;
        
        if (window.realTotalConfig.net) yearTotal += stat.net;
        if (window.realTotalConfig.personalPF) yearTotal += stat.personalPF;
        if (window.realTotalConfig.companyPF) yearTotal += stat.companyPF;
        if (window.realTotalConfig.personalSS) yearTotal += stat.personalSS;
        if (window.realTotalConfig.companySS) yearTotal += stat.companySS;
        if (window.realTotalConfig.leaveCash) yearTotal += stat.leaveCash;
        if (window.realTotalConfig.computerSubsidy) yearTotal += stat.computerSubsidy;
        if (window.realTotalConfig.otherBenefits) yearTotal += stat.otherSum;

        grandTotal += yearTotal;

        return `
            <tr>
                <td>${year}年</td>
                <td>${stat.count}个月</td>
                <td>🐚${stat.net.toFixed(2)}</td>
                <td>${(stat.personalPF + stat.companyPF).toFixed(2)}</td>
                <td>${(stat.personalSS + stat.companySS).toFixed(2)}</td>
                <td>${stat.leaveCash.toFixed(2)}</td>
                <td>${stat.computerSubsidy.toFixed(2)}</td>
                <td>${stat.otherSum.toFixed(2)}</td>
                <td class="highlight-total">🐚${yearTotal.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    // 更新总计显示
    const totalDisplay = document.getElementById('modalTotalDisplay');
    // 动画效果
    animateValue(totalDisplay, grandTotal);
    
    // 更新外部卡片（如果需要实时同步）
    // document.getElementById('realTotalShell').innerText = `🐚${grandTotal.toFixed(2)}`;
}

// 数字滚动动画
function animateValue(obj, end, duration = 800) {
    let startTimestamp = null;
    const start = parseFloat(obj.innerText.replace(/[^\d.-]/g, '')) || 0;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = start + (end - start) * progress;
        obj.innerHTML = `🐚${current.toFixed(2)} <span style="font-size:14px;color:#999">总计</span>`;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// 绑定复选框事件
function bindCheckboxEvents(data) {
    const checkboxes = document.querySelectorAll('.modal-checkbox');
    checkboxes.forEach(cb => {
        cb.onchange = (e) => {
            const key = e.target.dataset.key;
            window.realTotalConfig[key] = e.target.checked;
            recalcAndRender(data);
        };
    });
}

// 关闭模态框
function closeModal() {
    const modal = document.getElementById('realTotalModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// ================= 综合数据查询 =================

// 中文转拼音映射表
var pinyinMap = {
  '张': 'zhang', '王': 'wang', '李': 'li', '刘': 'liu', '陈': 'chen',
  '杨': 'yang', '赵': 'zhao', '黄': 'huang', '周': 'zhou', '吴': 'wu',
  '徐': 'xu', '孙': 'sun', '胡': 'hu', '朱': 'zhu', '高': 'gao',
  '林': 'lin', '何': 'he', '郭': 'guo', '马': 'ma', '罗': 'luo',
  '梁': 'liang', '宋': 'song', '郑': 'zheng', '谢': 'xie', '韩': 'han',
  '唐': 'tang', '冯': 'feng', '于': 'yu', '董': 'dong', '萧': 'xiao',
  '程': 'cheng', '曹': 'cao', '袁': 'yuan', '邓': 'deng', '许': 'xu',
  '傅': 'fu', '沈': 'shen', '曾': 'zeng', '彭': 'peng', '吕': 'lv',
  '苏': 'su', '卢': 'lu', '蒋': 'jiang', '蔡': 'cai', '贾': 'jia',
  '丁': 'ding', '魏': 'wei', '薛': 'xue', '叶': 'ye', '阎': 'yan',
  '余': 'yu', '潘': 'pan', '杜': 'du', '戴': 'dai', '夏': 'xia',
  '钟': 'zhong', '汪': 'wang', '田': 'tian', '任': 'ren', '姜': 'jiang',
  '范': 'fan', '方': 'fang', '石': 'shi', '姚': 'yao', '谭': 'tan',
  '廖': 'liao', '邹': 'zou', '熊': 'xiong', '金': 'jin', '陆': 'lu',
  '郝': 'hao', '孔': 'kong', '白': 'bai', '崔': 'cui', '康': 'kang',
  '毛': 'mao', '邱': 'qiu', '秦': 'qin', '江': 'jiang', '史': 'shi',
  '顾': 'gu', '侯': 'hou', '邵': 'shao', '孟': 'meng', '龙': 'long',
  '万': 'wan', '段': 'duan', '雷': 'lei', '钱': 'qian', '汤': 'tang',
  '尹': 'yin', '黎': 'li', '易': 'yi', '常': 'chang', '武': 'wu',
  '乔': 'qiao', '贺': 'he', '赖': 'lai', '龚': 'gong', '文': 'wen',
  '庞': 'pang', '樊': 'fan', '兰': 'lan', '殷': 'yin', '施': 'shi',
  '陶': 'tao', '洪': 'hong', '翟': 'zhai', '安': 'an', '颜': 'yan',
  '倪': 'ni', '严': 'yan', '牛': 'niu', '温': 'wen', '芦': 'lu',
  '季': 'ji', '俞': 'yu', '章': 'zhang', '鲁': 'lu', '葛': 'ge',
  '伍': 'wu', '韦': 'wei', '申': 'shen', '尤': 'you', '毕': 'bi',
  '聂': 'nie', '丛': 'cong', '焦': 'jiao', '向': 'xiang', '邢': 'xing',
  '褚': 'chu', '奚': 'xi', '骆': 'luo', '卓': 'zhuo', '莫': 'mo',
  '窦': 'dou', '山': 'shan', '桑': 'sang', '连': 'lian', '冀': 'ji',
  '景': 'jing', '詹': 'zhan', '司': 'si', '边': 'bian', '卫': 'wei',
  '楚': 'chu', '闵': 'min', '凤': 'feng', '杭': 'hang', '诸': 'zhu',
  '长孙': 'zhangsun', '公孙': 'gongsun', '轩辕': 'xuanyuan', '令狐': 'linghu',
  '钟离': 'zhongli', '宇文': 'yuwen', '上官': 'shangguan', '夏侯': 'xiahou',
  '诸葛': 'zhuge', '东方': 'dongfang', '皇甫': 'huangfu', '尉迟': 'weichi',
  '慕容': 'murong', '拓跋': 'tuoba', '呼延': 'huyan', '完颜': 'wanyan'
};

function chineseToPinyin(chinese) {
  var result = '';
  for (var i = 0; i < chinese.length; i++) {
    var char = chinese[i];
    if (pinyinMap[char]) {
      result += pinyinMap[char];
    } else if (i + 1 < chinese.length && pinyinMap[chinese.substring(i, i + 2)]) {
      result += pinyinMap[chinese.substring(i, i + 2)];
      i++;
    } else if (/[一-龥]/.test(char)) {
      result += char.charCodeAt(0).toString(16);
    } else {
      result += char.toLowerCase();
    }
  }
  return result;
}

function handleComprehensiveQuery() {
  console.log('🔍 [综合查询] 按钮被点击！');
  var nameInput = document.getElementById('comprehensiveNameInput');
  var name = nameInput.value.trim();
  console.log('📝 [综合查询] 输入的姓名: "' + name + '"');

  if (!name) {
    alert('请输入员工姓名');
    return;
  }

  var queryBtn = document.getElementById('comprehensiveQueryBtn');
  var originalBtnText = queryBtn.innerText;
  queryBtn.disabled = true;
  queryBtn.innerText = '查询中...';

  var nameInEnglish = chineseToPinyin(name);
  console.log('🔤 [综合查询] 拼音: "' + nameInEnglish + '"');

  var queryParams = {
    "查询条件": "用户名#" + nameInEnglish + "|员工姓名#|部门id#14,4,18,6,8,17,16,15,1,10,13,7|",
    "地市ID": -1
  };
  var params = [{
    "entry": "vtmng3001.attendance..mtex-mtplat",
    "param": JSON.stringify(queryParams)
  }];

  var formData = new URLSearchParams();
  formData.append('params', JSON.stringify(params));

  var requestFn = (typeof requestWithToken === 'function') ? requestWithToken : function(url, opts) {
    var token = localStorage.getItem('mtex_token') || '';
    opts.headers = opts.headers || {};
    opts.headers['token'] = token;
    return fetch(url, opts).then(function(r) { return r.json(); });
  };

  requestFn('https://www.mastercom.cn/mtex/advdata/doMutliQuery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData
  }).then(function(response) {
    console.log('📥 [综合查询] 接口返回:', response);

    if (response.type === 0 && response.data && response.data.length > 0) {
      var data = response.data[0].data;
      var employeeList = data.tables[0];
      console.log('📊 [综合查询] 查询到 ' + (employeeList ? employeeList.length : 0) + ' 条记录');

      if (!employeeList || employeeList.length === 0) {
        throw new Error('未查询到相关员工数据');
      }

      var tbody = document.getElementById('comprehensiveTableBody');
      if (tbody) {
        tbody.innerHTML = '';
        employeeList.forEach(function(emp) {
          var tr = document.createElement('tr');
          tr.style.cursor = 'pointer';
          tr.onmouseover = function() { tr.style.background = 'rgba(64,158,255,0.1)'; };
          tr.onmouseout = function() { tr.style.background = 'transparent'; };
          tr.onclick = function() { fillDetailCards(emp); };

          var status = emp['在职状态'] || 'unknown';
          tr.innerHTML =
            '<td>' + (emp['员工id'] || '-') + '</td>' +
            '<td><strong>' + (emp['姓名'] || '-') + '</strong></td>' +
            '<td><span class="status-badge status-' + status + '">' + status + '</span></td>' +
            '<td>' + (emp['部门名称'] || '-') + '</td>' +
            '<td>' + (emp['当前周期总年休假'] != null ? emp['当前周期总年休假'] : '-') + '</td>' +
            '<td>' + (emp['当前周期可用年休假'] != null ? emp['当前周期可用年休假'] : '-') + '</td>' +
            '<td>' + (emp['最近待结可用年休假'] != null ? emp['最近待结可用年休假'] : '-') + '</td>' +
            '<td>' + (emp['当前周期总调休假'] != null ? emp['当前周期总调休假'] : '-') + '</td>' +
            '<td>' + (emp['当前周期可用调休假'] != null ? emp['当前周期可用调休假'] : '-') + '</td>' +
            '<td>' + (emp['最近待结可用调休假'] != null ? emp['最近待结可用调休假'] : '-') + '</td>';
          tbody.appendChild(tr);
        });
        console.log('✅ [综合查询] 表格渲染完成');
      }

      fillDetailCards(employeeList[0]);
      console.log('🎉 [综合查询] 查询成功！共 ' + employeeList.length + ' 条记录');
    } else {
      throw new Error(response.message || '查询失败，接口返回异常');
    }
  }).catch(function(err) {
    console.error('❌ [综合查询] 执行出错:', err);
    alert('查询失败: ' + err.message);
  }).finally(function() {
    queryBtn.disabled = false;
    queryBtn.innerText = originalBtnText;
  });
}

function fillDetailCards(emp) {
  var map = {
    'employeeName': '姓名', 'employeeId': '员工id', 'employeeStatus': '在职状态',
    'departmentName': '部门名称', 'totalAnnualLeave': '当前周期总年休假',
    'availableAnnualLeave': '当前周期可用年休假', 'pendingAnnualLeave': '最近待结可用年休假',
    'totalFlexLeave': '当前周期总调休假', 'availableFlexLeave': '当前周期可用调休假',
    'pendingFlexLeave': '最近待结可用调休假'
  };
  for (var id in map) {
    var el = document.getElementById(id);
    if (el) {
      var val = emp[map[id]];
      el.textContent = (val !== undefined && val !== null) ? val : '-';
    }
  }
}
