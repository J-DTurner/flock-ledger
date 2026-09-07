"""Small deterministic DEX emitter for the fixed, reviewed offline Android shell.

This is not a general Java compiler. The Java files are the maintainable source;
this emits the equivalent three classes without downloading an Android SDK.
DEX layout and instructions: Android Open Source Project DEX/bytecode specification.
"""
import struct, hashlib, zlib
from dataclasses import dataclass, field
from pathlib import Path
U16=lambda x:struct.pack('<H',x&0xffff)
U32=lambda x:struct.pack('<I',x&0xffffffff)
def leb(x):
    o=bytearray()
    while True:
        b=x&127;x>>=7;o.append(b|(128 if x else 0))
        if not x:return bytes(o)
def align(b,n=4):
    b.extend(b'\0'*((-len(b))%n))
def short(t):return t if len(t)==1 else 'L'
@dataclass(frozen=True)
class Ref:
    owner:str;name:str;ret:str;args:tuple=()
    @property
    def proto(self):return(self.ret,self.args)
@dataclass(frozen=True)
class FRef:
    owner:str;name:str;typ:str
class Code:
    def __init__(self,regs,ins):self.regs=regs;self.ins=ins;self.ops=[];self.catch=None
    def put(self,*x):self.ops.append(x);return self
    def label(self,name):return self.put('label',name)
    def const(self,r,v):return self.put('const',r,v)
    def string(self,r,s):return self.put('str',r,s)
    def new(self,r,t):return self.put('new',r,t)
    def call(self,kind,owner,name,ret,args,regs):return self.put('invoke',kind,Ref(owner,name,ret,tuple(args)),tuple(regs))
    def result(self,r,obj=False):return self.put('result',r,obj)
    def ret(self,r=None,obj=False):return self.put('return',r,obj)
    def field(self,get,a,b,f):return self.put('field',get,a,b,f)
    def branch(self,op,a,b,label):return self.put('if',op,a,b,label)
    def zero(self,op,r,label):return self.put('ifz',op,r,label)
    def goto(self,label):return self.put('goto',label)
    def true(self):return self.const(0,1).ret(0)
    def trycatch(self,start,end,handler,typ='Ljava/lang/Exception;'):self.catch=(start,end,handler,typ);return self
    def size(self,o):
        return {'label':0,'const':3,'str':2,'new':2,'invoke':3,'result':1,'return':1,'field':2,'if':2,'ifz':2,'goto':2,'newarray':2,'throw':1,'exception':1}.get(o[0],-999)
    def compile(self,d):
        labels={};pc=0
        for o in self.ops:
            if o[0]=='label':labels[o[1]]=pc
            pc+=self.size(o)
        words=[];maxout=0
        for o in self.ops:
            pc=len(words);k=o[0]
            if k=='label':continue
            if k=='const':_,r,v=o;words.extend([0x14|(r<<8),v&65535,(v>>16)&65535])
            elif k=='str':_,r,s=o;words.extend([0x1a|(r<<8),d.si[s]])
            elif k=='new':_,r,t=o;words.extend([0x22|(r<<8),d.ti[t]])
            elif k=='invoke':
                _,kind,m,regs=o;n=len(regs);maxout=max(maxout,n);assert n<=5 and all(0<=r<16 for r in regs)
                opcode={'virtual':0x6e,'super':0x6f,'direct':0x70,'static':0x71,'interface':0x72}[kind]
                rr=list(regs)+[0]*(5-n);words.extend([opcode|(n<<12)|(rr[4]<<8),d.mi[m],rr[0]|(rr[1]<<4)|(rr[2]<<8)|(rr[3]<<12)])
            elif k=='result':_,r,obj=o;words.append((0x0c if obj else 0x0a)|(r<<8))
            elif k=='return':_,r,obj=o;words.append(0x0e if r is None else (0x11 if obj else 0x0f)|(r<<8))
            elif k=='field':_,get,a,b,f=o;words.extend([(0x54 if get else 0x5b)|(a<<8)|(b<<12),d.fi[f]])
            elif k=='if':
                _,op,a,b,l=o;delta=labels[l]-pc;assert -32768<=delta<=32767
                words.extend([{'eq':0x32,'ne':0x33,'lt':0x34,'ge':0x35,'gt':0x36,'le':0x37}[op]|(a<<8)|(b<<12),delta&65535])
            elif k=='ifz':_,op,r,l=o;words.extend([{'eq':0x38,'ne':0x39}[op]|(r<<8),(labels[l]-pc)&65535])
            elif k=='goto':words.extend([0x29,(labels[o[1]]-pc)&65535])
            elif k=='newarray':_,a,b,t=o;words.extend([0x23|(a<<8)|(b<<12),d.ti[t]])
            elif k=='throw':words.append(0x27|(o[1]<<8))
            elif k=='exception':words.append(0x0d|(o[1]<<8))
            else:raise ValueError(o)
        code=struct.pack('<4H2I',self.regs,self.ins,maxout,1 if self.catch else 0,0,len(words))+b''.join(U16(x) for x in words)
        if self.catch:
            if len(words)%2:code+=b'\0\0'
            start,end,handler,typ=self.catch;assert labels[end]>labels[start]
            code+=struct.pack('<IHH',labels[start],labels[end]-labels[start],1)
            code+=leb(1)+leb(1)+leb(d.ti[typ])+leb(labels[handler])
        return code,labels,len(words)
class Dex:
    def __init__(self):self.classes={};self.methods={};self.fields={}
    def cls(self,name,superclass):self.classes[name]=(superclass,0x11)
    def define(self,c,n,r,args,flags,regs,ins):
        ref=Ref(c,n,r,tuple(args));code=Code(regs,ins);self.methods[ref]=(flags,code);return code
    def fld(self,c,n,t,flags=1):f=FRef(c,n,t);self.fields[f]=flags;return f
    def build(self):
        ss=set();ts=set(self.classes);ps=set();ms=set(self.methods);fs=set(self.fields)
        for name,(sup,flags) in self.classes.items():ts.add(sup)
        for f in fs:ts.update((f.owner,f.typ));ss.add(f.name)
        for ref,(flags,c) in self.methods.items():
            for o in c.ops:
                if o[0]=='str':ss.add(o[2])
                elif o[0]=='new':ts.add(o[2])
                elif o[0]=='newarray':ts.add(o[3])
                elif o[0]=='invoke':ms.add(o[2])
                elif o[0]=='field':fs.add(o[4])
            if c.catch:ts.add(c.catch[3])
        for f in fs:ts.update((f.owner,f.typ));ss.add(f.name)
        for m in ms:ts.update((m.owner,m.ret,*m.args));ss.add(m.name);ps.add(m.proto)
        for ret,args in ps:ss.add(short(ret)+''.join(map(short,args)))
        ss.update(ts)
        self.strings=sorted(ss,key=lambda x:x.encode('utf-16-be'));self.si={s:i for i,s in enumerate(self.strings)}
        self.types=sorted(ts,key=lambda t:self.si[t]);self.ti={t:i for i,t in enumerate(self.types)}
        self.protos=sorted(ps,key=lambda p:(self.ti[p[0]],tuple(self.ti[a] for a in p[1])));self.pi={p:i for i,p in enumerate(self.protos)}
        self.frefs=sorted(fs,key=lambda f:(self.ti[f.owner],self.si[f.name],self.ti[f.typ]));self.fi={f:i for i,f in enumerate(self.frefs)}
        self.mrefs=sorted(ms,key=lambda m:(self.ti[m.owner],self.si[m.name],self.pi[m.proto]));self.mi={m:i for i,m in enumerate(self.mrefs)}
        classes=sorted(self.classes,key=lambda c:self.ti[c])
        so=112;to=so+4*len(ss);po=to+4*len(ts);fo=po+12*len(ps);mo=fo+8*len(fs);co=mo+8*len(ms);dataoff=co+32*len(classes)
        out=bytearray(dataoff);entries=[(0,1,0),(1,len(ss),so),(2,len(ts),to),(3,len(ps),po),(4,len(fs),fo),(5,len(ms),mo),(6,len(classes),co)]
        strings_off=[];start=len(out)
        for s in self.strings:
            strings_off.append(len(out));raw=s.encode('utf-8').replace(b'\0',b'\xc0\x80');out+=leb(len(s.encode('utf-16-le'))//2)+raw+b'\0'
        entries.append((0x2002,len(ss),start))
        align(out);tl_off={};tls=sorted(set(args for ret,args in self.protos if args),key=lambda args:tuple(self.ti[a] for a in args));start=len(out)
        for args in tls:
            align(out);tl_off[args]=len(out);out+=U32(len(args))+b''.join(U16(self.ti[a]) for a in args);align(out)
        if tls:entries.append((0x1001,len(tls),start))
        align(out);codes={};start=len(out);self.disassembly={}
        for m in sorted(self.methods,key=lambda m:self.mi[m]):
            align(out);flags,c=self.methods[m];codes[m]=len(out);raw,labels,count=c.compile(self);out+=raw
            self.disassembly[str(m)]={'offset':codes[m],'registers':c.regs,'ins':c.ins,'instructions':count,'labels':labels,'ops':[str(o) for o in c.ops]}
        entries.append((0x2001,len(codes),start))
        cdata={};start=len(out)
        for cls in classes:
            cdata[cls]=len(out);fields=sorted((f for f in self.fields if f.owner==cls),key=lambda f:self.fi[f]);direct=[];virtual=[]
            for m,(flags,c) in self.methods.items():
                if m.owner==cls:(direct if flags&0x8 or m.name=='<init>' or flags&2 else virtual).append(m)
            direct.sort(key=lambda m:self.mi[m]);virtual.sort(key=lambda m:self.mi[m])
            out+=leb(0)+leb(len(fields))+leb(len(direct))+leb(len(virtual));last=0
            for f in fields:idx=self.fi[f];out+=leb(idx-last)+leb(self.fields[f]);last=idx
            for methods in (direct,virtual):
                last=0
                for m in methods:idx=self.mi[m];out+=leb(idx-last)+leb(self.methods[m][0])+leb(codes[m]);last=idx
        entries.append((0x2000,len(classes),start))
        align(out);mapoff=len(out);entries.append((0x1000,1,mapoff));entries=sorted((e for e in entries if e[1]),key=lambda e:e[2]);out+=U32(len(entries))
        for typ,n,off in entries:out+=struct.pack('<HHII',typ,0,n,off)
        for i,off in enumerate(strings_off):out[so+4*i:so+4*i+4]=U32(off)
        for i,t in enumerate(self.types):out[to+4*i:to+4*i+4]=U32(self.si[t])
        for i,(ret,args) in enumerate(self.protos):out[po+12*i:po+12*i+12]=struct.pack('<III',self.si[short(ret)+''.join(map(short,args))],self.ti[ret],tl_off.get(args,0))
        for i,f in enumerate(self.frefs):out[fo+8*i:fo+8*i+8]=struct.pack('<HHI',self.ti[f.owner],self.ti[f.typ],self.si[f.name])
        for i,m in enumerate(self.mrefs):out[mo+8*i:mo+8*i+8]=struct.pack('<HHI',self.ti[m.owner],self.pi[m.proto],self.si[m.name])
        for i,cl in enumerate(classes):sup,flags=self.classes[cl];out[co+32*i:co+32*i+32]=struct.pack('<8I',self.ti[cl],flags,self.ti[sup],0,0xffffffff,0,cdata[cl],0)
        header=b'dex\n035\0'+U32(0)+b'\0'*20+struct.pack('<20I',len(out),112,0x12345678,0,0,mapoff,len(ss),so,len(ts),to,len(ps),po,len(fs),fo,len(ms),mo,len(classes),co,len(out)-dataoff,dataoff)
        assert len(header)==112;out[:112]=header;out[12:32]=hashlib.sha1(out[32:]).digest();out[8:12]=U32(zlib.adler32(out[12:]));return bytes(out)
