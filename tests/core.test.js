// Cycles, purchases, chips, history/lock, projection, migration from v1/v2.
const {settle,boot,$,st,click,inp,D,t,done}=require("./harness");
(async()=>{
let a=boot(D(2026,10,22));t("fresh no errors",a.errs.length===0,a.errs);
t("fresh state current version",st(a.w).v===6&&st(a.w).buys.length===0);
t("hero text",/Safe to spend/.test($(a.w,"cyout").textContent),$(a.w,"cyout").textContent);
const c=(w,i,day)=>JSON.parse(w.eval(`JSON.stringify(cycleOf("${i}",${day}))`));
t("19th stays in old cycle",c(a.w,"2026-10-19",19).enI==="2026-10-19"&&c(a.w,"2026-10-19",19).stI==="2026-09-20");
t("20th starts new cycle",c(a.w,"2026-10-20",19).stI==="2026-10-20"&&c(a.w,"2026-10-20",19).enI==="2026-11-19");
t("year end",c(a.w,"2026-12-25",19).enI==="2027-01-19"&&c(a.w,"2027-01-19",19).stI==="2026-12-20");
t("day 28 feb",c(a.w,"2027-02-28",28).stI==="2027-01-29"&&c(a.w,"2027-03-01",28).stI==="2027-03-01");
$(a.w,"qv").value="12.34";click(a.w,$(a.w,"qa"));
t("added pence",st(a.w).buys.length===1&&st(a.w).buys[0].pence===1234,JSON.stringify(st(a.w).buys));
t("list shows pennies",/£12\.34/.test($(a.w,"chart").textContent));
click(a.w,a.w.document.querySelector('[data-cat="food"]'));
$(a.w,"qv").value="5";$(a.w,"qd").value="2026-10-20";$(a.w,"qn").value="lunch";click(a.w,$(a.w,"qa"));
let s=st(a.w);t("category+date+note",s.buys[1].category==="food"&&s.buys[1].date==="2026-10-20"&&s.buys[1].note==="lunch");
t("last cat remembered",s.cy.lastCat==="food"&&a.w.document.querySelector('[data-cat="food"]').getAttribute("aria-pressed")==="true");
t("amex tab derived",/£5/.test(a.w.document.querySelector('[data-cs="food"]').textContent));
$(a.w,"qv").value="1";$(a.w,"qd").value="2026-12-01";click(a.w,$(a.w,"qa"));await settle();t("future rejected",st(a.w).buys.length===2&&/future/.test((a.w.__alerts||[]).join()));
$(a.w,"mb").value="100";click(a.w,$(a.w,"mm"));await settle();s=st(a.w);
const tot=s.buys.filter(b=>b.date>="2026-10-20").reduce((x,b)=>x+b.pence,0);
t("match balance",tot===10000&&s.buys.some(b=>b.note==="Match Amex balance"),tot);
click(a.w,$(a.w,"qu"));t("undo removes last",st(a.w).buys.length===2);
const V3=(buys,extra)=>JSON.stringify(Object.assign({v:3,inc:240000,lines:[{n:"Amex",a:60000,g:"Spend",r:"amex"}],amex:[{id:"food",n:"Food",p:20000}],cy:{day:19,debit:12,lastCat:""},buys,inv:{},bz:{},hist:[]},extra||{}));
a=boot(D(2026,10,22),{"money-tool-v1":V3([{id:"a",date:"2026-10-05",pence:4000,category:"food",note:""},{id:"b",date:"2026-08-25",pence:1000,category:"",note:""}])});
t("no errs partial v3",a.errs.length===0,a.errs);
s=st(a.w);t("auto hist rows",s.hist.length===2&&s.hist.every(h=>!h.locked)&&s.hist[1].spent===4000&&s.hist[0].spent===1000,JSON.stringify(s.hist));
t("hist cats stored",s.hist[1].cats.some(x=>x.n==="Food"&&x.s===4000)&&s.hist[0].cats.some(x=>x.n==="Unassigned"&&x.s===1000));
t("hist shows",/Sept? to 19 Oct/.test($(a.w,"hist").textContent),$(a.w,"hist").textContent);
t("hero reset (current cycle empty)",/£0 of £600/.test($(a.w,"cyout").textContent),$(a.w,"cyout").textContent);
click(a.w,$(a.w,"close"));await settle();s=st(a.w);t("lock latest finished",s.hist[1].locked===true&&s.hist[0].locked===false);
$(a.w,"qv").value="3";$(a.w,"qd").value="2026-10-10";click(a.w,$(a.w,"qa"));await settle();t("locked blocks add",st(a.w).buys.length===2&&/locked/.test((a.w.__alerts||[]).join()));
click(a.w,a.w.document.querySelector("[data-ul]"));await settle();t("unlock",st(a.w).hist.find(h=>h.k==="2026-10-19").locked===false);
const base=d=>boot(d,{"money-tool-v1":V3([{id:"a",date:"2026-10-05",pence:55000,category:"",note:""}],{amex:[]})});
const b1=base(D(2026,10,19)),b2=base(D(2026,10,20));
t("statement day: still old cycle",/£550 of £600/.test($(b1.w,"cyout").textContent)&&/Statement day/.test($(b1.w,"cyout").textContent),$(b1.w,"cyout").textContent);
t("day after: resets",/£0 of £600/.test($(b2.w,"cyout").textContent)&&!/Over/.test($(b2.w,"cyout").textContent),$(b2.w,"cyout").textContent);
t("day after: old cycle in history",st(b2.w).hist.length===1&&st(b2.w).hist[0].spent===55000);
const p1=boot(D(2026,10,20),{"money-tool-v1":V3([{id:"a",date:"2026-10-20",pence:15000,category:"",note:""}],{amex:[]})});
const pm=$(p1.w,"cyout").textContent.replace(/\s+/g," ").match(/Projected bill ?£([\d,]+)/);
const pr=pm?+pm[1].replace(",",""):NaN;
t("projection damped",pr>1000&&pr<1500,pr);
const v2={inc:2400,lines:[{n:"Card payment",a:100,g:"Fixed"},{n:"Trip savings",a:300,g:"Save"},{n:"Amex (monthly spend)",a:600,g:"Spend"},{n:"ISA",a:200,g:"Save"},{n:"Savings",a:200,g:"Save"}],amex:[{n:"Food",p:200,s:0}],cy:{spent:381,day:19,log:[{d:"2026-10-02",a:25.5}]},inv:{sb:640,sr:8,ib:970,ir:12},bz:{target:1650,saved:0,date:"2027-03-15"},hist:[{m:"Sep 2026",spent:540,plan:600}]};
const m=boot(D(2026,10,22),{"money-tool-v1":JSON.stringify(v2)});
t("v2 no errs",m.errs.length===0,m.errs);s=st(m.w);
t("v2 pence",s.inc===240000&&s.lines[2].a===60000&&s.inv.ib===97000&&s.trip.target===165000&&s.trip.date==="2027-03-15"&&s.amex[0].p===20000&&!("bz" in s));
t("v2 roles",s.lines.map(l=>l.r).join()==="none,trip,amex,isa,savings",s.lines.map(l=>l.r).join());
t("v2 purchases total 381",s.buys.reduce((x,b)=>x+b.pence,0)===38100&&s.buys.some(b=>b.pence===2550&&b.date==="2026-10-02"),JSON.stringify(s.buys));
t("v2 hist legacy locked",s.hist.some(h=>h.m==="Sep 2026"&&h.locked&&h.spent===54000&&h.k===""));
t("v2 raw kept",!!m.w.localStorage.getItem("money-tool-v2"));
const m1=boot(D(2026,10,22),{"money-tool-v1":JSON.stringify({inc:2000,lines:[{n:"Rent",a:700,g:"Fixed"}]})});
t("v1 no trip data no crash",m1.errs.length===0&&st(m1.w).trip.target===100000&&st(m1.w).trip.date==="2027-04-01"&&st(m1.w).card.balance===0,m1.errs);
const dbt=$(m.w,"cyb");inp(m.w,dbt,"25");
t("debit setting",st(m.w).cy.debit===25&&/Debit around/.test($(m.w,"cyout").textContent));
$(m.w,"qn").value='<img src=x onerror=alert(1)>';$(m.w,"qv").value="1";click(m.w,$(m.w,"qa"));
t("note escaped",!m.w.document.querySelector("#chart img"));
const bad=boot(D(2026,10,22),{"money-tool-v1":"{not json"});
t("corrupt data kept aside",bad.errs.length===0&&bad.w.localStorage.getItem("money-tool-corrupt")==="{not json"&&/Couldn't read/.test($(bad.w,"sv").textContent));
// In-page dialogs: tell, cancel/Escape, askText, queue, textContent.
a=boot(D(2026,10,22));
a.w.confirm=()=>true;a.w.__alerts=[];
a.w.eval('tell("Hello <b>x</b>")');await settle();
t("tell shows message, no Cancel",a.w.__alerts.join()==="Hello <b>x</b>"&&$(a.w,"dlgc").hidden&&!$(a.w,"dlg").hasAttribute("open"),a.w.__alerts);
a=boot(D(2026,10,22),{"money-tool-v1":V3([{id:"a",date:"2026-10-05",pence:4000,category:"food",note:""}])});
a.w.confirm=()=>false;click(a.w,$(a.w,"reset"));await settle();
t("cancelled reset changes nothing",st(a.w).buys.length===1);
a.w.confirm=()=>{};let r2;a.w.eval('ask("Sure?","Yes")').then(v=>r2=v);await settle();
$(a.w,"dlg").dispatchEvent(new a.w.Event("cancel",{cancelable:true}));await settle();
t("cancel event resolves false and closes",r2===false&&!$(a.w,"dlg").hasAttribute("open"),r2);
a.w.prompt=()=>null;t("askText cancel is null",(await a.w.eval('askText("Paste","Go")'))===null);
a.w.prompt=()=>"abc";const order=[];
a.w.eval('tell("first")').then(()=>order.push("1"));a.w.eval('askText("second","Go")').then(v=>order.push(v));await settle();
t("queued dialogs show one after the other",a.w.__alerts.slice(-2).join()==="first,second"&&order.join()==="1,abc",order);
a.w.__alerts=[];a.w.eval('tell("<img src=x onerror=alert(1)>")');await settle();
t("message is text, not markup",!$(a.w,"dlgm").querySelector("img")&&a.w.__alerts[0]==="<img src=x onerror=alert(1)>");
a=boot(D(2026,10,22),{"money-tool-v1":V3([{id:"a",date:"2026-10-21",pence:4000,category:"food",note:"Corner shop"},{id:"b",date:"2026-10-05",pence:900,category:"",note:"Old cycle shop"}])});
t("today list: this cycle only, shop first",/Corner shop/.test($(a.w,"chart").textContent)&&!/Old cycle shop/.test($(a.w,"chart").textContent),$(a.w,"chart").textContent);
click(a.w,a.w.document.querySelector('[data-lg="a"]'));await settle();
t("delete offers undo",st(a.w).buys.length===1&&!$(a.w,"ub").hidden&&/Spend removed/.test($(a.w,"ubm").textContent));
click(a.w,$(a.w,"ubb"));await settle();t("undo restores it",st(a.w).buys.length===2&&$(a.w,"ub").hidden);
click(a.w,a.w.document.querySelector('[data-lg="a"]'));await settle();$(a.w,"qv").value="2";click(a.w,$(a.w,"qa"));click(a.w,$(a.w,"ubb"));await settle();
t("undo after a later edit does nothing",st(a.w).buys.length===2&&!st(a.w).buys.some(b=>b.id==="a"));
{const dt=boot(null,{});const dq=$(dt.w,"qd");
t("empty date has class",dq.classList.contains("empty")&&$(dt.w,"cardEnd").classList.contains("empty"));
dq.value="2026-10-20";dq.dispatchEvent(new dt.w.Event("input",{bubbles:true}));t("filled date drops class",!dq.classList.contains("empty"));
$(dt.w,"qv").value="3";click(dt.w,$(dt.w,"qa"));t("qd empty again after quick-add",dq.value===""&&dq.classList.contains("empty"));
const rows=dt.w.document.querySelectorAll("#lines .ln");
t("budget row markup intact",rows.length>0&&[...rows].every(r=>r.querySelector('input[type=text][data-f="n"]')&&r.querySelector("select.rs")&&r.querySelector('input[type=number][data-f="a"]')&&r.querySelector("button.x")),rows.length);}

// ---- Left-after-everything bars, shop icons, category dots ----
{
const z=boot(D(2026,10,22),{"money-tool-v1":V3([{id:"a",date:"2026-10-21",pence:4000,category:"food",note:"shop alpha"},{id:"b",date:"2026-10-20",pence:900,category:"",note:""},{id:"c",date:"2026-10-21",pence:300,category:"food",note:"<img src=x>"}],{amex:[{id:"food",n:"Food",p:20000},{id:"fun",n:"<img src=x>",p:5000}]})});
const rows=[...$(z.w,"sum").querySelectorAll(".bg")];
t("leftover: one bar row per group, no legend",rows.length===3&&!$(z.w,"sum").querySelector(".leg,.bar")&&rows.every(r=>r.querySelector(".bt")),$(z.w,"sum").innerHTML);
t("leftover: group names and amounts",rows.map(r=>r.firstElementChild.textContent).join("|")==="Fixed costs£0|Saving£0|Spending£600",rows.map(r=>r.firstElementChild.textContent).join("|"));
t("leftover: empty groups have no fill, spending has one",rows[0].querySelector("i")===null&&rows[2].querySelector("i")&&rows[2].querySelector("i").getAttribute("style").includes("width:"));
const rb=[...$(z.w,"chart").querySelectorAll(".rb.shop")];
t("recent: rows carry an icon with the initial and category colour",rb.length===3&&rb.some(r=>r.querySelector("b").textContent==="shop alpha"&&r.querySelector(".ic").textContent==="S"&&r.querySelector(".ic").getAttribute("style").includes("--s1"))&&rb.some(r=>r.querySelector("b").textContent==="Unassigned"&&r.querySelector(".ic").textContent==="U"&&r.querySelector(".ic").getAttribute("style").includes("--s0"))&&rb.some(r=>r.querySelector(".ic").textContent==="I")&&rb[0].querySelector(".ic").getAttribute("aria-hidden")==="true",rb.map(r=>r.innerHTML).join("\n"));
t("recent: initial skips leading symbols",z.w.eval('shopIcon([],"","*** zed")').includes(">Z<")&&z.w.eval('shopIcon([],"","")').includes(">?<"));
const dots=[...$(z.w,"amex").querySelectorAll(".row > .dot")];
t("amex rows: dot per category plus hidden row",dots.length===4&&dots[0].getAttribute("style").includes("var(--s1)")&&dots[1].getAttribute("style").includes("var(--s2)")&&dots[2].getAttribute("style").includes("var(--s3)")&&dots[3].getAttribute("style").includes("var(--s0)"),$(z.w,"amex").innerHTML);
const cd=[...$(z.w,"chips").querySelectorAll(".chip .dot")];
t("chips: dot per chip with right colour",cd.length===3&&cd[0].getAttribute("style").includes("var(--s1)")&&cd[1].getAttribute("style").includes("var(--s2)"));
t("markup escaped: no img element made",z.errs.length===0&&!z.w.document.querySelector("img"),z.errs);
}
// An oversized state is truncated to the caps and still boots.
{const long="n".repeat(500),cats=Array.from({length:500},(_,i)=>({id:"c"+i,n:long,p:100})),
 lines=Array.from({length:300},(_,i)=>({n:long,a:100,g:"Spend",r:"none"})),
 big=boot(D(2026,11,3),{"money-tool-v1":JSON.stringify({v:6,inc:1000,lines,amex:cats,buys:[{id:"i".repeat(300),date:"2026-11-02",pence:100,category:"c1",note:long}],hist:[],lastSaved:5})});
 const g=st(big.w);
 t("oversized state is capped",big.errs.length===0&&g.lines.length===200&&g.amex.length===60&&g.amex[0].id==="c0"&&g.lines[0].n.length===80&&g.buys[0].id.length===64&&g.buys[0].note.length<=60,big.errs.concat([g.lines.length,g.amex.length]));
 // Purchases and history are oldest-first: past the cap the newest are kept. History labels are cut to 80.
 const mig=big.w.eval("migrate"),many=Array.from({length:20003},(_,i)=>({id:"p"+i,date:"2026-11-02",pence:417,category:"",note:""}));
 const hist=Array.from({length:243},(_,i)=>({k:"2026-01-19",m:"m"+i+long,plan:1,spent:1,cats:[],locked:true}));
 const m=mig({v:6,inc:1000,lines:[],buys:many,hist,lastSaved:5});
 t("purchases keep the newest 20000",m.buys.length===20000&&m.buys[0].id==="p3"&&m.buys[19999].id==="p20002",[m.buys.length,m.buys[0].id]);
 t("history keeps the newest 240, labels cut to 80",m.hist.length===240&&m.hist[0].m.startsWith("m3n")&&m.hist[239].m.startsWith("m242n")&&m.hist.every(h=>h.m.length===80),[m.hist.length,m.hist[0].m.length]);
 const log=Array.from({length:20003},(_,i)=>({d:"2026-11-0"+(1+i%2),a:i===20002?7.31:1}));
 const lg=mig({v:2,inc:1000,lines:[],cy:{log},lastSaved:5});
 t("legacy log keeps the newest 20000",lg.buys.length===20000&&lg.buys[19999].pence===731,lg.buys.length);}
done("core");
})();
