import sys,json,struct,numpy as np
import os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import _glbinfo as g
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
def read(p):
    """-> list of dict(pos,nrm,idx,mat) world space"""
    j,b=g.load(p);out=[]
    def rec(i,M):
        n=j['nodes'][i];M2=M@g.mat(n)
        if 'mesh' in n:
            for pr in j['meshes'][n['mesh']]['primitives']:
                pos=g.acc(j,b,pr['attributes']['POSITION']).astype(float)
                nr=g.acc(j,b,pr['attributes']['NORMAL']).astype(float) if 'NORMAL' in pr['attributes'] else None
                idx=g.acc(j,b,pr['indices'])[:,0].astype(np.int64) if 'indices' in pr else np.arange(len(pos))
                A=M2[:3,:3];P=(A@pos.T).T+M2[:3,3]
                N=None
                if nr is not None:
                    N=(np.linalg.inv(A).T@nr.T).T;N/=np.linalg.norm(N,axis=1,keepdims=True)+1e-12
                out.append(dict(pos=P,nrm=N,idx=idx.reshape(-1,3),mat=j['materials'][pr['material']] if 'material' in pr else {}))
        for c in n.get('children',[]): rec(c,M2)
    for s in j['scenes'][j.get('scene',0)]['nodes']: rec(s,np.eye(4))
    return out
def rotm(rx=0,ry=0,rz=0):
    cx,sx=np.cos(rx),np.sin(rx);cy,sy=np.cos(ry),np.sin(ry);cz,sz=np.cos(rz),np.sin(rz)
    X=np.array([[1,0,0],[0,cx,-sx],[0,sx,cx]]);Y=np.array([[cy,0,sy],[0,1,0],[-sy,0,cy]]);Z=np.array([[cz,-sz,0],[sz,cz,0],[0,0,1]])
    return Y@X@Z
def xform(prims,R=np.eye(3),s=1.0):
    for p in prims:
        p['pos']=(R@p['pos'].T).T*s
        if p['nrm'] is not None: p['nrm']=(R@p['nrm'].T).T
def bbox(prims):
    mn=np.min([p['pos'].min(0) for p in prims],0);mx=np.max([p['pos'].max(0) for p in prims],0);return mn,mx
def comps(p):
    t=p['idx'];n=len(p['pos'])
    r=np.concatenate([t[:,0],t[:,1]]);c=np.concatenate([t[:,1],t[:,2]])
    m=coo_matrix((np.ones(len(r)),(r,c)),shape=(n,n));k,lab=connected_components(m,directed=False);return k,lab
def subset(p,keep_tri):
    t=p['idx'][keep_tri];u,inv=np.unique(t,return_inverse=True)
    return dict(pos=p['pos'][u],nrm=None if p['nrm'] is None else p['nrm'][u],idx=inv.reshape(-1,3),mat=p['mat'])
def write(path,meshes,nodes,roots):
    """meshes: list of list-of-prims. nodes: list of dict(name,mesh,children,translation,rotation,scale). roots: node indices."""
    bin_=bytearray();bvs=[];accs=[];mats=[];mp=[];matmap={}
    def add(arr,tgt):
        nonlocal bin_
        while len(bin_)%4:bin_.append(0)
        off=len(bin_);bin_+=arr.tobytes();bvs.append(dict(buffer=0,byteOffset=off,byteLength=arr.nbytes,target=tgt));return len(bvs)-1
    for mi,prims in enumerate(meshes):
        pl=[]
        for p in prims:
            pos=p['pos'].astype(np.float32);idx=p['idx'].astype(np.uint32).reshape(-1)
            a=dict(attributes={})
            bv=add(pos,34962);accs.append(dict(bufferView=bv,componentType=5126,count=len(pos),type='VEC3',min=pos.min(0).tolist(),max=pos.max(0).tolist()));a['attributes']['POSITION']=len(accs)-1
            if p['nrm'] is not None:
                bv=add(p['nrm'].astype(np.float32),34962);accs.append(dict(bufferView=bv,componentType=5126,count=len(pos),type='VEC3'));a['attributes']['NORMAL']=len(accs)-1
            bv=add(idx,34963);accs.append(dict(bufferView=bv,componentType=5125,count=len(idx),type='SCALAR'));a['indices']=len(accs)-1
            key=json.dumps(p['mat'],sort_keys=True)
            if key not in matmap: matmap[key]=len(mats);mats.append(p['mat'])
            a['material']=matmap[key];pl.append(a)
        mp.append(dict(name='m%d'%mi,primitives=pl))
    gl=dict(asset=dict(version='2.0',generator='oks-build-cars'),scene=0,scenes=[dict(nodes=roots)],nodes=nodes,meshes=mp,materials=mats,accessors=accs,bufferViews=bvs,buffers=[dict(byteLength=len(bin_))])
    js=json.dumps(gl,separators=(',',':')).encode();js+=b' '*((4-len(js)%4)%4)
    while len(bin_)%4:bin_.append(0)
    with open(path,'wb') as f:
        f.write(struct.pack('<III',0x46546C67,2,12+8+len(js)+8+len(bin_)));f.write(struct.pack('<II',len(js),0x4E4F534A));f.write(js);f.write(struct.pack('<II',len(bin_),0x004E4942));f.write(bin_)
