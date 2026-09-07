#!/usr/bin/env node
/* First publication only. No tokens are accepted, printed, or embedded in this file. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const OWNER='J-DTurner';
const REPO='flock-ledger';

function command(bin,args,interactive=false){
  const p=spawnSync(bin,args,{cwd:ROOT,encoding:'utf8',stdio:interactive?'inherit':'pipe',shell:false});
  if(p.error)throw new Error(`${bin} could not run: ${p.error.message}`);
  return {code:p.status===null?1:p.status,out:(p.stdout||'').trim(),err:(p.stderr||'').trim()};
}
function checked(run,bin,args,interactive=false){
  const r=run(bin,args,interactive);
  if(r.code!==0)throw new Error(`${bin} ${args.join(' ')} failed. ${r.err||'See the command output.'}`);
  return r.out;
}
function auditTrackedFiles(run=command){
  const files=checked(run,'git',['ls-files','-z']).split('\0').filter(Boolean);
  const badPath=/(^|\/)(\.env(?:\..*)?|password\.txt|backups|private-data)(\/|$)|\.(?:pem|key|p12|pfx|jks|keystore|apk|aab)$/i;
  const secrets=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\r\n]/,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/,/\bgithub_pat_[A-Za-z0-9_]{30,}\b/];
  for(const name of files){
    if(badPath.test(name)||/private-signing/i.test(name))throw new Error(`Private/build file is tracked: ${name}`);
    const text=fs.readFileSync(path.join(ROOT,name)).toString('utf8');
    if(secrets.some(re=>re.test(text)))throw new Error(`Possible credential in tracked file: ${name}`);
  }
  const state=require('../src/core.js').seededState();
  if(state.batches.length||state.settings.capital.length)throw new Error('The public app must start without farm records.');
  return files.length;
}
function publish(run=command,log=console.log,audit=auditTrackedFiles){
  checked(run,'git',['--version']);
  try{checked(run,'gh',['--version']);}catch(e){throw new Error('GitHub CLI is required. Install it from https://cli.github.com, then rerun this command. No repository has been created.');}
  const normalized=p=>process.platform==='win32'?path.resolve(p).toLowerCase():path.resolve(p);
  if(normalized(checked(run,'git',['rev-parse','--show-toplevel']))!==normalized(ROOT))throw new Error('Run this publisher from the extracted repository, including its .git directory.');
  if(checked(run,'git',['status','--porcelain']))throw new Error('The repository contains uncommitted changes. Publication stopped without uploading anything.');
  if(checked(run,'git',['branch','--show-current'])!=='main')throw new Error('The initial branch must be main.');
  if(run('git',['remote','get-url','origin']).code===0)throw new Error('An origin remote already exists. This first-publication script will not overwrite it.');
  const n=audit(run);log(`Public-source audit passed for ${n} tracked files.`);
  let identity=run('gh',['api','user','--hostname','github.com','--jq','.login']);
  if(identity.code!==0){
    checked(run,'gh',['auth','login','--hostname','github.com','--git-protocol','https','--web'],true);
    identity=run('gh',['api','user','--hostname','github.com','--jq','.login']);
  }
  if(identity.code!==0||identity.out.toLowerCase()!==OWNER.toLowerCase())throw new Error(`Authenticate GitHub CLI as ${OWNER}. No repository has been created by this script.`);
  checked(run,'gh',['auth','setup-git','--hostname','github.com']);
  // GitHub rejects a conflicting repository name; this never changes an existing repo's visibility.
  checked(run,'gh',['repo','create',`${OWNER}/${REPO}`,'--public','--description','Offline Android broiler ledger, feed inventory and harvest-cost scenario planner','--source',ROOT,'--remote','origin','--push'],true);
  const raw=checked(run,'gh',['api',`repos/${OWNER}/${REPO}`,'--hostname','github.com']);
  const meta=JSON.parse(raw);
  if(meta.private!==false||meta.full_name.toLowerCase()!==`${OWNER}/${REPO}`.toLowerCase())throw new Error('Post-publication identity/visibility verification failed; inspect GitHub before further changes.');
  const sha=checked(run,'git',['rev-parse','HEAD']);
  const remote=checked(run,'git',['ls-remote','origin','refs/heads/main']).split(/\s+/)[0];
  if(remote!==sha)throw new Error('The repository was created, but the remote main commit does not match this source.');
  log(`Published and verified PUBLIC: ${meta.html_url}`);
  log(`main: ${sha}`);
  return meta.html_url;
}
module.exports={publish,auditTrackedFiles,ROOT};
if(require.main===module){try{publish();}catch(e){console.error(`STOPPED: ${e.message}`);process.exitCode=1;}}
