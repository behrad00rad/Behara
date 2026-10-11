import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export const finishes = {yellow: '#e8bc58', rose: '#db9b80', white: '#dedbd1'};

function jewel(kind, color) {
  const group = new THREE.Group();
  const gold = new THREE.MeshPhysicalMaterial({color, metalness: 1, roughness: .22, clearcoat: .6, clearcoatRoughness: .18});
  const add = (geometry, position, rotation) => {
    const mesh = new THREE.Mesh(geometry, gold);
    if (position) mesh.position.set(...position);
    if (rotation) mesh.rotation.set(...rotation);
    group.add(mesh); return mesh;
  };
  if (kind === 'ring' || kind === 'duo') {
    // A sculptural, fluted band: a real surface rather than a simulated spin image.
    const geometry = new THREE.TorusGeometry(1.03, .25, 36, 180);
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const angle = Math.atan2(p.getY(i), p.getX(i));
      const wave = 1 + .025 * Math.cos(angle * 28);
      p.setXYZ(i, p.getX(i) * wave, p.getY(i) * wave, p.getZ(i));
    }
    geometry.computeVertexNormals();
    const ring = add(geometry, kind === 'duo' ? [-.48, .28, 0] : null, [.5, -.42, -.35]);
    if (kind === 'duo') {
      ring.scale.setScalar(.93);
      add(new THREE.TorusGeometry(.93, .18, 36, 140), [.55, -.48, .28], [1.05, .5, .4]);
    }
  } else if (kind === 'earrings') {
    for (const x of [-.68, .68]) {
      const hoop = add(new THREE.TorusGeometry(.67, .13, 30, 120, Math.PI * 1.86), [x, 0, 0], [.2, x < 0 ? -.25 : .25, -.16]);
      hoop.scale.y = 1.35;
      add(new THREE.SphereGeometry(.17, 24, 16), [x + .66, .12, 0]);
    }
  } else if (kind === 'pendant') {
    const curve = new THREE.EllipseCurve(0, .24, .92, 1.16, 0, Math.PI * 2);
    const pts = curve.getPoints(180).map(p => new THREE.Vector3(p.x, p.y, 0));
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 180, .037, 10, true));
    const drop = add(new THREE.SphereGeometry(.36, 40, 32), [0, -.95, .08]);
    drop.scale.set(.83, 1.32, .42);
    add(new THREE.TorusGeometry(.095, .035, 12, 32), [0, -.48, .08]);
    group.rotation.set(.08, -.25, -.12);
  } else {
    const cuff = add(new THREE.TorusGeometry(1, .14, 36, 160, Math.PI * 1.72), null, [.6, -.2, -.2]);
    cuff.scale.set(1.12, .94, 1);
    add(new THREE.SphereGeometry(.16, 24, 16), [1.1, -.21, -.14]);
  }
  return group;
}

export default function JewelView({modelSrc, goldOverride=false, kind = 'ring', finish = 'yellow', interactive = false, hero = false, spin = false, onReady}) {
  const host = useRef(null), api = useRef(null);
  const [failed, setFailed] = useState(false);
  const [loading,setLoading]=useState(false);
  const materialSettings=useRef({finish,goldOverride});materialSettings.current={finish,goldOverride};
  const paint=object=>object.traverse(node=>{for(const material of [].concat(node.material||[])){if(material.color)material.color.set(finishes[materialSettings.current.finish]);if('metalness'in material){material.metalness=1;material.roughness=.22;}material.needsUpdate=true;}});
  const disposeModel=object=>object?.traverse(node=>{node.geometry?.dispose();for(const material of [].concat(node.material||[])){for(const value of Object.values(material))if(value?.isTexture)value.dispose();material.dispose();}});
  useEffect(() => {
    setFailed(false);setLoading(!!modelSrc);const abort=new AbortController();
    const container = host.current;
    let renderer, scene, controls, frame, observer, environment, pmrem, model;
    let disposed = false, visible = true, dirty = true, lastFrame = 0;
    try {
      renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'low-power'});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      container.appendChild(renderer.domElement);
      scene = new THREE.Scene();
      pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      environment = pmrem.fromScene(room, .04);
      room.dispose();
      scene.environment = environment.texture;
      const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
      camera.position.set(0, 0, hero ? 6.7 : 5.6);
      model = modelSrc?new THREE.Group():jewel(kind, finishes[finish]);
      scene.add(model);
      if(modelSrc)fetch(modelSrc,{signal:abort.signal}).then(r=>{if(!r.ok)throw Error('Model unavailable');return r.arrayBuffer();}).then(buffer=>new Promise((resolve,reject)=>new GLTFLoader().parse(buffer,'',resolve,reject))).then(gltf=>{
        if(disposed){disposeModel(gltf.scene);return;}
        const bounds=new THREE.Box3().setFromObject(gltf.scene),size=bounds.getSize(new THREE.Vector3()),extent=Math.max(size.x,size.y,size.z);
        if(!Number.isFinite(extent)||extent<=0){disposeModel(gltf.scene);throw Error('Empty model');}
        gltf.scene.scale.multiplyScalar(2.8/extent);const center=new THREE.Box3().setFromObject(gltf.scene).getCenter(new THREE.Vector3());gltf.scene.position.sub(center);
        if(materialSettings.current.goldOverride)paint(gltf.scene);model.add(gltf.scene);dirty=true;setLoading(false);onReady?.();
      }).catch(error=>{if(!disposed&&error.name!=='AbortError'){setLoading(false);setFailed(true);}});
      scene.add(new THREE.HemisphereLight(0xffffff, 0x6f633e, 2));
      const key = new THREE.DirectionalLight(0xffedd0, 4);
      key.position.set(-3, 5, 4); scene.add(key);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enabled = interactive;
      controls.enableDamping = true; controls.enablePan = false;
      controls.minDistance = 3.2; controls.maxDistance = 8;
      controls.autoRotateSpeed = .8;
      const resize = () => {
        if (disposed) return;
        const {width, height} = container.getBoundingClientRect();
        renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); dirty = true;
      };
      observer = new ResizeObserver(resize); observer.observe(container); resize();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      api.current = {controls, model, reduced, invalidate: () => {dirty = true;}};
      const intersection = new IntersectionObserver(entries => {visible = entries[0].isIntersecting;});
      intersection.observe(container); api.current.intersection = intersection;
      const animate = time => {
        frame = requestAnimationFrame(animate);
        if (!visible || document.hidden || time - lastFrame < 1000 / 30) return;
        lastFrame = time;
        const changed = controls.update();
        if (dirty || changed) {renderer.render(scene, camera); dirty = false;}
      };
      controls.autoRotate=spin&&!reduced.matches;
      frame = requestAnimationFrame(animate); if(!modelSrc)onReady?.();
    } catch (error) {setFailed(true);}
    return () => {
      disposed = true;abort.abort(); cancelAnimationFrame(frame); observer?.disconnect();
      api.current?.intersection?.disconnect(); controls?.dispose();
      disposeModel(scene);
      environment?.dispose(); pmrem?.dispose(); renderer?.dispose(); renderer?.domElement.remove(); api.current = null;
    };
    // Build geometry only when the piece changes; material and motion update below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, interactive, hero,modelSrc,goldOverride]);
  useEffect(() => {if(api.current&&(!modelSrc||goldOverride))paint(api.current.model); api.current?.invalidate();}, [finish, kind,modelSrc,goldOverride]);
  useEffect(() => {if (api.current) api.current.controls.autoRotate = spin && !api.current.reduced.matches;}, [spin, kind,modelSrc,goldOverride]);
  const key = e => {
    if (!interactive || !api.current) return;
    const {model, controls} = api.current;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', '='].includes(e.key)) e.preventDefault();
    if (e.key === 'ArrowLeft') model.rotation.y -= .15;
    if (e.key === 'ArrowRight') model.rotation.y += .15;
    if (e.key === 'ArrowUp') model.rotation.x -= .15;
    if (e.key === 'ArrowDown') model.rotation.x += .15;
    if (e.key === '+' || e.key === '=') controls.object.position.multiplyScalar(Math.max(.9, 3.2 / controls.object.position.length()));
    if (e.key === '-') controls.object.position.multiplyScalar(Math.min(1.1, 8 / controls.object.position.length()));
    api.current.invalidate();
  };
  return <div ref={host} className={`jewel-view ${interactive ? 'interactive' : ''}`} tabIndex={interactive ? 0 : undefined} onKeyDown={key} role="img" aria-label={`${kind === 'duo' ? 'Two sculptural gold rings' : `Gold ${kind}`} in 3D${interactive ? '. Drag or use arrow keys to rotate. Scroll or use plus and minus to zoom.' : ''}`}>
    {loading&&!failed&&<div className="webgl-fallback" role="status"><p>Loading 3D model…</p></div>}
    {failed && <div className="webgl-fallback" role="status"><span>◯</span><p>The model could not load. You can continue with product photographs.</p></div>}
  </div>;
}
