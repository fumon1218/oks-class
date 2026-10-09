#!/usr/bin/env python3
"""업로드된 GLB 부품 → 레이싱 게임용 차체/휠 GLB 로 정리.  사용법: python3 scripts/build-cars.py <원본GLB폴더> [출력폴더]
 - 차체: 방향(앞=+z)·크기(미터)·바닥(y=0) 맞춤, 바닥에 놓인 설명 글씨 제거, 바퀴가 붙어 있으면 4개로 떼어 'wh{k}_s/wh{k}_r' 노드로 저장
 - 휠: 지름 2(반지름 1), 축=x, 바깥쪽 면=+x. 림만 있는 파일은 고무 타이어를 만들어 감싸요(재질은 색 값만 사용)."""
import sys,os,json,math,numpy as np
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from _gl import *
SRC=sys.argv[1];OUT=sys.argv[2] if len(sys.argv)>2 else os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','playground','racing','assets')
def tri_centroids(p): return p['pos'][p['idx']].mean(1)
def sub_tris(p,m): return subset(p,m) if m.any() else None
def vnormals(pos,idx):
    fn=np.cross(pos[idx[:,1]]-pos[idx[:,0]],pos[idx[:,2]]-pos[idx[:,0]]);n=np.zeros_like(pos)
    for k in range(3): np.add.at(n,idx[:,k],fn)
    return n/(np.linalg.norm(n,axis=1,keepdims=True)+1e-12)
def decimate(p,h):
    """정점 격자 합치기(vertex clustering)로 삼각형 수 줄이기. h = 격자 한 칸 크기"""
    q=np.floor(p['pos']/h).astype(np.int64);q-=q.min(0);m=q.max(0)+1;key=(q[:,0]*m[1]+q[:,1])*m[2]+q[:,2]
    u,inv=np.unique(key,return_inverse=True);n=len(u)
    P=np.zeros((n,3));c=np.zeros(n);np.add.at(P,inv,p['pos']);np.add.at(c,inv,1);P/=c[:,None]
    t=inv[p['idx']];ok=(t[:,0]!=t[:,1])&(t[:,1]!=t[:,2])&(t[:,0]!=t[:,2]);t=t[ok]
    used,inv2=np.unique(t,return_inverse=True);t=inv2.reshape(-1,3);P=P[used]
    return dict(pos=P,nrm=vnormals(P,t),idx=t,mat=p['mat'])
def flatmat(m,name=None):
    pb=m.get('pbrMetallicRoughness',{});o=dict(baseColorFactor=pb.get('baseColorFactor',[1,1,1,1]),metallicFactor=pb.get('metallicFactor',0.0),roughnessFactor=pb.get('roughnessFactor',0.5))
    d=dict(name=m.get('name',name or 'm'),pbrMetallicRoughness=o,doubleSided=True)
    if m.get('alphaMode'): d['alphaMode']=m['alphaMode']
    return d
def finalize(prims):
    for p in prims:
        p['mat']=flatmat(p['mat'])
        p['nrm']=vnormals(p['pos'],p['idx']) if p['nrm'] is None else p['nrm']
def cleanup_body(prims,cutx=None,ry=0,scale=1.0):
    xform(prims,rotm(ry=ry),scale)
    return prims
def auto_wheels(p,D0,xlim):
    """바닥에 닿은 큰 조각(타이어)으로 바퀴 4개 위치 찾기 -> [(cx0,cx1,cy,cz,R)]"""
    k,lab=comps(p);ymin=p['pos'][:,1].min();rows=[]
    for c in range(k):
        m=lab==c;P=p['pos'][m]
        if m.sum()<20 or P[:,1].min()>ymin+0.15*D0 or P[:,0].max()>xlim: continue
        if P[:,1].max()-P[:,1].min()<D0*0.8: continue
        rows.append((P.min(0),P.max(0)))
    groups={}
    for mn,mx in rows:
        key=(1 if (mn[0]+mx[0])>np.median([r[0][0]+r[1][0] for r in rows]) else -1, round(((mn[2]+mx[2])/2)/(D0*0.7)))
        groups.setdefault(key,[]).append((mn,mx))
    out=[]
    for key,g in groups.items():
        mn=np.min([a for a,b in g],0);mx=np.max([b for a,b in g],0)
        out.append(dict(x0=mn[0],x1=mx[0],cy=(mn[1]+mx[1])/2,cz=(mn[2]+mx[2])/2,R=(mx[1]-mn[1])/2))
    return out
def build_baked(name,src,ry,scale,cutx,D0,xlim):
    prims=read(os.path.join(SRC,src));xform(prims,rotm(ry=ry),1.0)
    # 글씨 제거(바닥에 놓인 설명문)
    for i,p in enumerate(prims):
        if i: continue
        c=tri_centroids(p);k,lab=comps(p);flat=np.zeros(k,bool)
        for cc in range(k):
            P=p['pos'][lab==cc]
            if P[:,1].max()-P[:,1].min()<0.02 and P[:,1].max()<0.15: flat[cc]=True
        fl=flat[lab[p['idx'][:,0]]];prims[i]=subset(p,~(c[:,0]>cutx)&~fl)
    wh=auto_wheels(prims[0],D0,xlim)
    assert len(wh)==4,(name,len(wh))
    wh.sort(key=lambda w:(-w['cz'],w['x0']))
    # 바퀴 삼각형 분리
    body=[];wmeshes=[]
    taken=[np.zeros(len(p['idx']),bool) for p in prims]
    wl=[]
    for w in wh:
        parts=[]
        for i,p in enumerate(prims):
            c=tri_centroids(p);m=(~taken[i])&(c[:,0]>=w['x0']-0.02)&(c[:,0]<=w['x1']+0.02)&(np.hypot(c[:,1]-w['cy'],c[:,2]-w['cz'])<w['R']*1.03)
            taken[i]|=m
            if m.any(): parts.append(subset(p,m))
        px=(w['x0']+w['x1'])/2
        for q in parts: q['pos']=q['pos']-np.array([px,w['cy'],w['cz']])
        wl.append((np.array([px,w['cy'],w['cz']]),parts))
    bp=[subset(p,~taken[i]) for i,p in enumerate(prims) if (~taken[i]).any()]
    allp=bp+[q for _,ps in wl for q in ps]
    gmin=min(w['cy']-w['R'] for w in wh);xs=[w['x0'] for w in wh]+[w['x1'] for w in wh]
    cx=(min(xs)+max(xs))/2;zs=[w['cz'] for w in wh];cz=(max(zs)+min(zs))/2
    off=np.array([cx,gmin,cz])
    for p in bp: p['pos']=(p['pos']-off)*scale
    meshes=[];nodes=[dict(name='body',mesh=0)];meshes.append(bp)
    for k,(piv,parts) in enumerate(wl):
        for q in parts: q['pos']=q['pos']*scale
        meshes.append(parts);m=len(meshes)-1
        nodes.append(dict(name='wh%d_s'%k,translation=((piv-off)*scale).tolist(),children=[len(nodes)+1]))
        nodes.append(dict(name='wh%d_r'%k,children=[len(nodes)+1]));nodes.append(dict(name='wh%d_m'%k,mesh=m))
    for ps in meshes: finalize(ps)
    roots=[0]+[1+3*k for k in range(4)]
    write(os.path.join(OUT,name+'.glb'),meshes,nodes,roots)
    R=np.mean([w['R'] for w in wh])*scale
    print(name,'tris',sum(len(q['idx']) for ps in meshes for q in ps),'wheelR',round(R,3),'size KB',os.path.getsize(os.path.join(OUT,name+'.glb'))//1024)
def build_shell(name,src,ry,scale,rx=0):
    prims=read(os.path.join(SRC,src));xform(prims,rotm(rx=rx,ry=ry),scale)
    mn,mx=bbox(prims);return prims,mn,mx
def lathe_tyre(rin,R,hw,seg=56):
    d=R-rin;prof=[(-hw*0.90,rin),(-hw*1.0,rin+0.14*d),(-hw*0.99,rin+0.6*d),(-hw*0.86,R-0.1*d),(-hw*0.55,R-0.012*d),(-hw*0.2,R),(hw*0.2,R),(hw*0.55,R-0.012*d),(hw*0.86,R-0.1*d),(hw*0.99,rin+0.6*d),(hw*1.0,rin+0.14*d),(hw*0.90,rin),(-hw*0.90,rin)]
    n=len(prof);ang=np.linspace(0,2*math.pi,seg,endpoint=False)
    P=np.array([[x,r*math.cos(a),r*math.sin(a)] for (x,r) in prof for a in ang])
    I=[]
    for i in range(n-1):
        for j in range(seg):
            a=i*seg+j;b=i*seg+(j+1)%seg;c=(i+1)*seg+j;d2=(i+1)*seg+(j+1)%seg;I+= [[a,b,c],[b,d2,c]]
    I=np.array(I);N=vnormals(P,I)
    # 바깥을 향하게: 트레드 중앙 점의 법선이 +반지름 방향이어야 해요
    t=5*seg;rad=np.array([0,P[t,1],P[t,2]]);
    if np.dot(N[t],rad)<0: I=I[:,[0,2,1]];N=-N
    return dict(pos=P,nrm=N,idx=I,mat=dict(name='tyre',pbrMetallicRoughness=dict(baseColorFactor=[0.035,0.035,0.04,1],metallicFactor=0.0,roughnessFactor=0.9),doubleSided=True))
def build_wheel(name,src,center,Rrim,keep=None,tyre=True,ratio=0.66,widen=1.0,tint=None,dec=0):
    """center=(y,z) 림 중심축 위치. 림 바깥지름 Rrim(원본 단위). 결과: 타이어 바깥 반지름 1"""
    prims=read(os.path.join(SRC,src))
    if keep: prims=[p for i,p in enumerate(prims) if keep(i,p)]
    cy,cz=center;allx=np.concatenate([p['pos'][:,0] for p in prims]);xm=(allx.min()+allx.max())/2
    s=ratio/Rrim
    for p in prims: p['pos']=(p['pos']-np.array([xm,cy,cz]))*s
    if tint:
        for p in prims:
            if p['mat'].get('name')==tint[0]: p['mat']=dict(p['mat']);p['mat']['pbrMetallicRoughness']=dict(p['mat'].get('pbrMetallicRoughness',{}),baseColorFactor=tint[1])
    finalize(prims)
    if dec: prims=[decimate(p,dec) for p in prims]
    hw=(allx.max()-allx.min())/2*s
    if tyre: prims.append(lathe_tyre(ratio*0.97,1.0,hw*widen+0.015))
    write(os.path.join(OUT,name+'.glb'),[prims],[dict(name='wheel',mesh=0)],[0])
    print(name,'tris',sum(len(q['idx']) for q in prims),'hw',round(hw*widen,3),'KB',os.path.getsize(os.path.join(OUT,name+'.glb'))//1024)
def build_fullwheel(name,src,dec=0):
    prims=read(os.path.join(SRC,src))
    allp=np.vstack([p['pos'] for p in prims]);mn,mx=allp.min(0),allp.max(0);c=(mn+mx)/2;R=(mx[1]-mn[1])/2
    for p in prims: p['pos']=(p['pos']-c)/R
    finalize(prims)
    if dec: prims=[decimate(p,dec) for p in prims]
    hw=(mx[0]-mn[0])/2/R
    write(os.path.join(OUT,name+'.glb'),[prims],[dict(name='wheel',mesh=0)],[0])
    print(name,'tris',sum(len(q['idx']) for q in prims),'hw',round(hw,3),'KB',os.path.getsize(os.path.join(OUT,name+'.glb'))//1024)
if __name__=='__main__':
    os.makedirs(OUT,exist_ok=True)
    what=sys.argv[3:] or ['all']
    if 'all' in what or 'bodies' in what:
        build_baked('car_carrera','carrera.max_original_porker_2.glb',0,0.42,1.9,1.4,1.9)
        build_baked('car_chevy','chevy.max_unused.glb',0,0.6,1.85,0.9,1.85)
        for nm,src,ry,sc,gy in [('car_niva','caisse_niva.glb',-math.pi/2,2.48,0.055),('car_pickup','generic_american_ck_72.glb',math.pi/2,1.0,2.6)]:
            prims,mn,mx=build_shell(nm,src,ry,sc)
            ctr=(mn+mx)/2
            for p in prims: p['pos']=p['pos']-np.array([ctr[0],gy*sc,ctr[2]])
            finalize(prims);write(os.path.join(OUT,nm+'.glb'),[prims],[dict(name='body',mesh=0)],[0])
            mn2,mx2=bbox(prims);print(nm,'bbox',mn2.round(3),mx2.round(3),'KB',os.path.getsize(os.path.join(OUT,nm+'.glb'))//1024)
    if 'all' in what or 'wheels' in what:
        build_wheel('wh_borbet','borbet_a_car_rim.glb',(0.777,0.0),2.52,dec=0.016)
        build_wheel('wh_fifteen52','fifteen52_turbomac.glb',(0.0,0.0),0.2917,ratio=0.68,dec=0.006,tint=('material',[0.06,0.06,0.07,1]))
        build_fullwheel('wh_offroad','free_-_wheel_offroad1.glb',dec=0.008)
