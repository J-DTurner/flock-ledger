'use strict';
const assert=require('node:assert/strict');
const {publish,ROOT}=require('../tools/publish-github.cjs');
let passed=0;
const test=(name,fn)=>{fn();passed++;console.log('PASS',name);};
function mock(overrides={}){
 const calls=[];
 const map={
  'git --version':{code:0,out:'git version test'},
  'gh --version':{code:0,out:'gh version test'},
  'git rev-parse --show-toplevel':{code:0,out:ROOT},
  'git status --porcelain':{code:0,out:''},
  'git branch --show-current':{code:0,out:'main'},
  'git remote get-url origin':{code:1,out:''},
  'gh api user --hostname github.com --jq .login':{code:0,out:'J-DTurner'},
  'gh auth setup-git --hostname github.com':{code:0,out:''},
  'gh api repos/J-DTurner/flock-ledger --hostname github.com':{code:0,out:JSON.stringify({private:false,full_name:'J-DTurner/flock-ledger',html_url:'https://github.com/J-DTurner/flock-ledger'})},
  'git rev-parse HEAD':{code:0,out:'test-sha'},
  'git ls-remote origin refs/heads/main':{code:0,out:'test-sha\trefs/heads/main'},
  ...overrides
 };
 const run=(bin,args)=>{const key=bin+' '+args.join(' ');calls.push(key);if(key.startsWith('gh repo create '))return {code:0,out:''};if(!(key in map))throw new Error('Unexpected CLI call '+key);return {...map[key],err:map[key].err||''};};
 return {run,calls};
}
test('Creates PUBLIC and verifies remote identity and main commit',()=>{const m=mock();const url=publish(m.run,()=>{},()=>42);assert.equal(url,'https://github.com/J-DTurner/flock-ledger');assert.ok(m.calls.some(x=>x.startsWith('gh repo create ')&&x.includes('--public')&&x.includes('--push')));});
test('Wrong authenticated account never creates a repository',()=>{const m=mock({'gh api user --hostname github.com --jq .login':{code:0,out:'other-user'}});assert.throws(()=>publish(m.run,()=>{},()=>42),/Authenticate/);assert.ok(!m.calls.some(x=>x.startsWith('gh repo create')));});
test('Existing origin is not overwritten',()=>{const m=mock({'git remote get-url origin':{code:0,out:'existing'}});assert.throws(()=>publish(m.run,()=>{},()=>42),/already exists/);});
test('Dirty working tree is not uploaded',()=>{const m=mock({'git status --porcelain':{code:0,out:' M README.md'}});assert.throws(()=>publish(m.run,()=>{},()=>42),/uncommitted/);});
test('Private remote is not falsely reported as public',()=>{const m=mock({'gh api repos/J-DTurner/flock-ledger --hostname github.com':{code:0,out:JSON.stringify({private:true,full_name:'J-DTurner/flock-ledger'})}});assert.throws(()=>publish(m.run,()=>{},()=>42),/visibility verification/);});
test('Remote SHA mismatch does not report success',()=>{const m=mock({'git ls-remote origin refs/heads/main':{code:0,out:'different-sha\trefs/heads/main'}});assert.throws(()=>publish(m.run,()=>{},()=>42),/does not match/);});
test('Missing GitHub CLI gives a failure, not a success claim',()=>{const m=mock({'gh --version':{code:1,out:''}});assert.throws(()=>publish(m.run,()=>{},()=>42),/CLI is required/);});
test('A failed public-source audit prevents publication',()=>{const m=mock();assert.throws(()=>publish(m.run,()=>{},()=>{throw new Error('test credential');}),/test credential/);assert.ok(!m.calls.some(x=>x.startsWith('gh repo create')));});
console.log(`\n${passed} publisher tests passed (simulated CLI; no network writes).`);
