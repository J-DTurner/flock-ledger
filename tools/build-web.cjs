const fs = require('fs');
const path = require('path');
let ts;
try { ts = require('typescript'); } catch {
  const {execFileSync}=require('child_process');
  try { ts=require(path.join(execFileSync(process.platform==='win32'?'npm.cmd':'npm',['root','-g'],{encoding:'utf8'}).trim(),'typescript')); }
  catch { throw new Error('TypeScript 5.8.3 is required to rebuild the UI. Run npm install in the project folder. The compiled app is already included.'); }
}
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/app.tsx'), 'utf8');
const result = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2017,jsx:ts.JsxEmit.React,module:ts.ModuleKind.None,removeComments:false},reportDiagnostics:true});
const errors=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
if(errors.length)throw new Error(ts.formatDiagnosticsWithColorAndContext(errors,{getCurrentDirectory:()=>root,getCanonicalFileName:n=>n,getNewLine:()=> '\n'}));
const js="React.Fragment=React.Fragment||function Fragment(p){return p.children||null;};\n"+result.outputText;
fs.writeFileSync(path.join(root,'web/app.js'),js);
fs.copyFileSync(path.join(root,'src/core.js'),path.join(root,'web/core.js'));
const css=fs.readFileSync(path.join(root,'web/style.css'),'utf8');
const scripts=['react.min.js','react-dom.min.js','core.js','app.js'].map(n=>fs.readFileSync(path.join(root,'web',n),'utf8').replace(/<\/script/gi,'<\\/script'));
const notices=fs.readFileSync(path.join(root,'THIRD-PARTY-LICENSES.txt'),'utf8');
const html=`<!doctype html><!-- ${notices.replace(/--/g,'—')} --><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#37563e"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; base-uri 'none'; form-action 'none';"><title>Flock Ledger</title><style>${css}</style></head><body><div id="root"></div><noscript>Flock Ledger needs JavaScript enabled to calculate and save your records.</noscript>${scripts.map(s=>'<script>'+s+'</script>').join('')}</body></html>`;
fs.writeFileSync(path.join(root,'web/index.html'),html);
fs.mkdirSync(path.join(root,'android/app/src/main/assets'),{recursive:true});
fs.writeFileSync(path.join(root,'android/app/src/main/assets/index.html'),html);
console.log('Built self-contained offline app:',Math.round(Buffer.byteLength(html)/1024)+' KiB');
