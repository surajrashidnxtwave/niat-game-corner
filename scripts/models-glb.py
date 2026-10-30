# Low-poly real-time models for the 3D Brain Gym world, exported as ONE small GLB.
# Each model is a single mesh object (several materials) centred at the origin and about 2 units across.
# Materials named "tier" are recoloured in the browser (gold, silver, bronze, diamond).
# Usage: blender -b --factory-startup -P scripts/models-glb.py -- public/assets/3d/world.glb
import bpy, bmesh, math, sys, os
from mathutils import Vector

OUT = sys.argv[sys.argv.index('--') + 1]
os.makedirs(os.path.dirname(OUT) or '.', exist_ok=True)

INK, VIOLET, PURPLE, PINK = '#141B34', '#5B4BFF', '#9B3BF5', '#FF4D8D'
LIME, GOLD, ORANGE, YELLOW, STEEL, LILAC, TEAL = '#C6F432', '#FFB020', '#FF7A2F', '#FFD84D', '#A3A8BC', '#FF9EC4', '#0F9F8F'

def rgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)

_mats = {}
def mat(hexc, rough=0.45, metal=0.0, name=None, glow=0.0):
    key = name or (hexc, rough, metal, glow)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name or ('m' + hexc.lstrip('#')))
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = rgb(hexc)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if glow:
        p.inputs['Emission Color'].default_value = rgb(hexc)
        p.inputs['Emission Strength'].default_value = glow
    _mats[key] = m
    return m

def add(obj, m, bevel=0.0, smooth=True):
    obj.data.materials.append(m)
    if bevel:
        b = obj.modifiers.new('bevel', 'BEVEL'); b.width = bevel; b.segments = 2; b.limit_method = 'ANGLE'
    for poly in obj.data.polygons:
        poly.use_smooth = smooth == 'all' or (smooth and abs(poly.normal.z) < 0.9)
    return obj

def cyl(r1, r2, depth, loc=(0, 0, 0), rot=(0, 0, 0), verts=16):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    return bpy.context.active_object

def box(size, loc=(0, 0, 0), rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.active_object; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return o

def star_mesh(r_out=1.0, r_in=0.45, depth=0.32, points=5):
    bm = bmesh.new(); vs = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        a = math.pi / 2 + i * math.pi / points
        vs.append(bm.verts.new((r * math.cos(a), -depth / 2, r * math.sin(a))))
    f = bm.faces.new(vs)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    for v in [e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)]:
        v.co.y += depth
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('star'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('star', me); bpy.context.scene.collection.objects.link(o)
    return o

def lathe(height, width, lean, loc, rings=12, segs=14):
    bm = bmesh.new(); grid = []
    for i in range(rings + 1):
        t = i / rings
        r = width * math.sin(math.pi * t ** 0.6) ** 0.85
        cx = lean * (t ** 2.2)
        grid.append([bm.verts.new((cx + r * math.cos(2 * math.pi * k / segs), r * math.sin(2 * math.pi * k / segs), height * t)) for k in range(segs)])
    for i in range(rings):
        for k in range(segs):
            bm.faces.new((grid[i][k], grid[i][(k + 1) % segs], grid[i + 1][(k + 1) % segs], grid[i + 1][k]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('lathe'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('lathe', me); bpy.context.scene.collection.objects.link(o); o.location = loc
    return o

def pack(name, parts):
    """Join the parts into one mesh called `name`, centre it and scale it to about 2 units."""
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
        bpy.context.view_layer.objects.active = p
        for mod in list(p.modifiers):
            bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    bpy.ops.outliner.orphans_purge(do_recursive=True)
    o = bpy.context.active_object
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    lo = Vector((min(v.co[i] for v in o.data.vertices) for i in range(3)))
    hi = Vector((max(v.co[i] for v in o.data.vertices) for i in range(3)))
    c, size = (lo + hi) / 2, max(hi - lo)
    for v in o.data.vertices:
        v.co = (v.co - c) * (2.0 / size)
    o.name = o.data.name = name
    o.location = (0, 0, 0)
    return o

# ---------------- models (front faces -Y, up is +Z) ----------------
def dumbbell():
    p = [add(cyl(0.12, 0.12, 2.9, rot=(0, math.radians(90), 0), verts=12), mat(STEEL, 0.3, 0.7))]
    for x, r, c in [(-1.05, 0.72, PURPLE), (-0.72, 0.55, PINK), (1.05, 0.72, PURPLE), (0.72, 0.55, PINK)]:
        p.append(add(cyl(r, r, 0.28, (x, 0, 0), (0, math.radians(90), 0), 20), mat(c, 0.42), 0.04))
    for x in (-1.32, 1.32):
        p.append(add(cyl(0.2, 0.2, 0.16, (x, 0, 0), (0, math.radians(90), 0), 12), mat(INK, 0.5)))
    return pack('dumbbell', p)

def brain():
    # two smooth hemispheres with fine wrinkles (gyri), a split down the middle, a cerebellum and a stem
    tex = bpy.data.textures.new('folds', 'STUCCI'); tex.noise_scale = 0.13; tex.turbulence = 6
    p = []
    for x in (-0.47, 0.47):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=1, location=(x, 0, 0))
        o = bpy.context.active_object; o.scale = (0.5, 0.92, 0.66)
        bpy.ops.object.transform_apply(scale=True)
        d = o.modifiers.new('folds', 'DISPLACE'); d.texture = tex; d.strength = 0.1; d.mid_level = 0.5
        p.append(add(o, mat(LILAC, 0.55), smooth='all'))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=1, location=(0, 0.62, -0.45))
    o = bpy.context.active_object; o.scale = (0.55, 0.3, 0.26)
    bpy.ops.object.transform_apply(scale=True)
    p.append(add(o, mat('#E97BAE', 0.55), smooth='all'))
    p.append(add(cyl(0.14, 0.1, 0.5, (0, 0.32, -0.72), (math.radians(20), 0, 0), 10), mat(PINK, 0.5), smooth='all'))
    return pack('brain', p)

def trophy():
    g = mat(GOLD, 0.3, 0.6, name='tier')
    p = [add(cyl(0.55, 0.95, 1.15, (0, 0, 1.75), verts=24), g, 0.04), add(cyl(0.3, 0.12, 0.5, (0, 0, 0.95), verts=16), g)]
    p.append(add(box((0.75, 0.55, 0.16), (0, 0, 0.62)), mat(INK, 0.5), 0.05))
    p.append(add(box((0.95, 0.7, 0.2), (0, 0, 0.3)), mat(INK, 0.5), 0.06))
    for x in (-1, 1):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.33, minor_radius=0.08, major_segments=16, minor_segments=8, location=(x * 0.95, 0, 1.9), rotation=(math.radians(90), 0, 0))
        p.append(add(bpy.context.active_object, g, smooth='all'))
    s = add(star_mesh(0.32, 0.14, 0.08), mat(LIME, 0.35), smooth=False)
    s.location = (0, -0.84, 1.78)
    p.append(s)
    return pack('trophy', p)

def medal():
    p = [add(cyl(0.9, 0.9, 0.18, rot=(math.radians(90), 0, 0), verts=28), mat(GOLD, 0.3, 0.6, name='tier'), 0.05)]
    s = add(star_mesh(0.45, 0.2, 0.1), mat(INK, 0.4), smooth=False); s.location = (0, -0.12, 0); p.append(s)
    p.append(add(box((0.22, 0.05, 0.7), (-0.32, 0.05, 1.35), (0, math.radians(-18), 0)), mat(VIOLET, 0.5), smooth=False))
    p.append(add(box((0.22, 0.05, 0.7), (0.32, 0.05, 1.35), (0, math.radians(18), 0)), mat(PINK, 0.5), smooth=False))
    return pack('medal', p)

def star():
    return pack('star', [add(star_mesh(1.0, 0.45, 0.34), mat(GOLD, 0.28, 0.5), 0.05, smooth=False)])

def flame():
    p = [add(lathe(2.4, 0.82, 0.5, (0, 0, 0)), mat(ORANGE, 0.35, glow=0.25), smooth='all'),
         add(lathe(1.45, 0.42, 0.22, (0.08, -0.6, 0.2)), mat(YELLOW, 0.35, glow=0.8), smooth='all')]
    return pack('flame', p)

def bulb():
    bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=10, radius=0.85, location=(0, 0, 0.6))
    p = [add(bpy.context.active_object, mat(YELLOW, 0.2, glow=1.2), smooth='all')]
    p.append(add(cyl(0.42, 0.32, 0.5, (0, 0, -0.35), verts=16), mat(STEEL, 0.3, 0.7)))
    for z in (-0.25, -0.42):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.4, minor_radius=0.05, major_segments=16, minor_segments=6, location=(0, 0, z))
        p.append(add(bpy.context.active_object, mat(INK, 0.5), smooth='all'))
    p.append(add(cyl(0.18, 0.08, 0.16, (0, 0, -0.68), verts=10), mat(INK, 0.5)))
    return pack('bulb', p)

def gear():
    g = mat(VIOLET, 0.4, 0.2)
    p = [add(cyl(0.8, 0.8, 0.36, rot=(math.radians(90), 0, 0), verts=20), g)]
    for i in range(10):
        a = i * 2 * math.pi / 10
        p.append(add(box((0.16, 0.18, 0.17), (math.cos(a) * 0.92, 0, math.sin(a) * 0.92), (0, -a, 0)), g, smooth=False))
    p.append(add(cyl(0.3, 0.3, 0.42, rot=(math.radians(90), 0, 0), verts=12), mat(LIME, 0.4)))
    return pack('gear', p)

def chip():
    p = [add(box((0.8, 0.8, 0.12)), mat(INK, 0.45), 0.03, smooth=False),
         add(box((0.42, 0.42, 0.05), (0, 0, 0.14)), mat(LIME, 0.35, glow=0.3), smooth=False)]
    for i in range(5):
        t = -0.6 + i * 0.3
        for (x, y, sx, sy) in [(t, -0.95, 0.05, 0.16), (t, 0.95, 0.05, 0.16), (-0.95, t, 0.16, 0.05), (0.95, t, 0.16, 0.05)]:
            p.append(add(box((sx, sy, 0.03), (x, y, 0)), mat(STEEL, 0.3, 0.8), smooth=False))
    o = pack('chip', p)
    o.rotation_euler = (math.radians(90), 0, 0)   # stand it up to face the camera
    bpy.ops.object.transform_apply(rotation=True)
    return o

def target():
    p = []
    for r, c, y in [(1.0, PINK, 0.0), (0.72, '#FFFFFF', -0.03), (0.46, PINK, -0.06), (0.2, INK, -0.09)]:
        p.append(add(cyl(r, r, 0.14, (0, y, 0), (math.radians(90), 0, 0), 24), mat(c, 0.45)))
    p.append(add(cyl(0.05, 0.05, 1.1, (0.3, -0.5, 0.3), (math.radians(60), 0, math.radians(30)), 8), mat(LIME, 0.4)))
    return pack('target', p)

bpy.ops.wm.read_factory_settings(use_empty=True)
for fn in [dumbbell, brain, trophy, medal, star, flame, bulb, gear, chip, target]:
    o = fn()
    print('built', o.name, len(o.data.polygons), 'faces')

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True,
                          export_texcoords=False, export_yup=True, export_cameras=False, export_lights=False)
print('exported', OUT, os.path.getsize(OUT), 'bytes')
