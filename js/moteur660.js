/* ============================================================
   Moteur Triumph 660 trois cylindres — constructeur partagé.

   Modélisé d'après les photos d'atelier et la microfiche
   « carter moteur et pièces » (Daytona/Trident 660).

   Repère local : vilebrequin sur l'axe X (origine au centre),
   avant du moteur = -Z, axe des fûts incliné de 12° vers -Z.

   buildMoteur660() → { group, parts }
     group : THREE.Group assemblé (à insérer dans la scène)
     parts : [{ g, name, rep, desc, mat, dir:[x,y,z], dist, stag, spin? }]
             `dist` est brut : chaque page applique son propre facteur
             d'éclatement (moteur.html ×0.85, index.html réduit).
   Utilisé par moteur.html (page dédiée) et index.html (moto complète).
   ============================================================ */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const rad = d => d*Math.PI/180;

export function noiseTex(size, contrast=28, blur=0){
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for(let i=0;i<img.data.length;i+=4){
    const v = 128 + (Math.random()-0.5)*2*contrast;
    img.data[i]=img.data[i+1]=img.data[i+2]=v; img.data[i+3]=255;
  }
  g.putImageData(img,0,0);
  if(blur){ g.filter = `blur(${blur}px)`; g.drawImage(c,0,0); g.filter='none'; }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function buildMoteur660(){
  /* ---------- constantes géométriques ---------- */
  const CANT = rad(12);                                  // inclinaison avant des cylindres
  const BORE = new THREE.Vector3(0, Math.cos(CANT), -Math.sin(CANT)); // axe des fûts
  const TILT = new THREE.Euler(-CANT, 0, 0);
  const BORE_X = [-0.088, 0, 0.088];                     // entraxe des 3 cylindres
  const CRANK_R = 0.0255, ROD_L = 0.102;                 // demi-course & longueur bielle

  // point sur l'axe des fûts : distance d le long de l'axe, décalages locaux xl/zl
  function bp(d, zl=0, xl=0){
    const v = new THREE.Vector3(xl, d, zl);
    v.applyEuler(TILT);
    return v;
  }

  /* ---------- textures procédurales & matériaux ---------- */
  const bumpCast = noiseTex(256, 26, 1);   bumpCast.repeat.set(4,4);
  const bumpCrinkle = noiseTex(128, 60, 0); bumpCrinkle.repeat.set(7,7);
  const bumpMachined = (()=>{ // stries concentriques (u = circonférence, v = rayon)
    const c = document.createElement('canvas'); c.width=8; c.height=512;
    const g = c.getContext('2d');
    for(let y=0;y<512;y++){ const v=128+(Math.random()-0.5)*70; g.fillStyle=`rgb(${v},${v},${v})`; g.fillRect(0,y,8,1); }
    const t = new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping;
    return t;
  })();

  function decalTex(lines, w=256, h=128, bg='#d8d5cc'){
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    const g=c.getContext('2d');
    g.fillStyle=bg; g.fillRect(0,0,w,h);
    g.fillStyle='#15161a';
    g.textAlign='center';
    lines.forEach((L)=>{ g.font=`${L.bold?'800':'500'} ${L.size}px Helvetica,Arial`; g.fillText(L.t, w/2, L.y); });
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
    return t;
  }

  const P = (o)=> new THREE.MeshPhysicalMaterial(o);
  const M = {
    case:     P({color:0x41444a, metalness:0.85, roughness:0.46, bumpMap:bumpCast, bumpScale:0.6, clearcoat:0.15, clearcoatRoughness:0.7, envMapIntensity:1.0}),
    caseDark: P({color:0x2e3136, metalness:0.82, roughness:0.52, bumpMap:bumpCast, bumpScale:0.6, envMapIntensity:0.95}),
    crinkle:  P({color:0x17181b, metalness:0.3, roughness:0.9, bumpMap:bumpCrinkle, bumpScale:0.45, envMapIntensity:0.5}),
    blackSatin:P({color:0x1b1c1f, metalness:0.6, roughness:0.42, envMapIntensity:0.8}),
    plastic:  P({color:0x121316, metalness:0.05, roughness:0.55, clearcoat:0.3, clearcoatRoughness:0.4}),
    alu:      P({color:0x8f949b, metalness:0.9, roughness:0.4, bumpMap:bumpCast, bumpScale:0.35, envMapIntensity:1}),
    aluBright:P({color:0xc7ccd3, metalness:0.95, roughness:0.22, envMapIntensity:1.1}),
    machined: P({color:0x4d5157, metalness:0.88, roughness:0.4, bumpMap:bumpMachined, bumpScale:0.35, envMapIntensity:1.05}),
    steel:    P({color:0x9ba3ac, metalness:1, roughness:0.3, envMapIntensity:1.1}),
    steelDark:P({color:0x6b7178, metalness:0.92, roughness:0.44, envMapIntensity:0.95}),
    chrome:   P({color:0xd9dde2, metalness:1, roughness:0.12, envMapIntensity:1.2}),
    rubber:   P({color:0x0d0d0f, metalness:0, roughness:0.92}),
    hose:     P({color:0x121215, metalness:0.04, roughness:0.75, bumpMap:bumpCast, bumpScale:0.5}),
    copper:   P({color:0x9d5c25, metalness:0.92, roughness:0.4, envMapIntensity:1}),
    friction: P({color:0x6d4b2b, metalness:0.08, roughness:0.88}),
    gasket:   P({color:0x545a60, metalness:0.85, roughness:0.6}),
    gasketDark:P({color:0x232427, metalness:0.15, roughness:0.9}),
    brass:    P({color:0xb08d3e, metalness:0.95, roughness:0.32, envMapIntensity:1}),
    bearing:  P({color:0xd4d8dd, metalness:0.95, roughness:0.3, side:THREE.DoubleSide, envMapIntensity:1}),
    gold:     P({color:0xd4af37, metalness:0.95, roughness:0.28, envMapIntensity:1.1}),
  };
  for(const m of Object.values(M)) m.envMapIntensity = (m.envMapIntensity ?? 1) * 0.95;

  /* ---------- aides géométrie ---------- */
  function mesh(geo, mat){
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = m.receiveShadow = true;
    return m;
  }
  function rbox(w,h,d,r,mat){ return mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(r, Math.min(w,h,d)/2*0.95)), mat); }
  function cylX(r, len, mat, seg=28){ const m = mesh(new THREE.CylinderGeometry(r,r,len,seg), mat); m.rotation.z = Math.PI/2; return m; }
  function cylZ(r, len, mat, seg=28){ const m = mesh(new THREE.CylinderGeometry(r,r,len,seg), mat); m.rotation.x = Math.PI/2; return m; }
  const latheMats = new Map();
  function latheP(pairs, mat, seg=48){ // pairs: [ [r, y], ... ] — profil normalisé bas → haut + double face
    let pts = pairs.map(p=>new THREE.Vector2(p[0],p[1]));
    if(pts[0].y > pts[pts.length-1].y) pts = pts.reverse();
    if(!latheMats.has(mat)){
      const c = mat.clone(); c.side = THREE.DoubleSide; latheMats.set(mat, c);
    }
    return mesh(new THREE.LatheGeometry(pts, seg), latheMats.get(mat));
  }
  function boltG(rH=0.007, len=0.018, mat=M.steelDark){
    const g = new THREE.Group();
    const head = mesh(new THREE.CylinderGeometry(rH, rH, rH*0.9, 6), mat); head.position.y = len/2; g.add(head);
    const shaft = mesh(new THREE.CylinderGeometry(rH*0.55, rH*0.55, len, 10), M.steelDark); g.add(shaft);
    const w = mesh(new THREE.CylinderGeometry(rH*1.25, rH*1.25, rH*0.25, 16), M.steelDark); w.position.y = len/2 - rH*0.55; g.add(w);
    return g;
  }
  // anneau de vis dont l'axe est X (couvercles latéraux) — face = +1 (droite) ou -1 (gauche)
  function boltRingX(n, radius, cx, cy, cz, face, rH=0.0065, len=0.02){
    const g = new THREE.Group();
    for(let i=0;i<n;i++){
      const a = i/n*Math.PI*2 + 0.2;
      const b = boltG(rH, len);
      b.rotation.z = -face*Math.PI/2;
      b.position.set(cx, cy + Math.sin(a)*radius, cz + Math.cos(a)*radius);
      g.add(b);
    }
    return g;
  }
  function gearGeo(r, teeth, w, holeR=0){
    const s = new THREE.Shape();
    const ri = r*0.9;
    for(let i=0;i<teeth;i++){
      const a = i/teeth*Math.PI*2, da = Math.PI*2/teeth;
      const p = (t)=>[Math.cos(a+da*t), Math.sin(a+da*t)];
      let q = p(0);   if(i===0) s.moveTo(q[0]*ri, q[1]*ri); else s.lineTo(q[0]*ri, q[1]*ri);
      q = p(0.16); s.lineTo(q[0]*r,  q[1]*r);
      q = p(0.42); s.lineTo(q[0]*r,  q[1]*r);
      q = p(0.58); s.lineTo(q[0]*ri, q[1]*ri);
    }
    s.closePath();
    if(holeR>0){
      const h = new THREE.Path();
      h.absarc(0,0,holeR,0,Math.PI*2,true);
      s.holes.push(h);
    }
    const g = new THREE.ExtrudeGeometry(s, {depth:w, bevelEnabled:true, bevelThickness:w*0.08, bevelSize:w*0.08, bevelSegments:1, curveSegments:6});
    g.translate(0,0,-w/2);
    return g;
  }
  function gearX(r, teeth, w, mat, holeR=0){ const m = mesh(gearGeo(r,teeth,w,holeR), mat); m.rotation.y = Math.PI/2; return m; }
  function tubeCurve(points, r, mat, closed=false){
    const c = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)), closed, 'catmullrom', 0.35);
    return mesh(new THREE.TubeGeometry(c, 64, r, 10, closed), mat);
  }
  function springX(r, len, coils, wr, mat=M.steel){
    const pts = [];
    const N = coils*14;
    for(let i=0;i<=N;i++){
      const t = i/N;
      pts.push(new THREE.Vector3(t*len - len/2, Math.cos(t*coils*Math.PI*2)*r, Math.sin(t*coils*Math.PI*2)*r));
    }
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N, wr, 6), mat);
  }
  // volume de carter réaliste : silhouette latérale (plan Z-Y) extrudée en largeur sur X
  function sideProfile(build, width, mat, bevel=0.013){
    const s = new THREE.Shape();
    build(s); // tracer avec (x = z moteur, y = y moteur)
    const g = new THREE.ExtrudeGeometry(s, {depth:width, bevelEnabled:true,
      bevelThickness:bevel, bevelSize:bevel, bevelSegments:3, curveSegments:16});
    g.translate(0, 0, -width/2);
    g.rotateY(-Math.PI/2); // profondeur d'extrusion → axe X, profil → plan Z-Y
    return mesh(g, mat);
  }
  function halfShell(r, w, th, mat=M.bearing){ // demi-coussinet ouvert (thêta = π)
    const g = new THREE.CylinderGeometry(r, r, w, 20, 1, true, 0, Math.PI);
    const m = mesh(g, mat); m.rotation.z = Math.PI/2;
    const grp = new THREE.Group(); grp.add(m);
    return grp;
  }
  function triumphLogo(size, depth, mat){
    // triangle arrondi évoquant le badge embouti du carter d'embrayage
    const s = new THREE.Shape();
    const r = size, c = 0.28*r;
    s.moveTo(-r, r*0.62);
    s.lineTo(r, r*0.62);
    s.quadraticCurveTo(r+c*0.5, r*0.62, r*0.82, r*0.3);
    s.lineTo(r*0.18, -r*0.78);
    s.quadraticCurveTo(0, -r*1.05, -r*0.18, -r*0.78);
    s.lineTo(-r*0.82, r*0.3);
    s.quadraticCurveTo(-r-c*0.5, r*0.62, -r, r*0.62);
    const g = new THREE.ExtrudeGeometry(s, {depth, bevelEnabled:true, bevelThickness:depth*0.4, bevelSize:depth*0.4, bevelSegments:2, curveSegments:10});
    return mesh(g, mat);
  }

  /* ---------- registre ---------- */
  const group = new THREE.Group();
  const parts = [];
  function addPart(g, def){
    // def : {name, rep, desc, mat, dir:[x,y,z], dist, stag, spin?:[axe,tours]}
    g.userData.label = def.name;
    parts.push({ g, ...def });
    group.add(g);
  }

  /* ============================================================
     CONSTRUCTION DU MOTEUR
     ============================================================ */

  /* ---------- 1 · carter supérieur + bloc-cylindres (pièce de référence) ---------- */
  {
    const g = new THREE.Group();
    // demi-carter supérieur : silhouette de fonderie extrudée
    // (front chanfreiné, dos qui monte en bossage de boîte, plan de joint en y=0)
    const upper = sideProfile(s=>{
      s.moveTo(-0.158, 0);
      s.lineTo(-0.158, 0.055);
      s.quadraticCurveTo(-0.158, 0.100, -0.118, 0.112);
      s.lineTo(0.080, 0.118);
      s.quadraticCurveTo(0.125, 0.121, 0.140, 0.140);
      s.quadraticCurveTo(0.152, 0.156, 0.190, 0.158);
      s.quadraticCurveTo(0.235, 0.158, 0.250, 0.115);
      s.quadraticCurveTo(0.260, 0.075, 0.258, 0.010);
      s.lineTo(0.258, 0);
      s.closePath();
    }, 0.375, M.case);
    g.add(upper);
    // lèvre du plan de joint + trace du joint
    const lipU = rbox(0.408, 0.008, 0.448, 0.002, M.case); lipU.position.set(0, 0.0045, 0.05); g.add(lipU);
    const seam = rbox(0.410, 0.0025, 0.450, 0.001, M.gasketDark); seam.position.set(0, 0, 0.05); g.add(seam);
    // goujons verticaux du plan de joint sur la lèvre
    for(const sx of [-1,1]) for(let i=0;i<7;i++){
      const b = boltG(0.005, 0.012);
      b.position.set(sx*0.187, 0.008, -0.135+i*0.06); g.add(b);
    }
    // courtes nervures de fonderie sur la face avant
    for(let i=-1;i<=1;i++){
      const rib = rbox(0.006, 0.07, 0.012, 0.002, M.caseDark);
      rib.position.set(i*0.06, 0.05, -0.170); g.add(rib);
    }
    // bloc-cylindres incliné, venu de fonderie avec le demi-carter
    const bank = rbox(0.315, 0.185, 0.205, 0.02, M.case);
    bank.position.copy(bp(0.148)); bank.rotation.copy(TILT); g.add(bank);
    // tunnel de chaîne de distribution (côté droit)
    const tun = rbox(0.045, 0.185, 0.15, 0.012, M.caseDark);
    tun.position.copy(bp(0.148, 0, 0.168)); tun.rotation.copy(TILT); g.add(tun);
    // plan de joint de culasse + fûts apparents
    const deck = rbox(0.318, 0.012, 0.196, 0.004, M.alu);
    deck.position.copy(bp(0.238)); deck.rotation.copy(TILT); g.add(deck);
    for(const x of BORE_X){
      const liner = mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.016, 40), M.machined);
      liner.position.copy(bp(0.24, 0, x)); liner.rotation.copy(TILT); g.add(liner);
      const boreHole = mesh(new THREE.CylinderGeometry(0.0335, 0.0335, 0.02, 40), M.caseDark);
      boreHole.position.copy(bp(0.243, 0, x)); boreHole.rotation.copy(TILT); g.add(boreHole);
    }
    // nervures latérales
    for(let i=0;i<3;i++){
      const rL = rbox(0.006, 0.16, 0.02, 0.002, M.caseDark);
      rL.position.copy(bp(0.14, -0.07+0.07*i, -0.163)); rL.rotation.copy(TILT); g.add(rL);
      const rR = rL.clone(); rR.position.copy(bp(0.14, -0.07+0.07*i, 0.163)); g.add(rR);
    }
    // bossages de fixation avant / arrière
    for(const [x,y,z] of [[-0.185,0.1,-0.11],[0.185,0.1,-0.11],[-0.185,0.06,0.17],[0.185,0.06,0.17]]){
      const bo = cylX(0.016, 0.03, M.caseDark); bo.position.set(x,y,z); g.add(bo);
    }
    // trace du plan de joint (ligne sombre à hauteur du vilebrequin)
    const joint = rbox(0.402, 0.004, 0.337, 0.001, M.gasketDark); joint.position.set(0, -0.002, 0.02); g.add(joint);
    const joint2 = rbox(0.362, 0.004, 0.117, 0.001, M.gasketDark); joint2.position.set(0, -0.002, 0.2); g.add(joint2);
    addPart(g, {name:"Carter moteur — demi-carter supérieur", rep:"REP. 1a",
      desc:"Fonderie principale : demi-carter supérieur venu d'usine avec le bloc trois cylindres incliné de 12°, les fûts et le tunnel de distribution. Toutes les autres pièces s'y rapportent.",
      mat:"Aluminium moulé sous pression, grenaillé", dir:[0,1,0], dist:0, stag:0});
  }

  /* ---------- 1b · demi-carter inférieur + carter d'huile ---------- */
  {
    const g = new THREE.Group();
    // demi-carter inférieur : ventre de fonderie qui rentre vers le carter d'huile
    const lower = sideProfile(s=>{
      s.moveTo(-0.158, 0);
      s.lineTo(0.258, 0);
      s.lineTo(0.258, -0.010);
      s.quadraticCurveTo(0.256, -0.055, 0.243, -0.075);
      s.quadraticCurveTo(0.220, -0.100, 0.185, -0.108);
      s.lineTo(0.100, -0.118);
      s.lineTo(-0.030, -0.118);
      s.quadraticCurveTo(-0.100, -0.115, -0.128, -0.100);
      s.quadraticCurveTo(-0.155, -0.085, -0.158, -0.045);
      s.closePath();
    }, 0.375, M.case);
    g.add(lower);
    // lèvre inférieure du plan de joint + vis tête en bas
    const lipL = rbox(0.408, 0.008, 0.448, 0.002, M.case); lipL.position.set(0, -0.0045, 0.05); g.add(lipL);
    for(const sx of [-1,1]) for(let i=0;i<7;i++){
      const b = boltG(0.005, 0.012); b.rotation.x = Math.PI;
      b.position.set(sx*0.187, -0.008, -0.105+i*0.06); g.add(b);
    }
    // carter d'huile rétréci, flancs chanfreinés
    const sump = sideProfile(s=>{
      s.moveTo(-0.075, -0.108);
      s.lineTo(0.100, -0.108);
      s.quadraticCurveTo(0.104, -0.152, 0.092, -0.177);
      s.quadraticCurveTo(0.080, -0.199, 0.050, -0.202);
      s.lineTo(-0.040, -0.202);
      s.quadraticCurveTo(-0.062, -0.198, -0.068, -0.172);
      s.quadraticCurveTo(-0.074, -0.140, -0.075, -0.108);
      s.closePath();
    }, 0.20, M.caseDark);
    g.add(sump);
    // ailettes du carter d'huile
    for(let i=0;i<5;i++){
      const f = rbox(0.19, 0.045, 0.006, 0.002, M.caseDark);
      f.position.set(0, -0.192, -0.04+0.03*i); g.add(f);
    }
    // hublot de niveau d'huile (côté droit)
    const sight = mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.006, 24),
      P({color:0x2a2013, metalness:0.2, roughness:0.25, clearcoat:0.8, envMapIntensity:0.8}));
    sight.rotation.z = Math.PI/2; sight.position.set(0.2, -0.09, 0.06); g.add(sight);
    // étiquette réglementaire CARB (photo : label blanc sur l'avant du carter d'huile)
    const carb = mesh(new THREE.PlaneGeometry(0.045, 0.024),
      new THREE.MeshBasicMaterial({map:decalTex([
        {t:'COMPOSANTS CONFORMES', y:42, size:17},
        {t:'CARB IE3120 · PHASE 2', y:78, size:19, bold:true}
      ])}));
    carb.rotation.y = Math.PI; carb.rotation.x = rad(-14);
    carb.position.set(0.01, -0.15, -0.088); g.add(carb);
    addPart(g, {name:"Demi-carter inférieur & carter d'huile", rep:"REP. 1b",
      desc:"Seconde moitié de la fonderie, fermée par le carter d'huile ailetté. Reçoit la pompe à huile, la crépine et le bouchon de vidange ; hublot de contrôle du niveau côté embrayage.",
      mat:"Aluminium moulé, peinture époxy graphite", dir:[0,-1,0], dist:0.36, stag:0.30});
  }

  /* ---------- bouchon de vidange & filtre ---------- */
  {
    const g = new THREE.Group();
    const plug = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 6), M.steel); g.add(plug);
    const wash = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.003, 20), M.brass); wash.position.y = 0.007; g.add(wash);
    g.rotation.x = -Math.PI/2; // bouchon sur la face arrière du carter d'huile
    g.position.set(0, -0.185, 0.105);
    addPart(g, {name:"Bouchon de vidange", rep:"REP. 9c",
      desc:"Bouchon magnétique à six pans avec rondelle d'étanchéité en cuivre écroui — à remplacer à chaque vidange.",
      mat:"Acier zingué, rondelle cuivre", dir:[0,-0.55,0.84], dist:0.5, stag:0.56});
  }
  {
    const g = new THREE.Group();
    const body = cylZ(0.034, 0.056, M.caseDark); g.add(body);
    for(let i=0;i<3;i++){ const k = mesh(new THREE.TorusGeometry(0.034, 0.0018, 8, 40), M.blackSatin); k.position.z = -0.014+0.012*i; g.add(k); }
    const cap = cylZ(0.028, 0.008, M.machined); cap.position.z = -0.032; g.add(cap);
    g.position.set(0.03, -0.098, -0.158);
    addPart(g, {name:"Cartouche de filtre à huile", rep:"REP. 9a",
      desc:"Cartouche vissée en façade, sous l'échappement. Corps serti moleté, joint torique pré-huilé au montage.",
      mat:"Boîtier acier embouti", dir:[0,-0.3,-0.95], dist:0.34, stag:0.24});
  }

  /* ---------- pompe à huile + crépine ---------- */
  {
    const g = new THREE.Group();
    const body = cylX(0.026, 0.03, M.alu); g.add(body);
    const gear = gearX(0.024, 18, 0.008, M.steel); gear.position.x = 0.022; g.add(gear);
    const pipe = tubeCurve([[0,-0.005,0],[0,-0.045,0.0],[-0.03,-0.075,-0.02]], 0.007, M.alu); g.add(pipe);
    const strainer = rbox(0.07, 0.014, 0.05, 0.006, M.steelDark); strainer.position.set(-0.045,-0.082,-0.02); g.add(strainer);
    g.position.set(0.05, -0.055, 0.075);
    addPart(g, {name:"Pompe à huile & crépine", rep:"REP. 9b",
      desc:"Pompe trochoïde entraînée par pignon depuis l'embrayage. La crépine plonge dans le carter d'huile et protège le circuit des impuretés.",
      mat:"Corps aluminium, rotors acier fritté", dir:[0,-1,0.12], dist:0.6, stag:0.48});
  }

  /* ---------- gicleurs d'huile (fond de carter, microfiche rep. 9) ---------- */
  {
    const g = new THREE.Group();
    for(const x of BORE_X){
      const jet = mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.018, 10), M.brass);
      jet.position.set(x, 0, 0); jet.rotation.x = rad(-14); g.add(jet);
    }
    g.position.set(0, 0.035, -0.045);
    addPart(g, {name:"Gicleurs de fond de piston ×3", rep:"REP. 9",
      desc:"Trois injecteurs en laiton vissés dans le carter supérieur : ils pulvérisent l'huile sous la calotte des pistons pour les refroidir à pleine charge.",
      mat:"Laiton décolleté", dir:[0,-0.85,0.5], dist:0.3, stag:0.52});
  }

  /* ---------- pions de centrage (microfiche rep. 8) ---------- */
  {
    const g = new THREE.Group();
    for(const x of [-0.17, 0.17]){
      const d = mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.022, 14), M.chrome);
      d.position.set(x, 0, 0.14); g.add(d);
      const d2 = d.clone(); d2.position.z = -0.1; g.add(d2);
    }
    g.position.set(0, -0.002, 0);
    addPart(g, {name:"Pions de centrage de carter ×4", rep:"REP. 8",
      desc:"Douilles rectifiées qui alignent les deux demi-carters au centième avant serrage — l'alignement des paliers de vilebrequin en dépend.",
      mat:"Acier rectifié", dir:[0,-0.55,0.84], dist:0.26, stag:0.58});
  }

  /* ---------- arbre reniflard (microfiche rep. 2-6) ---------- */
  {
    const g = new THREE.Group();
    const shaft = cylX(0.007, 0.3, M.steelDark); g.add(shaft);
    for(const x of [-0.12, 0, 0.12]){
      const o = mesh(new THREE.TorusGeometry(0.0085, 0.0022, 8, 24), M.rubber);
      o.rotation.y = Math.PI/2; o.position.x = x; g.add(o);
    }
    const cap = cylX(0.012, 0.02, M.alu); cap.position.x = 0.155; g.add(cap);
    g.position.set(0, 0.115, 0.125);
    addPart(g, {name:"Arbre de reniflard & joints toriques", rep:"REP. 2–6",
      desc:"Tube rotatif logé en haut du carter : il sépare l'huile des gaz de blow-by avant leur recyclage vers l'admission. Étanché par trois joints toriques.",
      mat:"Acier, joints NBR", dir:[0,0.25,0.97], dist:0.3, stag:0.46});
  }

  /* ---------- vilebrequin ---------- */
  {
    const g = new THREE.Group();
    const mains = [-0.135, -0.045, 0.045, 0.135];
    for(const x of mains){ const j = cylX(0.0235, 0.024, M.chrome); j.position.x = x; g.add(j); }
    // manetons à 120° + toiles contrepoids
    const pinsA = [0, rad(120), rad(240)];
    BORE_X.forEach((bx, i)=>{
      const a = pinsA[i];
      const off = new THREE.Vector3(0, Math.cos(a)*CRANK_R, Math.sin(a)*CRANK_R);
      const pin = cylX(0.016, 0.024, M.chrome);
      pin.position.set(bx, off.y, off.z); g.add(pin);
      for(const s of [-1,1]){
        const web = mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.011, 36), M.steelDark);
        web.rotation.z = Math.PI/2; web.position.set(bx + s*0.0175, 0, 0); g.add(web);
        const cw = rbox(0.011, 0.032, 0.05, 0.005, M.steelDark);
        cw.position.set(bx + s*0.0175, -off.y*1.45, -off.z*1.45); g.add(cw);
      }
    });
    // sortie droite : pignon primaire + pignon de distribution
    const prim = gearX(0.047, 34, 0.014, M.steel, 0.02); prim.position.x = 0.168; g.add(prim);
    const dsprk = gearX(0.019, 15, 0.009, M.steel, 0.008); dsprk.position.x = 0.185; g.add(dsprk);
    // sortie gauche : cône d'alternateur
    const nose = mesh(new THREE.CylinderGeometry(0.014, 0.019, 0.035, 20), M.steel);
    nose.rotation.z = Math.PI/2; nose.position.x = -0.175; g.add(nose);
    addPart(g, {name:"Vilebrequin — calage 120°", rep:"REP. 10",
      desc:"Vilebrequin forgé, manetons calés à 120° : la signature sonore du trois cylindres Triumph. Porte le pignon de primaire et le pignon de chaîne de distribution côté droit.",
      mat:"Acier forgé, portées rectifiées et polies", dir:[0,-1,0], dist:0.24, stag:0.44, spin:['x',0.75]});
  }

  /* ---------- coussinets de paliers (microfiche rep. 16) ---------- */
  {
    const gU = new THREE.Group();
    const mains = [-0.135, -0.045, 0.045, 0.135];
    mains.forEach((x,i)=>{
      const s = halfShell(0.0245, 0.02, 0.002); s.position.set(x, 0, 0);
      s.children[0].userData = {spread:(i-1.5)*0.02, bx:0}; gU.add(s);
    });
    gU.position.set(0,0,0);
    addPart(gU, {name:"Coussinets de vilebrequin — demi-coquilles sup.", rep:"REP. 16",
      desc:"Demi-coquilles minces à couche de glissement, appariées par classes de couleur gravées sur le carter. Les quatre coussinets supérieurs restent dans le demi-carter haut.",
      mat:"Acier / alliage d'aluminium-étain", dir:[0,0.35,-0.94], dist:0.3, stag:0.5});

    const gL = new THREE.Group();
    mains.forEach((x,i)=>{
      const s = halfShell(0.0245, 0.02, 0.002); s.position.set(x, 0, 0);
      s.rotation.x = Math.PI;
      s.children[0].userData = {spread:(i-1.5)*0.02, bx:0}; gL.add(s);
    });
    addPart(gL, {name:"Coussinets de vilebrequin — demi-coquilles inf.", rep:"REP. 16",
      desc:"Coussinets inférieurs logés dans le demi-carter bas. Le jeu de fonctionnement se mesure au plastigage lors du remontage.",
      mat:"Acier / alliage d'aluminium-étain", dir:[0,-0.5,-0.87], dist:0.5, stag:0.52});
  }

  /* ---------- arbre d'équilibrage ---------- */
  {
    const g = new THREE.Group();
    const shaft = cylX(0.011, 0.3, M.steelDark); g.add(shaft);
    for(const x of [-0.07, 0.07]){
      const w = mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.03, 28, 1, false, 0, Math.PI), M.steelDark);
      w.rotation.z = Math.PI/2; w.position.x = x; g.add(w);
    }
    const gr = gearX(0.032, 24, 0.01, M.steel, 0.012); gr.position.x = 0.14; g.add(gr);
    g.position.set(0, -0.01, -0.1);
    addPart(g, {name:"Arbre d'équilibrage", rep:"REP. 12",
      desc:"Contre-arbre à masselottes tournant en sens inverse du vilebrequin : il annule le couple de basculement résiduel du trois cylindres.",
      mat:"Acier, masselottes usinées", dir:[0,-0.15,-0.99], dist:0.36, stag:0.36, spin:['x',-0.5]});
  }

  /* ---------- pistons + bielles (position réelle à 120°) ---------- */
  {
    const pinsA = [0, rad(120), rad(240)];
    BORE_X.forEach((bx, i)=>{
      const g = new THREE.Group();
      const a = pinsA[i];
      // hauteur du piston le long de l'axe de fût pour cet angle de vilebrequin
      const h = CRANK_R*Math.cos(a) + Math.sqrt(ROD_L*ROD_L - Math.pow(CRANK_R*Math.sin(a),2));
      // piston
      const piston = latheP([[0,0.030],[0.024,0.030],[0.0325,0.024],[0.0325,0.018],[0.0305,0.017],[0.0325,0.016],[0.0325,0.010],[0.0305,0.009],[0.0325,0.008],[0.0325,-0.016],[0.028,-0.02],[0.02,-0.021]], M.aluBright);
      const pg = new THREE.Group(); pg.add(piston);
      for(const ry of [0.017, 0.009]){
        const ring = mesh(new THREE.TorusGeometry(0.0327, 0.0012, 8, 44), M.steelDark);
        ring.rotation.x = Math.PI/2; ring.position.y = ry; pg.add(ring);
      }
      const pinB = cylX(0.009, 0.052, M.chrome); pinB.position.y = -0.004; pg.add(pinB);
      pg.position.copy(bp(h, 0, 0));
      pg.rotation.copy(TILT);
      g.add(pg);
      // bielle : du maneton au pied de piston
      const big = new THREE.Vector3(0, Math.cos(a)*CRANK_R, Math.sin(a)*CRANK_R);
      const small = bp(h - 0.004, 0, 0);
      const dir = small.clone().sub(big);
      const mid = big.clone().addScaledVector(dir, 0.5);
      const rod = rbox(0.014, dir.length()-0.03, 0.019, 0.005, M.steel);
      rod.position.copy(mid);
      rod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
      g.add(rod);
      const bigEnd = cylX(0.021, 0.021, M.steel); bigEnd.position.copy(big); g.add(bigEnd);
      const capLine = cylX(0.0215, 0.004, M.steelDark); capLine.position.copy(big); g.add(capLine);
      const smallEnd = cylX(0.0135, 0.02, M.steel); smallEnd.position.copy(small); g.add(smallEnd);
      g.position.x = bx;
      addPart(g, {name:`Piston & bielle — cylindre ${i+1}`, rep:"REP. 13/14",
        desc:`Piston forgé à jupe courte (Ø 74 mm), deux segments de feu + racleur, axe flottant. La bielle fracturée est serrée à l'angle. Calage à ${[0,120,240][i]}° de vilebrequin.`,
        mat:"Piston aluminium forgé, bielle acier fracturé", dir:[BORE.x, BORE.y, BORE.z], dist:0.34+0.045*i, stag:0.30+0.03*i});
    });
  }

  /* ---------- joint de culasse ---------- */
  {
    const g = new THREE.Group();
    const shape = new THREE.Shape();
    const w=0.154, d=0.093; // au ras de la culasse : seule une fine ligne de joint affleure
    shape.moveTo(-w,-d); shape.lineTo(w,-d); shape.lineTo(w,d); shape.lineTo(-w,d); shape.closePath();
    for(const x of BORE_X){
      const h = new THREE.Path(); h.absarc(x, 0, 0.0375, 0, Math.PI*2, true); shape.holes.push(h);
    }
    for(const [hx,hz] of [[-0.135,-0.075],[0.135,-0.075],[-0.135,0.075],[0.135,0.075],[0,-0.082],[0,0.082]]){
      const h = new THREE.Path(); h.absarc(hx, hz, 0.006, 0, Math.PI*2, true); shape.holes.push(h);
    }
    const geo = new THREE.ExtrudeGeometry(shape, {depth:0.0035, bevelEnabled:false});
    geo.rotateX(-Math.PI/2);
    const m = mesh(geo, M.gasket); g.add(m);
    const ring2 = m.clone(); ring2.scale.set(0.99,1.6,0.99); ring2.material = M.gasketDark; ring2.position.y=-0.001; g.add(ring2);
    g.position.copy(bp(0.246)); g.rotation.copy(TILT);
    addPart(g, {name:"Joint de culasse multicouches", rep:"REP. 15",
      desc:"Joint MLS trois feuillards inox sertis, viroles de feu autour de chaque fût. Se remplace à chaque dépose de culasse.",
      mat:"Acier inox multicouches (MLS)", dir:[BORE.x, BORE.y, BORE.z], dist:0.38, stag:0.26});
  }

  /* ---------- goujons de culasse ---------- */
  {
    const g = new THREE.Group();
    for(const [x,z] of [[-0.135,-0.07],[0,-0.07],[0.135,-0.07],[-0.135,0.07],[0,0.07],[0.135,0.07]]){
      const st = mesh(new THREE.CylinderGeometry(0.0052, 0.0052, 0.19, 12), M.chrome);
      st.position.copy(bp(0.19, z, x)); st.rotation.copy(TILT); g.add(st);
      const nut = mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.011, 6), M.steel);
      nut.position.copy(bp(0.29, z, x)); nut.rotation.copy(TILT); g.add(nut);
    }
    addPart(g, {name:"Goujons de culasse ×6", rep:"REP. 7",
      desc:"Goujons longs traversant la culasse jusqu'au carter : serrage angulaire en trois passes, en spirale depuis le centre.",
      mat:"Acier classe 12.9, phosphaté", dir:[BORE.x, BORE.y, BORE.z], dist:0.85, stag:0.10});
  }

  /* ---------- culasse ---------- */
  {
    const g = new THREE.Group();
    const head = rbox(0.318, 0.105, 0.208, 0.018, M.case); g.add(head);
    // ailettes décoratives latérales
    for(let i=0;i<2;i++){
      const f = rbox(0.322, 0.008, 0.19, 0.003, M.caseDark); f.position.y = -0.028+0.022*i; g.add(f);
    }
    // pipes d'échappement (avant, inclinées vers le bas)
    for(const x of BORE_X){
      const port = mesh(new THREE.CylinderGeometry(0.021, 0.024, 0.035, 22), M.caseDark);
      port.position.set(x, -0.02, -0.112); port.rotation.x = rad(115); g.add(port);
      const flange = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.007, 22), M.steelDark);
      flange.position.set(x, -0.028, -0.125); flange.rotation.x = rad(115); g.add(flange);
      for(const s of [-1,1]){
        const stud = mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.022, 8), M.steel);
        stud.position.set(x+s*0.023, -0.028, -0.128); stud.rotation.x = rad(115); g.add(stud);
      }
    }
    // conduits d'admission (arrière, remontants)
    for(const x of BORE_X){
      const port = mesh(new THREE.CylinderGeometry(0.026, 0.024, 0.04, 22), M.case);
      port.position.set(x, 0.012, 0.112); port.rotation.x = rad(65); g.add(port);
    }
    // puits de bougie
    for(const x of BORE_X){
      const well = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 18), M.caseDark);
      well.position.set(x, 0.055, 0); g.add(well);
    }
    // boîtier de thermostat (arrière gauche) + sortie d'eau
    const thermo = mesh(new THREE.CylinderGeometry(0.023, 0.023, 0.03, 20), M.alu);
    thermo.position.set(-0.115, 0.045, 0.09); thermo.rotation.x = rad(60); g.add(thermo);
    const barb = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.035, 14), M.alu);
    barb.position.set(-0.115, 0.06, 0.115); barb.rotation.x = rad(105); g.add(barb);
    g.position.copy(bp(0.302)); g.rotation.copy(TILT);
    addPart(g, {name:"Culasse 12 soupapes", rep:"REP. 17",
      desc:"Culasse DACT à 4 soupapes par cylindre, conduits d'admission redressés et sièges rapportés. Sortie d'eau et boîtier de thermostat côté gauche.",
      mat:"Aluminium coulé basse pression, usiné CN", dir:[BORE.x, BORE.y, BORE.z], dist:0.52, stag:0.20});
  }

  /* ---------- pipes d'admission (manchons caoutchouc, photo arrière) ---------- */
  {
    const g = new THREE.Group();
    BORE_X.forEach((x)=>{
      const boot = mesh(new THREE.CylinderGeometry(0.03, 0.026, 0.045, 24), M.rubber);
      boot.position.set(x, 0, 0); boot.rotation.x = rad(65); g.add(boot);
      const lip = mesh(new THREE.TorusGeometry(0.0305, 0.0025, 8, 30), M.rubber);
      lip.position.set(x, 0.019, -0.009); lip.rotation.x = rad(-25); g.add(lip);
      const clamp = mesh(new THREE.TorusGeometry(0.029, 0.0016, 6, 30), M.steel);
      clamp.position.set(x, -0.013, 0.005); clamp.rotation.x = rad(-25); g.add(clamp);
    });
    g.position.copy(bp(0.302)).add(new THREE.Vector3(0, 0.053, 0.131));
    g.rotation.copy(TILT);
    addPart(g, {name:"Pipes d'admission ×3", rep:"REP. 18",
      desc:"Manchons caoutchouc reliant la culasse aux corps d'injection Ø 44 mm, colliers à vis sans fin. Visibles à l'arrière du bloc sur les photos d'atelier.",
      mat:"EPDM renforcé, colliers inox", dir:[0, 0.45, 0.89], dist:0.34, stag:0.18});
  }

  /* ---------- arbres à cames ×2 + pignons ---------- */
  function camshaft(zSign){
    const g = new THREE.Group();
    const shaft = cylX(0.0105, 0.295, M.steel); g.add(shaft);
    const lobeGeo = new THREE.CylinderGeometry(0.0148, 0.0148, 0.011, 24);
    lobeGeo.rotateZ(Math.PI/2); // axe de la came = X, cuit dans la géométrie
    BORE_X.forEach((x,i)=>{
      const phase = rad(120*i + (zSign>0?25:-25));
      for(const s of [-1,1]){
        const lobe = mesh(lobeGeo, M.steelDark);
        lobe.scale.set(1, 1.35, 1.35);
        // excentration du nez de came autour de l'axe
        lobe.position.set(x + s*0.017, Math.cos(phase)*0.006, Math.sin(phase)*0.006);
        g.add(lobe);
      }
      const journ = cylX(0.013, 0.01, M.chrome); journ.position.x = x+0.042; g.add(journ);
    });
    const sprk = gearX(0.041, 34, 0.008, M.steel, 0.018); sprk.position.x = 0.14; g.add(sprk);
    return g;
  }
  {
    const g = camshaft(-1);
    g.position.copy(bp(0.335, -0.047)); g.rotation.copy(TILT);
    addPart(g, {name:"Arbre à cames d'échappement", rep:"REP. 19",
      desc:"AAC échappement entraîné par chaîne silencieuse, six cames en acier trempé. Le repérage des pignons se fait au plan de joint, moteur au PMH cylindre 1.",
      mat:"Acier de cémentation, cames rectifiées", dir:[0, 0.93, -0.37], dist:0.66, stag:0.14, spin:['x',0.4]});
  }
  {
    const g = camshaft(1);
    g.position.copy(bp(0.335, 0.047)); g.rotation.copy(TILT);
    addPart(g, {name:"Arbre à cames d'admission", rep:"REP. 20",
      desc:"AAC admission, profil plus pointu pour le remplissage à haut régime. Tourne à demi-vitesse du vilebrequin sur paliers directs dans la culasse.",
      mat:"Acier de cémentation, cames rectifiées", dir:[0, 0.96, -0.06], dist:0.72, stag:0.12, spin:['x',-0.4]});
  }

  /* ---------- chaîne de distribution ---------- */
  {
    const g = new THREE.Group();
    const x = 0.14;
    const cE = bp(0.335, -0.047, x), cI = bp(0.335, 0.047, x);
    const up = BORE.clone();
    const pts = [];
    const push = v => pts.push([v.x, v.y, v.z]);
    push(cE.clone().addScaledVector(up, 0.045));
    push(cI.clone().addScaledVector(up, 0.045));
    push(cI.clone().add(new THREE.Vector3(0, 0, 0.052)));
    push(new THREE.Vector3(x, 0.02, 0.032));
    push(new THREE.Vector3(x, -0.026, 0));
    push(new THREE.Vector3(x, 0.02, -0.05));
    push(cE.clone().add(new THREE.Vector3(0, 0, -0.055)));
    const chain = tubeCurve(pts, 0.0052, M.blackSatin, true);
    g.add(chain);
    // patin tendeur
    const blade = rbox(0.008, 0.2, 0.014, 0.004, M.plastic);
    blade.position.set(x, 0.14, 0.052); blade.rotation.x = rad(-8); g.add(blade);
    addPart(g, {name:"Chaîne de distribution & patin tendeur", rep:"REP. 21",
      desc:"Chaîne silencieuse à maillons dentés dans le tunnel droit du bloc, guidée par deux patins et un tendeur hydraulique.",
      mat:"Chaîne acier, patins polyamide", dir:[0.55, 0.78, -0.3], dist:0.5, stag:0.16});
  }

  /* ---------- bobines crayon ---------- */
  {
    const g = new THREE.Group();
    BORE_X.forEach(x=>{
      const stick = mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.055, 16), M.plastic);
      stick.position.set(x, 0, 0); g.add(stick);
      const con = rbox(0.018, 0.02, 0.024, 0.005, M.plastic); con.position.set(x, 0.036, 0.006); g.add(con);
    });
    g.position.copy(bp(0.362)); g.rotation.copy(TILT);
    addPart(g, {name:"Bobines crayon ×3", rep:"REP. 22",
      desc:"Bobines à décharge directe enfichées dans les puits de bougie, entre les deux bossages du couvre-culasse.",
      mat:"Corps PBT surmoulé", dir:[BORE.x, BORE.y, BORE.z], dist:0.78, stag:0.02});
  }

  /* ---------- couvre-culasse (noir grainé, deux bossages — photos) ---------- */
  {
    const g = new THREE.Group();
    const base = rbox(0.305, 0.03, 0.192, 0.012, M.crinkle); g.add(base);
    for(const zs of [-1, 1]){
      const hump = rbox(0.29, 0.052, 0.062, 0.024, M.crinkle);
      hump.position.set(0, 0.026, zs*0.058); g.add(hump);
    }
    const recess = rbox(0.27, 0.02, 0.05, 0.008, M.blackSatin); recess.position.y = 0.014; g.add(recess);
    // badge fondeur
    const badge = triumphLogo(0.02, 0.003, M.crinkle);
    badge.position.set(-0.09, 0.053, -0.058); badge.rotation.x = -Math.PI/2; g.add(badge);
    // durite de reniflard vers l'arrière
    const vent = tubeCurve([[0.06,0.02,0.09],[0.07,0.05,0.13],[0.05,0.06,0.19]], 0.0085, M.hose); g.add(vent);
    g.position.copy(bp(0.368)); g.rotation.copy(TILT);
    addPart(g, {name:"Couvre-culasse", rep:"REP. 23",
      desc:"Couvercle en alliage à peinture noire grainée, deux bossages coiffant les arbres à cames et gorge centrale pour les bobines — fidèle aux photos d'atelier. Joint périphérique réutilisable.",
      mat:"Aluminium, peinture texturée haute température", dir:[BORE.x, BORE.y, BORE.z], dist:0.88, stag:0.04});
  }
  /* vis du couvre-culasse */
  {
    const g = new THREE.Group();
    for(const [x,z] of [[-0.13,-0.08],[0,-0.085],[0.13,-0.08],[-0.13,0.08],[0,0.085],[0.13,0.08],[-0.145,0],[0.145,0]]){
      const b = boltG(0.0065, 0.02);
      b.position.copy(bp(0.388, z, x)); b.rotation.copy(TILT); g.add(b);
    }
    addPart(g, {name:"Vis de couvre-culasse ×8", rep:"REP. 24",
      desc:"Vis épaulées à rondelles d'étanchéité caoutchouc, serrées en croix à 10 N·m.",
      mat:"Acier zingué noir", dir:[BORE.x, BORE.y, BORE.z], dist:1.05, stag:0.0});
  }

  /* ---------- EMBRAYAGE (côté droit) ---------- */
  const CL = {x:0.155, y:-0.012, z:0.128}; // axe d'embrayage = arbre primaire
  {
    // cloche + pignon de primaire
    const g = new THREE.Group();
    const drum = latheP([[0.03,0],[0.079,0],[0.081,0.01],[0.081,0.052],[0.075,0.052],[0.075,0.012],[0.03,0.012]], M.alu);
    drum.rotation.z = -Math.PI/2; g.add(drum);
    for(let i=0;i<12;i++){
      const a = i/12*Math.PI*2;
      const finger = rbox(0.046, 0.012, 0.016, 0.004, M.alu);
      finger.position.set(0.028, Math.sin(a)*0.076, Math.cos(a)*0.076);
      finger.rotation.x = -a; g.add(finger);
    }
    const ring = gearX(0.088, 62, 0.012, M.steel, 0.06); ring.position.x = -0.005; g.add(ring);
    g.position.set(CL.x, CL.y, CL.z);
    addPart(g, {name:"Cloche d'embrayage & couronne primaire", rep:"REP. 25",
      desc:"Cloche à douze doigts recevant les disques garnis, couronne de primaire à denture droite en prise avec le vilebrequin, amortie par ressorts.",
      mat:"Aluminium coulé, couronne acier", dir:[1,0,0], dist:0.2, stag:0.36, spin:['x',0.35]});
  }
  {
    // pile de disques : 5 garnis + 4 lisses, écartés à l'éclaté
    const g = new THREE.Group();
    for(let i=0;i<9;i++){
      const friction = i%2===0;
      const d = mesh(new THREE.CylinderGeometry(friction?0.074:0.068, friction?0.074:0.068, 0.0028, 40), friction?M.friction:M.steel);
      d.rotation.z = Math.PI/2;
      d.position.x = 0.012 + i*0.0042;
      d.userData = {bx:d.position.x, spread:i*0.008};
      g.add(d);
    }
    g.position.set(CL.x, CL.y, CL.z);
    addPart(g, {name:"Disques d'embrayage — garnis & lisses", rep:"REP. 26",
      desc:"Empilage alterné : disques garnis liège/kevlar entraînés par la cloche, disques lisses acier par la noix. L'éclaté révèle l'alternance complète.",
      mat:"Garnitures organiques / acier rectifié", dir:[1,0,0], dist:0.3, stag:0.28});
  }
  {
    // plateau de pression + ressorts + noix
    const g = new THREE.Group();
    const hub = latheP([[0.012,0],[0.045,0],[0.05,0.008],[0.05,0.03],[0.02,0.032]], M.alu);
    hub.rotation.z = -Math.PI/2; hub.position.x = 0.008; g.add(hub);
    const plate = latheP([[0.012,0],[0.066,0],[0.07,0.006],[0.07,0.014],[0.02,0.018]], M.machined);
    plate.rotation.z = -Math.PI/2; plate.position.x = 0.052; g.add(plate);
    for(let i=0;i<5;i++){
      const a = i/5*Math.PI*2;
      const sp = springX(0.007, 0.02, 4, 0.0016);
      sp.position.set(0.062, Math.sin(a)*0.042, Math.cos(a)*0.042); g.add(sp);
      const b = boltG(0.006, 0.014); b.rotation.z = -Math.PI/2;
      b.position.set(0.072, Math.sin(a)*0.042, Math.cos(a)*0.042); g.add(b);
    }
    g.position.set(CL.x, CL.y, CL.z);
    addPart(g, {name:"Noix, plateau de pression & ressorts", rep:"REP. 27",
      desc:"La noix cannelée solidarise les disques lisses avec l'arbre primaire ; cinq ressorts hélicoïdaux plaquent le plateau — commande par came à billes assistée anti-dribble.",
      mat:"Aluminium usiné, ressorts au silicium-chrome", dir:[1,0,0], dist:0.44, stag:0.20});
  }
  {
    // couvercle d'embrayage — grande pièce ronde gunmetal, logo Triumph (photo droite)
    const g = new THREE.Group();
    const dome = latheP([[0.0,0.036],[0.026,0.035],[0.05,0.031],[0.072,0.024],[0.088,0.014],[0.098,0.005],[0.101,0],[0.101,-0.006],[0.096,-0.008]], M.machined);
    dome.rotation.z = -Math.PI/2; g.add(dome);
    const step1 = mesh(new THREE.TorusGeometry(0.078, 0.0032, 8, 56), M.machined);
    step1.rotation.y = Math.PI/2; step1.position.x = 0.019; g.add(step1);
    const step2 = mesh(new THREE.TorusGeometry(0.052, 0.0028, 8, 48), M.machined);
    step2.rotation.y = Math.PI/2; step2.position.x = 0.03; g.add(step2);
    // embase circulaire venue de fonderie (ferme le flanc du carter)
    const spigot = cylX(0.103, 0.016, M.machined); spigot.position.x = -0.012; g.add(spigot);
    // cerclage périphérique
    const rim2 = mesh(new THREE.TorusGeometry(0.0995, 0.004, 12, 64), M.machined);
    rim2.rotation.y = Math.PI/2; rim2.position.x = 0.0; g.add(rim2);
    // logo Triumph embouti au centre (même finition que le couvercle)
    const logo = triumphLogo(0.021, 0.0035, M.machined);
    logo.rotation.y = Math.PI/2; logo.position.set(0.0375, 0.004, 0); g.add(logo);
    // bouchon de remplissage d'huile (photo : dessus-avant du couvercle)
    const filler = mesh(new THREE.CylinderGeometry(0.016, 0.017, 0.012, 24), M.blackSatin);
    filler.rotation.z = -Math.PI/2; filler.position.set(0.02, 0.05, -0.044); filler.rotation.x = rad(25); g.add(filler);
    g.position.set(CL.x + 0.055, CL.y, CL.z);
    addPart(g, {name:"Couvercle d'embrayage", rep:"REP. 28",
      desc:"Le grand couvercle circulaire gris canon des photos, badge Triumph embouti en son centre et bouchon de remplissage d'huile sur le dessus. Joint papier neuf à chaque dépose.",
      mat:"Aluminium moulé, finition gunmetal satiné", dir:[1,0,0], dist:0.62, stag:0.10});
  }
  {
    const g = boltRingX(10, 0.093, CL.x + 0.052, CL.y, CL.z, 1);
    addPart(g, {name:"Vis de couvercle d'embrayage ×10", rep:"REP. 29",
      desc:"Vis à embase crantée M6, serrage en croix à 9 N·m sur joint papier.",
      mat:"Acier zingué", dir:[1,0,0], dist:0.82, stag:0.06});
  }

  /* ---------- ALTERNATEUR (côté gauche) ---------- */
  const AL = {x:-0.16, y:0.005, z:0.02};
  {
    const g = new THREE.Group();
    const rotor = latheP([[0.02,0],[0.054,0],[0.057,0.008],[0.057,0.042],[0.03,0.045],[0.018,0.045]], M.steelDark);
    rotor.rotation.z = Math.PI/2; g.add(rotor);
    const boss = cylX(0.014, 0.02, M.steel); boss.position.x = -0.028; g.add(boss);
    g.position.set(AL.x, AL.y, AL.z);
    addPart(g, {name:"Rotor d'alternateur", rep:"REP. 30",
      desc:"Volant magnétique à aimants permanents claveté en bout de vilebrequin — il fait aussi office de masse d'inertie pour la régularité cyclique.",
      mat:"Acier, aimants néodyme frittés", dir:[-1,0,0], dist:0.22, stag:0.24, spin:['x',-0.4]});
  }
  {
    const g = new THREE.Group();
    const core = mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.03, 18), M.steelDark);
    core.rotation.z = Math.PI/2; g.add(core);
    for(let i=0;i<12;i++){
      const a = i/12*Math.PI*2;
      const coil = rbox(0.026, 0.017, 0.02, 0.006, M.copper);
      coil.position.set(0, Math.sin(a)*0.036, Math.cos(a)*0.036);
      coil.rotation.x = -a; g.add(coil);
    }
    const wires = tubeCurve([[0.01,0.04,0],[0.02,0.07,0.02],[0.05,0.09,0.06]], 0.005, M.rubber); g.add(wires);
    g.position.set(AL.x - 0.025, AL.y, AL.z);
    addPart(g, {name:"Stator d'alternateur", rep:"REP. 31",
      desc:"Stator triphasé douze pôles vissé dans le couvercle, bobinages cuivre émaillé vernis. Sortie par câble surmoulé vers le régulateur.",
      mat:"Tôles magnétiques, cuivre émaillé", dir:[-1,0,0], dist:0.38, stag:0.32});
  }
  {
    const g = new THREE.Group();
    const dome = latheP([[0.0,0.036],[0.018,0.036],[0.042,0.032],[0.06,0.026],[0.072,0.018],[0.08,0.008],[0.081,0],[0.081,-0.006],[0.076,-0.008]], M.machined);
    dome.rotation.z = Math.PI/2; g.add(dome);
    const step = mesh(new THREE.TorusGeometry(0.062, 0.003, 8, 48), M.machined);
    step.rotation.y = Math.PI/2; step.position.x = -0.024; g.add(step);
    // embase circulaire côté carter
    const spigot = cylX(0.085, 0.016, M.machined); spigot.position.x = 0.014; g.add(spigot);
    // décalque « TRIUMPH RECOMMENDS » (photo gauche)
    const decal = mesh(new THREE.PlaneGeometry(0.038, 0.019),
      new THREE.MeshBasicMaterial({map:decalTex([
        {t:'TRIUMPH', y:38, size:26, bold:true},
        {t:'RECOMMENDS', y:66, size:18},
        {t:'— lubrifiants moteur —', y:98, size:13}
      ])}));
    decal.rotation.y = -Math.PI/2; decal.position.set(-0.0375, -0.002, 0.01); g.add(decal);
    g.position.set(-0.214, AL.y, AL.z);
    addPart(g, {name:"Couvercle d'alternateur", rep:"REP. 32",
      desc:"Couvercle bombé gris canon portant l'étiquette « Triumph recommends » visible sur les photos. Protège rotor et stator, avec passage de câble étanché.",
      mat:"Aluminium moulé, gunmetal satiné", dir:[-1,0,0], dist:0.5, stag:0.12});
  }
  {
    const g = boltRingX(8, 0.076, -0.216, AL.y, AL.z, -1);
    addPart(g, {name:"Vis de couvercle d'alternateur ×8", rep:"REP. 33",
      desc:"Vis à embase M6 — deux plus longues repérées en bas du couvercle.",
      mat:"Acier zingué", dir:[-1,0,0], dist:0.68, stag:0.08});
  }

  /* ---------- démarreur ---------- */
  {
    const g = new THREE.Group();
    const body = cylX(0.026, 0.088, M.blackSatin); g.add(body);
    const cap = cylX(0.027, 0.012, M.alu); cap.position.x = 0.045; g.add(cap);
    const lug = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.012, 10), M.brass);
    lug.position.set(0.04, 0.028, 0); g.add(lug);
    const pin = gearX(0.011, 10, 0.014, M.steel); pin.position.x = -0.052; g.add(pin);
    g.position.set(0.03, 0.158, 0.112);
    addPart(g, {name:"Démarreur électrique", rep:"REP. 34",
      desc:"Démarreur à aimants permanents logé derrière le bloc-cylindres, attaquant la roue libre du rotor via un pignon intermédiaire.",
      mat:"Carter acier, flasques aluminium", dir:[0, 0.72, 0.7], dist:0.3, stag:0.22});
  }

  /* ---------- BOÎTE DE VITESSES ---------- */
  {
    // arbre primaire (même axe que l'embrayage)
    const g = new THREE.Group();
    const shaft = cylX(0.013, 0.3, M.steel); g.add(shaft);
    const radii = [0.030, 0.043, 0.034, 0.046, 0.038, 0.049];
    radii.forEach((r,i)=>{
      const gr = gearX(r, Math.round(r*550), 0.014, i%2?M.steel:M.steelDark, 0.014);
      gr.position.x = -0.1 + i*0.038; g.add(gr);
    });
    g.position.set(0, CL.y, CL.z);
    addPart(g, {name:"Arbre primaire de boîte — 6 rapports", rep:"REP. 35",
      desc:"Arbre d'entrée cannelé portant les pignons menants ; l'embrayage est monté à son extrémité droite. Pignons fous alésés bronze, pignons baladeurs à crabots.",
      mat:"Acier cémenté, denture rasée", dir:[0.25, -0.05, 0.97], dist:0.34, stag:0.40, spin:['x',0.3]});
  }
  {
    // arbre secondaire
    const g = new THREE.Group();
    const shaft = cylX(0.014, 0.31, M.steel); g.add(shaft);
    const radii = [0.049, 0.036, 0.045, 0.033, 0.041, 0.030];
    radii.forEach((r,i)=>{
      const gr = gearX(r, Math.round(r*550), 0.014, i%2?M.steelDark:M.steel, 0.015);
      gr.position.x = -0.1 + i*0.038; g.add(gr);
    });
    g.position.set(0, -0.052, 0.196);
    addPart(g, {name:"Arbre secondaire de boîte", rep:"REP. 36",
      desc:"Arbre de sortie sous le primaire, pignons menés en prise constante. Sa sortie gauche cannelée reçoit le pignon de chaîne finale.",
      mat:"Acier cémenté", dir:[-0.15, -0.12, 0.98], dist:0.42, stag:0.44, spin:['x',-0.3]});
  }
  {
    // barillet + fourchettes
    const g = new THREE.Group();
    const drum = cylX(0.021, 0.27, M.steelDark); g.add(drum);
    for(let i=0;i<4;i++){
      const gr = mesh(new THREE.TorusGeometry(0.0215, 0.0022, 6, 30), M.blackSatin);
      gr.rotation.y = Math.PI/2; gr.position.x = -0.09+i*0.06; g.add(gr);
    }
    for(let i=0;i<3;i++){
      const fork = mesh(new THREE.TorusGeometry(0.036, 0.004, 8, 30, Math.PI), M.alu);
      fork.rotation.y = Math.PI/2; fork.rotation.x = Math.PI/2;
      fork.position.set(-0.07+i*0.07, 0.02, 0); g.add(fork);
      const rail = cylX(0.0045, 0.05, M.chrome); rail.position.set(-0.07+i*0.07, 0.018, 0.018); g.add(rail);
    }
    const star = gearX(0.018, 6, 0.008, M.steel); star.position.x = 0.145; g.add(star);
    g.position.set(0, -0.084, 0.165);
    addPart(g, {name:"Barillet de sélection & fourchettes", rep:"REP. 37",
      desc:"Le barillet à trois pistes de came guide les fourchettes qui déplacent les baladeurs — un cran du barillet = un rapport. Étoile de verrouillage à galet.",
      mat:"Acier traité, fourchettes aluminium", dir:[0, -0.35, 0.94], dist:0.34, stag:0.48});
  }
  {
    // axe de sélecteur
    const g = new THREE.Group();
    const shaft = cylX(0.007, 0.24, M.steel); g.add(shaft);
    const spline = cylX(0.009, 0.025, M.steelDark); spline.position.x = -0.125; g.add(spline);
    const arm = rbox(0.05, 0.02, 0.006, 0.003, M.steelDark); arm.position.set(0.08, 0.02, 0); g.add(arm);
    g.position.set(-0.078, -0.102, 0.13);
    addPart(g, {name:"Axe de sélecteur", rep:"REP. 38",
      desc:"Traverse le carter de gauche à droite ; son extrémité cannelée gauche reçoit le sélecteur au pied. Rappel par ressort en épingle.",
      mat:"Acier, cannelures roulées", dir:[-1, -0.1, 0.25], dist:0.4, stag:0.34});
  }
  {
    // pignon de sortie de boîte
    const g = new THREE.Group();
    const spr = gearX(0.04, 15, 0.011, M.steel, 0.017); g.add(spr);
    const nut = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 6), M.steelDark);
    nut.rotation.z = Math.PI/2; g.add(nut);
    g.position.set(-0.2055, -0.052, 0.196);
    addPart(g, {name:"Pignon de sortie de boîte", rep:"REP. 39",
      desc:"Pignon de chaîne finale claveté sur l'arbre secondaire, freiné par rondelle pliée. C'est lui qu'abrite le carter noir visible côté gauche.",
      mat:"Acier traité anti-usure", dir:[-1, 0, 0.15], dist:0.56, stag:0.42});
  }
  {
    // carter de pignon (plastique noir, photo gauche)
    const g = new THREE.Group();
    const cov = rbox(0.014, 0.11, 0.13, 0.012, M.plastic); g.add(cov);
    for(let i=0;i<3;i++){
      const rib = rbox(0.016, 0.09, 0.008, 0.003, M.plastic);
      rib.position.set(0.002, 0, -0.04+i*0.04); g.add(rib);
    }
    g.position.set(-0.216, -0.048, 0.19);
    addPart(g, {name:"Carter de pignon de sortie", rep:"REP. 40",
      desc:"Cache noir nervuré vissé sur le demi-carter gauche : il canalise la graisse de chaîne et protège le pignon — la grande pièce sombre des photos côté gauche.",
      mat:"Polyamide chargé fibre", dir:[-1, -0.05, 0.3], dist:0.75, stag:0.14});
  }

  /* ---------- pompe à eau + durites (photos côté gauche) ---------- */
  {
    const g = new THREE.Group();
    const housing = latheP([[0.008,0],[0.03,0],[0.033,0.008],[0.033,0.03],[0.012,0.034]], M.alu);
    housing.rotation.z = Math.PI/2; g.add(housing);
    const imp = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.008, 8), M.alu);
    imp.rotation.z = Math.PI/2; imp.position.x = -0.012; g.add(imp);
    const barbUp = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.03, 14), M.alu);
    barbUp.position.set(-0.03, 0.03, 0.005); barbUp.rotation.z = rad(30); g.add(barbUp);
    const barbFr = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.03, 14), M.alu);
    barbFr.position.set(-0.028, -0.012, -0.03); barbFr.rotation.x = rad(80); g.add(barbFr);
    // grande durite qui enjambe le moteur jusqu'au thermostat (photo 3)
    const hoseTop = tubeCurve([
      [-0.045, 0.045, 0.01],[-0.05, 0.16, 0.06],[0.02, 0.26, 0.10],[0.087, 0.288, 0.112]
    ], 0.0125, M.hose); g.add(hoseTop);
    // durite basse qui plonge dans le ventre avant du carter
    const hoseLow = tubeCurve([
      [-0.042, -0.02, -0.045],[-0.03, -0.06, -0.075],[0.042, -0.09, -0.085]
    ], 0.0125, M.hose); g.add(hoseLow);
    for(const [px,py,pz] of [[-0.045,0.05,0.012],[-0.045,-0.02,-0.05]]){
      const cl = mesh(new THREE.TorusGeometry(0.0135, 0.002, 6, 24), M.steel);
      cl.position.set(px,py,pz); cl.rotation.x = Math.PI/3; g.add(cl);
    }
    g.position.set(-0.202, 0.09, -0.075);
    addPart(g, {name:"Pompe à eau & durites", rep:"REP. 41",
      desc:"Pompe centrifuge en bout d'arbre d'équilibrage, flasque gauche. La grosse durite coudée enjambe le bloc vers le thermostat — exactement comme sur les photos.",
      mat:"Corps aluminium, durites EPDM tressé", dir:[-0.75, 0.1, -0.65], dist:0.4, stag:0.18});
  }

  /* ---------- supports moteur (brackets noirs avant + platine alu arrière, photos) ---------- */
  {
    const g = new THREE.Group();
    for(const s of [-1,1]){
      const plate = rbox(0.012, 0.13, 0.05, 0.005, M.blackSatin);
      plate.position.set(s*0.166, 0.02, 0); g.add(plate);
      const hole = mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.016, 16), M.steelDark);
      hole.rotation.z = Math.PI/2; hole.position.set(s*0.166, 0.07, 0); g.add(hole);
    }
    g.position.copy(bp(0.30, -0.115)); g.rotation.copy(TILT);
    addPart(g, {name:"Supports moteur avant ×2", rep:"REP. 42",
      desc:"Pattes acier boulonnées de part et d'autre de la culasse : elles reprennent le moteur, élément porteur du cadre.",
      mat:"Acier découpé laser, cataphorèse noire", dir:[0, 0.25, -0.97], dist:0.36, stag:0.16});
  }
  {
    const g = new THREE.Group();
    const plate = rbox(0.014, 0.09, 0.06, 0.006, M.alu);
    g.add(plate);
    const hole = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.018, 16), M.steelDark);
    hole.rotation.z = Math.PI/2; hole.position.set(0, 0.04, 0.015); g.add(hole);
    g.position.set(0.148, 0.24, 0.075);
    addPart(g, {name:"Platine de fixation arrière", rep:"REP. 43",
      desc:"Platine aluminium taillée masse en sortie de culasse arrière droite — la pièce claire visible sur la photo de trois-quarts.",
      mat:"Aluminium 6082-T6 usiné", dir:[0.4, 0.35, 0.85], dist:0.34, stag:0.20});
  }

  return { group, parts };
}
