"""Generate diagrams from computed preset paths; not browser screenshots."""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
root=Path(__file__).resolve().parents[1];out=root/'docs/assets';out.mkdir(exist_ok=True,parents=True)
data=json.loads((root/'docs/evidence/preset-geometry.json').read_text());bg='#fafcfc';ink='#26353a';muted='#62747a';accent='#28626b';source='#b56a45'
plt.rcParams.update({'font.family':'DejaVu Sans','svg.fonttype':'none','text.color':ink})
def save(fig,name):
 for ext in ['png','svg']:
  p=out/f'{name}.{ext}';fig.savefig(p,dpi=160,facecolor=bg)
  if ext=='svg':p.write_text('\n'.join(s.rstrip() for s in p.read_text().splitlines())+'\n')
 plt.close(fig)
fig=plt.figure(figsize=(8,4),facecolor=bg);fig.text(.065,.85,'SPATIAL AUDIO / LOCAL WORKBENCH',size=10,color=accent,weight='bold');fig.text(.065,.64,'Echo Canvas Lab',size=35);fig.text(.065,.50,'Sketch rooms. Inspect paths. Compare the sound.',size=14,color=muted);fig.text(.065,.29,'Deterministic geometry / Web Audio HRTF / Revision-safe editing',size=11,color=accent);fig.text(.065,.12,'Independent recreation inspired by Kevin Yang’s Echo Canvas.',size=10,color=muted);save(fig,'cover')
fig=plt.figure(figsize=(10,6.25),facecolor=bg);fig.text(.07,.90,'ECHO CANVAS LAB',size=11,color=accent,weight='bold');fig.text(.07,.80,'An opening changes the route',size=25);fig.text(.07,.73,'Computed doorway preset · meters · illustrative transmission model',size=12,color=muted)
for i,name in enumerate(['closed','open']):
 row=data[name];s=row['scene'];p=row['result']['sources'][0]['direct'];ax=fig.add_axes([.07+i*.47,.28,.39,.36],facecolor='white');ax.set_xlim(-.3,12.3);ax.set_ylim(8.3,-.3);ax.set_aspect('equal');ax.plot([6,6],[0,8],color='#536d75',lw=4)
 if name=='open':ax.plot([6,6],[4.3,5.7],color='white',lw=6)
 ax.plot([v['x'] for v in p['points']],[v['y'] for v in p['points']],color=accent if name=='open' else source,lw=2,ls='-' if name=='open' else '--')
 ax.scatter([2],[2],s=55,color=source,zorder=5);ax.scatter([10],[2],s=55,color=accent,zorder=5);ax.set_xticks([0,6,12]);ax.set_yticks([0,4,8]);ax.tick_params(labelsize=10,length=0);ax.set_title(f"{'Open doorway' if name=='open' else 'Closed partition'} · {p['kind']}",size=12,pad=12)
 fig.text(.07+i*.47,.21,f"{p['length']:.2f} m path / {p['lossDb']:.0f} dB modeled transmission loss",size=11,color=muted)
fig.text(.07,.11,'Open route pans toward the final doorway. Source: docs/evidence/preset-geometry.json.',size=10.5,color=muted);save(fig,'doorway-routing')
fig=plt.figure(figsize=(10,6.25),facecolor=bg);fig.text(.07,.90,'ECHO CANVAS LAB',size=11,color=accent,weight='bold');fig.text(.07,.80,'First-order paths in elevation',size=25);fig.text(.07,.73,'3D studio preset · exact image-source geometry for the shown planes',size=12,color=muted)
ax=fig.add_axes([.1,.28,.80,.34],facecolor='white');row=data['studio']['result']['sources'][0]
for p in row['reflections']:
 if p['surface'] in ['floor','ceiling']:
  ax.plot([v['x'] for v in p['points']],[v['z'] for v in p['points']],ls='--',lw=1.8,color='#91aeb6',label=p['surface'].capitalize())
p=row['direct'];ax.plot([v['x'] for v in p['points']],[v['z'] for v in p['points']],color=accent,lw=2,label='Direct');ax.scatter([2],[1.4],s=50,color=source,zorder=5);ax.scatter([10],[1.6],s=50,color=accent,zorder=5);ax.set_xlim(0,12);ax.set_ylim(-.1,3.1);ax.set_xlabel('X (m)');ax.set_ylabel('Height (m)');ax.set_yticks([0,1,2,3]);ax.legend(loc='upper right',fontsize=9);ax.tick_params(labelsize=10)
fig.text(.07,.14,'These are generated geometry diagrams, not app screenshots or measured acoustics.',size=11,color=muted);fig.text(.07,.08,'Rendered reverb and material attenuation are bounded perceptual approximations.',size=11,color=muted);save(fig,'reflection-paths')
print('Generated 3 PNG and 3 SVG diagrams')
