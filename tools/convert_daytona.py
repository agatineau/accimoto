"""Daytona 675 SE : STL fusionné -> GLB en blocs « pièces détachées ».

v3 : les frontières de blocs sont NETTOYÉES sur la topologie du maillage
(votes majoritaires entre faces adjacentes + suppression des îlots) pour
que chaque bloc ressemble à une vraie pièce présentable. Le moteur est
séparé du cadre pour être mis en valeur au centre de l'éclaté.
"""
import numpy as np
import scipy.sparse as sp
from scipy.sparse.csgraph import connected_components
import trimesh
import fast_simplification
from trimesh.visual.material import PBRMaterial

SRC = "/private/tmp/claude-501/-Users-agatineau-accimoto/39be80c8-37c1-4c36-9422-a8968b1e42cf/scratchpad/daytona-src/Triumph Daytona 675 SE - 2-0-r.stl"
OUT = "/Users/agatineau/accimoto/models/daytona.glb"
WHEEL_R = 0.308
DECIM = 0.30

print("chargement…")
m = trimesh.load(SRC, force="mesh")
m.apply_transform(trimesh.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0]))
m.apply_scale(0.01)
b = m.bounds
m.apply_translation([-(b[0][0] + b[1][0]) / 2, -b[0][1], -(b[0][2] + b[1][2]) / 2])

C = m.triangles_center
x, y, z = C[:, 0], C[:, 1], C[:, 2]
az = np.abs(z)
n = len(m.faces)
areas = m.area_faces

# --- axes roues / fourche -----------------------------------------------
ground = C[y < 0.03]
xs = np.sort(ground[:, 0])
gap = np.argmax(np.diff(xs))
ax_a, ax_b = xs[: gap + 1].mean(), xs[gap + 1 :].mean()
h_a = y[np.abs(x - ax_a) < 0.4].max()
h_b = y[np.abs(x - ax_b) < 0.4].max()
ax_f, ax_r = (ax_a, ax_b) if h_a > h_b else (ax_b, ax_a)
r_f = np.hypot(x - ax_f, y - WHEEL_R)
r_r = np.hypot(x - ax_r, y - WHEEL_R)
rear_sign = np.sign(ax_r - ax_f)
d = np.array([np.sin(np.radians(24.0)) * rear_sign, np.cos(np.radians(24.0))])
rel = np.stack([x - ax_f, y - WHEEL_R], axis=1)
t = rel @ d
perp = rel - np.outer(t, d)
dist_fork = np.hypot(perp[:, 0], perp[:, 1])
print(f"axes: avant {ax_f:.3f}, arrière {ax_r:.3f}")

# --- adjacence des faces ---------------------------------------------------
adj = m.face_adjacency
rows = np.concatenate([adj[:, 0], adj[:, 1]])
cols = np.concatenate([adj[:, 1], adj[:, 0]])
A = sp.csr_matrix((np.ones(len(rows), np.float32), (rows, cols)), shape=(n, n))


def assign(defs):
    """Assigne un label par face, par ordre de priorité."""
    labels = np.full(n, len(defs) - 1, dtype=np.int32)   # défaut = dernier
    claimed = np.zeros(n, bool)
    for i, (_, mask) in enumerate(defs[:-1]):
        mask = mask & ~claimed
        labels[mask] = i
        claimed |= mask
    return labels


def smooth_labels(labels, L, iters=5):
    """Vote majoritaire entre faces adjacentes (dé-déchiquette les frontières)."""
    for _ in range(iters):
        H = sp.csr_matrix((np.ones(n, np.float32), (np.arange(n), labels)), shape=(n, L))
        votes = (A @ H).toarray()
        own = votes[np.arange(n), labels]
        best = votes.argmax(1)
        bestv = votes[np.arange(n), best]
        flip = (bestv >= 2) & (own <= 1) & (best != labels)
        if not flip.any():
            break
        labels[flip] = best[flip]
    return labels


def kill_islands(labels, L, min_area):
    """Réassigne les petits fragments isolés au bloc voisin dominant."""
    for i in range(L):
        idx = np.nonzero(labels == i)[0]
        if len(idx) == 0:
            continue
        sub = A[idx][:, idx]
        ncomp, comp = connected_components(sub, directed=False)
        if ncomp <= 1:
            continue
        for cid in range(ncomp):
            faces = idx[comp == cid]
            if areas[faces].sum() >= min_area:
                continue
            neigh = np.unique(A[faces].nonzero()[1])
            neigh = neigh[~np.isin(neigh, faces)]
            if len(neigh):
                labels[faces] = np.bincount(labels[neigh], minlength=L).argmax()
    return labels


# --- BLOCS « catalogue » (ordre = priorité, dernier = reste) -----------------
side = ((az > 0.148) | (y < 0.28)) & (y < 0.66) & (x > ax_f + 0.2) & (x < 0.45)
# silhouette réelle du moteur : carters larges en bas (couvercle d'embrayage),
# bloc-cylindres incliné vers l'avant au sommet, étroit en haut (épargne le cadre)
eng_top = 0.63 - 0.45 * np.clip(x, 0, None)
engine_box = (x > -0.33) & (x < 0.31) & (y > 0.19) & (
    ((y < 0.47) & (az < 0.19)) | ((y >= 0.47) & (y < eng_top) & (az < 0.115))
)
# garde-boue avant (coquille au-dessus du pneu, hors fourche) : SUPPRIMÉ du modèle
fender = (r_f > 0.35) & (r_f < 0.47) & (az < 0.14) & (y > 0.30) & (x < ax_f + 0.28) & (dist_fork > 0.08)
disc_f = (r_f > 0.07) & (r_f < 0.175) & (az > 0.038) & (az < 0.078)
disc_r = (r_r > 0.07) & (r_r < 0.15) & (az > 0.028) & (az < 0.09) & (z > 0)
radiator = (x > -0.44) & (x < -0.30) & (y > 0.33) & (y < 0.68) & (az < 0.18)
# NB : sur ce scan, le silencieux sous la selle est fusionné à la coque
# arrière (un seul volume) — il reste donc solidaire du bloc selle/coque.
handlebar = (y > 0.82) & (y < 0.98) & (x > -0.55) & (x < -0.25) & (az > 0.10) & (az < 0.40)

BLOCK_DEFS = [
    ("Disque de frein avant droit", disc_f & (z > 0)),
    ("Disque de frein avant gauche", disc_f & (z <= 0)),
    ("Disque de frein arrière", disc_r),
    ("Roue avant", (r_f < 0.36) & (az < 0.075)),
    ("Roue arrière", (r_r < 0.36) & (az < 0.098)),
    ("Fourche", (dist_fork < 0.075) & (y < 0.92) & (az < 0.15)),
    ("Guidon", handlebar),
    ("Radiateur", radiator),
    ("Carénage avant & optiques", ((x < ax_f + 0.24) & (y > 0.50)) | ((x >= ax_f + 0.24) & (x < -0.23) & (y > 0.64))),
    ("Réservoir", (x >= -0.23) & (x < 0.20) & (y > 0.62)),
    ("Selle, coque & échappement", (x >= 0.20) & (y > 0.55)),
    ("Bras oscillant & chaîne", (x > 0.12) & (x < ax_r + 0.15) & (y < 0.55) & (az < 0.20)),
    ("Flanc de carénage droit", side & (z >= 0)),
    ("Flanc de carénage gauche", side & (z < 0)),
    ("Bloc moteur & boîte", engine_box),
    ("Cadre & périphériques", None),          # reste
]
BLOCK_NAMES = [nm for nm, _ in BLOCK_DEFS]
LB = len(BLOCK_DEFS)

block_labels = assign([(nm, mk) for nm, mk in BLOCK_DEFS])
block_labels = smooth_labels(block_labels, LB, iters=6)
block_labels = kill_islands(block_labels, LB, min_area=0.0015)   # < 15 cm² -> absorbé
block_labels = smooth_labels(block_labels, LB, iters=3)

# --- « faire disparaître » les petits éléments orphelins ----------------------
# Dans le bloc résiduel (cadre & périphériques), les fragments isolés de
# moins de 30 cm² (pattes, câbles coupés, visserie orpheline) sont SUPPRIMÉS
# du modèle pour des blocs aux limites propres.
deleted = np.zeros(n, bool)
# support de plaque + catadioptre : supprimés pour une silhouette propre
hanger = (x > 0.88) & (y > 0.28) & (y < 0.72) & (az < 0.12) & (r_r > 0.345)
deleted |= hanger
# garde-boue avant : supprimé (demande client)
deleted |= fender
res = LB - 1
idx = np.nonzero(block_labels == res)[0]
if len(idx):
    subA = A[idx][:, idx]
    ncomp, comp = connected_components(subA, directed=False)
    removed = 0
    for cid in range(ncomp):
        faces = idx[comp == cid]
        a = areas[faces].sum()
        if a < 0.0030:
            deleted[faces] = True
            removed += 1
    print(f"petits éléments supprimés du cadre : {removed} fragments "
          f"({areas[deleted].sum()*1e4:.0f} cm²)")

# --- MATÉRIAUX ---------------------------------------------------------------
MAT_DEFS = [
    ("acier", disc_f | ((r_r > 0.07) & (r_r < 0.15) & (az > 0.028) & (az < 0.09))),
    ("or", ((r_f < 0.218) & (az < 0.055))
         | ((r_r < 0.218) & (az < 0.055))
         | ((dist_fork < 0.05) & (y > 0.42) & (y < 0.82) & (az < 0.13))),
    ("gomme", ((r_f >= 0.218) & (r_f < 0.345) & (az < 0.09))
            | ((r_r >= 0.218) & (r_r < 0.345) & (az < 0.11))),
    ("alu", engine_box),
    ("noir", None),
]
MAT_NAMES = [nm for nm, _ in MAT_DEFS]
LM = len(MAT_DEFS)
mat_labels = assign([(nm, mk) for nm, mk in MAT_DEFS])
mat_labels = smooth_labels(mat_labels, LM, iters=4)
mat_labels = kill_islands(mat_labels, LM, min_area=0.0006)

# verrou : jamais d'or sur les pneus (au-delà du rebord de jante -> gomme)
tire_zone = (((r_f >= 0.222) & (r_f < 0.36)) | ((r_r >= 0.222) & (r_r < 0.36))) & (az < 0.12)
gold_i = MAT_NAMES.index("or")
gomme_i = MAT_NAMES.index("gomme")
mat_labels[tire_zone & (mat_labels == gold_i)] = gomme_i

MATS = {
    "noir": PBRMaterial(baseColorFactor=[10, 10, 12, 255], metallicFactor=0.45, roughnessFactor=0.28, name="noir"),
    "or": PBRMaterial(baseColorFactor=[201, 158, 58, 255], metallicFactor=1.0, roughnessFactor=0.34, name="or"),
    "acier": PBRMaterial(baseColorFactor=[168, 172, 178, 255], metallicFactor=1.0, roughnessFactor=0.3, name="acier"),
    "alu": PBRMaterial(baseColorFactor=[120, 123, 128, 255], metallicFactor=0.95, roughnessFactor=0.5, name="alu"),
    "gomme": PBRMaterial(baseColorFactor=[16, 16, 18, 255], metallicFactor=0.0, roughnessFactor=0.92, name="gomme"),
}


def flux(mesh):
    c = mesh.triangles_center - mesh.centroid
    dd = np.einsum("ij,ij->i", mesh.face_normals, c)
    return float((dd * mesh.area_faces).sum())


scene = trimesh.Scene()
total = 0
for bi, bname in enumerate(BLOCK_NAMES):
    nb = 0
    for mi, matname in enumerate(MAT_NAMES):
        mask = (block_labels == bi) & (mat_labels == mi) & ~deleted
        cnt = int(mask.sum())
        if cnt < 40:
            continue
        sub = m.submesh([np.nonzero(mask)[0]], append=True)
        ratio = 0.65 if bname.startswith("Bloc moteur") else DECIM   # moteur plus fin
        target = max(1500, int(cnt * ratio))
        if len(sub.faces) > target:
            f0 = flux(sub)
            v, f = fast_simplification.simplify(
                sub.vertices.astype(np.float32), sub.faces.astype(np.int64),
                target_count=target,
            )
            dec = trimesh.Trimesh(vertices=v, faces=f, process=False)
            if flux(dec) * f0 < 0:
                dec.invert()
            sub = dec
        sub.visual = trimesh.visual.TextureVisuals(material=MATS[matname])
        name = f"{bname} | {matname}"
        scene.add_geometry(sub, node_name=name, geom_name=name)
        nb += len(sub.faces)
    total += nb
    print(f"  {bname}: {nb:,} faces")

scene.export(OUT, include_normals=True)
import os
print(f"total {total:,} faces — écrit {OUT} ({os.path.getsize(OUT)/1048576:.1f} Mo)")
