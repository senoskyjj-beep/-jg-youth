const { useState, useEffect } = React;

var GOOGLE_URL = "https://script.google.com/macros/s/AKfycbyYg7kuH2DVSKsFL555ERLMrUgVIh8yYEPmJ8_MwjDu788AgNH2mbpK6T7jecjoAXxd/exec";
var ADMIN_PIN  = "91977";
var ADMIN_PIN2 = "91976";
var WA_GROUP   = "https://chat.whatsapp.com/EfcayPaEFQd2tA7PukASuK?mode=gi_t";
var SYNC_TOKEN = "JG2026LiveWaters";

function msgVisitor(name) {
  return "Hi " + name + "! \u2764\ufe0f\n\nThank you so much for visiting Jeremiah Generation - Living Waters Fellowship. We truly loved having you and hope you felt welcome!\n\nYou are special. God has a great plan for your life.\n\nJeremiah 29:11 - For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.\n\nWe hope to see you again this Friday! God bless you! \ud83d\ude4f\nJG Youth - Living Waters Fellowship";
}
function msgAbsent(name) {
  return "Hi " + name + "! \u2764\ufe0f\n\nWe noticed you have not been with us recently at Jeremiah Generation and we truly miss you!\n\nYou are loved, valued, and we care about you deeply as brothers and sisters in Christ.\n\nPsalm 139:14 - You are fearfully and wonderfully made. Wonderful are God's works.\n\nIf there is anything we can do, or if you need someone to talk to, please do not hesitate to reach out. You are always welcome.\n\nWe hope to see you this Friday! God bless you! \ud83d\ude4f\nJG Youth - Living Waters Fellowship";
}
function msgParentAbsent(youthName, parentName) {
  return "Hi " + (parentName||"Parent") + ",\n\nThis is Jeremiah Generation Youth at Living Waters Fellowship.\n\nWe have noticed that " + youthName + " has not been with us for the past few sessions and we are genuinely concerned.\n\nWe care deeply about each young person and their wellbeing. If there is anything we can do to help, or any reason " + youthName + " has not been attending, please feel free to reach out. We are here to support your family.\n\nProverbs 22:6 - Train up a child in the way he should go; even when he is old he will not depart from it.\n\nWe would love to welcome " + youthName + " back. God bless your family! \ud83d\ude4f\nEmily Bilali - JG Youth Leader\nLiving Waters Fellowship";
}

var SCHOOLS = [
  "-- High Schools --","Batlhalerwa High School","Diammona Secondary","Dimpe Secondary",
  "Dinoko Secondary","Hoerskool Ellisras","Kings College","Lephalale High School",
  "Matshwara Secondary","Mmay Secondary","Mokonenkwenoko Secondary","Morakolo Secondary","Raboditse Secondary",
  "-- Primary Schools --","Bakgalaka Primary","Bangalong Primary","Bilton Primary",
  "Bosveld Primary","Botshelong Primary","Hooikraal Primary","Ikitseng Primary",
  "Jacob Langa Lower Primary","Mmera Primary","Moabi Primary","Mocheko Primary",
  "Morukhurukhung Primary","Mosima Primary","Motoma Primary","Mpepule Primary",
  "Nku Primary","Olifantsdrift Primary","Vaalpenskraal Primary",
  "-- Other --","EHS","MSTS","UCTOHS","Marlothii","Laerskool","Online","Other (not listed)"
];


var LS_KEY = "jg_v6";

function loadData() {
  try {
    var r = localStorage.getItem(LS_KEY);
    if (r) { var d=JSON.parse(r); d.members=d.members||[]; d.checkins=d.checkins||[]; d.feedback=d.feedback||[]; d.events=d.events||[]; return d; }
  } catch(e) {}
  return {members:[],checkins:[],feedback:[],events:[]};
}

function saveData(d) {
  try {
    var slim = {
      members: (d.members||[]).map(function(m){ return Object.assign({},m,{photo:m.photo?"HAS_PHOTO":null}); }),
      checkins: d.checkins||[], feedback: d.feedback||[], events: d.events||[]
    };
    localStorage.setItem(LS_KEY, JSON.stringify(slim));
    (d.members||[]).forEach(function(m){ if(m.photo&&m.photo!=="HAS_PHOTO"&&m.id){ try{localStorage.setItem("ph_"+m.id,m.photo);}catch(e){} } });
  } catch(e) { console.log("Save err:",e); }
}

function withPhotos(d) {
  return Object.assign({},d,{members:(d.members||[]).map(function(m){
    if(m.photo==="HAS_PHOTO"&&m.id){ var p=localStorage.getItem("ph_"+m.id); return Object.assign({},m,{photo:p||null}); }
    return m;
  })});
}

// Local date string YYYY-MM-DD (avoids UTC timezone shift in South Africa)
function dateToLocal(d){
  var y=d.getFullYear();
  var m=String(d.getMonth()+1).padStart(2,"0");
  var dd=String(d.getDate()).padStart(2,"0");
  return y+"-"+m+"-"+dd;
}

function todayStr(){ return dateToLocal(new Date()); }

// Find most recent Friday (or today if Friday)
function lastFriday(){
  var d=new Date();
  var day=d.getDay(); // 0=Sun, 5=Fri
  var diff=(day>=5?day-5:day+2);
  d.setDate(d.getDate()-diff);
  d.setHours(0,0,0,0);
  return d;
}
function lastFridayStr(){ return dateToLocal(lastFriday()); }

// Get the active event date - TODAY if today is Friday or has an event, else last Friday
function getActiveEventDate(events){
  var today=todayStr();
  var todayDayOfWeek=new Date().getDay();
  // If today is Friday, use today
  if(todayDayOfWeek===5)return today;
  // If there's an event today, use today
  if(events&&events.length>0){
    var todayEvent=events.find(function(e){return e.date===today;});
    if(todayEvent)return today;
    // Check if there's an event this week (since last Friday)
    var lastFri=lastFriday();
    var recent=events.filter(function(e){
      var ed=new Date(e.date+"T00:00:00");
      var now=new Date(); now.setHours(23,59,59,999);
      return ed>=lastFri&&ed<=now;
    }).sort(function(a,b){return new Date(b.date)-new Date(a.date);});
    if(recent.length>0)return recent[0].date;
  }
  // Otherwise use last Friday
  return lastFridayStr();
}

// Check if a check-in is for this week (from last Friday onwards)
function isThisWeek(dateStr){
  if(!dateStr)return false;
  var d=new Date(dateStr+"T00:00:00");
  return d>=lastFriday();
}
function calcAge(dob){ if(!dob)return null; var b=new Date(dob),n=new Date(),a=n.getFullYear()-b.getFullYear(),mo=n.getMonth()-b.getMonth(); if(mo<0||(mo===0&&n.getDate()<b.getDate()))a--; return a; }
function toWA(num,msg){
  if(!num||String(num).trim()===""||String(num).trim()==="?"||String(num).trim()==="N/A")return null;
  var d=String(num).replace(/\D/g,"");
  if(d.length<9)return null;
  var i=d.startsWith("0")?"27"+d.slice(1):d.startsWith("27")?d:"27"+d;
  return "https://wa.me/"+i+(msg?"?text="+encodeURIComponent(msg):"");
}
function waLink(num,msg,label,style){
  var href=toWA(num,msg);
  if(!href)return null;
  return <a href={href} target="_blank" style={style}>{label}</a>;
}
function weeksAgo(dateStr){ if(!dateStr)return 999; return Math.floor((new Date()-new Date(dateStr))/(7*24*60*60*1000)); }
function sortAlpha(arr){ return (arr||[]).slice().sort(function(a,b){ var na=(a.name+" "+a.surname).toLowerCase(),nb=(b.name+" "+b.surname).toLowerCase(); return na<nb?-1:na>nb?1:0; }); }
function statusBadge(s){ if(s==="Member")return{bg:"#0d2818",col:"#86efac",bd:"#22c55e"}; if(s==="Returning Visitor")return{bg:"#1c1504",col:"#fcd34d",bd:"#f59e0b"}; return{bg:"#1a0a1e",col:"#e879f9",bd:"#a855f7"}; }
function computeStatus(m,checkins){ if(m.originalStatus==="Member")return "Member"; var v=(checkins||[]).filter(function(c){return c.memberId===m.id;}).length; return v>=3?"Member":v>=2?"Returning Visitor":"Visitor"; }
function visitCount(m,checkins){ return (checkins||[]).filter(function(c){return c.memberId===m.id;}).length; }
function lastCheckin(m,checkins){ var mc=(checkins||[]).filter(function(c){return c.memberId===m.id;}).map(function(c){return c.date;}).sort(); return mc[mc.length-1]||null; }
function pctColor(p){ return p>=75?"#22c55e":p>=50?"#f59e0b":"#ef4444"; }

// Track when a message has been sent to a person today
function markMessageSent(memberId,channel,category){
  var key="msg_"+memberId+"_"+todayStr();
  var existing=JSON.parse(localStorage.getItem(key)||"[]");
  if(!existing.find(function(m){return m.channel===channel&&m.category===category;})){
    existing.push({channel:channel,category:category,time:new Date().toLocaleTimeString()});
    localStorage.setItem(key,JSON.stringify(existing));
  }
  // Push to Google for the log
  syncGoogle({type:"MESSAGE_LOG",memberId:memberId,channel:channel,category:category,date:todayStr()});
  // Trigger UI refresh
  setTimeout(function(){window.dispatchEvent(new Event("jg-refresh"));},100);
}

function getMessagesSent(memberId){
  var key="msg_"+memberId+"_"+todayStr();
  return JSON.parse(localStorage.getItem(key)||"[]");
}

function wasMessagedToday(memberId,channel){
  var msgs=getMessagesSent(memberId);
  if(channel)return msgs.some(function(m){return m.channel===channel;});
  return msgs.length>0;
}

// SMS link helper
function toSMS(num,msg){
  if(!num||String(num).trim()===""||String(num).trim()==="?")return null;
  var d=String(num).replace(/\D/g,"");
  if(d.length<9)return null;
  var i=d.startsWith("0")?"+27"+d.slice(1):d.startsWith("27")?"+"+d:"+27"+d;
  // iOS uses sms:NUMBER&body= ; Android uses sms:NUMBER?body=
  // Universal format that works on both: sms://NUMBER/?body= 
  if(!msg)return "sms:"+i;
  // Detect iOS user agent for correct separator
  var isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
  var sep=isIOS?"&":"?";
  return "sms:"+i+sep+"body="+encodeURIComponent(msg);
}

async function syncGoogle(payload){
  if(!GOOGLE_URL||GOOGLE_URL.includes("PASTE"))return;
  try{
    var body=Object.assign({token:SYNC_TOKEN},payload);
    await fetch(GOOGLE_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body)});
  }catch(e){console.log("Sync:",e);}
}

// ── EXPORT HELPERS ──────────────────────────────────────────
function buildAllSheets(members,checkins,feedback){
  var dates=[...new Set((checkins||[]).map(function(c){return c.date;}))].sort();
  var today=new Date();
  var generated=today.toLocaleDateString("en-ZA",{year:"numeric",month:"long",day:"numeric"});

  // ── Sheet 1: Full Attendance ──
  var attHdr=["Name","Surname","Status","Age","Phone","School","Registered","Total Sessions","Sessions Attended","% Attendance","Weeks Since Last Visit","Last Session",...dates];
  var attRows=sortAlpha(members).map(function(m){
    var status=computeStatus(m,checkins);
    var cols=dates.map(function(d){return (checkins||[]).some(function(c){return c.memberId===m.id&&c.date===d;})?"YES":"";});
    var cnt=cols.filter(Boolean).length;
    var pct=dates.length?Math.round(cnt/dates.length*100):0;
    var lc=lastCheckin(m,checkins);
    var wks=lc?Math.floor((today-new Date(lc))/(7*24*60*60*1000)):999;
    return [m.name,m.surname,status,calcAge(m.birthday)||"",m.phone||"",m.school||"",m.registeredOn||"",dates.length,cnt,pct+"%",wks===999?"Never":wks+" wks",lc||"Never",...cols];
  });

  // ── Sheet 2: Visitors ──
  var visitors=members.filter(function(m){return m.originalStatus==="Visitor";});
  var visHdr=["Name","Surname","Phone","School","First Visit","Total Visits","Current Status","Converted to Member?"];
  var visRows=sortAlpha(visitors).map(function(m){
    var visits=visitCount(m,checkins);
    var status=computeStatus(m,checkins);
    var allDates=(checkins||[]).filter(function(c){return c.memberId===m.id;}).map(function(c){return c.date;}).sort();
    return [m.name,m.surname,m.phone||"",m.school||"",allDates[0]||"",visits,status,status==="Member"?"Yes":"No"];
  });

  // ── Sheet 3: Absenteeism ──
  var absHdr=["Name","Surname","Phone","Parent Phone","School","Total Sessions","Sessions Absent","% Absent","Weeks Since Last Visit","Alert Level"];
  var absRows=sortAlpha(members).map(function(m){
    var attended=(checkins||[]).filter(function(c){return c.memberId===m.id;}).length;
    var absent=dates.length-attended;
    var pctAbsent=dates.length?Math.round(absent/dates.length*100):0;
    var lc=lastCheckin(m,checkins);
    var wks=lc?Math.floor((today-new Date(lc))/(7*24*60*60*1000)):999;
    var alert=wks>=6?"CRITICAL":wks>=3?"WARNING":wks>=1?"MONITOR":"PRESENT";
    return [m.name,m.surname,m.phone||"",m.parentPhone||"",m.school||"",dates.length,absent,pctAbsent+"%",wks===999?"Never":wks+" wks",alert];
  }).sort(function(a,b){return parseInt(b[7])-parseInt(a[7]);});

  // ── Sheet 4: Weekly/Monthly Trends (Health Dashboard) ──
  var weeks={};
  dates.forEach(function(d){
    var dt=new Date(d),day=dt.getDay(),diff=dt.getDate()-day+(day===0?-6:1);
    var wk=new Date(dt.setDate(diff)).toISOString().slice(0,10);
    if(!weeks[wk])weeks[wk]={date:wk,sessions:0,checkins:0,visitors:0,newMembers:0};
    weeks[wk].sessions++;
    var dayCheckins=(checkins||[]).filter(function(c){return c.date===d;});
    weeks[wk].checkins+=dayCheckins.length;
    weeks[wk].visitors+=dayCheckins.filter(function(c){
      var m=members.find(function(mb){return mb.id===c.memberId;});
      return m&&m.originalStatus==="Visitor";
    }).length;
  });
  var trendHdr=["Week Of","Total Check-ins","Visitors","Attendance Rate","Trend"];
  var trendData=Object.values(weeks).sort(function(a,b){return a.date.localeCompare(b.date);});
  var trendRows=trendData.map(function(w,i){
    var rate=members.length?Math.round(w.checkins/members.length*100):0;
    var prev=i>0?Math.round(trendData[i-1].checkins/members.length*100):rate;
    var trend=rate>prev+5?"Improving":rate<prev-5?"Declining":"Stable";
    return [w.date,w.checkins,w.visitors,rate+"%",trend];
  });

  // ── Sheet 5: Health Summary ──
  var totalSessions=dates.length;
  var overallRate=members.length&&totalSessions?(checkins||[]).length/(members.length*totalSessions)*100:0;
  var criticalCount=members.filter(function(m){var lc=lastCheckin(m,checkins);return !lc||Math.floor((today-new Date(lc))/(7*24*60*60*1000))>=6;}).length;
  var warnCount=members.filter(function(m){var lc=lastCheckin(m,checkins);if(!lc)return false;var w=Math.floor((today-new Date(lc))/(7*24*60*60*1000));return w>=3&&w<6;}).length;
  var convertedVisitors=visitors.filter(function(m){return computeStatus(m,checkins)==="Member";}).length;
  var recentTrend=trendRows.length>=2?trendRows[trendRows.length-1][4]:"Insufficient data";
  var sumHdr=["Metric","Value","Benchmark","Status"];
  var sumRows=[
    ["Report Generated",generated,"",""],
    ["Total Youth Registered",members.length,"",""],
    ["Total Sessions Held",totalSessions,"",""],
    ["Overall Attendance Rate",Math.round(overallRate)+"%","70%+",overallRate>=70?"GOOD":overallRate>=50?"NEEDS ATTENTION":"CRITICAL"],
    ["Youth Absent 3+ Weeks",warnCount,"0",warnCount===0?"GOOD":warnCount<=3?"MONITOR":"ACTION NEEDED"],
    ["Youth Absent 6+ Weeks (Critical)",criticalCount,"0",criticalCount===0?"GOOD":"IMMEDIATE ACTION"],
    ["Total Visitors",visitors.length,"",""],
    ["Visitors Converted to Members",convertedVisitors,"",""],
    ["Visitor Conversion Rate",visitors.length?Math.round(convertedVisitors/visitors.length*100)+"%":"N/A","50%+",""],
    ["Recent Attendance Trend",recentTrend,"Improving",""],
    ["","","",""],
    ["FEEDBACK SUMMARY","","",""],
    ["Total Suggestions/Requests",(feedback||[]).length,"",""],
  ];
  var categories=["Games","Sports","Welcome","Prayer","Advice","Complaint","General"];
  categories.forEach(function(cat){
    var cnt=(feedback||[]).filter(function(f){return f.category===cat;}).length;
    sumRows.push(["  "+cat+" requests",cnt,"",""]);
  });

  // ── Sheet 6: Feedback/Comments ──
  var fbHdr=["Date","Category","From","Comment"];
  var fbRows=(feedback||[]).slice().reverse().map(function(f){
    return [f.date||"",f.category||"",f.name||"Anonymous",f.comment||""];
  });

  return {
    attendance:{hdr:attHdr,rows:attRows},
    visitors:{hdr:visHdr,rows:visRows},
    absenteeism:{hdr:absHdr,rows:absRows},
    trends:{hdr:trendHdr,rows:trendRows},
    summary:{hdr:sumHdr,rows:sumRows},
    feedback:{hdr:fbHdr,rows:fbRows},
  };
}

function styleSheet(ws,hdr,colorHex){
  // Bold + color header row
  for(var c=0;c<hdr.length;c++){
    var cell=XLSX.utils.encode_cell({r:0,c:c});
    if(!ws[cell])continue;
    ws[cell].s={fill:{patternType:"solid",fgColor:{rgb:colorHex}},font:{color:{rgb:"FFFFFF"},bold:true},alignment:{horizontal:"center"}};
  }
  return ws;
}

function exportXL(members,checkins,feedback){
  function run(){
    try{
      var sheets=buildAllSheets(members,checkins,feedback);
      var wb=XLSX.utils.book_new();

      // ── Member Photos sheet ──
      var photoHdr=["Photo","Name","Surname","Status","Phone","School","Address","Parent","Parent Phone","Birthday","Age","Visits","Last Session","WA Group?","Registered"];
      var photoRows=sortAlpha(members).map(function(m){
        var status=computeStatus(m,checkins);
        var photo=localStorage.getItem("ph_"+m.id)||"";
        // Store base64 tag so user can see it or paste into docs
        var photoTag=photo?"[PHOTO ATTACHED - "+m.name+"]":"[No photo]";
        return [
          photoTag, m.name, m.surname, status,
          m.phone||"", m.school||"", m.address||"",
          (m.parentName||"")+" "+(m.parentSurname||""),
          m.parentPhone||"", m.birthday||"",
          calcAge(m.birthday)||"", visitCount(m,checkins),
          lastCheckin(m,checkins)||"",
          m.wantsWhatsApp?"Yes":"No", m.registeredOn||""
        ];
      });
      var wsPhotos=XLSX.utils.aoa_to_sheet([photoHdr,...photoRows]);
      styleSheet(wsPhotos,photoHdr,"1E3A5F");
      // Set column widths
      wsPhotos["!cols"]=[{wch:30},{wch:14},{wch:14},{wch:12},{wch:14},{wch:18},{wch:22},{wch:22},{wch:14},{wch:12},{wch:6},{wch:8},{wch:12},{wch:10},{wch:12}];
      XLSX.utils.book_append_sheet(wb,wsPhotos,"Members + Photos");

      var sheetDefs=[
        {key:"summary",    name:"Health Dashboard", color:"1E293B"},
        {key:"attendance", name:"Full Attendance",   color:"1A3D1A"},
        {key:"absenteeism",name:"Absenteeism",       color:"7C0000"},
        {key:"visitors",   name:"Visitor Tracking",  color:"4A1D8C"},
        {key:"trends",     name:"Weekly Trends",     color:"0F4C75"},
        {key:"feedback",   name:"Feedback-Comments", color:"7C4400"},
      ];
      sheetDefs.forEach(function(sd){
        var d=sheets[sd.key];
        var ws=XLSX.utils.aoa_to_sheet([d.hdr,...d.rows]);
        styleSheet(ws,d.hdr,sd.color);
        XLSX.utils.book_append_sheet(wb,ws,sd.name);
      });

      XLSX.writeFile(wb,"JeremiahGeneration_Report.xlsx");
    }catch(e){alert("Export error: "+e.message);}
  }
  if(typeof XLSX==="undefined"){
    var s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload=run; document.head.appendChild(s);
  } else { run(); }
}

function exportPDF(members,checkins,feedback){
  try{
    var sheets=buildAllSheets(members,checkins,feedback);
    var today=new Date().toLocaleDateString("en-ZA",{year:"numeric",month:"long",day:"numeric"});
    function tbl(hdr,rows,title,color){
      var h="<h2 style='color:"+color+";margin:20px 0 8px;font-size:13px;border-left:4px solid "+color+";padding-left:8px;'>"+title+"</h2>";
      h+="<table><thead><tr>"+hdr.map(function(x){return "<th style='background:"+color+"'>"+x+"</th>";}).join("")+"</tr></thead><tbody>";
      rows.forEach(function(r){
        h+="<tr>";
        r.forEach(function(v){
          var vc=String(v||"");
          var style="";
          if(vc==="CRITICAL"||vc==="ACTION NEEDED"||vc==="IMMEDIATE ACTION")style="color:red;font-weight:bold;";
          else if(vc==="WARNING"||vc==="MONITOR"||vc==="NEEDS ATTENTION")style="color:darkorange;font-weight:bold;";
          else if(vc==="GOOD"||vc==="Improving"||vc==="YES")style="color:green;font-weight:bold;";
          h+="<td style='"+style+"'>"+vc+"</td>";
        });
        h+="</tr>";
      });
      h+="</tbody></table>";
      return h;
    }

    // Build member photo page for PDF
    var memberPhotoHtml="<h2 style='color:#1e293b;border-left:4px solid #6c63ff;padding-left:8px;font-size:13px;'>Member Directory with Photos</h2>";
    memberPhotoHtml+="<div style='display:flex;flex-wrap:wrap;gap:10px;'>";
    sortAlpha(members).forEach(function(m){
      var photo=localStorage.getItem("ph_"+m.id);
      var status=computeStatus(m,checkins);
      var visits=visitCount(m,checkins);
      var statusCol=status==="Member"?"#22c55e":status==="Returning Visitor"?"#f59e0b":"#a855f7";
      memberPhotoHtml+="<div style='border:1px solid #e2e8f0;border-radius:10px;padding:8px;width:140px;text-align:center;break-inside:avoid;'>";
      if(photo){
        memberPhotoHtml+="<img src='"+photo+"' width='70' height='70' style='border-radius:50%;object-fit:cover;border:2px solid "+statusCol+";margin-bottom:4px;display:block;margin:0 auto 4px;'/>";
      } else {
        memberPhotoHtml+="<div style='width:70px;height:70px;border-radius:50%;background:#e2e8f0;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;font-size:24px;'>👤</div>";
      }
      memberPhotoHtml+="<div style='font-weight:bold;font-size:10px;'>"+m.name+" "+m.surname+"</div>";
      memberPhotoHtml+="<div style='font-size:9px;color:"+statusCol+";font-weight:bold;'>"+status+"</div>";
      memberPhotoHtml+="<div style='font-size:8px;color:#64748b;'>"+visits+" visits | "+m.school+"</div>";
      memberPhotoHtml+="</div>";
    });
    memberPhotoHtml+="</div>";

    var html="<!DOCTYPE html><html><head><meta charset='UTF-8'><title>JG Report</title>";
    html+="<style>body{font-family:Arial,sans-serif;font-size:9px;margin:15px;}";
    html+="h1{color:#1e293b;font-size:18px;margin:0 0 2px;}";
    html+=".sub{color:#64748b;font-size:11px;margin:0 0 6px;}";
    html+="table{border-collapse:collapse;width:100%;margin-bottom:10px;}";
    html+="th{padding:5px 6px;text-align:left;font-size:8px;color:#fff;}";
    html+="td{padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:8px;}";
    html+="tr:nth-child(even) td{background:#f8fafc;}";
    html+="@media print{.pagebreak{page-break-before:always;}}";
    html+="</style></head><body>";
    html+="<h1>Jeremiah Generation - Living Waters Fellowship</h1>";
    html+="<p class='sub'>Annual Youth Report | Generated: "+today+" | "+members.length+" members</p>";
    html+=tbl(sheets.summary.hdr,sheets.summary.rows,"Health Dashboard","#1e3a5f");
    html+="<div class='pagebreak'></div>";
    html+=memberPhotoHtml;
    html+="<div class='pagebreak'></div>";
    html+=tbl(sheets.attendance.hdr,sheets.attendance.rows,"Full Attendance Register","#1e293b");
    html+="<div class='pagebreak'></div>";
    html+=tbl(sheets.absenteeism.hdr,sheets.absenteeism.rows,"Absenteeism Report","#7c0000");
    html+=tbl(sheets.visitors.hdr,sheets.visitors.rows,"Visitor Tracking","#4a1d8c");
    html+=tbl(sheets.trends.hdr,sheets.trends.rows,"Weekly Trends","#1a3d1a");
    html+=tbl(sheets.feedback.hdr,sheets.feedback.rows,"Feedback and Comments","#7c4400");
    html+="</body></html>";
    var w=window.open("","_blank","width=1100,height=800");
    if(!w){alert("Please allow popups to generate PDF.");return;}
    w.document.write(html);w.document.close();
    setTimeout(function(){w.print();},900);
  }catch(e){alert("PDF error: "+e.message);}
}

// PIN
function PinScreen({onSuccess}){
  var [pin,setPin]=useState(""); var [shake,setShake]=useState(false);
  function press(k){
    if(k==="del"){setPin(function(p){return p.slice(0,-1);});return;}
    if(pin.length>=5)return;
    var next=pin+k; setPin(next);
    if(next.length===5){
      // Check master PIN (91977) or any Senior Leader PIN (format: 2026X where X = leader number)
      var leaders=JSON.parse(localStorage.getItem("jg_leaders")||"[]");
      var matchedLeader=leaders.find(function(L){return L.pin===next;});
      if(next===ADMIN_PIN||next===ADMIN_PIN2){
        // Master full access (Joshua or Priscilla)
        localStorage.setItem("jg_admin_role","master");
        setTimeout(function(){onSuccess();},200);
      } else if(matchedLeader && matchedLeader.role==="Senior"){
        // Senior leader has admin access but limited (no delete)
        localStorage.setItem("jg_admin_role","senior");
        localStorage.setItem("jg_admin_leader_id",matchedLeader.id);
        localStorage.setItem("jg_login_log_"+Date.now(),JSON.stringify({leaderId:matchedLeader.id,name:matchedLeader.name,date:new Date().toISOString()}));
        setTimeout(function(){onSuccess();},200);
      } else {
        setShake(true);setTimeout(function(){setPin("");setShake(false);},700);
      }
    }
  }
  return(<div className="pin-page"><div className="pin-box">
    <div style={{fontSize:36,marginBottom:8}}>✝</div>
    <h2 style={{margin:"0 0 4px"}}>Admin Access</h2>
    <p style={{color:"#94a3b8",fontSize:14,margin:"0 0 6px"}}>Enter your 4-digit PIN</p>
    <div className={"pin-dots"+(shake?" shake":"")} style={{display:"flex",justifyContent:"center",gap:12,margin:"18px 0"}}>
      {[0,1,2,3,4].map(function(i){return <div key={i} className={"pin-dot"+(pin.length>i?" filled":"")}/>;  })}
    </div>
    <p style={{color:"#475569",fontSize:11,marginBottom:8}}>5-digit PIN required</p>
    {shake&&<p style={{color:"#f87171",fontSize:13,marginBottom:8}}>Incorrect PIN.</p>}
    <div className="numpad">
      {["1","2","3","4","5","6","7","8","9","","0","del"].map(function(k,i){
        return k===""?<div key={i}/>:<button key={i} className={"num-btn"+(k==="del"?" num-del":"")} onClick={function(){press(k);}}>{k==="del"?"⌫":k}</button>;
      })}
    </div>
  </div></div>);
}

// REGISTRATION FORM
function RegistrationForm({existingMembers,onDone,onBack,prefill}){
  var blank={name:"",surname:"",phone:"",whatsapp:"",parentName:"",parentSurname:"",parentPhone:"",school:"",address:"",birthday:"",photo:null,status:"",wantsWhatsApp:null,visitReason:"",grade:"",invitedBy:""};
  var [form,setForm]=useState(function(){
    if(prefill)return Object.assign({},blank,{name:prefill.name||"",surname:prefill.surname||"",phone:prefill.phone||"",address:prefill.address||"",school:prefill.school||"",status:"Member"});
    return blank;
  });
  var [errors,setErrors]=useState({});
  var [done,setDone]=useState(false);
  var age=calcAge(form.birthday);

  function set(f,v){setForm(function(p){return Object.assign({},p,{[f]:v});});setErrors(function(e){return Object.assign({},e,{[f]:""}); });}

  function validate(){
    var req=["name","surname","phone","parentName","parentSurname","parentPhone","school","address","birthday","status"];
    if (form.status==="Visitor") req.push("visitReason");
    var e={};req.forEach(function(k){if(!form[k])e[k]="Required";});setErrors(e);return Object.keys(e).length===0;
  }

  function submit(){
    if(!validate())return;
    var existing=existingMembers.find(function(m){return m.name.toLowerCase()===form.name.toLowerCase()&&m.surname.toLowerCase()===form.surname.toLowerCase();});
    var member=existing
      ?Object.assign({},existing,form,{incomplete:false,wantsWhatsApp:form.wantsWhatsApp===true})
      :Object.assign({},form,{id:String(Date.now()),originalStatus:form.status,wantsWhatsApp:form.wantsWhatsApp===true,visitReason:form.visitReason||"",registeredOn:todayStr(),incomplete:false});
    onDone(member,!existing);setDone(true);
  }

  if(done)return(<div className="card" style={{textAlign:"center",padding:"28px 16px"}}>
    <div className="success-circle">✓</div>
    <h2 style={{margin:"0 0 8px"}}>{form.status==="Visitor"?"Welcome, Visitor!":"Checked In! ✝"}</h2>
    <p style={{color:"#94a3b8",marginBottom:20}}>Welcome to Jeremiah Generation 🙏</p>
    <button className="btn btn-reg" onClick={function(){setForm(blank);setDone(false);}}>Register another</button>
    <button className="btn btn-admin" onClick={onBack}>Back to Home</button>
  </div>);

  function field(label,key,type,ph){return(<div style={{marginBottom:2}}>
    <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:4}}>{label}</label>
    <input type={type||"text"} placeholder={ph||""} value={form[key]} className="input"
      style={{marginBottom:errors[key]?4:12,borderColor:errors[key]?"#ef4444":undefined}}
      onChange={function(e){set(key,e.target.value);}}/>
    {key==="birthday"&&age!==null&&<p className="age-tag">Age: {age} years old</p>}
    {errors[key]&&<p style={{color:"#f87171",fontSize:12,marginBottom:10}}>{errors[key]}</p>}
  </div>);}

  // Big Visitor or Member selector shows first
  if (!form.status && !prefill) {
    return (
      <div>
        <div style={{textAlign:"center",marginBottom:26,marginTop:20}}>
          <div style={{fontSize:44,marginBottom:6}}>✝</div>
          <h1 style={{margin:"0 0 4px",fontSize:22,background:"linear-gradient(135deg,#6c63ff,#22c55e)",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent"}}>Jeremiah Generation</h1>
          <p style={{color:"#6ee7b7",fontSize:13,fontWeight:600,margin:0}}>Living Waters Fellowship</p>
        </div>

        <p style={{textAlign:"center",color:"#e2e8f0",fontSize:18,fontWeight:700,margin:"0 0 6px"}}>Welcome! 👋</p>
        <p style={{textAlign:"center",color:"#94a3b8",fontSize:14,margin:"0 0 28px"}}>Which one are you?</p>

        <button onClick={function(){set("status","Visitor");}} style={{
          width:"100%",background:"linear-gradient(135deg,#a855f7,#6c63ff)",border:"none",borderRadius:22,
          padding:"28px 20px",marginBottom:16,color:"#fff",cursor:"pointer",fontFamily:"inherit",
          boxShadow:"0 8px 32px rgba(168,85,247,0.4)",textAlign:"left",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{fontSize:52}}>🙋</div>
            <div style={{flex:1}}>
              <div style={{fontSize:24,fontWeight:900,marginBottom:2}}>Visitor</div>
              <div style={{fontSize:13,opacity:0.9,fontWeight:500}}>First time or guest at JG youth</div>
            </div>
            <div style={{fontSize:28,opacity:0.8}}>→</div>
          </div>
        </button>

        <button onClick={function(){set("status","Member");}} style={{
          width:"100%",background:"linear-gradient(135deg,#22c55e,#10b981)",border:"none",borderRadius:22,
          padding:"28px 20px",marginBottom:20,color:"#fff",cursor:"pointer",fontFamily:"inherit",
          boxShadow:"0 8px 32px rgba(34,197,94,0.4)",textAlign:"left",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{fontSize:52}}>✝</div>
            <div style={{flex:1}}>
              <div style={{fontSize:24,fontWeight:900,marginBottom:2}}>Member</div>
              <div style={{fontSize:13,opacity:0.9,fontWeight:500}}>Part of JG youth family</div>
            </div>
            <div style={{fontSize:28,opacity:0.8}}>→</div>
          </div>
        </button>

        <button className="btn btn-admin" onClick={onBack}>← Back to Home</button>
      </div>
    );
  }

  return(<div>
    <div style={{textAlign:"center",marginBottom:18}}>
      <div style={{display:"inline-block",background:form.status==="Visitor"?"linear-gradient(135deg,#a855f7,#6c63ff)":"linear-gradient(135deg,#22c55e,#10b981)",color:"#fff",padding:"6px 16px",borderRadius:20,fontSize:13,fontWeight:700,marginBottom:8}}>
        {form.status==="Visitor"?"🙋 Visitor Registration":"✝ Member Registration"}
      </div>
      <h2 style={{margin:"4px 0 2px",fontSize:18}}>{form.status==="Visitor"?"Tell us about yourself!":"Welcome to the family!"}</h2>
      <p style={{color:"#6ee7b7",fontSize:13,fontWeight:600,margin:0}}>Living Waters Fellowship</p>
      {prefill&&<p style={{color:"#f59e0b",fontSize:13,margin:"6px 0 0",fontWeight:600}}>Please complete your profile below</p>}
      {!prefill&&<button onClick={function(){set("status","");}} style={{background:"none",border:"none",color:"#64748b",fontSize:12,cursor:"pointer",marginTop:6,textDecoration:"underline",fontFamily:"inherit"}}>← Change</button>}
    </div>

    {form.status==="Visitor"&&(
      <div style={{marginBottom:14,background:"#1a0a1e",border:"2px solid #a855f744",borderRadius:13,padding:"14px"}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#e879f9",marginBottom:8}}>What brought you to JG today? *</label>
        <select className="input" value={form.visitReason} style={{background:"#0f172a",color:"#fff",borderColor:errors.visitReason?"#ef4444":"#a855f744"}}
          onChange={function(e){set("visitReason",e.target.value);if(e.target.value!=="Friend invited me"&&e.target.value!=="Family member")set("invitedBy","");}}>
          <option value="">-- Choose one --</option>
          <option value="Friend invited me">👥 A friend invited me</option>
          <option value="Heard from school">🏫 Heard from school friends</option>
          <option value="Family member">👨‍👩‍👧 Family member attends</option>
          <option value="Saw it online">📱 Saw it online / social media</option>
          <option value="Church / Pastor">⛪ Pastor or church invited me</option>
          <option value="Flyer or poster">📄 Flyer or poster</option>
          <option value="Other">💫 Other reason</option>
        </select>
        {errors.visitReason&&<p style={{color:"#f87171",fontSize:12,marginTop:4}}>Please select a reason</p>}

        {(form.visitReason==="Friend invited me"||form.visitReason==="Family member")&&(
          <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid #a855f722"}}>
            <label style={{display:"block",fontSize:13,fontWeight:700,color:"#e879f9",marginBottom:8}}>Who invited you? Search the youth member:</label>
            <input className="input" placeholder="Type their name..." value={form.invitedBy||""} onChange={function(e){set("invitedBy",e.target.value);}}/>
            {form.invitedBy&&form.invitedBy.length>=1&&(function(){
              var matches=existingMembers.filter(function(em){
                return (em.name+" "+em.surname).toLowerCase().includes(form.invitedBy.toLowerCase());
              }).slice(0,5);
              if(matches.length===0||matches.find(function(em){return (em.name+" "+em.surname).toLowerCase()===form.invitedBy.toLowerCase();}))return null;
              return(<div style={{background:"#0f172a",borderRadius:10,marginTop:6,padding:6,border:"1px solid #a855f744"}}>
                {matches.map(function(em){
                  return(<div key={em.id} onClick={function(){set("invitedBy",em.name+" "+em.surname);}} style={{padding:"8px 10px",cursor:"pointer",borderRadius:7,display:"flex",alignItems:"center",gap:8}}>
                    {em.photo?<img src={em.photo} width="28" height="28" style={{borderRadius:"50%",objectFit:"cover"}}/>:<div style={{width:28,height:28,borderRadius:"50%",background:"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>👤</div>}
                    <span style={{fontSize:13,color:"#e2e8f0"}}>{em.name} {em.surname}</span>
                  </div>);
                })}
              </div>);
            })()}
          </div>
        )}
      </div>
    )}

    {field("First Name *","name","text","e.g. Lebo")}
    {field("Surname *","surname","text","e.g. Dlamini")}
    {field("Cell Number *","phone","tel","e.g. 071 234 5678")}
    {field("WhatsApp Number","whatsapp","tel","If different from cell")}

    <div style={{background:"#182032",borderRadius:12,padding:"14px 14px 2px",marginBottom:12}}>
      <p style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:"#6ee7b7"}}>Parent / Guardian</p>
      {field("Parent First Name *","parentName","text","e.g. Mary")}
      {field("Parent Surname *","parentSurname","text","e.g. Dlamini")}
      {field("Parent / Guardian Phone *","parentPhone","tel","e.g. 082 456 7890")}
    </div>

    <div style={{marginBottom:12}}>
      <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:4}}>School *</label>
      <select className="input" value={form.school} style={{borderColor:errors.school?"#ef4444":undefined,background:"#1e293b",color:"#fff"}}
        onChange={function(e){var v=e.target.value;if(!v.startsWith("--"))set("school",v);}}>
        <option value="">-- Select school --</option>
        {SCHOOLS.map(function(s){return <option key={s} value={s} disabled={s.startsWith("--")} style={{background:"#1e293b"}}>{s}</option>;})}
      </select>
      {errors.school&&<p style={{color:"#f87171",fontSize:12,marginBottom:8}}>{errors.school}</p>}
    </div>

    {field("Home Address *","address","text","e.g. 12 Main St, Lephalale")}

    <div style={{marginBottom:12}}>
      <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:6}}>Date of Birth * {form.birthday&&calcAge(form.birthday)!==null&&<span style={{color:"#6ee7b7",marginLeft:8}}>Age: {calcAge(form.birthday)}</span>}</label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1.4fr",gap:8}}>
        <select className="input" style={{background:"#1e293b",color:"#fff"}} value={form.birthday?form.birthday.split("-")[2]||"":""} onChange={function(e){
          var parts=(form.birthday||"----").split("-");
          set("birthday",(parts[0]||"2000")+"-"+(parts[1]||"01")+"-"+e.target.value);
        }}>
          <option value="">Day</option>
          {Array.from({length:31},function(_,i){var d=String(i+1).padStart(2,"0");return <option key={d} value={d}>{i+1}</option>;})}
        </select>
        <select className="input" style={{background:"#1e293b",color:"#fff"}} value={form.birthday?form.birthday.split("-")[1]||"":""} onChange={function(e){
          var parts=(form.birthday||"----").split("-");
          set("birthday",(parts[0]||"2000")+"-"+e.target.value+"-"+(parts[2]||"01"));
        }}>
          <option value="">Month</option>
          {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(function(m,i){var v=String(i+1).padStart(2,"0");return <option key={v} value={v}>{m}</option>;})}
        </select>
        <select className="input" style={{background:"#1e293b",color:"#fff"}} value={form.birthday?form.birthday.split("-")[0]||"":""} onChange={function(e){
          var parts=(form.birthday||"----").split("-");
          set("birthday",e.target.value+"-"+(parts[1]||"01")+"-"+(parts[2]||"01"));
        }}>
          <option value="">Year</option>
          {Array.from({length:20},function(_,i){var y=String(new Date().getFullYear()-7-i);return <option key={y} value={y}>{y}</option>;})}
        </select>
      </div>
      {errors.birthday&&<p style={{color:"#f87171",fontSize:12,marginTop:4}}>{errors.birthday}</p>}
    </div>

    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:8}}>Profile Photo *</label>
      <input type="file" accept="image/*" capture="user" id="selfie-input" style={{display:"none"}}
        onChange={function(e){
          if(e.target.files[0]){
            var reader=new FileReader();
            reader.onload=function(ev){
              var img=new Image();
              img.onload=function(){
                var canvas=document.createElement("canvas");
                canvas.width=img.width; canvas.height=img.height;
                var ctx=canvas.getContext("2d");
                ctx.translate(img.width,0);
                ctx.scale(-1,1);
                ctx.drawImage(img,0,0);
                set("photo",canvas.toDataURL("image/jpeg",0.85));
              };
              img.src=ev.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
          }
        }}/>
      {!form.photo?(
        <div onClick={function(){document.getElementById("selfie-input").click();}}
          style={{background:"linear-gradient(135deg,#1e293b,#0f172a)",border:"3px dashed #6c63ff",borderRadius:16,padding:"28px 20px",textAlign:"center",cursor:"pointer"}}>
          <div style={{fontSize:52,marginBottom:8}}>📸</div>
          <p style={{color:"#6c63ff",fontWeight:700,fontSize:16,margin:"0 0 4px"}}>Tap to Take Your Selfie</p>
          <p style={{color:"#475569",fontSize:13,margin:0}}>Your photo will be saved to your profile</p>
        </div>
      ):(
        <div style={{textAlign:"center"}}>
          <img src={form.photo} width="100" height="100" style={{borderRadius:"50%",objectFit:"cover",border:"3px solid #6c63ff",display:"block",margin:"0 auto 10px"}}/>
          <button type="button" onClick={function(){document.getElementById("selfie-input").click();}}
            style={{background:"#1e293b",border:"2px solid #334155",color:"#94a3b8",borderRadius:10,padding:"8px 16px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            Retake Photo
          </button>
        </div>
      )}
    </div>

    <div style={{background:"#0d2818",border:"2px solid #22c55e44",borderRadius:12,padding:"14px",marginBottom:14}}>
      <p style={{margin:"0 0 8px",fontWeight:700,fontSize:14,color:"#86efac"}}>Join our WhatsApp Group?</p>
      <p style={{margin:"0 0 10px",fontSize:12,color:"#64748b"}}>We will add you within one week of registering.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <button type="button" onClick={function(){set("wantsWhatsApp",true);}} style={{padding:"11px",borderRadius:10,border:form.wantsWhatsApp===true?"2px solid #22c55e":"2px solid #334155",background:form.wantsWhatsApp===true?"#0d2818":"#1e293b",color:form.wantsWhatsApp===true?"#86efac":"#64748b",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Yes please!</button>
        <button type="button" onClick={function(){set("wantsWhatsApp",false);}} style={{padding:"11px",borderRadius:10,border:form.wantsWhatsApp===false?"2px solid #ef4444":"2px solid #334155",background:form.wantsWhatsApp===false?"#1a0505":"#1e293b",color:form.wantsWhatsApp===false?"#f87171":"#64748b",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>No thanks</button>
      </div>
    </div>

    <button className="btn btn-reg" onClick={submit}>Submit and Check In</button>
    <button className="btn btn-admin" onClick={onBack}>Back</button>
  </div>);
}

// CHECK-IN
function CheckInPage({members,checkins,onCheckin,onBack,onCompleteProfile}){
  var [mode,setMode]=useState("youth"); // youth or leader
  var [leaders,setLeaders]=useState(function(){return JSON.parse(localStorage.getItem("jg_leaders")||"[]");});
  var [leaderQuery,setLeaderQuery]=useState("");
  var [leaderDone,setLeaderDone]=useState(null);

  function checkInLeader(L){
    var key="leader_attendance";
    var arr=JSON.parse(localStorage.getItem(key)||"[]");
    var today=todayStr();
    if(!arr.find(function(a){return a.leaderId===L.id&&a.date===today;})){
      arr.push({leaderId:L.id,leaderName:L.name+" "+L.surname,role:L.role,date:today,time:new Date().toLocaleTimeString()});
      localStorage.setItem(key,JSON.stringify(arr));
    }
    setLeaderDone(L);
  }
  var [search,setSearch]=useState("");
  var [selected,setSelected]=useState(null);
  var [done,setDone]=useState(null);
  var [step,setStep]=useState("search");
  var [isAnon,setIsAnon]=useState(false);
  var [cat,setCat]=useState("");
  var [message,setMessage]=useState("");

  var CATS=[
    {v:"Games",l:"Game suggestions",i:"🎲"},
    {v:"Sports",l:"Sport events and outings",i:"⚽"},
    {v:"Welcome",l:"How to feel more welcome",i:"❤️"},
    {v:"Prayer",l:"Prayer request",i:"🙏"},
    {v:"Advice",l:"I want to talk or get advice",i:"💬"},
    {v:"Complaint",l:"Complaint",i:"⚠️"},
    {v:"General",l:"General or something else",i:"💡"},
  ];

  var sorted=sortAlpha(members);
  var results=search.length>=1?sorted.filter(function(m){return (m.name+" "+m.surname).toLowerCase().includes(search.toLowerCase());}):sorted;

  function tap(m){if(m.incomplete){setSelected(m);setStep("incomplete");return;}setSelected(m);setStep("ask");setIsAnon(false);setCat("");setMessage("");}

  function doCheckin(fb){
    try{
      onCheckin(selected,fb);
      setDone(selected);setSelected(null);setStep("search");
      setTimeout(function(){setDone(null);setSearch("");},3000);
    }catch(e){console.log("checkin err",e);}
  }

  function submitFb(){doCheckin(cat?{name:isAnon?"Anonymous":selected.name+" "+selected.surname,category:cat,comment:message||"(no message)"}:null);}

  if(done)return(<div style={{textAlign:"center",padding:"50px 0"}}>
    <div className="success-circle">✓</div>
    <h2 style={{margin:"0 0 8px"}}>Welcome, {done.name}!</h2>
    <p style={{color:"#94a3b8"}}>Checked in for today. God bless you!</p>
  </div>);

  if(step==="incomplete"&&selected)return(<div>
    <div style={{textAlign:"center",marginBottom:20}}>
      <div style={{width:60,height:60,borderRadius:"50%",background:"#f59e0b22",border:"3px solid #f59e0b",color:"#f59e0b",fontSize:28,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>!</div>
      <h2 style={{margin:"0 0 4px"}}>Hi {selected.name}!</h2>
      <p style={{color:"#f59e0b",fontWeight:700,fontSize:14,margin:0}}>Your profile is incomplete</p>
    </div>
    <div style={{background:"#1c1504",border:"2px solid #f59e0b44",borderRadius:14,padding:"16px",marginBottom:16}}>
      <p style={{margin:"0 0 8px",fontSize:14,color:"#fcd34d"}}>We have your name from our old register but need a few more details.</p>
      <p style={{margin:0,fontSize:13,color:"#94a3b8"}}>It only takes 2 minutes to complete!</p>
    </div>
    <button className="btn btn-reg" style={{marginBottom:8}} onClick={function(){onCompleteProfile(selected);}}>Complete My Registration</button>
    <button className="btn btn-admin" onClick={function(){
      var skipKey="skip_"+selected.id;
      var skipCount=parseInt(localStorage.getItem(skipKey)||"0");
      if(skipCount>=1){
        alert("You have already skipped once. Please complete your registration — it only takes 2 minutes!");
        return;
      }
      localStorage.setItem(skipKey,"1");
      setSelected(Object.assign({},selected,{incomplete:false}));
      setStep("ask");setIsAnon(false);setCat("");setMessage("");
    }}>Skip for now (allowed once only)</button>
    <p style={{fontSize:11,color:"#475569",textAlign:"center",marginTop:4}}>⚠️ You can only skip this once. You must complete your profile next time.</p>
    <button className="btn btn-admin" style={{marginTop:6,color:"#475569"}} onClick={function(){setSelected(null);setStep("search");}}>Back</button>
  </div>);

  if(step==="ask"&&selected)return(<div>
    <div style={{textAlign:"center",marginBottom:20}}>
      <div style={{width:62,height:62,borderRadius:"50%",background:"#334155",color:"#fff",fontSize:26,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}>
        {selected.photo?<img src={selected.photo} width="62" height="62" style={{borderRadius:"50%",objectFit:"cover"}}/>:"👤"}
      </div>
      <h2 style={{margin:"0 0 2px"}}>Welcome back, {selected.name}!</h2>
      <p style={{color:"#6ee7b7",fontWeight:600,fontSize:13,margin:0}}>Great to see you today!</p>
    </div>
    <div style={{background:"#1e293b",borderRadius:16,padding:"20px",textAlign:"center"}}>
      <p style={{fontSize:16,fontWeight:700,color:"#e2e8f0",margin:"0 0 6px"}}>Any suggestions, requests or feedback today?</p>
      <p style={{fontSize:13,color:"#64748b",margin:"0 0 18px"}}>Games, sports, prayer, advice - anything at all.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <button onClick={function(){setStep("form");}} style={{padding:"16px",borderRadius:12,border:"2px solid #22c55e",background:"#0d2818",color:"#86efac",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Yes, I do!</button>
        <button onClick={function(){doCheckin(null);}} style={{padding:"16px",borderRadius:12,border:"2px solid #334155",background:"#1e293b",color:"#94a3b8",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>No thanks</button>
      </div>
    </div>
    <button className="btn btn-admin" style={{marginTop:10}} onClick={function(){setSelected(null);setStep("search");}}>Back</button>
  </div>);

  if(step==="form"&&selected)return(<div>
    <div style={{textAlign:"center",marginBottom:16}}><h2 style={{margin:"0 0 2px",fontSize:18}}>Your Feedback</h2><p style={{color:"#6ee7b7",fontSize:13,margin:0}}>Choose a category</p></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
      {CATS.map(function(c){return(<button key={c.v} onClick={function(){setCat(cat===c.v?"":c.v);}} style={{padding:"12px 8px",borderRadius:12,textAlign:"left",border:cat===c.v?"2px solid #6c63ff":"2px solid #334155",background:cat===c.v?"#1e1b4b":"#1e293b",color:cat===c.v?"#a5b4fc":"#94a3b8",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
        <span style={{fontSize:20,display:"block",marginBottom:3}}>{c.i}</span>{c.l}
      </button>);})}
    </div>
    {cat&&<div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:6}}>Your message (optional):</label>
      <textarea className="input" style={{height:100,resize:"none"}} placeholder="Type your message here..." value={message} onChange={function(e){setMessage(e.target.value);}}/>
    </div>}
    <div style={{background:"#1e293b",borderRadius:12,padding:"14px",marginBottom:14}}>
      <p style={{margin:"0 0 8px",fontWeight:700,fontSize:13,color:"#e2e8f0"}}>Privacy:</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <button onClick={function(){setIsAnon(false);}} style={{padding:"11px",borderRadius:11,border:!isAnon?"2px solid #22c55e":"2px solid #334155",background:!isAnon?"#0d2818":"#0f172a",color:!isAnon?"#86efac":"#64748b",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Show My Name<br/><span style={{fontSize:10}}>{selected.name}</span></button>
        <button onClick={function(){setIsAnon(true);}} style={{padding:"11px",borderRadius:11,border:isAnon?"2px solid #a855f7":"2px solid #334155",background:isAnon?"#1a0a1e":"#0f172a",color:isAnon?"#e879f9":"#64748b",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Anonymous<br/><span style={{fontSize:10}}>Hide my name</span></button>
      </div>
    </div>
    <button className="btn btn-reg" style={{marginBottom:8}} onClick={submitFb}>{cat?"Submit Feedback and Check In":"Check In"}</button>
    <button className="btn btn-admin" onClick={function(){doCheckin(null);}}>Skip - Just Check In</button>
    <button className="btn btn-admin" style={{marginTop:6,color:"#475569"}} onClick={function(){setStep("ask");}}>Back</button>
  </div>);

  // LEADER MODE
  if(mode==="leader"){
    if(leaderDone){
      return(<div style={{textAlign:"center",padding:"40px 20px"}}>
        <div style={{fontSize:60,marginBottom:14}}>✅</div>
        <h2 style={{margin:"0 0 8px",color:"#86efac"}}>Welcome, {leaderDone.name}!</h2>
        <p style={{color:"#94a3b8",fontSize:14,margin:"0 0 20px"}}>You are checked in as {leaderDone.role} Leader.</p>
        <button className="btn btn-reg" onClick={function(){setLeaderDone(null);setLeaderQuery("");}}>Check In Another Leader</button>
        <button className="btn btn-admin" onClick={function(){setMode("youth");setLeaderDone(null);}}>← Done</button>
      </div>);
    }
    var matchedLeaders=leaders.filter(function(L){
      if(!leaderQuery)return true;
      return (L.name+" "+L.surname).toLowerCase().includes(leaderQuery.toLowerCase());
    });
    return(<div>
      <button onClick={function(){setMode("youth");}} className="btn btn-admin" style={{marginBottom:14}}>← Back to Youth Check-in</button>
      <p className="page-title">⭐ Leader Check-In</p>
      <p style={{color:"#94a3b8",fontSize:13,marginBottom:14}}>Tap your name to mark yourself as present today.</p>
      <input className="input" placeholder="Search your name..." value={leaderQuery} onChange={function(e){setLeaderQuery(e.target.value);}}/>
      {leaders.length===0&&<p className="empty-msg">No leaders registered yet. Ask the main leader to add you in Admin → Leaders.</p>}
      {matchedLeaders.map(function(L){
        var arr=JSON.parse(localStorage.getItem("leader_attendance")||"[]");
        var alreadyToday=arr.find(function(a){return a.leaderId===L.id&&a.date===todayStr();});
        return(<div key={L.id} onClick={function(){if(!alreadyToday)checkInLeader(L);}} style={{background:alreadyToday?"#0d2818":"#1e293b",border:"2px solid "+(alreadyToday?"#22c55e":(L.role==="Senior"?"#fbbf2444":"#22c55e22")),borderRadius:13,padding:"14px",marginBottom:10,cursor:alreadyToday?"default":"pointer",display:"flex",alignItems:"center",gap:12}}>
          {L.photo?<img src={L.photo} width="44" height="44" style={{borderRadius:"50%",objectFit:"cover"}}/>:<div style={{width:44,height:44,borderRadius:"50%",background:"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{L.role==="Senior"?"⭐":"🌱"}</div>}
          <div style={{flex:1}}>
            <strong style={{fontSize:15,color:alreadyToday?"#86efac":"#e2e8f0"}}>{L.name} {L.surname}</strong>
            <div style={{fontSize:12,color:"#94a3b8"}}>{L.role} Leader{alreadyToday?" · ✓ Already checked in today":""}</div>
          </div>
        </div>);
      })}
    </div>);
  }

  return(<div>
    <h3 className="page-title">Check In</h3>
    <button onClick={function(){setMode("leader");}} style={{width:"100%",background:"linear-gradient(135deg,#fbbf24,#f59e0b)",color:"#fff",border:"none",borderRadius:12,padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>⭐ I am a Leader (Leader Check-In)</button>
    <p style={{color:"#94a3b8",fontSize:13,marginBottom:10}}>Or search your name below to check in as youth.</p>
    <input className="input" placeholder="Search your name..." value={search} onChange={function(e){setSearch(e.target.value);}} autoFocus/>
    {results.map(function(m){
      var status=computeStatus(m,checkins);
      var bs=statusBadge(status);
      return(<div key={m.id} className={"card"+(m.incomplete?" card-absent":"")} onClick={function(){tap(m);}}>
        {m.photo?<img src={m.photo} width="46" height="46" style={{borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>
          :<div style={{width:46,height:46,borderRadius:"50%",background:"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>👤</div>}
        <div style={{flex:1}}>
          <strong>{m.name} {m.surname}</strong>
          {m.incomplete&&<span style={{fontSize:11,color:"#f59e0b",marginLeft:6}}>incomplete</span>}
          <br/><small style={{color:"#94a3b8"}}>{m.school||""}{calcAge(m.birthday)?" Age "+calcAge(m.birthday):""}</small>
        </div>
        <span style={{background:bs.bg,color:bs.col,border:"1.5px solid "+bs.bd,borderRadius:8,padding:"3px 8px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{status}</span>
      </div>);
    })}
    {results.length===0&&search.length>=1&&<p className="empty-msg">Not found - please use Registration</p>}
    <button className="btn btn-admin" onClick={onBack}>Back</button>
  </div>);
}

// ── VIBE DASHBOARD - Funky Gen-Z style ─────────────────────
function VibeDashboard({data,setData,onExit,onRefresh,syncing,switchStyle}){
  var [view,setView]=useState("home");
  var members=data.members||[];
  var checkins=data.checkins||[];
  var feedback=data.feedback||[];
  var events=data.events||[];
  var todayDate=getActiveEventDate(events);
  // Unique member IDs who checked in on event date (avoid double counting and orphans)
  var rawTodayIds=[...new Set(checkins.filter(function(c){return c.date===todayDate;}).map(function(c){return c.memberId;}))];
  var todayIds=rawTodayIds.filter(function(id){return members.find(function(m){return m.id===id;});});
  var absentToday=members.filter(function(m){return !todayIds.includes(m.id);});
  var visitorsToday=todayIds.filter(function(id){var m=members.find(function(mb){return mb.id===id;});return m&&m.originalStatus==="Visitor";}).length;
  var allVisitors=members.filter(function(m){return m.originalStatus==="Visitor";});
  var allDates=[...new Set(checkins.map(function(c){return c.date;}))].sort();
  var unreadFb=feedback.filter(function(f){return !f.seen;}).length;
  var waRequests=members.filter(function(m){return m.wantsWhatsApp&&!m.addedToWA;});

  function vc(m){return visitCount(m,checkins);}
  function lc(m){return lastCheckin(m,checkins);}

  // Health score calculation
  var totalSessions=allDates.length;
  var overallRate=members.length&&totalSessions?Math.round((checkins||[]).length/(members.length*totalSessions)*100):0;
  var health=overallRate>=70?"THRIVING":overallRate>=50?"GROWING":overallRate>0?"NEEDS LOVE":"READY";
  var healthEmoji=health==="THRIVING"?"🔥":health==="GROWING"?"🌱":health==="NEEDS LOVE"?"💜":"✨";
  var healthGradient=health==="THRIVING"?"linear-gradient(135deg,#22c55e,#10b981)":health==="GROWING"?"linear-gradient(135deg,#f59e0b,#f97316)":health==="NEEDS LOVE"?"linear-gradient(135deg,#a855f7,#ec4899)":"linear-gradient(135deg,#6c63ff,#3b82f6)";

  var gradients={
    present:"linear-gradient(135deg,#22c55e,#10b981)",
    absent:"linear-gradient(135deg,#f59e0b,#ef4444)",
    visitors:"linear-gradient(135deg,#a855f7,#ec4899)",
    members:"linear-gradient(135deg,#3b82f6,#6366f1)",
    feedback:"linear-gradient(135deg,#ec4899,#f97316)",
    wa:"linear-gradient(135deg,#22c55e,#4ade80)",
    reports:"linear-gradient(135deg,#6366f1,#8b5cf6)",
    export:"linear-gradient(135deg,#0891b2,#06b6d4)",
    import:"linear-gradient(135deg,#f59e0b,#eab308)",
    qr:"linear-gradient(135deg,#14b8a6,#0d9488)",
  };

  // Sub-views: each tab renders the same content as classic but wrapped differently
  if (view!=="home") {
    // Re-use classic AdminDashboard logic by rendering a container with a fake tab
    return (
      <div>
        <div style={{textAlign:"center",marginBottom:14}}>
          <button onClick={function(){setView("home");}} style={{background:"linear-gradient(135deg,#1e293b,#0f172a)",border:"2px solid #334155",color:"#fff",borderRadius:12,padding:"8px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Back to Vibe Home</button>
        </div>
        <VibeSubView view={view} data={data} setData={setData}/>
      </div>
    );
  }

  // Home = funky dashboard
  return (
    <div>
      <div style={{textAlign:"center",marginBottom:20,marginTop:8}}>
        <div style={{fontSize:34,marginBottom:4}}>✨</div>
        <h1 style={{margin:"0 0 2px",fontSize:24,background:"linear-gradient(135deg,#6c63ff,#ec4899,#22c55e)",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",fontWeight:900,letterSpacing:"-0.5px"}}>JG Dashboard</h1>
        <p style={{color:"#64748b",fontSize:12,margin:0}}>Living Waters Fellowship</p>
        <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:10,flexWrap:"wrap"}}>
          <button onClick={onRefresh} disabled={syncing} style={{background:"#1e293b",border:"1px solid #334155",color:syncing?"#475569":"#6ee7b7",borderRadius:8,padding:"5px 12px",fontSize:12,cursor:syncing?"not-allowed":"pointer",fontFamily:"inherit"}}>{syncing?"Syncing":"🔄 Refresh"}</button>
          <button onClick={switchStyle} style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>📋 Classic View</button>
        </div>
      </div>

      {/* HUGE Health Score card */}
      <div style={{background:healthGradient,borderRadius:24,padding:"24px 20px",marginBottom:18,color:"#fff",boxShadow:"0 12px 40px rgba(0,0,0,0.3)",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:4}}>{healthEmoji}</div>
        <div style={{fontSize:14,opacity:0.9,fontWeight:600,letterSpacing:"2px"}}>THE VIBE IS</div>
        <div style={{fontSize:32,fontWeight:900,margin:"2px 0",letterSpacing:"-1px"}}>{health}</div>
        <div style={{fontSize:58,fontWeight:900,lineHeight:1,marginTop:8}}>{overallRate}%</div>
        <div style={{fontSize:13,opacity:0.9,marginTop:4}}>Overall Attendance Rate</div>
      </div>

      {/* Today stats - big bold */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <div style={{background:gradients.present,borderRadius:20,padding:"18px",color:"#fff",boxShadow:"0 6px 24px rgba(34,197,94,0.3)"}}>
          <div style={{fontSize:36,lineHeight:1}}>🎉</div>
          <div style={{fontSize:42,fontWeight:900,marginTop:6,lineHeight:1}}>{todayIds.length}</div>
          <div style={{fontSize:13,opacity:0.9,fontWeight:600,marginTop:2}}>Here today</div>
        </div>
        <div style={{background:absentToday.length>0?gradients.absent:"linear-gradient(135deg,#334155,#475569)",borderRadius:20,padding:"18px",color:"#fff",boxShadow:"0 6px 24px rgba(245,158,11,0.3)"}}>
          <div style={{fontSize:36,lineHeight:1}}>{absentToday.length>0?"👀":"✅"}</div>
          <div style={{fontSize:42,fontWeight:900,marginTop:6,lineHeight:1}}>{absentToday.length}</div>
          <div style={{fontSize:13,opacity:0.9,fontWeight:600,marginTop:2}}>Not here yet</div>
        </div>
      </div>

      {/* Quick action tiles */}
      <p style={{color:"#64748b",fontSize:12,fontWeight:700,letterSpacing:"1.5px",margin:"20px 0 10px"}}>QUICK ACTIONS</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[
          {label:"Absent",emoji:"⚠️",count:absentToday.length,view:"absent",grad:gradients.absent},
          {label:"Feedback",emoji:"💬",count:unreadFb,view:"suggestions",grad:gradients.feedback},
          {label:"Visitors",emoji:"🙋",count:allVisitors.length,view:"visitors",grad:gradients.visitors},
          {label:"Members",emoji:"👥",count:members.length,view:"members",grad:gradients.members},
          {label:"Contacts",emoji:"📱",count:members.length,view:"contacts",grad:"linear-gradient(135deg,#0ea5e9,#06b6d4)"},
          {label:"WA Group",emoji:"💚",count:waRequests.length,view:"wagroup",grad:gradients.wa},
        ].map(function(t){return(
          <button key={t.label} onClick={function(){setView(t.view);}} style={{
            background:t.grad,border:"none",borderRadius:18,padding:"18px 14px",color:"#fff",cursor:"pointer",
            fontFamily:"inherit",textAlign:"left",boxShadow:"0 6px 20px rgba(0,0,0,0.25)",position:"relative",overflow:"hidden",
          }}>
            <div style={{fontSize:28,marginBottom:4}}>{t.emoji}</div>
            <div style={{fontSize:26,fontWeight:900,lineHeight:1}}>{t.count}</div>
            <div style={{fontSize:13,opacity:0.95,fontWeight:700,marginTop:4}}>{t.label}</div>
          </button>
        );})}
      </div>

      <p style={{color:"#64748b",fontSize:12,fontWeight:700,letterSpacing:"1.5px",margin:"20px 0 10px"}}>TOOLS</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[
          {label:"Reports",emoji:"📊",view:"reports",grad:gradients.reports},
          {label:"Export",emoji:"📥",view:"export",grad:gradients.export},
          {label:"Spreadsheet",emoji:"📋",view:"sheet",grad:"linear-gradient(135deg,#475569,#64748b)"},
          {label:"Import",emoji:"📤",view:"import",grad:gradients.import},
          {label:"QR Code",emoji:"📱",view:"qr",grad:gradients.qr},
        ].map(function(t){return(
          <button key={t.label} onClick={function(){setView(t.view);}} style={{
            background:t.grad,border:"none",borderRadius:18,padding:"16px",color:"#fff",cursor:"pointer",
            fontFamily:"inherit",textAlign:"left",boxShadow:"0 6px 20px rgba(0,0,0,0.25)",
          }}>
            <div style={{fontSize:28,marginBottom:4}}>{t.emoji}</div>
            <div style={{fontSize:15,fontWeight:800}}>{t.label}</div>
          </button>
        );})}
      </div>

      {/* Today vibe strip */}
      {todayIds.length>0&&(
        <div style={{background:"#0f172a",border:"2px solid #22c55e44",borderRadius:18,padding:"14px",marginBottom:14}}>
          <p style={{margin:"0 0 8px",fontSize:12,fontWeight:700,color:"#86efac",letterSpacing:"1.5px"}}>⚡ CHECKED IN TODAY</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {todayIds.slice(0,12).map(function(id){
              var m=members.find(function(mb){return mb.id===id;});
              if(!m)return null;
              return <span key={id} style={{background:"#1e293b",color:"#86efac",borderRadius:20,padding:"6px 12px",fontSize:12,fontWeight:600}}>{m.name} ✓</span>;
            })}
            {todayIds.length>12&&<span style={{color:"#64748b",fontSize:12,padding:"6px 0"}}>+{todayIds.length-12} more</span>}
          </div>
        </div>
      )}

      <button onClick={onExit} style={{width:"100%",background:"#1e293b",border:"2px solid #334155",color:"#94a3b8",borderRadius:14,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:12}}>Exit Admin</button>
    </div>
  );
}

// Sub-view wrapper - renders classic admin content for a single tab
function VibeSubView({view,data,setData}){
  // We render a minimal classic-style view just for this tab.
  return (
    <div>
      <AdminDashboardEmbedded data={data} setData={setData} initialTab={view}/>
    </div>
  );
}

// Simplified embedded version - reuses classic AdminDashboard but starts on specific tab
function AdminDashboardEmbedded({data,setData,initialTab}){
  var members=data.members||[];
  var checkins=data.checkins||[];
  var feedback=data.feedback||[];
  var events=data.events||[];
  var todayDate=getActiveEventDate(events);
  // Unique member IDs who checked in on event date (avoid double counting and orphans)
  var rawTodayIds=[...new Set(checkins.filter(function(c){return c.date===todayDate;}).map(function(c){return c.memberId;}))];
  var todayIds=rawTodayIds.filter(function(id){return members.find(function(m){return m.id===id;});});
  var absentToday=members.filter(function(m){return !todayIds.includes(m.id);});
  var visitorsToday=todayIds.filter(function(id){var m=members.find(function(mb){return mb.id===id;});return m&&m.originalStatus==="Visitor";}).length;
  var allVisitors=members.filter(function(m){return m.originalStatus==="Visitor";});
  var allDates=[...new Set(checkins.map(function(c){return c.date;}))].sort();
  var waRequests=members.filter(function(m){return m.wantsWhatsApp&&!m.addedToWA;});
  var lastDate=allDates[allDates.length-1]||todayDate;
  function vc(m){return visitCount(m,checkins);}
  function lc(m){return lastCheckin(m,checkins);}
  function wa(m){return weeksAgo(lc(m));}
  function absentOn(d){var ids=checkins.filter(function(c){return c.date===d;}).map(function(c){return c.memberId;});return members.filter(function(m){return !ids.includes(m.id);});}
  function updateMember(id,changes){var u=Object.assign({},data,{members:members.map(function(m){return m.id===id?Object.assign({},m,changes):m;})});setData(u);saveData(u);}
  function deleteMember(id){
    var role=localStorage.getItem("jg_admin_role")||"master";
    if(role==="senior"){alert("⚠️ Senior leaders cannot delete members.\n\nOnly Emily (Master Admin) can delete from the registration list. Please ask her if a member needs to be removed.");return;}
    var m=members.find(function(mb){return mb.id===id;});
    if(!m)return;
    if(!confirm("Permanently remove "+m.name+" "+m.surname+" and all their check-ins?"))return;
    var u={members:members.filter(function(mb){return mb.id!==id;}),checkins:checkins.filter(function(c){return c.memberId!==id;}),feedback:feedback,events:data.events||[]};
    setData(u);saveData(u);
    // Tell Google Sheets to delete this member too
    syncGoogle({type:"DELETE_MEMBER",id:id});
  }
  var [period,setPeriod]=useState("weekly");

  var t=initialTab;

  if(t==="absent")return(
    <div>
      <p className="page-title">⚠️ Absent Today</p>
      {absentToday.length===0&&<div style={{background:"#0d2818",border:"2px solid #22c55e44",borderRadius:13,padding:16}}><p className="green" style={{margin:0}}>🎉 No absentees today!</p></div>}
      {absentToday.map(function(m){
        var wk=wa(m),highlight=wk>=3;
        return(<div key={m.id} className="absent-card" style={{borderColor:highlight?"#ef4444":"#f59e0b44"}}>
          <div className="absent-info">
            <div className="absent-name">{m.name} {m.surname}{highlight&&<span style={{background:"#ef444422",color:"#f87171",borderRadius:7,padding:"2px 7px",fontSize:11,fontWeight:700,marginLeft:8}}>{wk}wks</span>}</div>
            <div className="absent-meta">📞 {m.phone||"?"} · 👨‍👩‍👦 {m.parentPhone||"?"}</div>
            <div className="absent-meta">Visits: {vc(m)} · Last: {lc(m)||"never"}</div>
          </div>
          <div className="wa-btns">
            <a href={toWA(m.whatsapp||m.phone,msgAbsent(m.name))} target="_blank" style={{display:"block",background:"#6c63ff",color:"#fff",borderRadius:9,padding:"8px 12px",fontSize:12,fontWeight:700,textDecoration:"none",textAlign:"center",marginBottom:4}}>💜 Encourage</a>
            <a href={toWA(m.parentPhone,msgParentAbsent(m.name,m.parentName))} target="_blank" style={{display:"block",background:"#be185d",color:"#fff",borderRadius:9,padding:"8px 12px",fontSize:12,fontWeight:700,textDecoration:"none",textAlign:"center"}}>❤️ Parent</a>
          </div>
        </div>);
      })}
    </div>
  );

  if(t==="suggestions")return(
    <div>
      <p className="page-title">💬 Suggestions & Requests</p>
      {feedback.length===0&&<p className="empty-msg">No feedback yet.</p>}
      {feedback.slice().reverse().map(function(fb,i){
        var cols={Games:"#3b82f6",Sports:"#22c55e",Welcome:"#ec4899",Prayer:"#8b5cf6",Advice:"#6366f1",Complaint:"#ef4444",General:"#f59e0b"};
        var icos={Games:"🎲",Sports:"⚽",Welcome:"❤️",Prayer:"🙏",Advice:"💬",Complaint:"⚠️",General:"💡"};
        var col=cols[fb.category]||"#64748b";
        return(<div key={i} style={{background:"#1e293b",borderRadius:13,padding:"14px 16px",marginBottom:10,borderLeft:"4px solid "+col}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,flexWrap:"wrap",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{icos[fb.category]}</span><span style={{fontWeight:700,color:col,fontSize:14}}>{fb.category}</span></div>
            <div style={{fontSize:12,color:"#475569"}}>{fb.date} · {fb.name}</div>
          </div>
          <p style={{margin:0,fontSize:14,color:"#cbd5e1"}}>{fb.comment}</p>
        </div>);
      })}
    </div>
  );

  if(t==="visitors")return(
    <div>
      <p className="page-title">🙋 Visitors ({allVisitors.length})</p>
      {allVisitors.length===0&&<p className="empty-msg">No visitors yet.</p>}
      {allVisitors.map(function(m){
        var visits=vc(m),status=computeStatus(m,checkins),bs=statusBadge(status);
        return(<div key={m.id} style={{background:"#1e293b",border:"2px solid #a855f722",borderRadius:13,padding:"14px 16px",marginBottom:10}}>
          <strong>{m.name} {m.surname}</strong> <span style={{background:bs.bg,color:bs.col,border:"1.5px solid "+bs.bd,borderRadius:7,padding:"2px 8px",fontSize:11,fontWeight:700,marginLeft:6}}>{status}</span>
          <div style={{fontSize:12,color:"#94a3b8",marginTop:6}}>📞 {m.phone||"?"} · 🏫 {m.school||"?"} · Visits: {visits}</div>
          {m.visitReason&&<div style={{fontSize:12,color:"#e879f9",marginTop:6,background:"#1a0a1e",padding:"4px 10px",borderRadius:8,display:"inline-block"}}>💫 {m.visitReason}</div>}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
            <a href={toWA(m.whatsapp||m.phone,msgVisitor(m.name))} target="_blank" style={{background:"#a855f7",color:"#fff",borderRadius:9,padding:"8px 14px",fontSize:13,fontWeight:700,textDecoration:"none"}}>💜 Thank You</a>
            <a href={toWA(m.whatsapp||m.phone)} target="_blank" className="btn btn-wa">💬 Chat</a>
          </div>
        </div>);
      })}
    </div>
  );

  if(t==="members")return(
    <div>
      <p className="page-title">👥 All Members ({members.length})</p>
      {sortAlpha(members).map(function(m){
        var status=computeStatus(m,checkins),bs=statusBadge(status),wk=wa(m);
        return(<div key={m.id} style={{background:"#1e293b",borderRadius:14,padding:"12px 14px",marginBottom:10,border:wk>=3?"2px solid #ef444444":"2px solid transparent"}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {m.photo?<img src={m.photo} width="40" height="40" style={{borderRadius:"50%",objectFit:"cover"}}/>:<div style={{width:40,height:40,borderRadius:"50%",background:"#334155",display:"flex",alignItems:"center",justifyContent:"center"}}>👤</div>}
            <div style={{flex:1}}>
              <strong>{m.name} {m.surname}</strong>
              <span style={{background:bs.bg,color:bs.col,border:"1.5px solid "+bs.bd,borderRadius:6,padding:"2px 7px",fontSize:10,fontWeight:700,marginLeft:6}}>{status}</span>
              <div style={{fontSize:12,color:"#94a3b8"}}>📞 {m.phone||"?"} · {vc(m)} visits{wk>=3?" · ⚠️ "+wk+"wks":""}</div>
            </div>
          </div>
        </div>);
      })}
    </div>
  );

  if(t==="contacts")return(
    <div>
      <p className="page-title">📱 Contacts (A-Z)</p>
      {sortAlpha(members).map(function(m,i){return(<div key={m.id||i} style={{background:i%2===0?"#1e293b":"#182032",borderRadius:12,padding:"12px 14px",marginBottom:6,display:"flex",flexWrap:"wrap",alignItems:"center",gap:10}}>
        <div style={{flex:1,minWidth:140}}>
          <strong>{m.name} {m.surname}</strong>
          <div style={{fontSize:12,color:"#94a3b8"}}>📞 {m.phone||"?"} · 👨‍👩‍👦 {m.parentPhone||"?"}</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <a href={toWA(m.whatsapp||m.phone)} target="_blank" className="btn btn-wa">Youth</a>
          <a href={toWA(m.parentPhone)} target="_blank" className="btn btn-wa-parent">Parent</a>
        </div>
      </div>);})}
    </div>
  );

  if(t==="wagroup")return(
    <div>
      <p className="page-title">💬 WhatsApp Group Requests</p>
      <div style={{background:"#0d2818",border:"2px solid #22c55e44",borderRadius:13,padding:"12px",marginBottom:14}}>
        <a href={WA_GROUP} target="_blank" style={{color:"#6ee7b7",fontSize:12,wordBreak:"break-all"}}>{WA_GROUP}</a>
      </div>
      {waRequests.length===0&&<p className="empty-msg">No requests.</p>}
      {waRequests.map(function(m){return(<div key={m.id} style={{background:"#1e293b",borderRadius:12,padding:"13px",marginBottom:8,display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
        <div style={{flex:1}}><strong>{m.name} {m.surname}</strong><div style={{fontSize:12,color:"#94a3b8"}}>{m.phone}</div></div>
        <a href={toWA(m.phone)} target="_blank" className="btn btn-wa">Add</a>
        <button onClick={function(){updateMember(m.id,{wantsWhatsApp:false,addedToWA:true});}} style={{background:"#334155",color:"#94a3b8",border:"none",borderRadius:9,padding:"8px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓ Added</button>
      </div>);})}
    </div>
  );

  if(t==="reports")return(
    <div>
      <p className="page-title">📊 Reports</p>
      <p style={{color:"#94a3b8",fontSize:13}}>Reports view - for the full health dashboard use Classic View.</p>
      <div style={{background:"#1e293b",borderRadius:14,padding:"14px",marginBottom:12}}>
        <div style={{fontSize:13,color:"#6ee7b7",fontWeight:700,marginBottom:8}}>Overall Stats</div>
        <div>📅 Total sessions: {allDates.length}</div>
        <div>✅ Total check-ins: {checkins.length}</div>
        <div>🙋 Total visitors: {allVisitors.length}</div>
        <div>👥 Total members: {members.length}</div>
      </div>
    </div>
  );

  if(t==="sheet")return(
    <div>
      <p className="page-title">📋 Spreadsheet</p>
      <div className="tbl-wrap">
        <table>
          <thead><tr>{["Name","Status","Visits","Phone","School","Last",...allDates].map(function(h){return <th key={h}>{h}</th>;})}</tr></thead>
          <tbody>{sortAlpha(members).map(function(m){
            var cols=allDates.map(function(d){return checkins.some(function(c){return c.memberId===m.id&&c.date===d;});});
            return(<tr key={m.id}>
              <td>{m.name} {m.surname}</td><td>{computeStatus(m,checkins)}</td><td style={{textAlign:"center"}}>{vc(m)}</td>
              <td>{m.phone||"?"}</td><td>{m.school||"?"}</td><td>{lc(m)||"?"}</td>
              {cols.map(function(p,j){return <td key={j} className={p?"tick":"cross"}>{p?"✓":"✗"}</td>;})}
            </tr>);
          })}</tbody>
        </table>
      </div>
    </div>
  );

  if(t==="export")return <ExportTab members={members} checkins={checkins} feedback={feedback}/>;
  if(t==="import")return <ImportTab data={data} setData={setData}/>;
  if(t==="qr")return <QRTab/>;
  return <p>Unknown view</p>;
}

// ADMIN DASHBOARD
function AdminDashboard({data,setData,onExit,onRefresh,syncing}){
  var [refreshTick,setRefreshTick]=useState(0);
  useEffect(function(){
    function onVis(){setRefreshTick(function(t){return t+1;});}
    window.addEventListener("jg-refresh",onVis);
    document.addEventListener("visibilitychange",onVis);
    return function(){
      window.removeEventListener("jg-refresh",onVis);
      document.removeEventListener("visibilitychange",onVis);
    };
  },[]);
  var [tab,setTab]=useState("overview");
  var [period,setPeriod]=useState("weekly");
  var members=data.members||[];
  var checkins=data.checkins||[];
  var feedback=data.feedback||[];

  var allDates=[...new Set(checkins.map(function(c){return c.date;}))].sort();
  var events=data.events||[];
  var todayDate=getActiveEventDate(events);
  // Unique member IDs who checked in on event date (avoid double counting and orphans)
  var rawTodayIds=[...new Set(checkins.filter(function(c){return c.date===todayDate;}).map(function(c){return c.memberId;}))];
  var todayIds=rawTodayIds.filter(function(id){return members.find(function(m){return m.id===id;});});
  var absentToday=members.filter(function(m){return !todayIds.includes(m.id);});
  var visitorsToday=todayIds.filter(function(id){var m=members.find(function(mb){return mb.id===id;});return m&&m.originalStatus==="Visitor";}).length;
  var lastDate=allDates[allDates.length-1]||todayDate;
  var allVisitors=members.filter(function(m){return m.originalStatus==="Visitor";});
  var waRequests=members.filter(function(m){return m.wantsWhatsApp&&!m.addedToWA;});
  var unreadFb=feedback.filter(function(f){return !f.seen;}).length;

  function absentOn(d){var ids=checkins.filter(function(c){return c.date===d;}).map(function(c){return c.memberId;});return members.filter(function(m){return !ids.includes(m.id);});}
  function vc(m){return visitCount(m,checkins);}
  function lc(m){return lastCheckin(m,checkins);}
  function wa(m){return weeksAgo(lc(m));}

  function updateMember(id,changes){var u=Object.assign({},data,{members:members.map(function(m){return m.id===id?Object.assign({},m,changes):m;})});setData(u);saveData(u);}
  function deleteMember(id){
    var role=localStorage.getItem("jg_admin_role")||"master";
    if(role==="senior"){alert("⚠️ Senior leaders cannot delete members.\n\nOnly Emily (Master Admin) can delete from the registration list. Please ask her if a member needs to be removed.");return;}
    var m=members.find(function(mb){return mb.id===id;});
    if(!m)return;
    if(!confirm("Permanently remove "+m.name+" "+m.surname+" and all their check-ins?"))return;
    var u={members:members.filter(function(mb){return mb.id!==id;}),checkins:checkins.filter(function(c){return c.memberId!==id;}),feedback:feedback,events:data.events||[]};
    setData(u);saveData(u);
    // Tell Google Sheets to delete this member too
    syncGoogle({type:"DELETE_MEMBER",id:id});
  }

  function groupSessions(){
    var g={};
    allDates.forEach(function(d){
      var key;
      if(period==="weekly"){var dt=new Date(d),day=dt.getDay(),diff=dt.getDate()-day+(day===0?-6:1);key="Wk "+new Date(dt.setDate(diff)).toISOString().slice(0,10);}
      else{var pts=d.split("-");key=new Date(+pts[0],+pts[1]-1).toLocaleString("en-ZA",{month:"long",year:"numeric"});}
      if(!g[key])g[key]=[];g[key].push(d);
    });
    return g;
  }

  var tabs=[
    {id:"overview",label:"Overview"},
    {id:"leaders",label:"👥 Leaders"},
    {id:"leader_attendance",label:"📋 Leader Log"},
    {id:"events",label:"📅 Events"},
    {id:"absent",label:"Absent",badge:absentToday.length},
    {id:"suggestions",label:"Suggestions",badge:unreadFb},
    {id:"visitors",label:"Visitors",badge:allVisitors.filter(function(m){return wa(m)<=1;}).length},
    {id:"contacts",label:"Contacts"},
    {id:"members",label:"Members"},
    {id:"wagroup",label:"WA Group",badge:waRequests.length},
    {id:"reports",label:"Reports"},
    {id:"sheet",label:"Spreadsheet"},
    {id:"export",label:"Export"},
    {id:"import",label:"Import"},
    {id:"reset",label:"⚙️ Reset"},
    {id:"qr",label:"QR Code"},
  ];

  var [dashStyle,setDashStyle]=useState(function(){return localStorage.getItem("jg_dash_style")||"classic";});
  function changeStyle(s){setDashStyle(s);localStorage.setItem("jg_dash_style",s);}

  // Popup state for tappable dashboard tiles
  var [popup,setPopup]=useState(null);

  function openPopup(type){
    var list=[],title="",color="";
    if(type==="here"){
      list=todayIds.map(function(id){return members.find(function(m){return m.id===id;});}).filter(Boolean);
      title="Here Today ("+list.length+")"; color="#22c55e";
    } else if(type==="visitors"){
      list=todayIds.map(function(id){return members.find(function(m){return m.id===id;});}).filter(function(m){return m&&m.originalStatus==="Visitor";});
      title="Visitors Today ("+list.length+")"; color="#a855f7";
    } else if(type==="absent"){
      list=sortAlpha(absentToday);
      title="Absent Today ("+list.length+")"; color="#f59e0b";
    } else if(type==="registered"){
      list=sortAlpha(members);
      title="All Registered ("+list.length+")"; color="#6c63ff";
    } else if(type==="sessions"){
      title="Sessions Held ("+allDates.length+")"; color="#3b82f6";
      list=allDates.slice().reverse().map(function(d){
        var ids=[...new Set(checkins.filter(function(c){return c.date===d;}).map(function(c){return c.memberId;}))];
        return {sessionDate:d,count:ids.length};
      });
    }
    setPopup({type:type,title:title,color:color,list:list});
  }

  function closePopup(){setPopup(null);}

  // VIBE STYLE: render completely different UI when selected
  if (dashStyle==="vibe") {
    return <VibeDashboard data={data} setData={setData} onExit={onExit} onRefresh={onRefresh} syncing={syncing} switchStyle={function(){changeStyle("classic");}}/>;
  }

  return(<div>
    {(function(){
      var role=localStorage.getItem("jg_admin_role")||"master";
      var lid=localStorage.getItem("jg_admin_leader_id");
      var lname="";
      if(lid){
        var L=JSON.parse(localStorage.getItem("jg_leaders")||"[]").find(function(x){return x.id===lid;});
        if(L)lname=L.name+" "+L.surname;
      }
      if(role==="senior")return(<div style={{background:"linear-gradient(90deg,#fbbf24,#f59e0b)",color:"#000",textAlign:"center",padding:"8px 12px",fontSize:12,fontWeight:700,marginBottom:10,borderRadius:8}}>⭐ Senior Leader: {lname} · You can message & view reports. Cannot delete (ask Emily).</div>);
      return null;
    })()}
    <div style={{textAlign:"center",marginBottom:14}}>
      <div style={{fontSize:22}}>✝</div>
      <h2 style={{margin:"2px 0 0",fontSize:17}}>Jeremiah Generation</h2>
      <p style={{color:"#6ee7b7",fontSize:12,fontWeight:600,margin:0}}>Living Waters Fellowship - Admin</p>
      <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:8,flexWrap:"wrap"}}>
        <button onClick={onRefresh} disabled={syncing} style={{background:"#1e293b",border:"1px solid #334155",color:syncing?"#475569":"#6ee7b7",borderRadius:8,padding:"5px 12px",fontSize:12,cursor:syncing?"not-allowed":"pointer",fontFamily:"inherit"}}>
          {syncing?"Loading...":"🔄 Refresh"}
        </button>
        <button onClick={function(){changeStyle("vibe");}} style={{background:"linear-gradient(135deg,#a855f7,#ec4899)",border:"none",color:"#fff",borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>
          ✨ Switch to Vibe
        </button>
      </div>
    </div>

    <div className="tabs">
      {tabs.map(function(t){return(<button key={t.id} className={"tab"+(tab===t.id?" active":"")} onClick={function(){setTab(t.id);}} style={{position:"relative"}}>
        {t.label}{t.badge>0&&<span className="badge">{t.badge}</span>}
      </button>);})}
    </div>

    {tab==="overview"&&<div>
      <p style={{color:"#64748b",fontSize:11,fontWeight:700,letterSpacing:"1px",margin:"0 0 8px"}}>TAP ANY TILE TO SEE NAMES</p>
      <div className="stats-row">
        {[
          {l:"Registered",v:members.length,c:"#6c63ff",t:"registered"},
          {l:"Here Today",v:todayIds.length,c:"#22c55e",t:"here"},
          {l:"Visitors Today",v:visitorsToday,c:"#a855f7",t:"visitors"},
          {l:"Absent Today",v:absentToday.length,c:"#f59e0b",t:"absent"},
          {l:"Sessions",v:allDates.length,c:"#3b82f6",t:"sessions"}
        ].map(function(s){return(
          <div key={s.l} className="stat-box" style={{borderTopColor:s.c,cursor:"pointer"}} onClick={function(){openPopup(s.t);}}>
            <div className="stat-num" style={{color:s.c}}>{s.v}</div>
            <div className="stat-lbl">{s.l}</div>
          </div>
        );})}
      </div>
      {absentToday.length>0&&<div style={{background:"#1e293b",border:"2px solid #f59e0b44",borderRadius:13,padding:"14px 16px",marginBottom:14}}>
        <p className="amber" style={{margin:"0 0 10px"}}>{absentToday.length} youth absent today</p>
        <button className="btn btn-check" style={{width:"auto",padding:"9px 18px",fontSize:14}} onClick={function(){setTab("absent");}}>See Absent List and WhatsApp</button>
      </div>}
      {absentToday.length===0&&members.length>0&&<div style={{background:"#0d2818",border:"2px solid #22c55e44",borderRadius:13,padding:"14px 16px"}}><p className="green" style={{margin:0}}>Everyone is present today!</p></div>}
    </div>}

    {tab==="absent"&&<div>
      <p className="page-title">Absent Today</p>
      <p style={{color:"#94a3b8",fontSize:13,marginBottom:16}}>Green = Youth WhatsApp. Yellow = Parent WhatsApp. Purple = Encouragement to youth. Pink = Concern message to parent.</p>
      {absentToday.length===0&&<div style={{background:"#0d2818",border:"2px solid #22c55e44",borderRadius:13,padding:16}}><p className="green" style={{margin:0}}>No absentees today!</p></div>}
      {absentToday.map(function(m){
        var wk=wa(m); var highlight=wk>=3;
        return(<div key={m.id} className="absent-card" style={{borderColor:highlight?"#ef4444":"#f59e0b44"}}>
          <div className="absent-info">
            {m.photo&&<img src={m.photo} width="42" height="42" style={{borderRadius:"50%",objectFit:"cover",float:"left",marginRight:10}}/>}
            <div className="absent-name">{m.name} {m.surname}{highlight&&<span style={{background:"#ef444422",color:"#f87171",borderRadius:7,padding:"2px 7px",fontSize:11,fontWeight:700,marginLeft:8}}>{wk}+ weeks absent</span>}</div>
            <div className="absent-meta">School: {m.school||"?"} | Phone: {m.phone||"?"}</div>
            <div className="absent-meta">Parent: {m.parentName||""} {m.parentSurname||""} | {m.parentPhone||"?"}</div>
            <div className="absent-meta">Total visits: {vc(m)} | Last: {lc(m)||"never"}</div>
          </div>
          <div className="wa-btns">
            {wasMessagedToday(m.id)&&<div style={{background:"#0d2818",color:"#86efac",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,textAlign:"center",marginBottom:6}}>✓ Already messaged today</div>}
            {toWA(m.whatsapp||m.phone)&&<a href={toWA(m.whatsapp||m.phone,msgAbsent(m.name))} target="_blank" onClick={function(){markMessageSent(m.id,"WA","Absent-Youth");}} style={{display:"block",background:wasMessagedToday(m.id,"WA")?"#475569":"#6c63ff",color:"#fff",borderRadius:9,padding:"7px 10px",fontSize:12,fontWeight:700,textDecoration:"none",marginBottom:4,textAlign:"center",opacity:wasMessagedToday(m.id,"WA")?0.6:1}}>{wasMessagedToday(m.id,"WA")?"✓ ":"💜 "}WhatsApp Youth</a>}
            {toSMS(m.phone)&&<a href={toSMS(m.phone,msgAbsent(m.name))} onClick={function(){markMessageSent(m.id,"SMS","Absent-Youth");}} style={{display:"block",background:wasMessagedToday(m.id,"SMS")?"#475569":"#0891b2",color:"#fff",borderRadius:9,padding:"7px 10px",fontSize:12,fontWeight:700,textDecoration:"none",marginBottom:4,textAlign:"center",opacity:wasMessagedToday(m.id,"SMS")?0.6:1}}>{wasMessagedToday(m.id,"SMS")?"✓ ":"📱 "}SMS Youth</a>}
            {toWA(m.parentPhone)&&<a href={toWA(m.parentPhone,msgParentAbsent(m.name,m.parentName))} target="_blank" onClick={function(){markMessageSent(m.id,"WA-Parent","Absent-Parent");}} style={{display:"block",background:wasMessagedToday(m.id,"WA-Parent")?"#475569":"#be185d",color:"#fff",borderRadius:9,padding:"7px 10px",fontSize:12,fontWeight:700,textDecoration:"none",marginBottom:4,textAlign:"center",opacity:wasMessagedToday(m.id,"WA-Parent")?0.6:1}}>{wasMessagedToday(m.id,"WA-Parent")?"✓ ":"❤️ "}WhatsApp Parent</a>}
            {toSMS(m.parentPhone)&&<a href={toSMS(m.parentPhone,msgParentAbsent(m.name,m.parentName))} onClick={function(){markMessageSent(m.id,"SMS-Parent","Absent-Parent");}} style={{display:"block",background:wasMessagedToday(m.id,"SMS-Parent")?"#475569":"#7c2d12",color:"#fff",borderRadius:9,padding:"7px 10px",fontSize:12,fontWeight:700,textDecoration:"none",textAlign:"center",opacity:wasMessagedToday(m.id,"SMS-Parent")?0.6:1}}>{wasMessagedToday(m.id,"SMS-Parent")?"✓ ":"📱 "}SMS Parent</a>}
            {!toWA(m.whatsapp||m.phone)&&!toSMS(m.phone)&&<span style={{fontSize:11,color:"#475569"}}>No youth number</span>}
          </div>
        </div>);
      })}
      {lastDate!==todayDate&&<div>
        <p className="section-title">Also absent last session ({lastDate}):</p>
        {absentOn(lastDate).map(function(m){return(<div key={m.id} style={{background:"#1e293b",borderRadius:12,padding:"12px 14px",marginBottom:9,display:"flex",flexWrap:"wrap",alignItems:"center",gap:10}}>
          <div style={{flex:1}}><strong>{m.name} {m.surname}</strong><div style={{fontSize:13,color:"#94a3b8"}}>Phone: {m.phone||"?"} | Parent: {m.parentPhone||"?"}</div></div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            <a href={toWA(m.whatsapp||m.phone)} target="_blank" className="btn btn-wa">Youth</a>
            <a href={toWA(m.parentPhone)} target="_blank" className="btn btn-wa-parent">Parent</a>
            <a href={toWA(m.whatsapp||m.phone,msgAbsent(m.name))} target="_blank" style={{background:"#6c63ff",color:"#fff",borderRadius:9,padding:"7px 10px",fontSize:12,fontWeight:700,textDecoration:"none"}}>Encourage</a>
            <a href={toWA(m.parentPhone,msgParentAbsent(m.name,m.parentName))} target="_blank" style={{background:"#be185d",color:"#fff",borderRadius:9,padding:"7px 10px",fontSize:12,fontWeight:700,textDecoration:"none"}}>Parent Concern</a>
          </div>
        </div>);})}
      </div>}
    </div>}

    {tab==="suggestions"&&<div>
      <p className="page-title">Suggestions and Requests</p>
      {feedback.length===0&&<p className="empty-msg">No feedback yet.</p>}
      {feedback.slice().reverse().map(function(fb,i){
        var cols={Games:"#3b82f6",Sports:"#22c55e",Welcome:"#ec4899",Prayer:"#8b5cf6",Advice:"#6366f1",Complaint:"#ef4444",General:"#f59e0b"};
        var icos={Games:"🎲",Sports:"⚽",Welcome:"❤️",Prayer:"🙏",Advice:"💬",Complaint:"⚠️",General:"💡"};
        var col=cols[fb.category]||"#64748b";
        return(<div key={i} style={{background:"#1e293b",borderRadius:13,padding:"14px 16px",marginBottom:10,borderLeft:"4px solid "+col}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6,marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{icos[fb.category]||"💡"}</span><span style={{fontWeight:700,color:col,fontSize:14}}>{fb.category}</span></div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,color:"#475569"}}>{fb.date||""}</span>
              {fb.name==="Anonymous"?<span style={{background:"#1a0a1e",color:"#e879f9",borderRadius:8,padding:"2px 9px",fontSize:11,fontWeight:700}}>Anonymous</span>:<span style={{background:"#0d2818",color:"#86efac",borderRadius:8,padding:"2px 9px",fontSize:11,fontWeight:700}}>{fb.name}</span>}
            </div>
          </div>
          <p style={{margin:0,fontSize:14,color:"#cbd5e1",lineHeight:1.5}}>{fb.comment}</p>
        </div>);
      })}
    </div>}

    {tab==="visitors"&&<div>
      <p className="page-title">Visitors</p>
      {allVisitors.length===0&&<p className="empty-msg">No visitors yet.</p>}
      {allVisitors.map(function(m,i){
        var visits=vc(m),status=computeStatus(m,checkins),bs=statusBadge(status),last=lc(m);
        return(<div key={m.id||i} style={{background:"#1e293b",border:"2px solid #a855f722",borderRadius:13,padding:"14px 16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:8}}>
            <div><strong style={{fontSize:15}}>{m.name} {m.surname}</strong><span style={{background:bs.bg,color:bs.col,border:"1.5px solid "+bs.bd,borderRadius:7,padding:"2px 8px",fontSize:11,fontWeight:700,marginLeft:8}}>{status}</span></div>
            <div style={{fontSize:12,color:"#94a3b8",textAlign:"right"}}>{visits} visit{visits!==1?"s":""}<br/>Last: {last||"never"}</div>
          </div>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:6}}>Phone: {m.phone||"?"} | School: {m.school||"?"}</div>
          {m.visitReason&&<div style={{fontSize:12,color:"#e879f9",marginBottom:10,background:"#1a0a1e",padding:"4px 10px",borderRadius:8,display:"inline-block"}}>💫 {m.visitReason}</div>}
          <div style={{marginBottom:8}}></div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <a href={toWA(m.whatsapp||m.phone,msgVisitor(m.name))} target="_blank" style={{background:"#a855f7",color:"#fff",borderRadius:9,padding:"8px 14px",fontSize:13,fontWeight:700,textDecoration:"none"}}>Thank You Message</a>
            <a href={toWA(m.whatsapp||m.phone)} target="_blank" className="btn btn-wa">Chat</a>
          </div>
        </div>);
      })}
    </div>}

    {tab==="contacts"&&<div>
      <p className="page-title">Contact List (A-Z)</p>
      {members.length===0&&<p className="empty-msg">No members yet.</p>}
      {sortAlpha(members).map(function(m,i){return(<div key={m.id||i} style={{background:i%2===0?"#1e293b":"#182032",borderRadius:12,padding:"12px 14px",marginBottom:8,display:"flex",flexWrap:"wrap",alignItems:"center",gap:10}}>
        {m.photo?<img src={m.photo} width="40" height="40" style={{borderRadius:"50%",objectFit:"cover"}}/>:<div style={{width:40,height:40,borderRadius:"50%",background:"#334155",display:"flex",alignItems:"center",justifyContent:"center"}}>👤</div>}
        <div style={{flex:1,minWidth:140}}>
          <strong>{m.name} {m.surname}</strong>
          <div style={{fontSize:12,color:"#94a3b8"}}>Phone: {m.phone||"?"}</div>
          <div style={{fontSize:12,color:"#94a3b8"}}>Parent: {m.parentName||""} {m.parentSurname||""} | {m.parentPhone||"?"}</div>
        </div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          <a href={toWA(m.whatsapp||m.phone)} target="_blank" className="btn btn-wa">Youth</a>
          <a href={toWA(m.parentPhone)} target="_blank" className="btn btn-wa-parent">Parent</a>
        </div>
      </div>);})}
    </div>}

    {tab==="members"&&<div>
      <p className="page-title">All Members ({members.length})</p>
      {members.length===0&&<p className="empty-msg">No members yet.</p>}
      {sortAlpha(members).map(function(m){
        var status=computeStatus(m,checkins),visits=vc(m),wk=wa(m),bs=statusBadge(status);
        return(<div key={m.id} style={{background:"#1e293b",borderRadius:14,padding:"14px 16px",marginBottom:12,border:wk>=3?"2px solid #ef444444":"2px solid transparent"}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:8}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              {m.photo?<img src={m.photo} width="44" height="44" style={{borderRadius:"50%",objectFit:"cover"}}/>:<div style={{width:44,height:44,borderRadius:"50%",background:"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>👤</div>}
              <div>
                <strong style={{fontSize:15}}>{m.name} {m.surname}</strong>
                {m.incomplete&&<span style={{fontSize:11,color:"#f59e0b",marginLeft:6}}>incomplete</span>}
                {wk>=3&&<span style={{fontSize:11,color:"#f87171",marginLeft:6}}>{wk}wks absent</span>}
                <br/><span style={{background:bs.bg,color:bs.col,border:"1.5px solid "+bs.bd,borderRadius:7,padding:"2px 8px",fontSize:11,fontWeight:700}}>{status}</span>
                <span style={{fontSize:12,color:"#94a3b8",marginLeft:8}}>{visits} visit{visits!==1?"s":""}</span>
              </div>
            </div>
            <button className="btn btn-danger" style={{width:"auto",padding:"6px 12px",fontSize:12}} onClick={function(){deleteMember(m.id);}}>Remove</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 16px",fontSize:12,color:"#94a3b8",marginBottom:10}}>
            <span>Age: {calcAge(m.birthday)||"?"} ({m.birthday||"?"})</span><span>School: {m.school||"?"}</span>
            <span>Phone: {m.phone||"?"}</span><span>Address: {m.address||"?"}</span>
            <span>Parent: {m.parentName||""} {m.parentSurname||""}</span><span>Parent Phone: {m.parentPhone||"?"}</span>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <a href={toWA(m.whatsapp||m.phone)} target="_blank" className="btn btn-wa">Youth</a>
            <a href={toWA(m.parentPhone)} target="_blank" className="btn btn-wa-parent">Parent</a>
            {wk>=3&&<a href={toWA(m.whatsapp||m.phone,msgAbsent(m.name))} target="_blank" style={{background:"#6c63ff",color:"#fff",borderRadius:9,padding:"7px 12px",fontSize:12,fontWeight:700,textDecoration:"none"}}>Encourage</a>}
            {wk>=3&&<a href={toWA(m.parentPhone,msgParentAbsent(m.name,m.parentName))} target="_blank" style={{background:"#be185d",color:"#fff",borderRadius:9,padding:"7px 12px",fontSize:12,fontWeight:700,textDecoration:"none"}}>Parent Concern</a>}
          </div>
        </div>);
      })}
    </div>}

    {tab==="wagroup"&&<div>
      <p className="page-title">WhatsApp Group Requests</p>
      <div style={{background:"#0d2818",border:"2px solid #22c55e44",borderRadius:13,padding:"12px 14px",marginBottom:16}}>
        <p style={{margin:"0 0 6px",fontWeight:700,color:"#86efac",fontSize:13}}>Group Link:</p>
        <a href={WA_GROUP} target="_blank" style={{color:"#6ee7b7",fontSize:12,wordBreak:"break-all"}}>{WA_GROUP}</a>
      </div>
      {waRequests.length===0&&<p className="empty-msg">No requests yet.</p>}
      {waRequests.map(function(m,i){return(<div key={m.id||i} style={{background:"#1e293b",borderRadius:12,padding:"13px 15px",marginBottom:9,display:"flex",flexWrap:"wrap",alignItems:"center",gap:10}}>
        <div style={{flex:1}}><strong>{m.name} {m.surname}</strong><div style={{fontSize:13,color:"#94a3b8"}}>Phone: {m.phone||"?"}</div></div>
        <div style={{display:"flex",gap:7}}>
          <a href={toWA(m.phone)} target="_blank" className="btn btn-wa">Add to Group</a>
          <button onClick={function(){updateMember(m.id,{wantsWhatsApp:false,addedToWA:true});}} style={{background:"#334155",color:"#94a3b8",border:"none",borderRadius:9,padding:"8px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Mark Added</button>
        </div>
      </div>);})}
    </div>}

    {tab==="reports"&&<div>
      <p className="page-title">Reports</p>

      {/* Health snapshot */}
      {(function(){
        var totalSessions=allDates.length;
        var overallRate=members.length&&totalSessions?Math.round((checkins||[]).length/(members.length*totalSessions)*100):0;
        var critical=members.filter(function(m){var l=lc(m);return !l||Math.floor((new Date()-new Date(l))/(7*24*60*60*1000))>=6;}).length;
        var warn=members.filter(function(m){var l=lc(m);if(!l)return false;var w=Math.floor((new Date()-new Date(l))/(7*24*60*60*1000));return w>=3&&w<6;}).length;
        var visitors=members.filter(function(m){return m.originalStatus==="Visitor";});
        var converted=visitors.filter(function(m){return computeStatus(m,checkins)==="Member";}).length;
        var health=overallRate>=70&&critical===0?"THRIVING":overallRate>=50&&critical<=2?"GROWING":"NEEDS ATTENTION";
        var healthColor=health==="THRIVING"?"#22c55e":health==="GROWING"?"#f59e0b":"#ef4444";
        return(
          <div style={{background:"#1e293b",border:"2px solid "+healthColor+"44",borderRadius:14,padding:"16px",marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <div>
                <p style={{margin:0,fontSize:13,color:"#94a3b8"}}>Unit Health Status</p>
                <p style={{margin:0,fontSize:22,fontWeight:900,color:healthColor}}>{health}</p>
              </div>
              <div style={{textAlign:"right"}}>
                <p style={{margin:0,fontSize:28,fontWeight:900,color:healthColor}}>{overallRate}%</p>
                <p style={{margin:0,fontSize:12,color:"#94a3b8"}}>Overall Attendance</p>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[
                {l:"Critical (6+wks)",v:critical,c:critical>0?"#ef4444":"#22c55e"},
                {l:"Warning (3+wks)",v:warn,c:warn>0?"#f59e0b":"#22c55e"},
                {l:"Visitors Converted",v:converted+"/"+visitors.length,c:"#a855f7"},
              ].map(function(s){return(
                <div key={s.l} style={{background:"#0f172a",borderRadius:10,padding:"10px",textAlign:"center"}}>
                  <div style={{fontSize:18,fontWeight:900,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:10,color:"#64748b",marginTop:2}}>{s.l}</div>
                </div>
              );})}
            </div>
          </div>
        );
      })()}

      <div style={{display:"flex",gap:10,marginBottom:18}}>
        {["weekly","monthly"].map(function(p){return(<button key={p} className={"tab"+(period===p?" active":"")} onClick={function(){setPeriod(p);}}>{p==="weekly"?"Weekly":"Monthly"}</button>);})}
      </div>
      {Object.entries(groupSessions()).reverse().map(function(entry){
        var label=entry[0],dates=entry[1];
        var presentIds=[...new Set(checkins.filter(function(c){return dates.includes(c.date);}).map(function(c){return c.memberId;}))];
        var absentList=sortAlpha(members.filter(function(m){return !presentIds.includes(m.id);}));
        var visitorsPresent=presentIds.filter(function(id){var m=members.find(function(mb){return mb.id===id;});return m&&m.originalStatus==="Visitor";});
        var pct=members.length?Math.round(presentIds.length/members.length*100):0;
        return(<div key={label} className="report-card">
          <div className="report-header"><span className="report-label">{label}</span><span className="report-pct" style={{color:pctColor(pct)}}>{pct}%</span></div>
          <div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:12,color:"#94a3b8",margin:"0 0 10px"}}>
            <span>{dates.length} session(s) | {presentIds.length}/{members.length} attended</span>
            <span style={{color:"#e879f9"}}>{visitorsPresent.length} visitors</span>
          </div>
          {absentList.length===0?<p className="green" style={{margin:0}}>Full attendance!</p>
            :absentList.map(function(m){
              var wk=wa(m),vc_=vc(m);
              return(<div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #334155",flexWrap:"wrap",gap:8}}>
                <div>
                  <span style={{fontSize:13,color:wk>=3?"#f87171":"#cbd5e1"}}>{m.name} {m.surname}</span>
                  {wk>=3&&<span style={{fontSize:11,color:"#f87171",marginLeft:6}}>{wk}wks absent</span>}
                  <span style={{fontSize:12,color:"#475569",marginLeft:6}}>{vc_} total visits</span>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <a href={toWA(m.whatsapp||m.phone)} target="_blank" className="btn btn-wa" style={{fontSize:11,padding:"4px 8px"}}>Youth</a>
                  <a href={toWA(m.parentPhone)} target="_blank" className="btn btn-wa-parent" style={{fontSize:11,padding:"4px 8px"}}>Parent</a>
                  {wk>=3&&<a href={toWA(m.whatsapp||m.phone,msgAbsent(m.name))} target="_blank" style={{background:"#6c63ff",color:"#fff",borderRadius:7,padding:"4px 8px",fontSize:11,fontWeight:700,textDecoration:"none"}}>Encourage</a>}
                  {wk>=3&&<a href={toWA(m.parentPhone,msgParentAbsent(m.name,m.parentName))} target="_blank" style={{background:"#be185d",color:"#fff",borderRadius:7,padding:"4px 8px",fontSize:11,fontWeight:700,textDecoration:"none"}}>Parent</a>}
                </div>
              </div>);
            })
          }
        </div>);
      })}
      {allDates.length===0&&<p className="empty-msg">No sessions yet.</p>}
    </div>}

    {tab==="export"&&<ExportTab members={members} checkins={checkins} feedback={feedback}/>}

    {tab==="sheet"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <p className="page-title" style={{margin:0}}>Spreadsheet View</p>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead><tr>{["Name","Surname","Status","Age","Visits","Phone","School","Last",...allDates].map(function(h){return <th key={h}>{h}</th>;})}</tr></thead>
          <tbody>
            {sortAlpha(members).map(function(m){
              var status=computeStatus(m,checkins),bs=statusBadge(status);
              var cols=allDates.map(function(d){return checkins.some(function(c){return c.memberId===m.id&&c.date===d;});});
              var wk=wa(m);
              return(<tr key={m.id} style={{background:wk>=3?"#1a0505":""}}>
                <td>{m.name}</td><td>{m.surname}</td>
                <td><span style={{background:bs.bg,color:bs.col,border:"1px solid "+bs.bd,borderRadius:6,padding:"2px 6px",fontSize:11,fontWeight:700}}>{status}</span></td>
                <td style={{textAlign:"center"}}>{calcAge(m.birthday)||"?"}</td>
                <td style={{textAlign:"center"}}>{vc(m)}</td>
                <td>{m.phone||"?"}</td>
                <td style={{maxWidth:90,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.school||"?"}</td>
                <td>{lc(m)||"?"}</td>
                {cols.map(function(present,j){return <td key={j} className={present?"tick":"cross"}>{present?"✓":"✗"}</td>;})}
              </tr>);
            })}
          </tbody>
        </table>
        {members.length===0&&<p className="empty-msg" style={{marginTop:16}}>No members yet.</p>}
      </div>
    </div>}

    {tab==="leaders"&&<LeadersTab/>}

    {tab==="leader_attendance"&&<LeaderAttendanceTab/>}

    {tab==="events"&&<EventsTab data={data} setData={setData}/>}

    {tab==="reset"&&<ResetTab data={data} setData={setData}/>}

    {tab==="import"&&<ImportTab data={data} setData={setData}/>}

    {tab==="qr"&&<QRTab/>}

    <div style={{marginTop:28}}><button className="btn btn-admin" onClick={onExit}>Exit Admin</button></div>

    {/* Tappable dashboard popup */}
    {popup&&(
      <div onClick={closePopup} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:9999,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
        <div onClick={function(e){e.stopPropagation();}} style={{background:"#0f172a",borderTopLeftRadius:24,borderTopRightRadius:24,maxHeight:"85vh",width:"100%",maxWidth:600,overflowY:"auto",borderTop:"4px solid "+popup.color}}>
          <div style={{padding:"20px 20px 12px",position:"sticky",top:0,background:"#0f172a",borderBottom:"1px solid #1e293b",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h3 style={{margin:0,color:popup.color,fontSize:17}}>{popup.title}</h3>
            <button onClick={closePopup} style={{background:"#1e293b",border:"none",color:"#94a3b8",borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✕ Close</button>
          </div>
          <div style={{padding:"12px 16px 30px"}}>
            {popup.list.length===0&&<p style={{color:"#64748b",textAlign:"center",padding:20}}>No one here.</p>}
            {popup.type==="sessions"&&popup.list.map(function(s,i){return(
              <div key={i} style={{background:"#1e293b",borderRadius:10,padding:"12px 14px",marginBottom:6,display:"flex",justifyContent:"space-between"}}>
                <span style={{color:"#cbd5e1",fontWeight:600}}>{s.sessionDate}</span>
                <span style={{color:"#86efac"}}>{s.count} attended</span>
              </div>
            );})}
            {popup.type!=="sessions"&&popup.list.map(function(m){
              if(!m)return null;
              var status=computeStatus(m,checkins);
              var bs=statusBadge(status);
              var visits=visitCount(m,checkins);
              return(
                <div key={m.id} style={{background:"#1e293b",borderRadius:12,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
                  {m.photo
                    ?<img src={m.photo} width="44" height="44" style={{borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>
                    :<div style={{width:44,height:44,borderRadius:"50%",background:"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>👤</div>
                  }
                  <div style={{flex:1,minWidth:0}}>
                    <strong style={{fontSize:14,color:"#e2e8f0"}}>{m.name} {m.surname}</strong>
                    <div style={{fontSize:12,color:"#94a3b8"}}>
                      <span style={{background:bs.bg,color:bs.col,border:"1px solid "+bs.bd,borderRadius:6,padding:"1px 6px",fontSize:10,fontWeight:700,marginRight:6}}>{status}</span>
                      {visits} visit{visits!==1?"s":""} · {m.school||"—"}
                    </div>
                    {popup.type==="visitors"&&m.visitReason&&<div style={{fontSize:11,color:"#e879f9",marginTop:2}}>💫 {m.visitReason}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}
  </div>);
}

// EXPORT TAB
function ExportTab({members,checkins,feedback}){
  var [status,setStatus]=useState("");

  function doXL(){
    setStatus("Preparing Excel file with 6 sheets...");
    exportXL(members,checkins,feedback);
    setTimeout(function(){setStatus("Excel downloaded! Check your Downloads folder.");setTimeout(function(){setStatus("");},5000);},1000);
  }

  function doPDF(){
    setStatus("Preparing PDF report...");
    exportPDF(members,checkins,feedback);
    setTimeout(function(){setStatus("PDF print dialog opened!");setTimeout(function(){setStatus("");},5000);},1000);
  }

  var totalVisits=(checkins||[]).length;
  var avgVisits=members.length?Math.round(totalVisits/members.length*10)/10:0;
  var datesSet=[...new Set((checkins||[]).map(function(c){return c.date;}))];

  return(<div>
    <p className="page-title">Export Data</p>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
      <div style={{background:"#1e293b",borderRadius:14,padding:"16px",textAlign:"center"}}>
        <div style={{fontSize:28,fontWeight:900,color:"#22c55e"}}>{members.length}</div>
        <div style={{fontSize:12,color:"#94a3b8",marginTop:3}}>Total Members</div>
      </div>
      <div style={{background:"#1e293b",borderRadius:14,padding:"16px",textAlign:"center"}}>
        <div style={{fontSize:28,fontWeight:900,color:"#3b82f6"}}>{datesSet.length}</div>
        <div style={{fontSize:12,color:"#94a3b8",marginTop:3}}>Sessions Recorded</div>
      </div>
      <div style={{background:"#1e293b",borderRadius:14,padding:"16px",textAlign:"center"}}>
        <div style={{fontSize:28,fontWeight:900,color:"#f59e0b"}}>{totalVisits}</div>
        <div style={{fontSize:12,color:"#94a3b8",marginTop:3}}>Total Check-ins</div>
      </div>
      <div style={{background:"#1e293b",borderRadius:14,padding:"16px",textAlign:"center"}}>
        <div style={{fontSize:28,fontWeight:900,color:"#a855f7"}}>{avgVisits}</div>
        <div style={{fontSize:12,color:"#94a3b8",marginTop:3}}>Avg Visits / Member</div>
      </div>
    </div>

    {status&&<div style={{background:status.includes("Error")?"#1a0505":"#0d2818",border:"2px solid "+(status.includes("Error")?"#ef4444":"#22c55e"),borderRadius:12,padding:"12px 16px",marginBottom:16,fontWeight:700,color:status.includes("Error")?"#f87171":"#86efac",fontSize:14}}>
      {status.includes("Error")?"":"✅ "}{status}
    </div>}

    <div style={{background:"#1e293b",border:"2px solid #22c55e44",borderRadius:14,padding:"18px",marginBottom:14}}>
      <div style={{fontSize:32,marginBottom:8,textAlign:"center"}}>📊</div>
      <p style={{margin:"0 0 6px",fontWeight:700,color:"#86efac",fontSize:16,textAlign:"center"}}>Download as Excel (6 Sheets)</p>
      <div style={{marginBottom:14}}>
        {[
          {name:"Health Dashboard",desc:"Overall health score, attendance rate, alerts, feedback summary"},
          {name:"Full Attendance",desc:"Every member x every session - YES/NO grid with totals"},
          {name:"Absenteeism",desc:"Sorted by absence rate with alert levels: CRITICAL / WARNING / MONITOR"},
          {name:"Visitor Tracking",desc:"All visitors, first visit, total visits, conversion to member"},
          {name:"Weekly Trends",desc:"Week-by-week attendance with Improving/Stable/Declining trend"},
          {name:"Feedback & Comments",desc:"All suggestions, prayer requests and complaints by date"},
        ].map(function(s,i){return(
          <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid #334155"}}>
            <span style={{color:"#6c63ff",fontWeight:700,fontSize:12,minWidth:20}}>{i+1}.</span>
            <div><span style={{color:"#e2e8f0",fontWeight:600,fontSize:12}}>{s.name}</span><br/><span style={{color:"#64748b",fontSize:11}}>{s.desc}</span></div>
          </div>
        );})}
      </div>
      <button className="btn btn-reg" onClick={doXL} style={{fontSize:15}}>Download Excel Report (.xlsx)</button>
    </div>

    <div style={{background:"#1e293b",border:"2px solid #3b82f644",borderRadius:14,padding:"18px"}}>
      <div style={{fontSize:32,marginBottom:8,textAlign:"center"}}>📄</div>
      <p style={{margin:"0 0 6px",fontWeight:700,color:"#93c5fd",fontSize:16,textAlign:"center"}}>Download as PDF</p>
      <p style={{margin:"0 0 14px",fontSize:13,color:"#94a3b8",textAlign:"center"}}>Formatted report for printing. Opens print dialog - choose Save as PDF or Print.</p>
      <button onClick={doPDF} style={{width:"100%",background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Download PDF Report</button>
    </div>
  </div>);
}

// QR TAB - with share and copy link
function QRTab(){
  var url="https://senoskyjj-beep.github.io/JG-Youth-Attendance-report";
  var [copied,setCopied]=useState(false);

  function copyLink(){
    if(navigator.clipboard){
      navigator.clipboard.writeText(url).then(function(){
        setCopied(true);setTimeout(function(){setCopied(false);},2000);
      });
    } else {
      // Fallback for older browsers
      var ta=document.createElement("textarea");ta.value=url;document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);
      setCopied(true);setTimeout(function(){setCopied(false);},2000);
    }
  }

  function shareLink(){
    if(navigator.share){
      navigator.share({title:"Jeremiah Generation Check-In",text:"Scan or tap this link to register and check in at Jeremiah Generation!",url:url});
    } else {
      copyLink();
    }
  }

  return(<div>
    <p className="page-title">QR Code for Entrance</p>
    <p style={{color:"#94a3b8",fontSize:13,marginBottom:18}}>Print the QR code, share the link, or copy it to send via WhatsApp.</p>

    <div className="qr-box">
      <img src={"https://api.qrserver.com/v1/create-qr-code/?size=240x240&data="+encodeURIComponent(url)} alt="QR" width={240} height={240} style={{borderRadius:12}}/>
      <div className="qr-url">{url}</div>
      <div style={{color:"#6c63ff",fontWeight:700,fontSize:13}}>Scan with any phone camera</div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:16,marginBottom:10}}>
      <button className="btn btn-reg" onClick={shareLink} style={{fontSize:14}}>
        Share Link
      </button>
      <button className="btn btn-check" onClick={copyLink} style={{fontSize:14}}>
        {copied?"Copied!":"Copy Link"}
      </button>
    </div>

    <div style={{background:"#1e293b",border:"2px solid #334155",borderRadius:12,padding:"14px",marginBottom:14}}>
      <p style={{margin:"0 0 8px",fontWeight:700,fontSize:13,color:"#e2e8f0"}}>Send via WhatsApp</p>
      <p style={{margin:"0 0 10px",fontSize:13,color:"#94a3b8"}}>Tap below to share the check-in link with your youth group directly.</p>
      <a href={"https://wa.me/?text="+encodeURIComponent("Hi! Here is the Jeremiah Generation Friday Check-In link. Tap to register or check in: "+url)}
        target="_blank"
        style={{display:"block",background:"#22c55e",color:"#fff",borderRadius:12,padding:"13px",fontSize:15,fontWeight:700,textDecoration:"none",textAlign:"center"}}>
        Share on WhatsApp
      </a>
    </div>

    <button className="btn btn-check" style={{width:"auto",padding:"11px 24px"}} onClick={function(){window.print();}}>Print QR Code</button>
  </div>);
}

// ── LEADER ATTENDANCE LOG TAB ───────────────────────────────
function LeaderAttendanceTab(){
  var leaders=JSON.parse(localStorage.getItem("jg_leaders")||"[]");
  var attendance=JSON.parse(localStorage.getItem("leader_attendance")||"[]");
  // Group by date
  var byDate={};
  attendance.forEach(function(a){
    if(!byDate[a.date])byDate[a.date]=[];
    byDate[a.date].push(a);
  });
  var dates=Object.keys(byDate).sort().reverse();

  // Per-leader stats
  var stats=leaders.map(function(L){
    var visits=attendance.filter(function(a){return a.leaderId===L.id;});
    return {leader:L,count:visits.length,lastVisit:visits.length>0?visits.sort(function(a,b){return b.date.localeCompare(a.date);})[0].date:null};
  }).sort(function(a,b){return b.count-a.count;});

  return(<div>
    <p className="page-title">📋 Leader Attendance Log</p>
    <p style={{color:"#94a3b8",fontSize:13,marginBottom:14}}>Track who is present at each Friday and event.</p>

    {leaders.length===0&&<p className="empty-msg">No leaders registered. Add them in the Leaders tab first.</p>}

    {leaders.length>0&&(<div style={{marginBottom:24}}>
      <p style={{color:"#a5b4fc",fontSize:12,fontWeight:700,letterSpacing:"1.5px",marginBottom:10}}>LEADER STATS</p>
      {stats.map(function(s){
        var L=s.leader;
        return(<div key={L.id} style={{background:"#1e293b",borderRadius:12,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
          {L.photo?<img src={L.photo} width="40" height="40" style={{borderRadius:"50%",objectFit:"cover"}}/>:<div style={{width:40,height:40,borderRadius:"50%",background:"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{L.role==="Senior"?"⭐":"🌱"}</div>}
          <div style={{flex:1}}>
            <strong style={{fontSize:14,color:"#e2e8f0"}}>{L.name} {L.surname}</strong>
            <div style={{fontSize:12,color:"#94a3b8"}}>{L.role} Leader · {s.count} attendance{s.count!==1?"s":""}</div>
            {s.lastVisit&&<div style={{fontSize:11,color:"#64748b"}}>Last: {s.lastVisit}</div>}
          </div>
          <div style={{fontSize:22,fontWeight:900,color:s.count>0?"#86efac":"#475569"}}>{s.count}</div>
        </div>);
      })}
    </div>)}

    {dates.length>0&&(<div>
      <p style={{color:"#a5b4fc",fontSize:12,fontWeight:700,letterSpacing:"1.5px",marginBottom:10}}>BY DATE</p>
      {dates.map(function(d){
        var dt=new Date(d+"T00:00:00");
        var dayName=dt.toLocaleDateString("en-ZA",{weekday:"long",day:"numeric",month:"short",year:"numeric"});
        return(<div key={d} style={{background:"#1e293b",borderRadius:13,padding:"14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:6}}>
            <strong style={{color:"#86efac",fontSize:14}}>{dayName}</strong>
            <span style={{color:"#a5b4fc",fontSize:13,fontWeight:700}}>{byDate[d].length} present</span>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {byDate[d].map(function(a,i){
              var L=leaders.find(function(x){return x.id===a.leaderId;});
              return <span key={i} style={{background:L&&L.role==="Senior"?"#fbbf2422":"#22c55e22",color:L&&L.role==="Senior"?"#fde68a":"#86efac",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600}}>{a.leaderName} {L&&L.role==="Senior"?"⭐":"🌱"}</span>;
            })}
          </div>
        </div>);
      })}
    </div>)}
  </div>);
}

// ── LEADERS TAB ─────────────────────────────────────────────
function LeadersTab(){
  var [leaders,setLeaders]=useState(function(){return JSON.parse(localStorage.getItem("jg_leaders")||"[]");});
  var [showForm,setShowForm]=useState(false);
  var [editing,setEditing]=useState(null);
  var blank={name:"",surname:"",phone:"",role:"Junior",notes:"",photo:null};
  var [form,setForm]=useState(blank);
  var [showLog,setShowLog]=useState(null);

  function saveLeaders(arr){
    setLeaders(arr);
    localStorage.setItem("jg_leaders",JSON.stringify(arr));
  }

  function nextPin(){
    // Find next available PIN starting from 20261
    var existing=leaders.map(function(L){return parseInt(L.pin.slice(4))||0;});
    var maxN=existing.length>0?Math.max(...existing):0;
    return "2026"+(maxN+1);
  }

  function saveLeader(){
    if(!form.name||!form.surname){alert("Please enter name and surname.");return;}
    if(editing){
      var u=leaders.map(function(L){return L.id===editing?Object.assign({},form,{id:editing,pin:L.pin}):L;});
      saveLeaders(u);
    } else {
      var newLeader=Object.assign({},form,{id:"L"+Date.now(),pin:nextPin(),addedOn:todayStr()});
      saveLeaders(leaders.concat([newLeader]));
    }
    setShowForm(false);setForm(blank);setEditing(null);
  }

  function deleteLeader(id){
    if(!confirm("Remove this leader?"))return;
    saveLeaders(leaders.filter(function(L){return L.id!==id;}));
  }

  function editLeader(L){setForm(L);setEditing(L.id);setShowForm(true);}

  function getLoginLog(leaderId){
    var logs=[];
    Object.keys(localStorage).forEach(function(k){
      if(k.startsWith("jg_login_log_")){
        try{
          var entry=JSON.parse(localStorage.getItem(k));
          if(entry.leaderId===leaderId)logs.push(entry);
        }catch(e){}
      }
    });
    return logs.sort(function(a,b){return new Date(b.date)-new Date(a.date);});
  }

  if(showLog){
    var L=leaders.find(function(x){return x.id===showLog;});
    var logs=getLoginLog(showLog);
    return(<div>
      <button onClick={function(){setShowLog(null);}} className="btn btn-admin" style={{marginBottom:14}}>← Back to Leaders</button>
      <p className="page-title">📋 Login Log: {L.name} {L.surname}</p>
      <p style={{color:"#94a3b8",fontSize:13,marginBottom:14}}>Total logins: {logs.length}</p>
      {logs.length===0&&<p className="empty-msg">No login records yet.</p>}
      {logs.map(function(entry,i){
        var d=new Date(entry.date);
        return(<div key={i} style={{background:"#1e293b",borderRadius:10,padding:"10px 14px",marginBottom:6}}>
          <div style={{color:"#e2e8f0",fontWeight:600,fontSize:13}}>{d.toLocaleDateString("en-ZA",{weekday:"long",day:"numeric",month:"short",year:"numeric"})}</div>
          <div style={{color:"#94a3b8",fontSize:12}}>at {d.toLocaleTimeString("en-ZA")}</div>
        </div>);
      })}
    </div>);
  }

  if(showForm){
    return(<div>
      <p className="page-title">{editing?"Edit Leader":"➕ Register New Leader"}</p>
      <p style={{color:"#94a3b8",fontSize:13,marginBottom:14}}>Leaders are stored locally on this device only — not in Google Sheets.</p>
      <div style={{background:"#1e293b",borderRadius:13,padding:"16px"}}>
        <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:4}}>First Name *</label>
        <input className="input" value={form.name} onChange={function(e){setForm(Object.assign({},form,{name:e.target.value}));}}/>

        <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:4}}>Surname *</label>
        <input className="input" value={form.surname} onChange={function(e){setForm(Object.assign({},form,{surname:e.target.value}));}}/>

        <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:4}}>Phone Number</label>
        <input className="input" type="tel" value={form.phone} onChange={function(e){setForm(Object.assign({},form,{phone:e.target.value}));}}/>

        <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:4}}>Leader Role *</label>
        <select className="input" style={{background:"#0f172a",color:"#fff"}} value={form.role} onChange={function(e){setForm(Object.assign({},form,{role:e.target.value}));}}>
          <option value="Senior">⭐ Senior Leader (admin access)</option>
          <option value="Junior">🌱 Junior Leader (no admin access)</option>
        </select>
        <p style={{fontSize:11,color:"#64748b",marginTop:-8,marginBottom:12}}>
          {form.role==="Senior"?"Senior leaders can log in to admin with their PIN.":"Junior leaders are tracked but cannot access admin."}
        </p>

        <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:4}}>Notes (optional)</label>
        <textarea className="input" style={{height:60,resize:"none"}} value={form.notes} onChange={function(e){setForm(Object.assign({},form,{notes:e.target.value}));}}/>

        <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:8}}>Profile Photo</label>
        <input type="file" accept="image/*" capture="user" id="leader-selfie" style={{display:"none"}}
          onChange={function(e){
            if(e.target.files[0]){
              var reader=new FileReader();
              reader.onload=function(ev){
                var img=new Image();
                img.onload=function(){
                  var canvas=document.createElement("canvas");
                  canvas.width=img.width; canvas.height=img.height;
                  var ctx=canvas.getContext("2d");
                  ctx.translate(img.width,0); ctx.scale(-1,1);
                  ctx.drawImage(img,0,0);
                  setForm(Object.assign({},form,{photo:canvas.toDataURL("image/jpeg",0.85)}));
                };
                img.src=ev.target.result;
              };
              reader.readAsDataURL(e.target.files[0]);
            }
          }}/>
        {!form.photo?(
          <div onClick={function(){document.getElementById("leader-selfie").click();}} style={{background:"#0f172a",border:"2px dashed #6c63ff",borderRadius:14,padding:"22px",textAlign:"center",cursor:"pointer",marginBottom:12}}>
            <div style={{fontSize:36,marginBottom:6}}>📸</div>
            <p style={{color:"#6c63ff",fontWeight:700,fontSize:14,margin:0}}>Tap to Take Selfie</p>
          </div>
        ):(
          <div style={{textAlign:"center",marginBottom:12}}>
            <img src={form.photo} width="80" height="80" style={{borderRadius:"50%",objectFit:"cover",border:"3px solid #fbbf24"}}/>
            <button type="button" onClick={function(){document.getElementById("leader-selfie").click();}} style={{display:"block",margin:"6px auto 0",background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:8,padding:"5px 12px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Retake</button>
          </div>
        )}

        {editing&&<p style={{color:"#a5b4fc",fontSize:13,marginBottom:10}}>PIN cannot be changed: <strong>{leaders.find(function(L){return L.id===editing;}).pin}</strong></p>}
        {!editing&&<p style={{color:"#a5b4fc",fontSize:13,marginBottom:10}}>Auto-generated PIN: <strong>{nextPin()}</strong></p>}

        <button className="btn btn-reg" onClick={saveLeader}>{editing?"Update Leader":"Register Leader"}</button>
        <button className="btn btn-admin" onClick={function(){setShowForm(false);setForm(blank);setEditing(null);}}>Cancel</button>
      </div>
    </div>);
  }

  var seniors=leaders.filter(function(L){return L.role==="Senior";});
  var juniors=leaders.filter(function(L){return L.role==="Junior";});

  return(<div>
    <p className="page-title">👥 Leaders ({leaders.length})</p>
    <p style={{color:"#94a3b8",fontSize:13,marginBottom:14}}>Manage leaders and track their attendance. PINs auto-generate as 20261, 20262, etc.</p>

    <button className="btn btn-reg" style={{marginBottom:18}} onClick={function(){setShowForm(true);setForm(blank);setEditing(null);}}>
      ➕ Register New Leader
    </button>

    {seniors.length>0&&(<div style={{marginBottom:18}}>
      <p style={{color:"#fbbf24",fontSize:12,fontWeight:700,letterSpacing:"1.5px",marginBottom:10}}>⭐ SENIOR LEADERS (admin access)</p>
      {seniors.map(function(L){
        var loginCount=getLoginLog(L.id).length;
        return(<div key={L.id} style={{background:"linear-gradient(135deg,#1e293b,#1e1b4b)",border:"2px solid #fbbf2444",borderRadius:13,padding:"14px 16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:6}}>
            <div style={{flex:1,minWidth:160}}>
              <strong style={{fontSize:15,color:"#fde68a"}}>{L.name} {L.surname}</strong>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>📞 {L.phone||"—"}</div>
              <div style={{fontSize:13,color:"#a5b4fc",marginTop:6,fontWeight:700}}>🔑 PIN: {L.pin}</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:4}}>{loginCount} login{loginCount!==1?"s":""} recorded</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <button onClick={function(){setShowLog(L.id);}} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>📋 Logins</button>
              <button onClick={function(){editLeader(L);}} style={{background:"#334155",color:"#cbd5e1",border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✏️ Edit</button>
              <button onClick={function(){deleteLeader(L.id);}} style={{background:"#7f1d1d",color:"#fecaca",border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🗑</button>
            </div>
          </div>
          {L.notes&&<p style={{fontSize:12,color:"#94a3b8",margin:"8px 0 0",fontStyle:"italic"}}>{L.notes}</p>}
        </div>);
      })}
    </div>)}

    {juniors.length>0&&(<div>
      <p style={{color:"#86efac",fontSize:12,fontWeight:700,letterSpacing:"1.5px",marginBottom:10}}>🌱 JUNIOR LEADERS (no admin access)</p>
      {juniors.map(function(L){return(<div key={L.id} style={{background:"#1e293b",border:"2px solid #22c55e22",borderRadius:13,padding:"12px 14px",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:6}}>
          <div style={{flex:1,minWidth:160}}>
            <strong style={{fontSize:14,color:"#86efac"}}>{L.name} {L.surname}</strong>
            <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>📞 {L.phone||"—"}</div>
            <div style={{fontSize:11,color:"#64748b",marginTop:2}}>PIN: {L.pin} (no admin)</div>
          </div>
          <div style={{display:"flex",gap:5}}>
            <button onClick={function(){editLeader(L);}} style={{background:"#334155",color:"#cbd5e1",border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✏️</button>
            <button onClick={function(){deleteLeader(L.id);}} style={{background:"#7f1d1d",color:"#fecaca",border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🗑</button>
          </div>
        </div>
      </div>);})}
    </div>)}

    {leaders.length===0&&<p className="empty-msg">No leaders registered yet. Tap "Register New Leader" above.</p>}
  </div>);
}

// ── EVENTS TAB ──────────────────────────────────────────────
function EventsTab({data,setData}){
  var events=data.events||[];
  var [showForm,setShowForm]=useState(false);
  var [editing,setEditing]=useState(null);
  var blank={title:"",date:"",time:"",location:"",description:"",type:"Friday Youth"};
  var [form,setForm]=useState(blank);

  function saveEvent(){
    if(!form.title||!form.date){alert("Please enter at least a title and date.");return;}
    var newEvents;
    if(editing){
      newEvents=events.map(function(e){return e.id===editing?Object.assign({},form,{id:editing}):e;});
    } else {
      newEvents=events.concat([Object.assign({},form,{id:"ev_"+Date.now()})]);
    }
    var u=Object.assign({},data,{events:newEvents});
    setData(u);saveData(u);
    setShowForm(false);setEditing(null);setForm(blank);
  }

  function deleteEvent(id){
    if(!confirm("Delete this event?"))return;
    var u=Object.assign({},data,{events:events.filter(function(e){return e.id!==id;})});
    setData(u);saveData(u);
  }

  function editEvent(e){
    setForm(e);setEditing(e.id);setShowForm(true);
  }

  // Sort events - upcoming first, then past
  var now=new Date();
  var upcoming=events.filter(function(e){return new Date(e.date)>=now;}).sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  var past=events.filter(function(e){return new Date(e.date)<now;}).sort(function(a,b){return new Date(b.date)-new Date(a.date);});

  if(showForm){
    return(<div>
      <p className="page-title">{editing?"Edit Event":"➕ New Event"}</p>
      <p style={{color:"#94a3b8",fontSize:13,marginBottom:16}}>When this event happens, attendance counts start at zero.</p>
      <div style={{background:"#1e293b",borderRadius:13,padding:"16px"}}>
        <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:4}}>Event Title *</label>
        <input className="input" placeholder="e.g. Youth Camp, Movie Night" value={form.title} onChange={function(e){setForm(Object.assign({},form,{title:e.target.value}));}}/>

        <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:4}}>Date *</label>
        <input className="input" type="date" value={form.date} onChange={function(e){setForm(Object.assign({},form,{date:e.target.value}));}}/>

        <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:4}}>Time</label>
        <input className="input" type="time" value={form.time} onChange={function(e){setForm(Object.assign({},form,{time:e.target.value}));}}/>

        <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:4}}>Location</label>
        <input className="input" placeholder="e.g. Church hall, Waterberg Park" value={form.location} onChange={function(e){setForm(Object.assign({},form,{location:e.target.value}));}}/>

        <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:4}}>Event Type</label>
        <select className="input" style={{background:"#0f172a",color:"#fff"}} value={form.type} onChange={function(e){setForm(Object.assign({},form,{type:e.target.value}));}}>
          <option value="Friday Youth">Friday Youth (regular)</option>
          <option value="Special Service">Special Service</option>
          <option value="Outing">Outing / Trip</option>
          <option value="Camp">Camp / Retreat</option>
          <option value="Games Night">Games Night</option>
          <option value="Sports Event">Sports Event</option>
          <option value="Prayer Meeting">Prayer Meeting</option>
          <option value="Other">Other</option>
        </select>

        <label style={{display:"block",fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:4}}>Description / Notes</label>
        <textarea className="input" style={{height:80,resize:"none"}} placeholder="Optional details..." value={form.description} onChange={function(e){setForm(Object.assign({},form,{description:e.target.value}));}}/>

        <button className="btn btn-reg" onClick={saveEvent}>{editing?"Update Event":"Create Event"}</button>
        <button className="btn btn-admin" onClick={function(){setShowForm(false);setEditing(null);setForm(blank);}}>Cancel</button>
      </div>
    </div>);
  }

  return(<div>
    <p className="page-title">📅 Events</p>
    <p style={{color:"#94a3b8",fontSize:13,marginBottom:16}}>Create events. Attendance resets to zero each new event day.</p>

    <button className="btn btn-reg" style={{marginBottom:16}} onClick={function(){setShowForm(true);setForm(blank);setEditing(null);}}>
      ➕ Create New Event
    </button>

    {upcoming.length>0&&(<div style={{marginBottom:20}}>
      <p style={{fontSize:12,color:"#6ee7b7",fontWeight:700,letterSpacing:"1.5px",marginBottom:10}}>UPCOMING EVENTS</p>
      {upcoming.map(function(e){
        var dt=new Date(e.date);
        var dateStr=dt.toLocaleDateString("en-ZA",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
        return(<div key={e.id} style={{background:"linear-gradient(135deg,#0d2818,#1e293b)",border:"2px solid #22c55e44",borderRadius:14,padding:"14px 16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:6}}>
            <div style={{flex:1,minWidth:180}}>
              <strong style={{fontSize:16,color:"#86efac"}}>{e.title}</strong>
              <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{e.type}</div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={function(){editEvent(e);}} style={{background:"#334155",color:"#cbd5e1",border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✏️ Edit</button>
              <button onClick={function(){deleteEvent(e.id);}} style={{background:"#7f1d1d",color:"#fecaca",border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🗑</button>
            </div>
          </div>
          <div style={{fontSize:13,color:"#cbd5e1"}}>📅 {dateStr}{e.time?" at "+e.time:""}</div>
          {e.location&&<div style={{fontSize:13,color:"#cbd5e1"}}>📍 {e.location}</div>}
          {e.description&&<p style={{fontSize:13,color:"#94a3b8",margin:"8px 0 0"}}>{e.description}</p>}
        </div>);
      })}
    </div>)}

    {past.length>0&&(<div>
      <p style={{fontSize:12,color:"#64748b",fontWeight:700,letterSpacing:"1.5px",marginBottom:10}}>PAST EVENTS</p>
      {past.slice(0,10).map(function(e){
        var dt=new Date(e.date);
        var dateStr=dt.toLocaleDateString("en-ZA",{day:"numeric",month:"short",year:"numeric"});
        return(<div key={e.id} style={{background:"#1e293b",borderRadius:12,padding:"12px 14px",marginBottom:8,opacity:0.7}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
            <div>
              <strong style={{fontSize:14,color:"#94a3b8"}}>{e.title}</strong>
              <div style={{fontSize:12,color:"#64748b"}}>📅 {dateStr} · {e.type}</div>
            </div>
            <button onClick={function(){deleteEvent(e.id);}} style={{background:"#7f1d1d",color:"#fecaca",border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🗑</button>
          </div>
        </div>);
      })}
    </div>)}

    {upcoming.length===0&&past.length===0&&<p className="empty-msg">No events yet. Tap "Create New Event" above!</p>}
  </div>);
}

// ── RESET TAB - clear all test data ──────────────────────────
function ResetTab({data,setData}){
  var [step,setStep]=useState("warn");

  function resetCheckinsOnly(){
    var u=Object.assign({},data,{checkins:[]});
    setData(u);saveData(u);
    setStep("done");
  }

  function resetAll(){
    // Clear all data except keep members
    var u={members:[],checkins:[],feedback:[],events:[]};
    setData(u);saveData(u);
    // Also clear photos and skip counts
    Object.keys(localStorage).forEach(function(k){
      if(k.startsWith("ph_")||k.startsWith("skip_")){localStorage.removeItem(k);}
    });
    setStep("done");
  }

  function resetCurrentWeekOnly(){
    var lastFri=lastFriday();
    var u=Object.assign({},data,{
      checkins:(data.checkins||[]).filter(function(c){return new Date(c.date)<lastFri;})
    });
    setData(u);saveData(u);
    setStep("done");
  }

  if(step==="done")return(<div>
    <p className="page-title">✅ Reset Complete</p>
    <div style={{background:"#0d2818",border:"2px solid #22c55e44",borderRadius:14,padding:"20px",textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:10}}>🎉</div>
      <p style={{fontSize:16,fontWeight:700,color:"#86efac",margin:"0 0 6px"}}>All cleared!</p>
      <p style={{fontSize:13,color:"#94a3b8"}}>Your system is fresh and ready. Counters back to zero.</p>
    </div>
    <button className="btn btn-admin" style={{marginTop:16}} onClick={function(){setStep("warn");}}>← Back</button>
  </div>);

  return(<div>
    <p className="page-title">⚙️ Reset Data</p>
    <p style={{color:"#f87171",fontSize:13,marginBottom:16,background:"#1a0505",padding:"10px 14px",borderRadius:10,border:"1px solid #ef444444"}}>
      ⚠️ WARNING: These actions cannot be undone. Google Sheets data is NOT affected — only local app data.
    </p>

    <div style={{background:"#1e293b",border:"2px solid #f59e0b44",borderRadius:14,padding:"18px",marginBottom:12}}>
      <div style={{fontSize:28,marginBottom:8,textAlign:"center"}}>📅</div>
      <p style={{margin:"0 0 6px",fontWeight:700,color:"#fcd34d",fontSize:15,textAlign:"center"}}>Reset This Week Only</p>
      <p style={{margin:"0 0 14px",fontSize:13,color:"#94a3b8",textAlign:"center"}}>Clears only check-ins from this Friday onwards. Past history stays.</p>
      <button onClick={function(){if(confirm("Reset check-ins for this week only?"))resetCurrentWeekOnly();}}
        style={{width:"100%",background:"linear-gradient(135deg,#f59e0b,#ea580c)",color:"#fff",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        Reset This Week Only
      </button>
    </div>

    <div style={{background:"#1e293b",border:"2px solid #3b82f644",borderRadius:14,padding:"18px",marginBottom:12}}>
      <div style={{fontSize:28,marginBottom:8,textAlign:"center"}}>🧹</div>
      <p style={{margin:"0 0 6px",fontWeight:700,color:"#93c5fd",fontSize:15,textAlign:"center"}}>Clear All Check-ins</p>
      <p style={{margin:"0 0 14px",fontSize:13,color:"#94a3b8",textAlign:"center"}}>Removes ALL check-in history but keeps members. Good for clearing test data.</p>
      <button onClick={function(){if(confirm("Delete ALL check-ins? Members will stay."))resetCheckinsOnly();}}
        style={{width:"100%",background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"#fff",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        Clear All Check-ins
      </button>
    </div>

    <div style={{background:"#1e293b",border:"2px solid #ef444444",borderRadius:14,padding:"18px"}}>
      <div style={{fontSize:28,marginBottom:8,textAlign:"center"}}>💥</div>
      <p style={{margin:"0 0 6px",fontWeight:700,color:"#f87171",fontSize:15,textAlign:"center"}}>Full Factory Reset</p>
      <p style={{margin:"0 0 14px",fontSize:13,color:"#94a3b8",textAlign:"center"}}>Deletes ALL data — members, check-ins, feedback, events, photos. Starts totally fresh.</p>
      <button onClick={function(){if(confirm("⚠️ DELETE EVERYTHING — members, check-ins, feedback, photos, events? This cannot be undone.")){if(confirm("Are you ABSOLUTELY sure? Type OK in your head to confirm.")){resetAll();}}}}
        style={{width:"100%",background:"linear-gradient(135deg,#ef4444,#7f1d1d)",color:"#fff",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        💥 Full Factory Reset
      </button>
    </div>

    <p style={{fontSize:12,color:"#475569",textAlign:"center",marginTop:16}}>
      Note: If you are syncing with Google Sheets, you may also want to clear the sheets manually to fully remove test data.
    </p>
  </div>);
}

// IMPORT TAB
function ImportTab({data,setData}){
  var [preview,setPreview]=useState([]);
  var [previewData,setPreviewData]=useState(null);
  var [msg,setMsg]=useState("");

  function key(m){return (m.name+m.surname).toLowerCase().replace(/\s/g,"");}

  function doImport(list,extraCheckins){
    var existing=new Set((data.members||[]).map(function(m){return key(m);}));
    var toAdd=list.filter(function(m){return m&&m.name&&!existing.has(key(m));});
    if(toAdd.length===0){setMsg("All "+list.length+" members are already in the system!");return;}
    var ck=extraCheckins||[];
    var allCheckins=(data.checkins||[]).concat(ck);
    var updated=Object.assign({},data,{members:(data.members||[]).concat(toAdd),checkins:allCheckins});
    setData(updated);saveData(updated);
    setMsg("Imported "+toAdd.length+" youth and "+ck.length+" attendance records!");
    toAdd.forEach(function(m){var p=Object.assign({type:"REGISTRATION"},m);delete p.photo;syncGoogle(p);});
    ck.forEach(function(c){syncGoogle({type:"CHECKIN",id:c.memberId,memberId:c.memberId,name:c.name||"",surname:c.surname||"",date:c.date,school:c.school||"",status:"Member"});});
  }

  function histToMember(h){
    return {id:"hist_"+(h.nm+h.sn).replace(/\s/g,"").toLowerCase()+"_"+Math.random().toString(36).slice(2),
      name:h.nm,surname:h.sn,phone:h.ph,address:h.ad,school:h.sc,grade:h.gr,
      whatsapp:h.ph,parentName:"",parentSurname:"",parentPhone:"",birthday:"",photo:null,
      status:"Member",originalStatus:"Member",incomplete:true,registeredOn:"historical",wantsWhatsApp:false};
  }

  function parseCSV(text){
    var lines=text.split("\n").filter(function(l){return l.trim();});
    if(lines.length<2)return [];
    var headers=lines[0].split(",").map(function(h){return h.replace(/"/g,"").trim().toLowerCase();});
    return lines.slice(1).map(function(line){
      var vals=line.split(",");
      var obj={};headers.forEach(function(h,i){obj[h]=(vals[i]||"").replace(/"/g,"").trim();});return obj;
    });
  }

  function rowToMember(row){
    var name=(row.name||row["first name"]||row.firstname||"").trim();
    var surname=(row.surname||row.lastname||row["last name"]||"").trim();
    if(!name)return null;
    name=name.charAt(0).toUpperCase()+name.slice(1).toLowerCase();
    surname=surname?surname.charAt(0).toUpperCase()+surname.slice(1).toLowerCase():"";
    return {id:"imp_"+(name+surname).replace(/\s/g,"").toLowerCase()+"_"+Math.random().toString(36).slice(2),
      name:name,surname:surname,
      phone:(row.phone||row.cell||row["cell number"]||row.telephone||row["telephone number"]||"").replace(/\s/g,""),
      address:row.address||"",school:row.school||"",grade:row.grade||"",
      whatsapp:"",parentName:"",parentSurname:"",parentPhone:"",birthday:"",photo:null,
      status:"Member",originalStatus:"Member",incomplete:true,registeredOn:"historical",wantsWhatsApp:false};
  }

  function handleFile(e){
    var file=e.target.files[0];if(!file)return;
    var name=file.name.toLowerCase();
    if(name.endsWith(".xlsx")||name.endsWith(".xls")){
      // Load SheetJS dynamically if not already loaded
      if(typeof XLSX==="undefined"){
        var script=document.createElement("script");
        script.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        script.onload=function(){readExcel(file);};
        document.head.appendChild(script);
      } else { readExcel(file); }
    } else {
      var reader=new FileReader();
      reader.onload=function(ev){
        var rows=parseCSV(ev.target.result);
        var mems=rows.map(rowToMember).filter(Boolean);
        setPreviewData({members:mems,checkins:[]});
        setPreview(mems);
        setMsg("Found "+mems.length+" members. Tap Import to add them.");
      };
      reader.readAsText(file);
    }
  }

  function xlDateToStr(v){
    if(typeof v==="number"&&v>20000){
      var d=new Date(Math.round((v-25569)*86400*1000));
      return d.toISOString().slice(0,10);
    }
    if(v instanceof Date){return v.toISOString().slice(0,10);}
    var s=String(v||"").trim();
    if(s.match(/^\d{4}-\d{2}-\d{2}/))return s.slice(0,10);
    if(s.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/)){
      var pts=s.split("/");
      var y=pts[2].length===2?"20"+pts[2]:pts[2];
      return y+"-"+pts[1].padStart(2,"0")+"-"+pts[0].padStart(2,"0");
    }
    return null;
  }

  function parseDate(val){
    // Convert Excel date values to yyyy-mm-dd string
    if(!val)return null;
    if(val instanceof Date)return val.toISOString().slice(0,10);
    if(typeof val==="number"&&val>20000){
      var d=new Date(Math.round((val-25569)*86400*1000));
      return d.toISOString().slice(0,10);
    }
    var s=String(val).trim();
    // d/mm/yyyy or d/m/yyyy
    var m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if(m){
      var y=m[3].length===2?"20"+m[3]:m[3];
      return y+"-"+m[2].padStart(2,"0")+"-"+m[1].padStart(2,"0");
    }
    if(s.match(/^\d{4}-\d{2}-\d{2}/))return s.slice(0,10);
    return null;
  }

  function readExcel(file){
    var reader=new FileReader();
    reader.onload=function(ev){
      try{
        var wb=XLSX.read(ev.target.result,{type:"array",cellDates:false});

        // Find the Register sheet (or first sheet with enough data)
        var targetSheet=wb.SheetNames.find(function(n){
          return n.toLowerCase()==="register";
        })||wb.SheetNames.find(function(n){
          var sn=n.toLowerCase();
          return !sn.includes("march")&&!sn.includes("april")&&!sn.includes("may")&&
                 !sn.includes("june")&&!sn.includes("jan")&&!sn.includes("feb")&&
                 !sn.includes("summary")&&!sn.includes("cover");
        })||wb.SheetNames[0];

        var ws=wb.Sheets[targetSheet];
        // Read as raw array to handle header on row 2
        var arr=XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:true});
        if(!arr||arr.length<3){setMsg("Sheet ["+targetSheet+"] has no data.");return;}

        // Find the header row - look for row containing "Name" or "Surname"
        var headerRowIdx=0;
        for(var ri=0;ri<Math.min(arr.length,5);ri++){
          var rowStr=arr[ri].map(function(v){return String(v||"").toLowerCase();});
          if(rowStr.includes("name")||rowStr.includes("surname")){headerRowIdx=ri;break;}
        }
        var headers=arr[headerRowIdx];
        var dataRows=arr.slice(headerRowIdx+1);

        // Map column indices
        var colName=-1,colSurname=-1,colPhone=-1,colAddress=-1,colGrade=-1,colSchool=-1;
        var dateCols=[]; // {index, dateStr}
        headers.forEach(function(h,i){
          var hl=String(h||"").toLowerCase().trim();
          if(hl==="name"||hl==="first name"||hl==="naam")colName=i;
          else if(hl==="surname"||hl==="last name"||hl==="van")colSurname=i;
          else if(hl==="cell number"||hl==="phone"||hl==="cell"||hl==="telephone"||hl==="tel"||hl==="number")colPhone=i;
          else if(hl==="address"||hl==="adres")colAddress=i;
          else if(hl.includes("grade")||hl==="gr"||hl==="graad")colGrade=i;
          else if(hl==="school"||hl==="skool")colSchool=i;
          else{
            // Check if this column header looks like a date
            var ds=parseDate(h);
            if(ds)dateCols.push({index:i,date:ds});
          }
        });

        if(colName===-1){
          setMsg("Could not find a Name column. Check your sheet headers. Found: "+headers.filter(Boolean).join(", "));
          return;
        }

        var members=[]; var checkins=[]; var seenKeys=new Set();
        dataRows.forEach(function(row){
          if(!row||!row[colName])return;
          var name=String(row[colName]||"").trim();
          if(name.length<2)return;
          var surname=colSurname>=0?String(row[colSurname]||"").trim():"";
          var phone=colPhone>=0?String(row[colPhone]||"").replace(/\s/g,""):"";
          var address=colAddress>=0?String(row[colAddress]||"").trim():"";
          var grade=colGrade>=0?String(row[colGrade]||"").trim():"";
          var school=colSchool>=0?String(row[colSchool]||"").trim():"";
          // Capitalise names
          name=name.charAt(0).toUpperCase()+name.slice(1).toLowerCase();
          surname=surname?surname.charAt(0).toUpperCase()+surname.slice(1).toLowerCase():"";
          var key=(name+surname).toLowerCase().replace(/\s/g,"");
          if(seenKeys.has(key))return;
          seenKeys.add(key);
          var m={
            id:"imp_"+key+"_"+Math.random().toString(36).slice(2),
            name:name,surname:surname,phone:phone,whatsapp:phone,
            address:address,school:school,grade:grade,
            parentName:"",parentSurname:"",parentPhone:"",
            birthday:"",photo:null,status:"Member",originalStatus:"Member",
            incomplete:true,registeredOn:"historical",wantsWhatsApp:false
          };
          members.push(m);
          // Extract attendance
          dateCols.forEach(function(dc){
            var val=String(row[dc.index]||"").toLowerCase().trim();
            if(val&&val!=="null"&&val!=="0"&&val!=="no"&&val!=="absent"){
              checkins.push({memberId:m.id,date:dc.date,time:"historical",name:m.name,surname:m.surname,school:m.school||""});
            }
          });
        });

        if(members.length===0){
          setMsg("Found 0 members. Tried sheet ["+targetSheet+"]. Header row: "+headers.filter(Boolean).slice(0,8).join(", "));
          return;
        }
        setPreviewData({members:members,checkins:checkins});
        setPreview(members);
        setMsg("Ready to import: "+members.length+" members with "+checkins.length+" attendance records from ["+targetSheet+"].");
      }catch(err){console.log(err);setMsg("Error: "+err.message);}
    };
    reader.readAsArrayBuffer(file);
  }


  return(<div>
    <p className="page-title">Import Old Registers</p>

    {msg&&<p style={{color:"#86efac",fontWeight:700,marginBottom:14,fontSize:14,background:"#0d2818",padding:"10px 14px",borderRadius:10}}>{msg}</p>}
    <div style={{background:"#1e293b",border:"2px solid #6c63ff44",borderRadius:13,padding:"16px",marginBottom:16}}>
      <p style={{margin:"0 0 4px",fontWeight:700,color:"#a5b4fc",fontSize:15}}>Upload Excel or PDF Register</p>
      <p style={{margin:"0 0 12px",fontSize:13,color:"#94a3b8"}}>
        Upload your register Excel file (.xlsx). The app reads your Register sheet automatically — finds Name, Surname, Cell Number, Address, Grade, School columns and all attendance dates.
      </p>
      <div onClick={function(){document.getElementById("import-file-input").click();}}
        style={{background:"#0f172a",border:"2px dashed #6c63ff",borderRadius:14,padding:"22px",textAlign:"center",cursor:"pointer",marginBottom:10}}>
        <div style={{fontSize:36,marginBottom:6}}>📂</div>
        <p style={{color:"#6c63ff",fontWeight:700,fontSize:15,margin:"0 0 4px"}}>Tap to Choose File</p>
        <p style={{color:"#475569",fontSize:12,margin:0}}>Excel (.xlsx) or PDF only</p>
      </div>
      <input id="import-file-input" type="file" accept=".xlsx,.xls,.pdf" style={{display:"none"}} onChange={handleFile}/>
      {preview.length>0&&<div>
        <p style={{color:"#86efac",fontWeight:700,margin:"10px 0 8px"}}>{msg}</p>
        <div style={{maxHeight:250,overflowY:"auto",marginBottom:10}}>
          {preview.slice(0,15).map(function(m,i){return(<div key={i} style={{fontSize:13,color:"#94a3b8",padding:"4px 0",borderBottom:"1px solid #334155"}}>{m.name} {m.surname} | {m.phone||"no phone"} | {m.school||"no school"}</div>);})}
          {preview.length>15&&<p style={{fontSize:12,color:"#475569"}}>...and {preview.length-15} more</p>}
        </div>
        <div style={{marginTop:10}}>
          <p style={{fontSize:13,color:"#86efac",fontWeight:700,marginBottom:10,padding:"8px 12px",background:"#0d2818",borderRadius:8}}>
            Ready: {preview.length} members {previewData&&previewData.checkins&&previewData.checkins.length>0?"+ "+previewData.checkins.length+" attendance records":""}
          </p>
          <button className="btn btn-reg" style={{marginBottom:8,fontSize:15}} onClick={function(){
            doImport(previewData?previewData.members:preview,previewData?previewData.checkins:[]);
            setPreview([]);setPreviewData(null);
          }}>
            ✅ Upload Now — Add to System
          </button>
          <button onClick={function(){setPreview([]);setPreviewData(null);setMsg("Skipped. You can upload another file anytime.");}}
            style={{width:"100%",padding:"13px",borderRadius:12,border:"2px solid #334155",background:"#1e293b",color:"#94a3b8",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginBottom:6}}>
            ⏸ Upload Later / Skip
          </button>
          <button onClick={function(){setPreview([]);setPreviewData(null);setMsg("");}}
            style={{width:"100%",padding:"10px",borderRadius:12,border:"none",background:"none",color:"#475569",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            ✕ Cancel
          </button>
        </div>
      </div>}
    </div>

    <div style={{background:"#1e293b",border:"2px solid #334155",borderRadius:13,padding:"16px"}}>
      <p style={{margin:"0 0 10px",fontWeight:700,color:"#e2e8f0"}}>Currently in system: {(data.members||[]).length} members</p>
      <div style={{maxHeight:300,overflowY:"auto"}}>
        {sortAlpha(data.members||[]).map(function(m,i){return(<div key={m.id||i} style={{fontSize:13,padding:"5px 0",borderBottom:"1px solid #334155",display:"flex",justifyContent:"space-between"}}>
          <span style={{color:m.incomplete?"#f59e0b":"#cbd5e1"}}>{m.name} {m.surname}{m.incomplete?" (incomplete)":""}</span>
          <span style={{color:"#475569"}}>{m.phone||"?"}</span>
        </div>);})}
      </div>
    </div>
  </div>);
}

// ROOT APP
function App(){
  var [homeTilePopup,setHomeTilePopup]=useState(null);
  var [homeTilePin,setHomeTilePin]=useState("");
  var [homeTilePinError,setHomeTilePinError]=useState(false);
  var [homeTilePinUnlocked,setHomeTilePinUnlocked]=useState(false);

  function checkHomeTilePin(p){
    var leaders=JSON.parse(localStorage.getItem("jg_leaders")||"[]");
    // Both Senior AND Junior leaders can view names from home tiles
    var anyLeader=leaders.find(function(L){return L.pin===p;});
    if(p===ADMIN_PIN||anyLeader){
      setHomeTilePinUnlocked(true);
      setHomeTilePin("");
      setHomeTilePinError(false);
    } else {
      setHomeTilePinError(true);
      setTimeout(function(){setHomeTilePin("");setHomeTilePinError(false);},800);
    }
  }
  function closeHomeTilePopup(){setHomeTilePopup(null);setHomeTilePinUnlocked(false);setHomeTilePin("");setHomeTilePinError(false);}
  var [data,setData]=useState(function(){return withPhotos(loadData());});
  var [screen,setScreen]=useState("home");
  var [prefill,setPrefill]=useState(null);
  var [syncing,setSyncing]=useState(false);
  var [lastSync,setLastSync]=useState(null);
  var [syncError,setSyncError]=useState(false);

  useEffect(function(){
    loadFromGoogle();
    // Auto-refresh every 30 seconds so all devices stay in sync
    var interval=setInterval(function(){
      loadFromGoogle();
    },30000);
    return function(){clearInterval(interval);};
  },[]);

  async function loadFromGoogle(){
    setSyncing(true);setSyncError(false);
    try{
      var url=GOOGLE_URL+(GOOGLE_URL.indexOf("?")>=0?"&":"?")+"token="+encodeURIComponent(SYNC_TOKEN);
      var res=await fetch(url,{method:"GET"});
      var json=await res.json();
      if(json.status==="ok"){
        var local=loadData();
        var googleMembers=json.members||[];
        var googleCheckins=json.checkins||[];
        var googleIds=new Set(googleMembers.map(function(m){return m.id;}));
        var localOnly=(local.members||[]).filter(function(m){return !googleIds.has(m.id);});
        var googleCkKeys=new Set(googleCheckins.map(function(c){return c.memberId+"_"+c.date;}));
        var localCkOnly=(local.checkins||[]).filter(function(c){return !googleCkKeys.has(c.memberId+"_"+c.date);});
        var merged={
          members:googleMembers.concat(localOnly),
          checkins:googleCheckins.concat(localCkOnly),
          feedback:local.feedback||[]
        };
        merged.members=merged.members.map(function(m){
          var p=localStorage.getItem("ph_"+m.id);
          return p?Object.assign({},m,{photo:p}):m;
        });
        setData(merged);saveData(merged);setLastSync(new Date().toLocaleTimeString());
      }else{setSyncError(true);}
    }catch(e){console.log("Load:",e);setSyncError(true);}
    setSyncing(false);
  }

  function handleRegistered(member,isNew){
    var date=todayStr();
    var updated=Object.assign({},data);
    if(isNew){updated=Object.assign({},updated,{members:(data.members||[]).concat([member])});}
    else{updated=Object.assign({},updated,{members:(data.members||[]).map(function(m){return m.id===member.id?member:m;})});}
    var alreadyIn=(data.checkins||[]).some(function(c){return c.memberId===member.id&&c.date===date;});
    if(!alreadyIn){
      updated=Object.assign({},updated,{checkins:(updated.checkins||[]).concat([{memberId:member.id,date:date,time:new Date().toLocaleTimeString()}])});
      syncGoogle({type:"CHECKIN",id:member.id,memberId:member.id,name:member.name,surname:member.surname,date:date,school:member.school,status:member.originalStatus||member.status});
    }
    if(isNew){
      var p=Object.assign({type:"REGISTRATION"},member);
      delete p.photo; // photos stored locally, not in Google Sheets text columns
      syncGoogle(p);
    }
    setData(updated);saveData(updated);
  }

  function handleCheckin(member,fb){
    handleRegistered(member,false);
    if(fb){
      var entry=Object.assign({},fb,{date:todayStr(),seen:false});
      var u=Object.assign({},data,{feedback:(data.feedback||[]).concat([entry])});
      setData(u);saveData(u);
      syncGoogle(Object.assign({type:"FEEDBACK"},fb,{date:todayStr()}));
    }
  }

  // Count attendance for the active event day (today if Friday, or latest event, or last Friday)
  var eventDate=getActiveEventDate(data.events);
  // Get unique member IDs who checked in on event date  
  var rawIds=[...new Set((data.checkins||[]).filter(function(c){return c.date===eventDate;}).map(function(c){return c.memberId;}))];
  // Filter to only IDs that match existing members (ignore orphan check-ins from deleted members)
  var todayCheckedIds=rawIds.filter(function(id){return (data.members||[]).find(function(m){return m.id===id;});});
  var todayCount=todayCheckedIds.length;
  var visitorsToday=todayCheckedIds.filter(function(id){
    var m=(data.members||[]).find(function(mb){return mb.id===id;});
    return m&&m.originalStatus==="Visitor";
  }).length;

  if(screen==="register")return(<div className="container"><RegistrationForm existingMembers={data.members||[]} prefill={prefill} onDone={function(m,isNew){setPrefill(null);handleRegistered(m,isNew);setScreen("home");}} onBack={function(){setPrefill(null);setScreen("home");}}/></div>);
  if(screen==="checkin")return(<div className="container"><CheckInPage members={data.members||[]} checkins={data.checkins||[]} onCheckin={handleCheckin} onBack={function(){setScreen("home");}} onCompleteProfile={function(m){setPrefill(m);setScreen("register");}}/></div>);
  if(screen==="pin")return <PinScreen onSuccess={function(){setScreen("admin");}}/>;
  if(screen==="admin")return(<div className="container"><AdminDashboard data={data} setData={function(d){setData(d);saveData(d);}} onExit={function(){localStorage.removeItem("jg_admin_role");localStorage.removeItem("jg_admin_leader_id");setScreen("home");}} onRefresh={loadFromGoogle} syncing={syncing}/></div>);

  return(<div style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column"}}>
    {/* Banner Image Hero */}
    <div style={{position:"relative",width:"100%",overflow:"hidden"}}>
      <img src="data:image/jpeg;base64,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gAAAAAAAgDBSAAAgAYAABBCGGgCDABDADE2wACLQDAACPCAACADCBDADBDABBDABCBCAAAAAAAAAAAAAEEIwCADWIco4owBDDKwBDDDBCCBDBgBBCpCDDCDBAAgCABACADDCBACBBDADCCCAAAAAAAAAAAAs0EAADDDACwMQoCBAQgBDADCFABACCDDBEBBBBDcJAAACDCBBCBADCADDAAAQAAAQAAAAAAAAAAE4Y8CBDBDDDAgDACDCADCBCARDCBACHBCCQICHGJPAgAADAABADAABBACBAAAAAAIAAAAAAAAAYAAMIBACAADBCgCABABDDDACD2DBDCDBCBBDBBXhlhNhAABDDCBDDDBCDBBBBFgBBEAAAAAAAAAAEIAgJDABCTAhJCDADBACCCATDDADCCACSBCCFiAHA1AAAABBDAABACAABAAAABEkQAAAAAEAAAEYgAAEjCADBBIBDAArAAADAQDDBADAjbCBgkIBAADxBAAABBACADAADCAACBDBDUUIAAAAQAAIAAwgIIwkAAABBRJCDGOAAAQABCCADCAAIABABgBAjCAAAAAADDABABABDIjhFKMUgEkAAAAAEAgIAQEAE4AEgDACCDDDRggAAAABDDBOAEEKFEIMIIMIEEEMEEMMMIMpBAAABB5iPbqgWAAAQAACgKjAAQALmBBEBvKABBBSAAAAAACBPRcMEAABEAQAscoI9gQUAIoQAQADDAAABST5tYSWAACCAACiRQAAADCABBjAAmAABDDAAAAAAADAQAgQQigAAQAQwgQQwwwggQQAAACAADRWYeAAAAUBBBBBBBDBJCBBCjBBBABATGBAAADACBBBADBBAACDDDDCTCCCRTywyyyrDhBDAAACAHhCAQBAAUAABBAEABBTDAAARAAADDAABCDBCDRyhKBBCDDAADAABBAAADBDAAAACDABCICAAACCCDBABAAAUABDBBAABDDAABCBBADJABBDChDCGAAAABAAABCAADCDDBCADBgAAThDABDBBDABAACDTIAAAAAUCACAACAAAAIAAACICCABBDDADXwhBBARQAAAAIFDDBDDAACCAAADdCAACLBCADBCCCAAAAAAAAUACCCCACAAAAAAAAAAAAAAEIAAThCCDDAACACGIEBCACACCCAAACQrADCJAABCBBCBSAAAAAAAAUoABCCACAAMIEoAYAIAAAAAAABEjCABBCBDDDACJDbICCCCACAADgCBBDjDCATDCBCCAAAAAAAAUgBDBwk6oAQ8ws48w4cc8kIIoIaAAAABBCBACBBhwasAAACACGICAACACABBDBIBAACABAAAAAAUYCAC8ggUEwAggIwYQI48kgMYIDAQAAAACDCDApqGhSTxBADAABBAAAACCCDCAhCACCCBAAAAAAAsADB8oyIsQEY4AwYsYg4AI8IABBBCCCADABABDADADDCAACCCCAABDABDDBBBjCCACAAAAAAAAQcgCCgI3QAAwAko0gEU4AAAAAADDBCAAABBABDCDACCDBBCDAABAAAAAACAACCAAADCCAAAAAAAEAgAQAAgAAAAAQAgDQQgAAAAASACCDABBBBBBCABBACCDBDDAABAAABBBBBBDAAACCCCCCCCCCCQ/8QAMxEBAQEAAwABAgUFAQEAAQEJAQARITEQQVFhIHHwkYGhsdHB4fEwQFBgcICQoLDA0OD/2gAIAQMRAT8Q/wD5Gf8A+T//AP3/AOf1/wD112P/AP33qdfvuq7fV/m//h/+ff8A99/egV492v3n/wD/AH1/v/zP/v3vX29vnh/geR37/wCvp+jg3777SKwlfb/T/rYvDzw3Vc/7w3Pf03/0P+7hvve49ECLh+//AETPUH0f+VPozv8A/wCtIZj/AN73adwde/3/AP30+/50fzrH5KMs/X9/AVlxlXfwV3/v/RzFC+P/ALC8d1NXS/5ej7cl4dwf9cFDu+fX+/8AluvX/wDf7f5/22Y+hgtk3YbUm7+1vu/euaHA/reB9rBz/c+n4t45+uPnrY71IP8AbnhoTvj4b16bAm43rmPh0LfLqv1bB/tz53j/APfB/wB9cv2i972/Ny+q7uWv9xGf/wB/u89OAYSNaP7Fiin+uLcgOsGev27/AH76hXQ1X51uuf6P/h6bRve8f7bj9VWzssBIFeP96x7n54fuB/BcOXv77v33jOPWvze8vlfeefrn7qD/AIrm+uPb88ePb1ObeDv++QC19jlUB9/+80Xhf/vV+9//AH569DH3y9+JsfffQWzAW8IcFvusLhy1Hv8A+9+i/FLRSFq3Dy+xWR0afnz5di/b2/8A/wDUelu9fpzU37IMBZvv/IBWkGkNT/65z4/u8lz3xfPNf/8AoP0bVX0EmFaxvH1I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" alt="Jeremiah Generation"
        style={{width:"100%",height:"220px",objectFit:"cover",objectPosition:"center",display:"block",filter:"brightness(0.85)"}}/>
      {/* Gradient overlay bottom */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"80px",
        background:"linear-gradient(to bottom, transparent, #000)"}}/>
      {/* Living Waters text over banner */}
      <div style={{position:"absolute",bottom:10,left:0,right:0,textAlign:"center"}}>
        <p style={{color:"rgba(255,255,255,0.9)",fontSize:12,fontWeight:700,
          letterSpacing:"3px",margin:0,textShadow:"0 2px 8px rgba(0,0,0,0.8)"}}>
          LIVING WATERS FELLOWSHIP
        </p>
      </div>
    </div>

    {/* Content below banner */}
    <div style={{flex:1,padding:"20px 16px 32px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      {/* Sync status */}
      {syncing&&<p style={{color:"#6ee7b7",fontSize:12,margin:"0 0 12px",textAlign:"center"}}>⏳ Syncing data...</p>}
      {syncError&&<p style={{color:"#f87171",fontSize:12,margin:"0 0 12px",textAlign:"center"}}>
        ⚠️ Using local data. <span style={{textDecoration:"underline",cursor:"pointer"}} onClick={loadFromGoogle}>Retry</span>
      </p>}
      {lastSync&&!syncing&&!syncError&&<p style={{color:"#334155",fontSize:11,margin:"0 0 12px",textAlign:"center"}}>✓ Synced {lastSync}</p>}

      {/* Stats strip - tappable with PIN */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24,width:"100%",maxWidth:440}}>
        <div onClick={function(){setHomeTilePopup("registered");}} style={{background:"linear-gradient(135deg,#1e293b,#0f172a)",borderRadius:14,padding:"12px 8px",textAlign:"center",border:"1px solid #334155",cursor:"pointer"}}>
          <div style={{fontSize:22,fontWeight:900,color:"#6c63ff"}}>{(data.members||[]).length}</div>
          <div style={{fontSize:10,color:"#64748b",marginTop:2}}>Registered</div>
        </div>
        <div onClick={function(){setHomeTilePopup("here");}} style={{background:"linear-gradient(135deg,#1e293b,#0f172a)",borderRadius:14,padding:"12px 8px",textAlign:"center",border:"1px solid #334155",cursor:"pointer"}}>
          <div style={{fontSize:22,fontWeight:900,color:"#22c55e"}}>{todayCount}</div>
          <div style={{fontSize:10,color:"#64748b",marginTop:2}}>Here Today</div>
        </div>
        <div onClick={function(){setHomeTilePopup("visitors");}} style={{background:"linear-gradient(135deg,#1e293b,#0f172a)",borderRadius:14,padding:"12px 8px",textAlign:"center",border:"1px solid #334155",cursor:"pointer"}}>
          <div style={{fontSize:22,fontWeight:900,color:"#a855f7"}}>{visitorsToday}</div>
          <div style={{fontSize:10,color:"#64748b",marginTop:2}}>Visitors Today</div>
        </div>
      </div>
      <p style={{textAlign:"center",fontSize:11,color:"#475569",marginTop:-16,marginBottom:16}}>👆 Tap any tile to view names (PIN required)</p>

      {/* Main action buttons */}
      <div style={{width:"100%",maxWidth:400}}>
        <button onClick={function(){setScreen("register");}} style={{
          width:"100%",marginBottom:12,padding:"18px",borderRadius:18,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:800,fontSize:17,
          background:"linear-gradient(135deg,#6c63ff,#3b82f6)",color:"#fff",
          boxShadow:"0 8px 28px rgba(108,99,255,0.45)",letterSpacing:"0.5px",
        }}>
          📝 Registration
        </button>

        <button onClick={function(){setScreen("checkin");}} style={{
          width:"100%",marginBottom:12,padding:"18px",borderRadius:18,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:800,fontSize:17,
          background:"linear-gradient(135deg,#22c55e,#10b981)",color:"#fff",
          boxShadow:"0 8px 28px rgba(34,197,94,0.45)",letterSpacing:"0.5px",
        }}>
          ✅ Check In
        </button>

        <button onClick={function(){setScreen("pin");}} style={{
          width:"100%",marginBottom:0,padding:"14px",borderRadius:18,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:15,
          background:"transparent",color:"#475569",border:"2px solid #1e293b",
        }}>
          🔐 Leadership Admin
        </button>
      </div>

      {/* Footer */}
      <p style={{color:"#334155",fontSize:11,marginTop:20,textAlign:"center"}}>
        Leader: Emily Bilali · Living Waters Fellowship
      </p>
    </div>

    {/* Home tile popup with PIN */}
    {homeTilePopup&&(function(){
      var ed=getActiveEventDate(data.events);
      // Get unique member IDs who checked in on event date
      var todayCheckedIds=[...new Set((data.checkins||[]).filter(function(c){return c.date===ed;}).map(function(c){return c.memberId;}))];
      // ONLY count IDs that match an existing member (skip orphaned check-ins from deleted members)
      var validIds=todayCheckedIds.filter(function(id){return (data.members||[]).find(function(m){return m.id===id;});});
      var list=[],title="",color="";
      if(homeTilePopup==="here"){
        list=validIds.map(function(id){return (data.members||[]).find(function(m){return m.id===id;});}).filter(Boolean);
        title="Here Today ("+list.length+")"; color="#22c55e";
      } else if(homeTilePopup==="visitors"){
        list=validIds.map(function(id){return (data.members||[]).find(function(m){return m.id===id;});}).filter(function(m){return m&&m.originalStatus==="Visitor";});
        title="Visitors Today ("+list.length+")"; color="#a855f7";
      } else if(homeTilePopup==="registered"){
        list=sortAlpha(data.members||[]);
        title="All Registered ("+list.length+")"; color="#6c63ff";
      }
      return(
        <div onClick={closeHomeTilePopup} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
          <div onClick={function(e){e.stopPropagation();}} style={{background:"#0f172a",borderRadius:20,maxHeight:"85vh",width:"100%",maxWidth:520,overflowY:"auto",border:"3px solid "+color,position:"relative"}}>
            {/* Sticky top bar with Back button */}
            <div style={{padding:"14px 16px",position:"sticky",top:0,background:"#0f172a",borderBottom:"2px solid "+color+"44",display:"flex",justifyContent:"space-between",alignItems:"center",zIndex:10}}>
              <h3 style={{margin:0,color:color,fontSize:16}}>{title}</h3>
              <button onClick={closeHomeTilePopup} style={{background:color,border:"none",color:"#fff",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✕ Close</button>
            </div>

            {!homeTilePinUnlocked?(
              <div style={{padding:"40px 20px",textAlign:"center"}}>
                <div style={{fontSize:48,marginBottom:14}}>🔒</div>
                <p style={{color:"#e2e8f0",fontSize:16,fontWeight:700,margin:"0 0 6px"}}>Leader PIN Required</p>
                <p style={{color:"#94a3b8",fontSize:13,margin:"0 0 18px"}}>Names are private. Enter your PIN to see them.</p>
                <div style={{display:"flex",justifyContent:"center",gap:10,margin:"18px 0"}}>
                  {[0,1,2,3,4].map(function(i){return <div key={i} style={{width:14,height:14,borderRadius:"50%",background:homeTilePin.length>i?color:"#1e293b",border:"2px solid "+(homeTilePinError?"#ef4444":"#334155"),transition:"all 0.2s"}}/>;})}
                </div>
                {homeTilePinError&&<p style={{color:"#f87171",fontSize:13,margin:"0 0 10px"}}>Incorrect PIN</p>}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,maxWidth:280,margin:"0 auto"}}>
                  {["1","2","3","4","5","6","7","8","9","","0","del"].map(function(k,i){
                    if(k==="")return <div key={i}/>;
                    return <button key={i} onClick={function(){
                      if(k==="del"){setHomeTilePin(function(p){return p.slice(0,-1);});return;}
                      if(homeTilePin.length>=5)return;
                      var next=homeTilePin+k;
                      setHomeTilePin(next);
                      if(next.length===4&&next===ADMIN_PIN){checkHomeTilePin(next);}
                      else if(next.length===5){checkHomeTilePin(next);}
                    }} style={{background:k==="del"?"#7f1d1d":"#1e293b",color:"#fff",border:"2px solid "+(k==="del"?"#7f1d1d":"#334155"),borderRadius:14,padding:"16px",fontSize:18,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{k==="del"?"⌫":k}</button>;
                  })}
                </div>
              </div>
            ):(<div>
              <div style={{padding:"12px 16px"}}>
                <button onClick={closeHomeTilePopup} style={{background:"#1e293b",color:"#94a3b8",border:"1px solid #334155",borderRadius:10,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>← Back</button>
                {list.length===0&&<p style={{color:"#64748b",textAlign:"center",padding:20}}>No one yet.</p>}
                {list.map(function(m){
                  if(!m)return null;
                  var status=computeStatus(m,data.checkins||[]);
                  var isVisitor=homeTilePopup==="visitors";
                  return(<div key={m.id} style={{background:"#1e293b",borderRadius:12,padding:"10px 12px",marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      {m.photo?<img src={m.photo} width="40" height="40" style={{borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>:<div style={{width:40,height:40,borderRadius:"50%",background:"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>👤</div>}
                      <div style={{flex:1,minWidth:0}}>
                        <strong style={{fontSize:13,color:"#e2e8f0"}}>{m.name} {m.surname}</strong>
                        <div style={{fontSize:11,color:"#94a3b8"}}>{status}{m.grade?" · Gr "+m.grade:""}{m.school?" · "+m.school:""}</div>
                        {isVisitor&&m.visitReason&&<div style={{fontSize:10,color:"#e879f9",marginTop:2}}>💫 {m.visitReason}</div>}
                      </div>
                    </div>
                    {isVisitor&&(<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #334155"}}>
                      {wasMessagedToday(m.id)&&<div style={{background:"#0d2818",color:"#86efac",borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:700,textAlign:"center",marginBottom:5}}>✓ Already messaged</div>}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                        {toWA(m.whatsapp||m.phone)&&<a href={toWA(m.whatsapp||m.phone,msgVisitor(m.name))} target="_blank" onClick={function(){markMessageSent(m.id,"WA","Visitor-Thanks");setTimeout(function(){window.dispatchEvent(new Event("jg-refresh"));},500);}} style={{background:wasMessagedToday(m.id,"WA")?"#1e293b":"#a855f7",color:"#fff",borderRadius:7,padding:"7px 8px",fontSize:11,fontWeight:700,textDecoration:"none",textAlign:"center",border:wasMessagedToday(m.id,"WA")?"1px solid #475569":"none"}}>{wasMessagedToday(m.id,"WA")?"✓ WA":"💜 WhatsApp"}</a>}
                        {toSMS(m.phone)&&<a href={toSMS(m.phone,msgVisitor(m.name))} onClick={function(){markMessageSent(m.id,"SMS","Visitor-Thanks");setTimeout(function(){window.dispatchEvent(new Event("jg-refresh"));},500);}} style={{background:wasMessagedToday(m.id,"SMS")?"#1e293b":"#0891b2",color:"#fff",borderRadius:7,padding:"7px 8px",fontSize:11,fontWeight:700,textDecoration:"none",textAlign:"center",border:wasMessagedToday(m.id,"SMS")?"1px solid #475569":"none"}}>{wasMessagedToday(m.id,"SMS")?"✓ SMS":"📱 SMS"}</a>}
                      </div>
                    </div>)}
                  </div>);
                })}
                {/* Bottom Back button too */}
                <button onClick={closeHomeTilePopup} style={{width:"100%",marginTop:14,background:"linear-gradient(135deg,#1e293b,#0f172a)",color:"#cbd5e1",border:"2px solid "+color,borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Back to Home</button>
              </div>
            </div>)}
          </div>
        </div>
      );
    })()}
  </div>);
}

// Auto-refresh component when user returns to tab (e.g. from WhatsApp)
var lastVisibility=Date.now();
document.addEventListener("visibilitychange",function(){
  if(document.visibilityState==="visible"){
    lastVisibility=Date.now();
    // Trigger a repaint by dispatching custom event
    window.dispatchEvent(new Event("jg-refresh"));
  }
});

var root=ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
