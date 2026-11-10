// Claude account sync: runs only when window.claude exists; the newer copy wins on load; edits are written back.
const {boot,$,st,click,D,t,done}=require("./harness");
const wait=ms=>new Promise(r=>setTimeout(r,ms));
// A fake Claude runtime holding one document per path.
const fakeClaude=(docs,opts)=>w=>{w.claude={use:async name=>{
  if(name==="user")return opts&&opts.signedOut?null:{id:async()=>"u1"};
  if(name==="db")return{doc:path=>({get:async()=>({exists:path in docs,data:()=>JSON.parse(JSON.stringify(docs[path]))}),set:async v=>{docs[path]=JSON.parse(JSON.stringify(v))}})};
  return null}}};
const PATH="data/users/u1/money";
const S=(inc,lastSaved,extra)=>Object.assign({v:6,inc,lines:[{n:"Amex",a:60000,g:"Spend",r:"amex"}],buys:[],hist:[],lastSaved},extra||{});

(async()=>{
let a=boot(D(2026,11,3));await wait(50);
t("no claude: browser only",a.errs.length===0&&/this browser only/.test($(a.w,"sync").textContent),$(a.w,"sync").textContent);

// Newer account copy replaces an older browser copy (old-format account data is migrated).
let docs={[PATH]:S(312300,2000)};
a=boot(D(2026,11,3),{"money-tool-v1":JSON.stringify(S(100000,1000))},fakeClaude(docs));await wait(50);
t("account copy wins when newer",a.errs.length===0&&st(a.w).inc===312300&&/Claude account/.test($(a.w,"sync").textContent),a.errs.concat($(a.w,"sync").textContent));
$(a.w,"qv").value="7";click(a.w,$(a.w,"qa"));await wait(900);
t("edits written back",docs[PATH].buys.length===1&&docs[PATH].buys[0].pence===700);
click(a.w,a.w.document.querySelector('[data-tab="goals"]'));
t("tab switch is not an edit",st(a.w).lastSaved===docs[PATH].lastSaved);

// A newer browser copy (edited offline) is pushed up instead.
docs={[PATH]:S(312300,1000)};
a=boot(D(2026,11,3),{"money-tool-v1":JSON.stringify(S(300000,5000))},fakeClaude(docs));await wait(50);
t("browser copy wins when newer",st(a.w).inc===300000&&docs[PATH].inc===300000);

// First run: no account copy yet, the browser's data is uploaded. Old artifact format migrates.
docs={};
a=boot(D(2026,11,3),{"money-tool-v1":JSON.stringify(S(250000,1000))},fakeClaude(docs));await wait(50);
t("first run uploads",docs[PATH]&&docs[PATH].inc===250000&&docs[PATH].v===6);
docs={[PATH]:{inc:2400,lines:[{n:"Rent",a:750,g:"Fixed"}],amex:[{n:"Food",p:200,s:0}],cy:{spent:381,day:19,log:[]},synced:true}};
a=boot(D(2026,11,3),{},fakeClaude(docs));await wait(50);
t("old artifact data migrates",a.errs.length===0&&st(a.w).inc===240000&&st(a.w).v===6,a.errs);

// Remote wins: this browser's data is kept as the previous copy; a far-future timestamp is clamped.
const NOWMS=+D(2026,11,3);
docs={[PATH]:S(312300,NOWMS*9)};
a=boot(D(2026,11,3),{"money-tool-v1":JSON.stringify(S(100000,1000))},fakeClaude(docs));await wait(50);
const prev=a.w.localStorage.getItem("money-tool-prev");
t("previous copy kept when remote wins",st(a.w).inc===312300&&prev&&JSON.parse(prev).inc===100000,prev);
t("future lastSaved is clamped",st(a.w).lastSaved<=NOWMS,st(a.w).lastSaved);

// A much smaller remote asks first; declining keeps local data and uploads it.
const many=n=>Array.from({length:n},(_,i)=>({id:"b"+i,date:"2026-11-02",pence:100+i,category:"",note:"x"}));
const askSetup=(docs,answer)=>w=>{fakeClaude(docs)(w);w.confirm=()=>answer};
docs={[PATH]:S(312300,2000,{buys:many(2)})};
a=boot(D(2026,11,3),{"money-tool-v1":JSON.stringify(S(100000,1000,{buys:many(12)}))},askSetup(docs,false));await wait(50);
t("small remote: asks, decline keeps local",(a.w.__alerts||[]).some(m=>/far fewer purchases/.test(m))&&st(a.w).inc===100000&&docs[PATH].inc===100000&&docs[PATH].buys.length===12,a.w.__alerts);
docs={[PATH]:S(312300,2000,{buys:many(2)})};
a=boot(D(2026,11,3),{"money-tool-v1":JSON.stringify(S(100000,1000,{buys:many(12)}))},askSetup(docs,true));await wait(50);
t("small remote: accept uses account copy",st(a.w).inc===312300&&st(a.w).buys.length===2);

// Declining keeps the account's own purchases aside and sticks: the browser copy becomes newest and is uploaded.
const remoteOnly=[{id:"r4173",date:"2026-11-01",pence:4173,category:"",note:"y"},{id:"r5191",date:"2026-11-02",pence:5191,category:"",note:"y"}];
docs={[PATH]:S(312300,2000,{buys:remoteOnly})};
a=boot(D(2026,11,3),{"money-tool-v1":JSON.stringify(S(100000,1000,{buys:many(12)}))},askSetup(docs,false));await wait(50);
let kept=JSON.parse(a.w.localStorage.getItem("money-tool-prev")||"null");
t("decline: remote-only purchases kept aside",kept&&kept.inc===312300&&["r4173","r5191"].every(id=>kept.buys.some(b=>b.id===id)),kept);
t("decline sticks: local newest and remote equals local",st(a.w).lastSaved>2000&&JSON.stringify(docs[PATH])===JSON.stringify(st(a.w)),[st(a.w).lastSaved,docs[PATH].lastSaved]);
t("download previous copy offered after a decline",$(a.w,"dlp").hidden===false&&$(a.w,"dlph").hidden===false);
// Equal timestamps: in step, nothing replaced, written or kept.
docs={[PATH]:S(312300,3000)};
a=boot(D(2026,11,3),{"money-tool-v1":JSON.stringify(S(100000,3000)),"money-tool-prev":"{\"marker\":7}"},fakeClaude(docs));await wait(900);
t("equal timestamps: nothing changes",a.w.localStorage.getItem("money-tool-prev")==="{\"marker\":7}"&&st(a.w).inc===100000&&docs[PATH].inc===312300&&/Claude account/.test($(a.w,"sync").textContent),[a.w.localStorage.getItem("money-tool-prev"),st(a.w).inc,docs[PATH].inc]);
// Accepting keeps this browser's own purchases aside.
docs={[PATH]:S(312300,2000,{buys:remoteOnly})};
a=boot(D(2026,11,3),{"money-tool-v1":JSON.stringify(S(100000,1000,{buys:many(12)}))},askSetup(docs,true));await wait(50);
kept=JSON.parse(a.w.localStorage.getItem("money-tool-prev")||"null");
t("accept: local-only purchases kept aside",st(a.w).buys.length===2&&kept&&kept.buys.length===12&&kept.buys.some(b=>b.id==="b11"),kept&&kept.buys.length);
// The button downloads the kept copy in the backup format, with "previous" in the name; hidden when nothing is kept.
let file=null;
a=boot(D(2026,11,3),{"money-tool-prev":JSON.stringify(S(4173,1000))},w=>{w.URL.createObjectURL=b=>{file={blob:b};return"blob:x"};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){file.name=this.download}});await wait(50);
t("download previous copy shown when a copy is kept",$(a.w,"dlp").hidden===false);
click(a.w,$(a.w,"dlp"));await wait(20);
const text=file&&await file.blob.text();
t("previous copy downloads with previous in the name",file&&/^monthly-money-previous-2026-11-03\.json$/.test(file.name)&&JSON.parse(text).inc===4173,file&&file.name);
a=boot(D(2026,11,3),{"money-tool-v1":JSON.stringify(S(100000,1000))});await wait(50);
t("download previous copy hidden when nothing is kept",$(a.w,"dlp").hidden===true&&$(a.w,"dlph").hidden===true);

a=boot(D(2026,11,3),{},fakeClaude({},{signedOut:true}));await wait(50);
t("signed out: browser only",/not signed in/.test($(a.w,"sync").textContent));
done("sync");
})();
