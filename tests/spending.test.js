// Spending tab: cycles, category trends, top shops, subscription detection, notes, and the searchable list.
const {settle,boot,$,st,click,inp,D,t,done}=require("./harness");
(async()=>{
const B=(id,date,pence,note,category)=>({id,date,pence,category:category||"",note});
const buys=[B("a1","2026-08-01",999,"STREAMCO"),B("a2","2026-09-01",999,"STREAMCO"),B("a3","2026-10-01",999,"STREAMCO"),
 B("g1","2026-08-05",5000,"GROCER ONE","food"),B("g2","2026-09-05",5000,"GROCER ONE","food"),B("g3","2026-10-05",12000,"GROCER ONE","food"),
 B("c1","2026-10-25",1500,"GROCER ONE","food"),B("x1","2026-10-03",100,"<img src=x onerror=alert(1)>","fun")];
for(let i=0;i<9;i++)buys.push(B("b"+i,"2026-10-"+String(2+i).padStart(2,"0"),280,"BUSCO","fun"));
const V6=JSON.stringify({v:6,inc:250000,lines:[{n:"Amex",a:10000,g:"Spend",r:"amex"}],amex:[{id:"food",n:"Food",p:5000},{id:"fun",n:"Going out",p:5000}],
 cy:{day:19,debit:12,lastCat:""},buys,hist:[{k:"2026-09-19",m:"20 Aug to 19 Sept",plan:10000,spent:5999,cats:[],locked:true}]});
let a=boot(D(2026,11,3),{"money-tool-v1":V6});
t("no errors",a.errs.length===0,a.errs);
t("nav has Spending",!!a.w.document.querySelector('nav [data-tab="spending"]')&&a.w.document.querySelectorAll("nav button").length===6);
const ev=x=>JSON.parse(a.w.eval(`JSON.stringify(${x})`));
const C='spendingCycles({buys:state.buys,statementDay:19,hist:state.hist,amexPlan:10000,today:"2026-11-03"})';
const cyc=ev(`${C}.map(c=>[c.k,c.spent,c.current,c.locked,c.buys.length])`);
t("one row per cycle, oldest first",JSON.stringify(cyc.map(c=>c[0]))==='["2026-08-19","2026-09-19","2026-10-19","2026-11-19"]',cyc);
t("cycle totals",cyc[1][1]===5999&&cyc[2][1]===15619&&cyc[3][1]===1500&&cyc[3][2]===true&&cyc[1][3]===true,cyc);
t("subscriptions: nothing is guessed from repeating charges",JSON.stringify(ev(`findSubscriptions(${C},state.amex).map(s=>s.name)`))==='[]');
t("subscriptions: a shop the user adds is listed with its latest charge",JSON.stringify(ev(`findSubscriptions(${C},state.amex,{add:["STREAMCO"]}).map(s=>[s.name,s.pence])`))==='[["STREAMCO",999]]');
t("top shop",ev(`topShops(${C},8)[0].name`)==="GROCER ONE"&&ev(`topShops(${C},8)[0].pence`)===18500);
const food=ev(`categoryTrends(${C},state.amex).rows.find(r=>r.id==="food")`);
t("food trend: last vs usual",food.last===12000&&food.usual===5000,food);
const notes=$(a.w,"snotes").textContent;
t("note: over plan last month",/£56 over/.test(notes),notes);
t("note: category jump",/Food was £120 last month, £70 more than your usual £50/.test(notes),notes);
t("note: small purchases",/11 small purchases under £10 added up to £36/.test(notes),notes);
t("note: no repeating-charges note without confirmed subscriptions",!/Repeating charges/.test(notes),notes);
t("chart drawn with plan line",!!$(a.w,"smonths").querySelector("svg .pl")&&$(a.w,"smonths").querySelectorAll("path.sbar").length===4);
t("month rows include the locked cycle",/locked/.test($(a.w,"smonths").textContent)&&a.w.document.querySelectorAll("#smonths .mrow").length===4);
t("list shows every purchase, locked cycle included",/17 purchases/.test($(a.w,"slist").textContent)&&/STREAMCO/.test($(a.w,"slist").textContent),$(a.w,"slist").textContent.slice(0,80));
t("names escaped",!a.w.document.querySelector("#slist img, #sshops img, #snotes img"));
inp(a.w,$(a.w,"sq"),"stream");t("search filters",/^3 purchases · £29\.97/.test($(a.w,"slist").textContent),$(a.w,"slist").textContent.slice(0,40));
inp(a.w,$(a.w,"sq"),"");
click(a.w,a.w.document.querySelector('[data-sm="2026-09-19"] b'));await settle();
t("tapping a month filters the list",$(a.w,"sm").value==="2026-09-19"&&/^2 purchases/.test($(a.w,"slist").textContent),$(a.w,"slist").textContent.slice(0,40));
$(a.w,"sm").value="all";$(a.w,"sc").value="unassigned";$(a.w,"sc").dispatchEvent(new a.w.Event("change",{bubbles:true}));
t("category filter: unassigned",/^3 purchases/.test($(a.w,"slist").textContent),$(a.w,"slist").textContent.slice(0,40));
t("read-only: nothing saved by browsing",st(a.w).buys.length===17);
/* ring + budget: finished cycle of the main fixture */
const SEG='ringSegments(spendingCycles({buys:state.buys,statementDay:19,hist:state.hist,amexPlan:10000,today:"2026-11-03"})[2],state.amex)';
const seg=ev(`${SEG}.map(r=>[r.id,r.n,r.pence,r.colour])`);
t("ring segments: category order, Unassigned last, pence, colours",JSON.stringify(seg)===JSON.stringify([["food","Food",12000,"var(--s1)"],["fun","Going out",2620,"var(--s2)"],["","Unassigned",999,"var(--s0)"]]),seg);
const AM='[{id:"p",n:"P"},{id:"q",n:"Q"},{id:"r",n:"R"}]',BY=(id,pence,category)=>`{id:"${id}",date:"2026-10-05",pence:${pence},note:"X",category:"${category}"}`;
const seg2=ev(`ringSegments({buys:[${BY(1,1000,"p")},${BY(2,-1000,"p")},${BY(3,500,"q")},${BY(4,-700,"q")},${BY(5,400,"r")},${BY(6,300,"zz")}]},${AM}).map(r=>[r.id,r.pence])`);
t("ring segments: net <= 0 left out, unknown category is Unassigned",JSON.stringify(seg2)==='[["r",400],["",300]]',seg2);
const nine=JSON.stringify([1,2,3,4,5,6,7,8].map(i=>({id:"c"+i,n:"C"+i})));
t("seriesColour: 7th s7, 8th and unknown s0",ev(`[seriesColour(${nine},"c7"),seriesColour(${nine},"c8"),seriesColour(${nine},"nope"),seriesColour(${nine},"c1")]`).join()==="var(--s7),var(--s0),var(--s0),var(--s1)");
const ring=segs=>{const d=a.w.document.createElement("div");d.innerHTML=a.w.eval(`ringChart(${segs})`);return d};
const SEGS='[{n:"A <b>&C",pence:600,colour:"var(--s1)"},{n:"Two",pence:300,colour:"var(--s2)"},{n:"Three",pence:100,colour:"var(--s0)"}]';
const rc=ring(SEGS),circ=2*Math.PI*78,cs=[...rc.querySelectorAll("circle")];
t("ringChart: one circle per segment, round caps",cs.length===3&&cs.every(c=>c.getAttribute("stroke-linecap")==="round"));
const dashSum=cs.reduce((s,c)=>s+parseFloat(c.getAttribute("stroke-dasharray")),0)+17*3;
t("ringChart: dashes plus gaps fill the circumference",Math.abs(dashSum-circ)<0.5,[dashSum,circ]);
a.w.document.body.insertAdjacentHTML("beforeend",'<div class="rp" id="rfx">'+a.w.eval(`ringChart(${SEGS})`)+"</div>");
const fx=a.w.document.querySelector("#rfx svg"),arc2=fx.querySelectorAll("circle")[1];
a.w.eval("ringFocus")(arc2,50,60);const tip=$(a.w,"tip");
t("ring bubble: names the category with amount, share and total; the middle keeps the total",!tip.hidden&&tip.textContent==="Two£3 · 30%of £10 total"&&fx.querySelector(".rt").textContent==="£10"&&arc2.classList.contains("hi")&&fx.classList.contains("on"),tip.textContent);
fx.querySelector("circle").dataset.n="<img src=x>";a.w.eval("ringFocus")(fx.querySelector("circle"),50,60);
t("ring bubble: name escaped",!tip.querySelector("img")&&/<img src=x>/.test(tip.textContent));
a.w.eval("ringFocus")(null);
t("ring bubble: clears",tip.hidden&&!fx.querySelector(".hi")&&!fx.classList.contains("on"));
a.w.document.getElementById("rfx").remove();
t("ringChart: label escaped",rc.querySelector("circle").getAttribute("aria-label")==="A <b>&C £6"&&!rc.querySelector("b"),rc.innerHTML.slice(0,300));
const r1=ring('[{n:"Solo",pence:500,colour:"var(--s1)"}]').querySelector("circle");
t("ringChart: one segment is a butt-capped full circle",r1.getAttribute("stroke-linecap")==="butt"&&Math.abs(parseFloat(r1.getAttribute("stroke-dasharray"))-circ)<0.5,r1.outerHTML);
const lab=ev('cycleLabel(spendingCycles({buys:state.buys,statementDay:19,hist:state.hist,amexPlan:10000,today:"2026-11-03"})[3].cycle)');
const labOct=ev('cycleLabel(spendingCycles({buys:state.buys,statementDay:19,hist:state.hist,amexPlan:10000,today:"2026-11-03"})[2].cycle)');
const dd=a.w.document;
t("ring default: latest cycle, so far, one legend button, arrows",$(a.w,"sring").textContent.startsWith(lab+" · so far")&&dd.querySelectorAll("#sring button.lg").length===1&&$(a.w,"rnext").disabled&&!$(a.w,"rprev").disabled,$(a.w,"sring").textContent.slice(0,60));
t("budget default follows the same cycle",$(a.w,"sbud").textContent.startsWith(lab+" · so far"),$(a.w,"sbud").textContent.slice(0,60));
click(a.w,$(a.w,"rprev"));await settle();
t("rprev moves ring and budget to the previous cycle",$(a.w,"sring").textContent.startsWith(labOct)&&$(a.w,"sbud").textContent.startsWith(labOct)&&!/so far/.test($(a.w,"sring").textContent)&&dd.querySelectorAll("#sring button.lg").length===3&&!$(a.w,"rnext").disabled,$(a.w,"sring").textContent.slice(0,60));
click(a.w,$(a.w,"rnext"));await settle();
t("rnext returns to the latest cycle",$(a.w,"sring").textContent.startsWith(lab+" · so far")&&$(a.w,"rnext").disabled);
click(a.w,$(a.w,"rprev"));await settle();
click(a.w,dd.querySelector('#sring button.lg[data-scat="fun"]'));await settle();
t("legend click filters month and category",$(a.w,"sm").value==="2026-10-19"&&$(a.w,"sc").value==="fun"&&/^10 purchases/.test($(a.w,"slist").textContent),[$(a.w,"sm").value,$(a.w,"sc").value,$(a.w,"slist").textContent.slice(0,30)]);
click(a.w,dd.querySelector('#sring button.lg[data-scat=""]'));await settle();
t("Unassigned legend click selects unassigned",$(a.w,"sc").value==="unassigned"&&/^1 purchase\b/.test($(a.w,"slist").textContent),[$(a.w,"sc").value,$(a.w,"slist").textContent.slice(0,30)]);
const oct=ev('spendingCycles({buys:state.buys,statementDay:19,hist:state.hist,amexPlan:10000,today:"2026-11-03"})[2]');
/* budgetRows levels */
const BAM='[{id:"g",n:"G",p:1000},{id:"w",n:"W",p:1000},{id:"e",n:"E",p:1000},{id:"b",n:"B",p:1000},{id:"n",n:"N",p:0},{id:"z",n:"Z",p:0}]';
const BB=(id,pence,c)=>`{id:"${id}",date:"2026-10-05",pence:${pence},note:"X",category:"${c}"}`;
const br=ev(`budgetRows({buys:[${BB(1,799,"g")},${BB(2,800,"w")},${BB(3,1000,"e")},${BB(4,1001,"b")},${BB(5,300,"n")}],spent:3900,plan:9000},${BAM}).map(r=>[r.n,r.spent,r.plan,r.level])`);
t("budgetRows: All spending first, levels, zero-plan zero-spend omitted",JSON.stringify(br)===JSON.stringify([["All spending",3900,9000,"good"],["G",799,1000,"good"],["W",800,1000,"warn"],["E",1000,1000,"warn"],["B",1001,1000,"bad"],["N",300,0,"none"]]),br);
const brAll=ev(`budgetRows({buys:[],spent:7200,plan:9000},[]).map(r=>[r.level])`),brAll2=ev(`budgetRows({buys:[],spent:7199,plan:9000},[])[0].level`);
t("budgetRows: All spending uses the cycle totals",JSON.stringify(brAll)==='[["warn"]]'&&brAll2==="good",brAll);
/* second fixture: no plan, over plan, symbol shop names, HTML in a category name */
const S=(id,d,pence,note,category)=>({id,date:"2026-10-"+d,pence,category,note});
const V6b=JSON.stringify({v:6,inc:250000,lines:[{n:"Amex",a:10000,g:"Spend",r:"amex"}],amex:[{id:"c1",n:"Fun <b>bold</b>",p:0},{id:"c2",n:"Food",p:3000},{id:"c3",n:"Zed",p:10000}],
 cy:{day:19,debit:12,lastCat:""},buys:[S("s1","05",4000,"SHOP ALPHA","c1"),S("s2","06",1000,"SHOP ALPHA","c1"),S("s3","07",2500,"#HASH SHOP","c2"),S("s4","08",800,"!!!","c2"),
 S("s5","09",700,"9LIVES CAFE","c2"),S("s6","10",600,"shop beta","c3"),S("s7","11",50,"<img src=x onerror=alert(1)>","c3")],hist:[]});
a=boot(D(2026,11,3),{"money-tool-v1":V6b});
t("fixture 2 boots clean",a.errs.length===0,a.errs);
const bgs=[...a.w.document.querySelectorAll("#sbud .bg")].map(r=>({n:r.querySelector("span").textContent,note:r.querySelector("small"),i:r.querySelector(".bt i")}));
const bg=n=>bgs.find(r=>r.n===n);
t("not the current cycle: no 'so far' in ring",!/so far/.test($(a.w,"sring").textContent)&&bgs[0].n==="All spending");
t("budget: over-plan row note, class, full-width bar",/^£10 over$/.test(bg("Food").note.textContent)&&bg("Food").note.className==="bad"&&/width:100%/.test(bg("Food").i.getAttribute("style"))&&/var\(--st-bad\)/.test(bg("Food").i.getAttribute("style")),bg("Food").note.outerHTML);
t("budget: no-plan row has no bar and says so",bg("Fun <b>bold</b>")&&!bg("Fun <b>bold</b>").i&&/no plan set/.test(bg("Fun <b>bold</b>").note.textContent),bgs.map(r=>r.n));
t("budget: low-spend row is good",/var\(--st-good\)/.test(bg("Zed").i.getAttribute("style"))&&/£94 left/.test(bg("Zed").note.textContent),bg("Zed").note.textContent);
const ics=[...a.w.document.querySelectorAll("#sshops .ic")].map(e=>[e.textContent,e.getAttribute("style")]);
t("top shops: first row initial and its category colour",ics[0][0]==="S"&&/--c:\s*var\(--s1\)/.test(ics[0][1]),ics);
t("top shops: symbol start uses first letter or digit, '?' if none, uppercased",JSON.stringify(ics.map(i=>i[0]))==='["S","H","?","9","S","I"]',ics);
t("top shops: second row has category two colour",/var\(--s2\)/.test(ics[1][1])&&/var\(--s2\)/.test(ics[3][1]),ics);
t("HTML in notes and category names never becomes an element",!a.w.document.querySelector("#sring img, #sbud img, #sshops img")&&/Fun <b>bold<\/b>/.test(a.w.document.querySelector("#sring button.lg em").textContent)&&!a.w.document.querySelector("#sring em b, #sbud span b"));
/* day by day: cycle 20 Oct to 19 Nov 2026, today 6 Nov */
const V6c=JSON.stringify({v:6,inc:250000,lines:[{n:"Amex",a:10000,g:"Spend",r:"amex"}],amex:[{id:"food",n:"Food",p:5000}],cy:{day:19,debit:12,lastCat:""},
 buys:[B("d0","2026-10-05",700,"SHOP ALPHA","food"),B("d1","2026-10-20",1000,"SHOP ALPHA","food"),B("d2","2026-10-31",2400,"SHOP ALPHA","food"),B("d3","2026-11-02",300,"SHOP ALPHA","food"),
 B("d4","2026-11-02",-800,"SHOP ALPHA REFUND","food"),B("d5","2026-11-03",600,"SHOP ALPHA","food"),B("d6","2026-11-05",800,"SHOP ALPHA","food"),B("d7","2026-11-05",400,"SHOP ALPHA","food")],hist:[]});
a=boot(D(2026,11,6),{"money-tool-v1":V6c});
t("fixture 3 boots clean",a.errs.length===0,a.errs);
const DG='dayGrid(spendingCycles({buys:state.buys,statementDay:19,hist:state.hist,amexPlan:10000,today:"2026-11-06"})[1],"2026-11-06")';
const dg=ev(DG),dayOf=i=>dg.days.find(x=>x.iso===i);
t("dayGrid: 31 days, lead 1, first flags",dg.days.length===31&&dg.lead===1&&dg.days[0].iso==="2026-10-20"&&dg.days[30].iso==="2026-11-19"&&dg.days.filter(x=>x.first).map(x=>x.iso).join()==="2026-10-20,2026-11-01",dg.days.length);
t("dayGrid: two purchases, net refund, empty day",dayOf("2026-11-05").pence===1200&&dayOf("2026-11-05").n===2&&dayOf("2026-11-02").pence===-500&&dayOf("2026-11-02").n===2&&dayOf("2026-11-04").pence===0&&dayOf("2026-11-04").n===0&&dayOf("2026-10-31").d===31);
t("dayGrid: future and today flags",dayOf("2026-11-06").today&&!dayOf("2026-11-06").future&&dayOf("2026-11-07").future&&!dayOf("2026-11-05").future&&!dayOf("2026-11-05").today&&dg.days.filter(x=>x.future).length===13&&dg.days.filter(x=>x.today).length===1);
t("dayGrid: max and top",dg.max===2400&&dg.top.iso==="2026-10-31",[dg.max,dg.top]);
const dg0=ev('dayGrid({cycle:{st:new Date(2026,9,19),en:new Date(2026,10,18),stI:"2026-10-19",enI:"2026-11-18"},buys:[]},"2026-11-06")');
t("dayGrid: no purchases, max 0, top null, Monday starts at lead 0",dg0.max===0&&dg0.top===null&&dg0.lead===0&&dg0.days.length===31,dg0.lead);
const sd=a.w.document.querySelector("#sdays"),cds=[...sd.querySelectorAll(".cd")],lab3=ev('cycleLabel(spendingCycles({buys:state.buys,statementDay:19,hist:state.hist,amexPlan:10000,today:"2026-11-06"})[1].cycle)');
t("days card: same label as the ring, header, blanks, one cell per day",sd.textContent.startsWith(lab3+" · so far")&&$(a.w,"sring").textContent.startsWith(lab3+" · so far")&&sd.querySelectorAll(".cal > b").length===7&&[...sd.querySelectorAll(".cal > b")].map(x=>x.textContent).join("")==="MTWTFSS"&&sd.querySelectorAll(".cal > span:not(.cd)").length===1&&cds.length===31,sd.textContent.slice(0,40));
const cl=i=>cds[i].className.split(" ");
t("days card: levels",cl(11).includes("l4")&&cl(14).includes("l1")&&cl(15).length===1&&!/l[1-4]/.test(cds[15].className)&&!/l[1-4]/.test(cds[13].className),cds.map(c=>c.className).join("|"));
t("days card: today and future flags",cl(17).includes("now")&&!cl(17).includes("fut")&&cl(18).includes("fut")&&!cl(16).includes("fut")&&sd.querySelectorAll(".cd.now").length===1&&sd.querySelectorAll(".cd.fut").length===13);
t("days card: net refund shows minus sign, no level",cds[13].textContent==="2−£5"&&!/l[1-4]/.test(cds[13].className),cds[13].textContent);
t("days card: labels and amounts",cds[0].querySelector("small").textContent==="20 Oct"&&cds[12].querySelector("small").textContent==="1 Nov"&&cds[1].querySelector("small").textContent==="21"&&cds[11].textContent==="31£24"&&cds[16].textContent==="5£12",[cds[11].textContent,cds[16].textContent]);
t("days card: note names the biggest day",/Biggest day: 31 Oct, £24\. Stronger colour means more spent\./.test(sd.textContent),sd.textContent.slice(-60));
t("days card: titles",cds[16].title==="5 Nov: £12 in 2 purchases"&&cds[15].title==="4 Nov: nothing spent"&&cds[14].title==="3 Nov: £6 in 1 purchase",[cds[16].title,cds[15].title,cds[14].title]);
click(a.w,$(a.w,"rprev"));await settle();
const labP=ev('cycleLabel(spendingCycles({buys:state.buys,statementDay:19,hist:state.hist,amexPlan:10000,today:"2026-11-06"})[0].cycle)');
t("rprev moves the days card to the previous cycle",$(a.w,"sdays").textContent.startsWith(labP)&&!/so far/.test($(a.w,"sdays").textContent.slice(0,40))&&/Biggest day: 5 Oct, £7/.test($(a.w,"sdays").textContent),$(a.w,"sdays").textContent.slice(0,60));
/* where to cut: levers from finished months, goals decide how much to find */
const CB=(d,pence,note,category)=>`{id:"x${d}${pence}",date:"${d}",pence:${pence},note:"${note}",category:"${category}"}`;
const CM=(mo)=>`{current:false,buys:[${CB(mo+"-03",4000,"SHOP ALPHA","shop")},${CB(mo+"-09",4000,"SHOP ALPHA","shop")},${CB(mo+"-05",9000,"FOOD BETA","food")},${CB(mo+"-06",500,"KIOSK","tiny")},${CB(mo+"-07",1000,"MYSTERY","")}]}`;
const CAM='[{id:"shop",n:"Shopping",p:5000},{id:"food",n:"Food",p:20000},{id:"tiny",n:"Tiny",p:0}]';
const CYC=`[{current:false,buys:[${CB("2026-05-30",700,"KIOSK","tiny")}]},${CM("2026-06")},${CM("2026-07")},${CM("2026-08").replace("]}",","+CB("2026-08-20",15000,"BIG TICKET","shop")+"]}")},{current:true,buys:[${CB("2026-09-25",99900,"NOW","shop")}]}]`;
const cp=ev(`cutPlan({cycles:${CYC},amex:${CAM},need:4000})`);
t("cut plan: part-month at the start and the current month are left out",cp.months===3,cp.months);
const lv=id=>cp.levers.find(l=>l.id===id);
t("cut plan: over-plan category comes back to plan",cp.levers.length===2&&lv("shop").over===true&&lv("shop").avg===8000&&lv("shop").save===3000&&lv("shop").overMonths===3,cp.levers);
t("cut plan: well under plan has spare plan to move, biggest first; tiny one is skipped",cp.levers[0].id==="food"&&lv("food").spare===true&&lv("food").over===false&&lv("food").save===11000&&!lv("tiny"),cp.levers);
t("cut plan: no plan and sizeable trims a fifth",ev(`cutPlan({cycles:${CYC},amex:[{id:"food",n:"Food",p:0}],need:0}).levers.map(l=>[l.spare,l.over,l.save])`).join()==="false,false,1800");
t("cut plan: main shop per month",lv("shop").shop.name==="SHOP ALPHA"&&lv("shop").shop.pence===8000&&lv("shop").shop.n===6,lv("shop").shop);
t("cut plan: one-offs set aside, total found",cp.oneOffs.n===1&&cp.oneOffs.pence===15000&&cp.found===14000&&cp.need===4000,[cp.oneOffs,cp.found]);
t("cut plan: unassigned share",Math.abs(cp.unassigned-3000/55500)<1e-9,cp.unassigned);
t("cut plan: nothing before a full month",ev(`cutPlan({cycles:[{current:true,buys:[${CB("2026-09-25",500,"NOW","shop")}]}],amex:${CAM},need:0})`)===null);
const V6cut=JSON.stringify({v:6,inc:250000,lines:[{n:"Amex",a:10000,g:"Spend",r:"amex"},{n:"Trip fund",a:10000,g:"Save",r:"trip"}],amex:[{id:"shop",n:"Shop <i>ping</i>",p:3000}],
 cy:{day:19,debit:12,lastCat:""},trip:{target:120000,saved:0,date:"2027-05-01"},
 buys:[B("k1","2026-09-01",4000,"SHOP ALPHA","shop"),B("k2","2026-10-01",6000,"SHOP ALPHA","shop")],hist:[]});
a=boot(D(2026,11,3),{"money-tool-v1":V6cut});
t("goal needs: trip fund short by £100 a month",JSON.stringify(JSON.parse(a.w.eval('JSON.stringify(goalNeeds(new Date()))')))==='[{"n":"Trip fund","pence":10000}]',a.w.eval('JSON.stringify(goalNeeds(new Date()))'));
const cut=$(a.w,"scut").textContent;
t("cut card: what to find and why",/£100 a month to find/.test(cut)&&/Trip fund is short by £100/.test(cut)&&/Based on your last 2 months/.test(cut),cut.slice(0,160));
t("cut card: lever advice and shortfall",/About £50 a month against a £30 plan · over in 2 of 2 months/.test(cut)&&/Get back to plan: £20 a month/.test(cut)&&/£80 short of the £100/.test(cut),cut);
t("cut card: names escaped",!a.w.document.querySelector("#scut i:not(.dot)")&&/Shop <i>ping<\/i>/.test(cut));
t("budget ring: lines and what is left",a.w.document.querySelectorAll("#bring circle").length===3&&/Left over92%£2,300/.test($(a.w,"bring").textContent),$(a.w,"bring").textContent);
/* one shop under two names, the sorter pop-up, and the subscriptions card */
const V6s=JSON.stringify({v:6,inc:250000,lines:[{n:"Amex",a:10000,g:"Spend",r:"amex"}],amex:[{id:"shop",n:"Shopping",p:5000},{id:"sub",n:"Subscriptions",p:1000}],
 cy:{day:19,debit:12,lastCat:""},buys:[B("z1","2026-09-02",1163,"AMZNMKTPLACE","shop"),B("z2","2026-10-02",2209,"AMAZON.CO.UK","shop"),B("z3","2026-10-03",900,"AMAZON PRIME","sub"),B("z8","2026-09-03",900,"AMAZON PRIME","sub"),
 B("z4","2026-10-04",700,"MYSTERY SHOP",""),B("z5","2026-10-06",300,"MYSTERY SHOP",""),B("z6","2026-10-07",1500,"OTHER PLACE",""),B("z7","2026-08-01",400,"OLD LOCKED","")],
 hist:[{k:"2026-08-19",m:"20 Jul to 19 Aug",plan:10000,spent:400,cats:[],locked:true}]});
a=boot(D(2026,11,3),{"money-tool-v1":V6s});
const tops=JSON.parse(a.w.eval('JSON.stringify(topShops(spendingCycles({buys:state.buys,statementDay:19,hist:state.hist,amexPlan:10000,today:"2026-11-03"}),8).map(s=>[s.name,s.pence,s.n]))'));
t("two Amazon names count as one shop, Prime stays separate",JSON.stringify(tops[0])==='["Amazon",3372,2]'&&tops.some(s=>s[0]==="AMAZON PRIME"&&s[1]===1800),tops);
const us=JSON.parse(a.w.eval("JSON.stringify(unsortedShops().map(g=>[g.name,g.n,g.pence,g.last]))"));
t("sorter: one row per shop, biggest first, locked months left out",JSON.stringify(us)==='[["OTHER PLACE",1,1500,"2026-10-07"],["MYSTERY SHOP",2,1000,"2026-10-06"]]',us);
t("sorter: summary line and open buttons",/^3 purchases from 2 shops · £25\./.test($(a.w,"sortl").textContent)&&/Sort 3 purchases without a category/.test($(a.w,"pbuys").textContent)&&!!a.w.document.querySelector("#pbuys [data-sort]"),$(a.w,"sortl").textContent.slice(0,60));
click(a.w,a.w.document.querySelector("#pbuys [data-sort]"));await settle();
t("sorter: button opens the pop-up",$(a.w,"sorter").hasAttribute("open"));
const pick=[...a.w.document.querySelectorAll("#sortl select")].find(s=>/MYSTERY/.test(s.getAttribute("aria-label")));
pick.value="shop";pick.dispatchEvent(new a.w.Event("input",{bubbles:true}));pick.dispatchEvent(new a.w.Event("change",{bubbles:true}));await settle();
t("sorter: one pick sorts every purchase from that shop",st(a.w).buys.filter(b=>b.note==="MYSTERY SHOP").every(b=>b.category==="shop")&&/^1 purchase from 1 shop/.test($(a.w,"sortl").textContent)&&st(a.w).buys.find(b=>b.id==="z7").category==="",$(a.w,"sortl").textContent.slice(0,40));
click(a.w,$(a.w,"sortx"));await settle();
t("sorter: closes",!$(a.w,"sorter").hasAttribute("open"));
const subsTxt=$(a.w,"ssubs").textContent;
t("subscriptions: total, yearly cost and plan",/^£9\.00 a month/.test(subsTxt)&&/£108 a year across 1 subscription · card ones are inside your £10 plan/.test(subsTxt)&&/AMAZON PRIMEOn the Amex · £108 a year · last charged 3 Oct£9\.00/.test(subsTxt),subsTxt);
/* editing the subscriptions list */
const subNames=()=>[...a.w.document.querySelectorAll("#ssubs .shop .rn b")].map(b=>b.textContent);
t("subs edit: starts with the found one, others offered to add",subNames().join()==="AMAZON PRIME"&&[...$(a.w,"subadd").options].some(o=>/^OTHER PLACE · £15\.00$/.test(o.textContent))&&![...$(a.w,"subadd").options].some(o=>/PRIME/.test(o.textContent)));
$(a.w,"subadd").value=[...$(a.w,"subadd").options].find(o=>/OTHER PLACE/.test(o.textContent)).value;$(a.w,"subadd").dispatchEvent(new a.w.Event("change",{bubbles:true}));await settle();
t("subs edit: adding a shop lists it and updates the total",subNames().join()==="OTHER PLACE,AMAZON PRIME"&&/^£24\.00 a month/.test($(a.w,"ssubs").textContent)&&st(a.w).subs.add.length===1,$(a.w,"ssubs").textContent.slice(0,60));
click(a.w,a.w.document.querySelector('#ssubs [data-sh][aria-label^="AMAZON PRIME"]'));await settle();
t("subs edit: removing one drops it, even though it is in the Subscriptions category",subNames().join()==="OTHER PLACE"&&/^£15\.00 a month/.test($(a.w,"ssubs").textContent)&&st(a.w).subs.hide.length===1&&/Bring back 1 you removed/.test($(a.w,"ssubs").textContent));
const kept=JSON.stringify(st(a.w));a=boot(D(2026,11,3),{"money-tool-v1":kept});
t("subs edit: survives a reload",subNames().join()==="OTHER PLACE"&&st(a.w).subs.hide.length===1&&st(a.w).subs.add.length===1);
click(a.w,$(a.w,"subreset"));await settle();
t("subs edit: bring back restores the removed one",subNames().join()==="OTHER PLACE,AMAZON PRIME"&&st(a.w).subs.hide.length===0&&!$(a.w,"subreset"));
inp(a.w,$(a.w,"subn"),"Phone <b>plan</b>");inp(a.w,$(a.w,"suba"),"12.50");click(a.w,$(a.w,"subm"));await settle();
t("subs manual: one paid from another account joins the list and the total",subNames().join()==="OTHER PLACE,AMAZON PRIME,Phone <b>plan</b>"&&/^£36\.50 a month/.test($(a.w,"ssubs").textContent)&&/£24\.00 on the Amex, £12\.50 from other accounts/.test($(a.w,"ssubs").textContent)&&!a.w.document.querySelector("#ssubs .rn b b")&&st(a.w).subs.manual[0].a===1250,$(a.w,"ssubs").textContent.slice(0,120));
a.w.__alerts=[];inp(a.w,$(a.w,"subn"),"");inp(a.w,$(a.w,"suba"),"5");click(a.w,$(a.w,"subm"));await settle();
t("subs manual: needs a name and an amount",st(a.w).subs.manual.length===1&&/name and a monthly amount/.test(a.w.__alerts.join()));
a=boot(D(2026,11,3),{"money-tool-v1":JSON.stringify(st(a.w))});
t("subs manual: survives a reload",st(a.w).subs.manual.length===1&&/Phone <b>plan<\/b>/.test($(a.w,"ssubs").textContent));
click(a.w,a.w.document.querySelector("#ssubs [data-sx]"));await settle();
t("subs manual: can be removed",st(a.w).subs.manual.length===0&&subNames().join()==="OTHER PLACE,AMAZON PRIME");
a=boot(D(2026,11,3),{"money-tool-v1":JSON.stringify(Object.assign(JSON.parse(kept),{subs:{hide:"x",add:[5,"",{}]}}))});
t("subs edit: junk in saved edits is dropped",a.errs.length===0&&JSON.stringify(st(a.w).subs)==='{"hide":[],"add":[],"manual":[]}',JSON.stringify(st(a.w).subs));
a=boot(D(2026,11,3));
inp(a.w,$(a.w,"subn"),"Gym");inp(a.w,$(a.w,"suba"),"30");click(a.w,$(a.w,"subm"));await settle();
t("subs manual: works before any import",/^£30\.00 a month/.test($(a.w,"ssubs").textContent)&&!$(a.w,"subadd"));
t("empty state: cut advice",/Advice appears after your first full month/.test($(a.w,"scut").textContent));
t("empty state",/Import an Amex CSV/.test($(a.w,"snotes").textContent)&&/0 purchases/.test($(a.w,"slist").textContent));
t("empty state: ring and budget cards, arrows disabled",/^Appears after your first import\.$/.test($(a.w,"sring").textContent)&&/^Appears after your first import\.$/.test($(a.w,"sbud").textContent)&&$(a.w,"rprev").disabled&&$(a.w,"rnext").disabled);
t("empty state: days card",/^Appears after your first import\.$/.test($(a.w,"sdays").textContent));
done("spending");
})();
