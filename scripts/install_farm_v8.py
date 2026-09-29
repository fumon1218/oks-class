#!/usr/bin/env python3
"""Install the single ZIP containing the user's individual 3D farm illustrations and playable game."""
from pathlib import Path
from zipfile import ZipFile
import json,re

root=Path.cwd()
zip_path=root/'art/farm/install/farm_v8_install.zip'
target=Path('minigames/farm-v8')
assert zip_path.is_file(), 'Upload farm_v8_install.zip first.'
with ZipFile(zip_path) as bundle:
    entries=[e for e in bundle.infolist() if not e.is_dir()]
    assert 50<=len(entries)<=120, 'Unexpected farm asset count'
    assert sum(e.file_size for e in entries)<25000000, 'Oversize unpacked bundle'
    seen=set()
    for e in entries:
        p=Path(e.filename)
        assert not p.is_absolute() and '..' not in p.parts and '\\' not in e.filename, 'Unsafe path'
        assert str(p).startswith('minigames/farm-v8/'), 'Unrelated archive content'
        assert e.file_size<6000000 and e.filename not in seen, 'Bad member'
        assert ((e.external_attr>>16)&0o170000)!=0o120000, 'Symlink disallowed'
        seen.add(e.filename)
    for filename in ['index.html','game.css','game.js','asset-manifest.json',
                     'assets/greenhouse.webp','assets/empty_planter.webp',
                     'assets/basket.webp','assets/basket_front.webp',
                     'assets/rabbit_farmer.webp']:
        assert str(target/filename) in seen, 'Missing '+filename
    for e in entries:
        path=root/e.filename
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_bytes(bundle.read(e))
assert len(list((root/target/'assets').glob('*.webp')))>=48

def replace(path,old,new):
    file=root/path
    original=file.read_text(encoding='utf8')
    assert old in original, 'Expected existing route not found in '+path
    file.write_text(original.replace(old,new),encoding='utf8')
replace('index.html','minigames/math-tycoon-v3.html','minigames/farm-v8/index.html')
replace('minigames/index.html','href="math-tycoon-v3.html"','href="farm-v8/index.html"')
replace('quests/index.html',"link:'../minigames/math-tycoon-v3.html'","link:'../minigames/farm-v8/index.html'")
path=root/'curriculum/catalog.json'
data=json.loads(path.read_text(encoding='utf8'))
for room in data.get('rooms',[]):
    if room.get('key')=='number':room['url']='minigames/farm-v8/index.html'
for item in data.get('missionLinks',[]):
    if item.get('id')=='math-farm-tycoon':item['path']='minigames/farm-v8/index.html'
path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
path=root/'curriculum/game-blueprint.json'
bp=json.loads(path.read_text(encoding='utf8'))
for subject in bp.get('subjectGroups',[]):
    if subject.get('key')=='math':
        for game in subject.get('games',[]):
            if game.get('id')=='math-01':
                game['implementation']='minigames/farm-v8/index.html'
                game['note']='46개의 개별 업로드 원본 객체 기반 온실형 체험 게임. 작물 재배, 포장, 배달, 계산을 실제로 조작.'
path.write_text(json.dumps(bp,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
teacher=root/'curriculum/teacher-guide.html'
guide=teacher.read_text(encoding='utf8')
guide=guide.replace(r'/tycoon(?:-v\d+)?\.html$/.test(g.implementation)',
                    r'/(?:tycoon(?:-v\d+)?\.html|farm-v8\/index\.html)$/.test(g.implementation)')
teacher.write_text(guide,encoding='utf8')
tests=root/'scripts/smoke-test.mjs'
s=tests.read_text(encoding='utf8')
s=s.replace("'minigames/math-tycoon-v3.html',",
            "'minigames/math-tycoon-v3.html','minigames/farm-v8/index.html',")
s=s.replace('href="math-tycoon-v3.html"','href="farm-v8/index.html"')
s=s.replace("link:'../minigames/math-tycoon-v3.html'","link:'../minigames/farm-v8/index.html'")
s=s.replace('includes("minigames/math-tycoon-v3.html"),\'Village',
            'includes("minigames/farm-v8/index.html"),\'Village')
s+="\nfor (const f of ['minigames/farm-v8/index.html','minigames/farm-v8/game.css','minigames/farm-v8/game.js','minigames/farm-v8/assets/greenhouse.webp','minigames/farm-v8/assets/empty_planter.webp','minigames/farm-v8/assets/basket_front.webp']) if (!fs.existsSync(path.join(root,f))) throw new Error('Missing farm v8: '+f);\nconsole.log('PASS individual illustration farm v8 bundle');\n"
tests.write_text(s,encoding='utf8')
sw=root/'sw.js'
source=sw.read_text(encoding='utf8')
m=re.search(r'oks-class-v(\d+)',source)
assert m
source=source.replace(m.group(0),'oks-class-v'+str(int(m.group(1))+1),1)
anchor="  './minigames/math-tycoon-v3.html',"
assert anchor in source
items=['./minigames/farm-v8/'+x for x in ['index.html','game.css','game.js']]
items+=['./minigames/farm-v8/assets/'+p.name for p in sorted((root/target/'assets').glob('*.webp'))]
source=source.replace(anchor,anchor+'\n'+'\n'.join("  '"+x+"'," for x in items),1)
sw.write_text(source,encoding='utf8')
zip_path.unlink()
print('Installed 52 farm images and playable v8. Original v3 and saved progress preserved.')
