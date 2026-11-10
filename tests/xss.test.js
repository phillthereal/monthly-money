// Hostile data: every text field a backup, a CSV or a synced copy can carry is filled with markup and attribute
// break-outs, every screen is drawn, and nothing may come out as an element or an event-handler attribute.
const {settle,boot,$,st,click,inp,D,t,done}=require("./harness");
(async()=>{
const P=`"><xss-probe></xss-probe><img src=x onerror=alert(1)>' onmouseover='alert(1)' x="</select><script>window.__pwned=1</script>`;
const iso=(m,d)=>"2026-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0");
const buys=[];
for(let m=8;m<=10;m++)for(let d=1;d<=6;d++)buys.push({id:"b"+m+d+P,date:iso(m,d),pence:1000+d*310,category:d%3===0?P:d%3===1?"c1"+P:"",note:(d%2?"SHOP ":"")+P+d});
buys.push({id:"now"+P,date:"2026-11-02",pence:2345,category:"c1"+P,note:P});
// Ids must differ from each other: migrate() swaps a repeated id for a fresh one, which would hide an unescaped id.
const HOSTILE={v:6,inc:250000,tab:P,
 lines:[{n:P,a:60000,g:"Spend",r:"amex"},{n:"Trip"+P,a:10000,g:"Save",r:"trip"},{n:"Card"+P,a:5000,g:"Fixed",r:"card"},{n:P,a:1000,g:P,r:P}],
 amex:[{id:"c1"+P,n:"Subscriptions"+P,p:1000},{id:P,n:P,p:0}],
 cy:{day:19,debit:12,lastCat:P},buys,
 hist:[{k:"2026-08-19",m:P,plan:60000,spent:100,cats:[{n:P,s:1,p:1}],locked:true}],
 trip:{target:500000,saved:1000,date:"2027-06-01"+P},card:{balance:300000,end:"2027-05-01"},
 inv:{sb:100000,ib:100000,sr:P,ir:P},
 joint:{split:50,partner:15000,name:P,bills:[{id:"j"+P,n:P,a:1200}]},
 subs:{hide:[P+"h"],add:["SHOP",P],manual:[{id:"m"+P,n:P,a:999}]}};
const LINKS=boot(D(2026,11,3)).w.document.querySelectorAll("link").length; // the page's own icon and manifest links
const STYLES=boot(D(2026,11,3)).w.document.querySelectorAll("style").length;
const clean=(w,where)=>{
  const d=w.document,bad=[];
  if(d.querySelector("xss-probe,img,iframe,object,embed,form,base,a[href],[srcdoc],[formaction],meta[http-equiv=refresh]")||d.querySelectorAll("link").length!==LINKS||d.querySelectorAll("style").length!==STYLES)bad.push("element");
  for(const el of d.querySelectorAll("*"))for(const a of el.attributes)if((a.name==="style"||a.name==="href")&&/xss-probe|alert\(/.test(a.value))bad.push(el.tagName+"["+a.name+"]");
  if(d.querySelectorAll("script").length!==1)bad.push("script");
  for(const el of d.querySelectorAll("*"))for(const a of el.attributes)if(/^on/i.test(a.name)||(a.name==="x"&&!el.ownerSVGElement))bad.push(el.tagName+"["+a.name+"]");
  if(w.__pwned)bad.push("ran");
  t("hostile data stays text: "+where,bad.length===0,bad.slice(0,5));
};
let a=boot(D(2026,11,3),{"money-tool-v1":JSON.stringify(HOSTILE)});
t("boots without errors",a.errs.length===0,a.errs.slice(0,2));
clean(a.w,"first paint");
for(const tab of ["today","budget","amex","spending","joint","goals"]){click(a.w,a.w.document.querySelector(`nav [data-tab="${tab}"]`));await settle();clean(a.w,tab+" tab")}
click(a.w,$(a.w,"rprev"));await settle();clean(a.w,"earlier month in the ring");
const arc=a.w.document.querySelector("#sring circle");
if(arc){a.w.eval("ringFocus")(arc,10,10);clean(a.w,"ring bubble")}
t("ring bubble shows the name as text",!arc||$(a.w,"tip").textContent.includes("xss-probe"));
const legend=a.w.document.querySelector("#sring button.lg");if(legend){click(a.w,legend);await settle();clean(a.w,"legend filter")}
const opener=a.w.document.querySelector("[data-sort]");
t("sorter is offered for the unassigned purchases",!!opener);
if(opener){click(a.w,opener);await settle();clean(a.w,"sort pop-up");
  const pick=a.w.document.querySelector("#sortl select");pick.value=pick.options[1].value;pick.dispatchEvent(new a.w.Event("input",{bubbles:true}));pick.dispatchEvent(new a.w.Event("change",{bubbles:true}));await settle();clean(a.w,"after sorting a shop")}
inp(a.w,$(a.w,"subn"),P);inp(a.w,$(a.w,"suba"),"7");click(a.w,$(a.w,"subm"));await settle();clean(a.w,"typed subscription");
const add=$(a.w,"subadd");if(add&&add.options.length>1){add.value=add.options[1].value;add.dispatchEvent(new a.w.Event("change",{bubbles:true}));await settle();clean(a.w,"picked subscription")}
inp(a.w,$(a.w,"sq"),P);await settle();clean(a.w,"search");
a.w.confirm=()=>true;
await a.w.eval("importAmexCsv")('Date,Description,Amount,Category\n01/11/2026,"'+P.replace(/"/g,'""')+'",12.34,"'+P.replace(/"/g,'""')+'"\n');await settle();
clean(a.w,"CSV import");
t("import confirm showed the text, not markup",!$(a.w,"dlgm").querySelector("*"));
// A reload reads back whatever was saved: the cleaned-up copy must be just as safe.
a=boot(D(2026,11,3),{"money-tool-v1":JSON.stringify(st(a.w))});
t("reload boots without errors",a.errs.length===0,a.errs.slice(0,2));
for(const tab of ["today","budget","amex","spending","joint","goals"]){click(a.w,a.w.document.querySelector(`nav [data-tab="${tab}"]`));await settle()}
clean(a.w,"after reload");
done("xss");
})();
