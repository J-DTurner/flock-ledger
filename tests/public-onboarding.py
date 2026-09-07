"""Empty-public-startup workflows; simulated native persistence, no Android runtime."""
from pathlib import Path
import json, subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'web/index.html').read_text()
FIXTURE=subprocess.check_output(['node',str(ROOT/'tests/fixture.cjs')],text=True)
def init(page):
    page.evaluate("window.__ledger=null;window.__export=null;window.prompt=(m,v)=>m==='flock:load'?window.__ledger:m==='flock:save'?(window.__ledger=v,'ok'):m==='flock:export'?(window.__export=JSON.parse(v),'pending'):m==='flock:take-import'?'':'pending'")
    page.set_content(HTML)
    page.on('dialog',lambda d:d.accept())
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    ctx=browser.new_context(viewport={'width':412,'height':915},user_agent='FlockLedger/1 UI-test')
    page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));init(page)
    page.get_by_label('Batch name',exact=True).fill('New synthetic flock')
    page.get_by_label('Date chicks were purchased',exact=True).fill('2025-01-01')
    page.get_by_label('Number of chicks purchased',exact=True).fill('12')
    page.get_by_label('Total chick cost (₱)',exact=True).fill('480')
    page.get_by_role('button',name='Save batch',exact=True).click()
    state=json.loads(page.evaluate('window.__ledger'))
    assert len(state['batches'])==1 and state['batches'][0]['initialBirds']==12 and state['batches'][0]['events']==[]
    assert page.get_by_role('button',name='Count birds',exact=True).count()==1
    print('PASS empty first launch creates a first batch and opens Overview')
    blank=ctx.new_page();init(blank)
    blank.get_by_role('button',name='Restore an existing backup',exact=True).click()
    blank.get_by_role('button',name='Export JSON backup',exact=True).click()
    assert json.loads(blank.evaluate('window.__export')['text'])['batches']==[]
    print('PASS empty ledger can export a valid backup')
    blank.get_by_label('Backup JSON',exact=True).fill(FIXTURE)
    blank.get_by_role('button',name='Validate & restore backup',exact=True).click()
    restored=json.loads(blank.evaluate('window.__ledger'))
    assert restored==json.loads(FIXTURE)
    blank.get_by_role('button',name='Overview',exact=True).click()
    assert blank.get_by_text('Not counted',exact=True).count()==1
    assert not errors,errors
    print('PASS existing schema-version-1 ledger restores from public onboarding')
    browser.close()
print('3 public-onboarding workflow tests passed; simulated native adapter.')
