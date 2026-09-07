"""Binary Android XML and minimal drawable resource table for the private APK.
Uses Android's public binary-resource structures. No external SDK is required.
"""
from struct import pack
from pathlib import Path
import xml.etree.ElementTree as ET
U32=lambda n:pack('<I',n&0xffffffff)
U16=lambda n:pack('<H',n&0xffff)
NONE=0xffffffff
ANDROID='http://schemas.android.com/apk/res/android'
ATTR={
 'theme':0x01010000,'label':0x01010001,'icon':0x01010002,'name':0x01010003,
 'debuggable':0x0101000f,'exported':0x01010010,'configChanges':0x0101001f,
 'minSdkVersion':0x0101020c,'versionCode':0x0101021b,'versionName':0x0101021c,
 'windowSoftInputMode':0x0101022b,'targetSdkVersion':0x01010270,
 'allowBackup':0x01010280,'hardwareAccelerated':0x010102d3,'usesCleartextTraffic':0x010104ec}
def chunk(typ,header_size,payload):return pack('<HHI',typ,header_size,8+len(payload))+payload
def l8(n):return bytes([n]) if n<128 else bytes([(n>>8)|128,n&255])
def string_pool(strings):
 data=bytearray();offs=[]
 for s in strings:
  raw=s.encode('utf-8');offs.append(len(data));data+=l8(len(s.encode('utf-16-le'))//2)+l8(len(raw))+raw+b'\0'
 data+=b'\0'*((-len(data))%4)
 payload=pack('<5I',len(strings),0,0x100,28+4*len(strings),0)+b''.join(U32(x)for x in offs)+data
 return chunk(1,28,payload)
def manifest(xml_path):
 root=ET.parse(xml_path).getroot();names=sorted(ATTR,key=lambda x:ATTR[x]);strings=names+['android',ANDROID];si={s:i for i,s in enumerate(strings)}
 def st(s):
  if s not in si:si[s]=len(strings);strings.append(s)
  return si[s]
 def split(k):return (ANDROID,k.split('}',1)[1]) if k.startswith('{'+ANDROID+'}') else (None,k)
 for el in root.iter():
  st(el.tag)
  for key,value in el.attrib.items():
   ns,key=split(key);st(key);st(value)
 # Resource icon is generated with fixed id 0x7f010000.
 root.find('application').set('{'+ANDROID+'}icon','@drawable/ic_launcher');st('@drawable/ic_launcher')
 out=bytearray(string_pool(strings));out+=chunk(0x180,8,b''.join(U32(ATTR[n])for n in names))
 out+=chunk(0x100,16,pack('<4I',1,NONE,si['android'],si[ANDROID]))
 def value(k,v):
  if k=='theme':return NONE,1,0x01030241
  if k=='icon':return NONE,1,0x7f010000
  if v in ('true','false'):return NONE,0x12,0xffffffff if v=='true' else 0
  if k in ('minSdkVersion','targetSdkVersion','versionCode'):return NONE,0x10,int(v)
  if k=='configChanges':return NONE,0x11,0x4a0
  if k=='windowSoftInputMode':return NONE,0x11,0x10
  return si[v],3,si[v]
 def write(el,depth=0):
  nonlocal out
  ats=sorted(el.attrib.items(),key=lambda kv:(ATTR.get(split(kv[0])[1],0),kv[0]))
  payload=pack('<4I',depth+2,NONE,NONE,si[el.tag])+pack('<6H',20,20,len(ats),0,0,0)
  for key,v in ats:
   ns,k=split(key);raw,typ,data=value(k,v);payload+=pack('<3I',si[ns]if ns else NONE,si[k],raw)+pack('<HBBI',8,0,typ,data)
  out+=chunk(0x102,16,payload)
  for child in el:write(child,depth+1)
  out+=chunk(0x103,16,pack('<4I',depth+2,NONE,NONE,si[el.tag]))
 write(root)
 out+=chunk(0x101,16,pack('<4I',1,NONE,si['android'],si[ANDROID]))
 return chunk(3,8,out)
def resource_table():
 global_pool=string_pool(['res/drawable/ic_launcher.png'])
 types=string_pool(['drawable']);keys=string_pool(['ic_launcher'])
 typespec=chunk(0x202,16,pack('<BBHI',1,0,0,1)+U32(0))
 config=U32(64)+b'\0'*60
 entry=pack('<HHI',8,0,0)+pack('<HBBI',8,0,3,0)
 typechunk=chunk(0x201,84,pack('<BBHII',1,0,0,1,88)+config+U32(0)+entry)
 name='ph.flockledger.app'.encode('utf-16-le').ljust(256,b'\0')
 header=U32(0x7f)+name+pack('<5I',288,1,288+len(types),1,0)
 package=chunk(0x200,288,header+types+keys+typespec+typechunk)
 return chunk(2,12,U32(1)+global_pool+package)
def make_icon(out):
 from PIL import Image,ImageDraw
 im=Image.new('RGBA',(192,192),(0,0,0,0));g=ImageDraw.Draw(im)
 g.rounded_rectangle((4,4,188,188),radius=44,fill='#37563e')
 g.line([(47,93),(96,48),(145,93)],fill='#f8f6e9',width=9,joint='curve')
 g.line([(56,87),(56,144),(136,144),(136,87)],fill='#f8f6e9',width=8,joint='curve')
 g.rounded_rectangle((82,106,110,147),radius=12,fill='#dfbc70')
 g.ellipse((87,76,105,94),fill='#dfbc70')
 out.parent.mkdir(parents=True,exist_ok=True);im.save(out)
