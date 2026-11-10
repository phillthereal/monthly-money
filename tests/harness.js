// Shared helpers: boot the app in jsdom with a fixed clock and optional saved state.
const {JSDOM,VirtualConsole}=require("jsdom");const fs=require("fs");
const FILE=process.env.FILE||__dirname+"/../index.html";
const html=fs.readFileSync(FILE,"utf8");
let ok=0,bad=0;
const t=(n,c,x)=>{c?ok++:(bad++,console.log("FAIL",n,x===undefined?"":x))};
function boot(now,store,setup){const errs=[];const vc=new VirtualConsole();
 vc.on("jsdomError",e=>{const m=String((e.detail&&e.detail.stack)||e.detail||e.message);if(!/scrollTo/.test(m))errs.push(m)});
 const d=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"http://localhost/",virtualConsole:vc,beforeParse(w){
  if(now){const R=w.Date,fx=+now;w.Date=class extends R{constructor(...a){a.length?super(...a):super(fx)}static now(){return fx}}}
  w.confirm=()=>true;w.alert=m=>{w.__alerts=(w.__alerts||[]).concat(m)};w.prompt=()=>null;w.scrollTo=()=>{};
  for(const k in (store||{}))w.localStorage.setItem(k,store[k]);if(setup)setup(w)}});
 const w=d.window;
 /* answer in-page dialogs the way the old native stubs did: w.confirm / w.prompt decide, every message lands in w.__alerts */
 new w.MutationObserver(()=>{const dlg=w.document.getElementById("dlg");if(!dlg||!dlg.hasAttribute("open"))return;
  const msg=w.document.getElementById("dlgm").textContent,c=w.document.getElementById("dlgc"),i=w.document.getElementById("dlgi"),o=w.document.getElementById("dlgo");
  w.__alerts=(w.__alerts||[]).concat(msg);
  if(c.hidden)o.click();
  else if(!i.hidden){const v=w.prompt(msg);if(v==null)c.click();else{i.value=v;o.click()}}
  else w.confirm(msg)?o.click():c.click()}).observe(w.document,{attributes:true,subtree:true,attributeFilter:["open"]});
 return{w,errs}}
const settle=()=>new Promise(r=>setTimeout(r,10));
const $=(a,i)=>a.document.getElementById(i);
const st=w=>JSON.parse(w.localStorage.getItem("money-tool-v1"));
const click=(w,el)=>el.dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
const inp=(w,el,v)=>{el.value=v;el.dispatchEvent(new w.Event("input",{bubbles:true}))};
const D=(y,m,d)=>new Date(y,m-1,d,12);
const done=name=>{console.log(name,"pass",ok,"fail",bad);process.exitCode=bad?1:0};
module.exports={settle,boot,$,st,click,inp,D,t,done};
