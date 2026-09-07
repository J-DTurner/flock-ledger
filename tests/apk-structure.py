"""Independent package/DEX shape checks. Not an Android/ART runtime verifier."""
from pathlib import Path
import struct as st, hashlib, zlib, zipfile, json
ROOT=Path(__file__).resolve().parents[1]
APK=ROOT.parent/'Flock-Ledger-1.0.apk'
checks=[]
def yes(condition, message):
 assert condition,message
 checks.append(message)
def u16(b,p):return st.unpack_from('<H',b,p)[0]
def u32(b,p):return st.unpack_from('<I',b,p)[0]
def leb(b,p):
 n=0;s=0
 while True:
  v=b[p];p+=1;n|=(v&127)<<s;s+=7
  if not v&128:return n,p
  assert s<=35
with zipfile.ZipFile(APK) as z:
 yes(z.testzip() is None,'ZIP entries pass CRC checks')
 yes('assets/index.html' in z.namelist(),'Self-contained app asset exists')
 yes(z.read('assets/index.html')==(ROOT/'web/index.html').read_bytes(),'Packaged web app matches the tested web build')
 b=z.read('classes.dex');xml=z.read('AndroidManifest.xml');arsc=z.read('resources.arsc')
yes(b[:8]==b'dex\n035\0','DEX version 035 header')
yes(u32(b,32)==len(b) and u32(b,36)==112 and u32(b,40)==0x12345678,'DEX file length, header length and endianness')
yes(u32(b,8)==zlib.adler32(b[12:]),'DEX Adler-32 checksum')
yes(b[12:32]==hashlib.sha1(b[32:]).digest(),'DEX SHA-1 internal signature')
sc,so,tc,to,pc,po,fc,fo,mc,mo,cc,co=st.unpack_from('<12I',b,56)
strings=[]
for i in range(sc):
 off=u32(b,so+4*i);size,p=leb(b,off);end=b.index(0,p);s=b[p:end].decode('utf8');assert size==len(s.encode('utf-16-le'))//2;strings.append(s)
yes(strings==sorted(set(strings),key=lambda s:s.encode('utf-16-be')),'DEX string table is unique and ordered')
types=[strings[u32(b,to+4*i)] for i in range(tc)]
protos=[]
for i in range(pc):
 short,ret,args=st.unpack_from('<3I',b,po+12*i);ts=[] if not args else [u16(b,args+4+2*j) for j in range(u32(b,args))];protos.append((ret,ts))
 assert strings[short]==''.join(types[t] if len(types[t])==1 else 'L' for t in [ret]+ts)
methods=[st.unpack_from('<HHI',b,mo+8*i) for i in range(mc)]
yes(methods==sorted(set(methods),key=lambda m:(m[0],m[2],m[1])),'DEX method references are unique and ordered')
widths={0x0a:1,0x0c:1,0x0d:1,0x0e:1,0x0f:1,0x11:1,0x14:3,0x1a:2,0x22:2,0x23:2,0x27:1,0x29:2,0x54:2,0x5b:2,**{x:2 for x in range(0x32,0x3a)},**{x:3 for x in range(0x6e,0x73)}}
count=0;defined=[]
for ci in range(cc):
 cl,flags,sup,interfaces,source,ann,data,static=st.unpack_from('<8I',b,co+32*ci);assert types[cl].startswith('Lph/flockledger/app/');assert flags&1
 p=data;counts=[]
 for _ in range(4):v,p=leb(b,p);counts.append(v)
 for n in counts[:2]:
  index=0
  for _ in range(n):dif,p=leb(b,p);flag,p=leb(b,p);index+=dif;assert index<fc
 for n in counts[2:]:
  index=0
  for _ in range(n):
   dif,p=leb(b,p);flag,p=leb(b,p);code,p=leb(b,p);index+=dif;assert index<mc and code%4==0
   own,pr,name=methods[index];ret,args=protos[pr];assert own==cl
   nr,ni,no,nt,debug,ns=st.unpack_from('<4H2I',b,code)
   assert ni==sum(2 if types[t] in ('J','D') else 1 for t in args)+(0 if flag&8 else 1)
   assert nr>=ni
   ws=list(st.unpack_from('<'+'H'*ns,b,code+16));at=0;starts=set();branches=[];prev=None
   while at<len(ws):
    w=ws[at];op=w&255;assert op in widths,(types[cl],strings[name],at,op);starts.add(at)
    if op in (0x0a,0x0c):
     assert prev and prev[0] in range(0x6e,0x73);rp=protos[methods[prev[1]][1]][0];rt=types[rp]
     assert (op==0x0c)==(rt.startswith('L') or rt.startswith('[')) and rt!='V'
    if op in range(0x6e,0x73):
     n=w>>12;mi=ws[at+1];assert mi<mc;_,pr,_=methods[mi];_,a=protos[pr]
     assert n==sum(2 if types[t] in ('J','D') else 1 for t in a)+(0 if op==0x71 else 1) and n<=no
     reg=[(ws[at+2]>>(4*j))&15 for j in range(4)]+[(w>>8)&15];assert all(r<nr for r in reg[:n])
     prev=(op,mi)
    else:
     if op in (0x29,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39):
      delta=st.unpack('<h',st.pack('<H',ws[at+1]))[0];branches.append(at+delta)
     if op==0x1a:assert ws[at+1]<sc
     if op in (0x22,0x23):assert ws[at+1]<tc
     if op in (0x54,0x5b):assert ws[at+1]<fc
     if op==0x0e:assert types[ret]=='V'
     if op==0x11:assert types[ret].startswith(('L','['))
     if op==0x0f:assert types[ret] in ('I','Z','B','S','C','F')
     prev=(op,0)
    at+=widths[op]
   assert at==ns and all(x in starts for x in branches)
   if nt:
    tp=code+16+2*ns+(2 if ns%2 else 0);hp=tp+8*nt;hn,_=leb(b,hp);assert hn==1
    for j in range(nt):
     start,length,hoff=st.unpack_from('<IHH',b,tp+8*j);assert start in starts and start+length<=ns
     hcount,q=leb(b,hp+hoff);assert hcount==1;typ,q=leb(b,q);address,q=leb(b,q)
     assert typ<tc and address in starts and (ws[address]&255)==0x0d
   count+=1;defined.append(types[cl]+strings[name])
yes(count>=12,'All shell methods pass instruction-boundary, branch, invocation-arity, return and catch-table checks')
# Binary XML independently decoded to check the delivered manifest, not its text source.
def xmlstrings(buf,start):
 n,styles,flags,data,sty=st.unpack_from('<5I',buf,start+8);out=[];assert flags&0x100
 def l8(p):
  n=buf[p];return (((n&127)<<8)|buf[p+1],p+2) if n&128 else (n,p+1)
 for i in range(n):
  p=start+data+u32(buf,start+28+4*i);_,p=l8(p);size,p=l8(p);out.append(buf[p:p+size].decode())
 return out
assert u16(xml,0)==3 and u32(xml,4)==len(xml)
position=8;xs=[];elements=[];stack=[]
while position<len(xml):
 typ,hs,size=st.unpack_from('<HHI',xml,position);assert size>=hs and position+size<=len(xml)
 if typ==1:xs=xmlstrings(xml,position)
 if typ==0x102:
  name=xs[u32(xml,position+20)];ac=u16(xml,position+28);ats={}
  for j in range(ac):
   p=position+36+20*j;ns,n,raw=st.unpack_from('<3I',xml,p);vtype=xml[p+15];v=u32(xml,p+16);ats[xs[n]]=xs[v] if vtype==3 else v
  elements.append((name,ats));stack.append(name)
 if typ==0x103:assert stack.pop()==xs[u32(xml,position+20)]
 position+=size
assert not stack
app=next(a for n,a in elements if n=='application');sdk=next(a for n,a in elements if n=='uses-sdk')
yes(sdk['minSdkVersion']==26 and sdk['targetSdkVersion']==34,'Delivered manifest configures Android 8.0+ (API 26), target API 34')
yes(not any(n=='uses-permission' for n,a in elements),'Delivered manifest requests no Android permissions')
yes(app['allowBackup']==0 and app['debuggable']==0,'Automatic cloud backup and debugging disabled in delivered manifest')
yes(app['icon']==0x7f010000 and app['theme']==0x01030241,'Manifest points to packaged icon and framework theme')
yes(any(n=='activity' and a.get('name')=='ph.flockledger.app.MainActivity' and a.get('exported')==0xffffffff for n,a in elements),'Launcher activity is declared and exported')
yes(u16(arsc,0)==2 and u32(arsc,4)==len(arsc) and u32(arsc,8)==1,'Packaged resource table has valid root length and one package')
report={'passed':len(checks),'checks':checks,'defined_dex_methods':count,'apk_sha256':hashlib.sha256(APK.read_bytes()).hexdigest(),'scope':'Static package checks only. No Android installation, emulator, ART bytecode type verification, or native file-picker run.'}
(ROOT/'build/apk-structure-tests.json').write_text(json.dumps(report,indent=2))
for c in checks:print('PASS',c)
print(f'\n{len(checks)} structural checks passed; {count} shell methods inspected.')
