// v1.2 - Video Notes + fix workout save (auto-include in-progress exercise)
import React, { useState, useEffect, useRef, useContext } from "react";
import { AuthProvider, AuthContext, useStore } from "./auth.jsx";

// ── Storage Keys ───────────────────────────────────────────────
const SK = {
  habits: "v2_habits", skills: "v2_skills", finances: "v2_finances",
  journal: "v2_journal", goals: "v2_goals", workouts: "v2_workouts",
  sleep: "v2_sleep", weeklyReview: "v2_weekly", gym: "v2_gym",
  tasks: "v2_tasks", people: "v2_people", careerLog: "v2_career",
  network: "v2_network", projects: "v2_projects", ideas: "v2_ideas",
  businessHabits: "v2_biz_habits", successLog: "v2_success",
  bodyMetrics: "v2_body", home: "v2_home", car: "v2_car",
  junkFood: "v2_junk", events: "v2_events",
};

// ── Fonts ──────────────────────────────────────────────────────
const fl = document.createElement("link");
fl.href = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,300&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
fl.rel = "stylesheet";
document.head.appendChild(fl);

// ── Colors ─────────────────────────────────────────────────────
const C = {
  bg: "#0f0f0f", surface: "#1a1a1a", surfaceAlt: "#151515",
  border: "#2a2a2a", borderLight: "#333",
  text: "#e8e4de", textMuted: "#8a8580", textDim: "#5a5550",
  accent: "#e8a849", accentSoft: "rgba(232,168,73,0.12)", accentMid: "rgba(232,168,73,0.25)",
  green: "#5cb87a", greenSoft: "rgba(92,184,122,0.12)",
  red: "#d46b6b", redSoft: "rgba(212,107,107,0.12)",
  blue: "#6ba3d4", blueSoft: "rgba(107,163,212,0.12)",
  purple: "#a57bdb", purpleSoft: "rgba(165,123,219,0.12)",
  sidebar: "#141414", sidebarHover: "#1e1e1e", sidebarActive: "#e8a849",
};

// ── Utils ──────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const dayOfWeek = (d) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(d).getDay()];
const last7 = () => { const d=[]; for(let i=6;i>=0;i--){const x=new Date();x.setDate(x.getDate()-i);d.push(x.toISOString().split("T")[0]);}return d; };
const last30 = () => { const d=[]; for(let i=29;i>=0;i--){const x=new Date();x.setDate(x.getDate()-i);d.push(x.toISOString().split("T")[0]);}return d; };
const weekNum = (ds) => { const d=new Date(ds);d.setHours(0,0,0,0);d.setDate(d.getDate()+3-((d.getDay()+6)%7));const w1=new Date(d.getFullYear(),0,4);return Math.round(((d-w1)/864e5-3+((w1.getDay()+6)%7))/7)+1; };

// Storage is handled by auth.jsx (Supabase-backed)

// ── Shared Components ──────────────────────────────────────────
const fonts = { serif: "'Fraunces', serif", sans: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

function Badge({children, color=C.accent, bg}) {
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:500,fontFamily:fonts.sans,color,background:bg||`${color}18`,letterSpacing:.3}}>{children}</span>;
}
function ProgressBar({value, max=100, color=C.accent, height=6}) {
  const pct = max>0?clamp((value/max)*100,0,100):0;
  return <div style={{width:"100%",height,background:C.border,borderRadius:height,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:height,transition:"width .5s cubic-bezier(.4,0,.2,1)"}}/></div>;
}
function Card({children, style={}}) {
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20,...style}}>{children}</div>;
}
function SectionHead({icon, title, count, action, quote}) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {icon&&<span style={{fontSize:18}}>{icon}</span>}
          <h2 style={{fontFamily:fonts.serif,fontSize:20,fontWeight:500,color:C.text,margin:0}}>{title}</h2>
          {count!==undefined&&<span style={{fontFamily:fonts.mono,fontSize:11,color:C.textDim,background:C.border,borderRadius:10,padding:"2px 8px"}}>{count}</span>}
        </div>
        {action}
      </div>
      {quote&&<div style={{fontFamily:fonts.sans,fontSize:12,fontStyle:"italic",color:C.textDim,marginTop:6,borderLeft:`2px solid ${C.accent}`,paddingLeft:10}}>{quote}</div>}
    </div>
  );
}
function Btn({children, onClick, active, color=C.accent, style={}}) {
  return <button onClick={onClick} style={{background:active?`${color}22`:"transparent",border:`1px solid ${active?color:C.border}`,color:active?color:C.textMuted,borderRadius:8,padding:"5px 12px",fontSize:12,fontFamily:fonts.sans,fontWeight:500,cursor:"pointer",transition:"all .2s",...style}}>{children}</button>;
}
function IconBtn({children, onClick, title}) {
  return <button onClick={onClick} title={title} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.textMuted,borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textMuted;}}>{children}</button>;
}
function Input({value, onChange, placeholder, style={}, type="text"}) {
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:fonts.sans,fontSize:13,padding:"8px 12px",outline:"none",width:"100%",boxSizing:"border-box",transition:"border-color .2s",...style}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>;
}
function TextArea({value, onChange, placeholder, rows=2, style={}}) {
  return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontFamily:fonts.sans,fontSize:13,padding:"10px 14px",outline:"none",width:"100%",boxSizing:"border-box",resize:"vertical",lineHeight:1.5,...style}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>;
}
function StatCard({label, value, color=C.text, suffix=""}) {
  return <div style={{background:C.bg,borderRadius:12,padding:"14px 16px",textAlign:"center",flex:1,minWidth:80}}>
    <div style={{fontFamily:fonts.serif,fontSize:20,fontWeight:700,color}}>{value}{suffix}</div>
    <div style={{fontFamily:fonts.sans,fontSize:10,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginTop:4}}>{label}</div>
  </div>;
}
function Heatmap({data, days, color=C.green}) {
  const maxVal = Math.max(...days.map(d=>data[d]||0),1);
  return <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
    {days.map(d=>{const v=data[d]||0;const intensity=v>0?Math.max(.2,v/maxVal):0;return <div key={d} title={`${d}: ${v}`} style={{width:22,height:22,borderRadius:4,background:v>0?color:C.border,opacity:v>0?(.3+intensity*.7):1,border:d===today()?`2px solid ${C.accent}`:`1px solid ${v>0?"transparent":C.border}`,transition:"all .2s"}}/>;
    })}
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// HABITS (categorized)
// ═══════════════════════════════════════════════════════════════
const DEFAULT_HABITS = {
  categories: [
    { name: "Morning", icon: "🌅", habits: [
      { id: uid(), name: "Wake Up AT or BEFORE 5:30 AM", log: {} },
      { id: uid(), name: "Pray Fajr", log: {} },
    ]},
    { name: "Prayers", icon: "🕌", habits: [
      { id: uid(), name: "Pray Duhr", log: {} },
      { id: uid(), name: "Pray Asr", log: {} },
      { id: uid(), name: "Pray Maghrib", log: {} },
      { id: uid(), name: "Pray Isha", log: {} },
    ]},
    { name: "Mind & Spirit", icon: "🧠", habits: [
      { id: uid(), name: "Read Quran", log: {} },
      { id: uid(), name: "Read Book (10 pages)", log: {} },
      { id: uid(), name: "General Knowledge", log: {} },
      { id: uid(), name: "Journal", log: {} },
    ]},
    { name: "Health & Body", icon: "💪", habits: [
      { id: uid(), name: "7/9k Run & Workout", log: {} },
      { id: uid(), name: "Skincare/Mouthwash", log: {} },
      { id: uid(), name: "Drink 2L of Water", log: {} },
      { id: uid(), name: "No Processed/Unhealthy Food", log: {} },
      { id: uid(), name: "Sleep by 11pm", log: {} },
    ]},
    { name: "Career", icon: "💼", habits: [
      { id: uid(), name: "Daily Career Work", log: {} },
    ]},
    { name: "Tracking", icon: "📊", habits: [
      { id: uid(), name: "# of times toke requested", log: {}, isCounter: true },
    ]},
  ]
};

function HabitsPage() {
  const [data, setData] = useStore(SK.habits, DEFAULT_HABITS);
  const [adding, setAdding] = useState(null); // category name or null
  const [newName, setNewName] = useState("");
  const [newIsCounter, setNewIsCounter] = useState(false);
  const todayStr = today();
  const allHabits = data.categories.flatMap(c=>c.habits);
  const checkable = allHabits.filter(h=>!h.isCounter);
  const todayDone = checkable.filter(h=>h.log[todayStr]).length;

  const toggle = (habitId) => {
    setData(p=>({...p,categories:p.categories.map(c=>({...c,habits:c.habits.map(h=>{
      if(h.id!==habitId||h.isCounter)return h;
      const log={...h.log}; log[todayStr]=!log[todayStr]; return {...h,log};
    })}))}));
  };
  const incCounter = (habitId, delta) => {
    setData(p=>({...p,categories:p.categories.map(c=>({...c,habits:c.habits.map(h=>{
      if(h.id!==habitId||!h.isCounter)return h;
      const log={...h.log}; const cur=typeof log[todayStr]==="number"?log[todayStr]:0;
      log[todayStr]=Math.max(0,cur+delta); return {...h,log};
    })}))}));
  };
  const addHabit = (catName) => {
    if(!newName.trim())return;
    setData(p=>({...p,categories:p.categories.map(c=>{
      if(c.name!==catName)return c;
      return {...c,habits:[...c.habits,{id:uid(),name:newName.trim(),log:{},isCounter:newIsCounter}]};
    })}));
    setNewName(""); setNewIsCounter(false); setAdding(null);
  };
  const removeHabit = (habitId) => {
    setData(p=>({...p,categories:p.categories.map(c=>({...c,habits:c.habits.filter(h=>h.id!==habitId)}))}));
  };
  const streak = (h) => { if(h.isCounter)return 0; let s=0; for(let i=0;i<60;i++){const d=new Date();d.setDate(d.getDate()-i);if(h.log[d.toISOString().split("T")[0]])s++;else break;} return s; };

  // 30-day heatmap data
  const days30 = last30();
  const heatData = {};
  days30.forEach(d => { heatData[d]=checkable.filter(h=>h.log[d]).length; });

  // This week data
  const days7 = last7();
  const weekData = days7.map(d => ({ day: dayOfWeek(d), done: checkable.filter(h=>h.log[d]).length, total: checkable.length, isToday: d===todayStr }));

  const bestStreak = checkable.reduce((best,h)=>Math.max(best,streak(h)),0);
  const avg30 = days30.length>0 ? Math.round(days30.reduce((s,d)=>s+(checkable.length>0?(checkable.filter(h=>h.log[d]).length/checkable.length)*100:0),0)/days30.length) : 0;

  return (
    <div>
      <SectionHead icon="🏆" title="Road to Success" count={`${todayDone}/${checkable.length}`} quote='"We are what we repeatedly do. Excellence, then, is not an act, but a habit." — Aristotle' />

      {/* Top stats */}
      <div className="dash-grid-2" style={{gap:12,marginBottom:20}}>
        <Card style={{flex:1,textAlign:"center",padding:16}}>
          <div style={{fontFamily:fonts.serif,fontSize:28,fontWeight:700,color:todayDone>0?C.green:C.red}}>{checkable.length>0?Math.round(todayDone/checkable.length*100):0}%</div>
          <div style={{fontFamily:fonts.sans,fontSize:11,color:C.textDim}}>TODAY</div>
          <div style={{fontFamily:fonts.sans,fontSize:13,color:C.textMuted,marginTop:4}}>{todayDone} / {checkable.length} completed</div>
        </Card>
        <Card style={{flex:2,padding:16}}>
          <div style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>30-Day Heatmap</div>
          <Heatmap data={heatData} days={days30} color={C.green} />
          <div style={{display:"flex",gap:12,marginTop:12}}>
            <StatCard label="Current Streak" value={bestStreak} color={C.accent} />
            <StatCard label="Best Streak" value={bestStreak} color={C.green} />
            <StatCard label="30d Average" value={`${avg30}%`} color={avg30>=50?C.green:C.red} />
          </div>
        </Card>
      </div>

      {/* This week */}
      <Card style={{marginBottom:20,padding:16}}>
        <div style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>📊 This Week</div>
        {weekData.map((d,i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"4px 0"}}>
            <span style={{fontFamily:fonts.mono,fontSize:12,color:d.isToday?C.accent:C.textMuted,fontWeight:d.isToday?600:400,width:40}}>{d.isToday?"Today":d.day}</span>
            <div style={{flex:1}}><ProgressBar value={d.done} max={d.total} color={d.isToday?C.accent:C.green} height={4}/></div>
            <span style={{fontFamily:fonts.mono,fontSize:11,color:d.isToday?C.accent:C.textDim}}>{d.total>0?Math.round(d.done/d.total*100):0}%</span>
            <span style={{fontFamily:fonts.mono,fontSize:10,color:C.textDim}}>{d.done}/{d.total}</span>
          </div>
        ))}
      </Card>

      {/* Habit Checklist by category */}
      <Card style={{padding:16}}>
        <div style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>✅ Habit Checklist</div>
        {data.categories.map(cat => (
          <div key={cat.name} style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:14}}>{cat.icon}</span>
                <span style={{fontFamily:fonts.sans,fontSize:12,fontWeight:600,color:C.accent,textTransform:"uppercase",letterSpacing:.5}}>{cat.name}</span>
              </div>
              <IconBtn onClick={()=>setAdding(adding===cat.name?null:cat.name)} title="Add habit">+</IconBtn>
            </div>
            {adding===cat.name&&(
              <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
                <Input value={newName} onChange={setNewName} placeholder="Habit name..." style={{flex:1}}/>
                <Btn onClick={()=>setNewIsCounter(!newIsCounter)} active={newIsCounter} color={C.blue}>{newIsCounter?"Counter":"Check"}</Btn>
                <Btn onClick={()=>addHabit(cat.name)} active color={C.green}>Add</Btn>
              </div>
            )}
            {cat.habits.map(h => (
              <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
                {h.isCounter ? (
                  <span onClick={()=>incCounter(h.id,1)} onContextMenu={e=>{e.preventDefault();incCounter(h.id,-1);}}
                    style={{width:28,height:28,borderRadius:8,background:(typeof h.log[todayStr]==="number"&&h.log[todayStr]>0)?C.purpleSoft:"transparent",border:`1.5px solid ${(typeof h.log[todayStr]==="number"&&h.log[todayStr]>0)?C.purple:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:fonts.mono,fontSize:13,color:C.purple,cursor:"pointer",userSelect:"none",fontWeight:600}}>
                    {typeof h.log[todayStr]==="number"?h.log[todayStr]:0}
                  </span>
                ) : (
                  <button onClick={()=>toggle(h.id)} style={{width:28,height:28,borderRadius:8,border:h.log[todayStr]?"none":`1.5px solid ${C.border}`,background:h.log[todayStr]?C.green:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,transition:"all .2s",flexShrink:0}}>
                    {h.log[todayStr]?"✓":""}
                  </button>
                )}
                <span style={{fontFamily:fonts.sans,fontSize:14,color:h.log[todayStr]?C.textDim:C.text,textDecoration:h.log[todayStr]&&!h.isCounter?"line-through":"none",flex:1}}>{h.name}</span>
                {!h.isCounter&&streak(h)>0&&<Badge color={C.accent}>{streak(h)}d</Badge>}
                <button onClick={()=>removeHabit(h.id)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10,opacity:.5}}>✕</button>
              </div>
            ))}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BUSINESS HABITS (Road to Riches)
// ═══════════════════════════════════════════════════════════════
const DEFAULT_BIZ = [
  { id: uid(), name: "Digital Marketing", log: {} },
  { id: uid(), name: "Online Store", log: {} },
  { id: uid(), name: "Sales Training", log: {} },
  { id: uid(), name: "Track Personal Finances", log: {} },
  { id: uid(), name: "Update Sales KPIs", log: {} },
];

function BizHabitsPage() {
  const [habits, setHabits] = useStore(SK.businessHabits, DEFAULT_BIZ);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const todayStr = today();
  const done = habits.filter(h=>h.log[todayStr]).length;

  const toggle = (id) => setHabits(p=>p.map(h=>{if(h.id!==id)return h;const log={...h.log};log[todayStr]=!log[todayStr];return {...h,log};}));
  const add = () => { if(!newName.trim())return; setHabits(p=>[...p,{id:uid(),name:newName.trim(),log:{}}]); setNewName(""); setAdding(false); };
  const remove = (id) => setHabits(p=>p.filter(h=>h.id!==id));

  const days30 = last30();
  const heatData = {}; days30.forEach(d=>{heatData[d]=habits.filter(h=>h.log[d]).length;});

  return (
    <div>
      <SectionHead icon="💎" title="Road to Riches" count={`${done}/${habits.length}`} quote='"Financial freedom is available to those who learn about it and work for it." — Robert Kiyosaki' />
      <div className="dash-stats" style={{marginBottom:20}}>
        <Card style={{flex:1,textAlign:"center",padding:16}}>
          <div style={{fontFamily:fonts.serif,fontSize:28,fontWeight:700,color:done>0?C.green:C.red}}>{habits.length>0?Math.round(done/habits.length*100):0}%</div>
          <div style={{fontFamily:fonts.sans,fontSize:11,color:C.textDim}}>TODAY</div>
        </Card>
        <Card style={{flex:2,padding:16}}>
          <div style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>30-Day Business Streak</div>
          <Heatmap data={heatData} days={days30} color={C.red}/>
        </Card>
      </div>
      <Card style={{padding:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>📋 Business Habits</div>
          <IconBtn onClick={()=>setAdding(!adding)} title="Add">+</IconBtn>
        </div>
        {adding&&<div style={{display:"flex",gap:8,marginBottom:10}}><Input value={newName} onChange={setNewName} placeholder="Business habit..." style={{flex:1}}/><Btn onClick={add} active color={C.green}>Add</Btn></div>}
        {habits.map(h=>(
          <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
            <button onClick={()=>toggle(h.id)} style={{width:28,height:28,borderRadius:8,border:h.log[todayStr]?"none":`1.5px solid ${C.border}`,background:h.log[todayStr]?C.green:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,flexShrink:0}}>{h.log[todayStr]?"✓":""}</button>
            <span style={{fontFamily:fonts.sans,fontSize:14,color:h.log[todayStr]?C.textDim:C.text,flex:1}}>{h.name}</span>
            <button onClick={()=>remove(h.id)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10,opacity:.5}}>✕</button>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// KANBAN TASKS
// ═══════════════════════════════════════════════════════════════
const BOARDS = ["Today","Tomorrow","This Week","Next Week","This Month","Next Month"];
const BOARD_COLORS = {"Next Month":C.purple,"This Month":C.blue,"Next Week":C.blue,"This Week":C.green,"Tomorrow":C.accent,"Today":C.green};
const CATEGORIES = ["Personal","Work","Health"];
const CAT_COLORS = {Personal:C.green,Work:C.blue,Health:C.purple};
const PRIORITIES = [{v:"normal",label:"Normal",color:C.green},{v:"high",label:"High",color:C.accent},{v:"urgent",label:"Urgent",color:C.red}];
const PRI_COLOR = {normal:C.green,high:C.accent,urgent:C.red};
const pad2 = (n) => String(n).padStart(2,"0");
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Migrate legacy tasks ({text,col,tag,date}) to the new shape.
function normalizeTask(t){
  if(t && t.board!==undefined && t.title!==undefined) return t;
  const legacyCol = t.col;
  const board = BOARDS.includes(legacyCol) ? legacyCol : "Today";
  return {
    id: t.id || uid(),
    title: t.title || t.text || "Untitled",
    priority: t.priority || (t.tag==="Urgent"||legacyCol==="MIT" ? "urgent" : "normal"),
    category: t.category || (CATEGORIES.includes(t.tag) ? t.tag : "Personal"),
    board,
    due: t.due || t.date || "",
    allDay: t.allDay!==undefined ? t.allDay : true,
    notes: t.notes || "",
    done: t.done!==undefined ? t.done : (legacyCol==="Done"),
  };
}

// ── Calendar Events ────────────────────────────────────────────
const EVENT_TYPES = [
  {v:"prayer", label:"Prayer", color:C.purple},
  {v:"sleep", label:"Sleep", color:C.blue},
  {v:"birthday", label:"Birthday", color:C.green},
  {v:"health", label:"Health", color:C.accent},
  {v:"personal", label:"Personal", color:C.red},
  {v:"other", label:"Other", color:C.textMuted},
];
const EVT_COLOR = Object.fromEntries(EVENT_TYPES.map(t=>[t.v,t.color]));
const RECURS = [
  {v:"daily", label:"Every day"},
  {v:"weekly", label:"Every week"},
  {v:"annual", label:"Every year"},
  {v:"once", label:"One time"},
];
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DEFAULT_EVENTS = [
  {id:uid(), title:"Fajr",    type:"prayer", recur:"daily", time:"05:30", date:"", weekday:0},
  {id:uid(), title:"Duhr",    type:"prayer", recur:"daily", time:"13:15", date:"", weekday:0},
  {id:uid(), title:"Asr",     type:"prayer", recur:"daily", time:"16:45", date:"", weekday:0},
  {id:uid(), title:"Maghrib", type:"prayer", recur:"daily", time:"19:30", date:"", weekday:0},
  {id:uid(), title:"Isha",    type:"prayer", recur:"daily", time:"21:30", date:"", weekday:0},
  {id:uid(), title:"Sleep",   type:"sleep",  recur:"daily", time:"23:00", date:"", weekday:0},
];

function eventOccursOn(ev, d){
  const ds = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  if(ev.recur==="daily") return true;
  if(ev.recur==="weekly") return d.getDay()===Number(ev.weekday);
  if(ev.recur==="annual"){ if(!ev.date) return false; const a=new Date(ev.date+"T00:00:00"); return a.getMonth()===d.getMonth() && a.getDate()===d.getDate(); }
  if(ev.recur==="once") return ev.date===ds;
  return false;
}

const SYNODIC = 29.530588853;
function moonAge(d){
  const known = Date.UTC(2000,0,6,18,14)/86400000;
  const now = d.getTime()/86400000;
  return (((now-known)%SYNODIC)+SYNODIC)%SYNODIC;
}
function moonPhase(d){
  const pts=[{a:0,l:"New Moon",e:"🌑"},{a:7.38,l:"First Quarter",e:"🌓"},{a:14.77,l:"Full Moon",e:"🌕"},{a:22.15,l:"Last Quarter",e:"🌗"}];
  const dist=(age,a)=>{const x=Math.abs(age-a);return Math.min(x,SYNODIC-x);};
  const ageY=moonAge(new Date(d.getTime()-864e5)), ageT=moonAge(d), ageN=moonAge(new Date(d.getTime()+864e5));
  for(const p of pts){ const dt=dist(ageT,p.a); if(dt<=0.6 && dt<dist(ageY,p.a) && dt<=dist(ageN,p.a)) return p; }
  return null;
}

function TasksPage() {
  const [tasksRaw, setTasks] = useStore(SK.tasks, []);
  const [events, setEvents] = useStore(SK.events, DEFAULT_EVENTS);
  const [evDraft, setEvDraft] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [dragId, setDragId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [calDate, setCalDate] = useState(new Date());

  const list = (Array.isArray(tasksRaw)?tasksRaw:[]).map(normalizeTask);

  // One-time migration: persist normalized shape if any legacy tasks exist.
  useEffect(()=>{
    const arr = Array.isArray(tasksRaw)?tasksRaw:[];
    if(arr.some(t=>t.board===undefined||t.title===undefined)){
      setTasks(arr.map(normalizeTask));
    }
  },[]); // eslint-disable-line

  const openNew = (board="Today") => setDraft({id:uid(),title:"",priority:"normal",category:"Personal",board,due:today(),allDay:true,notes:"",done:false,_new:true});
  const openEdit = (t) => setDraft({...t,_new:false});
  const saveDraft = () => {
    if(!draft.title.trim()) return;
    const {_new,...clean} = draft;
    setTasks(p=>{
      const norm = (Array.isArray(p)?p:[]).map(normalizeTask);
      return norm.some(x=>x.id===clean.id) ? norm.map(x=>x.id===clean.id?clean:x) : [...norm,clean];
    });
    setDraft(null);
  };
  const deleteDraft = () => { setTasks(p=>(Array.isArray(p)?p:[]).map(normalizeTask).filter(x=>x.id!==draft.id)); setDraft(null); };
  const toggleDone = (id) => setTasks(p=>(Array.isArray(p)?p:[]).map(normalizeTask).map(t=>t.id===id?{...t,done:!t.done}:t));
  const removeTask = (id) => setTasks(p=>(Array.isArray(p)?p:[]).map(normalizeTask).filter(t=>t.id!==id));
  const move = (id,board) => setTasks(p=>(Array.isArray(p)?p:[]).map(normalizeTask).map(t=>t.id===id?{...t,board}:t));

  const evList = Array.isArray(events) ? events : DEFAULT_EVENTS;
  const openEvNew = (dateStr="") => setEvDraft({id:uid(),title:"",type:"personal",recur:dateStr?"once":"daily",time:"",date:dateStr||today(),weekday:new Date().getDay(),_new:true});
  const openEvEdit = (ev) => setEvDraft({...ev,_new:false});
  const evUpd = (k,v) => setEvDraft(d=>({...d,[k]:v}));
  const saveEv = () => {
    if(!evDraft.title.trim()) return;
    const {_new,...clean} = evDraft;
    setEvents(p=>{ const arr=Array.isArray(p)?p:[]; return arr.some(x=>x.id===clean.id)?arr.map(x=>x.id===clean.id?clean:x):[...arr,clean]; });
    setEvDraft(null);
  };
  const deleteEv = () => { setEvents(p=>(Array.isArray(p)?p:[]).filter(x=>x.id!==evDraft.id)); setEvDraft(null); };

  const filters = ["All",...CATEGORIES,"Urgent","Done"];
  const q = search.trim().toLowerCase();
  const matchesSearch = (t) => !q || t.title.toLowerCase().includes(q) || (t.notes||"").toLowerCase().includes(q);
  const visible = list.filter(t=>{
    if(!matchesSearch(t)) return false;
    if(filter==="Done") return t.done;
    if(t.done) return false;
    if(filter==="All") return true;
    if(filter==="Urgent") return t.priority==="urgent";
    return t.category===filter;
  });

  const upd = (k,v) => setDraft(d=>({...d,[k]:v}));
  const selStyle = {background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:fonts.sans,fontSize:13,padding:"8px 12px",width:"100%",boxSizing:"border-box",outline:"none",cursor:"pointer"};
  const lbl = {fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:6,display:"block"};

  // Calendar grid
  const cy = calDate.getFullYear(), cm = calDate.getMonth();
  const startPad = new Date(cy,cm,1).getDay();
  const daysInMonth = new Date(cy,cm+1,0).getDate();
  const cells = [];
  for(let i=0;i<startPad;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  while(cells.length%7!==0) cells.push(null);
  const tasksOn = (d) => { const ds=`${cy}-${pad2(cm+1)}-${pad2(d)}`; return list.filter(t=>t.due===ds); };
  const todayStr = today();

  return (
    <div>
      <SectionHead icon="📋" title="Tasks" quote={"\"You don't have to see the whole staircase. Just take the first step.\" — Martin Luther King Jr."} action={<Btn onClick={()=>openNew()} active color={C.red} style={{padding:"6px 16px",fontSize:13,fontWeight:600}}>+ Add Task</Btn>} />

      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {filters.map(f=><Btn key={f} onClick={()=>setFilter(f)} active={filter===f} color={f==="Urgent"?C.red:f==="Done"?C.green:C.accent}>{f==="Urgent"?"🔴 ":f==="Done"?"✓ ":""}{f}</Btn>)}
        </div>
        <div style={{flex:1,minWidth:180,maxWidth:280}}>
          <Input value={search} onChange={setSearch} placeholder="🔍 Search tasks..." style={{fontSize:12,padding:"6px 12px"}}/>
        </div>
      </div>

      <div className="dash-kanban">
        {BOARDS.map(board=>{
          const colTasks = visible.filter(t=>t.board===board);
          const colColor = BOARD_COLORS[board];
          return (
            <div key={board}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{e.preventDefault();if(dragId)move(dragId,board);setDragId(null);}}
              style={{background:C.surfaceAlt,borderRadius:12,padding:10,minHeight:140,border:`1px solid ${C.border}`}}
            >
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,borderBottom:`2px solid ${colColor}44`,paddingBottom:6}}>
                <span style={{fontFamily:fonts.sans,fontSize:11,fontWeight:700,color:colColor,textTransform:"uppercase",letterSpacing:.5}}>{board}</span>
                <span style={{fontFamily:fonts.mono,fontSize:11,color:C.textDim,background:C.border,borderRadius:10,padding:"1px 7px"}}>{colTasks.length}</span>
              </div>
              {colTasks.map(t=>(
                <div key={t.id} draggable onDragStart={()=>setDragId(t.id)} onDragEnd={()=>setDragId(null)}
                  style={{background:C.surface,borderRadius:8,padding:"9px 11px",marginBottom:7,cursor:"grab",borderLeft:`3px solid ${PRI_COLOR[t.priority]}`,opacity:t.done?.55:1}}
                >
                  <div style={{fontFamily:fonts.sans,fontSize:12.5,color:C.text,marginBottom:6,lineHeight:1.35,textDecoration:t.done?"line-through":"none"}}>{t.title}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:7}}>
                    <span title={t.priority} style={{width:9,height:9,borderRadius:"50%",background:PRI_COLOR[t.priority],flexShrink:0}}/>
                    <Badge color={CAT_COLORS[t.category]||C.textMuted}>{t.category}</Badge>
                    {t.due&&<span style={{fontFamily:fonts.mono,fontSize:10,color:t.due<todayStr&&!t.done?C.red:C.textDim}}>📅 {t.due}</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:12,borderTop:`1px solid ${C.border}`,paddingTop:6}}>
                    <button onClick={()=>openEdit(t)} title="Edit" style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:12,padding:0}}>✎</button>
                    <button onClick={()=>toggleDone(t.id)} style={{background:"none",border:"none",color:t.done?C.green:C.textDim,cursor:"pointer",fontSize:11,fontFamily:fonts.sans,padding:0}}>✓ {t.done?"Undo":"Done"}</button>
                    <button onClick={()=>removeTask(t.id)} title="Delete" style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:12,padding:0,marginLeft:"auto"}}>🗑</button>
                  </div>
                </div>
              ))}
              <button onClick={()=>openNew(board)} style={{background:"none",border:`1px dashed ${C.border}`,borderRadius:8,padding:"6px 0",width:"100%",color:C.textDim,fontFamily:fonts.sans,fontSize:11,cursor:"pointer",marginTop:2}}>+ Add</button>
            </div>
          );
        })}
      </div>

      {/* ── Calendar ── */}
      <Card style={{marginTop:24,padding:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Btn onClick={()=>setCalDate(new Date(cy,cm-1,1))} style={{padding:"4px 10px"}}>◀</Btn>
            <Btn onClick={()=>setCalDate(new Date())} style={{padding:"4px 10px"}}>Today</Btn>
            <Btn onClick={()=>setCalDate(new Date(cy,cm+1,1))} style={{padding:"4px 10px"}}>▶</Btn>
            <span style={{fontFamily:fonts.serif,fontSize:18,fontWeight:500,color:C.text,marginLeft:6}}>{MONTHS[cm]} {cy}</span>
          </div>
          <Btn onClick={()=>openEvNew()} color={C.purple} active style={{fontSize:12,fontWeight:600}}>+ Event</Btn>
        </div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:12}}>
          {EVENT_TYPES.map(t=><span key={t.v} style={{display:"inline-flex",alignItems:"center",gap:5,fontFamily:fonts.sans,fontSize:10,color:C.textDim}}><span style={{width:8,height:8,borderRadius:"50%",background:t.color}}/>{t.label}</span>)}
          <span style={{fontFamily:fonts.sans,fontSize:10,color:C.textDim,marginLeft:"auto"}}>Tasks + events plotted by date · click any to edit</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} style={{fontFamily:fonts.sans,fontSize:10,fontWeight:600,color:C.textDim,textTransform:"uppercase",textAlign:"center",padding:"2px 0"}}>{d}</div>)}
          {cells.map((d,i)=>{
            if(d===null) return <div key={i} style={{minHeight:92}}/>;
            const ds=`${cy}-${pad2(cm+1)}-${pad2(d)}`;
            const dObj=new Date(cy,cm,d);
            const isToday=ds===todayStr;
            const items=[];
            const mp=moonPhase(dObj);
            if(mp) items.push({key:"moon"+d,label:`${mp.e} ${mp.l}`,color:C.textMuted,time:"",onClick:null,done:false});
            evList.filter(ev=>eventOccursOn(ev,dObj)).forEach(ev=>items.push({key:ev.id,label:(ev.time?ev.time+" ":"")+ev.title,color:EVT_COLOR[ev.type]||C.textMuted,time:ev.time||"",onClick:()=>openEvEdit(ev),done:false}));
            list.filter(t=>t.due===ds).forEach(t=>items.push({key:"t"+t.id,label:t.title,color:PRI_COLOR[t.priority],time:"",onClick:()=>openEdit(t),done:t.done}));
            items.sort((a,b)=>{ if(a.time&&b.time) return a.time<b.time?-1:1; if(a.time) return -1; if(b.time) return 1; return 0; });
            return (
              <div key={i} onClick={()=>openEvNew(ds)} style={{minHeight:92,background:C.bg,border:`1px solid ${isToday?C.accent:C.border}`,borderRadius:8,padding:4,overflow:"hidden",cursor:"pointer"}}>
                <div style={{fontFamily:fonts.mono,fontSize:10,color:isToday?C.accent:C.textDim,fontWeight:isToday?700:400,textAlign:"right",marginBottom:2}}>{d}</div>
                {items.slice(0,3).map(it=>(
                  <div key={it.key} onClick={it.onClick?(e=>{e.stopPropagation();it.onClick();}):undefined} title={it.label} style={{background:`${it.color}22`,borderLeft:`2px solid ${it.color}`,borderRadius:3,padding:"1px 4px",marginBottom:2,cursor:it.onClick?"pointer":"default",fontFamily:fonts.sans,fontSize:9.5,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textDecoration:it.done?"line-through":"none",opacity:it.done?.5:1}}>{it.label}</div>
                ))}
                {items.length>3&&<div style={{fontFamily:fonts.sans,fontSize:9,color:C.textDim}}>+{items.length-3} more</div>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Edit / Add Modal ── */}
      {draft&&(
        <div onClick={()=>setDraft(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24,width:"100%",maxWidth:460,maxHeight:"90vh",overflowY:"auto"}}>
            <h3 style={{fontFamily:fonts.serif,fontSize:22,fontWeight:600,color:C.text,margin:"0 0 18px"}}>{draft._new?"Add Task":"Edit Task"}</h3>
            <label style={lbl}>Title</label>
            <Input value={draft.title} onChange={v=>upd("title",v)} placeholder="What needs doing?" style={{marginBottom:14}}/>
            <div style={{display:"flex",gap:12,marginBottom:14}}>
              <div style={{flex:1}}>
                <label style={lbl}>Priority</label>
                <select value={draft.priority} onChange={e=>upd("priority",e.target.value)} style={selStyle}>{PRIORITIES.map(p=><option key={p.v} value={p.v}>{p.label}</option>)}</select>
              </div>
              <div style={{flex:1}}>
                <label style={lbl}>Category</label>
                <select value={draft.category} onChange={e=>upd("category",e.target.value)} style={selStyle}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
              </div>
            </div>
            <div style={{display:"flex",gap:12,marginBottom:14}}>
              <div style={{flex:1}}>
                <label style={lbl}>Status / Board</label>
                <select value={draft.board} onChange={e=>upd("board",e.target.value)} style={selStyle}>{BOARDS.map(b=><option key={b} value={b}>{b}</option>)}</select>
              </div>
              <div style={{flex:1}}>
                <label style={lbl}>Due Date</label>
                <input type="date" value={draft.due} onChange={e=>upd("due",e.target.value)} style={selStyle}/>
              </div>
            </div>
            <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,cursor:"pointer",fontFamily:fonts.sans,fontSize:13,color:C.textMuted}}>
              <input type="checkbox" checked={draft.allDay} onChange={e=>upd("allDay",e.target.checked)} style={{width:16,height:16,cursor:"pointer"}}/>
              All-day task <span style={{color:C.textDim,fontSize:11}}>(just check it off when done)</span>
            </label>
            <label style={lbl}>Notes</label>
            <TextArea value={draft.notes} onChange={v=>upd("notes",v)} placeholder="Optional details..." rows={3} style={{marginBottom:18}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:10}}>
              {!draft._new&&<Btn onClick={deleteDraft} color={C.red} style={{marginRight:"auto"}}>Delete</Btn>}
              <Btn onClick={()=>setDraft(null)}>Cancel</Btn>
              <Btn onClick={saveDraft} active color={C.red} style={{background:C.red,color:"#fff",border:`1px solid ${C.red}`,fontWeight:600,padding:"7px 18px"}}>Save Task</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Event Modal ── */}
      {evDraft&&(
        <div onClick={()=>setEvDraft(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24,width:"100%",maxWidth:460,maxHeight:"90vh",overflowY:"auto"}}>
            <h3 style={{fontFamily:fonts.serif,fontSize:22,fontWeight:600,color:C.text,margin:"0 0 18px"}}>{evDraft._new?"Add Event":"Edit Event"}</h3>
            <label style={lbl}>Title</label>
            <Input value={evDraft.title} onChange={v=>evUpd("title",v)} placeholder="e.g. Mom's Birthday, Dentist..." style={{marginBottom:14}}/>
            <div style={{display:"flex",gap:12,marginBottom:14}}>
              <div style={{flex:1}}>
                <label style={lbl}>Type</label>
                <select value={evDraft.type} onChange={e=>evUpd("type",e.target.value)} style={selStyle}>{EVENT_TYPES.map(t=><option key={t.v} value={t.v}>{t.label}</option>)}</select>
              </div>
              <div style={{flex:1}}>
                <label style={lbl}>Repeats</label>
                <select value={evDraft.recur} onChange={e=>evUpd("recur",e.target.value)} style={selStyle}>{RECURS.map(r=><option key={r.v} value={r.v}>{r.label}</option>)}</select>
              </div>
            </div>
            <div style={{display:"flex",gap:12,marginBottom:18}}>
              <div style={{flex:1}}>
                <label style={lbl}>Time <span style={{color:C.textDim,textTransform:"none"}}>(blank = all-day)</span></label>
                <input type="time" value={evDraft.time} onChange={e=>evUpd("time",e.target.value)} style={selStyle}/>
              </div>
              <div style={{flex:1}}>
                {evDraft.recur==="weekly"?(
                  <>
                    <label style={lbl}>Day of week</label>
                    <select value={evDraft.weekday} onChange={e=>evUpd("weekday",Number(e.target.value))} style={selStyle}>{WEEKDAYS.map((w,i)=><option key={w} value={i}>{w}</option>)}</select>
                  </>
                ):evDraft.recur==="daily"?(
                  <div style={{fontFamily:fonts.sans,fontSize:12,color:C.textDim,paddingTop:26}}>Occurs every day</div>
                ):(
                  <>
                    <label style={lbl}>{evDraft.recur==="annual"?"Date (repeats yearly)":"Date"}</label>
                    <input type="date" value={evDraft.date} onChange={e=>evUpd("date",e.target.value)} style={selStyle}/>
                  </>
                )}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:10}}>
              {!evDraft._new&&<Btn onClick={deleteEv} color={C.red} style={{marginRight:"auto"}}>Delete</Btn>}
              <Btn onClick={()=>setEvDraft(null)}>Cancel</Btn>
              <Btn onClick={saveEv} active color={C.purple} style={{background:C.purple,color:"#fff",border:`1px solid ${C.purple}`,fontWeight:600,padding:"7px 18px"}}>Save Event</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUCCESS TRACKING
// ═══════════════════════════════════════════════════════════════
function SuccessPage() {
  const [log, setLog] = useStore(SK.successLog, []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({revenue:"",quotes:"",orders:"",sleep:"",habitPct:"",richesPct:"",notes:""});

  const addEntry = () => {
    setLog(p=>[{id:uid(),date:today(),...form,revenue:parseFloat(form.revenue)||0,quotes:parseInt(form.quotes)||0,orders:parseInt(form.orders)||0,sleep:parseFloat(form.sleep)||0,habitPct:parseInt(form.habitPct)||0,richesPct:parseInt(form.richesPct)||0},...p]);
    setForm({revenue:"",quotes:"",orders:"",sleep:"",habitPct:"",richesPct:"",notes:""});
    setAdding(false);
  };
  const remove = (id) => setLog(p=>p.filter(e=>e.id!==id));

  const last30d = log.filter(e=>(new Date()-new Date(e.date))/864e5<=30);
  const totalRev = last30d.reduce((s,e)=>s+e.revenue,0);
  const totalOrders = last30d.reduce((s,e)=>s+e.orders,0);
  const avgHabit = last30d.length>0?Math.round(last30d.reduce((s,e)=>s+e.habitPct,0)/last30d.length):0;
  const tasksCompleted = last30d.length;

  return (
    <div>
      <SectionHead icon="📈" title="Success Tracking" quote='"What gets measured gets managed. What gets managed gets improved." — Peter Drucker' action={<Btn onClick={()=>setAdding(!adding)} active={adding} color={C.green}>+ Add Day</Btn>} />

      <div className="dash-stats" style={{marginBottom:20}}>
        <StatCard label="30d Habit Average" value={`${avgHabit}%`} color={avgHabit>=50?C.green:C.red}/>
        <StatCard label="30d Revenue" value={`$${totalRev.toLocaleString()}`} color={C.green}/>
        <StatCard label="Open Tasks" value={totalOrders} color={C.blue}/>
        <StatCard label="Days Logged" value={tasksCompleted} color={C.accent}/>
      </div>

      {adding&&(
        <Card style={{marginBottom:16,padding:16}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))",gap:8,marginBottom:10}}>
            {[{k:"revenue",p:"Revenue $"},{k:"quotes",p:"Quotes"},{k:"orders",p:"Orders"},{k:"sleep",p:"Sleep (hrs)"},{k:"habitPct",p:"Habit %"},{k:"richesPct",p:"Riches %"}].map(f=>
              <Input key={f.k} value={form[f.k]} onChange={v=>setForm(p=>({...p,[f.k]:v}))} placeholder={f.p}/>
            )}
          </div>
          <Input value={form.notes} onChange={v=>setForm(p=>({...p,notes:v}))} placeholder="Notes..." style={{marginBottom:8}}/>
          <Btn onClick={addEntry} active color={C.green}>Save Entry</Btn>
        </Card>
      )}

      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:fonts.sans,fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${C.border}`}}>
                {["Date","Revenue","Quotes","Orders","Sleep","Habit %","Riches %","Notes",""].map(h=>
                  <th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:600,color:C.textDim,fontSize:10,textTransform:"uppercase",letterSpacing:1}}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {log.slice(0,20).map(e=>(
                <tr key={e.id} style={{borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:"8px 12px",color:C.textMuted,fontFamily:fonts.mono,fontSize:11}}>{e.date}</td>
                  <td style={{padding:"8px 12px",color:C.green,fontFamily:fonts.mono}}>${e.revenue}</td>
                  <td style={{padding:"8px 12px",color:C.text,fontFamily:fonts.mono}}>{e.quotes}</td>
                  <td style={{padding:"8px 12px",color:C.text,fontFamily:fonts.mono}}>{e.orders}</td>
                  <td style={{padding:"8px 12px",color:e.sleep>=7?C.green:C.accent,fontFamily:fonts.mono}}>{e.sleep}h</td>
                  <td style={{padding:"8px 12px",color:e.habitPct>=80?C.green:e.habitPct>=50?C.accent:C.red,fontFamily:fonts.mono}}>{e.habitPct}%</td>
                  <td style={{padding:"8px 12px",color:e.richesPct>=80?C.green:C.accent,fontFamily:fonts.mono}}>{e.richesPct}%</td>
                  <td style={{padding:"8px 12px",color:C.textMuted,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.notes}</td>
                  <td style={{padding:"8px 12px"}}><button onClick={()=>remove(e.id)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10}}>✕</button></td>
                </tr>
              ))}
              {log.length===0&&<tr><td colSpan={9} style={{padding:"20px",textAlign:"center",color:C.textDim}}>No entries yet. Click + Add Day to start tracking.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FITNESS (Gym, Cardio, Body Metrics, Sleep)
// ═══════════════════════════════════════════════════════════════
const MUSCLES = [
  { label:"Push", icon:"🫸", color:C.red, exercises:["Bench Press","Incline DB Press","OHP","Lateral Raise","Tricep Pushdown","Cable Fly","Push Ups","Chest Dips","Arnold Press","Skull Crusher"] },
  { label:"Pull", icon:"🫷", color:C.blue, exercises:["Deadlift","Pull Ups","Barbell Row","Lat Pulldown","Cable Row","Face Pull","Barbell Curl","Hammer Curl","Preacher Curl","Chin Ups"] },
  { label:"Legs", icon:"🦵", color:C.green, exercises:["Squat","Leg Press","RDL","Leg Curl","Leg Extension","Calf Raise","Lunges","Hip Thrust","Bulgarian Split Squat","Goblet Squat"] },
  { label:"Core", icon:"🎯", color:C.accent, exercises:["Plank","Cable Crunch","Hanging Leg Raise","Ab Rollout","Russian Twist","Dead Bug","Pallof Press"] },
  { label:"Cardio", icon:"🏃", color:C.purple, exercises:["Run","Walk","HIIT","Cycling","Swimming","Jump Rope","Stair Climber","Rowing"] },
];

function FitnessPage() {
  const [sessions, setSessions] = useStore(SK.gym, []);
  const [body, setBody] = useStore(SK.bodyMetrics, []);
  const [sleepLog, setSleepLog] = useStore(SK.sleep, []);
  const [mode, setMode] = useState("list"); // list | logging | detail
  const [detailId, setDetailId] = useState(null);
  const [muscle, setMuscle] = useState("Push");
  const [sessionName, setSessionName] = useState("");
  const [exercises, setExercises] = useState([]);
  const [exForm, setExForm] = useState({name:"",sets:[{reps:"",weight:""}]});
  const [showPresets, setShowPresets] = useState(false);
  const [addingB, setAddingB] = useState(false);
  const [addingS, setAddingS] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [bForm, setBForm] = useState({weight:"",bodyFat:"",notes:""});
  const [sForm, setSForm] = useState({bedtime:"23:00",wakeup:"06:30"});

  const mi = () => MUSCLES.find(m=>m.label===muscle)||MUSCLES[0];

  // Exercise form helpers
  const addSet = () => setExForm(p=>({...p,sets:[...p.sets,{reps:"",weight:""}]}));
  const rmSet = (i) => setExForm(p=>({...p,sets:p.sets.filter((_,j)=>j!==i)}));
  const upSet = (i,f,v) => setExForm(p=>({...p,sets:p.sets.map((s,j)=>j===i?{...s,[f]:v}:s)}));

  const addExercise = () => {
    if(!exForm.name.trim())return;
    const valid = exForm.sets.filter(s=>s.reps||s.weight).map(s=>({reps:parseInt(s.reps)||0,weight:parseFloat(s.weight)||0}));
    if(valid.length===0)return;
    setExercises(p=>[...p,{id:uid(),name:exForm.name.trim(),sets:valid}]);
    setExForm({name:"",sets:[{reps:"",weight:""}]});setShowPresets(false);
  };

  // True if the Add Exercise form currently holds a fillable exercise
  const pendingExercise = () => {
    if(!exForm.name.trim())return null;
    const valid = exForm.sets.filter(s=>s.reps||s.weight).map(s=>({reps:parseInt(s.reps)||0,weight:parseFloat(s.weight)||0}));
    if(valid.length===0)return null;
    return {id:uid(),name:exForm.name.trim(),sets:valid};
  };

  const saveSession = () => {
    // Fold in any exercise still sitting in the Add Exercise form so nothing is silently lost
    const pending = pendingExercise();
    const all = pending ? [...exercises, pending] : exercises;
    if(all.length===0)return;
    setSessions(p=>[{id:uid(),name:sessionName.trim()||`${muscle} Day`,muscle,exercises:all,date:today(),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})},...p]);
    setExercises([]);setSessionName("");setExForm({name:"",sets:[{reps:"",weight:""}]});setMode("list");
  };

  const addBody = () => {
    const w=parseFloat(bForm.weight)||0;const bf=parseFloat(bForm.bodyFat)||0;
    if(w<=0&&bf<=0)return;
    setBody(p=>[{id:uid(),weight:w,bodyFat:bf,notes:bForm.notes.trim(),date:today()},...p]);
    setBForm({weight:"",bodyFat:"",notes:""});setAddingB(false);
  };

  const addSleep = () => {
    if(!sForm.bedtime||!sForm.wakeup)return;
    const [bH,bM]=sForm.bedtime.split(":").map(Number);const [wH,wM]=sForm.wakeup.split(":").map(Number);
    let bMins=bH*60+bM,wMins=wH*60+wM;if(wMins<=bMins)wMins+=1440;
    const hrs=Math.round((wMins-bMins)/60*10)/10;
    setSleepLog(p=>[{id:uid(),date:today(),bedtime:sForm.bedtime,wakeup:sForm.wakeup,duration:hrs},...p]);
    setAddingS(false);
  };

  const deleteSession = (id) => {
    setSessions(p=>p.filter(s=>s.id!==id));
    setConfirmDel(false);setMode("list");setDetailId(null);
  };

  const weekSessions = sessions.filter(s=>(new Date()-new Date(s.date))/864e5<=7);
  const weekMuscles = [...new Set(weekSessions.map(s=>s.muscle))];
  const lastWeight = body.length>0?body[0]:null;
  const days30=last30();const wHeat={};days30.forEach(d=>{wHeat[d]=sessions.filter(s=>s.date===d).length;});

  // ── DETAIL VIEW ──
  if(mode==="detail"&&detailId){
    const session = sessions.find(s=>s.id===detailId);
    if(!session){setMode("list");return null;}
    const gi = MUSCLES.find(m=>m.label===session.muscle)||MUSCLES[0];
    const totalSets = session.exercises.reduce((t,ex)=>t+ex.sets.length,0);
    const totalVol = session.exercises.reduce((t,ex)=>t+ex.sets.reduce((st,s)=>st+s.reps*s.weight,0),0);
    return (
      <div>
        <SectionHead icon="💪" title="Fitness" quote='"The pain you feel today will be the strength you feel tomorrow. Push through it."' />
        <Card style={{padding:16}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <button onClick={()=>{setConfirmDel(false);setMode("list");setDetailId(null);}} style={{background:"none",border:`1px solid ${C.border}`,color:C.textMuted,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontFamily:fonts.serif,fontSize:20,fontWeight:500,color:C.text}}>{session.name}</span><Badge color={gi.color}>{gi.icon} {session.muscle}</Badge></div>
              <span style={{fontFamily:fonts.mono,fontSize:10,color:C.textDim}}>{session.date} · {session.time}</span>
            </div>
            {confirmDel?(
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>deleteSession(session.id)} style={{background:C.red,border:`1px solid ${C.red}`,color:"#fff",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:fonts.sans}}>Confirm delete</button>
                <button onClick={()=>setConfirmDel(false)} style={{background:"none",border:`1px solid ${C.border}`,color:C.textMuted,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:fonts.sans}}>Cancel</button>
              </div>
            ):(
              <button onClick={()=>setConfirmDel(true)} style={{background:"none",border:`1px solid ${C.border}`,color:C.red,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:fonts.sans,display:"flex",alignItems:"center",gap:6}}>🗑 Delete</button>
            )}
          </div>
          <div className="dash-stats" style={{marginBottom:16}}>
            <StatCard label="Exercises" value={session.exercises.length} color={gi.color}/>
            <StatCard label="Total Sets" value={totalSets} color={C.blue}/>
            <StatCard label="Volume" value={`${Math.round(totalVol).toLocaleString()}`} color={C.green} suffix="kg"/>
          </div>
          {session.exercises.map((ex,ei)=>(
            <div key={ei} style={{marginBottom:14,background:C.bg,borderRadius:12,padding:14}}>
              <div style={{fontFamily:fonts.sans,fontSize:14,fontWeight:500,color:C.text,marginBottom:8}}>{ex.name}</div>
              <div style={{display:"grid",gridTemplateColumns:"40px 1fr 1fr 1fr",gap:4}}>
                <span style={{fontFamily:fonts.mono,fontSize:9,color:C.textDim}}>SET</span>
                <span style={{fontFamily:fonts.mono,fontSize:9,color:C.textDim}}>REPS</span>
                <span style={{fontFamily:fonts.mono,fontSize:9,color:C.textDim}}>WEIGHT</span>
                <span style={{fontFamily:fonts.mono,fontSize:9,color:C.textDim}}>VOL</span>
                {ex.sets.map((s,si)=>(
                  <React.Fragment key={si}>
                    <span style={{fontFamily:fonts.mono,fontSize:12,color:C.textDim}}>{si+1}</span>
                    <span style={{fontFamily:fonts.mono,fontSize:12,color:C.text}}>{s.reps}</span>
                    <span style={{fontFamily:fonts.mono,fontSize:12,color:gi.color}}>{s.weight}kg</span>
                    <span style={{fontFamily:fonts.mono,fontSize:12,color:C.textMuted}}>{s.reps*s.weight}kg</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  // ── LOGGING VIEW ──
  if(mode==="logging"){
    const g = mi();
    return (
      <div>
        <SectionHead icon="💪" title="Fitness" quote='"The pain you feel today will be the strength you feel tomorrow. Push through it."' />
        <Card style={{padding:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button onClick={()=>{setMode("list");setExercises([]);}} style={{background:"none",border:`1px solid ${C.border}`,color:C.textMuted,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
              <span style={{fontFamily:fonts.serif,fontSize:20,fontWeight:500,color:C.text}}>Log Workout</span>
            </div>
            {(exercises.length>0||pendingExercise())&&<Btn onClick={saveSession} active color={C.green}>Save ({exercises.length+(pendingExercise()?1:0)})</Btn>}
          </div>

          <Input value={sessionName} onChange={setSessionName} placeholder="Session name (e.g. Push Day)..." style={{marginBottom:10}}/>
          <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
            {MUSCLES.map(m=><Btn key={m.label} onClick={()=>setMuscle(m.label)} active={muscle===m.label} color={m.color}>{m.icon} {m.label}</Btn>)}
          </div>

          {/* Logged exercises */}
          {exercises.length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:fonts.sans,fontSize:11,color:C.textDim,marginBottom:6}}>Exercises ({exercises.length})</div>
              {exercises.map(ex=>(
                <div key={ex.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",marginBottom:4,background:C.bg,borderRadius:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontFamily:fonts.sans,fontSize:13,fontWeight:500,color:C.text}}>{ex.name}</span>
                    <Badge color={g.color}>{ex.sets.length} sets</Badge>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontFamily:fonts.mono,fontSize:11,color:C.textDim}}>{ex.sets.map(s=>`${s.reps}×${s.weight}kg`).join(", ")}</span>
                    <button onClick={()=>setExercises(p=>p.filter(e=>e.id!==ex.id))} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10}}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add exercise */}
          <div style={{background:C.bg,borderRadius:12,padding:14}}>
            <div style={{fontFamily:fonts.sans,fontSize:12,fontWeight:500,color:C.text,marginBottom:10}}>Add Exercise</div>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <Input value={exForm.name} onChange={v=>{setExForm(p=>({...p,name:v}));if(!v)setShowPresets(true);}} placeholder="Exercise name..." style={{flex:1}}/>
              <Btn onClick={()=>setShowPresets(!showPresets)} color={g.color}>{showPresets?"Hide":"Presets"}</Btn>
            </div>
            {showPresets&&(
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
                {(mi().exercises||[]).map(name=>(
                  <button key={name} onClick={()=>{setExForm(p=>({...p,name}));setShowPresets(false);}}
                    style={{background:C.surface,border:`1px solid ${C.border}`,color:C.textMuted,borderRadius:6,padding:"4px 10px",fontSize:11,fontFamily:fonts.sans,cursor:"pointer",transition:"all .2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=g.color;e.currentTarget.style.color=g.color;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textMuted;}}
                  >{name}</button>
                ))}
              </div>
            )}
            {/* Sets */}
            <div style={{marginBottom:10}}>
              <div style={{display:"grid",gridTemplateColumns:"32px 1fr 1fr 28px",gap:6,marginBottom:6}}>
                <span style={{fontFamily:fonts.mono,fontSize:9,color:C.textDim}}>SET</span>
                <span style={{fontFamily:fonts.mono,fontSize:9,color:C.textDim}}>REPS</span>
                <span style={{fontFamily:fonts.mono,fontSize:9,color:C.textDim}}>WEIGHT (kg)</span>
                <span/>
              </div>
              {exForm.sets.map((s,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"32px 1fr 1fr 28px",gap:6,marginBottom:4,alignItems:"center"}}>
                  <span style={{fontFamily:fonts.mono,fontSize:12,color:C.textDim,textAlign:"center"}}>{i+1}</span>
                  <Input value={s.reps} onChange={v=>upSet(i,"reps",v)} placeholder="Reps"/>
                  <Input value={s.weight} onChange={v=>upSet(i,"weight",v)} placeholder="Weight"/>
                  {exForm.sets.length>1&&<button onClick={()=>rmSet(i)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10}}>✕</button>}
                </div>
              ))}
              <Btn onClick={addSet} color={C.textMuted}>+ Add Set</Btn>
            </div>
            <Btn onClick={addExercise} active color={g.color}>Add Exercise</Btn>
          </div>
        </Card>
      </div>
    );
  }

  // ── LIST VIEW (default) ──
  return (
    <div>
      <SectionHead icon="💪" title="Fitness" quote='"The pain you feel today will be the strength you feel tomorrow. Push through it."' />

      <div className="dash-stats" style={{marginBottom:20}}>
        <StatCard label="Weight (lbs)" value={lastWeight?lastWeight.weight:"—"} color={C.text}/>
        <StatCard label="Body Fat %" value={lastWeight&&lastWeight.bodyFat?`${lastWeight.bodyFat}%`:"—"} color={C.text}/>
        <StatCard label="Workouts This Week" value={weekSessions.length} color={C.green}/>
        <StatCard label="Muscles Hit" value={`${weekMuscles.length}/5`} color={C.accent}/>
      </div>

      {/* Muscle groups hit */}
      {weekMuscles.length>0&&(
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {MUSCLES.map(m=>{
            const hit = weekMuscles.includes(m.label);
            return <span key={m.label} style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontFamily:fonts.sans,fontWeight:500,color:hit?m.color:C.textDim,background:hit?`${m.color}18`:C.bg,border:`1px solid ${hit?`${m.color}33`:C.border}`}}>{m.icon} {m.label}</span>;
          })}
        </div>
      )}

      <div className="dash-grid-2" style={{marginBottom:20}}>
        {/* Workout Log */}
        <Card style={{padding:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <span style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>🥊 Workout Log</span>
            <Btn onClick={()=>setMode("logging")} active color={C.green}>+ New Session</Btn>
          </div>
          {sessions.length===0?<div style={{color:C.textDim,fontSize:13,padding:"12px 0"}}>No workouts logged yet. Hit + New Session! 💪</div>:
            sessions.slice(0,6).map(s=>{
              const gi=MUSCLES.find(m=>m.label===s.muscle)||MUSCLES[0];
              const totalSets=s.exercises.reduce((t,ex)=>t+ex.sets.length,0);
              return (
                <div key={s.id} onClick={()=>{setDetailId(s.id);setMode("detail");}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16}}>{gi.icon}</span>
                    <div>
                      <div style={{fontFamily:fonts.sans,fontSize:13,fontWeight:500,color:C.text}}>{s.name}</div>
                      <div style={{fontFamily:fonts.mono,fontSize:10,color:C.textDim}}>{s.date} · {s.exercises.length} exercises · {totalSets} sets</div>
                    </div>
                  </div>
                  <Badge color={gi.color}>{s.muscle}</Badge>
                </div>
              );
            })
          }
        </Card>

        {/* 30-day heatmap */}
        <Card style={{padding:16}}>
          <div style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>🔥 30-Day Workout Heatmap</div>
          <Heatmap data={wHeat} days={days30} color={C.red}/>
        </Card>
      </div>

      <div className="dash-grid-2">
        {/* Body Metrics */}
        <Card style={{padding:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <span style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>📏 Body Metrics</span>
            <Btn onClick={()=>setAddingB(!addingB)} active={addingB} color={C.blue}>+ Log</Btn>
          </div>
          {addingB&&(
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",gap:8,marginBottom:6}}><Input value={bForm.weight} onChange={v=>setBForm(p=>({...p,weight:v}))} placeholder="Weight (lbs)"/><Input value={bForm.bodyFat} onChange={v=>setBForm(p=>({...p,bodyFat:v}))} placeholder="Body Fat %"/></div>
              <div style={{display:"flex",gap:8}}><Input value={bForm.notes} onChange={v=>setBForm(p=>({...p,notes:v}))} placeholder="Notes..." style={{flex:1}}/><Btn onClick={addBody} active color={C.green}>Save</Btn></div>
            </div>
          )}
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:fonts.sans,fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["Date","Weight","Body Fat","Notes"].map(h=><th key={h} style={{padding:"6px 8px",textAlign:"left",fontWeight:600,color:C.textDim,fontSize:10,textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
            <tbody>{body.length===0?<tr><td colSpan={4} style={{padding:"12px",color:C.textDim,textAlign:"center"}}>No body metrics logged yet.</td></tr>:
              body.slice(0,8).map(b=><tr key={b.id} style={{borderBottom:`1px solid ${C.border}`}}><td style={{padding:"6px 8px",color:C.textMuted,fontFamily:fonts.mono,fontSize:11}}>{b.date}</td><td style={{padding:"6px 8px",fontFamily:fonts.mono,color:C.text}}>{b.weight}lbs</td><td style={{padding:"6px 8px",fontFamily:fonts.mono,color:C.text}}>{b.bodyFat||"—"}%</td><td style={{padding:"6px 8px",color:C.textDim}}>{b.notes}</td></tr>)
            }</tbody>
          </table>
        </Card>

        {/* Sleep */}
        <Card style={{padding:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <span style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>😴 Sleep Log</span>
            <Btn onClick={()=>setAddingS(!addingS)} active={addingS} color={C.purple}>+ Log</Btn>
          </div>
          {addingS&&(
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",gap:8,marginBottom:6}}>
                <div style={{flex:1}}><div style={{fontSize:10,color:C.textDim,marginBottom:3}}>Bedtime</div><input type="time" value={sForm.bedtime} onChange={e=>setSForm(p=>({...p,bedtime:e.target.value}))} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:fonts.mono,fontSize:13,padding:"6px 10px",outline:"none",width:"100%",boxSizing:"border-box"}}/></div>
                <div style={{flex:1}}><div style={{fontSize:10,color:C.textDim,marginBottom:3}}>Wake up</div><input type="time" value={sForm.wakeup} onChange={e=>setSForm(p=>({...p,wakeup:e.target.value}))} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:fonts.mono,fontSize:13,padding:"6px 10px",outline:"none",width:"100%",boxSizing:"border-box"}}/></div>
              </div>
              <Btn onClick={addSleep} active color={C.green}>Save</Btn>
            </div>
          )}
          {sleepLog.slice(0,7).map(s=><div key={s.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontFamily:fonts.mono,fontSize:11,color:C.textMuted}}>{s.date}</span>
            <span style={{fontFamily:fonts.sans,fontSize:12,color:C.text}}>{s.bedtime} → {s.wakeup}</span>
            <Badge color={s.duration>=7?C.green:C.accent}>{s.duration}h</Badge>
          </div>)}
          {sleepLog.length===0&&<div style={{color:C.textDim,fontSize:13,padding:"8px 0"}}>No sleep data yet.</div>}
        </Card>
      </div>

      {/* Junk Food Tracker */}
      <div style={{marginTop:16}}>
        <JunkFoodTracker />
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════
const JUNK_CATEGORIES = [
  { label: "Fast Food", icon: "🍔", color: C.red },
  { label: "Sugary Drink", icon: "🥤", color: C.accent },
  { label: "Sweets/Candy", icon: "🍬", color: C.purple },
  { label: "Chips/Snacks", icon: "🍿", color: C.accent },
  { label: "Fried Food", icon: "🍟", color: C.red },
  { label: "Other", icon: "🚫", color: C.textMuted },
];

function JunkFoodTracker() {
  const [log, setLog] = useStore(SK.junkFood, []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ item: "", category: "Fast Food", notes: "" });
  const todayStr = today();

  const addEntry = () => {
    if (!form.item.trim()) return;
    setLog(p => [{
      id: uid(), item: form.item.trim(), category: form.category,
      notes: form.notes.trim(), date: todayStr,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }, ...p]);
    setForm({ item: "", category: form.category, notes: "" });
    setAdding(false);
  };
  const remove = (id) => setLog(p => p.filter(e => e.id !== id));

  // Stats
  const todayEntries = log.filter(e => e.date === todayStr);
  const days7 = last7();
  const weekEntries = log.filter(e => days7.includes(e.date));
  const days30 = last30();
  const monthEntries = log.filter(e => days30.includes(e.date));

  // Per-day count for the week
  const weekChart = days7.map(d => ({
    day: d === todayStr ? "Today" : dayOfWeek(d),
    count: log.filter(e => e.date === d).length,
  }));

  // Category breakdown (last 30d)
  const catCounts = {};
  monthEntries.forEach(e => { catCounts[e.category] = (catCounts[e.category] || 0) + 1; });
  const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

  // Streak of clean days (no junk)
  let cleanStreak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    if (log.some(e => e.date === ds)) break;
    cleanStreak++;
  }

  const getCatInfo = (cat) => JUNK_CATEGORIES.find(c => c.label === cat) || JUNK_CATEGORIES[5];

  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🚫</span>
          <div>
            <div style={{ fontFamily: fonts.sans, fontSize: 11, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: 1 }}>Junk Food Tracker</div>
            <div style={{ fontFamily: fonts.sans, fontSize: 11, color: C.textDim, fontStyle: "italic" }}>Track it to beat it</div>
          </div>
        </div>
        <Btn onClick={() => setAdding(!adding)} active={adding} color={C.red}>+ Log Slip</Btn>
      </div>

      {/* Stats */}
      <div className="dash-stats" style={{ marginBottom: 16 }}>
        <StatCard label="Today" value={todayEntries.length} color={todayEntries.length === 0 ? C.green : C.red} />
        <StatCard label="This Week" value={weekEntries.length} color={weekEntries.length <= 3 ? C.green : C.red} />
        <StatCard label="This Month" value={monthEntries.length} color={C.accent} />
        <StatCard label="Clean Streak" value={`${cleanStreak}d`} color={cleanStreak >= 3 ? C.green : C.accent} />
      </div>

      {/* Weekly bar */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 70, marginBottom: 16 }}>
        {weekChart.map((d, i) => {
          const maxH = Math.max(...weekChart.map(x => x.count), 1);
          const barH = d.count > 0 ? Math.max((d.count / maxH) * 45, 4) : 2;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              {d.count > 0 && <span style={{ fontFamily: fonts.mono, fontSize: 10, color: C.red, fontWeight: 600 }}>{d.count}</span>}
              <div style={{ width: "100%", maxWidth: 28, height: barH, borderRadius: 4, background: d.count > 0 ? C.red : C.border, transition: "height .3s" }} />
              <span style={{ fontFamily: fonts.mono, fontSize: 9, color: d.day === "Today" ? C.accent : C.textDim }}>{d.day}</span>
            </div>
          );
        })}
      </div>

      {/* Worst offender */}
      {topCategory && (
        <div style={{ background: C.bg, borderRadius: 10, padding: "8px 14px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: fonts.sans, fontSize: 12, color: C.textMuted }}>Biggest weakness (30d):</span>
          <Badge color={getCatInfo(topCategory[0]).color}>{getCatInfo(topCategory[0]).icon} {topCategory[0]} ({topCategory[1]}x)</Badge>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div style={{ background: C.bg, borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {JUNK_CATEGORIES.map(c => (
              <Btn key={c.label} onClick={() => setForm(p => ({ ...p, category: c.label }))} active={form.category === c.label} color={c.color}>
                {c.icon} {c.label}
              </Btn>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <Input value={form.item} onChange={v => setForm(p => ({ ...p, item: v }))} placeholder="What did you eat?..." style={{ flex: 1 }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Input value={form.notes} onChange={v => setForm(p => ({ ...p, notes: v }))} placeholder="Why? Trigger? (optional)" style={{ flex: 1 }} />
            <Btn onClick={addEntry} active color={C.red}>Log</Btn>
          </div>
        </div>
      )}

      {/* Log */}
      <div style={{ maxHeight: 250, overflowY: "auto" }}>
        {log.length === 0 && (
          <div style={{ fontFamily: fonts.sans, fontSize: 13, color: C.green, padding: "12px 0", textAlign: "center" }}>
            No junk food logged. Keep it up! 💪
          </div>
        )}
        {log.slice(0, 15).map(e => {
          const ci = getCatInfo(e.category);
          return (
            <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>{ci.icon}</span>
                <div>
                  <div style={{ fontFamily: fonts.sans, fontSize: 13, color: C.text }}>{e.item}</div>
                  <div style={{ fontFamily: fonts.mono, fontSize: 10, color: C.textDim }}>
                    {e.date === todayStr ? "Today" : e.date} · {e.time}
                    {e.notes && <span style={{ color: C.textDim }}> · {e.notes}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <Badge color={ci.color}>{e.category}</Badge>
                <button onClick={() => remove(e.id)} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 10 }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// FINANCE
// ═══════════════════════════════════════════════════════════════
function FinancePage() {
  const [finance, setFinance] = useStore(SK.finances, {balance:0,transactions:[],budget:2000});
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({desc:"",amount:"",category:""});

  const income = finance.transactions.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
  const expenses = finance.transactions.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
  const surplus = income - expenses;
  const savingsRate = income>0?Math.round((surplus/income)*100):0;

  const addTx = () => {
    const amt=parseFloat(form.amount);if(!form.desc.trim()||isNaN(amt))return;
    setFinance(p=>({...p,balance:p.balance+amt,transactions:[{id:uid(),desc:form.desc.trim(),amount:amt,type:amt>=0?"income":"expense",date:today(),category:form.category.trim()||"Other"},...p.transactions]}));
    setForm({desc:"",amount:"",category:""});setAdding(false);
  };
  const removeTx = (id) => {const tx=finance.transactions.find(t=>t.id===id);if(!tx)return;setFinance(p=>({...p,balance:p.balance-tx.amount,transactions:p.transactions.filter(t=>t.id!==id)}));};

  return (
    <div>
      <SectionHead icon="💰" title="Finance" quote={"\"It's not about how much money you make, but how much money you keep, and how hard it works for you.\" — Robert Kiyosaki"} action={<Btn onClick={()=>setAdding(!adding)} active={adding} color={C.green}>+ Add</Btn>}/>

      <div className="dash-stats" style={{marginBottom:20}}>
        <StatCard label="This Month Income" value={`$${income.toLocaleString()}`} color={C.green}/>
        <StatCard label="This Month Expenses" value={`$${expenses.toLocaleString()}`} color={C.red}/>
        <StatCard label="Surplus" value={`${surplus>=0?"+":""}$${Math.abs(surplus).toLocaleString()}`} color={surplus>=0?C.green:C.red}/>
        <StatCard label="Savings Rate" value={`${savingsRate}%`} color={savingsRate>20?C.green:C.accent}/>
      </div>

      {adding&&(
        <Card style={{marginBottom:16,padding:16}}>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <Input value={form.desc} onChange={v=>setForm(p=>({...p,desc:v}))} placeholder="Description..." style={{flex:2}}/>
            <Input value={form.amount} onChange={v=>setForm(p=>({...p,amount:v}))} placeholder="Amount (- for expense)" style={{flex:1}}/>
            <Input value={form.category} onChange={v=>setForm(p=>({...p,category:v}))} placeholder="Category" style={{flex:1}}/>
            <Btn onClick={addTx} active color={C.green}>Add</Btn>
          </div>
        </Card>
      )}

      <Card style={{padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:fonts.sans,fontSize:12}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["","Description","Category","Date","Amount",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:600,color:C.textDim,fontSize:10,textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
          <tbody>
            {finance.transactions.slice(0,15).map(tx=>(
              <tr key={tx.id} style={{borderBottom:`1px solid ${C.border}`}}>
                <td style={{padding:"8px 12px"}}><div style={{width:8,height:8,borderRadius:"50%",background:tx.amount>=0?C.green:C.red}}/></td>
                <td style={{padding:"8px 12px",color:C.text}}>{tx.desc}</td>
                <td style={{padding:"8px 12px"}}><Badge color={C.textDim}>{tx.category}</Badge></td>
                <td style={{padding:"8px 12px",color:C.textDim,fontFamily:fonts.mono,fontSize:11}}>{tx.date}</td>
                <td style={{padding:"8px 12px",fontFamily:fonts.mono,fontWeight:500,color:tx.amount>=0?C.green:C.red}}>{tx.amount>=0?"+":""}${Math.abs(tx.amount).toLocaleString()}</td>
                <td style={{padding:"8px 12px"}}><button onClick={()=>removeTx(tx.id)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10}}>✕</button></td>
              </tr>
            ))}
            {finance.transactions.length===0&&<tr><td colSpan={6} style={{padding:"20px",textAlign:"center",color:C.textDim}}>No transactions yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SKILLS
// ═══════════════════════════════════════════════════════════════
function SkillsPage() {
  const [skills, setSkills] = useStore(SK.skills, []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({name:"",category:""});
  const [logForm, setLogForm] = useState({skillId:null,duration:"",notes:""});
  const [videoNotes, setVideoNotes] = useStore("v2_video_notes", []);
  const [addingVid, setAddingVid] = useState(false);
  const [vidForm, setVidForm] = useState({title:"",url:"",notes:""});
  const addVideoNote = () => {
    if(!vidForm.title.trim() && !vidForm.url.trim()) return;
    let url = vidForm.url.trim();
    if(url && !/^https?:\/\//i.test(url)) url = "https://"+url;
    setVideoNotes(p=>[{id:uid(),date:today(),title:vidForm.title.trim()||"Untitled video",url,notes:vidForm.notes.trim()},...p]);
    setVidForm({title:"",url:"",notes:""}); setAddingVid(false);
  };
  const delVideoNote = (id) => setVideoNotes(p=>p.filter(v=>v.id!==id));

  const colors = [C.blue,C.purple,C.accent,C.green,C.red];
  const addSkill = () => {if(!form.name.trim())return;setSkills(p=>[...p,{id:uid(),name:form.name.trim(),category:form.category.trim()||"General",progress:0,color:colors[p.length%5],sessions:[]}]);setForm({name:"",category:""});setAdding(false);};
  const logSession = () => {if(!logForm.skillId)return;const dur=parseInt(logForm.duration)||0;if(dur<=0)return;setSkills(p=>p.map(s=>{if(s.id!==logForm.skillId)return s;return {...s,sessions:[{date:today(),duration:dur,notes:logForm.notes.trim()},...(s.sessions||[])]}}));setLogForm({skillId:null,duration:"",notes:""});};
  const updateProgress = (id,d) => setSkills(p=>p.map(s=>s.id===id?{...s,progress:clamp(s.progress+d,0,100)}:s));

  const totalHours = Math.round(skills.reduce((s,sk)=>(sk.sessions||[]).reduce((ss,se)=>ss+se.duration,0)+s,0)/60*10)/10;
  const learning = skills.filter(s=>s.progress<100).length;
  const completed = skills.filter(s=>s.progress>=100).length;

  return (
    <div>
      <SectionHead icon="🏅" title="Skill Acquisition" quote='"An investment in knowledge pays the best interest." — Benjamin Franklin' action={<Btn onClick={()=>setAdding(!adding)} active={adding} color={C.accent}>+ Add Skill</Btn>}/>

      <div className="dash-stats" style={{marginBottom:20}}>
        <StatCard label="Total Skills" value={skills.length} color={C.blue}/>
        <StatCard label="Currently Learning" value={learning} color={C.accent}/>
        <StatCard label="Completed" value={completed} color={C.green}/>
        <StatCard label="Total Study Hours" value={totalHours} color={C.purple}/>
      </div>

      {adding&&(
        <Card style={{marginBottom:16,padding:16}}>
          <div style={{display:"flex",gap:8}}><Input value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="Skill name..." style={{flex:2}}/><Input value={form.category} onChange={v=>setForm(p=>({...p,category:v}))} placeholder="Category..." style={{flex:1}}/><Btn onClick={addSkill} active color={C.green}>Add</Btn></div>
        </Card>
      )}

      <div className="dash-grid-2" style={{marginBottom:20}}>
        {skills.map(sk=>(
          <Card key={sk.id} style={{padding:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontFamily:fonts.sans,fontSize:14,fontWeight:600,color:C.text}}>{sk.name}</span><Badge color={sk.color}>{sk.category}</Badge></div>
              <span style={{fontFamily:fonts.mono,fontSize:14,fontWeight:600,color:sk.color}}>{sk.progress}%</span>
            </div>
            <ProgressBar value={sk.progress} color={sk.color} height={6}/>
            <div style={{display:"flex",gap:4,marginTop:8}}>{[5,10,25].map(d=><Btn key={d} onClick={()=>updateProgress(sk.id,d)} color={sk.color}>+{d}%</Btn>)}</div>
          </Card>
        ))}
      </div>

      {/* Study Time Log */}
      <Card style={{padding:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <span style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>⏱ Study Time Log</span>
          <Btn onClick={()=>setLogForm(p=>({...p,skillId:p.skillId?null:(skills[0]?.id||null)}))} active={!!logForm.skillId} color={C.blue}>+ Log Session</Btn>
        </div>
        {logForm.skillId&&(
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <select value={logForm.skillId} onChange={e=>setLogForm(p=>({...p,skillId:e.target.value}))} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:fonts.sans,fontSize:13,padding:"8px 12px",outline:"none"}}>
              {skills.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Input value={logForm.duration} onChange={v=>setLogForm(p=>({...p,duration:v}))} placeholder="Duration (min)" style={{width:120}}/>
            <Input value={logForm.notes} onChange={v=>setLogForm(p=>({...p,notes:v}))} placeholder="Notes..." style={{flex:1}}/>
            <Btn onClick={logSession} active color={C.green}>Log</Btn>
          </div>
        )}
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:fonts.sans,fontSize:12}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["Date","Skill","Duration (hrs)","Notes"].map(h=><th key={h} style={{padding:"6px 8px",textAlign:"left",fontWeight:600,color:C.textDim,fontSize:10,textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
          <tbody>{skills.flatMap(sk=>(sk.sessions||[]).map((se,i)=>({...se,skill:sk.name,color:sk.color,key:`${sk.id}-${i}`}))).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10).map(se=>
            <tr key={se.key} style={{borderBottom:`1px solid ${C.border}`}}><td style={{padding:"6px 8px",fontFamily:fonts.mono,fontSize:11,color:C.textDim}}>{se.date}</td><td style={{padding:"6px 8px",color:se.color}}>{se.skill}</td><td style={{padding:"6px 8px",fontFamily:fonts.mono,color:C.text}}>{Math.round(se.duration/60*10)/10}</td><td style={{padding:"6px 8px",color:C.textMuted}}>{se.notes}</td></tr>
          )}{skills.flatMap(s=>s.sessions||[]).length===0&&<tr><td colSpan={4} style={{padding:"12px",textAlign:"center",color:C.textDim}}>No sessions logged yet.</td></tr>}</tbody>
        </table>
      </Card>

      {/* Video Notes */}
      <Card style={{padding:16,marginTop:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <span style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>🎬 Video Notes</span>
          <Btn onClick={()=>setAddingVid(!addingVid)} active={addingVid} color={C.accent}>+ Add Video</Btn>
        </div>
        {addingVid&&(
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <Input value={vidForm.title} onChange={v=>setVidForm(p=>({...p,title:v}))} placeholder="Video title..." style={{flex:2,minWidth:160}}/>
              <Input value={vidForm.url} onChange={v=>setVidForm(p=>({...p,url:v}))} placeholder="Video link (paste URL)..." style={{flex:2,minWidth:160}}/>
            </div>
            <textarea value={vidForm.notes} onChange={e=>setVidForm(p=>({...p,notes:e.target.value}))} placeholder="Your notes from this video..." style={{width:"100%",minHeight:80,background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:fonts.sans,fontSize:13,padding:"10px 12px",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
            <div><Btn onClick={addVideoNote} active color={C.green}>Save Note</Btn></div>
          </div>
        )}
        {videoNotes.length===0?(
          <div style={{padding:"12px",textAlign:"center",color:C.textDim,fontFamily:fonts.sans,fontSize:12}}>No video notes yet. Add one above.</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {videoNotes.map(v=>(
              <div key={v.id} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                  <div style={{minWidth:0}}>
                    {v.url?<a href={v.url} target="_blank" rel="noopener noreferrer" style={{display:"block",fontFamily:fonts.sans,fontSize:14,fontWeight:600,color:C.accent,textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>▶ {v.title}</a>:<span style={{fontFamily:fonts.sans,fontSize:14,fontWeight:600,color:C.text}}>{v.title}</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                    <span style={{fontFamily:fonts.mono,fontSize:10,color:C.textDim}}>{v.date}</span>
                    <span onClick={()=>delVideoNote(v.id)} title="Delete" style={{color:C.textDim,cursor:"pointer",fontSize:13}}>✕</span>
                  </div>
                </div>
                {v.notes&&<div style={{marginTop:6,fontFamily:fonts.sans,fontSize:13,color:C.textMuted,whiteSpace:"pre-wrap",lineHeight:1.5}}>{v.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME MAINTENANCE
// ═══════════════════════════════════════════════════════════════
function HomePage() {
  const [home, setHome] = useStore(SK.home, {daily:[],weekly:[],monthly:[],seasonal:[]});
  const [addingTo, setAddingTo] = useState(null);
  const [newTask, setNewTask] = useState("");
  const todayStr = today();

  const cats = [
    {key:"daily",label:"Daily Tasks",icon:"☀️",color:C.accent},
    {key:"weekly",label:"Weekly Tasks",icon:"📅",color:C.blue},
    {key:"monthly",label:"Monthly Tasks",icon:"📆",color:C.purple},
    {key:"seasonal",label:"Occasional / Seasonal Checks",icon:"🔍",color:C.green},
  ];

  const addTask = (key) => {if(!newTask.trim())return;setHome(p=>({...p,[key]:[...p[key],{id:uid(),text:newTask.trim(),done:false}]}));setNewTask("");setAddingTo(null);};
  const toggleTask = (key,id) => setHome(p=>({...p,[key]:p[key].map(t=>t.id===id?{...t,done:!t.done}:t)}));
  const removeTask = (key,id) => setHome(p=>({...p,[key]:p[key].filter(t=>t.id!==id)}));
  const resetAll = (key) => setHome(p=>({...p,[key]:p[key].map(t=>({...t,done:false}))}));

  return (
    <div>
      <SectionHead icon="🏠" title="Home" quote='"A well-maintained home is a reflection of the person who lives in it."'/>
      <div className="dash-grid-2">
        {cats.map(cat=>(
          <Card key={cat.key} style={{padding:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span>{cat.icon}</span><span style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>{cat.label}</span></div>
              <Btn onClick={()=>setAddingTo(addingTo===cat.key?null:cat.key)} active={addingTo===cat.key}>+ Add</Btn>
            </div>
            {addingTo===cat.key&&<div style={{display:"flex",gap:8,marginBottom:8}}><Input value={newTask} onChange={setNewTask} placeholder="Task..." style={{flex:1}}/><Btn onClick={()=>addTask(cat.key)} active color={C.green}>Add</Btn></div>}
            {(home[cat.key]||[]).map(t=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
                <button onClick={()=>toggleTask(cat.key,t.id)} style={{width:22,height:22,borderRadius:6,border:t.done?"none":`1.5px solid ${C.border}`,background:t.done?C.green:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,flexShrink:0}}>{t.done?"✓":""}</button>
                <span style={{fontFamily:fonts.sans,fontSize:13,color:t.done?C.textDim:C.text,textDecoration:t.done?"line-through":"none",flex:1}}>{t.text}</span>
                <button onClick={()=>removeTask(cat.key,t.id)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10}}>✕</button>
              </div>
            ))}
            {(home[cat.key]||[]).length===0&&<div style={{color:C.textDim,fontSize:12,padding:"8px 0"}}>No tasks yet — click + Add to get started.</div>}
            {(home[cat.key]||[]).some(t=>t.done)&&<Btn onClick={()=>resetAll(cat.key)} style={{marginTop:8,fontSize:11}} color={C.textMuted}>Reset All</Btn>}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CAR MAINTENANCE
// ═══════════════════════════════════════════════════════════════
function CarPage() {
  const [car, setCar] = useStore(SK.car, {info:{make:"",year:"",mileage:"",plate:"",insurance:"",registration:""},maintenance:[],history:[]});
  const [addingM, setAddingM] = useState(false);
  const [addingH, setAddingH] = useState(false);
  const [mForm, setMForm] = useState({task:"",interval:""});
  const [hForm, setHForm] = useState({service:"",mileage:"",cost:"",shop:""});

  const saveInfo = (field,val) => setCar(p=>({...p,info:{...p.info,[field]:val}}));
  const addMaintenance = () => {if(!mForm.task.trim())return;setCar(p=>({...p,maintenance:[...p.maintenance,{id:uid(),task:mForm.task.trim(),interval:mForm.interval.trim(),done:false}]}));setMForm({task:"",interval:""});setAddingM(false);};
  const addHistory = () => {if(!hForm.service.trim())return;setCar(p=>({...p,history:[{id:uid(),date:today(),service:hForm.service.trim(),mileage:hForm.mileage,cost:hForm.cost,shop:hForm.shop.trim()},...p.history]}));setHForm({service:"",mileage:"",cost:"",shop:""});setAddingH(false);};

  return (
    <div>
      <SectionHead icon="🚗" title="Car" quote='"Take care of your car and your car will take care of you."'/>

      <Card style={{padding:16,marginBottom:16}}>
        <div style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>🚙 Vehicle Info</div>
        <div className="dash-grid-3" style={{marginBottom:10}}>
          {[{k:"make",p:"Make / Model"},{k:"year",p:"Year"},{k:"mileage",p:"Current Mileage (KM)"}].map(f=>
            <div key={f.k}><div style={{fontSize:10,color:C.textDim,marginBottom:3,textTransform:"uppercase",letterSpacing:.5}}>{f.p}</div><Input value={car.info[f.k]} onChange={v=>saveInfo(f.k,v)} placeholder={f.p}/></div>
          )}
        </div>
        <div className="dash-grid-3">
          {[{k:"plate",p:"License Plate"},{k:"insurance",p:"Insurance Renewal",t:"date"},{k:"registration",p:"Registration Renewal",t:"date"}].map(f=>
            <div key={f.k}><div style={{fontSize:10,color:C.textDim,marginBottom:3,textTransform:"uppercase",letterSpacing:.5}}>{f.p}</div><Input type={f.t||"text"} value={car.info[f.k]} onChange={v=>saveInfo(f.k,v)} placeholder={f.p}/></div>
          )}
        </div>
      </Card>

      <div className="dash-grid-2" style={{marginBottom:16}}>
        <Card style={{padding:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><span style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>🔧 Maintenance Schedule</span><Btn onClick={()=>setAddingM(!addingM)} active={addingM}>+ Add</Btn></div>
          {addingM&&<div style={{display:"flex",gap:8,marginBottom:8}}><Input value={mForm.task} onChange={v=>setMForm(p=>({...p,task:v}))} placeholder="Task (e.g. Oil change)..." style={{flex:1}}/><Input value={mForm.interval} onChange={v=>setMForm(p=>({...p,interval:v}))} placeholder="Every..." style={{width:100}}/><Btn onClick={addMaintenance} active color={C.green}>Add</Btn></div>}
          {car.maintenance.length===0?<div style={{color:C.textDim,fontSize:12}}>No maintenance tasks added yet.</div>:car.maintenance.map(m=><div key={m.id} style={{padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontFamily:fonts.sans,fontSize:13,color:C.text}}>{m.task} <span style={{color:C.textDim,fontSize:11}}>({m.interval})</span></div>)}
        </Card>

        <Card style={{padding:16}}>
          <div style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>⚠️ Upcoming / Due Soon</div>
          {car.info.insurance&&new Date(car.info.insurance)<new Date(new Date().setMonth(new Date().getMonth()+1))?<Badge color={C.accent}>Insurance renewal coming up</Badge>:null}
          {car.info.registration&&new Date(car.info.registration)<new Date(new Date().setMonth(new Date().getMonth()+1))?<Badge color={C.accent}>Registration renewal coming up</Badge>:null}
          {(!car.info.insurance||new Date(car.info.insurance)>=new Date(new Date().setMonth(new Date().getMonth()+1)))&&(!car.info.registration||new Date(car.info.registration)>=new Date(new Date().setMonth(new Date().getMonth()+1)))&&<div style={{color:C.green,fontSize:13}}>No upcoming alerts. All good! ✅</div>}
        </Card>
      </div>

      <Card style={{padding:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><span style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>📋 Service History</span><Btn onClick={()=>setAddingH(!addingH)} active={addingH} color={C.blue}>+ Log Service</Btn></div>
        {addingH&&<div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}><Input value={hForm.service} onChange={v=>setHForm(p=>({...p,service:v}))} placeholder="Service..." style={{flex:2}}/><Input value={hForm.mileage} onChange={v=>setHForm(p=>({...p,mileage:v}))} placeholder="Mileage" style={{flex:1}}/><Input value={hForm.cost} onChange={v=>setHForm(p=>({...p,cost:v}))} placeholder="Cost" style={{flex:1}}/><Input value={hForm.shop} onChange={v=>setHForm(p=>({...p,shop:v}))} placeholder="Shop / Notes" style={{flex:1}}/><Btn onClick={addHistory} active color={C.green}>Log</Btn></div>}
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:fonts.sans,fontSize:12}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["Date","Service","Mileage (KM)","Cost","Shop / Notes"].map(h=><th key={h} style={{padding:"6px 8px",textAlign:"left",fontWeight:600,color:C.textDim,fontSize:10,textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
          <tbody>{car.history.length===0?<tr><td colSpan={5} style={{padding:"12px",textAlign:"center",color:C.textDim}}>No services logged yet.</td></tr>:car.history.map(h=><tr key={h.id} style={{borderBottom:`1px solid ${C.border}`}}><td style={{padding:"6px 8px",fontFamily:fonts.mono,fontSize:11,color:C.textDim}}>{h.date}</td><td style={{padding:"6px 8px",color:C.text}}>{h.service}</td><td style={{padding:"6px 8px",fontFamily:fonts.mono}}>{h.mileage}</td><td style={{padding:"6px 8px",fontFamily:fonts.mono,color:C.green}}>${h.cost}</td><td style={{padding:"6px 8px",color:C.textMuted}}>{h.shop}</td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SIMPLE PAGES (Journal, Goals, etc.)
// ═══════════════════════════════════════════════════════════════
function JournalPage() {
  const [entries, setEntries] = useStore(SK.journal, []);
  const [text, setText] = useState("");
  const [mood, setMood] = useState(null);
  const moods = ["😊","😌","🤔","😤","😢"];

  const addEntry = () => {if(!text.trim()&&!mood)return;setEntries(p=>[{id:uid(),text:text.trim(),mood,date:today(),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})},...p]);setText("");setMood(null);};
  const remove = (id) => setEntries(p=>p.filter(e=>e.id!==id));

  return (
    <div>
      <SectionHead icon="📝" title="Journal" count={entries.length} quote='"The life you examine is the life worth living."'/>
      <Card style={{padding:16,marginBottom:16}}>
        <div style={{display:"flex",gap:8,marginBottom:10}}>{moods.map(m=><button key={m} onClick={()=>setMood(mood===m?null:m)} style={{fontSize:20,background:mood===m?C.accentSoft:"transparent",border:mood===m?`1px solid ${C.accent}`:`1px solid ${C.border}`,borderRadius:10,width:40,height:40,cursor:"pointer"}}>{m}</button>)}</div>
        <div style={{display:"flex",gap:8}}><TextArea value={text} onChange={setText} placeholder="How's your day going?" style={{flex:1}}/><Btn onClick={addEntry} active style={{alignSelf:"flex-end"}}>Save</Btn></div>
      </Card>
      {entries.slice(0,10).map(e=><Card key={e.id} style={{padding:14,marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><div style={{display:"flex",gap:6}}>{e.mood&&<span>{e.mood}</span>}<span style={{fontFamily:fonts.mono,fontSize:10,color:C.textDim}}>{e.date} · {e.time}</span></div><button onClick={()=>remove(e.id)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10}}>✕</button></div>
        {e.text&&<p style={{fontFamily:fonts.sans,fontSize:13,color:C.textMuted,margin:0,lineHeight:1.5}}>{e.text}</p>}
      </Card>)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PEOPLE NOTES / CRM
// ═══════════════════════════════════════════════════════════════
function PeoplePage() {
  const [people, setPeople] = useStore(SK.people, []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({person:"",need:"",context:"",followUp:""});
  const [search, setSearch] = useState("");

  const addNote = () => {if(!form.person.trim()||!form.need.trim())return;setPeople(p=>[{id:uid(),person:form.person.trim(),need:form.need.trim(),context:form.context.trim(),followUp:form.followUp,date:today(),resolved:false},...p]);setForm({person:"",need:"",context:"",followUp:""});setAdding(false);};
  const toggleResolved = (id) => setPeople(p=>p.map(n=>n.id===id?{...n,resolved:!n.resolved}:n));
  const remove = (id) => setPeople(p=>p.filter(n=>n.id!==id));

  const filtered = people.filter(n=>{if(!search)return true;const s=search.toLowerCase();return n.person.toLowerCase().includes(s)||n.need.toLowerCase().includes(s)||(n.context&&n.context.toLowerCase().includes(s));});
  const active = filtered.filter(n=>!n.resolved);
  const resolved = filtered.filter(n=>n.resolved);
  const needsFollowUp = active.filter(n=>n.followUp&&n.followUp<=today());

  return (
    <div>
      <SectionHead icon="👥" title="People Notes" count={`${active.length} active${needsFollowUp.length>0?` · ${needsFollowUp.length} follow-up`:""}`} quote='"Your network is your net worth."' action={<Btn onClick={()=>setAdding(!adding)} active={adding} color={C.green}>+ Add</Btn>}/>

      {adding&&(
        <Card style={{marginBottom:16,padding:16}}>
          <Input value={form.person} onChange={v=>setForm(p=>({...p,person:v}))} placeholder="Person's name..." style={{marginBottom:8}}/>
          <Input value={form.need} onChange={v=>setForm(p=>({...p,need:v}))} placeholder="What are they looking for?..." style={{marginBottom:8}}/>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <Input value={form.context} onChange={v=>setForm(p=>({...p,context:v}))} placeholder="Context / how you can help..." style={{flex:1}}/>
            <input type="date" value={form.followUp} onChange={e=>setForm(p=>({...p,followUp:e.target.value}))} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:fonts.mono,fontSize:12,padding:"6px 10px",outline:"none"}}/>
          </div>
          <Btn onClick={addNote} active color={C.green}>Save</Btn>
        </Card>
      )}

      <Input value={search} onChange={setSearch} placeholder="Search people or needs..." style={{marginBottom:14}}/>

      {needsFollowUp.length>0&&<div style={{fontFamily:fonts.sans,fontSize:11,color:C.accent,fontWeight:600,marginBottom:8}}>⚡ Follow Up Today ({needsFollowUp.length})</div>}

      {[...active,...resolved].slice(0,20).map(note=>{
        const overdue=note.followUp&&note.followUp<=today()&&!note.resolved;
        return (
          <Card key={note.id} style={{padding:14,marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontFamily:fonts.sans,fontSize:14,fontWeight:600,color:note.resolved?C.textDim:C.text}}>{note.person}</span>
                {overdue&&<Badge color={C.accent}>Follow up!</Badge>}
                {note.resolved&&<Badge color={C.green}>Resolved</Badge>}
              </div>
              <div style={{display:"flex",gap:4}}>
                <Btn onClick={()=>toggleResolved(note.id)} color={note.resolved?C.textDim:C.green}>{note.resolved?"Reopen":"Resolve"}</Btn>
                <button onClick={()=>remove(note.id)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10}}>✕</button>
              </div>
            </div>
            <div style={{fontFamily:fonts.sans,fontSize:13,color:C.textMuted,lineHeight:1.5}}>
              <strong style={{color:note.resolved?C.textDim:C.text,fontWeight:500}}>Looking for:</strong> {note.need}
            </div>
            {note.context&&<div style={{fontFamily:fonts.sans,fontSize:12,color:C.textDim,marginTop:2}}>{note.context}</div>}
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <span style={{fontFamily:fonts.mono,fontSize:10,color:C.textDim}}>{note.date}</span>
              {note.followUp&&<span style={{fontFamily:fonts.mono,fontSize:10,color:overdue?C.accent:C.textDim}}>Follow up: {note.followUp}</span>}
            </div>
          </Card>
        );
      })}
      {filtered.length===0&&<div style={{color:C.textDim,fontSize:13,padding:"12px 0"}}>{search?"No matches.":"No people notes yet."}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CAREER JOURNAL
// ═══════════════════════════════════════════════════════════════
function CareerJournalPage() {
  const [entries, setEntries] = useStore(SK.careerLog, []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({type:"win",text:"",project:""});
  const [filter, setFilter] = useState("all");

  const types = {win:{label:"Win",icon:"🏆",color:C.green},feedback:{label:"Feedback",icon:"💬",color:C.blue},project:{label:"Project",icon:"📁",color:C.purple},learning:{label:"Learning",icon:"📚",color:C.accent},milestone:{label:"Milestone",icon:"🎯",color:C.red}};

  const addEntry = () => {if(!form.text.trim())return;setEntries(p=>[{id:uid(),type:form.type,text:form.text.trim(),project:form.project.trim(),date:today()},...p]);setForm({type:form.type,text:"",project:""});setAdding(false);};
  const remove = (id) => setEntries(p=>p.filter(e=>e.id!==id));
  const filtered = filter==="all"?entries:entries.filter(e=>e.type===filter);

  return (
    <div>
      <SectionHead icon="💼" title="Career Journal" count={entries.length} quote='"Document every win. Your future self will thank you."' action={<Btn onClick={()=>setAdding(!adding)} active={adding} color={C.green}>+ Add</Btn>}/>
      {adding&&(
        <Card style={{marginBottom:16,padding:16}}>
          <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>{Object.entries(types).map(([k,v])=><Btn key={k} onClick={()=>setForm(p=>({...p,type:k}))} active={form.type===k} color={v.color}>{v.icon} {v.label}</Btn>)}</div>
          <Input value={form.text} onChange={v=>setForm(p=>({...p,text:v}))} placeholder="What happened?..." style={{marginBottom:8}}/>
          <div style={{display:"flex",gap:8}}><Input value={form.project} onChange={v=>setForm(p=>({...p,project:v}))} placeholder="Related project (optional)..." style={{flex:1}}/><Btn onClick={addEntry} active color={C.green}>Save</Btn></div>
        </Card>
      )}
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        <Btn onClick={()=>setFilter("all")} active={filter==="all"}>All</Btn>
        {Object.entries(types).map(([k,v])=><Btn key={k} onClick={()=>setFilter(k)} active={filter===k} color={v.color}>{v.icon}</Btn>)}
      </div>
      {filtered.slice(0,15).map(e=>{const t=types[e.type]||types.win;return (
        <Card key={e.id} style={{padding:14,marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><Badge color={t.color}>{t.icon} {t.label}</Badge>{e.project&&<Badge color={C.textDim}>{e.project}</Badge>}</div>
            <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:fonts.mono,fontSize:10,color:C.textDim}}>{e.date}</span><button onClick={()=>remove(e.id)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10}}>✕</button></div>
          </div>
          <p style={{fontFamily:fonts.sans,fontSize:13,color:C.text,margin:0,lineHeight:1.5}}>{e.text}</p>
        </Card>
      );})}
      {filtered.length===0&&<div style={{color:C.textDim,fontSize:13,padding:"12px 0"}}>No entries yet. Start documenting your career wins.</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NETWORKING TRACKER
// ═══════════════════════════════════════════════════════════════
function NetworkingPage() {
  const [contacts, setContacts] = useStore(SK.network, []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({name:"",company:"",role:"",notes:"",followUp:""});
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [intNote, setIntNote] = useState("");

  const add = () => {if(!form.name.trim())return;setContacts(p=>[{id:uid(),name:form.name.trim(),company:form.company.trim(),role:form.role.trim(),notes:form.notes.trim(),followUp:form.followUp,interactions:[{date:today(),note:"Initial contact"}]},...p]);setForm({name:"",company:"",role:"",notes:"",followUp:""});setAdding(false);};
  const addInteraction = (id) => {if(!intNote.trim())return;setContacts(p=>p.map(c=>c.id===id?{...c,interactions:[{date:today(),note:intNote.trim()},...c.interactions]}:c));setIntNote("");};
  const remove = (id) => setContacts(p=>p.filter(c=>c.id!==id));

  const filtered = contacts.filter(c=>{if(!search)return true;const s=search.toLowerCase();return c.name.toLowerCase().includes(s)||c.company.toLowerCase().includes(s)||c.role.toLowerCase().includes(s);});
  const needsFollowUp = contacts.filter(c=>c.followUp&&c.followUp<=today());

  return (
    <div>
      <SectionHead icon="🤝" title="Networking" count={`${contacts.length} contacts${needsFollowUp.length>0?` · ${needsFollowUp.length} follow-up`:""}`} quote='"The richest people in the world build networks. Everyone else looks for work."' action={<Btn onClick={()=>setAdding(!adding)} active={adding} color={C.green}>+ Add Contact</Btn>}/>
      {adding&&(
        <Card style={{marginBottom:16,padding:16}}>
          <div style={{display:"flex",gap:8,marginBottom:8}}><Input value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="Name..." style={{flex:1}}/><Input value={form.company} onChange={v=>setForm(p=>({...p,company:v}))} placeholder="Company..." style={{flex:1}}/></div>
          <div style={{display:"flex",gap:8,marginBottom:8}}><Input value={form.role} onChange={v=>setForm(p=>({...p,role:v}))} placeholder="Role / Title..." style={{flex:1}}/><input type="date" value={form.followUp} onChange={e=>setForm(p=>({...p,followUp:e.target.value}))} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:fonts.mono,fontSize:12,padding:"6px 10px",outline:"none"}}/></div>
          <Input value={form.notes} onChange={v=>setForm(p=>({...p,notes:v}))} placeholder="Notes..." style={{marginBottom:8}}/>
          <Btn onClick={add} active color={C.green}>Add Contact</Btn>
        </Card>
      )}
      <Input value={search} onChange={setSearch} placeholder="Search contacts..." style={{marginBottom:14}}/>
      {filtered.slice(0,15).map(c=>{
        const overdue=c.followUp&&c.followUp<=today();const isExp=expanded===c.id;
        return (
          <Card key={c.id} style={{padding:14,marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setExpanded(isExp?null:c.id)}>
              <div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontFamily:fonts.sans,fontSize:14,fontWeight:600,color:C.text}}>{c.name}</span>{c.company&&<Badge color={C.blue}>{c.company}</Badge>}{overdue&&<Badge color={C.accent}>Follow up!</Badge>}</div>{c.role&&<div style={{fontFamily:fonts.sans,fontSize:11,color:C.textDim}}>{c.role}</div>}</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,color:C.textDim}}>{isExp?"▲":"▼"}</span><button onClick={e=>{e.stopPropagation();remove(c.id);}} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10}}>✕</button></div>
            </div>
            {isExp&&(
              <div style={{marginTop:10,paddingLeft:8}}>
                {c.notes&&<div style={{fontFamily:fonts.sans,fontSize:12,color:C.textMuted,marginBottom:8}}>{c.notes}</div>}
                <div style={{display:"flex",gap:6,marginBottom:8}}><Input value={intNote} onChange={setIntNote} placeholder="Log interaction..." style={{flex:1}}/><Btn onClick={()=>addInteraction(c.id)} active color={C.blue}>Log</Btn></div>
                {(c.interactions||[]).slice(0,5).map((int,i)=><div key={i} style={{fontFamily:fonts.sans,fontSize:11,color:C.textDim,padding:"3px 0"}}><span style={{fontFamily:fonts.mono,fontSize:10,color:C.textDim,marginRight:6}}>{int.date}</span>{int.note}</div>)}
              </div>
            )}
          </Card>
        );
      })}
      {filtered.length===0&&<div style={{color:C.textDim,fontSize:13,padding:"12px 0"}}>{search?"No matches.":"No contacts yet."}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROJECT TRACKER
// ═══════════════════════════════════════════════════════════════
function ProjectsPage() {
  const [projects, setProjects] = useStore(SK.projects, []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({name:"",description:"",deadline:""});
  const [expanded, setExpanded] = useState(null);
  const [newMs, setNewMs] = useState("");

  const statusCfg = {planning:{label:"Planning",color:C.purple},active:{label:"Active",color:C.blue},review:{label:"Review",color:C.accent},done:{label:"Done",color:C.green},paused:{label:"Paused",color:C.textDim}};

  const add = () => {if(!form.name.trim())return;setProjects(p=>[{id:uid(),name:form.name.trim(),description:form.description.trim(),deadline:form.deadline,status:"planning",milestones:[],created:today()},...p]);setForm({name:"",description:"",deadline:""});setAdding(false);};
  const updateStatus = (id,s) => setProjects(p=>p.map(pr=>pr.id===id?{...pr,status:s}:pr));
  const addMilestone = (projId) => {if(!newMs.trim())return;setProjects(p=>p.map(pr=>pr.id===projId?{...pr,milestones:[...pr.milestones,{id:uid(),text:newMs.trim(),done:false}]}:pr));setNewMs("");};
  const toggleMs = (projId,msId) => setProjects(p=>p.map(pr=>pr.id===projId?{...pr,milestones:pr.milestones.map(m=>m.id===msId?{...m,done:!m.done}:m)}:pr));
  const remove = (id) => setProjects(p=>p.filter(pr=>pr.id!==id));

  const activeP = projects.filter(p=>p.status!=="done");

  return (
    <div>
      <SectionHead icon="📂" title="Projects" count={`${activeP.length} active`} quote='"A goal without a plan is just a wish."' action={<Btn onClick={()=>setAdding(!adding)} active={adding} color={C.green}>+ New Project</Btn>}/>
      {adding&&(
        <Card style={{marginBottom:16,padding:16}}>
          <Input value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="Project name..." style={{marginBottom:8}}/>
          <Input value={form.description} onChange={v=>setForm(p=>({...p,description:v}))} placeholder="Brief description..." style={{marginBottom:8}}/>
          <div style={{display:"flex",gap:8}}><input type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:fonts.mono,fontSize:12,padding:"6px 10px",outline:"none"}}/><Btn onClick={add} active color={C.green}>Create</Btn></div>
        </Card>
      )}
      {projects.slice(0,12).map(project=>{
        const cfg=statusCfg[project.status]||statusCfg.planning;const isExp=expanded===project.id;
        const doneMilestones=project.milestones.filter(m=>m.done).length;const totalMs=project.milestones.length;
        return (
          <Card key={project.id} style={{padding:14,marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setExpanded(isExp?null:project.id)}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontFamily:fonts.sans,fontSize:14,fontWeight:600,color:project.status==="done"?C.textDim:C.text}}>{project.name}</span><Badge color={cfg.color}>{cfg.label}</Badge>{totalMs>0&&<span style={{fontFamily:fonts.mono,fontSize:10,color:C.textDim}}>{doneMilestones}/{totalMs}</span>}</div>
                {totalMs>0&&<ProgressBar value={doneMilestones} max={totalMs} color={cfg.color} height={4}/>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:12}}>{project.deadline&&<span style={{fontFamily:fonts.mono,fontSize:10,color:C.textDim}}>{project.deadline}</span>}<span style={{fontSize:10,color:C.textDim}}>{isExp?"▲":"▼"}</span></div>
            </div>
            {isExp&&(
              <div style={{marginTop:10}}>
                {project.description&&<div style={{fontFamily:fonts.sans,fontSize:12,color:C.textMuted,marginBottom:10}}>{project.description}</div>}
                <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>{Object.entries(statusCfg).map(([k,sc])=><Btn key={k} onClick={()=>updateStatus(project.id,k)} active={project.status===k} color={sc.color}>{sc.label}</Btn>)}<button onClick={()=>remove(project.id)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10,marginLeft:8}}>Delete</button></div>
                {project.milestones.map(ms=>(
                  <div key={ms.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0"}}>
                    <button onClick={()=>toggleMs(project.id,ms.id)} style={{width:18,height:18,borderRadius:4,border:ms.done?"none":`1.5px solid ${C.border}`,background:ms.done?cfg.color:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,flexShrink:0}}>{ms.done?"✓":""}</button>
                    <span style={{fontFamily:fonts.sans,fontSize:12,color:ms.done?C.textDim:C.text,textDecoration:ms.done?"line-through":"none"}}>{ms.text}</span>
                  </div>
                ))}
                <div style={{display:"flex",gap:6,marginTop:6}}><Input value={newMs} onChange={setNewMs} placeholder="Add milestone..." style={{flex:1}}/><Btn onClick={()=>addMilestone(project.id)} color={cfg.color}>+</Btn></div>
              </div>
            )}
          </Card>
        );
      })}
      {projects.length===0&&<div style={{color:C.textDim,fontSize:13,padding:"12px 0"}}>No projects yet.</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// IDEAS BACKLOG
// ═══════════════════════════════════════════════════════════════
function IdeasPage() {
  const [ideas, setIdeas] = useStore(SK.ideas, []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({text:"",category:""});

  const cats = [{label:"Business",color:C.green},{label:"Side Project",color:C.blue},{label:"Content",color:C.purple},{label:"Improvement",color:C.accent},{label:"Other",color:C.textMuted}];

  const add = () => {if(!form.text.trim())return;setIdeas(p=>[{id:uid(),text:form.text.trim(),category:form.category||"Other",date:today(),starred:false},...p]);setForm({text:"",category:""});setAdding(false);};
  const toggleStar = (id) => setIdeas(p=>p.map(i=>i.id===id?{...i,starred:!i.starred}:i));
  const remove = (id) => setIdeas(p=>p.filter(i=>i.id!==id));

  const sorted = [...ideas].sort((a,b)=>(b.starred?1:0)-(a.starred?1:0));
  const catColor = (c) => (cats.find(x=>x.label===c)||cats[4]).color;

  return (
    <div>
      <SectionHead icon="💡" title="Ideas Backlog" count={ideas.length} quote='"Ideas are the beginning of all achievement."' action={<Btn onClick={()=>setAdding(!adding)} active={adding} color={C.accent}>+ Capture Idea</Btn>}/>
      {adding&&(
        <Card style={{marginBottom:16,padding:16}}>
          <Input value={form.text} onChange={v=>setForm(p=>({...p,text:v}))} placeholder="Capture your idea..." style={{marginBottom:8}}/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{cats.map(c=><Btn key={c.label} onClick={()=>setForm(p=>({...p,category:c.label}))} active={form.category===c.label} color={c.color}>{c.label}</Btn>)}<div style={{flex:1}}/><Btn onClick={add} active color={C.green}>Save</Btn></div>
        </Card>
      )}
      {sorted.slice(0,20).map(idea=>(
        <Card key={idea.id} style={{padding:12,marginBottom:6}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>toggleStar(idea.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:idea.starred?C.accent:C.textDim,flexShrink:0}}>{idea.starred?"★":"☆"}</button>
            <span style={{fontFamily:fonts.sans,fontSize:13,color:C.text,flex:1}}>{idea.text}</span>
            <Badge color={catColor(idea.category)}>{idea.category}</Badge>
            <span style={{fontFamily:fonts.mono,fontSize:10,color:C.textDim}}>{idea.date}</span>
            <button onClick={()=>remove(idea.id)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10}}>✕</button>
          </div>
        </Card>
      ))}
      {ideas.length===0&&<div style={{color:C.textDim,fontSize:13,padding:"12px 0"}}>No ideas yet. The best ones come when you least expect them.</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WEEKLY REVIEW
// ═══════════════════════════════════════════════════════════════
function WeeklyReviewPage() {
  const [reviews, setReviews] = useStore(SK.weeklyReview, []);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({wins:"",lessons:"",focus:"",rating:3});

  const currentWeek = `${new Date().getFullYear()}-W${String(weekNum(today())).padStart(2,"0")}`;
  const existing = reviews.find(r=>r.week===currentWeek);
  const rLabels = ["","Rough","Below avg","Solid","Good","Excellent"];
  const rColors = ["",C.red,C.red,C.accent,C.green,C.green];

  const save = () => {if(!form.wins.trim()&&!form.lessons.trim()&&!form.focus.trim())return;setReviews(p=>{const f=p.filter(r=>r.week!==currentWeek);return [{id:uid(),week:currentWeek,date:today(),wins:form.wins.trim(),lessons:form.lessons.trim(),focus:form.focus.trim(),rating:form.rating},...f];});setEditing(false);};
  const startEdit = () => {if(existing)setForm({wins:existing.wins,lessons:existing.lessons,focus:existing.focus,rating:existing.rating});else setForm({wins:"",lessons:"",focus:"",rating:3});setEditing(true);};

  return (
    <div>
      <SectionHead icon="📋" title="Weekly Review" count={currentWeek} quote='"Without reflection, we go blindly on our way."' action={!editing&&<Btn onClick={startEdit} active color={C.accent}>{existing?"Edit":"Write Review"}</Btn>}/>
      {editing?(
        <Card style={{padding:16}}>
          <div style={{marginBottom:12}}>
            <div style={{fontFamily:fonts.sans,fontSize:11,color:C.textMuted,marginBottom:6}}>How was your week?</div>
            <div style={{display:"flex",gap:6}}>{[1,2,3,4,5].map(r=><Btn key={r} onClick={()=>setForm(p=>({...p,rating:r}))} active={form.rating===r} color={rColors[r]}>{rLabels[r]}</Btn>)}</div>
          </div>
          {[{k:"wins",l:"Wins & accomplishments",p:"What went well?",i:"🏆"},{k:"lessons",l:"Lessons learned",p:"What would you do differently?",i:"💡"},{k:"focus",l:"Next week's focus",p:"Top priorities?",i:"🎯"}].map(f=>(
            <div key={f.k} style={{marginBottom:12}}>
              <div style={{fontFamily:fonts.sans,fontSize:11,color:C.textMuted,marginBottom:6}}>{f.i} {f.l}</div>
              <TextArea value={form[f.k]} onChange={v=>setForm(p=>({...p,[f.k]:v}))} placeholder={f.p}/>
            </div>
          ))}
          <div style={{display:"flex",gap:8}}><Btn onClick={save} active color={C.green}>Save Review</Btn><Btn onClick={()=>setEditing(false)}>Cancel</Btn></div>
        </Card>
      ):existing?(
        <Card style={{padding:16,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><Badge color={rColors[existing.rating]}>{rLabels[existing.rating]} week</Badge><span style={{fontFamily:fonts.mono,fontSize:10,color:C.textDim}}>{existing.date}</span></div>
          {[{l:"Wins",i:"🏆",t:existing.wins},{l:"Lessons",i:"💡",t:existing.lessons},{l:"Next Focus",i:"🎯",t:existing.focus}].filter(f=>f.t).map(f=>(
            <div key={f.l} style={{marginBottom:12}}><div style={{fontFamily:fonts.sans,fontSize:11,color:C.textMuted,marginBottom:4}}>{f.i} {f.l}</div><p style={{fontFamily:fonts.sans,fontSize:13,color:C.text,margin:0,lineHeight:1.6}}>{f.t}</p></div>
          ))}
        </Card>
      ):<div style={{color:C.textDim,fontSize:13,padding:"12px 0",marginBottom:16}}>No review for this week yet. Take a few minutes to reflect.</div>}
      {reviews.filter(r=>r.week!==currentWeek).length>0&&(
        <Card style={{padding:16}}>
          <div style={{fontFamily:fonts.sans,fontSize:11,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Past Reviews</div>
          {reviews.filter(r=>r.week!==currentWeek).slice(0,8).map(r=>(
            <div key={r.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontFamily:fonts.mono,fontSize:11,color:C.textMuted}}>{r.week}</span><Badge color={rColors[r.rating]}>{rLabels[r.rating]}</Badge></div>
              <span style={{fontFamily:fonts.sans,fontSize:12,color:C.textDim,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.wins||r.focus||"—"}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GOALS
// ═══════════════════════════════════════════════════════════════
function GoalsPage() {
  const [goals, setGoals] = useStore(SK.goals, []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({text:"",deadline:"",category:""});

  const cats = [{label:"Health",color:C.green},{label:"Career",color:C.blue},{label:"Financial",color:C.accent},{label:"Personal",color:C.purple},{label:"Learning",color:C.red}];

  const add = () => {if(!form.text.trim())return;setGoals(p=>[...p,{id:uid(),text:form.text.trim(),deadline:form.deadline,category:form.category||"Personal",done:false,created:today()}]);setForm({text:"",deadline:"",category:""});setAdding(false);};
  const toggle = (id) => setGoals(p=>p.map(g=>g.id===id?{...g,done:!g.done,completedDate:!g.done?today():undefined}:g));
  const remove = (id) => setGoals(p=>p.filter(g=>g.id!==id));

  const active = goals.filter(g=>!g.done);
  const completed = goals.filter(g=>g.done);
  const catColor = (c) => (cats.find(x=>x.label===c)||cats[3]).color;

  return (
    <div>
      <SectionHead icon="🎯" title="Goals & Targets" count={`${completed.length}/${goals.length} complete`} quote='"A goal properly set is halfway reached."' action={<Btn onClick={()=>setAdding(!adding)} active={adding} color={C.green}>+ Add Goal</Btn>}/>
      {adding&&(
        <Card style={{marginBottom:16,padding:16}}>
          <Input value={form.text} onChange={v=>setForm(p=>({...p,text:v}))} placeholder="Goal..." style={{marginBottom:8}}/>
          <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
            <input type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:fonts.mono,fontSize:12,padding:"6px 10px",outline:"none"}}/>
            {cats.map(c=><Btn key={c.label} onClick={()=>setForm(p=>({...p,category:c.label}))} active={form.category===c.label} color={c.color}>{c.label}</Btn>)}
          </div>
          <Btn onClick={add} active color={C.green}>Add Goal</Btn>
        </Card>
      )}
      {active.length>0&&<div style={{fontFamily:fonts.sans,fontSize:11,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Active ({active.length})</div>}
      {active.map(g=>(
        <Card key={g.id} style={{padding:12,marginBottom:6}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>toggle(g.id)} style={{width:24,height:24,borderRadius:6,border:`1.5px solid ${C.border}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,flexShrink:0}}/>
            <span style={{fontFamily:fonts.sans,fontSize:14,color:C.text,flex:1}}>{g.text}</span>
            <Badge color={catColor(g.category)}>{g.category}</Badge>
            {g.deadline&&<span style={{fontFamily:fonts.mono,fontSize:10,color:g.deadline<today()?C.red:C.textDim}}>{g.deadline}</span>}
            <button onClick={()=>remove(g.id)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10}}>✕</button>
          </div>
        </Card>
      ))}
      {completed.length>0&&<div style={{fontFamily:fonts.sans,fontSize:11,color:C.green,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginTop:16,marginBottom:8}}>Completed ({completed.length})</div>}
      {completed.map(g=>(
        <Card key={g.id} style={{padding:12,marginBottom:6}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>toggle(g.id)} style={{width:24,height:24,borderRadius:6,border:"none",background:C.green,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,flexShrink:0}}>✓</button>
            <span style={{fontFamily:fonts.sans,fontSize:14,color:C.textDim,flex:1,textDecoration:"line-through"}}>{g.text}</span>
            <Badge color={catColor(g.category)}>{g.category}</Badge>
            <button onClick={()=>remove(g.id)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10}}>✕</button>
          </div>
        </Card>
      ))}
      {goals.length===0&&<div style={{color:C.textDim,fontSize:13,padding:"12px 0"}}>No goals set yet. Dream big.</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD (overview)
// ═══════════════════════════════════════════════════════════════
function DashboardPage() {
  const [habits] = useStore(SK.habits, DEFAULT_HABITS);
  const [bizHabits] = useStore(SK.businessHabits, DEFAULT_BIZ);
  const [tasks] = useStore(SK.tasks, []);
  const todayStr = today();
  const cats = (habits && habits.categories) ? habits.categories : DEFAULT_HABITS.categories;
  const allH = cats.flatMap(c=>c.habits||[]).filter(h=>!h.isCounter);
  const hDone = allH.filter(h=>h.log && h.log[todayStr]).length;
  const hPct = allH.length>0?Math.round(hDone/allH.length*100):0;
  const bh = Array.isArray(bizHabits) ? bizHabits : DEFAULT_BIZ;
  const bDone = bh.filter(h=>h.log && h.log[todayStr]).length;
  const bPct = bh.length>0?Math.round(bDone/bh.length*100):0;
  const taskArr = (Array.isArray(tasks) ? tasks : []).map(normalizeTask);
  const openTasks = taskArr.filter(t=>!t.done).length;
  const priorityTasks = taskArr.filter(t=>!t.done && (t.priority==="urgent" || t.due===todayStr)).slice(0,4);
  const bestStreak = allH.reduce((best,h)=>{if(!h.log)return best;let s=0;for(let i=0;i<60;i++){const d=new Date();d.setDate(d.getDate()-i);if(h.log[d.toISOString().split("T")[0]])s++;else break;}return Math.max(best,s);},0);

  const now = new Date();
  const greeting = now.getHours()<12?"Good morning":now.getHours()<18?"Good afternoon":"Good evening";
  const dateStr = now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  const timeStr = now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:false});

  return (
    <div>
      <div style={{marginBottom:24}}>
        <h1 style={{fontFamily:fonts.serif,fontSize:36,fontWeight:300,color:C.text,margin:0,fontStyle:"italic"}}>{greeting}</h1>
        <div style={{fontFamily:fonts.sans,fontSize:13,color:C.textDim,marginTop:4}}>Time Will Tell.</div>
        <div style={{borderLeft:`3px solid ${C.accent}`,paddingLeft:12,marginTop:10,fontFamily:fonts.sans,fontSize:13,fontStyle:"italic",color:C.textMuted}}>Get out of your head and into your heart. (Flow State)</div>
      </div>

      <div className="dash-stats" style={{marginBottom:24}}>
        <StatCard label="Today's Habits" value={`${hPct}%`} color={hPct>=80?C.green:hPct>0?C.accent:C.red}/>
        <StatCard label="Road to Riches" value={`${bPct}%`} color={bPct>=80?C.green:bPct>0?C.accent:C.red}/>
        <StatCard label="Open Tasks" value={openTasks} color={C.blue}/>
        <StatCard label="Day Streak" value={bestStreak} color={C.accent} suffix="🔥"/>
      </div>

      <div className="dash-grid-3" style={{gap:16}}>
        {/* Personal Habits summary */}
        <Card style={{padding:16}}>
          <div style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>⏰ Personal Habits <span style={{float:"right"}}>{hDone}/{allH.length}</span></div>
          {cats.slice(0,3).map(cat=>(
            <div key={cat.name} style={{marginBottom:8}}>
              <div style={{fontFamily:fonts.sans,fontSize:10,fontWeight:600,color:C.accent,textTransform:"uppercase",marginBottom:4}}>{cat.icon} {cat.name}</div>
              {(cat.habits||[]).slice(0,3).map(h=>(
                <div key={h.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0"}}>
                  <div style={{width:16,height:16,borderRadius:4,border:h.log[todayStr]?"none":`1px solid ${C.border}`,background:h.log[todayStr]?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff"}}>{h.log[todayStr]?"✓":""}</div>
                  <span style={{fontFamily:fonts.sans,fontSize:12,color:h.log[todayStr]?C.textDim:C.text}}>{h.name}</span>
                </div>
              ))}
            </div>
          ))}
        </Card>

        {/* Business habits summary */}
        <Card style={{padding:16}}>
          <div style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>💎 Road to Riches <span style={{float:"right"}}>{bDone}/{bh.length}</span></div>
          {bh.map(h=>(
            <div key={h.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0"}}>
              <div style={{width:16,height:16,borderRadius:4,border:h.log[todayStr]?"none":`1px solid ${C.border}`,background:h.log[todayStr]?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff"}}>{h.log[todayStr]?"✓":""}</div>
              <span style={{fontFamily:fonts.sans,fontSize:12,color:h.log[todayStr]?C.textDim:C.text}}>{h.name}</span>
            </div>
          ))}
        </Card>

        {/* Top Priority */}
        <Card style={{padding:16}}>
          <div style={{fontFamily:fonts.sans,fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>⭐ Top Priority Today</div>
          {priorityTasks.length===0?<div style={{color:C.textDim,fontSize:13}}>Nothing urgent or due today. 🎉</div>:priorityTasks.map(t=><div key={t.id} style={{padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontFamily:fonts.sans,fontSize:13,color:C.text,display:"flex",alignItems:"center",gap:8}}><span style={{width:8,height:8,borderRadius:"50%",background:PRI_COLOR[t.priority],flexShrink:0}}/>{t.title}</div>)}
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR + MAIN LAYOUT
// ═══════════════════════════════════════════════════════════════
const NAV = [
  { section: "WORKSPACE", items: [{ id: "dashboard", label: "Dashboard", icon: "⏱" }] },
  { section: "HABITS", items: [
    { id: "habits", label: "Road to Success", icon: "🏆" },
    { id: "bizHabits", label: "Road to Riches", icon: "💎" },
  ]},
  { section: "OPERATIONS", items: [
    { id: "tasks", label: "Tasks", icon: "📋" },
    { id: "finance", label: "Finance", icon: "💰" },
    { id: "fitness", label: "Fitness", icon: "💪" },
    { id: "success", label: "Success Tracking", icon: "📈" },
    { id: "skills", label: "Skill Acquisition", icon: "🏅" },
    { id: "goals", label: "Goals & Targets", icon: "🎯" },
  ]},
  { section: "CAREER", items: [
    { id: "careerJournal", label: "Career Journal", icon: "💼" },
    { id: "people", label: "People Notes", icon: "👥" },
    { id: "networking", label: "Networking", icon: "🤝" },
    { id: "projects", label: "Projects", icon: "📂" },
    { id: "ideas", label: "Ideas Backlog", icon: "💡" },
  ]},
  { section: "LIFESTYLE", items: [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "car", label: "Car", icon: "🚗" },
    { id: "journal", label: "Journal", icon: "📝" },
    { id: "weeklyReview", label: "Weekly Review", icon: "📋" },
  ]},
];

function Dashboard() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useContext(AuthContext);
  const now = new Date();
  const timeStr = now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:false});
  const dateStr = `${["SUN","MON","TUE","WED","THU","FRI","SAT"][now.getDay()]} · ${now.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}).toUpperCase()}`;

  const pages = {
    dashboard: <DashboardPage/>, habits: <HabitsPage/>, bizHabits: <BizHabitsPage/>,
    finance: <FinancePage/>, fitness: <FitnessPage/>, tasks: <TasksPage/>,
    success: <SuccessPage/>, skills: <SkillsPage/>, home: <HomePage/>,
    car: <CarPage/>, journal: <JournalPage/>, people: <PeoplePage/>,
    careerJournal: <CareerJournalPage/>, networking: <NetworkingPage/>,
    projects: <ProjectsPage/>, ideas: <IdeasPage/>, weeklyReview: <WeeklyReviewPage/>,
    goals: <GoalsPage/>,
  };

  const navigate = (id) => { setPage(id); setSidebarOpen(false); };

  // Inject responsive CSS once
  useEffect(() => {
    const id = "responsive-css";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .dash-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .dash-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
      .dash-stats { display: flex; gap: 12px; flex-wrap: wrap; }
      .dash-stats > * { flex: 1; min-width: 100px; }
      .dash-kanban { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; overflow-x: auto; }
      .dash-mobile-header { display: none; }
      .dash-overlay { display: none; }
      .dash-sidebar-mobile { display: none; }
      .dash-sidebar-close { display: none !important; }
      @media (max-width: 768px) {
        .dash-grid-2 { grid-template-columns: 1fr !important; }
        .dash-grid-3 { grid-template-columns: 1fr !important; }
        .dash-kanban { grid-template-columns: repeat(2, minmax(140px, 1fr)) !important; overflow-x: auto; }
        .dash-sidebar-desktop { display: none !important; }
        .dash-sidebar-mobile {
          position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
          transform: translateX(-100%); transition: transform 0.3s ease;
          width: 280px; display: flex; flex-direction: column;
        }
        .dash-sidebar-mobile.open { transform: translateX(0); }
        .dash-mobile-header {
          display: flex !important; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid ${C.border};
        }
        .dash-overlay.open {
          display: block !important; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6); z-index: 99;
        }
        .dash-sidebar-close { display: block !important; }
        .dash-main-content { padding: 16px !important; }
        .dash-stats { gap: 8px; }
        .dash-stats > * { min-width: 70px; }
      }
      @media (max-width: 480px) {
        .dash-kanban { grid-template-columns: 1fr !important; }
        .dash-main-content { padding: 12px !important; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const sidebarContent = (
    <>
      <div style={{padding:"20px 16px 8px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontFamily:fonts.serif,fontSize:20,fontWeight:700,color:C.text}}>Hamza</div>
          <div style={{fontFamily:fonts.sans,fontSize:11,color:C.textDim}}>Time Will Tell</div>
        </div>
        <button className="dash-sidebar-close" onClick={()=>setSidebarOpen(false)} style={{background:"none",border:"none",color:C.textMuted,fontSize:20,cursor:"pointer"}}>✕</button>
      </div>
      <div style={{padding:"4px 16px 16px"}}>
        <div style={{fontFamily:fonts.mono,fontSize:24,fontWeight:500,color:C.text}}>{timeStr}</div>
        <div style={{fontFamily:fonts.mono,fontSize:10,color:C.textDim,letterSpacing:1}}>{dateStr}</div>
      </div>
      {NAV.map(section=>(
        <div key={section.section} style={{marginBottom:4}}>
          <div style={{padding:"8px 16px 4px",fontFamily:fonts.sans,fontSize:10,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2}}>{section.section}</div>
          {section.items.map(item=>(
            <button key={item.id} onClick={()=>navigate(item.id)} style={{
              display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 16px",border:"none",
              background:page===item.id?C.accentSoft:"transparent",
              color:page===item.id?C.accent:C.textMuted,
              fontFamily:fonts.sans,fontSize:14,fontWeight:page===item.id?600:400,
              cursor:"pointer",transition:"all .15s",textAlign:"left",borderLeft:page===item.id?`3px solid ${C.accent}`:"3px solid transparent",
            }} onMouseEnter={e=>{if(page!==item.id)e.currentTarget.style.background=C.sidebarHover;}} onMouseLeave={e=>{if(page!==item.id)e.currentTarget.style.background="transparent";}}>
              <span style={{fontSize:16}}>{item.icon}</span>
              <span style={{flex:1}}>{item.label}</span>
            </button>
          ))}
        </div>
      ))}
      <div style={{flex:1}}/>
      <div style={{padding:16}}>
        <div onClick={signOut} style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontFamily:fonts.sans,fontSize:11,color:C.red,cursor:"pointer",textAlign:"center"}}>Sign Out</div>
      </div>
    </>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:fonts.sans}}>
      {/* Mobile header - only shows on mobile */}
      <div className="dash-mobile-header" style={{display:"none",background:C.sidebar}}>
        <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:`1px solid ${C.border}`,color:C.text,fontSize:20,cursor:"pointer",padding:"6px 10px",borderRadius:8}}>☰</button>
        <div style={{fontFamily:fonts.serif,fontSize:18,fontWeight:700,color:C.text}}>Hamza</div>
        <div style={{fontFamily:fonts.mono,fontSize:12,color:C.textDim}}>{timeStr}</div>
      </div>

      {/* Mobile overlay */}
      <div className={`dash-overlay ${sidebarOpen?"open":""}`} onClick={()=>setSidebarOpen(false)} />

      {/* Mobile sidebar drawer */}
      <div className={`dash-sidebar-mobile ${sidebarOpen?"open":""}`} style={{background:C.sidebar,borderRight:`1px solid ${C.border}`,overflowY:"auto",zIndex:100}}>
        {sidebarContent}
      </div>

      <div style={{display:"flex"}}>
        {/* Desktop sidebar - hidden on mobile via CSS */}
        <aside className="dash-sidebar-desktop" style={{width:220,minWidth:220,background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto",height:"100vh",position:"sticky",top:0}}>
          {sidebarContent}
        </aside>

        {/* Main */}
        <main style={{flex:1,minWidth:0,position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:200,background:`radial-gradient(ellipse at 70% 0%, ${C.accentSoft} 0%, transparent 50%)`,pointerEvents:"none",zIndex:0}}/>
          <div className="dash-main-content" style={{position:"relative",zIndex:1,padding:"32px 40px 80px",maxWidth:1600}}>
            {pages[page] || <DashboardPage/>}
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Wrapped App with Auth ─────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}
