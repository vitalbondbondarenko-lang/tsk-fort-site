"""Original architectural demonstration models for the TSK FORT website.

Run with Blender 5.2: blender --background --python scripts/build_models.py
These are authored concepts, not completed company projects or construction documents.
"""
import bpy
import math
import os
import json
import random
import sys
from collections import defaultdict
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "models")
SOURCE = os.path.join(ROOT, "source-assets", "models")
os.makedirs(OUT, exist_ok=True)
os.makedirs(SOURCE, exist_ok=True)


def linear(v):
    return v / 12.92 if v < 0.04045 else ((v + .055) / 1.055) ** 2.4


def material(name, hexcode, rough=.65, metal=0):
    rgb = tuple(linear(int(hexcode[i:i+2], 16) / 255) for i in (0, 2, 4))
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = (*rgb, 1)
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Metallic"].default_value = metal
    return m


class Meshes:
    def __init__(self):
        self.data = defaultdict(lambda: [[], []])

    def mesh(self, group, mat, verts, faces):
        v, f = self.data[(group, mat)]
        offset = len(v)
        v.extend(verts)
        f.extend(tuple(i+offset for i in face) for face in faces)

    def box(self, name, mat, x, y, z, w, d, h):
        if min(w, d, h) <= 0:
            return
        x0, x1, y0, y1, z0, z1 = x-w/2, x+w/2, y-d/2, y+d/2, z, z+h
        self.mesh(name, mat, [(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0),
                              (x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)],
                  [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])

    def cylinder(self, name, mat, x, y, z, r, h, sides=10, rtop=None):
        rt = r if rtop is None else rtop
        verts = [(x+rr*math.cos(2*math.pi*i/sides),y+rr*math.sin(2*math.pi*i/sides),zz)
                 for zz,rr in ((z,r),(z+h,rt)) for i in range(sides)]
        faces = [tuple(reversed(range(sides))), tuple(range(sides,2*sides))]
        faces += [(i,(i+1)%sides,(i+1)%sides+sides,i+sides) for i in range(sides)]
        self.mesh(name,mat,verts,faces)

    def sphere(self, name, mat, x,y,z, rx,ry,rz, seed=0):
        random.seed(seed)
        sides, rings = 12, 6
        verts = []
        for j in range(rings+1):
            a = math.pi*j/rings
            for i in range(sides):
                b = math.tau*i/sides
                jitter = 1 + random.uniform(-.08,.08)
                verts.append((x+rx*math.sin(a)*math.cos(b)*jitter,
                              y+ry*math.sin(a)*math.sin(b)*jitter,z+rz*math.cos(a)*jitter))
        faces = [((j+1)*sides+i,(j+1)*sides+(i+1)%sides,j*sides+(i+1)%sides,j*sides+i)
                 for j in range(rings) for i in range(sides)]
        self.mesh(name,mat,verts,faces)

    def finish(self, mats):
        objects=[]
        for (group,mat), (verts,faces) in self.data.items():
            mesh=bpy.data.meshes.new(group+"_"+mat)
            mesh.from_pydata(verts, [], faces)
            mesh.update()
            obj=bpy.data.objects.new(group+"_"+mat,mesh)
            bpy.context.collection.objects.link(obj)
            obj.data.materials.append(mats[mat])
            objects.append(obj)
        return objects


def materials():
    return {k:material(k,c,r,m) for k,c,r,m in [
        ("Ivory","E3E1D7",.78,0),("White","F7F5EF",.6,0),
        ("Concrete","B9BDBB",.85,0),("Dark","304653",.7,0),
        ("Glass","567B91",.24,.24),("GlassLight","A4BBC4",.26,.2),
        ("Brick","A96547",.9,0),("BrickDark","754D3E",.9,0),
        ("Teal","427C7F",.65,0),("Ochre","C6A765",.75,0),
        ("Roof","65757A",.85,0),("Metal","697F88",.35,.55),
        ("Asphalt","667476",.95,0),("Paving","D4D5CC",.9,0),
        ("Grass","9BAC85",1,0),("Green","638463",1,0),
        ("GreenLight","90A077",1,0),("GreenDark","486B56",1,0),
        ("Wood","9B7851",.9,0),("Rubber","344044",.9,0),
        ("CarLight","ECE7DA",.35,.2),("CarBlue","506C7A",.35,.2),
        ("Sport","819994",.9,0),("Court","C4977E",.95,0),
        ("Line","EFEFE2",.8,0),("Red","BC6855",.75,0)]}


def tree(g,x,y,size=1,index=0):
    z=.4
    g.cylinder("Landscape_Trees","Wood",x,y,z,.16*size,2.9*size,8,.11*size)
    for dx,dy,dz,s,mat in [(-.55,0,3.8,1.65,"Green"),(.7,.35,4.2,1.45,"GreenLight"),(0,-.25,5.1,1.25,"Green")]:
        g.sphere("Landscape_Trees",mat,x+dx*size,y+dy*size,z+dz*size,s*size,s*size,1.5*s*size,index+int(dz*100))
    g.box("Landscape_Planting","Wood",x,y,.34,2.7*size,2.7*size,.08)
    g.box("Landscape_Planting","GreenDark",x,y,.43,2.5*size,2.5*size,.12)


def bench(g,x,y,along_x=True):
    w,d=(2.1,.58) if along_x else (.58,2.1)
    g.box("Landscape_Furniture","Wood",x,y,.88,w,d,.13)
    g.box("Landscape_Furniture","Wood",x,y+(d/2 if along_x else 0),1.01,w,.11 if along_x else d,.58)
    for off in [-.8,.8]:
        g.box("Landscape_Furniture","Metal",x+off if along_x else x,y if along_x else y+off,.4,.12,.45,.48)


def lamp(g,x,y):
    g.cylinder("Landscape_Lighting","Metal",x,y,.4,.065,4.2,8)
    g.box("Landscape_Lighting","Metal",x+.33,y,4.54,.8,.13,.1)
    g.box("Landscape_Lighting","White",x+.54,y,4.51,.5,.18,.06)


def car(g,x,y,mat="CarLight",ambulance=False):
    w,d=1.8,4.25 if not ambulance else 5.1
    g.box("Landscape_Vehicles",mat,x,y,.62,w,d,.75)
    g.box("Landscape_Vehicles",mat,x,y+.18,1.26,w-.14,d*.56,.57 if not ambulance else 1.35)
    g.box("Landscape_Vehicles","Glass",x,y-1.05,1.33,w-.32,.07,.45)
    g.box("Landscape_Vehicles","Glass",x,y+1.15,1.33,w-.32,.07,.4)
    for s in [-1,1]:
        g.box("Landscape_Vehicles","Glass",x+s*(w/2-.055),y+.14,1.35,.035,2.05,.39)
        for yy in [-1.2,1.2]:
            g.box("Landscape_Vehicles","Rubber",x+s*.88,y+yy,.48,.24,.68,.65)
            g.box("Landscape_Vehicles","Metal",x+s*1.01,y+yy,.64,.03,.33,.31)
        g.box("Landscape_Vehicles","White",x+s*.59,y-d/2-.02,.94,.38,.04,.17)
        g.box("Landscape_Vehicles","Red",x+s*.59,y+d/2+.02,.94,.38,.04,.15)
    if ambulance:
        g.box("Landscape_Vehicles","Teal",x,y+.35,2.61,.9,.32,.18)
        g.box("Landscape_Vehicles","Teal",x-.912,y+.3,1.39,.035,.94,.28)
        g.box("Landscape_Vehicles","Teal",x-.914,y+.3,1.06,.035,.28,.94)


def site(g,w,d):
    g.box("Landscape_Base","Concrete",0,0,0,w,d,.32)
    g.box("Landscape_Paving","Paving",0,0,.32,w-.35,d-.35,.08)
    g.box("Landscape_Lawn","Grass",0,0,.4,w-1.4,d-1.4,.025)
    # Perimeter pedestrian pavement and modest boundary kerbs.
    for y in [-d/2+1.8,d/2-1.8]:
        g.box("Landscape_Paving","Paving",0,y,.43,w-2,2,.07)
    for x in [-w/2+1.8,w/2-1.8]:
        g.box("Landscape_Paving","Paving",x,0,.43,2,d-6,.07)
    for y in [-d/2+3.0,d/2-3.0]:
        g.box("Landscape_Kerbs","Ivory",0,y,.4,w-2,.16,.19)


def road(g,x,y,w,d,kerbs=True):
    g.box("Landscape_Road","Asphalt",x,y,.435,w,d,.035)
    if kerbs:
        for sy in [-1,1]:
            g.box("Landscape_Kerbs","Ivory",x,y+sy*d/2,.44,w,.15,.16)


def parking(g,startx,y,n,spacing=2.7):
    for i in range(n):
        x=startx+i*spacing
        g.box("Landscape_Parking","Line",x-spacing/2,y,.481,.08,4.8,.014)
        g.box("Landscape_Parking","Line",x,y+2.4,.481,spacing,.075,.014)
        if i%3 != 1:
            car(g,x,y,"CarLight" if i%2 else "CarBlue")


def framed_window(g,x,y,z,w,h,wall="front",frame="White",glass="Glass"):
    if wall in ("front","back"):
        g.box("Facade_Glass",glass,x,y,z,w,.065,h)
        for xx in [x-w/2,x+w/2,x]:
            g.box("Facade_Frames",frame,xx,y-.035 if wall=="front" else y+.035,z,.072,.1,h)
        for zz in [z,z+h-.07]:
            g.box("Facade_Frames",frame,x,y,zz,w,.14,.075)
        g.box("Facade_Sills",frame,x,y,z-.07,w+.18,.28,.075)
    else:
        g.box("Facade_Glass",glass,x,y,z,.065,w,h)
        for yy in [y-w/2,y+w/2,y]:
            g.box("Facade_Frames",frame,x,yy,z,.1,.072,h)
        for zz in [z,z+h-.07]:
            g.box("Facade_Frames",frame,x,y,zz,.14,w,.075)
        g.box("Facade_Sills",frame,x,y,z-.07,.28,w+.18,.075)


def building(g,cx,cy,w,d,floors,fh=3.3,facade="Ivory",bay=3.4,accent="Dark",stripe=False):
    zbase=.55
    nx,ny=max(2,round(w/bay)),max(2,round(d/bay))
    bx,by=w/nx,d/ny
    # Exposed floor decks and primary columns support the cutaway view.
    for f in range(floors+1):
        g.box("Structure_Slabs","Concrete",cx,cy,zbase+f*fh,w,d,.24)
    for i in range(nx+1):
        for j in [0,ny]:
            g.box("Structure_Columns","Concrete",cx-w/2+i*bx,cy-d/2+j*by,zbase,.35,.35,floors*fh)
    for j in range(1,ny):
        for i in [0,nx]:
            g.box("Structure_Columns","Concrete",cx-w/2+i*bx,cy-d/2+j*by,zbase,.35,.35,floors*fh)
    g.box("Structure_Core","Concrete",cx,cy,zbase,3.1,3.8,fh*floors)
    for f in range(floors):
        z=zbase+f*fh
        for s in [-1,1]:
            yy=cy+s*(d/2+.03)
            mat=accent if stripe and f==0 else facade
            g.box("Facade_Panels",mat,cx,yy,z,w,.22,.86)
            g.box("Facade_Panels",mat,cx,yy,z+fh-.44,w,.22,.44)
            for i in range(nx+1):
                xx=cx-w/2+i*bx
                g.box("Facade_Piers",facade,xx,yy,z,.70,.25,fh)
            for i in range(nx):
                xx=cx-w/2+(i+.5)*bx
                framed_window(g,xx,yy+s*.13,z+.95,bx-.84,fh-1.48,"front" if s<0 else "back",glass="GlassLight" if (i+f)%5==0 else "Glass")
            if f%3==2:
                g.box("Facade_Bands","White",cx,yy,z+fh-.1,w+.16,.34,.15)
        for s in [-1,1]:
            xx=cx+s*(w/2+.035)
            g.box("Facade_Panels",facade,xx,cy,z,.24,d,.86)
            g.box("Facade_Panels",facade,xx,cy,z+fh-.44,.24,d,.44)
            for j in range(ny+1):
                yy=cy-d/2+j*by
                g.box("Facade_Piers",facade,xx,yy,z,.25,.70,fh)
            for j in range(ny):
                yy=cy-d/2+(j+.5)*by
                framed_window(g,xx+s*.12,yy,z+.95,by-.83,fh-1.48,"side")
    roof=zbase+floors*fh+.24
    g.box("Structure_Roof","Roof",cx,cy,roof,w-.4,d-.4,.07)
    for s in [-1,1]:
        g.box("Facade_Parapets",facade,cx+s*w/2,cy,roof,.22,d+.3,.65)
        g.box("Facade_Parapets",facade,cx,cy+s*d/2,roof,w,.22,.65)
        g.box("Facade_Cappings","Metal",cx,cy+s*d/2,roof+.64,w+.3,.32,.07)
        g.box("Facade_Cappings","Metal",cx+s*w/2,cy,roof+.64,.32,d+.3,.07)
    g.box("Structure_Rooftop","Ivory",cx+1,cy+1,roof,3.1,3.5,1.55)
    g.box("Structure_Rooftop","Metal",cx+1,cy+1,roof+1.55,3.4,3.8,.14)
    for k in range(max(1,int(w/12))):
        x=cx-w/3+k*5.0
        g.box("Structure_Mechanical","Metal",x,cy+d/4,roof+.15,2.1,1.5,.8)
        for j in range(5):
            g.box("Structure_Mechanical","Dark",x-.8+j*.4,cy+d/4,roof+.95,.1,1.35,.04)
    return roof


def balcony(g,x,y,z,w=2.6):
    g.box("Structure_Balconies","Concrete",x,y,z,w,1.85,.20)
    g.box("Facade_BalconyGlass","GlassLight",x,y-.86,z+.2,w,.07,.99)
    for xx in [x-w/2,x+w/2]:
        g.box("Facade_BalconyGlass","GlassLight",xx,y,z+.2,.07,1.78,.99)
        g.box("Facade_BalconyRails","White",xx,y-.9,z+.2,.085,.085,1.06)
    g.box("Facade_BalconyRails","Metal",x,y-.91,z+1.23,w+.05,.09,.08)


def apartment(g):
    site(g,76,60)
    road(g,0,-22,70,10)
    parking(g,-28,-23,9)
    g.box("Landscape_Paving","Paving",0,-10,.46,51,10,.06)
    g.box("Landscape_Paving","Paving",0,2,.44,49,25,.06)
    for cx,cy,nf,mat in [(-11,3,11,"Brick"),(11,5,10,"Ivory")]:
        roof=building(g,cx,cy,19,17,nf,3.12,mat,3.15,"Dark",True)
        # Vertical bright lodgia ribbons and their detailed glass balustrades.
        for xoff in [-5.0,4.45]:
            for f in range(1,nf):
                balcony(g,cx+xoff,cy-9.28,.55+f*3.12,2.7)
            for sx in [-1,1]:
                g.box("Facade_Loggias","White",cx+xoff+sx*1.43,cy-9.1,3.67,.18,2.12,(nf-1)*3.12+.36)
        g.box("Facade_Entrances","Dark",cx,cy-8.85,.55,3.0,.16,2.8)
        framed_window(g,cx,cy-8.99,.7,2.55,2.5,"front",frame="Metal")
        g.box("Structure_Canopies","Dark",cx,cy-10.1,3.25,5.3,3.1,.22)
        for sx in [-2.25,2.25]:
            g.box("Structure_CanopyColumns","Metal",cx+sx,cy-11.1,.52,.11,.11,2.75)
        g.box("Landscape_Paving","Paving",cx,cy-12,.47,4,5,.1)
        for k in range(3):
            g.cylinder("Structure_Rooftop","Metal",cx-5+k*4,cy+1,roof,.25,1.4,10)
    # Connecting glazed lobby and a courtyard pavilion.
    g.box("Structure_Lobby","Concrete",0,-1,.53,4.0,11.0,3.1)
    framed_window(g,0,-6.6,.7,3.6,2.5)
    for xy in [(-31,-11),(-31,1),(-30,14),(29,-10),(31,5),(29,20),(-20,23),(-5,24),(12,24)]:
        tree(g,*xy,1.04,int(xy[0]*4))
    for x in [-22,-7,8,25]:
        bench(g,x,-12)
        lamp(g,x,-15)
    g.box("Landscape_Courtyard","Court",-26,12,.48,6.5,7.5,.06)
    for x in [-27,-24.7]:
        g.box("Landscape_Play","Wood",x,12,.55,.13,.13,2.4)
    g.box("Landscape_Play","Wood",-25.85,12,2.92,2.8,.18,.18)
    for x in [-26.7,-25.0]:
        for yy in [11.8,12.2]:
            g.box("Landscape_Play","Metal",x,yy,1.07,.035,.035,1.82)
        g.box("Landscape_Play","Teal",x,12,1.02,.7,.5,.10)


def sports_court(g,x,y,w=24,d=13):
    g.box("Landscape_Sports","Court",x,y,.56,w+2,d+2,.06)
    g.box("Landscape_Sports","Sport",x,y,.62,w,d,.025)
    for sy in [-1,1]:
        g.box("Landscape_SportsLines","Line",x,y+sy*(d/2-.6),.65,w-1.2,.075,.02)
    for sx in [-1,1]:
        g.box("Landscape_SportsLines","Line",x+sx*(w/2-.6),y,.65,.075,d-1.2,.02)
        g.box("Landscape_SportsLines","Line",x+sx*(w/2-4.0),y,.65,.075,5.2,.02)
        for yy in [-2.6,2.6]:
            g.box("Landscape_SportsLines","Line",x+sx*(w/2-2.3),y+yy,.65,3.4,.075,.02)
        g.box("Landscape_SportsEquipment","Metal",x+sx*(w/2-1),y,.56,.1,.1,3.1)
        g.box("Landscape_SportsEquipment","White",x+sx*(w/2-1),y,3.38,.12,1.7,1.0)
    g.box("Landscape_SportsLines","Line",x,y,.65,.075,d-1.2,.02)
    sides=40
    radius=1.7
    for i in range(sides):
        a,b=math.tau*i/sides,math.tau*(i+1)/sides
        p=[(x+rr*math.cos(aa),y+rr*math.sin(aa),.67) for rr,aa in [(radius,a),(radius,b),(radius+.075,b),(radius+.075,a)]]
        g.mesh("Landscape_SportsLines","Line",p,[(0,1,2,3)])


def school(g):
    site(g,94,72)
    road(g,0,-29,88,7)
    parking(g,-32,-29,7)
    g.box("Landscape_Paving","Paving",-7,0,.45,62,47,.07)
    building(g,-8,13,54,12,3,3.65,"Ivory",3.6,"Teal",True)
    building(g,-29,-3.4,12,20,3,3.65,"Ivory",3.7,"Teal",True)
    building(g,13,-3.4,12,20,3,3.65,"Ivory",3.7,"Teal",True)
    for x in [-29,13]:
        g.box("Structure_ExpansionJoints","Dark",x,6.8,.55,11.7,.4,10.93)
    # Glazed entry portal at the centre of the courtyard façade.
    g.box("Facade_EntryPortal","Teal",-8,6.68,.55,12,.26,10.96)
    for f in range(3):
        framed_window(g,-8,6.48,.9+f*3.65,10.6,2.8,frame="Metal")
    g.box("Structure_EntryCanopy","White",-8,4.6,3.78,14,5.2,.25)
    for x in [-13.8,-2.2]:
        g.box("Structure_EntryColumns","Metal",x,2.7,.55,.14,.14,3.23)
    # Exterior vertical sun-screen accents with long, crisp shadows.
    for x in [-31.5,-27.5,-23.5,7.5,11.5,15.5]:
        g.box("Facade_SunScreens","Ochre",x,-13.85,4.0,.24,.6,6.65)
    building(g,33,11,18,28,1,9.5,"Brick",4.5,"Teal")
    for y in [-.5,4,8.5,13,17.5,22]:
        framed_window(g,42.22,y,4.2,3.15,4.2,"side",frame="Dark")
    g.box("Structure_Link","Concrete",22,14,.56,6,7,3.8)
    framed_window(g,22,10.42,.85,5.4,2.9,frame="Metal")
    sports_court(g,26,-19.5,25,10)
    g.box("Landscape_Courtyard","Grass",-8,-6,.54,25,15,.06)
    g.box("Landscape_Paving","Paving",-8,-5,.61,5,21,.035)
    for x in [-17,1]:
        for y in [-8,-1]:
            tree(g,x,y,.85,int(x+y))
    for x in [-39,-22,-4,16,37]:
        tree(g,x,29,.95,int(x+100))
    for y in [-16,0,15]:
        tree(g,-41,y,.95,int(y+200))
    for x in [-18,2]:
        bench(g,x,-13)
        lamp(g,x,-19)
    for x in [-16,0]:
        g.box("Landscape_EntrySteps","Concrete",x,-18,.46,9,1.8,.13)
    # Minimal sports perimeter, represented by thin horizontal rails, not a solid fence.
    for x in range(13,40,3):
        g.box("Landscape_SportsFence","Metal",x,-25,.53,.05,.05,2.9)
    for h in [.9,1.9,3.2]:
        g.box("Landscape_SportsFence","Metal",26,-25,h,26,.04,.045)


def hospital(g):
    site(g,90,68)
    road(g,0,-26,84,10,False)
    g.box("Landscape_Kerbs","Ivory",0,-31,.44,84,.15,.16)
    g.box("Landscape_Kerbs","Ivory",-9.5,-21,.44,65,.15,.16)
    g.box("Landscape_Kerbs","Ivory",38.5,-21,.44,7,.15,.16)
    parking(g,-31,-27,6)
    g.box("Landscape_Paving","Paving",0,-1,.44,64,41,.075)
    building(g,0,9,46,18,6,3.6,"Ivory",3.85,"Teal",True)
    building(g,-17,-10,12,20,4,3.6,"Ivory",3.85,"Teal",True)
    # Continuous central glazed stair / lift bay with individual mullions.
    for f in range(6):
        g.box("Facade_CurtainWall","Glass",0,-.24,.8+f*3.6,7.8,.11,3.2)
        for x in [-3.9,-1.95,0,1.95,3.9]:
            g.box("Facade_CurtainMullions","Metal",x,-.35,.65+f*3.6,.08,.13,3.6)
        g.box("Facade_CurtainMullions","Metal",0,-.37,.65+f*3.6,8,.13,.1)
    for x in [-20,-12,12,20]:
        g.box("Facade_SunScreens","Teal",x,-.45,4.4,.23,.7,17.9)
    # Low, fully glazed consultation and arrival pavilion.
    building(g,7,-8,22,12,1,4.3,"White",3.6,"Teal",True)
    for x in [-1.5,2.1,5.7,9.3,12.9,16.5]:
        framed_window(g,x,-14.25,.75,3.1,3.55,frame="Metal")
    g.box("Facade_PavilionFascia","Teal",7,-14.4,4.64,23.5,.45,.57)
    g.box("Structure_PavilionRoof","White",7,-8,4.94,23.5,13.5,.24)
    # Three-dimensional medical cross on the solid end panel.
    for x,y,z,w,d,h in [(23.3,11,16,.15,4.2,1.1),(23.32,11,14.45,.15,1.1,4.2)]:
        g.box("Facade_MedicalSymbol","Teal",x,y,z,w,d,h)
    # Entry steps, accessible ramp and twin handrails.
    for i in range(4):
        g.box("Landscape_EntrySteps","Concrete",5,-15.1-i*.48,.47,8,2.3-i*.48,.09*(4-i))
    verts=[(10,-18,.48),(17,-18,.48),(17,-16.4,.48),(10,-16.4,.48),
           (10,-18,.87),(17,-18,.52),(17,-16.4,.52),(10,-16.4,.87)]
    g.mesh("Landscape_AccessibleRamp","Concrete",verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(3,7,6,2),(0,4,7,3),(1,2,6,5)])
    for y in [-18,-16.4]:
        for x in [10,12,14,16,17]:
            g.box("Landscape_RampRails","Metal",x,y,.53,.04,.04,1.1)
        g.box("Landscape_RampRails","Metal",13.5,y,1.63,7,.05,.05)
    # Ambulance porte-cochère and a dedicated access spur.
    road(g,29,-11.7,10,18.6,False)
    for x in [24,34]:
        g.box("Landscape_Kerbs","Ivory",x,-11.7,.44,.15,18.6,.16)
    g.box("Structure_AmbulanceCanopy","White",28,-8,4.55,12,12,.34)
    g.box("Facade_AmbulanceFascia","Teal",28,-14,4.47,12,.18,.5)
    for x in [23,33]:
        for y in [-12.8,-3.0]:
            g.box("Structure_AmbulanceColumns","Metal",x,y,.54,.18,.18,4.02)
    car(g,27,-8,"CarLight",True)
    car(g,30,-16,"CarLight",True)
    for xy in [(-36,-16),(-37,0),(-37,17),(34,21),(8,27),(-13,27),(-32,27),(39,1),(39,-13)]:
        tree(g,*xy,.95,int(xy[0]*10+xy[1]))
    for x in [-31,-8,8,22]:
        lamp(g,x,-20)
    for y in [-3,4,11]:
        bench(g,-29,y,False)
    for x in [-7,0,7,14]:
        g.box("Landscape_Planters","White",x,-19.1,.5,2.9,1.3,.58)
        g.box("Landscape_Planting","Green",x,-19.1,1.08,2.7,1.1,.42)


def aim(obj, target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat("-Z","Y").to_euler()


def scene_setup(kind, objects):
    scene=bpy.context.scene
    scene.render.engine="CYCLES"
    scene.cycles.samples=24
    scene.cycles.use_denoising=True
    scene.cycles.max_bounces=5
    scene.cycles.diffuse_bounces=3
    scene.cycles.glossy_bounces=3
    scene.render.resolution_x=1400
    scene.render.resolution_y=1100
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format="JPEG"
    scene.render.image_settings.quality=92
    scene.render.film_transparent=False
    scene.world.color=(.65,.7,.74)
    scene.world.use_nodes=True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value=(.72,.78,.82,1)
    scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value=.65
    scene.view_settings.view_transform="AgX"
    scene.view_settings.look="AgX - Medium High Contrast"
    # This backdrop is rendered, but intentionally excluded from the portable GLB.
    bpy.ops.mesh.primitive_plane_add(size=2000, location=(0,0,-.07))
    backdrop=bpy.context.object
    backdrop.name="Render_Backdrop"
    backdrop.data.materials.append(material("Backdrop","E3E8E7",.9))
    bpy.ops.object.light_add(type="AREA", location=(-45,-55,95))
    light=bpy.context.object
    light.name="Render_Key"
    light.data.energy=155000
    light.data.shape="DISK"
    light.data.size=55
    aim(light,(0,0,0))
    bpy.ops.object.light_add(type="SUN", location=(0,0,80))
    sun=bpy.context.object
    sun.name="Render_Sun"
    sun.data.energy=1.6
    sun.data.angle=.15
    sun.rotation_euler=(math.radians(25),math.radians(-28),math.radians(-35))
    bpy.ops.object.camera_add(location=(95,-115,92 if kind=="apartment" else 102))
    camera=bpy.context.object
    camera.name="Render_Camera"
    aim(camera,(0,0,10 if kind=="apartment" else 4))
    camera.data.type="ORTHO"
    camera.data.ortho_scale=100 if kind=="apartment" else 117
    camera.data.lens=48
    camera.data.clip_end=2500
    scene.camera=camera
    scene.render.filepath=os.path.join(OUT,kind+".jpg")


def run(kind):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    mats=materials()
    g=Meshes()
    globals()[kind](g)
    objects=g.finish(mats)
    triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,kind+".glb"),export_format="GLB",
                              use_selection=True,export_yup=True,export_apply=True,
                              export_animations=False,export_cameras=False,export_lights=False,
                              export_extras=False,export_texcoords=False,export_normals=True)
    scene_setup(kind,objects)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE,kind+".blend"))
    bpy.ops.render.render(write_still=True)
    info={"kind":kind,"triangles":triangles,"mesh_objects":len(objects),
          "glb_bytes":os.path.getsize(os.path.join(OUT,kind+".glb")),
          "poster_bytes":os.path.getsize(os.path.join(OUT,kind+".jpg")),
          "authorship":"Original architectural demonstration concept, authored in Blender 5.2",
          "not_a_built_project":True}
    with open(os.path.join(SOURCE,kind+"-stats.json"),"w") as f:
        json.dump(info,f,ensure_ascii=False,indent=2)
    print("MODEL_COMPLETE "+json.dumps(info),flush=True)
    return info


requested=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else ["apartment","school","hospital"]
for item in requested:
    run(item)
