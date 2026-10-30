# Minimal "soft clay" 3D models for Brain Gym, rendered headless to transparent WebP.
# Usage: blender -b -P models3d.py -- <out_dir> [name ...]
import bpy, bmesh, math, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
ONLY = set(argv[1:])
os.makedirs(OUT, exist_ok=True)

INK, VIOLET, PURPLE, PINK = '#141B34', '#5B4BFF', '#9B3BF5', '#FF4D8D'
LIME, GOLD, ORANGE, YELLOW, STEEL, LILAC = '#C6F432', '#FFB020', '#FF7A2F', '#FFD84D', '#A3A8BC', '#FF9EC4'

def rgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)

_mats = {}
def mat(hexc, rough=0.45, metal=0.0, coat=0.25):
    key = (hexc, rough, metal, coat)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new('m' + hexc)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = rgb(hexc)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if 'Coat Weight' in p.inputs:
        p.inputs['Coat Weight'].default_value = coat
        p.inputs['Coat Roughness'].default_value = 0.2
    _mats[key] = m
    return m

def finish(obj, m, bevel=0.06, seg=5, smooth=True):
    obj.data.materials.append(m)
    if bevel:
        b = obj.modifiers.new('bevel', 'BEVEL')
        b.width = bevel
        b.segments = seg
        b.limit_method = 'ANGLE'
    if smooth and obj.type == 'MESH':
        # smooth curved sides only; flat end caps stay flat (smoothing an n-gon cap leaves a dark crescent)
        for poly in obj.data.polygons:
            poly.use_smooth = smooth == 'all' or abs(poly.normal.z) < 0.9
    return obj

def cyl(r1, r2, depth, loc=(0, 0, 0), rot=(0, 0, 0), verts=64):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    return bpy.context.active_object

def box(size, loc=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.active_object
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return o

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    s.cycles.device = 'CPU'
    s.cycles.samples = 64
    s.cycles.use_denoising = True
    s.render.film_transparent = True
    s.render.resolution_x = s.render.resolution_y = 512
    s.render.image_settings.file_format = 'WEBP'
    s.render.image_settings.color_mode = 'RGBA'
    s.render.image_settings.quality = 88
    s.view_settings.view_transform = 'Standard'   # keep brand colours exact (AgX/Filmic wash them out at small sizes)
    w = bpy.data.worlds.new('w'); s.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.75, 0.74, 0.85, 1); bg.inputs['Strength'].default_value = 0.55
    # soft key, fill and rim
    for name, loc, power, size in [('key', (-3.5, -4, 6), 900, 5), ('fill', (5, -3, 2.5), 300, 6), ('rim', (0, 5, 4), 500, 4)]:
        d = bpy.data.lights.new(name, 'AREA'); d.energy = power; d.size = size
        o = bpy.data.objects.new(name, d); s.collection.objects.link(o); o.location = loc
        o.rotation_euler = (Vector((0, 0, 0.8)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    # no floor: a baked shadow gets cropped at the image edge; the page adds a CSS drop-shadow instead

def camera(target=(0, 0, 0.9), dist=6.2, elev=22, azim=-28, lens=55):
    s = bpy.context.scene
    c = bpy.data.cameras.new('cam'); c.lens = lens
    o = bpy.data.objects.new('cam', c); s.collection.objects.link(o); s.camera = o
    e, a = math.radians(elev), math.radians(azim)
    t = Vector(target)
    o.location = t + Vector((dist * math.cos(e) * math.sin(a), -dist * math.cos(e) * math.cos(a), dist * math.sin(e)))
    o.rotation_euler = (t - o.location).to_track_quat('-Z', 'Y').to_euler()

def star_mesh(r_out=1.0, r_in=0.45, depth=0.32, points=5):
    bm = bmesh.new()
    vs = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        ang = math.pi / 2 + i * math.pi / points
        vs.append(bm.verts.new((r * math.cos(ang), 0, r * math.sin(ang))))
    f = bm.faces.new(vs)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    for v in [e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)]:
        v.co.y += depth
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('star'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('star', me); bpy.context.scene.collection.objects.link(o)
    for v in me.vertices:
        v.co.y -= depth / 2
    return o

def render(name):
    bpy.context.scene.render.filepath = os.path.join(OUT, name + '.webp')
    bpy.ops.render.render(write_still=True)
    print('rendered', name)

# ---------------- models ----------------
def trophy():
    reset(); g = mat(GOLD, 0.3, 0.55)
    cup = finish(cyl(0.55, 0.95, 1.15, (0, 0, 1.75)), g, 0.05)
    finish(cyl(0.3, 0.12, 0.5, (0, 0, 0.95)), g, 0.03)
    finish(box((0.75, 0.55, 0.16), (0, 0, 0.62)), mat(INK, 0.5), 0.07)
    finish(box((0.95, 0.7, 0.2), (0, 0, 0.3)), mat(INK, 0.5), 0.08)
    for x in (-1, 1):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.33, minor_radius=0.08, location=(x * 0.95, 0, 1.9), rotation=(math.radians(90), 0, 0))
        finish(bpy.context.active_object, g, 0)
    s = finish(star_mesh(0.32, 0.14, 0.08), mat(LIME, 0.35), 0.02)
    s.location = (0, -0.82, 1.78); s.rotation_euler = (math.radians(-8), 0, 0)
    camera((0, 0, 1.2), 6.4)
    render('trophy')

def star():
    reset()
    s = finish(star_mesh(1.25, 0.56, 0.42), mat(GOLD, 0.28, 0.5), 0.09, 6)
    s.location = (0, 0, 1.45); s.rotation_euler = (0, 0, math.radians(14))
    for i, (x, z, r) in enumerate([(-1.35, 2.35, 0.13), (1.4, 0.75, 0.1), (1.15, 2.55, 0.08)]):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=(x, -0.2, z))
        finish(bpy.context.active_object, mat([PINK, VIOLET, LIME][i], 0.4), 0)
    camera((0, 0, 1.45), 6.2, 12, -18)
    render('star')

def chest():
    reset(); body = mat(PURPLE, 0.45)
    finish(box((1.15, 0.75, 0.55), (0, 0, 0.6)), body, 0.12)
    lid = finish(cyl(0.75, 0.75, 2.38, (0, 0, 1.15), (0, math.radians(90), 0)), mat(VIOLET, 0.45), 0.04)
    bpy.ops.object.select_all(action='DESELECT')
    finish(box((0.17, 0.8, 0.6), (-0.7, 0, 0.62)), mat(LIME, 0.4), 0.04)
    finish(box((0.17, 0.8, 0.6), (0.7, 0, 0.62)), mat(LIME, 0.4), 0.04)
    finish(box((0.24, 0.12, 0.3), (0, -0.82, 1.0)), mat(GOLD, 0.3, 0.6), 0.05)
    # lid trims, cut to the top half by placing them above the box
    for x in (-0.7, 0.7):
        finish(cyl(0.79, 0.79, 0.34, (x, 0, 1.15), (0, math.radians(90), 0)), mat(LIME, 0.4), 0.03)
    camera((0, 0, 0.95), 6.6, 24, -32)
    render('chest')

def dumbbell():
    reset()
    finish(cyl(0.12, 0.12, 2.9, (0, 0, 1.0), (0, math.radians(90), 0)), mat(STEEL, 0.3, 0.7), 0.02)
    for x, r, c in [(-1.05, 0.72, PURPLE), (-0.72, 0.55, PINK), (1.05, 0.72, PURPLE), (0.72, 0.55, PINK)]:
        finish(cyl(r, r, 0.28, (x, 0, 1.0), (0, math.radians(90), 0)), mat(c, 0.42), 0.08)
    for x in (-1.32, 1.32):
        finish(cyl(0.2, 0.2, 0.16, (x, 0, 1.0), (0, math.radians(90), 0)), mat(INK, 0.5), 0.04)
    camera((0, 0, 0.95), 6.0, 20, -30)
    render('dumbbell')

def flame():
    reset()
    def gradient_mat(name, bottom, top, height, glow=0.0):
        m = bpy.data.materials.new(name); m.use_nodes = True
        nt = m.node_tree; p = nt.nodes.get('Principled BSDF')
        tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
        mr = nt.nodes.new('ShaderNodeMapRange'); ramp = nt.nodes.new('ShaderNodeValToRGB')
        mr.inputs['From Min'].default_value = 0.0; mr.inputs['From Max'].default_value = height
        ramp.color_ramp.elements[0].color = rgb(bottom); ramp.color_ramp.elements[1].color = rgb(top)
        ramp.color_ramp.elements[0].position = 0.25
        nt.links.new(tc.outputs['Object'], sep.inputs['Vector']); nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
        nt.links.new(mr.outputs['Result'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], p.inputs['Base Color'])
        p.inputs['Roughness'].default_value = 0.35
        if 'Coat Weight' in p.inputs: p.inputs['Coat Weight'].default_value = 0.45
        if glow:
            nt.links.new(ramp.outputs['Color'], p.inputs['Emission Color']); p.inputs['Emission Strength'].default_value = glow
        return m
    def lathe(height, width, lean, loc, m):
        # surface of revolution: round base, bulge low, pointed tip that curls to one side
        bm = bmesh.new(); rings, segs = 48, 48; grid = []
        for i in range(rings + 1):
            t = i / rings
            r = width * math.sin(math.pi * t ** 0.6) ** 0.85
            cx = lean * (t ** 2.2)
            ring = [bm.verts.new((cx + r * math.cos(2 * math.pi * k / segs), r * math.sin(2 * math.pi * k / segs), height * t)) for k in range(segs)]
            grid.append(ring)
        for i in range(rings):
            for k in range(segs):
                bm.faces.new((grid[i][k], grid[i][(k + 1) % segs], grid[i + 1][(k + 1) % segs], grid[i + 1][k]))
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        me = bpy.data.meshes.new('flame'); bm.to_mesh(me); bm.free()
        o = bpy.data.objects.new('flame', me); bpy.context.scene.collection.objects.link(o); o.location = loc
        finish(o, m, 0, smooth='all')
        return o
    lathe(2.4, 0.82, 0.5, (0, 0, 0.1), gradient_mat('outer', ORANGE, PINK, 2.4))
    lathe(1.45, 0.42, 0.22, (0.08, -0.62, 0.3), gradient_mat('inner', YELLOW, '#FFB547', 1.45, glow=0.5))
    camera((0.1, 0, 1.25), 6.0, 14, -16)
    render('flame')

for name, fn in [('trophy', trophy), ('star', star), ('chest', chest), ('dumbbell', dumbbell), ('flame', flame)]:
    if not ONLY or name in ONLY:
        fn()
