/* 3D 모델 삼각형 줄이기 (Quadric Error Metric, Garland & Heckbert)
   sp4cerat 의 Fast-Quadric-Mesh-Simplification 방식을 C로 옮기고, 질감 좌표를 삼각형 꼭짓점마다 따로 가지게 했습니다.
   입력(바이너리): int nv, int nt, float pos[nv*3], int tri[nt*3], float uv[nt*6]
   출력(바이너리): int nv, int nt, float pos[nv*3], int tri[nt*3], float uv[nt*6]
   사용: simplify in.bin out.bin 목표삼각형수 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

typedef struct { double x, y, z; } V3;
static V3 v3(double x, double y, double z) { V3 r = { x, y, z }; return r; }
static V3 sub(V3 a, V3 b) { return v3(a.x - b.x, a.y - b.y, a.z - b.z); }
static V3 add(V3 a, V3 b) { return v3(a.x + b.x, a.y + b.y, a.z + b.z); }
static V3 mul(V3 a, double s) { return v3(a.x * s, a.y * s, a.z * s); }
static double dot(V3 a, V3 b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
static V3 cross(V3 a, V3 b) { return v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x); }
static V3 norm(V3 a) { double l = sqrt(dot(a, a)); return l > 0 ? mul(a, 1 / l) : a; }

typedef struct { double m[10]; } Q;
static Q qplane(double a, double b, double c, double d) { Q q = { { a*a, a*b, a*c, a*d, b*b, b*c, b*d, c*c, c*d, d*d } }; return q; }
static Q qadd(Q a, Q b) { for (int i = 0; i < 10; i++) a.m[i] += b.m[i]; return a; }
static double qdet(Q *q, int a11, int a12, int a13, int a21, int a22, int a23, int a31, int a32, int a33) {
  double *m = q->m;
  return m[a11]*m[a22]*m[a33] + m[a13]*m[a21]*m[a32] + m[a12]*m[a23]*m[a31] - m[a13]*m[a22]*m[a31] - m[a11]*m[a23]*m[a32] - m[a12]*m[a21]*m[a33];
}

typedef struct { int v[3]; double err[4]; int deleted, dirty; V3 n; float uv[6]; } Tri;
typedef struct { V3 p; int tstart, tcount; Q q; int border; } Vert;
typedef struct { int tid, tvertex; } Ref;

static Tri *T; static int nt; static double DRIFT = 1e9;
static Vert *VV; static int nv;
static Ref *R; static int nr, cr;
static void rpush(Ref r) { if (nr >= cr) { cr = cr ? cr * 2 : 1024; R = realloc(R, sizeof(Ref) * cr); } R[nr++] = r; }

static double verr(Q *q, double x, double y, double z) {
  double *m = q->m;
  return m[0]*x*x + 2*m[1]*x*y + 2*m[2]*x*z + 2*m[3]*x + m[4]*y*y + 2*m[5]*y*z + 2*m[6]*y + m[7]*z*z + 2*m[8]*z + m[9];
}
/* 반 모서리 줄이기: 두 끝점 중 오차가 작은 쪽 자리로 합침 (새 자리를 만들지 않아 질감이 밀리지 않아요) */
static double cerr(int a, int b, V3 *pr) {
  Q q = qadd(VV[a].q, VV[b].q);
  double e1 = verr(&q, VV[a].p.x, VV[a].p.y, VV[a].p.z), e2 = verr(&q, VV[b].p.x, VV[b].p.y, VV[b].p.z);
  *pr = e1 <= e2 ? VV[a].p : VV[b].p;
  return fmin(e1, e2);
}
/* 이 정점 둘레 삼각형들이 모두 같은 질감 좌표를 쓰면(질감 조각 이음매가 아니면) 1 */
static int interior(int vi) {
  Vert *v = &VV[vi]; if (v->border) return 0;
  float u = -1, w = -1;
  for (int k = 0; k < v->tcount; k++) {
    Tri *t = &T[R[v->tstart + k].tid]; if (t->deleted) continue;
    int s = R[v->tstart + k].tvertex;
    if (u < 0) { u = t->uv[s * 2]; w = t->uv[s * 2 + 1]; }
    else if (fabsf(u - t->uv[s * 2]) > 1e-6f || fabsf(w - t->uv[s * 2 + 1]) > 1e-6f) return 0;
  }
  return 1;
}
static int flipped(V3 p, int i1, Vert *v0, char *del) {
  for (int k = 0; k < v0->tcount; k++) {
    Tri *t = &T[R[v0->tstart + k].tid]; if (t->deleted) continue;
    int s = R[v0->tstart + k].tvertex, id1 = t->v[(s + 1) % 3], id2 = t->v[(s + 2) % 3];
    if (id1 == i1 || id2 == i1) { del[k] = 1; continue; }
    V3 d1 = norm(sub(VV[id1].p, p)), d2 = norm(sub(VV[id2].p, p));
    if (fabs(dot(d1, d2)) > 0.999) return 1;
    V3 n = norm(cross(d1, d2)); del[k] = 0;
    if (dot(n, t->n) < 0.2) return 1;
  }
  return 0;
}
/* 꼭짓점이 old 에서 np 로 옮겨질 때, 그 삼각형의 질감 좌표도 같은 만큼 옮김 (삼각형 면 위의 1차 근사) */
static void moveuv(Tri *t, int s, V3 old, V3 np) {
  V3 P[3]; for (int j = 0; j < 3; j++) P[j] = (j == s) ? old : VV[t->v[j]].p;
  int a = (s + 1) % 3, b = (s + 2) % 3;
  V3 e1 = sub(P[a], P[s]), e2 = sub(P[b], P[s]), d = sub(np, old);
  double g11 = dot(e1, e1), g12 = dot(e1, e2), g22 = dot(e2, e2), det = g11 * g22 - g12 * g12;
  if (fabs(det) < 1e-20) return;
  double r1 = dot(d, e1), r2 = dot(d, e2);
  double x = (r1 * g22 - r2 * g12) / det, y = (r2 * g11 - r1 * g12) / det;
  float *u = t->uv;
  double du = x * (u[a * 2] - u[s * 2]) + y * (u[b * 2] - u[s * 2]);
  double dv = x * (u[a * 2 + 1] - u[s * 2 + 1]) + y * (u[b * 2 + 1] - u[s * 2 + 1]);
  if (fabs(du) > .05 || fabs(dv) > .05) return;   /* 너무 멀리 가면 그대로 */
  u[s * 2] = fmin(1, fmax(0, u[s * 2] + du)); u[s * 2 + 1] = fmin(1, fmax(0, u[s * 2 + 1] + dv));
}
static int npair; static float PR[64][4];   /* 지우는 정점의 질감 좌표 → 남는 정점의 질감 좌표 (질감 조각마다) */
static int lookup(const float *u, float *o) {
  for (int i = 0; i < npair; i++) if (fabsf(PR[i][0] - u[0]) < 1e-6f && fabsf(PR[i][1] - u[1]) < 1e-6f) { o[0] = PR[i][2]; o[1] = PR[i][3]; return 1; }
  return 0;
}
static void updtris(int i0, Vert *v, char *del, int *dt, int remap) {
  V3 p;
  for (int k = 0; k < v->tcount; k++) {
    Ref r = R[v->tstart + k]; Tri *t = &T[r.tid];
    if (t->deleted) continue;
    if (del[k]) { t->deleted = 1; (*dt)++; continue; }
    if (remap) { float o[2]; if (lookup(t->uv + r.tvertex * 2, o)) { t->uv[r.tvertex * 2] = o[0]; t->uv[r.tvertex * 2 + 1] = o[1]; } }
    t->v[r.tvertex] = i0; t->dirty = 1;
    t->err[0] = cerr(t->v[0], t->v[1], &p); t->err[1] = cerr(t->v[1], t->v[2], &p); t->err[2] = cerr(t->v[2], t->v[0], &p);
    t->err[3] = fmin(t->err[0], fmin(t->err[1], t->err[2]));
    rpush(r);
  }
}
static void update_mesh(int it) {
  if (it > 0) { int dst = 0; for (int i = 0; i < nt; i++) if (!T[i].deleted) T[dst++] = T[i]; nt = dst; }
  for (int i = 0; i < nv; i++) { VV[i].tstart = 0; VV[i].tcount = 0; }
  for (int i = 0; i < nt; i++) for (int j = 0; j < 3; j++) VV[T[i].v[j]].tcount++;
  int ts = 0; for (int i = 0; i < nv; i++) { VV[i].tstart = ts; ts += VV[i].tcount; VV[i].tcount = 0; }
  nr = 0; if (cr < nt * 3) { cr = nt * 3; R = realloc(R, sizeof(Ref) * cr); } nr = nt * 3;
  for (int i = 0; i < nt; i++) for (int j = 0; j < 3; j++) { Vert *v = &VV[T[i].v[j]]; R[v->tstart + v->tcount].tid = i; R[v->tstart + v->tcount].tvertex = j; v->tcount++; }
  if (it == 0) {
    /* 가장자리 정점 찾기 */
    int *cnt = calloc(64, sizeof(int)), *ids = calloc(64, sizeof(int)); int cap = 64;
    for (int i = 0; i < nv; i++) VV[i].border = 0;
    for (int i = 0; i < nv; i++) {
      Vert *v = &VV[i]; int n = 0;
      for (int j = 0; j < v->tcount; j++) {
        Tri *t = &T[R[v->tstart + j].tid];
        for (int k = 0; k < 3; k++) {
          int id = t->v[k], o = 0;
          while (o < n && ids[o] != id) o++;
          if (o == n) { if (n >= cap) { cap *= 2; cnt = realloc(cnt, cap * sizeof(int)); ids = realloc(ids, cap * sizeof(int)); } cnt[n] = 1; ids[n] = id; n++; }
          else cnt[o]++;
        }
      }
      for (int j = 0; j < n; j++) if (cnt[j] == 1) VV[ids[j]].border = 1;
    }
    free(cnt); free(ids);
    for (int i = 0; i < nv; i++) memset(&VV[i].q, 0, sizeof(Q));
    for (int i = 0; i < nt; i++) {
      Tri *t = &T[i]; V3 p0 = VV[t->v[0]].p;
      V3 n = norm(cross(sub(VV[t->v[1]].p, p0), sub(VV[t->v[2]].p, p0))); t->n = n;
      Q q = qplane(n.x, n.y, n.z, -dot(n, p0));
      for (int j = 0; j < 3; j++) VV[t->v[j]].q = qadd(VV[t->v[j]].q, q);
    }
    V3 p;
    for (int i = 0; i < nt; i++) {
      Tri *t = &T[i];
      for (int j = 0; j < 3; j++) t->err[j] = cerr(t->v[j], t->v[(j + 1) % 3], &p);
      t->err[3] = fmin(t->err[0], fmin(t->err[1], t->err[2]));
    }
  }
}

int main(int argc, char **argv) {
  if (argc < 4) { fprintf(stderr, "usage: simplify in out target\n"); return 1; }
  FILE *f = fopen(argv[1], "rb"); int hdr[2]; fread(hdr, 4, 2, f); nv = hdr[0]; nt = hdr[1];
  float *pos = malloc(sizeof(float) * 3 * nv); fread(pos, 4, 3 * nv, f);
  int *tri = malloc(sizeof(int) * 3 * nt); fread(tri, 4, 3 * nt, f);
  float *uv = malloc(sizeof(float) * 6 * nt); fread(uv, 4, 6 * nt, f); fclose(f);
  VV = calloc(nv, sizeof(Vert)); T = calloc(nt, sizeof(Tri));
  for (int i = 0; i < nv; i++) VV[i].p = v3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
  for (int i = 0; i < nt; i++) { for (int j = 0; j < 3; j++) T[i].v[j] = tri[i * 3 + j]; memcpy(T[i].uv, uv + i * 6, 24); }
  int target = atoi(argv[3]), dt = 0, start = nt; if (argc > 4) DRIFT = atof(argv[4]);
  char *d0 = malloc(1), *d1 = malloc(1); int dcap = 1;
  for (int it = 0; it < 100; it++) {
    if (start - dt <= target) break;
    if (it % 5 == 0) update_mesh(it);
    for (int i = 0; i < nt; i++) T[i].dirty = 0;
    double th = 0.000000001 * pow((double)(it + 3), 7.0);
    for (int i = 0; i < nt; i++) {
      Tri *t = &T[i];
      if (t->err[3] > th || t->deleted || t->dirty) continue;
      for (int j = 0; j < 3; j++) {
        if (t->err[j] >= th) continue;
        int a0 = t->v[j], a1 = t->v[(j + 1) % 3];
        if (VV[a0].border || VV[a1].border) continue;
        Q qq = qadd(VV[a0].q, VV[a1].q);
        double e0 = verr(&qq, VV[a0].p.x, VV[a0].p.y, VV[a0].p.z), e1 = verr(&qq, VV[a1].p.x, VV[a1].p.y, VV[a1].p.z);
        int keep = e0 <= e1 ? a0 : a1, rem = keep == a0 ? a1 : a0;
        Vert *vk = &VV[keep], *vr = &VV[rem];
        V3 p = vk->p;
        int need = vk->tcount > vr->tcount ? vk->tcount : vr->tcount;
        if (need > dcap) { dcap = need * 2; d0 = realloc(d0, dcap); d1 = realloc(d1, dcap); }
        memset(d0, 0, vk->tcount); memset(d1, 0, vr->tcount);
        if (flipped(p, rem, vk, d0)) continue;
        if (flipped(p, keep, vr, d1)) continue;
        /* 질감 조각마다: 둘을 함께 가진(지워질) 삼각형에서 rem→keep 질감 좌표 짝 만들기 */
        npair = 0; int bad = 0;
        for (int k = 0; k < vr->tcount && !bad; k++) {
          Tri *tt = &T[R[vr->tstart + k].tid]; if (tt->deleted || !d1[k]) continue;
          int sr = R[vr->tstart + k].tvertex, sk = -1;
          for (int c = 0; c < 3; c++) if (tt->v[c] == keep) sk = c;
          if (sk < 0 || npair >= 64) { bad = 1; break; }
          PR[npair][0] = tt->uv[sr * 2]; PR[npair][1] = tt->uv[sr * 2 + 1]; PR[npair][2] = tt->uv[sk * 2]; PR[npair][3] = tt->uv[sk * 2 + 1]; npair++;
        }
        if (bad || !npair) continue;
        /* 남는 삼각형의 rem 질감 좌표가 모두 짝이 있어야 (없으면 다른 조각으로 번져서 안 함) */
        for (int k = 0; k < vr->tcount && !bad; k++) {
          Tri *tt = &T[R[vr->tstart + k].tid]; if (tt->deleted || d1[k]) continue;
          float o[2]; if (!lookup(tt->uv + R[vr->tstart + k].tvertex * 2, o)) bad = 1;
        }
        if (bad) continue;
        vk->q = qadd(vr->q, vk->q);
        int tstart = nr;
        updtris(keep, vk, d0, &dt, 0);
        vk = &VV[keep]; vr = &VV[rem];
        updtris(keep, vr, d1, &dt, 1);
        vk = &VV[keep];
        int tc = nr - tstart;
        if (tc <= vk->tcount) { if (tc) memmove(&R[vk->tstart], &R[tstart], tc * sizeof(Ref)); }
        else vk->tstart = tstart;
        vk->tcount = tc;
        break;
      }
      if (start - dt <= target) break;
    }
    fprintf(stderr, "  %d회: 삼각형 %d\n", it, start - dt);
  }
  /* 정리 */
  int *map = malloc(sizeof(int) * nv); for (int i = 0; i < nv; i++) map[i] = -1;
  int ot = 0; for (int i = 0; i < nt; i++) if (!T[i].deleted) T[ot++] = T[i]; nt = ot;
  int ov = 0; float *op = malloc(sizeof(float) * 3 * nv);
  for (int i = 0; i < nt; i++) for (int j = 0; j < 3; j++) { int v = T[i].v[j]; if (map[v] < 0) { map[v] = ov; op[ov * 3] = VV[v].p.x; op[ov * 3 + 1] = VV[v].p.y; op[ov * 3 + 2] = VV[v].p.z; ov++; } T[i].v[j] = map[v]; }
  f = fopen(argv[2], "wb"); int h2[2] = { ov, nt }; fwrite(h2, 4, 2, f);
  fwrite(op, 4, 3 * ov, f);
  for (int i = 0; i < nt; i++) fwrite(T[i].v, 4, 3, f);
  for (int i = 0; i < nt; i++) fwrite(T[i].uv, 4, 6, f);
  fclose(f);
  return 0;
}
