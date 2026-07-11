// fishSwarm.js — Boids + instancing GPU + huida del tiburón + animación independiente

export const params = {
  w_sep: 1.2, w_ali: 1.0, w_coh: 1.0,
  perceptionRadius: 6.0, maxSpeed: 3.5
};

export const createFlockingGUI = (paramsRef = params) => {
  if (typeof dat === "undefined") { console.warn("dat.GUI no cargado"); return null; }
  const gui = new dat.GUI({ width: 320 });
  gui.domElement.style.cssText = "position:fixed;top:10px;right:10px;z-index:30;";
  const f1 = gui.addFolder("Reglas de Reynolds");
  f1.add(paramsRef,"w_sep",0,3,0.1).name("Separación");
  f1.add(paramsRef,"w_ali",0,3,0.1).name("Alineación");
  f1.add(paramsRef,"w_coh",0,3,0.1).name("Cohesión");
  f1.open();
  const f2 = gui.addFolder("Configuración Global");
  f2.add(paramsRef,"perceptionRadius",2,15,0.5).name("Radio percepción");
  f2.add(paramsRef,"maxSpeed",1,6,0.1).name("Velocidad máxima");
  f2.open();
  return gui;
};

const AGENT_COUNT = 200;
const MODEL_SCALE  = 45;
const BOUNDS = { x:85, z:70, y:{ min:0.5, max:11.0 } };
const FLEE_RADIUS  = 18;
const FLEE_FORCE   = 9.0;
const EAT_RADIUS   = 7.0;   // distancia para comer un pez
const RESPAWN_TIME = 5.0;   // segundos hasta reaparecer
const rnd = (a,b) => a + Math.random()*(b-a);

const mkAgent = (i) => ({
  root: null, modelPivot: null,
  alive: true,          // false cuando el tiburón lo come
  respawnTimer: 0,      // tiempo hasta reaparecer
  position: new BABYLON.Vector3(rnd(-BOUNDS.x,BOUNDS.x), rnd(BOUNDS.y.min,BOUNDS.y.max), rnd(-BOUNDS.z,BOUNDS.z)),
  rotationY: rnd(0,Math.PI*2),
  swimSpeed:  rnd(0.85,1.35),
  swimAmount: rnd(0.05,0.12),
  phase: i*0.37 + rnd(0,Math.PI*2),
  _forward: new BABYLON.Vector3(Math.sin(rnd(0,Math.PI*2)),0,Math.cos(rnd(0,Math.PI*2)))
});

// ── Spatial hash optimizado (reutiliza Map y buckets entre frames) ────────
const OFF = 512;
class SpatialHash {
  constructor(cs){ this.cs=cs; this.grid=new Map(); this._p=[]; this._pi=0; }
  _c(v){ return Math.floor(v/this.cs)+OFF; }
  _k(x,y,z){ return x*1000000+y*1000+z; }
  clear(){ for(const b of this.grid.values()) b.length=0; this._pi=0; }
  insert(a){
    const k=this._k(this._c(a.position.x),this._c(a.position.y),this._c(a.position.z));
    let b=this.grid.get(k);
    if(!b){b=this._p[this._pi]||(this._p[this._pi]=[]);this._pi++;b.length=0;this.grid.set(k,b);}
    b.push(a);
  }
  each(a,r,cb){
    const cx=this._c(a.position.x),cy=this._c(a.position.y),cz=this._c(a.position.z),r2=r*r;
    for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) for(let dz=-1;dz<=1;dz++){
      const b=this.grid.get(this._k(cx+dx,cy+dy,cz+dz));
      if(!b) continue;
      for(let i=0;i<b.length;i++){
        const o=b[i]; if(o===a) continue;
        const px=a.position.x-o.position.x,py=a.position.y-o.position.y,pz=a.position.z-o.position.z;
        if(px*px+py*py+pz*pz<r2) cb(o);
      }
    }
  }
}

export default class FishSwarm {
  constructor(scene, count=AGENT_COUNT, options={}){
    this.scene=scene; this.count=count; this.options=options;
    this.agents=Array.from({length:count},(_,i)=>mkAgent(i));
    this.ready=false;
    // vectores reutilizables — sin new Vector3 por frame
    this._s=new BABYLON.Vector3(); this._a=new BABYLON.Vector3();
    this._c=new BABYLON.Vector3(); this._d=new BABYLON.Vector3();
    this._m=new BABYLON.Vector3(); this._flee=new BABYLON.Vector3();
    this._n=0;
    this._hash=new SpatialHash(params.perceptionRadius);
    this._loadModel();
  }

  _loadModel(){
    BABYLON.SceneLoader.ImportMesh("","models/","payaso.glb",this.scene,(meshes)=>{
      const src = meshes.filter(m => m instanceof BABYLON.Mesh && m.getTotalVertices()>0);
      if(!src.length){ console.warn("payaso.glb: sin meshes"); return; }
      // Material PBR original del GLB — garantiza visibilidad sin conflictos
      src.forEach(m=>{ m.isVisible=false; });

      this.agents.forEach((ag,ai)=>{
        const root = new BABYLON.TransformNode(`fa-${ai}`,this.scene);
        root.position.copyFrom(ag.position);
        root.rotation.y = ag.rotationY;
        ag.root = root;

        const pivot = new BABYLON.TransformNode(`fp-${ai}`,this.scene);
        pivot.parent    = root;
        pivot.rotation.x = -Math.PI/2;
        pivot.scaling.setAll(MODEL_SCALE);
        ag.modelPivot = pivot;

        src.forEach((m,mi)=>{
          const inst = m.createInstance(`fi-${ai}-${mi}`);
          inst.parent = pivot;
          inst.position.copyFrom(m.position);
          inst.rotation.copyFrom(m.rotation);
          inst.scaling.copyFrom(m.scaling);
        });
      });

      this.ready=true;
      console.log(`🐠 ${this.agents.length} peces listos con instancing GPU.`);
    },null,(_,msg)=>console.error("Error payaso.glb:",msg));
  }

  _boids(ag){
    this._s.setAll(0);this._a.setAll(0);this._c.setAll(0);this._n=0;
    this._hash.each(ag,params.perceptionRadius,(n)=>{
      this._n++;
      this._d.copyFrom(ag.position).subtractInPlace(n.position);
      const dist=this._d.length();
      if(dist>0.0001) this._s.addInPlace(this._d.scaleInPlace(1/(dist*dist)));
      this._a.addInPlace(n._forward);
      this._c.addInPlace(n.position);
    });
    if(this._n>0){
      this._a.scaleInPlace(1/this._n);
      this._c.scaleInPlace(1/this._n).subtractInPlace(ag.position);
    }
    ag._forward
      .addInPlace(this._s.scaleInPlace(params.w_sep))
      .addInPlace(this._a.scaleInPlace(params.w_ali))
      .addInPlace(this._c.scaleInPlace(params.w_coh));
    const l=ag._forward.length();
    if(l>0.0001) ag._forward.scaleInPlace(1/l);
    ag._forward.scaleInPlace(params.maxSpeed);
  }

  /**
   * Comprueba si el tiburón come algún pez.
   * Devuelve cuántos peces fueron comidos en este frame.
   * Los peces comidos desaparecen 5 segundos y reaparecen lejos.
   */
  tryEat(sharkPos) {
    if (!sharkPos || !this.ready) return 0;
    let eaten = 0;
    const r2 = EAT_RADIUS * EAT_RADIUS;
    for (let i = 0; i < this.agents.length; i++) {
      const ag = this.agents[i];
      if (!ag.alive) continue;
      const dx = ag.position.x - sharkPos.x;
      const dy = ag.position.y - sharkPos.y;
      const dz = ag.position.z - sharkPos.z;
      if (dx*dx + dy*dy + dz*dz < r2) {
        ag.alive = false;
        ag.respawnTimer = RESPAWN_TIME;
        ag.root.setEnabled(false);
        eaten++;
      }
    }
    return eaten;
  }

  update(time, deltaTime, sharkPos=null){
    if(!this.ready) return;

    // Respawn de peces comidos
    for (let i = 0; i < this.agents.length; i++) {
      const ag = this.agents[i];
      if (!ag.alive) {
        ag.respawnTimer -= deltaTime;
        if (ag.respawnTimer <= 0) {
          ag.position.set(rnd(-BOUNDS.x,BOUNDS.x), rnd(BOUNDS.y.min,BOUNDS.y.max), rnd(-BOUNDS.z,BOUNDS.z));
          ag.alive = true;
          ag.root.setEnabled(true);
        }
        continue;
      }
    }

    this._hash.cs=params.perceptionRadius;
    this._hash.clear();
    for(let i=0;i<this.agents.length;i++){
      if(this.agents[i].alive) this._hash.insert(this.agents[i]);
    }

    for(let i=0;i<this.agents.length;i++){
      const ag=this.agents[i];
      if(!ag.alive) continue;
      this._boids(ag);

      // ── Huida del tiburón ────────────────────────────────────────────────
      if(sharkPos){
        const dx=ag.position.x-sharkPos.x;
        const dy=ag.position.y-sharkPos.y;
        const dz=ag.position.z-sharkPos.z;
        const dist2=dx*dx+dy*dy+dz*dz;
        if(dist2 < FLEE_RADIUS*FLEE_RADIUS && dist2 > 0.001){
          const dist=Math.sqrt(dist2);
          // Más cerca del tiburón = huida más intensa
          const strength = FLEE_FORCE * (1 - dist/FLEE_RADIUS);
          this._flee.set(dx/dist*strength, dy/dist*strength*0.5, dz/dist*strength);
          ag._forward.addInPlace(this._flee);
          const l=ag._forward.length();
          if(l>0.0001) ag._forward.scaleInPlace(1/l);
          // Huye más rápido que la velocidad normal
          ag._forward.scaleInPlace(params.maxSpeed * 1.6);
        }
      }

      this._m.copyFrom(ag._forward).scaleInPlace(deltaTime);
      ag.position.addInPlace(this._m);

      if(ag.position.x>BOUNDS.x||ag.position.x<-BOUNDS.x){
        ag.position.x=BABYLON.Scalar.Clamp(ag.position.x,-BOUNDS.x,BOUNDS.x); ag._forward.x*=-1;
      }
      if(ag.position.z>BOUNDS.z||ag.position.z<-BOUNDS.z){
        ag.position.z=BABYLON.Scalar.Clamp(ag.position.z,-BOUNDS.z,BOUNDS.z); ag._forward.z*=-1;
      }
      ag.position.y=BABYLON.Scalar.Clamp(ag.position.y,BOUNDS.y.min,BOUNDS.y.max);

      ag.root.position.copyFrom(ag.position);
      ag.root.rotation.y=Math.atan2(ag._forward.x,ag._forward.z);
      ag.root.rotation.z=Math.sin(time*2+ag.phase)*0.04;

      // Animación independiente por agente
      const w=Math.sin(time*ag.swimSpeed*3+ag.phase)*ag.swimAmount;
      ag.modelPivot.rotation.z=w;
      ag.modelPivot.scaling.y=MODEL_SCALE*(1+w*0.15);
    }
  }
}