from playwright.sync_api import sync_playwright
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    for width,height,name in [(1365,1000,'desktop'),(412,915,'phone'),(800,1100,'tablet')]:
        context=browser.new_context(viewport={'width':width,'height':height}, user_agent='FlockLedger/1 UI-test')
        page=context.new_page();errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.evaluate("window.__ledger=null;window.prompt=(m,v)=>m==='flock:load'?window.__ledger:m==='flock:save'?(window.__ledger=v,'ok'):m==='flock:take-import'?'':'pending'");page.set_content((ROOT/'web/index.html').read_text());page.wait_for_timeout(500)
        assert page.get_by_role('heading',name='Start your flock ledger',exact=True).count()==1
        state=json.loads(page.evaluate('window.__ledger'))
        assert state['batches']==[] and state['settings']['capital']==[]
        assert not errors,errors
        page.screenshot(path=str(ROOT/'docs'/f'overview-{name}.png'),full_page=True)
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'Horizontal overflow {name}'
        context.close()
    browser.close()
print('PASS: launch, empty public first-launch state, phone/tablet/desktop layouts, no JavaScript errors.')
