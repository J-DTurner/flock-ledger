"""Package and sign Flock Ledger with JAR/v1 and APK Signature Scheme v2.
The signing key is kept OUTSIDE the distributable source archive.
"""
from pathlib import Path
import sys,struct,zipfile,hashlib,secrets,subprocess,json,datetime
from cryptography import x509
from cryptography.hazmat.primitives import hashes,serialization
from cryptography.hazmat.primitives.asymmetric import rsa,padding
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.x509.oid import NameOID
from android_binary import manifest,resource_table,make_icon
from native_shell import make_dex
P32=lambda n:struct.pack('<I',n)
P64=lambda n:struct.pack('<Q',n)
LP=lambda b:P32(len(b))+b
ROOT=Path(__file__).resolve().parents[1]
BUILD=ROOT/'build';BUILD.mkdir(exist_ok=True)
KEYDIR=ROOT.parent/'flock-ledger-private-signing';KEYDIR.mkdir(exist_ok=True)

def key_material():
 pem=KEYDIR/'private-key.pem';cp=KEYDIR/'certificate.der';p12=KEYDIR/'flock-ledger.p12';pw=KEYDIR/'password.txt'
 if pem.exists():
  key=serialization.load_pem_private_key(pem.read_bytes(),password=None);cert=x509.load_der_x509_certificate(cp.read_bytes());password=pw.read_text().strip()
 else:
  key=rsa.generate_private_key(public_exponent=65537,key_size=2048)
  name=x509.Name([x509.NameAttribute(NameOID.COMMON_NAME,'Flock Ledger Private Edition')])
  now=datetime.datetime.now(datetime.timezone.utc)
  cert=x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key()).serial_number(x509.random_serial_number()).not_valid_before(now-datetime.timedelta(days=1)).not_valid_after(now+datetime.timedelta(days=10950)).sign(key,hashes.SHA256())
  password=secrets.token_urlsafe(24)
  pem.write_bytes(key.private_bytes(serialization.Encoding.PEM,serialization.PrivateFormat.PKCS8,serialization.NoEncryption()))
  cp.write_bytes(cert.public_bytes(serialization.Encoding.DER));pw.write_text(password+'\n')
  p12.write_bytes(pkcs12.serialize_key_and_certificates(b'flockledger',key,cert,None,serialization.BestAvailableEncryption(password.encode())))
  for p in KEYDIR.iterdir():p.chmod(0o600)
 return key,cert,password

def write_zip(path,files):
 with zipfile.ZipFile(path,'w') as z:
  for name,data in files:
   zi=zipfile.ZipInfo(name,(2026,9,7,0,0,0));zi.external_attr=0o644<<16
   zi.compress_type=zipfile.ZIP_STORED if name=='resources.arsc' else zipfile.ZIP_DEFLATED
   if zi.compress_type==zipfile.ZIP_STORED:
    base=z.fp.tell()+30+len(name.encode());pad=(-base)%4
    if pad:zi.extra=struct.pack('<HH',0xffff,pad)+b'\0'*pad
   z.writestr(zi,data)

def apk_digest(before,cd,eocd):
 chunks=[]
 for section in (before,cd,eocd):
  for off in range(0,len(section),1024*1024):
   c=section[off:off+1024*1024];chunks.append(hashlib.sha256(b'\xa5'+P32(len(c))+c).digest())
 return hashlib.sha256(b'\x5a'+P32(len(chunks))+b''.join(chunks)).digest()

def sign_v2(raw,key,cert):
 eoff=raw.rfind(b'PK\x05\x06');assert eoff>=0
 eocd=raw[eoff:];cdoff=struct.unpack_from('<I',eocd,16)[0];before=raw[:cdoff];cd=raw[cdoff:eoff]
 digest=apk_digest(before,cd,eocd);alg=P32(0x0103)
 signed=LP(LP(alg+LP(digest)))+LP(LP(cert.public_bytes(serialization.Encoding.DER)))+LP(b'')
 sig=key.sign(signed,padding.PKCS1v15(),hashes.SHA256())
 public=key.public_key().public_bytes(serialization.Encoding.DER,serialization.PublicFormat.SubjectPublicKeyInfo)
 signer=LP(signed)+LP(LP(alg+LP(sig)))+LP(public)
 v2=LP(LP(signer));pair=P64(4+len(v2))+P32(0x7109871a)+v2
 size=len(pair)+24;block=P64(size)+pair+P64(size)+b'APK Sig Block 42'
 eocd=bytearray(eocd);struct.pack_into('<I',eocd,16,cdoff+len(block))
 return before+block+cd+eocd

def verify_v2(raw):
 """Parse the packaged APK independently and verify content digest + RSA signature."""
 def u32(b,o=0):return struct.unpack_from('<I',b,o)[0]
 def lp(b,o=0):n=u32(b,o);return b[o+4:o+4+n],o+4+n
 eoff=raw.rfind(b'PK\x05\x06');eocd=bytearray(raw[eoff:]);cdstart=u32(eocd,16)
 assert raw[cdstart-16:cdstart]==b'APK Sig Block 42'
 size=struct.unpack_from('<Q',raw,cdstart-24)[0];start=cdstart-size-8
 assert struct.unpack_from('<Q',raw,start)[0]==size
 pairlen=struct.unpack_from('<Q',raw,start+8)[0];assert u32(raw,start+16)==0x7109871a
 value=raw[start+20:start+16+pairlen];signers,_=lp(value);signer,_=lp(signers)
 signed,pos=lp(signer);signatures,pos=lp(signer,pos);pub,pos=lp(signer,pos);assert pos==len(signer)
 sigrecord,_=lp(signatures);assert u32(sigrecord)==0x0103;sig,_=lp(sigrecord,4)
 digestrecords,pos=lp(signed);certificates,pos=lp(signed,pos);attrs,pos=lp(signed,pos);assert pos==len(signed)
 digestrecord,_=lp(digestrecords);assert u32(digestrecord)==0x0103;digest,_=lp(digestrecord,4)
 der,_=lp(certificates);cert=x509.load_der_x509_certificate(der)
 assert cert.public_key().public_bytes(serialization.Encoding.DER,serialization.PublicFormat.SubjectPublicKeyInfo)==pub
 cert.public_key().verify(sig,signed,padding.PKCS1v15(),hashes.SHA256())
 struct.pack_into('<I',eocd,16,start)
 assert digest==apk_digest(raw[:start],raw[cdstart:eoff],bytes(eocd))
 return {'v2_signature':'valid','content_digest':'valid','certificate_sha256':hashlib.sha256(der).hexdigest()}

def main():
 icon=ROOT/'android/app/src/main/res/drawable/ic_launcher.png';make_icon(icon)
 dex,d=make_dex();(BUILD/'classes.dex').write_bytes(dex);(BUILD/'dex-listing.json').write_text(json.dumps(d.disassembly,indent=2))
 xml=manifest(ROOT/'android/app/src/main/AndroidManifest.xml');arsc=resource_table()
 (BUILD/'AndroidManifest.xml').write_bytes(xml);(BUILD/'resources.arsc').write_bytes(arsc)
 files=[('AndroidManifest.xml',xml),('resources.arsc',arsc),('classes.dex',dex),('res/drawable/ic_launcher.png',icon.read_bytes()),('assets/index.html',(ROOT/'web/index.html').read_bytes()),('assets/THIRD-PARTY-LICENSES.txt',(ROOT/'THIRD-PARTY-LICENSES.txt').read_bytes())]
 unsigned=BUILD/'unsigned.apk';v1=BUILD/'signed-v1.apk';write_zip(unsigned,files)
 key,cert,password=key_material()
 subprocess.run(['jarsigner','-keystore',str(KEYDIR/'flock-ledger.p12'),'-storetype','PKCS12','-storepass',password,'-sigalg','SHA256withRSA','-digestalg','SHA-256','-signedjar',str(v1),str(unsigned),'flockledger'],check=True,capture_output=True)
 # Repack after JAR signing so resources.arsc remains uncompressed AND aligned.
 with zipfile.ZipFile(v1) as z:aligned_files=[(n,z.read(n))for n in z.namelist()]
 aligned=BUILD/'aligned-v1.apk';write_zip(aligned,aligned_files)
 apk=sign_v2(aligned.read_bytes(),key,cert);target=ROOT.parent/'Flock-Ledger-1.0.apk';target.write_bytes(apk)
 report=verify_v2(apk)
 with zipfile.ZipFile(target)as z:
  assert z.testzip()is None
  info=z.getinfo('resources.arsc');dataoff=info.header_offset+30+len(info.filename.encode())+len(info.extra)
  assert info.compress_type==zipfile.ZIP_STORED and dataoff%4==0
  report.update({'resources_alignment':'4-byte aligned, uncompressed','entries':z.namelist(),'apk_sha256':hashlib.sha256(apk).hexdigest(),'apk_bytes':len(apk)})
 result=subprocess.run(['jarsigner','-verify','-verbose',str(target)],capture_output=True,text=True)
 if result.returncode or 'jar verified.'not in result.stdout:raise RuntimeError(result.stdout+result.stderr)
 report['v1_jar_signature']='verified by JDK jarsigner'
 (BUILD/'signature-verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));print('APK:',target)
if __name__=='__main__':main()
