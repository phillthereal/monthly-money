// Amex CSV import: parsing, skipping credits and bad rows, duplicates on re-import, locked cycles.
const {boot,$,st,click,D,t,done}=require("./harness");
const CSV='﻿Date,Description,Card Member,Account #,Amount\r\n'+
 '05/10/2026,TESCO STORES 1234,A N OTHER,-11005,12.34\r\n'+
 '06/10/2026,"PRET A MANGER, LONDON",A N OTHER,-11005,"1,004.50"\r\n'+
 '06/10/2026,COFFEE,A N OTHER,-11005,3.20\r\n'+
 '06/10/2026,COFFEE,A N OTHER,-11005,3.20\r\n'+
 '07/10/2026,PAYMENT RECEIVED - THANK YOU,A N OTHER,-11005,-500.00\r\n'+
 '08/10/2026,REFUND SHOP,A N OTHER,-11005,-4.00\r\n'+
 '31/02/2026,BROKEN DATE,A N OTHER,-11005,9.99\r\n'+
 '25/12/2026,FUTURE,A N OTHER,-11005,9.99\r\n';
const V5=extra=>JSON.stringify(Object.assign({v:5,inc:250000,lines:[{n:"Amex",a:60000,g:"Spend",r:"amex"}],amex:[{id:"food",n:"Food",p:20000}],cy:{day:19,debit:12,lastCat:""},buys:[],hist:[]},extra||{}));
const imp=(w,text)=>w.eval("importAmexCsv")(text);

let a=boot(D(2026,10,22),{"money-tool-v1":V5()});t("no errs",a.errs.length===0,a.errs);
const p=a.w.eval("amexCharges")(CSV);
t("parsed charges",p.charges.length===5&&p.credits===2&&p.bad===1,JSON.stringify(p));
t("date, pence, quoted note",p.charges[1].date==="2026-10-06"&&p.charges[1].pence===100450&&p.charges[1].note==="PRET A MANGER, LONDON",JSON.stringify(p.charges[1]));
t("identical rows get distinct ids",p.charges[2].id!==p.charges[3].id);
t("not an amex csv",a.w.eval("amexCharges")("foo,bar\n1,2")===null);

let asked="";a.w.confirm=m=>(asked=m,true);
imp(a.w,CSV);let s=st(a.w);
t("imported 4 (future skipped)",s.buys.length===4&&s.buys.reduce((x,b)=>x+b.pence,0)===1234+100450+320+320,JSON.stringify(s.buys));
t("confirm summary",/Add 4 purchases totalling £1,023\.24\?/.test(asked)&&/2 payments or refunds/.test(asked)&&/1 in locked cycles or the future/.test(asked)&&/1 unreadable/.test(asked),asked);
t("unassigned with note",s.buys.every(b=>b.category==="")&&s.buys[0].note==="TESCO STORES 1234");

a.w.__alerts=[];imp(a.w,CSV);
t("re-import adds nothing",st(a.w).buys.length===4&&/Nothing new.*4 already imported/s.test(a.w.__alerts.join()),a.w.__alerts.join());
imp(a.w,CSV+'09/10/2026,NEW ONE,A N OTHER,-11005,7.00\r\n');
t("overlapping file adds only the new row",st(a.w).buys.length===5);

const ids=st(a.w).buys.map(b=>b.id).join();
a=boot(D(2026,10,22),{"money-tool-v1":JSON.stringify(st(a.w))});
t("ids survive reload",st(a.w).buys.map(b=>b.id).join()===ids);

a=boot(D(2026,10,22),{"money-tool-v1":V5({buys:[{id:"x",date:"2026-10-01",pence:100,category:"",note:""}],hist:[{k:"2026-10-19",m:"Oct 2026",spent:100,plan:60000,cats:[],locked:true}]})});
a.w.__alerts=[];imp(a.w,CSV);
t("locked cycle skipped",st(a.w).buys.length===1&&/Nothing new/.test(a.w.__alerts.join()),a.w.__alerts.join());

a=boot(D(2026,10,22),{"money-tool-v1":V5()});a.w.confirm=()=>false;imp(a.w,CSV);
t("cancel adds nothing",st(a.w).buys.length===0);
t("button and input exist",!!$(a.w,"csv")&&$(a.w,"fc").accept.includes(".csv"));
done("csv");
