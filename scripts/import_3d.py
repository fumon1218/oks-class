#!/usr/bin/env python3
"""3D 모델(GLB) 가볍게 만들기 — Tripo·Meshy 같은 AI 도구가 만든 무거운 GLB(수십 MB)를 웹용으로 줄입니다.
사용: python3 scripts/import_3d.py <입력.glb> <출력 이름> [삼각형 수(기본 60000)] [질감 크기(기본 1024)]
 - 삼각형 줄이기: 가장자리 모양을 지키는 방식(QEM, scripts/simplify.c)으로 줄입니다. (없으면 격자 묶기)
 - 질감: 기본 색 질감만 남기고 JPEG로 줄입니다.
 - 크기: 가운데를 (0,0,0)에 두고, 가장 긴 쪽이 1이 되게 맞춥니다.
 - 결과: art/3d/<이름>.glb (정점 좌표를 16비트로 줄이는 KHR_mesh_quantization 사용)"""
import os, sys, io, json, struct, subprocess, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def read_glb(path):
    b = open(path, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    off = 20 + jl
    bl = struct.unpack('<I', b[off:off + 4])[0]
    binc = b[off + 8: off + 8 + bl]

    def acc(i):
        a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]
        st = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        n = a['count'] * NC[a['type']]
        arr = np.frombuffer(binc, dtype=CT[a['componentType']], count=n, offset=st)
        return arr.reshape(a['count'], NC[a['type']]) if NC[a['type']] > 1 else arr

    def img(i):
        im = j['images'][i]; bv = j['bufferViews'][im['bufferView']]
        return Image.open(io.BytesIO(binc[bv.get('byteOffset', 0): bv.get('byteOffset', 0) + bv['byteLength']]))
    return j, acc, img


def load(path):
    j, acc, img = read_glb(path)
    P, N, U, I = [], [], [], []
    base = 0; tex = None
    for m in j['meshes']:
        for p in m['primitives']:
            a = p['attributes']
            pos = acc(a['POSITION']).astype(np.float64)
            P.append(pos)
            N.append(acc(a['NORMAL']).astype(np.float64) if 'NORMAL' in a else np.zeros_like(pos))
            U.append(acc(a['TEXCOORD_0']).astype(np.float64) if 'TEXCOORD_0' in a else np.zeros((len(pos), 2)))
            ind = acc(p['indices']).astype(np.int64) if 'indices' in p else np.arange(len(pos))
            I.append(ind.reshape(-1, 3) + base); base += len(pos)
            if tex is None and 'material' in p:
                mat = j['materials'][p['material']]
                t = mat.get('pbrMetallicRoughness', {}).get('baseColorTexture')
                if t is not None: tex = img(j['textures'][t['index']]['source'])
    return np.vstack(P), np.vstack(N), np.vstack(U), np.vstack(I), tex


def cluster(P, N, U, I, target):
    """격자 묶기(빠르지만 거칠어요): 위치 격자와 질감 좌표 격자가 같은 정점끼리 합칩니다."""
    lo, hi = P.min(0), P.max(0); diag = np.linalg.norm(hi - lo)
    k = 60
    for _ in range(12):
        cell = diag / k
        key = np.hstack([np.floor((P - lo) / cell), np.floor(U * 256)]).astype(np.int64)
        _, cid = np.unique(key, axis=0, return_inverse=True); cid = cid.ravel()
        T = cid[I]; ok = (T[:, 0] != T[:, 1]) & (T[:, 1] != T[:, 2]) & (T[:, 0] != T[:, 2]); T = T[ok]
        if len(T) <= target * 1.1: break
        k *= 0.8
    n = cid.max() + 1; cnt = np.bincount(cid, minlength=n)[:, None]
    avg = lambda X: np.stack([np.bincount(cid, X[:, c], n) for c in range(X.shape[1])], 1) / cnt
    return avg(P), avg(N), avg(U), T


def qem(P, N, U, I, target):
    """C로 만든 QEM 줄이기 (모양을 가장 잘 지켜요). scripts/simplify.c 를 처음에 한 번 컴파일합니다.
    질감 이음매에서 갈라지지 않게 같은 위치 정점을 하나로 붙이고, 질감 좌표는 삼각형 꼭짓점마다 따로 넘깁니다."""
    src = os.path.join(ROOT, 'scripts/simplify.c'); exe = os.path.join(tempfile.gettempdir(), 'oks_simplify')
    if not os.path.exists(exe) or os.path.getmtime(exe) < os.path.getmtime(src):
        subprocess.check_call(['gcc', '-O3', '-o', exe, src, '-lm'])
    Wp, wid = np.unique(P.astype(np.float32), axis=0, return_inverse=True); wid = wid.ravel()
    TI = wid[I]; CU = U[I].reshape(-1, 6)
    ok = (TI[:, 0] != TI[:, 1]) & (TI[:, 1] != TI[:, 2]) & (TI[:, 0] != TI[:, 2]); TI, CU = TI[ok], CU[ok]
    d = tempfile.mkdtemp(); fi, fo = os.path.join(d, 'in.bin'), os.path.join(d, 'out.bin')
    with open(fi, 'wb') as f:
        f.write(struct.pack('<ii', len(Wp), len(TI)))
        f.write(Wp.astype(np.float32).tobytes()); f.write(TI.astype(np.int32).tobytes()); f.write(CU.astype(np.float32).tobytes())
    subprocess.check_call([exe, fi, fo, str(target), os.environ.get('OKS_DRIFT', '0.6')], stderr=subprocess.DEVNULL)
    b = open(fo, 'rb').read(); nv, nt = struct.unpack('<ii', b[:8]); o = 8
    Pq = np.frombuffer(b, np.float32, nv * 3, o).reshape(nv, 3).astype(np.float64); o += nv * 12
    Tq = np.frombuffer(b, np.int32, nt * 3, o).reshape(nt, 3).astype(np.int64); o += nt * 12
    Uq = np.frombuffer(b, np.float32, nt * 6, o).reshape(nt, 3, 2).astype(np.float64)
    # 부드러운 법선(면 넓이 가중 평균)
    fn = np.cross(Pq[Tq[:, 1]] - Pq[Tq[:, 0]], Pq[Tq[:, 2]] - Pq[Tq[:, 0]])
    Nq = np.zeros_like(Pq)
    for k in range(3): np.add.at(Nq, Tq[:, k], fn)
    # (위치, 질감 좌표)가 같은 꼭짓점끼리 하나의 정점으로
    key = np.hstack([Tq.reshape(-1, 1).astype(np.float64), np.round(Uq.reshape(-1, 2) * 65535)])
    uk, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel()
    vid = uk[:, 0].astype(np.int64)
    return Pq[vid], Nq[vid], uk[:, 1:] / 65535, inv.reshape(-1, 3)


def bleed(im, U, T):
    """질감 조각 사이 빈틈(검은 테두리)을 옆 색으로 채워서, 멀리서 볼 때 검은 점이 생기지 않게."""
    from PIL import ImageDraw
    from scipy import ndimage
    W, H = im.size
    import cv2
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, list(np.round(U[T] * [W, H]).astype(np.int32)), 255)
    m = m > 0
    m = ndimage.binary_dilation(m, iterations=1)
    a = np.array(im)
    _, (iy, ix) = ndimage.distance_transform_edt(~m, return_indices=True)
    return Image.fromarray(a[iy, ix])


def write_glb(path, P, N, U, T, tex_bytes):
    # 크기 맞추기: 가운데 (0,0,0), 가장 긴 쪽 1
    lo, hi = P.min(0), P.max(0); c = (lo + hi) / 2; s = (hi - lo).max()
    P = (P - c) / s
    nl = np.linalg.norm(N, axis=1, keepdims=True); N = N / np.where(nl == 0, 1, nl)
    qP = np.round(P / 0.5 * 32767).astype(np.int16)          # -0.5..0.5 → 정수, 노드 비율로 되돌림
    qN = np.round(N * 127).astype(np.int8)
    qU = np.round(np.clip(U, 0, 1) * 65535).astype(np.uint16)
    idx = T.astype(np.uint16 if len(P) < 65536 else np.uint32)

    def pad(b, fill=b'\0'): return b + fill * ((4 - len(b) % 4) % 4)
    pos_b = b''.join(pad(v.tobytes()) for v in [qP]).__len__()
    chunks, views = [], []
    def add(data, target=None, stride=None):
        off = sum(len(x) for x in chunks); data = pad(data)
        v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
        if target: v['target'] = target
        if stride: v['byteStride'] = stride
        chunks.append(data); views.append(v); return len(views) - 1
    # 정점 속성은 4바이트 정렬을 위해 한 칸씩 채움
    p4 = np.hstack([qP, np.zeros((len(qP), 1), np.int16)])
    n4 = np.hstack([qN, np.zeros((len(qN), 1), np.int8)])
    vP = add(p4.tobytes(), 34962, 8); vN = add(n4.tobytes(), 34962, 4); vU = add(qU.tobytes(), 34962, 4)
    vI = add(idx.tobytes(), 34963); vT = add(tex_bytes)
    q = 0.5 / 32767
    j = {
        'asset': {'version': '2.0', 'generator': 'oks-class import_3d.py'},
        'extensionsUsed': ['KHR_mesh_quantization'], 'extensionsRequired': ['KHR_mesh_quantization'],
        'scene': 0, 'scenes': [{'nodes': [0]}],
        'nodes': [{'mesh': 0, 'scale': [q, q, q]}],
        'meshes': [{'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1, 'TEXCOORD_0': 2}, 'indices': 3, 'material': 0}]}],
        'materials': [{'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': 0, 'roughnessFactor': 0.8}}],
        'textures': [{'source': 0, 'sampler': 0}], 'samplers': [{'magFilter': 9729, 'minFilter': 9987}],
        'images': [{'bufferView': vT, 'mimeType': 'image/jpeg'}],
        'accessors': [
            {'bufferView': vP, 'componentType': 5122, 'count': len(qP), 'type': 'VEC3', 'min': qP.min(0).tolist(), 'max': qP.max(0).tolist()},
            {'bufferView': vN, 'componentType': 5120, 'normalized': True, 'count': len(qN), 'type': 'VEC3'},
            {'bufferView': vU, 'componentType': 5123, 'normalized': True, 'count': len(qU), 'type': 'VEC2'},
            {'bufferView': vI, 'componentType': 5123 if idx.dtype == np.uint16 else 5125, 'count': idx.size, 'type': 'SCALAR'}],
        'bufferViews': views, 'buffers': [{'byteLength': sum(len(x) for x in chunks)}]}
    js = pad(json.dumps(j, separators=(',', ':')).encode(), b' ')
    bn = b''.join(chunks)
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bn)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(bn), 0x004E4942) + bn
    open(path, 'wb').write(out)
    return len(out)


def main(src, name, target=60000, texsize=1024):
    P, N, U, I, tex = load(src)
    print('원본: 정점 %d, 삼각형 %d' % (len(P), len(I)))
    try:
        P2, N2, U2, T2 = qem(P, N, U, I, target)
    except Exception as e:
        print('  QEM 실패 → 격자 묶기로:', e); P2, N2, U2, T2 = cluster(P, N, U, I, target)
    used = np.unique(T2); remap = -np.ones(len(P2), np.int64); remap[used] = np.arange(len(used))
    P2, N2, U2, T2 = P2[used], N2[used], U2[used], remap[T2]
    buf = io.BytesIO()
    im = (tex or Image.new('RGB', (4, 4), 'white')).convert('RGB').resize((texsize, texsize), Image.LANCZOS)
    im = bleed(im, U, I)
    im.save(buf, 'JPEG', quality=82, optimize=True)
    os.makedirs(os.path.join(ROOT, 'art/3d'), exist_ok=True)
    out = os.path.join(ROOT, 'art/3d', name + '.glb')
    size = write_glb(out, P2, N2, U2, T2, buf.getvalue())
    print('결과: 정점 %d, 삼각형 %d, %.2f MB → %s' % (len(P2), len(T2), size / 1e6, out))


if __name__ == '__main__':
    if len(sys.argv) < 3: print(__doc__); sys.exit(1)
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 60000, int(sys.argv[4]) if len(sys.argv) > 4 else 1024)
