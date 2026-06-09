const $ = (id)=>document.getElementById(id);

const initialState = {
  phase:"cover",
  week:1,
  stage:"新生入学",
  scene:"芝加哥火车站",
  camp:"无",
  origin:"普通人类家庭",
  identity:"新生",
  bloodRank:"C",
  yanling:"未觉醒",
  hp:80,
  maxHp:80,
  purity:18,
  sanity:55,
  dragonKills:0,
  loyalty:40,
  trust:45,
  deals:0,
  history:[],
  currentChoices:[],
  lastLog:""
};

let state = loadAuto() || {...initialState};

function clamp(){
  for (const k of ["hp","sanity","loyalty","trust"]) state[k]=Math.max(0,Math.min(100,state[k]));
  state.maxHp=Math.max(1,Math.min(100,state.maxHp));
  state.hp=Math.min(state.hp,state.maxHp);
  state.purity=Math.max(0,Math.min(100,state.purity));
  if(state.week>=24 || (state.dragonKills>=3 && state.purity>=60)) state.stage="生死决战";
  else if(state.week>=12 || state.dragonKills>=2 || state.bloodRank==="A") state.stage="龙王苏醒";
  else if(state.week>=5 || state.dragonKills>=1) state.stage="暗流涌动";
  else state.stage="新生入学";
}

function renderStats(){
  clamp();
  const rows = [
    ["血统评级",state.bloodRank],["言灵",state.yanling],["生命值",`${state.hp}/${state.maxHp}`],
    ["血统纯度",`${state.purity}%`],["精神稳定",state.sanity],["屠龙战绩",state.dragonKills],
    ["阵营忠诚度",state.loyalty],["同伴信任度",state.trust],["路鸣泽交易次数",state.deals],
    ["第几周",state.week],["当前场景",state.scene],["当前阵营",state.camp],["剧情阶段",state.stage]
  ];
  $("stats").innerHTML = rows.map(([a,b])=>`<div class="stat"><span>${a}</span><b>${b}</b></div>`).join("");
}

function render(){
  renderStats();
  localStorage.setItem("longzu_netlify_autosave", JSON.stringify(state));
  $("choices").innerHTML = "";

  if(state.phase==="cover"){
    $("screen").innerHTML = `<h2 class="scene-title">卡塞尔之门尚未开启</h2>
<div class="story">你收到了一封奇怪的录取通知书。

目的地：卡塞尔学院。

点击【龙之瞳开启】，AI DM 会从角色创建开始接管剧情。</div>`;
    $("freeInput").disabled=true; $("freeBtn").disabled=true;
    return;
  }

  $("freeInput").disabled=false; $("freeBtn").disabled=false;
  const latest = state.history[state.history.length-1];

  if(!latest){
    $("screen").innerHTML = `<h2 class="scene-title">角色创建</h2>
<div class="story">选择开局。AI DM 会根据你的选择生成第一回合。</div>
${state.lastLog?`<div class="log">${escapeHtml(state.lastLog)}</div>`:""}`;
    addChoice("A","混血种世家 · 新生",()=>bootstrap("混血种世家","新生","B","未完全觉醒",75,35,70,45,40,"卡塞尔学院 · 校门口"));
    addChoice("B","普通人类家庭 · 后天觉醒",()=>bootstrap("普通人类家庭","新生","C","未觉醒",80,18,55,40,45,"芝加哥火车站"));
    addChoice("C","蛇岐八家分家 · 执行部实习生",()=>bootstrap("日本混血种","执行部实习生","B","剑御",78,38,60,48,42,"东京 · 源氏重工雨夜"));
    addChoice("D","秘党收养 · 执行部预备役",()=>bootstrap("孤儿/秘党收养","执行部预备役","A","风王之瞳",85,42,65,50,38,"卡塞尔学院 · 执行部地下训练场"));
    return;
  }

  $("screen").innerHTML = `<h2 class="scene-title">第 ${state.week} 周 · ${escapeHtml(latest.title || "未命名事件")}</h2>
<div class="story">${escapeHtml(latest.story || "")}</div>
${state.lastLog?`<div class="log">${escapeHtml(state.lastLog)}</div>`:""}`;

  (state.currentChoices || []).forEach((c, i)=>{
    addChoice(String.fromCharCode(65+i), c.text || c, ()=>sendAction(c.text || c));
  });
}

function addChoice(key,label,fn){
  const btn=document.createElement("button");
  btn.className="choice";
  btn.innerHTML=`<strong>${key}. ${escapeHtml(label)}</strong>`;
  btn.onclick=fn;
  $("choices").appendChild(btn);
}

async function bootstrap(origin, identity, rank, yanling, hp, purity, sanity, loyalty, trust, scene){
  Object.assign(state,{phase:"game",origin,identity,bloodRank:rank,yanling,hp,maxHp:hp,purity,sanity,loyalty,trust,scene,camp:"无",week:1,history:[],currentChoices:[],lastLog:"开局已选择，正在呼叫 AI DM。"});
  render();
  await sendAction(`我选择开局：${origin}，身份：${identity}，初始言灵倾向：${yanling}。请进入第一周剧情，并给出三个行动选项。`, true);
}

async function sendAction(action, isBootstrap=false){
  setLoading(true);
  try{
    const res = await fetch("/.netlify/functions/dm", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({state, action})
    });
    if(!res.ok){
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    const data = await res.json();
    applyAI(data, action, isBootstrap);
  }catch(e){
    state.lastLog = "调用 AI 失败：\n" + e.message + "\n\n检查 Netlify 环境变量 DEEPSEEK_API_KEY 是否设置。";
  }finally{
    setLoading(false);
    render();
  }
}

function applyAI(data, action, isBootstrap){
  const d = data.statChanges || {};
  for(const [k,v] of Object.entries(d)){
    if(typeof state[k] === "number" && typeof v === "number") state[k] += v;
  }
  if(data.scene) state.scene = data.scene;
  if(data.camp) state.camp = data.camp;
  if(data.bloodRank) state.bloodRank = data.bloodRank;
  if(data.yanling) state.yanling = data.yanling;
  if(!isBootstrap) state.week += 1;
  clamp();

  state.history.push({
    title:data.title || "AI 事件",
    story:data.story || "AI 没有返回剧情。人类和机器都沉默了，场面非常办公。",
    action
  });
  state.history = state.history.slice(-12);
  state.currentChoices = Array.isArray(data.choices) && data.choices.length ? data.choices.slice(0,3).map(x=> typeof x==="string"?{text:x}:x) : [
    {text:"谨慎观察局势"},
    {text:"主动询问同伴"},
    {text:"使用言灵试探"}
  ];
  const changes = Object.entries(d).map(([k,v])=>`${k}${v>=0?"+":""}${v}`).join("，");
  state.lastLog = data.summary ? data.summary : (changes ? `属性变化：${changes}` : "");
}

function setLoading(v){
  $("loading").classList.toggle("hidden", !v);
  $("freeBtn").disabled=v;
  [...document.querySelectorAll("button.choice")].forEach(b=>b.disabled=v);
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
}
function saveManual(){ localStorage.setItem("longzu_netlify_save", JSON.stringify(state)); state.lastLog="已存档。"; render(); }
function loadManual(){
  const s=localStorage.getItem("longzu_netlify_save");
  if(!s){state.lastLog="没有存档。"; render(); return;}
  state=JSON.parse(s); state.lastLog="读档成功。"; render();
}
function loadAuto(){
  try{return JSON.parse(localStorage.getItem("longzu_netlify_autosave"));}catch(e){return null;}
}
function resetGame(){
  localStorage.removeItem("longzu_netlify_autosave");
  state={...initialState};
  render();
}
$("startBtn").onclick=()=>{state.phase="game"; state.lastLog="龙之瞳开启。"; render(); window.scrollTo({top:300,behavior:"smooth"});}
$("saveBtn").onclick=saveManual;
$("loadBtn").onclick=loadManual;
$("resetBtn").onclick=resetGame;
$("freeBtn").onclick=()=>{const v=$("freeInput").value.trim(); if(!v)return; $("freeInput").value=""; sendAction(v);};
render();
