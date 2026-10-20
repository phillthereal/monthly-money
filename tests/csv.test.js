// Amex CSV import: parsing, refunds counted, payments and bad rows skipped, duplicates on re-import, locked cycles.
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
t("parsed charges",p.charges.length===6&&p.payments===1&&p.bad===1,JSON.stringify(p));
t("date, pence, quoted note",p.charges[1].date==="2026-10-06"&&p.charges[1].pence===100450&&p.charges[1].note==="PRET A MANGER, LONDON",JSON.stringify(p.charges[1]));
t("identical rows get distinct ids",p.charges[2].id!==p.charges[3].id);
t("not an amex csv",a.w.eval("amexCharges")("foo,bar\n1,2")===null);

let asked="";a.w.confirm=m=>(asked=m,true);
imp(a.w,CSV);let s=st(a.w);
t("imported 5 incl refund (future skipped)",s.buys.length===5&&s.buys.reduce((x,b)=>x+b.pence,0)===1234+100450+320+320-400&&s.buys.some(b=>b.pence===-400&&b.note==="REFUND SHOP"),JSON.stringify(s.buys));
t("confirm summary",/Add 5 purchases totalling £1,019\.24\?/.test(asked)&&/1 payment to Amex/.test(asked)&&/1 in locked cycles or the future/.test(asked)&&/1 unreadable/.test(asked),asked);
t("guessed category with note",s.buys[0].category==="food"&&s.buys[0].note==="TESCO STORES 1234"&&s.buys.filter(b=>b.category).length===1&&!("hint" in s.buys[0]),JSON.stringify(s.buys));
t("confirm counts sorted",/1 of them sorted into categories; the rest are unassigned/.test(asked),asked);

a.w.__alerts=[];imp(a.w,CSV);
t("re-import adds nothing",st(a.w).buys.length===5&&/Nothing new.*5 already imported/s.test(a.w.__alerts.join()),a.w.__alerts.join());
imp(a.w,CSV+'09/10/2026,NEW ONE,A N OTHER,-11005,7.00\r\n');
t("overlapping file adds only the new row",st(a.w).buys.length===6);

const ids=st(a.w).buys.map(b=>b.id).join();
a=boot(D(2026,10,22),{"money-tool-v1":JSON.stringify(st(a.w))});
t("ids survive reload",st(a.w).buys.map(b=>b.id).join()===ids);

a=boot(D(2026,10,22),{"money-tool-v1":V5({buys:[{id:"x",date:"2026-10-01",pence:100,category:"",note:""}],hist:[{k:"2026-10-19",m:"Oct 2026",spent:100,plan:60000,cats:[],locked:true}]})});
a.w.__alerts=[];imp(a.w,CSV);
t("locked cycle skipped",st(a.w).buys.length===1&&/Nothing new/.test(a.w.__alerts.join()),a.w.__alerts.join());

a=boot(D(2026,10,22),{"money-tool-v1":V5()});a.w.confirm=()=>false;imp(a.w,CSV);
t("cancel adds nothing",st(a.w).buys.length===0);
t("button and input exist",!!$(a.w,"csv")&&$(a.w,"fc").accept.includes(".csv"));

// Changing a purchase's category from the Amex tab's Purchases list.
const inpSel=(w,el,v)=>{el.value=v;el.dispatchEvent(new w.Event("input",{bubbles:true}))};
a=boot(D(2026,10,22),{"money-tool-v1":V5({buys:[{id:"p1",date:"2026-10-21",pence:500,category:"",note:"TESCO"},{id:"p2",date:"2026-10-01",pence:900,category:"",note:"OLD"}],hist:[{k:"2026-10-19",m:"Oct 2026",spent:900,plan:60000,cats:[],locked:true}]})});
t("cat no errs",a.errs.length===0,a.errs);
const sel=a.w.document.querySelector('[data-pb="p1"]');
t("picker shown with unassigned count",!!sel&&/1 unassigned/.test($(a.w,"pbuys").textContent),$(a.w,"pbuys").textContent);
t("locked purchase not listed",!a.w.document.querySelector('[data-pb="p2"]'));
inpSel(a.w,sel,"food");
t("category saved",st(a.w).buys.find(b=>b.id==="p1").category==="food");
t("amex split updated",/£5/.test(a.w.document.querySelector('[data-cs="food"]').textContent)&&!/unassigned/.test($(a.w,"pbuys").textContent));
inpSel(a.w,a.w.document.querySelector('[data-pb="p1"]'),"");
t("back to unassigned",st(a.w).buys.find(b=>b.id==="p1").category==="");

// Auto categories with the default category list.
const CATS=[{id:"food",n:"Food & groceries",p:0},{id:"tr",n:"Transport",p:0},{id:"fun",n:"Going out & fun",p:0},{id:"shop",n:"Shopping",p:0}];
const CSV2='Date,Description,Amount,Category\n'+
 '01/10/2026,UBER *EATS PENDING,12.00,\n01/10/2026,UBER *TRIP,8.00,\n02/10/2026,TFL TRAVEL CH,2.80,\n03/10/2026,SAINSBURYS S/MKTS,20.00,\n'+
 '04/10/2026,AMAZON.CO.UK*AB12C,9.99,\n05/10/2026,ODD LITTLE SHOP,5.00,\n06/10/2026,MYSTERY LTD,7.00,General Purchases-Groceries\n';
a=boot(D(2026,10,22),{"money-tool-v1":V5({amex:CATS})});a.w.confirm=()=>true;imp(a.w,CSV2);
const cats=st(a.w).buys.map(b=>b.note+"="+b.category).join("|");
t("keyword guesses",cats==="UBER *EATS PENDING=fun|UBER *TRIP=tr|TFL TRAVEL CH=tr|SAINSBURYS S/MKTS=food|AMAZON.CO.UK*AB12C=shop|ODD LITTLE SHOP=|MYSTERY LTD=food",cats);
const odd=st(a.w).buys.find(b=>b.note==="ODD LITTLE SHOP");
inpSel(a.w,a.w.document.querySelector('[data-pb="'+odd.id+'"]'),"shop");
imp(a.w,'Date,Description,Amount\n07/10/2026,ODD LITTLE SHOP 2,4.00\n');
t("learned merchant on next import",st(a.w).buys.find(b=>b.note==="ODD LITTLE SHOP 2").category==="shop");
a=boot(D(2026,10,22),{"money-tool-v1":V5({amex:CATS,buys:[{id:"q1",date:"2026-10-21",pence:100,category:"",note:"TESCO"},{id:"q2",date:"2026-10-21",pence:100,category:"",note:"NOBODY KNOWS"},{id:"q3",date:"2026-10-21",pence:100,category:"",note:"NOBODY KNOWS"}]})});
click(a.w,$(a.w,"autocat"));
t("auto-assign button",st(a.w).buys.map(b=>b.category).join()==="food,,",st(a.w).buys.map(b=>b.category).join());
inpSel(a.w,a.w.document.querySelector('[data-pb="q2"]'),"fun");
t("pick teaches same-shop unassigned",st(a.w).buys.find(b=>b.id==="q3").category==="fun");
done("csv");
