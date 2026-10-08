// Runs every tests/*.test.js and fails if any of them fail. Usage: npm test
const {readdirSync}=require("fs"),{spawnSync}=require("child_process"),path=require("path");
let failed=0;
for(const f of readdirSync(__dirname).filter(n=>n.endsWith(".test.js")).sort()){
  const r=spawnSync(process.execPath,[path.join(__dirname,f)],{stdio:"inherit",env:process.env});
  if(r.status!==0)failed++;
}
process.exit(failed?1:0);
