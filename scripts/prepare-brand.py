from PIL import Image, ImageFilter, ImageDraw
from pathlib import Path
import json,hashlib
src=Path('public/brand/inversis-logo-original.png')
im=Image.open(src).convert('RGB'); px=im.load(); W,H=im.size
# Only background-connected/near-white pixels change alpha; opaque art RGB is retained.
bg=(250,247,245)
def distance(c): return max(abs(c[i]-bg[i]) for i in range(3))
mask=Image.new('L',im.size); m=mask.load()
for y in range(380,680):
 for x in range(155,1310):
  c=px[x,y]
  if distance(c)>18 and (max(c)-min(c)>18 or min(c)<215): m[x,y]=255
# Preserve the original white separator inside the symbol, below the centerline.
for y in range(536,665):
 xs=[x for x in range(169,502) if m[x,y]==255]
 if xs:
  for x in range(min(xs),max(xs)+1):m[x,y]=255
# Retain enclosed white guides inside the symbol, but not wordmark counters.
region=mask.crop((160,380,510,680)); flood=region.copy(); ImageDraw.floodfill(flood,(0,0),128)
for yy in range(region.height):
 for xx in range(region.width):
  if flood.getpixel((xx,yy))==0:m[xx+160,yy+380]=255
core=mask.filter(ImageFilter.MinFilter(5)).load()
out=Image.new('RGBA',im.size); o=out.load()
for y in range(380,680):
 for x in range(155,1310):
  c=px[x,y]
  if core[x,y]==255:o[x,y]=(*c,255)
  elif distance(c)>5:
   nearest=[]
   for dy in range(-4,5):
    for dx in range(-4,5):
     if core[x+dx,y+dy]==255 and distance(px[x+dx,y+dy])>60:
      nearest.append((dx*dx+dy*dy,px[x+dx,y+dy]))
   if nearest:
    f=min(nearest,key=lambda a:a[0])[1];v=[f[i]-bg[i] for i in range(3)]
    a=max(0,min(1,sum((c[i]-bg[i])*v[i] for i in range(3))/sum(t*t for t in v)))
    if a>.025:
     rgb=tuple(max(0,min(255,round((c[i]-(1-a)*bg[i])/a))) for i in range(3))
     o[x,y]=(*rgb,round(a*255))
   elif m[x,y]==255:o[x,y]=(*c,255)
bbox=out.getbbox();out=out.crop((bbox[0]-4,bbox[1]-4,bbox[2]+4,bbox[3]+4))
out.save('public/brand/inversis-logo-transparent.png',optimize=True)
preview=Image.new('RGB',(out.width,out.height*3))
for i,color in enumerate(['#fffefa','#f8f8f3','#073e40']):
 panel=Image.new('RGB',out.size,color);panel.paste(out,mask=out.getchannel('A'));preview.paste(panel,(0,i*out.height))
Path('.local').mkdir(exist_ok=True)
preview.save('.local/logo-transparency-review.png')
print(json.dumps({'bounds':bbox,'size':out.size,'originalSha256':hashlib.sha256(src.read_bytes()).hexdigest()}))

# Optional favicon: same supplied symbol, proportional fit on transparent canvas.
symbol=out.crop((0,0,338,out.height)); symbol.thumbnail((88,88),Image.Resampling.LANCZOS)
icon=Image.new('RGBA',(96,96));icon.alpha_composite(symbol,((96-symbol.width)//2,(96-symbol.height)//2));icon.save('public/brand/inversis-favicon.png',optimize=True)
