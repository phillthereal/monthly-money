// 0% card tracker, trip rename and migration, partner name setting, and a scan for personal wording.
const {boot,$,st,click,inp,D,t,done}=require("./harness");
const fs=require("fs");
const NOW=D(2026,10,22);
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const norm=s=>s.replace(/\s+/g," ").trim();
// The old name of the trip role, built from parts so this file doesn't contain it as a word of its own.
const OLD_ROLE="bra"+"zil";

// A v5 state with one card line (payment in pounds, or none when payment is null) and the given card.
const mk=(balancePounds,end,payment,now)=>{
  const lines=[{n:"Rent",a:80000,g:"Fixed",r:"none"}];
  if(payment!==null)lines.push({n:"Card payment",a:payment*100,g:"Fixed",r:"card"});
  return boot(now||NOW,{"money-tool-v1":JSON.stringify({v:5,inc:250000,lines,card:{balance:balancePounds*100,end}})});
};
const out=a=>norm($(a.w,"cardout").textContent);
const FOOT="Update the balance after each payment.";

// ---- cardOutlook maths, through the rendered text ----
const END_JUL=iso(D(2027,7,15));                       // 9 months after October 2026
let a=mk(2400,END_JUL,200);t("no errs",a.errs.length===0,a.errs);
t("short: months and payment",/9 months until the 0% ends · you pay £200\/month/.test(out(a)),out(a));
t("short: balance at end",/Balance when the 0% ends ?£600/.test(out(a))&&$(a.w,"cardout").querySelector("b").className==="bad",out(a));
t("short: needs more",/£600 would still be owing when the 0% ends\. Raise the payment to about £267\/month to clear it\./.test(out(a)),out(a));
t("footnote",out(a).endsWith(FOOT),out(a));
t("pure function",JSON.stringify(a.w.eval(`cardOutlook({balance:240000,end:"${END_JUL}"},20000,new Date(2026,9,22))`))===JSON.stringify({months:9,owedAtEnd:60000,monthsToClear:12,needPerMonth:26700}));

a=mk(2400,END_JUL,400);
t("early: cleared",/Balance when the 0% ends ?£0/.test(out(a))&&$(a.w,"cardout").querySelector("b").className==="ok",out(a));
t("early: message",/Cleared in 6 months, about 3 months before the 0% ends\./.test(out(a)),out(a));
t("early: no raise advice",!/Raise the payment/.test(out(a)));
a=mk(1800,END_JUL,200);
t("exact: no 'about' part",/Cleared in 9 months\./.test(out(a))&&!/about/.test(out(a)),out(a));
a=mk(900,iso(D(2027,1,10)),100);
t("need rounds up, not over",/£600 would still be owing/.test(out(a))&&/about £300\/month/.test(out(a)),out(a));
a=mk(2000,iso(D(2027,1,10)),100);
t("need rounds up to whole pounds",/about £667\/month/.test(out(a)),out(a));
a=mk(1000,iso(D(2027,1,10)),100);
t("need rounds up even when the fraction is small",/about £334\/month/.test(out(a)),out(a));
a=mk(100,iso(D(2026,11,30)),100);
t("one month singular",/1 month until the 0% ends/.test(out(a))&&/Cleared in 1 month\./.test(out(a)),out(a));
a=mk(100,iso(D(2026,11,30)),50);
t("one month short",/£50 would still be owing/.test(out(a))&&/about £100\/month/.test(out(a)),out(a));

a=mk(500,iso(D(2026,10,31)),100);
t("months 0: ends this month",/The 0% ends this month or has already ended\. · you pay £100\/month/.test(out(a)),out(a));
t("months 0: owed now",/Balance when the 0% ends ?£500/.test(out(a))&&/£500 is owed now\./.test(out(a))&&!/Raise the payment/.test(out(a)),out(a));
a=mk(500,iso(D(2026,3,1)),100);
t("months 0: already ended",/already ended/.test(out(a))&&/£500 is owed now\./.test(out(a)),out(a));

a=mk(2400,END_JUL,null);
t("no card line: warning",/No line has the 0% card role, so there is no monthly payment to project\./.test(out(a))&&!/Balance when/.test(out(a))&&$(a.w,"cardout").querySelector(".bad"),out(a));
t("no card line: footnote kept",out(a).endsWith(FOOT));
a=mk(2400,END_JUL,0);
t("payment 0 with a card line",/you pay £0\/month/.test(out(a))&&/£2,400 would still be owing/.test(out(a))&&/about £267\/month/.test(out(a)),out(a));
a=mk(2400,"",200);
t("no end date",/Add the date the 0% ends\./.test(out(a))&&!/Balance when/.test(out(a))&&out(a).endsWith(FOOT),out(a));
a=mk(2400,"",null);
t("no end date beats no card line",/Add the date the 0% ends\./.test(out(a)),out(a));
a=mk(0,END_JUL,200);
t("balance 0",/Enter your balance and the date the 0% ends to see if your payments clear it in time\./.test(out(a))&&out(a).endsWith(FOOT),out(a));
a=mk(0,"",null);
t("balance 0, nothing else",/Enter your balance/.test(out(a)));

// ---- Goals tab layout and inputs ----
a=boot(NOW);
const goals=norm(a.w.document.querySelector('section[data-t="goals"]').textContent);
t("goals order",goals.indexOf("Trip fund")>=0&&goals.indexOf("Trip fund")<goals.indexOf("0% card")&&goals.indexOf("0% card")<goals.indexOf("Savings and investments"),goals);
t("card inputs",$(a.w,"cardBal").type==="number"&&$(a.w,"cardEnd").type==="date"&&!!$(a.w,"cardout"));
t("card inputs have aria-labels",!!$(a.w,"cardBal").getAttribute("aria-label")&&!!$(a.w,"cardEnd").getAttribute("aria-label"));
t("card labels",/Balance owed £/.test(goals)&&/0% ends/.test(goals));
t("default card empty",JSON.stringify(st(a.w).card)==='{"balance":0,"end":""}'&&/Enter your balance/.test(out(a)));
inp(a.w,$(a.w,"cardBal"),"2400");inp(a.w,$(a.w,"cardEnd"),END_JUL);
t("typing saves",st(a.w).card.balance===240000&&st(a.w).card.end===END_JUL,JSON.stringify(st(a.w).card));
t("default payment £100 shown",/9 months until the 0% ends · you pay £100\/month/.test(out(a))&&/£1,500 would still be owing/.test(out(a))&&/about £267\/month/.test(out(a)),out(a));
const ci=st(a.w).lines.findIndex(l=>l.r==="card");
inp(a.w,a.w.document.querySelector(`input[data-i="${ci}"][data-f="a"]`),"300");
t("editing the card line updates the outlook",/you pay £300\/month/.test(out(a))&&/Cleared in 8 months, about 1 month before/.test(out(a)),out(a));
inp(a.w,$(a.w,"cardBal"),"-50");t("negative balance clamps to 0",st(a.w).card.balance===0);
inp(a.w,$(a.w,"cardEnd"),"");t("clearing the date",st(a.w).card.end==="");
const sel=a.w.document.querySelector(`select[data-i="${ci}"]`);
t("role dropdown has 0% card",[...sel.options].some(o=>o.value==="card"&&o.textContent==="0% card"),[...sel.options].map(o=>o.textContent).join());
t("role dropdown has Trip fund, no old role",[...sel.options].some(o=>o.value==="trip"&&o.textContent==="Trip fund")&&![...sel.options].some(o=>o.value===OLD_ROLE));
sel.value="none";sel.dispatchEvent(new a.w.Event("input",{bubbles:true}));
inp(a.w,$(a.w,"cardBal"),"1000");inp(a.w,$(a.w,"cardEnd"),END_JUL);
t("removing the role warns",/No line has the 0% card role/.test(out(a)),out(a));

// ---- Validation in migrate ----
const mig=card=>{const b=boot(NOW,{"money-tool-v1":JSON.stringify({v:5,inc:1,lines:[],card})});return{b,c:st(b.w).card}};
let r=mig({balance:-500,end:"2027-02-30"});t("migrate: negative balance, impossible date",r.c.balance===0&&r.c.end===""&&r.b.errs.length===0,JSON.stringify(r.c));
r=mig({balance:"abc",end:"2027-7-1"});t("migrate: junk balance, non-ISO date",r.c.balance===0&&r.c.end==="",JSON.stringify(r.c));
r=mig({balance:12345,end:20270701});t("migrate: numeric date",r.c.balance===12345&&r.c.end==="",JSON.stringify(r.c));
r=mig({balance:12345.6,end:"2027-07-01"});t("migrate: valid kept, pence integer",r.c.balance===12346&&r.c.end==="2027-07-01",JSON.stringify(r.c));
r=mig(null);t("migrate: card null",r.c.balance===0&&r.c.end==="");
r=mig([1,2]);t("migrate: card array",r.c.balance===0&&r.c.end==="");

// ---- Old data: v4 backup with the old role and field ----
const v4={v:4,inc:240000,lines:[{n:"Pot",a:30000,g:"Save",r:OLD_ROLE},{n:"Amex (monthly spend)",a:60000,g:"Spend",r:"amex"},{n:"Rent",a:75000,g:"Fixed",r:"none"}],amex:[{id:"food",n:"Food",p:60000}],cy:{day:19,debit:12,lastCat:""},buys:[],inv:{sb:60000,sr:8,ib:110000,ir:12},bz:{target:123400,saved:5600,date:"2027-02-01"},hist:[],joint:{split:40,partner:5000,bills:[{id:"x",n:"Rent",a:100000}]},tab:"goals",lastSaved:5,lastBackup:6};
let b=boot(NOW,{"money-tool-v1":JSON.stringify(v4)});
let s=st(b.w);
t("v4 loads",b.errs.length===0&&s.v===5,b.errs);
t("v4 role becomes trip",s.lines[0].r==="trip"&&s.lines.length===3&&!s.lines.some(l=>l.r==="card"),JSON.stringify(s.lines));
t("v4 bz becomes trip, same numbers",s.trip.target===123400&&s.trip.saved===5600&&s.trip.date==="2027-02-01"&&!("bz" in s),JSON.stringify(s.trip));
t("v4 gets empty card, no card line",JSON.stringify(s.card)==='{"balance":0,"end":""}');
t("v4 joint kept, name defaults",s.joint.split===40&&s.joint.partner===5000&&s.joint.name==="Partner");
const tripText=norm($(b.w,"tripout").textContent);
t("v4 trip outlook",/4 months to go/.test(tripText)&&/putting in £300/.test(tripText)&&/£1,256/.test(tripText)&&/On track/.test(tripText),tripText);
// Same file restored through Restore (paste) into an app that already has other data.
b=boot(NOW);b.w.prompt=()=>JSON.stringify(v4);click(b.w,$(b.w,"imp"));s=st(b.w);
t("v4 paste restore",b.errs.length===0&&s.lines[0].r==="trip"&&s.trip.target===123400&&s.trip.saved===5600&&s.v===5&&s.tab==="today",JSON.stringify(s.trip));
t("restore refreshes inputs",$(b.w,"bt").value==="1234"&&$(b.w,"bs").value==="56"&&$(b.w,"cardBal").value==="0"&&$(b.w,"jnm").value==="Partner");
// Round trip: what the app saves restores to the same thing.
const saved=b.w.localStorage.getItem("money-tool-v1");
const rt=boot(NOW,{"money-tool-v1":saved});
const strip=x=>{const o=JSON.parse(x);delete o.lastSaved;delete o.lastBackup;return JSON.stringify(o)};
t("v5 round trip",rt.errs.length===0&&strip(rt.w.localStorage.getItem("money-tool-v1"))===strip(saved));
// Old name-based detection
const named=boot(NOW,{"money-tool-v1":JSON.stringify({inc:2000,lines:[{n:"Holiday trip",a:100,g:"Save"},{n:OLD_ROLE+" fund",a:50,g:"Save"},{n:"Rent",a:700,g:"Fixed"}]})});
t("name detection finds trip",named.errs.length===0&&st(named.w).lines.map(l=>l.r).join()==="trip,trip,none",st(named.w).lines.map(l=>l.r).join());
t("trip warning wording",!/Trip fund role/.test($(named.w,"tripout").textContent));
const none=boot(NOW,{"money-tool-v1":JSON.stringify({v:5,inc:1,lines:[{n:"Rent",a:1,g:"Fixed",r:"none"}]})});
t("no trip role warns",/No line has the Trip fund role, so the fund shows £0 a month\./.test($(none.w,"tripout").textContent)&&/Raise the Trip fund line/.test($(none.w,"tripout").textContent),$(none.w,"tripout").textContent);

// ---- v3 and v1 still load ----
const v3={v:3,inc:240000,lines:[{n:"Amex",a:60000,g:"Spend",r:"amex"},{n:"Trip savings",a:20000,g:"Save"}],amex:[{id:"food",n:"Food",p:20000}],cy:{day:19,debit:12,lastCat:""},buys:[{id:"a",date:"2026-10-05",pence:4000,category:"food",note:""}],inv:{},bz:{},hist:[]};
b=boot(NOW,{"money-tool-v1":JSON.stringify(v3)});s=st(b.w);
t("v3 loads",b.errs.length===0&&s.v===5&&s.buys.length===1&&s.card.balance===0&&s.lines.length===2&&s.lines[1].r==="trip"&&s.trip.target===100000,b.errs);
t("v3 default trip date",s.trip.date==="2027-04-01",s.trip.date);
b=boot(NOW,{"money-tool-v1":JSON.stringify({inc:2000,lines:[{n:"Rent",a:700,g:"Fixed"}]})});s=st(b.w);
t("v1 loads",b.errs.length===0&&s.v===5&&s.inc===200000&&s.lines.length===1&&s.card.end===""&&s.joint.name==="Partner",b.errs);
b=boot(NOW,{"money-tool-v1":JSON.stringify({v:4,inc:1,lines:[],bz:{target:5000,date:"nope"}})});
t("invalid trip date falls back to default",st(b.w).trip.date==="2027-04-01"&&st(b.w).trip.target===5000,JSON.stringify(st(b.w).trip));
b=boot(D(2026,8,31));t("default trip date: six months on",st(b.w).trip.date==="2027-02-01",st(b.w).trip.date);
b=boot(D(2026,11,5));t("default trip date: across a year end",st(b.w).trip.date==="2027-05-01"&&b.w.eval('defaultTripDate(new Date(2026,6,31))')==="2027-01-01"&&b.w.eval('defaultTripDate(new Date(2026,11,31))')==="2027-06-01");

// ---- Partner name ----
a=boot(NOW);
const jt=()=>norm(a.w.document.querySelector('section[data-t="joint"]').textContent);
t("name input",$(a.w,"jnm").type==="text"&&$(a.w,"jnm").getAttribute("aria-label")==="Partner's name"&&$(a.w,"jnm").maxLength===30&&$(a.w,"jnm").value==="Partner");
t("default name shown",/Partner's name/.test(jt())&&/Partner pays in £ a month/.test(jt())&&/Partner pays in £150\.00 against a share of £147\.50/.test(jt()),jt());
inp(a.w,$(a.w,"jnm"),"  Sam  ");
t("name trimmed and saved",st(a.w).joint.name==="Sam");
t("name in label and summary",/Sam pays in £ a month/.test(jt())&&/Sam pays in £150\.00 against a share of £147\.50/.test(jt())&&!/Partner pays/.test(jt()),jt());
inp(a.w,$(a.w,"jpt"),"100");t("name with short note",/Sam pays in £100\.00 against a share of £147\.50 · £47\.50 short/.test(jt()),jt());
inp(a.w,$(a.w,"jnm"),"x".repeat(45));t("name capped at 30",st(a.w).joint.name==="x".repeat(30));
inp(a.w,$(a.w,"jnm"),"   ");t("blank name falls back",st(a.w).joint.name==="Partner"&&/Partner pays in £ a month/.test(jt()));
inp(a.w,$(a.w,"jnm"),"<img src=x onerror=1>");
t("name escaped: no img",!a.w.document.querySelector("section img")&&!a.w.document.querySelector("#jhero img")&&!a.w.document.querySelector("img[src=x]"));
t("name escaped: shown as text",/<img src=x onerror=1> pays in £100\.00/.test(jt())&&/<img src=x onerror=1> pays in £ a month/.test(jt()),jt());
t("name escaped: kept as typed",st(a.w).joint.name==="<img src=x onerror=1>");
const fresh=boot(NOW,{"money-tool-v1":a.w.localStorage.getItem("money-tool-v1")});
t("name escaped after reload",fresh.errs.length===0&&!fresh.w.document.querySelector("img[src=x]")&&$(fresh.w,"jnm").value==="<img src=x onerror=1>");
const nm=x=>st(boot(NOW,{"money-tool-v1":JSON.stringify({v:5,inc:1,lines:[],joint:{name:x}})}).w).joint.name;
t("migrate name",nm(123)==="Partner"&&nm("")==="Partner"&&nm("  ")==="Partner"&&nm(null)==="Partner"&&nm("  Alex ")==="Alex"&&nm("y".repeat(40))==="y".repeat(30)&&nm(" "+"z".repeat(35))==="z".repeat(30));
// Restoring a backup with a name rebuilds the input and the label.
a.w.prompt=()=>JSON.stringify({v:5,inc:1,lines:[{n:"Joint account",a:10000,g:"Fixed",r:"joint"}],joint:{name:"Riley"}});click(a.w,$(a.w,"imp"));
t("restore sets name",$(a.w,"jnm").value==="Riley"&&/Riley pays in £ a month/.test(jt()));

// ---- Neutral wording ----
a=boot(NOW);
t("savings note wording",/Investment returns aren't guaranteed/.test($(a.w,"invout").textContent)&&!/good-year|12%/.test($(a.w,"invout").textContent),$(a.w,"invout").textContent);
t("placeholder defaults",st(a.w).inc===250000&&st(a.w).lines.length===8&&st(a.w).joint.bills.length===6&&st(a.w).inv.sb===50000&&st(a.w).inv.ir===7&&st(a.w).trip.target===100000&&st(a.w).amex.reduce((x,c)=>x+c.p,0)===50000);
t("default roles",st(a.w).lines.map(l=>l.r).join()==="isa,savings,joint,none,trip,none,amex,card");
const FORBIDDEN=["caio","brazil","therapy","barclay","santander","explorer","ivanov","hotmail","healix","athens","antler"];
const page=fs.readFileSync(process.env.FILE||__dirname+"/../index.html","utf8").toLowerCase();
FORBIDDEN.forEach(w=>t("index.html has no '"+w+"'",!page.includes(w),page.indexOf(w)));
done("card");
