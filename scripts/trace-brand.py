"""Convert the approved-direction logo's alpha silhouette to editable SVG paths."""
from PIL import Image
from pathlib import Path
from collections import defaultdict
import math

root=Path(__file__).resolve().parents[1]
image=Image.open(root/'public/brand/behara-calligraphic-v3.png').convert('RGBA')
alpha=image.getchannel('A')
w,h=image.size
pixels=alpha.load()
inside=lambda x,y: 0<=x<w and 0<=y<h and pixels[x,y]>=128
edges=defaultdict(list)
for y in range(h):
    for x in range(w):
        if not inside(x,y): continue
        if not inside(x,y-1): edges[(x,y)].append((x+1,y))
        if not inside(x+1,y): edges[(x+1,y)].append((x+1,y+1))
        if not inside(x,y+1): edges[(x+1,y+1)].append((x,y+1))
        if not inside(x-1,y): edges[(x,y+1)].append((x,y))

def simplify(points,epsilon=1.25):
    if len(points)<3:return points
    ax,ay=points[0];bx,by=points[-1]
    dx,dy=bx-ax,by-ay
    scale=math.hypot(dx,dy)
    distances=[abs(dy*(x-ax)-dx*(y-ay))/scale if scale else math.hypot(x-ax,y-ay) for x,y in points]
    index=max(range(len(points)),key=lambda i:distances[i])
    if distances[index]>epsilon:return simplify(points[:index+1])+simplify(points[index:])[1:]
    return [points[0],points[-1]]

contours=[]
while edges:
    start=next(iter(edges));point=start;loop=[start]
    while True:
        options=edges.get(point)
        if not options:break
        end=options.pop()
        if not options:del edges[point]
        loop.append(end);point=end
        if point==start:break
    area=abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(loop,loop[1:])))/2
    if area<40:continue
    mid=len(loop)//2
    contours.append(simplify(loop[:mid+1])+simplify(loop[mid:])[1:])
allpoints=[p for c in contours for p in c]
x0=min(p[0] for p in allpoints)-18;y0=min(p[1] for p in allpoints)-18
x1=max(p[0] for p in allpoints)+18;y1=max(p[1] for p in allpoints)+18
data=' '.join('M'+' '.join(f'{x},{y}' for x,y in c)+'Z' for c in contours)
view=f'{x0} {y0} {x1-x0} {y1-y0}'
for name,color in [('behara-logo-v3.svg','#192630'),('behara-logo-v3-champagne.svg','#f0e8d8')]:
    (root/'public/brand'/name).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" role="img" aria-label="به‌آرا"><path fill="{color}" fill-rule="evenodd" d="{data}"/></svg>',encoding='utf-8')
print(f'{len(contours)} contours; viewBox={view}; {len(data)} path characters')
