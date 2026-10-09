import json,struct,sys,glob,os,numpy as np
def load(p):
    d=open(p,'rb').read(); l=struct.unpack('<I',d[12:16])[0]; j=json.loads(d[20:20+l]); off=20+l; b=b''
    if off<len(d): bl=struct.unpack('<I',d[off:off+4])[0]; b=d[off+8:off+8+bl]
    return j,b
CT={5120:'b',5121:'B',5122:'h',5123:'H',5125:'I',5126:'f'};NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def acc(j,b,i):
    a=j['accessors'][i];bv=j['bufferViews'][a['bufferView']];n=NC[a['type']];dt=np.dtype(CT[a['componentType']])
    st=bv.get('byteStride') or n*dt.itemsize; o=bv.get('byteOffset',0)+a.get('byteOffset',0)
    arr=np.ndarray((a['count'],n),dt,b,o,(st,dt.itemsize)); return arr
def mat(n):
    m=np.eye(4)
    if 'matrix' in n: return np.array(n['matrix']).reshape(4,4).T
    from math import sqrt
    t=np.eye(4)
    if 'scale' in n: t=t@np.diag(list(n['scale'])+[1])
    if 'rotation' in n:
        x,y,z,w=n['rotation']; r=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]]);R=np.eye(4);R[:3,:3]=r;t=R@t
    if 'translation' in n: T=np.eye(4);T[:3,3]=n['translation'];t=T@t
    return t
def walk(j,b):
    out=[]
    sc=j['scenes'][j.get('scene',0)]['nodes']
    def rec(i,M,path):
        n=j['nodes'][i];M2=M@mat(n);nm=n.get('name','?')
        if 'mesh' in n:
            for k,pr in enumerate(j['meshes'][n['mesh']]['primitives']):
                pos=acc(j,b,pr['attributes']['POSITION']).astype(float);p=(M2[:3,:3]@pos.T).T+M2[:3,3]
                tri=(acc(j,b,pr['indices']).shape[0]//3) if 'indices' in pr else pos.shape[0]//3
                out.append((nm,pr.get('material'),tri,p.min(0),p.max(0)))
        for c in n.get('children',[]): rec(c,M2,path+[nm])
    for s in sc: rec(s,np.eye(4),[])
    return out
if __name__=='__main__':
    for p in sys.argv[1:]:
        j,b=load(p);o=walk(j,b)
        print('==',os.path.basename(p),os.path.getsize(p)//1024,'KB nodes',len(j['nodes']),'meshprims',len(o),'tris',sum(x[2] for x in o),'mats',len(j.get('materials',[])),'imgs',len(j.get('images',[])))
        if o:
            mn=np.min([x[3] for x in o],0);mx=np.max([x[4] for x in o],0);print('  bbox',np.round(mn,2),np.round(mx,2),'size',np.round(mx-mn,2))
        big=sorted(o,key=lambda x:-x[2])[:6]
        for x in big: print('   ',x[0][:30],'tri',x[2],'size',np.round(x[4]-x[3],2),'ctr',np.round((x[3]+x[4])/2,2))
