"""Original engineering presentation models, Blender 5.2.1.

Reproducible architectural concepts, not as-built BIM or working documentation.
Blender --background --python scripts/build_models.py [-- apartment school hospital]
"""
import bpy
import json
import math
import os
import sys
from collections import defaultdict
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "models")
SOURCE = os.path.join(ROOT, "source-assets", "models")
os.makedirs(OUT, exist_ok=True)
os.makedirs(SOURCE, exist_ok=True)


def linear(v):
    return v / 12.92 if v < .04045 else ((v + .055) / 1.055) ** 2.4


def material(name, colour, roughness=.72, metallic=0):
    rgb = tuple(linear(int(colour[i:i+2], 16)/255) for i in (0,2,4))
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb,1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*rgb,1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    return mat


PALETTE = {
    "Concrete": ("C5C7C4",.83,0),
    "ConcreteCut": ("ADB2B1",.87,0),
    "White": ("ECECE8",.65,0),
    "Graphite": ("494F52",.55,.10),
    "Steel": ("777E80",.42,.40),
    "Glass": ("929FA2",.19,.27),
    "GlassDark": ("637276",.22,.25),
    "Roof": ("929795",.91,0),
    "Interior": ("DEDFDC",.85,0),
}


class Geometry:
    def __init__(self):
        self.groups = defaultdict(lambda: [[],[]])

    def mesh(self, group, mat, verts, faces):
        vv,ff = self.groups[(group,mat)]
        offset=len(vv)
        vv.extend(verts)
        ff.extend(tuple(i+offset for i in f) for f in faces)

    def box(self, group, mat, x,y,z,w,d,h):
        if min(w,d,h)<=0:
            return
        xa,xb,ya,yb,za,zb=x-w/2,x+w/2,y-d/2,y+d/2,z,z+h
        self.mesh(group,mat,[(xa,ya,za),(xb,ya,za),(xb,yb,za),(xa,yb,za),
                             (xa,ya,zb),(xb,ya,zb),(xb,yb,zb),(xa,yb,zb)],
                  [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])

    def beam(self, group, mat, start,end,width,depth=None):
        """Rectangular prism between two world-space points, for roof trusses."""
        a,b=Vector(start),Vector(end)
        direction=(b-a).normalized()
        ref=Vector((0,0,1)) if abs(direction.z)<.98 else Vector((0,1,0))
        u=direction.cross(ref).normalized()*(width/2)
        v=direction.cross(u).normalized()*((depth or width)/2)
        verts=[tuple(p+du*u+dv*v) for p in [a,b] for du,dv in [(-1,-1),(1,-1),(1,1),(-1,1)]]
        self.mesh(group,mat,verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])

    def finish(self):
        mats={k:material(k,*v) for k,v in PALETTE.items()}
        objects=[]
        for (group,mat),(verts,faces) in self.groups.items():
            mesh=bpy.data.meshes.new(group+"_"+mat)
            mesh.from_pydata(verts,[],faces)
            mesh.update()
            obj=bpy.data.objects.new(group+"_"+mat,mesh)
            bpy.context.collection.objects.link(obj)
            obj.data.materials.append(mats[mat])
            objects.append(obj)
        return objects


def slab_with_hole(g,cx,cy,w,d,z,thickness=.24,hole=None,group="Structure_FloorSlabs"):
    if not hole:
        g.box(group,"Concrete",cx,cy,z,w,d,thickness)
        return
    hx,hy,hw,hd=hole
    xl,xr,yl,yr=cx-w/2,cx+w/2,cy-d/2,cy+d/2
    hl,hr,hb,ht=hx-hw/2,hx+hw/2,hy-hd/2,hy+hd/2
    g.box(group,"Concrete",(xl+hl)/2,cy,z,hl-xl,d,thickness)
    g.box(group,"Concrete",(hr+xr)/2,cy,z,xr-hr,d,thickness)
    g.box(group,"Concrete",hx,(yl+hb)/2,z,hw,hb-yl,thickness)
    g.box(group,"Concrete",hx,(ht+yr)/2,z,hw,yr-ht,thickness)


def stair_core(g,cx,cy,levels,fh,base=.6,width=3.8,depth=5.7):
    """Open structural core: actual stair flights and landings are visible."""
    top=levels*fh
    # Back and one shear wall remain; the viewer-facing wall is cut away.
    g.box("Structure_ShearWalls","ConcreteCut",cx,cy+depth/2,base,width+.25,.25,top)
    g.box("Structure_ShearWalls","ConcreteCut",cx-width/2,cy,base,.25,depth,top)
    g.box("Structure_CorePiers","ConcreteCut",cx+width/2,cy+depth/2-.4,base,.25,.8,top)
    run=3.5
    steps=10
    tread=run/steps
    riser=fh/(2*steps)
    for f in range(levels):
        z=base+f*fh+.24
        for i in range(steps):
            y=cy-run/2+(i+.5)*tread
            g.box("Structure_StairFlights","Concrete",cx-.85,y,z+i*riser,1.45,tread,.18)
            g.box("Structure_StairRisers","Concrete",cx-.85,y-tread/2,z+i*riser,1.45,.04,riser+.04)
            y=cy+run/2-(i+.5)*tread
            g.box("Structure_StairFlights","Concrete",cx+.85,y,z+fh/2+i*riser,1.45,tread,.18)
            g.box("Structure_StairRisers","Concrete",cx+.85,y+tread/2,z+fh/2+i*riser,1.45,.04,riser+.04)
        g.box("Structure_StairLandings","Concrete",cx,cy+2.1,z+fh/2,3.2,.75,.20)
        g.box("Structure_StairLandings","Concrete",cx,cy-2.1,z+fh-.05,3.2,.75,.20)
        # Light metal balustrades deliberately use sparse, structural lines.
        for s in [-1,1]:
            xx=cx+s*.13
            a=(xx,cy-run/2,z+.95+(fh/2 if s>0 else 0))
            b=(xx,cy+run/2,z+.95+(0 if s>0 else fh/2))
            g.beam("Structure_StairRails","Steel",a,b,.035)
        for yy,zz in [(cy-1.6,z),(cy+1.6,z+fh/2)]:
            g.box("Structure_StairRails","Steel",cx,yy,zz+.3,.035,.035,.72)


def window(g,cx,cy,z,w,h,side="front",dark=False,divisions=2):
    glass="GlassDark" if dark else "Glass"
    if side in ("front","back"):
        g.box("Facade_Glazing",glass,cx,cy,z,w,.045,h)
        for i in range(divisions+1):
            g.box("Facade_Mullions","Graphite",cx-w/2+i*w/divisions,cy,z,.045,.10,h)
        for zz in [z,z+h-.045]:
            g.box("Facade_Mullions","Graphite",cx,cy,zz,w,.10,.045)
        if h>2.5:
            g.box("Facade_Transoms","Graphite",cx,cy,z+h*.73,w,.08,.04)
        g.box("Facade_Sills","White",cx,cy,z-.06,w+.12,.18,.055)
    else:
        g.box("Facade_Glazing",glass,cx,cy,z,.045,w,h)
        for i in range(divisions+1):
            g.box("Facade_Mullions","Graphite",cx,cy-w/2+i*w/divisions,z,.10,.045,h)
        for zz in [z,z+h-.045]:
            g.box("Facade_Mullions","Graphite",cx,cy,zz,.10,w,.045)
        if h>2.5:
            g.box("Facade_Transoms","Graphite",cx,cy,z+h*.73,.08,w,.04)
        g.box("Facade_Sills","White",cx,cy,z-.06,.18,w+.12,.055)


def building(g,cx,cy,w,d,levels,fh=3.3,bay=4.2,core=True,cut=False,continuous=False):
    """Column-and-beam frame with a partially removed front-right envelope."""
    base=.6
    nx,ny=round(w/bay),round(d/bay)
    bx,by=w/nx,d/ny
    hx,hy=cx-.6,cy+.1
    hole=(hx,hy,4.05,5.95) if core else None
    g.box("Structure_FoundationRafts","ConcreteCut",cx,cy,0,w+.55,d+.55,.42)
    # Distinct bearing grid, spanning beams and slab depths.
    for i in range(nx+1):
        xx=cx-w/2+i*bx
        for j in range(ny+1):
            yy=cy-d/2+j*by
            if hole and abs(xx-hx)<2.2 and abs(yy-hy)<3.15:
                continue
            g.box("Structure_ColumnBases","ConcreteCut",xx,yy,.42,.7,.7,.18)
            g.box("Structure_Columns","Concrete",xx,yy,base,.36,.36,levels*fh+.24)
    for f in range(levels+1):
        z=base+f*fh
        slab_with_hole(g,cx,cy,w,d,z,.24,hole)
        if f:
            for j in range(ny+1):
                yy=cy-d/2+j*by
                if hole and abs(yy-hy)<3.15:
                    for a,b in [(cx-w/2,hx-2.02),(hx+2.02,cx+w/2)]:
                        g.box("Structure_Rigels","ConcreteCut",(a+b)/2,yy,z-.27,b-a,.28,.27)
                else:
                    g.box("Structure_Rigels","ConcreteCut",cx,yy,z-.27,w,.28,.27)
            for i in range(nx+1):
                xx=cx-w/2+i*bx
                if hole and abs(xx-hx)<2.2:
                    continue
                g.box("Structure_SecondaryBeams","Concrete",xx,cy,z-.18,.24,d,.18)
    if core:
        stair_core(g,hx,hy,levels,fh,base)
    for f in range(levels):
        z=base+f*fh
        # Interior partitions behind the opened face demonstrate inhabited bays.
        if cut:
            for j in range(1,ny):
                yy=cy-d/2+j*by
                if yy<cy:
                    g.box("Structure_InteriorPartitions","Interior",cx+w*.22,yy,z+.24,w*.33,.12,fh-1.05)
        for sign in [-1,1]:
            yy=cy+sign*(d/2+.12)
            for i in range(nx):
                xx=cx-w/2+(i+.5)*bx
                opened=cut and sign<0 and i>=nx-2 and f>=1
                if opened:
                    continue
                lower=.66 if not continuous else .36
                height=fh-lower-.38
                g.box("Facade_Spandrels","White",xx,yy,z+.24,bx-.015,.20,lower-.24)
                g.box("Facade_Headers","White",xx,yy,z+fh-.35,bx-.015,.20,.35)
                for dx in [-bx/2+.12,bx/2-.12]:
                    g.box("Facade_Piers","White",xx+dx,yy,z+.24,.225,.24,fh-.24)
                window(g,xx,yy+sign*.13,z+lower,bx-.55,height,"front" if sign<0 else "back",dark=(f==0),divisions=3 if continuous else 2)
        for sign in [-1,1]:
            xx=cx+sign*(w/2+.12)
            for j in range(ny):
                yy=cy-d/2+(j+.5)*by
                opened=cut and sign>0 and j<max(1,ny//2) and f>=1
                if opened:
                    continue
                lower=.66 if not continuous else .36
                g.box("Facade_Spandrels","White",xx,yy,z+.24,.20,by-.015,lower-.24)
                g.box("Facade_Headers","White",xx,yy,z+fh-.35,.20,by-.015,.35)
                for dy in [-by/2+.12,by/2-.12]:
                    g.box("Facade_Piers","White",xx,yy+dy,z+.24,.24,.225,fh-.24)
                window(g,xx+sign*.13,yy,z+lower,by-.55,fh-lower-.38,"side",dark=(f==0),divisions=3 if continuous else 2)
    roof=base+levels*fh+.24
    # Membrane strips leave the real stair opening legible from the axonometric view.
    slab_with_hole(g,cx,cy,w-.32,d-.32,roof,.045,hole,"Structure_RoofDeck")
    for sign in [-1,1]:
        g.box("Facade_Parapets","White",cx,cy+sign*d/2,roof,w,.15,.48)
        g.box("Facade_Parapets","White",cx+sign*w/2,cy,roof,.15,d,.48)
        g.box("Facade_ParapetCaps","Graphite",cx,cy+sign*d/2,roof+.48,w+.14,.24,.035)
        g.box("Facade_ParapetCaps","Graphite",cx+sign*w/2,cy,roof+.48,.24,d+.14,.035)
    # Plant equipment is simple engineering geometry, restrained in scale.
    for i in range(max(1,round(w/12))):
        xx=cx-w*.30+i*4.5
        yy=cy+d*.32
        g.box("Structure_RooftopEquipment","Steel",xx,yy,roof+.1,1.8,1.2,.58)
        for j in range(5):
            g.box("Structure_MechanicalLouvers","Graphite",xx-.65+j*.32,yy,roof+.69,.05,1.05,.035)
    return roof


def entrance(g,x,y,w=5.4,canopy=2.1):
    g.box("Structure_EntranceCanopy","Concrete",x,y,3.30,w,canopy,.18)
    for sign in [-1,1]:
        g.box("Structure_EntrancePosts","Steel",x+sign*(w/2-.25),y-canopy/2+.22,.42,.09,.09,2.87)
    for k in range(3):
        g.box("Structure_EntranceSteps","Concrete",x,y-1.3-k*.30,0,w-.5,.30,.15*(3-k))


def apartment(g):
    building(g,-9.7,1.0,18.0,18.0,11,3.05,4.5,True,False)
    building(g,9.6,0,18.0,16.0,10,3.05,4.5,True,True)
    # Narrow recessed link; architectural volumes remain structurally distinct.
    for f in range(11):
        g.box("Structure_LinkSlabs","Concrete",-.05,3,.6+f*3.05,1.28,6,.24)
    for f in range(10):
        window(g,-.05,-.04,.92+f*3.05,1.0,2.52,divisions=1)
    # A sober stack of inset balconies on the complete residential elevation.
    for x in [-14.2,-5.2]:
        for f in range(1,11):
            z=.6+f*3.05
            g.box("Structure_BalconySlabs","Concrete",x,-8.68,z,3.0,1.35,.20)
            g.box("Facade_BalconyGlass","GlassDark",x,-9.30,z+.2,2.90,.05,1.0)
            for s in [-1,1]:
                g.box("Facade_BalconyFrames","Graphite",x+s*1.45,-9.30,z+.2,.04,.055,1.02)
            g.box("Facade_BalconyFrames","Graphite",x,-9.30,z+1.20,2.95,.06,.035)
    entrance(g,-9.7,-9.25)


def school(g):
    # Three educational wings enclose an open court without a landscape diorama.
    building(g,-7.5,7.5,42,12,3,3.75,6.0,True,False,True)
    building(g,-22.5,-10.85,12,23.4,3,3.75,5.8,True,False,True)
    building(g,7.5,-10.85,12,23.4,3,3.75,5.8,True,True,True)
    # Continuous foundation necks support the two small expansion-joint gaps.
    for x in [-22.5,7.5]:
        g.box("Structure_ExpansionJoints","ConcreteCut",x,1.175,.0,11.4,.06,.42)
        for f in range(4):
            g.box("Structure_WingLinkSlabs","Concrete",x,1.175,.6+f*3.75,11.4,.60,.24)
    entrance(g,-7.5,-.15,8.0,2.6)
    # A gym with exposed long-span steel roof trusses distinguishes the school.
    x,y,w,d=25.0,2.0,16.0,25.0
    g.box("Structure_GymFoundation","ConcreteCut",x,y,0,w+.5,d+.5,.42)
    g.box("Structure_GymFloor","Concrete",x,y,.60,w,d,.24)
    for i in range(6):
        yy=y-d/2+i*d/5
        for sign in [-1,1]:
            g.box("Structure_GymColumns","Concrete",x+sign*w/2,yy,.60,.40,.40,8.0)
    for i in range(6):
        # Trusses span the short dimension, at regular longitudinal stations.
        yy=y-d/2+i*d/5
        a=(x-w/2,yy,8.45);b=(x+w/2,yy,8.45)
        g.beam("Structure_RoofTrusses","Steel",a,b,.16,.22)
        g.beam("Structure_RoofTrusses","Steel",(x-w/2,yy,9.75),(x+w/2,yy,9.75),.13,.18)
        for xx in [x-w/2,x+w/2]:
            g.beam("Structure_RoofTrussPosts","Steel",(xx,yy,8.45),(xx,yy,9.75),.08)
        for j in range(6):
            xx=x-w/2+j*w/6
            xx2=xx+w/6
            z1,z2=(8.45,9.75) if j%2==0 else (9.75,8.45)
            g.beam("Structure_RoofTrussDiagonals","Steel",(xx,yy,z1),(xx2,yy,z2),.07)
    for i in range(7):
        xx=x-w/2+i*w/6
        g.beam("Structure_RoofPurlins","Steel",(xx,y-d/2,9.85),(xx,y+d/2,9.85),.09,.12)
    # Only the rear roof half is fitted, exposing the steelwork intentionally.
    g.box("Facade_GymRoof","White",x,y+d/4,9.92,w+.3,d/2,.14)
    for sign in [-1,1]:
        xx=x+sign*w/2
        for j in range(5):
            yy=y-d/2+(j+.5)*d/5
            if sign>0 and j<2:
                continue
            g.box("Facade_GymPanels","White",xx,yy,.84,.20,d/5-.02,2.30)
            window(g,xx+sign*.14,yy,3.18,d/5-.38,4.7,"side",divisions=3)
            g.box("Facade_GymPanels","White",xx,yy,7.96,.20,d/5-.02,.5)
    # A high glazed gable displays the sport-hall scale without decorative cues.
    for i in range(4):
        xx=x-w/2+(i+.5)*w/4
        window(g,xx,y+d/2+.14,.9,w/4-.22,7.2,divisions=2)
    for f in range(2):
        g.box("Structure_GymLink","Concrete",15.2,5,.6+f*3.75,3.25,5,.24)


def hospital(g):
    # A longer diagnostic block and a shorter inpatient wing express the programme.
    building(g,0,6,42,18,6,3.6,5.25,True,True,True)
    building(g,-15,-13.1,12,19.0,4,3.6,4.75,True,False,True)
    # Glazed low entrance/diagnostic wing and a separate structural canopy.
    building(g,5,-11.0,22,13.0,1,4.5,5.5,False,False,True)
    for z in [.6,5.1]:
        g.box("Structure_DiagnosticLink","Concrete",5,-3.75,z,7,1.45,.24)
    entrance(g,5,-18.8,9.0,2.4)
    g.box("Structure_AmbulanceCanopy","Concrete",23.0,-10.0,4.3,10,12,.22)
    for xx in [18.5,27.5]:
        for yy in [-15.4,-4.6]:
            g.box("Structure_AmbulanceColumns","Steel",xx,yy,0,.16,.16,4.3)
            g.box("Structure_ColumnFootings","ConcreteCut",xx,yy,0,.7,.7,.3)
    # A roof-level plant enclosure and risers reinforce the institutional typology.
    z=.6+6*3.6+.29
    g.box("Structure_PlantRoom","Concrete",-12,9,z,5.0,4.0,1.6)
    for i in range(13):
        g.box("Facade_PlantLouvers","Graphite",-14.35+i*.39,6.96,z+.2,.065,.12,1.2)
    g.box("Structure_PlantRoof","Steel",-12,9,z+1.6,5.15,4.15,.1)
    # Accessibility ramp is an actual sloping structural prism, no site decoration.
    g.mesh("Structure_EntranceRamp","Concrete",[(9,-20,0),(17,-20,0),(17,-18.7,0),(9,-18.7,0),
             (9,-20,.58),(17,-20,.10),(17,-18.7,.10),(9,-18.7,.58)],
             [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
    for yy in [-20,-18.7]:
        g.beam("Structure_RampRails","Steel",(9,yy,1.48),(17,yy,1.00),.045)
        for i in range(5):
            xx=9+i*2
            g.box("Structure_RampRails","Steel",xx,yy,.58-i*.12,.035,.035,.90)


def centre_model(objects):
    coords=[Vector(v) for o in objects for v in o.bound_box]
    lo=Vector(tuple(min(p[i] for p in coords) for i in range(3)))
    hi=Vector(tuple(max(p[i] for p in coords) for i in range(3)))
    offset=Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-lo.z))
    for o in objects:
        for v in o.data.vertices:
            v.co += offset
        o.data.update()
    return lo+offset,hi+offset


def aim(obj, target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat("-Z","Y").to_euler()


def render_setup(kind,bounds):
    lo,hi=bounds
    scene=bpy.context.scene
    scene.render.engine="CYCLES"
    scene.cycles.samples=40
    scene.cycles.use_denoising=True
    scene.cycles.max_bounces=5
    scene.cycles.diffuse_bounces=3
    scene.render.resolution_x=1600
    scene.render.resolution_y=1200
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format="JPEG"
    scene.render.image_settings.quality=94
    scene.render.filepath=os.path.join(OUT,kind+".jpg")
    scene.world.use_nodes=True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value=(.87,.88,.89,1)
    scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value=.72
    scene.view_settings.view_transform="AgX"
    scene.view_settings.look="AgX - Medium High Contrast"
    # A plain shadow catcher is for rendering only and never enters the GLB.
    bpy.ops.mesh.primitive_plane_add(size=1200,location=(0,0,-.08))
    backdrop=bpy.context.object
    backdrop.name="Render_Backdrop"
    backdrop.data.materials.append(material("Backdrop","F4F4F1",.93))
    bpy.ops.object.light_add(type="AREA",location=(-35,-48,80))
    key=bpy.context.object
    key.name="Render_KeyLight"
    key.data.energy=95000
    key.data.shape="DISK"
    key.data.size=32
    aim(key,(0,0,10))
    bpy.ops.object.light_add(type="AREA",location=(45,20,50))
    fill=bpy.context.object
    fill.name="Render_FillLight"
    fill.data.energy=40000
    fill.data.size=38
    aim(fill,(0,0,10))
    target=(lo+hi)/2
    bpy.ops.object.camera_add(location=target+Vector((95,-95,95)))
    camera=bpy.context.object
    camera.name="Render_OrthographicAxonometricCamera"
    aim(camera,target)
    camera.data.type="ORTHO"
    camera.data.clip_end=2000
    scene.camera=camera
    bpy.context.view_layer.update()
    inv=camera.matrix_world.inverted()
    projected=[inv@Vector((x,y,z)) for x in [lo.x,hi.x] for y in [lo.y,hi.y] for z in [lo.z,hi.z]]
    spanx=max(p.x for p in projected)-min(p.x for p in projected)
    spany=max(p.y for p in projected)-min(p.y for p in projected)
    camera.data.ortho_scale=max(spanx,spany*4/3)*1.11


def run(kind):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    # Purge unused materials/meshes so repeated exports retain stable names.
    for datablocks in [bpy.data.meshes,bpy.data.materials]:
        for block in list(datablocks):
            if block.users==0:
                datablocks.remove(block)
    g=Geometry()
    globals()[kind](g)
    objects=g.finish()
    bounds=centre_model(objects)
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,kind+".glb"),export_format="GLB",
        use_selection=True,export_yup=True,export_apply=True,export_animations=False,
        export_cameras=False,export_lights=False,export_extras=False,export_texcoords=False,
        export_normals=True)
    render_setup(kind,bounds)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE,kind+".blend"))
    bpy.ops.render.render(write_still=True)
    lo,hi=bounds
    info={"kind":kind,"revision":"engineering-axonometry-2026-09-06",
          "triangles":sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects),
          "mesh_objects":len(objects),"glb_bytes":os.path.getsize(os.path.join(OUT,kind+".glb")),
          "poster_bytes":os.path.getsize(os.path.join(OUT,kind+".jpg")),
          "bounds_y_up":{"min":[lo.x,lo.z,-hi.y],"max":[hi.x,hi.z,-lo.y]},
          "authorship":"Original engineering presentation concept, authored in Blender 5.2.1",
          "not_a_built_project":True,"not_working_documentation":True}
    with open(os.path.join(SOURCE,kind+"-stats.json"),"w") as f:
        json.dump(info,f,ensure_ascii=False,indent=2)
    print("MODEL_COMPLETE "+json.dumps(info),flush=True)


requested=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else ["apartment","school","hospital"]
for kind in requested:
    run(kind)
