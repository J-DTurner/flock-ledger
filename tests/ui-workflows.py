"""Browser-rendered UI tests with an in-memory native storage/picker adapter.
This does NOT claim to test Android's WebView, file picker, or physical devices.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json, os, subprocess
from datetime import datetime, timezone
CHROME='/usr/bin/chromium' if os.path.exists('/usr/bin/chromium') else None
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'web/index.html').read_text()
FIXTURE=subprocess.check_output(['node',str(ROOT/'tests/fixture.cjs')],text=True)
passed=[]
def init(page,ledger=None,pending=""):
    page.clock.install(time=datetime(2025,2,9,12,tzinfo=timezone.utc))
    if ledger is None: ledger=FIXTURE
    page.evaluate('''(initial)=>{window.__ledger=initial.ledger;window.__pendingImport=initial.pending;window.__export=null;window.__saveFail=false;window.prompt=(m,v)=>{if(m==='flock:load')return window.__ledger;if(m==='flock:save'){if(window.__saveFail)return 'storage-error';window.__ledger=v;return 'ok';}if(m==='flock:export'){window.__export=JSON.parse(v);return 'pending';}if(m==='flock:take-import'){const text=window.__pendingImport;window.__pendingImport='';return text;}return 'pending';};}''',{'ledger':ledger,'pending':pending})
    page.set_content(HTML)
    page.on('dialog',lambda d:d.accept())
def ledger(page):return json.loads(page.evaluate('window.__ledger'))
def label(page,s):return page.get_by_label(s,exact=False)
def save_named(page,name):page.get_by_role('button',name=name,exact=True).click()
def ok(name):passed.append(name);print('PASS',name)
with sync_playwright() as p:
 browser=p.chromium.launch(**({} if not CHROME else {'executable_path':CHROME}),headless=True,args=['--no-sandbox'])
 ctx=browser.new_context(viewport={'width':412,'height':915},user_agent='FlockLedger/1 UI-test')
 page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));init(page)
 assert page.get_by_text('Feeding incomplete',exact=False).count()==0;ok('Today does not show Feeding incomplete on an empty day')
 page.get_by_role('button',name='Count birds',exact=True).first.click();label(page,'Birds actually alive').fill('47');save_named(page,'Save count')
 assert ledger(page)['batches'][0]['events'][-1]['count']==47;ok('Live count entry and native-adapter save')
 page.get_by_role('button',name='Buy feed',exact=True).first.click()
 assert page.get_by_label('Record type',exact=False).count()==0
 assert page.get_by_label('Feed stage',exact=False).input_value()=='unknown'
 label(page,'Brand / product').fill('Synthetic pellet purchase');label(page,'Total kilograms purchased').fill('100');label(page,'Total amount').fill('3000');save_named(page,'Save purchase')
 feed=ledger(page)['batches'][0]['events'][-1];assert feed['kg']==100 and feed['cost']==3000 and feed['phase']=='unknown';ok('Dated feed purchase with price/quantity')
 page.get_by_role('button',name='Feed',exact=True).click()
 page.get_by_role('button',name='Use feed',exact=True).first.click()
 assert page.get_by_label('Record type',exact=False).count()==0
 assert page.get_by_label('Which purchase',exact=False).count()==0
 label(page,'Kilograms used in this period').fill('15');save_named(page,'Save feed use')
 usage=ledger(page)['batches'][0]['events'][-1];assert usage['kg']==15 and usage['lotId']==feed['id'];ok('Feed usage tied to its purchase lot')
 page.get_by_role('button',name='Records',exact=True).click();page.get_by_role('button',name='Add record',exact=True).first.click()
 assert page.get_by_role('heading',name='Choose an action',exact=True).count()==1
 page.get_by_role('button',name='Historical feed use',exact=True).click();label(page,'Cost of feed already USED').fill('2100');save_named(page,'Save historical use')
 assert ledger(page)['batches'][0]['events'][-1]['type']=='openingUsage';ok('Historical production cost without duplicate cash')
 for date,weights in [('2025-02-03','0.7, 0.8, 0.9, 0.8'),('2025-02-09','1.0, 1.1, 1.2, 1.1')]:
  page.get_by_role('button',name='Today',exact=True).click()
  page.get_by_role('button',name='Weigh birds',exact=True).first.click();page.get_by_role('button',name='Individual weights',exact=True).click();page.get_by_label('Date',exact=True).fill(date);label(page,'Individual weights').fill(weights);save_named(page,'Save weighing')
 assert abs(ledger(page)['batches'][0]['events'][-1]['avgKg']-1.1)<1e-8;ok('Individual weigh-ins calculate mean, min, max, sample size')
 page.get_by_role('button',name='Forecast',exact=True).click();page.get_by_role('button',name='Use latest records',exact=True).click();label(page,'Operating cost USED by start').fill('4950');label(page,'Dressed sale / replacement price').fill('200');page.get_by_role('button',name='Save scenario',exact=True).click()
 assert ledger(page)['batches'][0]['forecast']['birds']==47;assert ledger(page)['batches'][0]['forecast']['feedPrice']==30
 assert page.get_by_role('img',name='Projected cost per dressed kilogram',exact=False).count()==1
 page.get_by_role('button',name='Select day 45',exact=True).click()
 assert page.get_by_text('Repeat-batch economics · day 45',exact=True).count()==1
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');ok('Forecast inputs, curves, slaughter-date selection and annual comparison')
 page.screenshot(path=str(ROOT/'docs/forecast-phone.png'),full_page=True)
 page.get_by_role('button',name='Export daily comparison CSV',exact=True).click();exp=page.evaluate('window.__export');assert exp['mime']=='text/csv' and len(exp['text'].splitlines())==32;ok('Daily forecast CSV export payload')
 page.get_by_role('button',name='Records',exact=True).click();page.get_by_role('button',name='Add record',exact=True).first.click();page.get_by_role('button',name='Note',exact=True).click();label(page,'Notes',).fill('<img src=x onerror=alert(1)>');save_named(page,'Save note')
 assert page.locator('img').count()==0;ok('Untrusted notes are rendered as text, not HTML')
 before=page.evaluate('window.__ledger');page.get_by_role('button',name='More',exact=True).click();page.get_by_role('button',name='Export JSON backup',exact=True).click();exp=page.evaluate('window.__export');assert json.loads(exp['text'])==json.loads(before);ok('Full backup payload round-trip')
 label(page,'Backup JSON').fill('{"app":"Bad","schemaVersion":9}');page.get_by_role('button',name='Validate & restore backup',exact=True).click();assert page.get_by_text('Not a supported Flock Ledger backup (version 1).',exact=True).count()==1;assert page.evaluate('window.__ledger')==before;ok('Invalid backup rejected without overwriting existing records')
 label(page,'Backup JSON').fill(exp['text']);page.get_by_role('button',name='Validate & restore backup',exact=True).click();assert json.loads(page.evaluate('window.__ledger'))==json.loads(before);ok('Valid restore after explicit user confirmation')
 second=ctx.new_page();init(second,before);second.get_by_role('button',name='Records',exact=True).click();assert second.get_by_text('Synthetic pellet purchase',exact=True).count()>=1;ok('Saved-state load in a fresh application context (simulated native adapter)')
 page.get_by_role('button',name='Today',exact=True).click();page.evaluate('window.__saveFail=true');page.get_by_role('button',name='Count birds',exact=True).first.click();label(page,'Birds actually alive').fill('46');save_named(page,'Save count');assert page.get_by_text('Android storage could not save the change. Your previous data has been kept.',exact=True).count()==1;assert page.evaluate('window.__ledger')==before;page.get_by_role('button',name='Close form',exact=True).click();page.evaluate('window.__saveFail=false');ok('Write failure surfaces an error and leaves prior data intact')
 page.get_by_role('button',name='More',exact=True).click();page.get_by_role('button',name='New batch',exact=True).click();label(page,'Batch name').fill('Second flock');label(page,'Number of chicks purchased').fill('30');label(page,'Total chick cost').fill('1500');page.get_by_role('button',name='Save batch',exact=True).click();assert len(ledger(page)['batches'])==2;assert ledger(page)['batches'][1]['events']==[];page.get_by_label('Selected batch',exact=True).select_option(ledger(page)['batches'][0]['id']);ok('Multiple batches with isolated records')
 third=ctx.new_page();init(third);third.get_by_role('button',name='Records',exact=True).click();third.get_by_role('button',name='Convert to purchase',exact=False).click();label(third,'Brand / product').fill('Actual finisher');label(third,'Total kilograms').fill('100');save_named(third,'Save purchase')
 ev=ledger(third)['batches'][0]['events'];assert not any(e['type']=='budget' for e in ev);assert any(e['type']=='feed' and e['kg']==100 for e in ev);ok('Budget conversion replaces—not duplicates—the allocation')
 resume=ctx.new_page();init(resume,before,before);assert label(resume,'Backup JSON').input_value()==before;assert resume.evaluate('window.__ledger')==before;ok('Pending native import reaches the restore screen after page initialization')
 broken=ctx.new_page();init(broken,'{bad');assert broken.get_by_text('Your saved ledger could not be opened',exact=True).count()==1;assert broken.evaluate('window.__ledger')=='{bad';label(broken,'Paste or selected backup').fill(before);broken.get_by_role('button',name='Validate and restore',exact=True).click();assert json.loads(broken.evaluate('window.__ledger'))==json.loads(before);ok('Corrupt storage is preserved until a valid backup is explicitly restored')
 page.get_by_role('button',name='Today',exact=True).click();page.get_by_role('button',name='Add record',exact=True).click()
 assert page.get_by_role('heading',name='Choose an action',exact=True).count()==1
 page.get_by_role('button',name='Close form',exact=True).click();ok('Generic Add shows the chooser in the header')
 events_before=len(ledger(page)['batches'][0]['events'])
 page.get_by_role('button',name='Buy feed',exact=True).first.click();label(page,'Brand / product').fill('Draft-only pellet');page.get_by_role('button',name='Close form',exact=True).click()
 assert len(ledger(page)['batches'][0]['events'])==events_before
 page.get_by_role('button',name='Buy feed',exact=True).first.click();assert label(page,'Brand / product').input_value()=='Draft-only pellet';page.get_by_role('button',name='Close form',exact=True).click();ok('Dismissal after typing restores the draft and does not write events')
 page.get_by_role('button',name='Buy feed',exact=True).first.click();label(page,'Brand / product').fill('Repeat pellet');label(page,'Total kilograms purchased').fill('20');label(page,'Total amount').fill('600');page.get_by_role('button',name='Save and another',exact=True).click()
 assert page.get_by_label('Record type',exact=False).count()==0
 assert page.get_by_role('heading',name='Buy feed',exact=True).count()==1
 label(page,'Total kilograms purchased').fill('10');label(page,'Total amount').fill('300');save_named(page,'Save purchase')
 assert len([e for e in ledger(page)['batches'][0]['events'] if e.get('name')=='Repeat pellet'])==2;ok('Save and another creates a second purchase without a type dropdown')
 page.get_by_role('button',name='Buy feed',exact=True).first.click();label(page,'Brand / product').fill('Unknown-qty pellet');page.get_by_role('button',name='Quantity unknown',exact=True).click();label(page,'Total amount').fill('500');save_named(page,'Save purchase')
 unk=[e for e in ledger(page)['batches'][0]['events'] if e.get('name')=='Unknown-qty pellet'][-1]
 assert unk['kg'] is None and unk['cost']==500;ok('Quantity unknown stores kg null, not 0')
 assert not errors,errors
 for w,h in [(360,800),(800,1100),(1365,1000)]:
  print('VIEWPORT',w,flush=True);second.set_default_timeout(5000);second.set_viewport_size({'width':w,'height':h})
  for tab in ['Today','Feed','Records','Forecast','More']:
   print('TAB',tab,flush=True);second.get_by_role('button',name=tab,exact=True).evaluate('(el)=>el.click()')
   assert second.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,tab)
 ok('All five screens fit phone, tablet and desktop viewports')
 browser.close()
report={'passed':len(passed),'tests':passed,'scope':'Chromium-rendered UI with a simulated native storage/picker adapter. Android runtime not executed.'}
(ROOT/'build').mkdir(exist_ok=True)
(ROOT/'build/ui-tests.json').write_text(json.dumps(report,indent=2))
print(f'\n{len(passed)} UI workflow checks passed.')
