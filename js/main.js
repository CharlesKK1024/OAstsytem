// 折叠/展开面板函数 - 优化动画
function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  const btn = document.getElementById(`${panelId.replace("Body", "Btn")}`);

  if (panel.classList.contains("collapsed")) {
    panel.classList.remove("collapsed");
    btn.textContent = "−";
  } else {
    panel.classList.add("collapsed");
    btn.textContent = "+";
  }
}

// DOM元素获取
const nameInput = document.getElementById("nameInput");
const startMonthInput = document.getElementById("startMonth");
const endMonthInput = document.getElementById("endMonth");
const queryBtn = document.getElementById("queryBtn");
const themeBtn = document.getElementById("themeBtn"); // 新增主题切换按钮
const tipDom = document.getElementById("tip");

// 主题状态 - 优先从localStorage获取
let isDarkMode = localStorage.getItem("theme_mode") === "true";

// 初始化页面主题样式 (图表颜色需在图表初始化后更新)
if (isDarkMode) {
  document.body.classList.add("dark-mode");
  themeBtn.innerText = "☀️ 浅色模式";
}

// 主题切换事件
themeBtn.onclick = () => {
  isDarkMode = !isDarkMode;
  localStorage.setItem("theme_mode", isDarkMode);
  document.body.classList.toggle("dark-mode", isDarkMode);
  themeBtn.innerText = isDarkMode ? "☀️ 浅色模式" : "🌙 深色模式";
  updateChartsTheme();
};

/**
 * 更新图表主题颜色
 */
function updateChartsTheme() {
  const textColor = isDarkMode ? "#e0e0e0" : "#333";
  const lineColor = isDarkMode ? "#00f3ff" : "#409EFF"; // 荧光蓝 vs 默认蓝
  const areaColorStart = isDarkMode
    ? "rgba(0, 243, 255, 0.5)"
    : "rgba(64, 158, 255, 0.8)";
  const areaColorEnd = isDarkMode
    ? "rgba(0, 243, 255, 0.1)"
    : "rgba(64, 158, 255, 0.1)";
  const splitLineColor = isDarkMode ? "#333" : "#eee";

  const commonOption = {
    title: { textStyle: { color: textColor } },
    legend: { textStyle: { color: textColor } },
    xAxis: {
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: isDarkMode ? "#555" : "#333" } },
    },
    yAxis: {
      nameTextStyle: { color: textColor },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: splitLineColor } },
    },
    tooltip: {
      backgroundColor: isDarkMode ? "rgba(30,30,30,0.9)" : "#fff",
      borderColor: isDarkMode ? "#00f3ff" : "#ccc",
      textStyle: { color: isDarkMode ? "#00f3ff" : "#333" },
    },
  };

  // 1. 工资趋势图
  salaryTrendChart.setOption({
    ...commonOption,
    series: [
      {
        itemStyle: { color: lineColor },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: areaColorStart },
            { offset: 1, color: areaColorEnd },
          ]),
        },
      },
    ],
  });

  // 2. 加班趋势图
  overtimeTrendChart.setOption({
    ...commonOption,
    series: [
      {
        itemStyle: { color: isDarkMode ? "#e6a23c" : "#e6a23c" }, // 保持橙色，或改为荧光橙
        label: { color: textColor },
      },
    ],
  });

  // 3. 专项奖金趋势图
  bonusTrendChart.setOption({
    ...commonOption,
    series: [
      {
        itemStyle: { color: isDarkMode ? "#00ff9d" : "#67C23A" }, // 荧光绿 vs 绿色
        label: { color: textColor },
      },
    ],
  });

  // 4. 涨薪对比图 (需要在 renderAllCharts 里保存原始数据或者重新根据当前数据刷新，这里简化处理只更新样式)
  // 由于 setOption 是 merge 模式，我们只需要更新样式配置即可
  raiseCompareChart.setOption(commonOption);

  // 5. 收入构成图
  incomeCompositionChart.setOption({
    ...commonOption,
    title: { textStyle: { color: textColor } },
    legend: { textStyle: { color: textColor } },
    series: [
      {
        label: { color: textColor },
      },
    ],
  });
}

// 核心分析指标DOM
const joinDateDom = document.getElementById("joinDate");
const currentSalaryDom = document.getElementById("currentSalary");
const totalIncomeDom = document.getElementById("totalIncome");
const monthAvgIncomeDom = document.getElementById("monthAvgIncome");
const yearAvgIncomeDom = document.getElementById("yearAvgIncome");
const workMonthsDom = document.getElementById("workMonths");
const totalOvertimeDaysDom = document.getElementById("totalOvertimeDays");
const totalLeaveDaysDom = document.getElementById("totalLeaveDays");
const monthAvgOvertimeDom = document.getElementById("monthAvgOvertime");
const totalSpecialBonusDom = document.getElementById("totalSpecialBonus");
const monthAvgBonusDom = document.getElementById("monthAvgBonus");
const totalRaiseTimesDom = document.getElementById("totalRaiseTimes");
const totalRaiseAmountDom = document.getElementById("totalRaiseAmount");
const avgRaiseRateDom = document.getElementById("avgRaiseRate");
const avgRaiseCycleDom = document.getElementById("avgRaiseCycle");
const realTotalShellDom = document.getElementById("realTotalShell"); // 新增

const raiseRecordBody = document.getElementById("raiseRecordBody");
const infoCardsGrid = document.getElementById("infoCardsGrid");

const table2Head = document.querySelector("#table2 thead");
const table2Body = document.querySelector("#table2 tbody");

// ECharts初始化
const salaryTrendChart = echarts.init(
  document.getElementById("salaryTrendChart"),
);
const overtimeTrendChart = echarts.init(
  document.getElementById("overtimeTrendChart"),
);
const bonusTrendChart = echarts.init(
  document.getElementById("bonusTrendChart"),
);
const raiseCompareChart = echarts.init(
  document.getElementById("raiseCompareChart"),
);
const incomeCompositionChart = echarts.init(
  document.getElementById("incomeCompositionChart"),
);
const salaryRatioChart = echarts.init(
  document.getElementById("salaryRatioChart"),
);

// 初始化所有面板
initAllPanels();
initAllCharts();

// 如果是深色模式，初始化时应用图表主题
if (isDarkMode) {
  updateChartsTheme();
}

// 接口配置
const LOGIN_API = "/api/mtex/login/check/";
const API1 = "/api/mtex/report/event/executeSql";
const API2 = "/api/mtex/advdata/doMutliQuery";

// ================= 综合数据查询 =================

const pinyinMap = {
  张: "zhang",
  王: "wang",
  李: "li",
  刘: "liu",
  陈: "chen",
  杨: "yang",
  赵: "zhao",
  黄: "huang",
  周: "zhou",
  吴: "wu",
  徐: "xu",
  孙: "sun",
  胡: "hu",
  朱: "zhu",
  高: "gao",
  林: "lin",
  何: "he",
  郭: "guo",
  马: "ma",
  罗: "luo",
  梁: "liang",
  宋: "song",
  郑: "zheng",
  谢: "xie",
  韩: "han",
  唐: "tang",
  冯: "feng",
  于: "yu",
  董: "dong",
  萧: "xiao",
  程: "cheng",
  曹: "cao",
  袁: "yuan",
  邓: "deng",
  许: "xu",
  傅: "fu",
  沈: "shen",
  曾: "zeng",
  彭: "peng",
  吕: "lv",
  苏: "su",
  卢: "lu",
  蒋: "jiang",
  蔡: "cai",
  贾: "jia",
  丁: "ding",
  魏: "wei",
  薛: "xue",
  叶: "ye",
  阎: "yan",
  余: "yu",
  潘: "pan",
  杜: "du",
  戴: "dai",
  夏: "xia",
  钟: "zhong",
  汪: "wang",
  田: "tian",
  任: "ren",
  姜: "jiang",
  范: "fan",
  方: "fang",
  石: "shi",
  姚: "yao",
  谭: "tan",
  廖: "liao",
  邹: "zou",
  熊: "xiong",
  金: "jin",
  陆: "lu",
  郝: "hao",
  孔: "kong",
  白: "bai",
  崔: "cui",
  康: "kang",
  毛: "mao",
  邱: "qiu",
  秦: "qin",
  江: "jiang",
  史: "shi",
  顾: "gu",
  侯: "hou",
  邵: "shao",
  孟: "meng",
  龙: "long",
  万: "wan",
  段: "duan",
  雷: "lei",
  钱: "qian",
  汤: "tang",
  尹: "yin",
  黎: "li",
  易: "yi",
  常: "chang",
  武: "wu",
  乔: "qiao",
  贺: "he",
  赖: "lai",
  龚: "gong",
  文: "wen",
  庞: "pang",
  樊: "fan",
  兰: "lan",
  殷: "yin",
  施: "shi",
  陶: "tao",
  洪: "hong",
  翟: "zhai",
  安: "an",
  颜: "yan",
  倪: "ni",
  严: "yan",
  牛: "niu",
  温: "wen",
  芦: "lu",
  季: "ji",
  俞: "yu",
  章: "zhang",
  鲁: "lu",
  葛: "ge",
  伍: "wu",
  韦: "wei",
  申: "shen",
  尤: "you",
  毕: "bi",
  聂: "nie",
  丛: "cong",
  焦: "jiao",
  向: "xiang",
  邢: "xing",
  褚: "chu",
  奚: "xi",
  骆: "luo",
  卓: "zhuo",
  莫: "mo",
  窦: "dou",
  山: "shan",
  桑: "sang",
  连: "lian",
  冀: "ji",
  景: "jing",
  詹: "zhan",
  司: "si",
  边: "bian",
  卫: "wei",
  楚: "chu",
  闵: "min",
  凤: "feng",
  杭: "hang",
  诸: "zhu",
  长孙: "zhangsun",
  公孙: "gongsun",
  轩辕: "xuanyuan",
  令狐: "linghu",
  钟离: "zhongli",
  宇文: "yuwen",
  上官: "shangguan",
  夏侯: "xiahou",
  诸葛: "zhuge",
  东方: "dongfang",
  皇甫: "huangfu",
  尉迟: "weichi",
  慕容: "murong",
  拓跋: "tuoba",
  呼延: "huyan",
  完颜: "wanyan",
};

function chineseToPinyin(chinese) {
  let result = "";
  for (let i = 0; i < chinese.length; i++) {
    const char = chinese[i];
    if (pinyinMap[char]) {
      result += pinyinMap[char];
    } else if (
      i + 1 < chinese.length &&
      pinyinMap[chinese.substring(i, i + 2)]
    ) {
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

async function handleComprehensiveQuery() {
  const nameInput = document.getElementById("comprehensiveNameInput");
  const name = nameInput.value.trim();

  if (!name) {
    alert("请输入员工姓名");
    return;
  }

  const queryBtn = document.getElementById("comprehensiveQueryBtn");
  const originalBtnText = queryBtn.innerText;
  queryBtn.disabled = true;
  queryBtn.innerText = "查询中...";

  try {
    const nameInEnglish = chineseToPinyin(name);

    const queryParams = {
      查询条件:
        "用户名#" +
        nameInEnglish +
        "|员工姓名#|部门id#14,4,18,6,8,17,16,15,1,10,13,7|",
      地市ID: -1,
    };
    const params = [
      {
        entry: "vtmng3001.attendance..mtex-mtplat",
        param: JSON.stringify(queryParams),
      },
    ];

    const formData = new URLSearchParams();
    formData.append("params", JSON.stringify(params));

    const response = await requestWithToken(API2, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    if (response.type === 0 && response.data && response.data.length > 0) {
      const data = response.data[0].data;
      const employeeList = data.tables[0];

      if (!employeeList || employeeList.length === 0) {
        alert("未查询到相关员工数据");
        return;
      }

      const tbody = document.getElementById("comprehensiveTableBody");
      if (tbody) {
        tbody.innerHTML = "";
        employeeList.forEach((emp) => {
          const tr = document.createElement("tr");
          tr.style.cursor = "pointer";
          tr.onmouseover = () => {
            tr.style.background = "rgba(64,158,255,0.1)";
          };
          tr.onmouseout = () => {
            tr.style.background = "transparent";
          };
          tr.onclick = () => fillDetailCards(emp);

          const status = emp["在职状态"] || "unknown";
          tr.innerHTML =
            "<td>" +
            (emp["员工id"] ?? "-") +
            "</td>" +
            "<td><strong>" +
            (emp["姓名"] ?? "-") +
            "</strong></td>" +
            '<td><span class="status-badge status-' +
            status +
            '">' +
            status +
            "</span></td>" +
            "<td>" +
            (emp["部门名称"] ?? "-") +
            "</td>" +
            "<td>" +
            (emp["当前周期总年休假"] ?? "-") +
            "</td>" +
            "<td>" +
            (emp["当前周期可用年休假"] ?? "-") +
            "</td>" +
            "<td>" +
            (emp["最近待结可用年休假"] ?? "-") +
            "</td>" +
            "<td>" +
            (emp["当前周期总调休假"] ?? "-") +
            "</td>" +
            "<td>" +
            (emp["当前周期可用调休假"] ?? "-") +
            "</td>" +
            "<td>" +
            (emp["最近待结可用调休假"] ?? "-") +
            "</td>";
          tbody.appendChild(tr);
        });
      }

      fillDetailCards(employeeList[0]);
      saveComprehensiveHistory(name, employeeList[0]);
    } else {
      alert("查询失败: " + (response.message || "接口返回异常"));
    }
  } catch (err) {
    console.error("综合查询出错:", err);
    alert("查询失败: " + err.message);
  } finally {
    queryBtn.disabled = false;
    queryBtn.innerText = originalBtnText;
  }
}

function fillDetailCards(emp) {
  const map = {
    employeeName: "姓名",
    employeeId: "员工id",
    employeeStatus: "在职状态",
    departmentName: "部门名称",
    totalAnnualLeave: "当前周期总年休假",
    availableAnnualLeave: "当前周期可用年休假",
    pendingAnnualLeave: "最近待结可用年休假",
    totalFlexLeave: "当前周期总调休假",
    availableFlexLeave: "当前周期可用调休假",
    pendingFlexLeave: "最近待结可用调休假",
  };
  for (const id in map) {
    const el = document.getElementById(id);
    if (el) {
      const val = emp[map[id]];
      el.textContent = val !== undefined && val !== null ? val : "-";
    }
  }
}

// ================= 综合查询历史记录（IndexedDB） =================

function saveComprehensiveHistory(name, empData) {
  if (!db) return;
  const recordId = "comp_" + name + "_" + Date.now();
  const transaction = db.transaction([COMPREHENSIVE_STORE], "readwrite");
  const store = transaction.objectStore(COMPREHENSIVE_STORE);
  const record = {
    id: recordId,
    name: name,
    employeeId: empData["员工id"] || "-",
    departmentName: empData["部门名称"] || "-",
    status: empData["在职状态"] || "-",
    totalAnnualLeave: empData["当前周期总年休假"],
    availableAnnualLeave: empData["当前周期可用年休假"],
    pendingAnnualLeave: empData["最近待结可用年休假"],
    totalFlexLeave: empData["当前周期总调休假"],
    availableFlexLeave: empData["当前周期可用调休假"],
    pendingFlexLeave: empData["最近待结可用调休假"],
    queryTime: new Date().getTime(),
  };
  store.put(record);
  transaction.oncomplete = () => {
    console.log("综合查询历史已保存:", name);
    loadComprehensiveHistory();
  };
}

function loadComprehensiveHistory() {
  if (!db) return;
  const transaction = db.transaction([COMPREHENSIVE_STORE], "readonly");
  const store = transaction.objectStore(COMPREHENSIVE_STORE);
  const request = store.getAll();
  request.onsuccess = (event) => {
    let records = event.target.result;
    records.sort((a, b) => b.queryTime - a.queryTime);
    const seen = {};
    records = records.filter((r) => {
      if (seen[r.name]) return false;
      seen[r.name] = true;
      return true;
    });
    renderComprehensiveHistory(records);
  };
}

function renderComprehensiveHistory(records) {
  const wrapper = document.getElementById("comprehensiveHistoryWrapper");
  const tagsEl = document.getElementById("comprehensiveHistoryTags");
  if (!wrapper || !tagsEl) return;
  if (records.length === 0) {
    wrapper.style.display = "none";
    return;
  }
  wrapper.style.display = "block";
  tagsEl.innerHTML = records
    .map(
      (r) =>
        `<div class="history-tag" onclick="quickQueryByName('${r.name}')">
          <div class="name-row">${r.name} <span style="font-size:11px;color:#909399;margin-left:4px;">${r.departmentName}</span>
          <span class="close" onclick="deleteComprehensiveHistory(event, '${r.id}', '${r.name}')">×</span></div>
        </div>`,
    )
    .join("");
}

function quickQueryByName(name) {
  const input = document.getElementById("comprehensiveNameInput");
  if (input) {
    input.value = name;
    handleComprehensiveQuery();
  }
}

function deleteComprehensiveHistory(event, id, name) {
  event.stopPropagation();
  if (!confirm(`确定删除 ${name} 的查询历史吗？`)) return;
  if (!db) return;
  const transaction = db.transaction([COMPREHENSIVE_STORE], "readwrite");
  const store = transaction.objectStore(COMPREHENSIVE_STORE);
  store.delete(id);
  transaction.oncomplete = () => loadComprehensiveHistory();
}

// 登录参数（硬编码）
const LOGIN_PARAMS = {
  name: "MemhhbmAd4aW5nbG9uZw==D",
  password: "MZ2ZkcA2ExMjM0NTY=D",
  verifyId: "b6549584-a135-256d-1610-48fb1c286466",
};
let globalToken = ""; // 动态获取

/**
 * 自动登录获取Token
 */
async function doLogin() {
  const formData = new URLSearchParams();
  for (const key in LOGIN_PARAMS) {
    formData.append(key, LOGIN_PARAMS[key]);
  }

  const res = await fetch(LOGIN_API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });
  const json = await res.json();
  if (json.data && json.data.token) {
    globalToken = json.data.token;
    localStorage.setItem("mtex_token", globalToken); // 存入 localStorage
    console.log("登录成功，Token:", globalToken);
  } else {
    throw new Error(
      json.message || json.errorMessage || "登录失败，未获取到Token",
    );
  }
}

/**
 * 通用请求函数：包含Token自动获取与过期重试机制
 */
async function requestWithToken(url, options = {}) {
  // 1. 优先从内存或缓存获取Token
  if (!globalToken) {
    globalToken = localStorage.getItem("mtex_token");
  }

  // 2. 如果没有Token，尝试登录
  if (!globalToken) {
    console.log("无Token，尝试自动登录...");
    await doLogin();
  }

  // 3. 构造请求头
  const headers = { ...options.headers };
  headers["token"] = globalToken;

  const fetchOptions = { ...options, headers };

  // 4. 发起请求
  let res = await fetch(url, fetchOptions);
  let json = await res.json();

  // 5. 检查Token是否过期 (type: 3 或 特定消息)
  if (
    json.type === 3 ||
    json.data === "尚未登录或登录超时" ||
    json.message === "尚未登录或登录超时"
  ) {
    console.log("Token过期或失效，正在重新登录并重试...");
    localStorage.removeItem("mtex_token");
    globalToken = "";

    // 重新登录
    await doLogin();

    // 更新Token并重试
    headers["token"] = globalToken;
    res = await fetch(url, { ...options, headers });
    json = await res.json();
  }

  return json;
}

// 查询按钮点击事件
queryBtn.onclick = async () => {
  const name = nameInput.value.trim();
  if (!name) {
    tip("请输入员工姓名", "error");
    return;
  }
  const startMonth = startMonthInput.value.trim();
  const endMonth = endMonthInput.value.trim();

  if (!/^\d{8}$/.test(startMonth) || !/^\d{8}$/.test(endMonth)) {
    tip("时间格式错误，请输入8位数字（如20180101）", "error");
    return;
  }

  queryBtn.disabled = true;
  queryBtn.innerText = "查询中...";
  tip("正在获取员工基础信息...", "normal");
  initAllPanels();

  try {
    // 1. 查询基础信息 (自动处理Token)
    const json1 = await requestWithToken(API1, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dashId: 1002,
        eventId: 0,
        actionId: 2,
        serverId: 3,
        cacheDuration: 0,
        params: { 员工姓名: name },
        unlimited: true,
        isRelease: true,
      }),
    });

    renderInfoCards(json1); // 渲染基础信息卡片
    const employeeId = json1?.data?.tables?.[0]?.[0]?.["员工ID"];
    if (!employeeId) {
      tip("未查询到员工ID", "error");
      showEmptyTable(table2Head, table2Body);
      return;
    }

    // 第二步：查询工资明细
    tip(`员工ID：${employeeId}，正在查询贝壳明细...`, "normal");
    const paramStr = `{"地市ID":-1,"查询条件":"员工ID#${employeeId}|开始月份#${startMonth}|结束月份#${endMonth}|"}`;
    const paramsArr = [
      {
        entry: "payroll1001.paymngv3..mtex-mtplat",
        param: paramStr,
      },
    ];
    const formData = new URLSearchParams();
    formData.append("params", JSON.stringify(paramsArr));

    const json2 = await requestWithToken(API2, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    // 统一渲染并保存到缓存
    const analysisResult = renderEmployeeData(
      json1,
      json2,
      startMonth,
      endMonth,
    );

    // 获取当前工资 (使用分析函数计算出的修正值)
    let currentSalary = analysisResult.validCurrentSalary || 0;
    // if (analysisResult && analysisResult.baseTotalArr && analysisResult.baseTotalArr.length > 0) {
    //   currentSalary = analysisResult.baseTotalArr[analysisResult.baseTotalArr.length - 1]
    // }

    saveEmployeeToDB(
      employeeId,
      name,
      json1,
      json2,
      startMonth,
      endMonth,
      currentSalary,
    );

    tip(`查询成功！员工ID：${employeeId}，已完成全维度数据分析`, "success");
  } catch (err) {
    tip("查询异常：" + err.message, "error");
  } finally {
    queryBtn.disabled = false;
    queryBtn.innerText = "查询全部数据";
  }
};

// 员工基础信息渲染
function renderInfoCards(json) {
  const heads = json?.data?.heads?.[0] || [];
  const list = json?.data?.tables?.[0] || [];
  if (!heads.length || !list.length) {
    infoCardsGrid.innerHTML = `<div class="empty">暂无员工基础信息</div>`;
    return;
  }
  const item = list[0];
  let html = "";

  // 1. 优先显示的字段
  const priorityFields = ["部门名称", "岗位全称", "户籍所在地"];

  // 2. 尝试从身份证获取信息
  let idCard = "";
  // 遍历所有字段寻找身份证
  for (const key in item) {
    if (key.includes("身份证") || key.includes("证件号码")) {
      idCard = item[key];
      break;
    }
  }

  let birthDate = "-";
  let gradDate = "-";

  if (idCard && idCard.length === 18) {
    // 出生日期: 6-14位 (YYYYMMDD)
    const year = idCard.substring(6, 10);
    const month = idCard.substring(10, 12);
    const day = idCard.substring(12, 14);
    birthDate = `${year}-${month}-${day}`;

    // 毕业时间推算 (出生年份 + 22年, 默认6月)
    // 注意：如果有真实的毕业时间字段，后面会覆盖
    gradDate = `${Number(year) + 22}-06-30 (推算)`;
  }

  // 3. 构建渲染列表
  // 先加入优先字段
  priorityFields.forEach((key) => {
    // 检查原数据中是否有该字段，如果有则渲染，没有则跳过或显示空
    // 这里假设 heads 里可能不完全包含，但 item 里可能有
    const val = item[key] || "-";
    html += `
        <div class="info-card highlight-card">
          <div class="label">★ ${key}</div>
          <div class="value">${val}</div>
        </div>
      `;
  });

  // 加入计算字段 (出生日期, 毕业时间)
  // 检查是否已有同名字段，避免重复，但为了突出显示，这里强制加入
  html += `
    <div class="info-card highlight-card-blue">
      <div class="label">🎂 出生日期</div>
      <div class="value">${birthDate}</div>
    </div>
    <div class="info-card highlight-card-blue">
      <div class="label">🎓 毕业时间</div>
      <div class="value">${item["毕业时间"] || gradDate}</div>
    </div>
  `;

  // 渲染剩余字段
  heads.forEach((key) => {
    // 跳过已渲染的优先字段
    if (priorityFields.includes(key)) return;
    // 跳过身份证字段（保护隐私？或者不展示？用户没说不展示，但通常不展示原始身份证）
    // 这里还是正常展示吧，除非用户说隐藏

    // 如果已有毕业时间字段，且我们在上面已经展示了，这里是否还展示？
    // 为了不重复，如果 key 是 '毕业时间'，跳过
    if (key === "毕业时间") return;

    const label = key;
    const value = item[key] ?? "-";
    html += `
      <div class="info-card">
        <div class="label">${label}</div>
        <div class="value">${value}</div>
      </div>
    `;
  });

  infoCardsGrid.innerHTML = html;
}

// 核心数据分析函数 - 新增更多智能分析指标
function analysisAllSalaryData(json, startMonth, endMonth) {
  const dataWrap = json?.data?.[0]?.data;
  const list = dataWrap?.tables?.[0] || [];
  if (!list.length) {
    tip("未查询到贝壳明细数据，无法分析", "error");
    return {};
  }

  // 基础信息计算
  const firstMonth = list[0].月份 || "";
  const joinDate = formatDate(firstMonth);
  joinDateDom.innerText = joinDate || "格式异常";

  // 计算在职月数
  const workMonths = list.length;
  workMonthsDom.innerText = workMonths || "0";

  let totalIncome = 0;
  let totalOvertimeDays = 0;
  let totalLeaveDays = 0;
  let totalSpecialBonus = 0;
  let raiseRecords = [];
  let totalRaiseAmount = 0;

  let salaryArr = [];
  let baseTotalArr = [];
  let overtimeDaysArr = [];
  let bonusArr = [];
  let monthArr = [];
  let basicSalaryArr = [];
  let performanceSalaryArr = [];
  let workSubsidyArr = [];

  // 遍历所有数据
  list.forEach((item, index) => {
    // 实发工资
    const salary = Number(item.本月实发 || 0);
    totalIncome += salary;
    salaryArr.push(salary);

    // 基本工资/绩效/出工补贴
    const basicSalary = Number(item.基本工资 || 0);
    const performanceSalary = Number(item.绩效工资 || 0);
    const workSubsidy = Number(item.出工补贴 || 0);
    const baseTotal = basicSalary + performanceSalary + workSubsidy;

    basicSalaryArr.push(basicSalary);
    performanceSalaryArr.push(performanceSalary);
    workSubsidyArr.push(workSubsidy);
    baseTotalArr.push(baseTotal);

    // 当前贝壳价值（逻辑已移至循环外计算）
    // if (index === list.length - 1) { ... }

    // 加班天数（按50元/天换算）
    const overtimeSubsidy = Number(item.加班补贴 || 0);
    const overtimeDays = overtimeSubsidy / 50;
    totalOvertimeDays += overtimeDays;
    overtimeDaysArr.push(overtimeDays);

    // 请假天数
    const leaveDays = Number(item.请假天数 || 0) + Number(item.不出工天数 || 0);
    totalLeaveDays += leaveDays;

    // 专项奖金
    const specialBonus = Number(item.专项奖金 || 0);
    totalSpecialBonus += specialBonus;
    bonusArr.push(specialBonus);

    // 月份格式化
    const month = formatDate(item.月份) || item.月份;
    monthArr.push(month);

    // 智能识别涨薪（仅整数涨幅，100倍数）
    if (index > 0) {
      const preBaseTotal = baseTotalArr[index - 1];
      const curBaseTotal = baseTotal;
      const raiseAmount = curBaseTotal - preBaseTotal;

      // 涨薪判断条件：涨幅>0、整数、100的倍数、300/500/1000等合理幅度
      if (
        raiseAmount > 0 &&
        Math.round(raiseAmount) === raiseAmount &&
        raiseAmount % 100 === 0 &&
        raiseAmount >= 300
      ) {
        const raiseRate = ((raiseAmount / preBaseTotal) * 100).toFixed(2);
        const raiseYear = month.substring(0, 4);
        let raiseType = "普通涨薪";
        if (raiseAmount >= 1000) raiseType = "大幅涨薪";
        else if (raiseAmount >= 500) raiseType = "中等涨薪";
        else if (raiseAmount >= 300) raiseType = "小幅涨薪";

        raiseRecords.push({
          date: month,
          preSalary: preBaseTotal.toFixed(2),
          curSalary: curBaseTotal.toFixed(2),
          raiseAmount: raiseAmount.toFixed(2),
          raiseRate: `${raiseRate}%`,
          raiseYear: raiseYear,
          raiseType: raiseType,
        });
        totalRaiseAmount += raiseAmount;
      }
    }
  });

  // 计算当前工资（修正算法：若最后一条数据<6000，取倒数第二条）
  let validCurrentSalary = 0;
  if (baseTotalArr.length > 0) {
    let lastVal = baseTotalArr[baseTotalArr.length - 1];
    // 如果最后一条数据小于6000，可能是离职结算月，取倒数第二条数据
    if (lastVal < 6000 && baseTotalArr.length > 1) {
      lastVal = baseTotalArr[baseTotalArr.length - 2];
    }
    validCurrentSalary = lastVal;
  }
  currentSalaryDom.innerText = `🐚${validCurrentSalary.toFixed(2)}`;

  // 计算各类平均值
  const monthCount = list.length;
  const yearCount = monthCount / 12;
  const monthAvg = monthCount > 0 ? (totalIncome / monthCount).toFixed(2) : 0;
  const yearAvg = yearCount > 0 ? (totalIncome / yearCount).toFixed(2) : 0;
  const monthAvgOvertime =
    monthCount > 0 ? (totalOvertimeDays / monthCount).toFixed(1) : 0;
  const monthAvgBonus =
    monthCount > 0 ? (totalSpecialBonus / monthCount).toFixed(2) : 0;

  // 涨薪相关计算
  const raiseTimes = raiseRecords.length;
  const avgRaiseRate =
    raiseTimes > 0 ? (totalRaiseAmount / raiseTimes).toFixed(2) : 0;
  const avgRaiseCycle =
    raiseTimes > 0 ? (monthCount / raiseTimes).toFixed(1) : 0;

  // 赋值到DOM
  totalIncomeDom.innerText = `🐚${totalIncome.toFixed(2)}`;
  monthAvgIncomeDom.innerText = `🐚${monthAvg}`;
  yearAvgIncomeDom.innerText = `🐚${yearAvg}`;
  totalOvertimeDaysDom.innerText = `${totalOvertimeDays.toFixed(1)} 天`;
  totalLeaveDaysDom.innerText = `${totalLeaveDays.toFixed(1)} 天`;
  monthAvgOvertimeDom.innerText = `${monthAvgOvertime} 天/月`;
  totalSpecialBonusDom.innerText = `🐚${totalSpecialBonus.toFixed(2)}`;
  monthAvgBonusDom.innerText = `🐚${monthAvgBonus}`;
  totalRaiseTimesDom.innerText = raiseTimes || "0";
  totalRaiseAmountDom.innerText = `🐚${totalRaiseAmount.toFixed(2)}`;
  avgRaiseRateDom.innerText = `${avgRaiseRate} 元/次`;
  avgRaiseCycleDom.innerText = `${avgRaiseCycle} 月/次`;

  // 渲染涨薪记录
  renderRaiseRecordTable(raiseRecords);

  // 新增：计算实际全贝壳总额
  const realTotalResult = calculateRealTotalShell(list);
  realTotalShellDom.innerText = `🐚${realTotalResult.total.toFixed(2)}`;

  // 暴露给全局以便弹窗使用
  window.currentAnalysisData = realTotalResult;

  return {
    salaryArr,
    baseTotalArr,
    overtimeDaysArr,
    bonusArr,
    monthArr,
    basicSalaryArr,
    performanceSalaryArr,
    workSubsidyArr,
    raiseRecords,
    totalIncome,
    totalSpecialBonus,
    totalOvertimeDays,
    validCurrentSalary,
    realTotalResult, // 返回给renderEmployeeData以便保存到DB
  };
}

// 渲染涨薪记录表格
function renderRaiseRecordTable(records) {
  if (!records || records.length === 0) {
    raiseRecordBody.innerHTML = `<tr><td colspan="7" class="empty">暂无符合条件的涨贝壳记录（仅显示≥300的整数涨幅）</td></tr>`;
    return;
  }
  raiseRecordBody.innerHTML = records
    .map(
      (r) => `
    <tr>
      <td>${r.date}</td>
      <td>🐚${r.preSalary}</td>
      <td class="highlight">🐚${r.curSalary}</td>
      <td class="highlight">🐚${r.raiseAmount}</td>
      <td>${r.raiseRate}</td>
      <td>${r.raiseYear}</td>
      <td>${r.raiseType}</td>
    </tr>
  `,
    )
    .join("");
}

// 渲染明细表格 - 去掉🐚符号
function renderTable2WithAdjustedColumn(json) {
  const dataWrap = json?.data?.[0]?.data;
  let heads = dataWrap?.heads?.[0] || [];
  const list = dataWrap?.tables?.[0] || [];

  if (!heads.length || !list.length) {
    showEmptyTable(table2Head, table2Body);
    return;
  }

  // 调整本月实发列位置到第二位
  const targetCol = "本月实发";
  const targetIndex = heads.indexOf(targetCol);
  if (targetIndex > -1 && targetIndex !== 1) {
    heads.splice(targetIndex, 1);
    heads.splice(1, 0, targetCol);
  }

  // 渲染表头
  table2Head.innerHTML = `<tr>${heads.map((h) => `<th>${h}</th>`).join("")}</tr>`;

  // 渲染表格内容 - 去掉🐚，直接显示数字
  table2Body.innerHTML = list
    .map(
      (item) =>
        `<tr>${heads
          .map((key) => {
            let val = item[key] ?? "-";
            if (typeof val === "number" || /^\d+(\.\d+)?$/.test(val)) {
              val = Number(val).toFixed(2); // 直接显示数字，不加🐚
            }
            return `<td>${val}</td>`;
          })
          .join("")}</tr>`,
    )
    .join("");
}

// 渲染所有图表 - 新增工资构成比例图
function renderAllCharts(data) {
  if (!data || data.monthArr.length === 0) {
    initAllCharts();
    return;
  }

  // 1. 月度实发贝壳趋势图
  salaryTrendChart.setOption({
    title: {
      text: "月度实发贝壳趋势",
      left: "center",
      textStyle: { fontSize: 16 },
    },
    tooltip: { trigger: "axis", formatter: "{b}<br/>实发贝壳：🐚{c}" },
    grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
    xAxis: { data: data.monthArr, axisLabel: { rotate: 30, fontSize: 12 } },
    yAxis: {
      type: "value",
      name: "贝壳数",
      min: 0,
      nameTextStyle: { fontSize: 12 },
    },
    series: [
      {
        name: "本月实发",
        type: "line",
        smooth: true,
        data: data.salaryArr,
        itemStyle: { color: "#409EFF" },
        lineStyle: { width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(64,158,255,0.8)" },
            { offset: 1, color: "rgba(64,158,255,0.1)" },
          ]),
        },
        markPoint: {
          data: [
            { type: "max", name: "最高值" },
            { type: "min", name: "最低值" },
          ],
        },
      },
    ],
  });

  // 2. 月度加班天数趋势图
  overtimeTrendChart.setOption({
    title: {
      text: "月度加班天数趋势",
      left: "center",
      textStyle: { fontSize: 16 },
    },
    tooltip: { trigger: "axis", formatter: "{b}<br/>加班天数：{c} 天" },
    grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
    xAxis: { data: data.monthArr, axisLabel: { rotate: 30, fontSize: 12 } },
    yAxis: {
      type: "value",
      name: "天数",
      min: 0,
      nameTextStyle: { fontSize: 12 },
    },
    series: [
      {
        name: "加班天数",
        type: "bar",
        data: data.overtimeDaysArr,
        itemStyle: { color: "#e6a23c" },
        label: { show: true, position: "top", fontSize: 10 },
        markLine: {
          data: [{ type: "average", name: "平均值" }],
        },
      },
    ],
  });

  // 3. 月度专项奖金趋势图
  bonusTrendChart.setOption({
    title: {
      text: "月度专项奖金趋势",
      left: "center",
      textStyle: { fontSize: 16 },
    },
    tooltip: { trigger: "axis", formatter: "{b}<br/>专项奖金：🐚{c}" },
    grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
    xAxis: { data: data.monthArr, axisLabel: { rotate: 30, fontSize: 12 } },
    yAxis: {
      type: "value",
      name: "贝壳数",
      min: 0,
      nameTextStyle: { fontSize: 12 },
    },
    series: [
      {
        name: "专项奖金",
        type: "line",
        smooth: true,
        data: data.bonusArr,
        itemStyle: { color: "#67c23a" },
        lineStyle: { width: 3 },
        areaStyle: { color: "rgba(103,194,58,0.2)" },
        markPoint: {
          data: [{ type: "max", name: "最高奖金" }],
        },
      },
    ],
  });

  // 4. 涨贝壳前后对比图
  if (data.raiseRecords.length > 0) {
    const ds = data.raiseRecords.map((x) => x.date);
    const ps = data.raiseRecords.map((x) => Number(x.preSalary));
    const cs = data.raiseRecords.map((x) => Number(x.curSalary));
    raiseCompareChart.setOption({
      title: {
        text: "涨贝壳前后对比",
        left: "center",
        textStyle: { fontSize: 16 },
      },
      tooltip: {
        trigger: "axis",
        formatter: "{b}<br/>涨前：🐚{c0}<br/>涨后：🐚{c1}",
      },
      grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
      xAxis: { data: ds, axisLabel: { rotate: 30, fontSize: 12 } },
      yAxis: { type: "value", name: "贝壳数", nameTextStyle: { fontSize: 12 } },
      series: [
        {
          name: "涨前",
          type: "bar",
          data: ps,
          itemStyle: { color: "#909399" },
        },
        {
          name: "涨后",
          type: "bar",
          data: cs,
          itemStyle: { color: "#409EFF" },
        },
      ],
    });
  } else {
    raiseCompareChart.setOption({
      title: {
        text: "涨贝壳前后对比",
        left: "center",
        textStyle: { fontSize: 16 },
      },
      graphic: [
        {
          type: "text",
          left: "center",
          top: "middle",
          style: { text: "暂无涨贝壳记录", fontSize: 16, fill: "#999" },
        },
      ],
    });
  }

  // 5. 最近一个月贝壳构成图
  const last = data.monthArr.length - 1;
  const bs = data.basicSalaryArr[last] || 0;
  const ps = data.performanceSalaryArr[last] || 0;
  const ws = data.workSubsidyArr[last] || 0;
  const os = data.salaryArr[last] - bs - ps - ws;

  incomeCompositionChart.setOption({
    title: {
      text: "最近一个月贝壳构成",
      left: "center",
      textStyle: { fontSize: 16 },
    },
    tooltip: { trigger: "item", formatter: "{b}: 🐚{c} ({d}%)" },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
      textStyle: { fontSize: 12 },
    },
    series: [
      {
        name: "构成",
        type: "pie",
        radius: ["40%", "70%"],
        data: [
          { value: bs, name: "基本工资" },
          { value: ps, name: "绩效工资" },
          { value: ws, name: "出工补贴" },
          { value: Math.max(os, 0), name: "其他" },
        ],
        label: { show: true, formatter: "{b}: {d}%", fontSize: 12 },
      },
    ],
  });

  // 6. 新增：工资结构比例趋势图
  salaryRatioChart.setOption({
    title: {
      text: "工资结构比例趋势",
      left: "center",
      textStyle: { fontSize: 16 },
    },
    tooltip: { trigger: "axis", formatter: "{b}<br/>{a}: 🐚{c}" },
    grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
    legend: { bottom: 0, left: "center", textStyle: { fontSize: 12 } },
    xAxis: { data: data.monthArr, axisLabel: { rotate: 30, fontSize: 12 } },
    yAxis: {
      type: "value",
      name: "贝壳数",
      min: 0,
      nameTextStyle: { fontSize: 12 },
    },
    series: [
      {
        name: "基本工资",
        type: "line",
        data: data.basicSalaryArr,
        itemStyle: { color: "#409EFF" },
      },
      {
        name: "绩效工资",
        type: "line",
        data: data.performanceSalaryArr,
        itemStyle: { color: "#67c23a" },
      },
      {
        name: "出工补贴",
        type: "line",
        data: data.workSubsidyArr,
        itemStyle: { color: "#e6a23c" },
      },
    ],
  });
}

// 日期格式化
function formatDate(dateStr) {
  if (!dateStr) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (m) return `${m[1]}年${m[2]}月${m[3]}日`;
  return dateStr;
}

// 初始化所有面板数据
function initAllPanels() {
  // 重置核心分析指标
  joinDateDom.innerText = "暂无数据";
  currentSalaryDom.innerText = "暂无数据";
  totalIncomeDom.innerText = "暂无数据";
  monthAvgIncomeDom.innerText = "暂无数据";
  yearAvgIncomeDom.innerText = "暂无数据";
  workMonthsDom.innerText = "暂无数据";
  totalOvertimeDaysDom.innerText = "暂无数据";
  totalLeaveDaysDom.innerText = "暂无数据";
  monthAvgOvertimeDom.innerText = "暂无数据";
  totalSpecialBonusDom.innerText = "暂无数据";
  monthAvgBonusDom.innerText = "暂无数据";
  totalRaiseTimesDom.innerText = "暂无数据";
  totalRaiseAmountDom.innerText = "暂无数据";
  avgRaiseRateDom.innerText = "暂无数据";
  avgRaiseCycleDom.innerText = "暂无数据";
  realTotalShellDom.innerText = "暂无数据"; // 新增

  // 重置涨薪记录
  raiseRecordBody.innerHTML = `<tr><td colspan="7" class="empty">暂无涨贝壳记录（仅显示整数涨幅）</td></tr>`;

  // 重置基础信息
  infoCardsGrid.innerHTML = `<div class="empty">暂无员工基础信息</div>`;
}

// 显示空表格
function showEmptyTable(head, body) {
  head.innerHTML = "";
  body.innerHTML = `<tr><td colspan="200" class="empty">暂无贝壳明细数据</td></tr>`;
}

// 初始化所有图表
function initAllCharts() {
  const opt = {
    title: { text: "暂无数据", left: "center", textStyle: { fontSize: 16 } },
    graphic: [
      {
        type: "text",
        left: "center",
        top: "middle",
        style: { text: "请查询数据", fontSize: 16, fill: "#999" },
      },
    ],
  };
  salaryTrendChart.setOption(opt);
  overtimeTrendChart.setOption(opt);
  bonusTrendChart.setOption(opt);
  raiseCompareChart.setOption(opt);
  incomeCompositionChart.setOption(opt);
  salaryRatioChart.setOption(opt);
}

// 提示框函数
function tip(text, type) {
  tipDom.innerText = text;
  tipDom.className = "tip";
  if (type === "success") tipDom.classList.add("tip-success");
  if (type === "error") tipDom.classList.add("tip-error");
  if (type === "normal") tipDom.classList.add("tip-normal");
}

// 回车查询
nameInput.addEventListener(
  "keydown",
  (e) => e.key === "Enter" && queryBtn.click(),
);

// 综合面板查询按钮事件（使用内联 onclick 调用，必须挂到 window 上才能被 HTML onclick 找到）
window.handleComprehensiveQuery = function () {
  console.log("🔍 [综合查询] 按钮被点击！");
  queryComprehensiveData().catch((err) => {
    console.error("❌ [综合查询] 执行失败:", err);
    alert("查询失败: " + err.message);
  });
};

// 综合面板输入框回车事件
const comprehensiveNameInput = document.getElementById(
  "comprehensiveNameInput",
);
if (comprehensiveNameInput) {
  comprehensiveNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      console.log("⌨️ [综合查询] 回车键触发");
      handleComprehensiveQuery();
    }
  });
} else {
  console.warn("⚠️ [综合查询] 未找到输入框元素 #comprehensiveNameInput");
}

// 中文转拼音函数
function chineseToPinyin(chinese) {
  // 简单的中英映射表，可以根据需要扩展
  const pinyinMap = {
    张: "zhang",
    王: "wang",
    李: "li",
    刘: "liu",
    陈: "chen",
    杨: "yang",
    赵: "zhao",
    黄: "huang",
    周: "zhou",
    吴: "wu",
    徐: "xu",
    孙: "sun",
    胡: "hu",
    朱: "zhu",
    高: "gao",
    林: "lin",
    何: "he",
    郭: "guo",
    马: "ma",
    罗: "luo",
    梁: "liang",
    宋: "song",
    郑: "zheng",
    谢: "xie",
    韩: "han",
    唐: "tang",
    冯: "feng",
    于: "yu",
    董: "dong",
    萧: "xiao",
    程: "cheng",
    曹: "cao",
    袁: "yuan",
    邓: "deng",
    许: "xu",
    傅: "fu",
    沈: "shen",
    曾: "zeng",
    彭: "peng",
    吕: "lv",
    苏: "su",
    卢: "lu",
    蒋: "jiang",
    蔡: "cai",
    贾: "jia",
    丁: "ding",
    魏: "wei",
    薛: "xue",
    叶: "ye",
    阎: "yan",
    余: "yu",
    潘: "pan",
    杜: "du",
    戴: "dai",
    夏: "xia",
    钟: "zhong",
    汪: "wang",
    田: "tian",
    任: "ren",
    姜: "jiang",
    范: "fan",
    方: "fang",
    石: "shi",
    姚: "yao",
    谭: "tan",
    廖: "liao",
    邹: "zou",
    熊: "xiong",
    金: "jin",
    陆: "lu",
    郝: "hao",
    孔: "kong",
    白: "bai",
    崔: "cui",
    康: "kang",
    毛: "mao",
    邱: "qiu",
    秦: "qin",
    江: "jiang",
    史: "shi",
    顾: "gu",
    侯: "hou",
    邵: "shao",
    孟: "meng",
    龙: "long",
    万: "wan",
    段: "duan",
    雷: "lei",
    钱: "qian",
    汤: "tang",
    尹: "yin",
    黎: "li",
    易: "yi",
    常: "chang",
    武: "wu",
    乔: "qiao",
    贺: "he",
    赖: "lai",
    龚: "gong",
    文: "wen",
    庞: "pang",
    樊: "fan",
    兰: "lan",
    殷: "yin",
    施: "shi",
    陶: "tao",
    洪: "hong",
    翟: "zhai",
    安: "an",
    颜: "yan",
    倪: "ni",
    严: "yan",
    牛: "niu",
    温: "wen",
    芦: "lu",
    季: "ji",
    俞: "yu",
    章: "zhang",
    鲁: "lu",
    葛: "ge",
    伍: "wu",
    韦: "wei",
    申: "shen",
    尤: "you",
    毕: "bi",
    聂: "nie",
    丛: "cong",
    焦: "jiao",
    向: "xiang",
    邢: "xing",
    芮: "rui",
    羿: "yi",
    靳: "jin",
    吉: "ji",
    甘: "gan",
    佃: "dian",
    牟: "mou",
    岳: "yue",
    池: "chi",
    成: "cheng",
    初: "chu",
    古: "gu",
    车: "che",
    计: "ji",
    仇: "qiu",
    幸: "xing",
    吉: "ji",
    韶: "shao",
    充: "chong",
    宓: "mi",
    盖: "gai",
    花: "hua",
    迮: "ze",
    权: "quan",
    佴: "nai",
    伯: "bo",
    赏: "shang",
    那: "na",
    相: "xiang",
    佟: "tong",
    封: "feng",
    闻: "wen",
    生: "sheng",
    别: "bie",
    麦: "mai",
    门: "men",
    战: "zhan",
    南: "nan",
    玉: "yu",
    谯: "qiao",
    阿: "a",
    务: "wu",
    淡: "dan",
    宇: "yu",
    招: "zhao",
    辛: "xin",
    韶: "shao",
    区: "ou",
    贝: "bei",
    覃: "tan",
    綦: "qi",
    栗: "li",
    邝: "kuang",
    历: "li",
    咸: "xian",
    慕: "mu",
    水: "shui",
    宦: "huan",
    咸: "xian",
    庚: "geng",
    褚: "chu",
    奚: "xi",
    骆: "luo",
    卓: "zhuo",
    莫: "mo",
    窦: "dou",
    山: "shan",
    桑: "sang",
    连: "lian",
    翟: "zhai",
    冀: "ji",
    景: "jing",
    詹: "zhan",
    龙: "long",
    司: "si",
    韶: "shao",
    边: "bian",
    扈: "hu",
    卫: "wei",
    楚: "chu",
    邗: "han",
    竺: "zhu",
    利: "li",
    蔚: "wei",
    夔: "kui",
    鄢: "yan",
    冷: "leng",
    沙: "sha",
    逄: "pang",
    逯: "lu",
    戚: "qi",
    吉: "ji",
    聂: "nie",
    查: "zha",
    麻: "ma",
    宦: "huan",
    闵: "min",
    凤: "feng",
    杭: "hang",
    诸: "zhu",
    双: "shuang",
    殴: "ou",
    言: "yan",
    笪: "da",
    濮: "pu",
    长孙: "zhang sun",
    公孙: "gong sun",
    轩辕: "xuan yuan",
    令狐: "ling hu",
    钟离: "zhong li",
    宇文: "yu wen",
    鲜于: "xian yu",
    闾丘: "lv qiu",
    司徒: "si tu",
    司空: "si kong",
    上官: "shang guan",
    夏侯: "xia hou",
    诸葛: "zhu ge",
    闻人: "wen ren",
    东方: "dong fang",
    赫连: "he lian",
    皇甫: "huang fu",
    尉迟: "wei chi",
    公羊: "gong yang",
    澹台: "tan tai",
    公冶: "gong ye",
    宗政: "zong zheng",
    濮阳: "pu yang",
    淳于: "chun yu",
    单于: "chan yu",
    太叔: "tai shu",
    申屠: "shen tu",
    公孙: "gong sun",
    仲孙: "zhong sun",
    轩辕: "xuan yuan",
    令狐: "ling hu",
    钟离: "zhong li",
    宇文: "yu wen",
    鲜于: "xian yu",
    闾丘: "lv qiu",
    慕容: "mu rong",
    鲜卑: "xian bei",
    拓跋: "tuo ba",
    呼延: "hu yan",
    完颜: "wan yan",
  };

  let result = "";
  for (let i = 0; i < chinese.length; i++) {
    const char = chinese[i];
    if (pinyinMap[char]) {
      result += pinyinMap[char];
    } else if (/[一-龥]/.test(char)) {
      // 如果是汉字但不在映射表中，使用Unicode编码作为备选
      result += char.charCodeAt(0).toString(16);
    } else {
      // 非汉字字符直接保留
      result += char.toLowerCase();
    }
  }

  return result;
}

// 综合面板接口调用函数
async function queryComprehensiveData() {
  console.log("✅ [综合查询] 函数开始执行");

  const nameInput = document.getElementById("comprehensiveNameInput");
  const name = nameInput.value.trim();

  console.log(`📝 [综合查询] 输入的姓名: "${name}"`);

  if (!name) {
    alert("请输入员工姓名");
    return;
  }

  const queryBtn = document.getElementById("comprehensiveQueryBtn");
  const originalBtnText = queryBtn.innerText;

  // 显示加载状态
  queryBtn.disabled = true;
  queryBtn.innerText = "查询中...";
  console.log("⏳ [综合查询] 正在转换中文为拼音...");

  try {
    // 将中文姓名转换为拼音
    const nameInEnglish = chineseToPinyin(name);
    console.log(`🔤 [综合查询] 拼音转换结果: "${nameInEnglish}"`);

    // 构建查询参数
    const queryParams = {
      查询条件: `用户名#${nameInEnglish}|员工姓名#|部门id#14,4,18,6,8,17,16,15,1,10,13,7|`,
      地市ID: -1,
    };

    const params = [
      {
        entry: "vtmng3001.attendance..mtex-mtplat",
        param: JSON.stringify(queryParams),
      },
    ];

    console.log("📤 [综合查询] 请求参数:", params);
    console.log("🌐 [综合查询] 正在请求接口...");

    // 获取token（使用现有的requestWithToken函数）
    const formData = new URLSearchParams();
    let globalToken = localStorage.getItem("mtex_token");
    formData.append("params", JSON.stringify(params));
    formData.append("token", globalToken);
    const response = await requestWithToken(API2, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    console.log("📥 [综合查询] 接口返回:", response);

    // 处理返回数据
    if (response.type === 0 && response.data && response.data.length > 0) {
      const data = response.data[0].data;
      const employeeList = data.tables[0]; // 获取员工列表（可能有多条）

      console.log(
        `📊 [综合查询] 查询到 ${employeeList ? employeeList.length : 0} 条记录`,
      );

      if (!employeeList || employeeList.length === 0) {
        throw new Error("未查询到相关员工数据");
      }

      // 渲染表格列表
      renderComprehensiveTable(employeeList);
      console.log("✅ [综合查询] 表格渲染完成");

      // 默认选中第一条记录，填充详情卡片
      const firstEmployee = employeeList[0];
      updateEmployeeDetailCards(firstEmployee);
      console.log("👤 [综合查询] 详情卡片已更新");

      console.log(`🎉 [综合查询] 查询成功！共 ${employeeList.length} 条记录`);
    } else {
      throw new Error(response.message || "查询失败，接口返回异常");
    }
  } catch (error) {
    console.error("❌ [综合查询] 执行出错:", error);
  } finally {
    // 恢复按钮状态
    queryBtn.disabled = false;
    queryBtn.innerText = originalBtnText;
    console.log("🔄 [综合查询] 按钮状态已恢复");
  }
}

/**
 * 渲染综合数据表格列表
 * @param {Array} employeeList - 员工数据列表
 */
function renderComprehensiveTable(employeeList) {
  console.log("📋 [渲染表格] 开始渲染，数据:", employeeList);
  const tbody = document.getElementById("comprehensiveTableBody");

  if (!tbody) {
    console.error("❌ [渲染表格] 未找到表格体元素 #comprehensiveTableBody");
    return;
  }

  if (!employeeList || employeeList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="empty">暂无数据</td></tr>';
    return;
  }

  // 清空现有内容
  tbody.innerHTML = "";

  // 遍历生成表格行
  employeeList.forEach((employee, index) => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.onclick = () => updateEmployeeDetailCards(employee);

    // 添加悬停效果
    tr.onmouseover = () => (tr.style.background = "rgba(64, 158, 255, 0.1)");
    tr.onmouseout = () => (tr.style.background = "transparent");

    tr.innerHTML = `
      <td>${employee["员工id"] || "-"}</td>
      <td><strong>${employee["姓名"] || "-"}</strong></td>
      <td><span class="status-badge status-${employee["在职状态"] || "unknown"}">${employee["在职状态"] || "-"}</span></td>
      <td>${employee["部门名称"] || "-"}</td>
      <td>${employee["当前周期总年休假"] ?? "-"}</td>
      <td>${employee["当前周期可用年休假"] ?? "-"}</td>
      <td>${employee["最近待结可用年休假"] ?? "-"}</td>
      <td>${employee["当前周期总调休假"] ?? "-"}</td>
      <td>${employee["当前周期可用调休假"] ?? "-"}</td>
      <td>${employee["最近待结可用调休假"] ?? "-"}</td>
    `;

    tbody.appendChild(tr);
  });

  console.log(`✅ [渲染表格] 渲染完成，共 ${employeeList.length} 行`);
}

/**
 * 更新员工详情卡片
 * @param {Object} employee - 员工数据对象
 */
function updateEmployeeDetailCards(employee) {
  console.log("👤 [更新详情] 更新卡片数据:", employee);

  const fields = [
    { id: "employeeName", key: "姓名", default: "-" },
    { id: "employeeId", key: "员工id", default: "-" },
    { id: "employeeStatus", key: "在职状态", default: "-" },
    { id: "departmentName", key: "部门名称", default: "-" },
    { id: "totalAnnualLeave", key: "当前周期总年休假", default: "-" },
    { id: "availableAnnualLeave", key: "当前周期可用年休假", default: "-" },
    { id: "pendingAnnualLeave", key: "最近待结可用年休假", default: "-" },
    { id: "totalFlexLeave", key: "当前周期总调休假", default: "-" },
    { id: "availableFlexLeave", key: "当前周期可用调休假", default: "-" },
    { id: "pendingFlexLeave", key: "最近待结可用调休假", default: "-" },
  ];

  fields.forEach((field) => {
    const element = document.getElementById(field.id);
    if (element) {
      const value = employee[field.key];
      element.textContent =
        value !== undefined && value !== null ? value : field.default;
    } else {
      console.warn(`⚠️ [更新详情] 未找到元素 #${field.id}`);
    }
  });

  console.log("✅ [更新详情] 卡片更新完成");
}

// 窗口大小调整时重绘图表
window.addEventListener("resize", () => {
  salaryTrendChart.resize();
  overtimeTrendChart.resize();
  bonusTrendChart.resize();
  raiseCompareChart.resize();
  incomeCompositionChart.resize();
  salaryRatioChart.resize();
});

/**
 * 通用渲染函数：用于从API或缓存加载数据后统一渲染页面
 * @param {Object} basicInfoJson - 基础信息接口返回的JSON
 * @param {Object} salaryInfoJson - 工资明细接口返回的JSON
 * @param {String} startMonth - 开始月份
 * @param {String} endMonth - 结束月份
 */
function renderEmployeeData(
  basicInfoJson,
  salaryInfoJson,
  startMonth,
  endMonth,
) {
  renderInfoCards(basicInfoJson); // 渲染基础信息卡片

  // 渲染表格和图表
  renderTable2WithAdjustedColumn(salaryInfoJson);
  const analysisResult = analysisAllSalaryData(
    salaryInfoJson,
    startMonth,
    endMonth,
  );
  renderAllCharts(analysisResult);
  return analysisResult; // 返回分析结果
}

/* ================= IndexedDB 缓存逻辑 ================= */
const DB_NAME = "EmployeeDB";
const DB_VERSION = 2;
const STORE_NAME = "employees";
const COMPREHENSIVE_STORE = "comprehensiveHistory";
let db;

// 初始化数据库
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log("IndexedDB opened successfully");
      loadHistoryFromDB(); // 打开成功后加载历史记录
      loadComprehensiveHistory(); // 加载综合查询历史
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        objectStore.createIndex("name", "name", { unique: false });
        objectStore.createIndex("updateTime", "updateTime", { unique: false });
        console.log("Object store created");
      }
      if (!db.objectStoreNames.contains(COMPREHENSIVE_STORE)) {
        const compStore = db.createObjectStore(COMPREHENSIVE_STORE, { keyPath: "id" });
        compStore.createIndex("name", "name", { unique: false });
        compStore.createIndex("queryTime", "queryTime", { unique: false });
        console.log("Comprehensive history store created");
      }
    };
  });
}

// 保存数据到 IndexedDB
function saveEmployeeToDB(
  id,
  name,
  basicInfo,
  salaryInfo,
  startMonth,
  endMonth,
  currentSalary = 0,
) {
  if (!db) return;

  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  const record = {
    id: id,
    name: name,
    basicInfo: basicInfo,
    salaryInfo: salaryInfo,
    startMonth: startMonth,
    endMonth: endMonth,
    currentSalary: currentSalary, // 保存当前工资
    updateTime: new Date().getTime(),
  };

  const request = store.put(record);

  request.onsuccess = () => {
    console.log(`Employee ${name} saved to DB`);
    loadHistoryFromDB(); // 保存后刷新历史列表
  };

  request.onerror = (e) => {
    console.error("Error saving to DB", e);
  };
}

// 从 IndexedDB 获取单条数据
function getEmployeeFromDB(id) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("DB not initialized");
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// 加载历史记录并渲染
function loadHistoryFromDB() {
  if (!db) return;

  const transaction = db.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const request = store.getAll();

  request.onsuccess = (event) => {
    const records = event.target.result;
    // 按更新时间倒序排列
    records.sort((a, b) => b.updateTime - a.updateTime);
    renderHistoryTags(records);
  };
}

// 渲染历史记录标签
function renderHistoryTags(records) {
  const historyPanel = document.getElementById("historyPanel");
  const historyTags = document.getElementById("historyTags");

  if (records.length === 0) {
    historyPanel.style.display = "none";
    return;
  }

  // 如果没有被隐藏按钮手动隐藏，则显示
  if (!historyPanel.classList.contains("hidden-by-user")) {
    historyPanel.style.display = "block";
  }

  historyTags.innerHTML = records
    .map((r) => {
      // 尝试获取或计算当前工资 (兼容旧数据)
      let displaySalary = r.currentSalary;
      if (!displaySalary && r.salaryInfo) {
        try {
          // 尝试从 deep structure 中获取
          const list = r.salaryInfo?.data?.[0]?.data?.tables?.[0];
          if (list && list.length > 0) {
            const lastItem = list[list.length - 1];
            const basic = Number(lastItem.基本工资 || 0);
            const perf = Number(lastItem.绩效工资 || 0);
            const subsidy = Number(lastItem.出工补贴 || 0);
            displaySalary = basic + perf + subsidy;
          }
        } catch (e) {
          console.error("Error calculating salary for history tag", e);
        }
      }

      return `
        <div class="history-tag" onclick="loadCachedData('${r.id}', '${r.name}')">
            <div class="name-row">
                ${r.name} 
                <span class="close" onclick="deleteHistory(event, '${r.id}')">×</span>
            </div>
            ${displaySalary ? `<div class="salary-tag">🐚${Number(displaySalary).toFixed(2)}</div>` : ""}
        </div>
        `;
    })
    .join("");
}

// 点击历史记录加载数据
async function loadCachedData(id, name) {
  try {
    tip(`正在加载 ${name} 的缓存数据...`, "normal");

    // 尝试直接获取
    let record = await getEmployeeFromDB(id);

    // 如果未找到且ID是字符串数字，尝试转换为数字再次获取（解决类型不匹配问题）
    if (!record && typeof id === "string" && !isNaN(Number(id))) {
      console.log("Trying to fetch with Number ID:", Number(id));
      record = await getEmployeeFromDB(Number(id));
    }

    if (record) {
      // 填充搜索框
      nameInput.value = record.name;
      startMonthInput.value = record.startMonth;
      endMonthInput.value = record.endMonth;

      // 渲染数据
      initAllPanels();
      renderEmployeeData(
        record.basicInfo,
        record.salaryInfo,
        record.startMonth,
        record.endMonth,
      );

      // 高亮当前标签
      const tags = document.querySelectorAll(".history-tag");
      tags.forEach((tag) => {
        if (tag.innerText.includes(name)) {
          tag.classList.add("active");
        } else {
          tag.classList.remove("active");
        }
      });

      tip(`已加载 ${name} 的缓存数据`, "success");
    } else {
      tip("未找到缓存数据", "error");
      console.error("Record not found for ID:", id);
    }
  } catch (e) {
    console.error(e);
    tip("加载缓存失败", "error");
  }
}

// 删除历史记录
function deleteHistory(event, id) {
  event.stopPropagation(); // 阻止冒泡
  if (!confirm("确定删除该条记录吗？")) return;

  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  // 尝试删除（同时尝试原ID和数字ID，确保删除成功）
  store.delete(id);
  if (typeof id === "string" && !isNaN(Number(id))) {
    store.delete(Number(id));
  }

  transaction.oncomplete = () => {
    loadHistoryFromDB();
  };
}

// 页面加载时初始化数据库
window.addEventListener("load", initDB);

// ================== 新增功能：历史记录隐藏/显示 ==================
const historyPanel = document.getElementById("historyPanel");

// 2. 添加显示按钮到工具栏 (放在深色模式按钮旁边)
const toolbar = document.querySelector(".toolbar");
const showHistoryBtn = document.createElement("button");
showHistoryBtn.id = "showHistoryBtn";
showHistoryBtn.innerText = "🕒 显示历史";
showHistoryBtn.style.cssText =
  "margin-left: 10px; padding: 6px 12px; border-radius: 4px; cursor: pointer; display: none;";
// 插入到 themeBtn 之前
toolbar.insertBefore(showHistoryBtn, themeBtn);

showHistoryBtn.onclick = () => {
  historyPanel.style.display = "block";
  historyPanel.classList.remove("hidden-by-user");
  showHistoryBtn.style.display = "none";
};
