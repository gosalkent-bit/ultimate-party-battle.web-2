import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const wrap = document.getElementById("gameCanvasWrap");
let renderer, scene, camera, arena, coinGroup;
const meshes = new Map();
const coinMeshes = [];
let running = false;

function init3D() {
  if (renderer) return;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1428);
  scene.fog = new THREE.Fog(0x0b1428, 22, 48);
  camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(0, 19, 22);
  camera.lookAt(0, 0, 0);
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = false;
  wrap.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xb8e5ff, 0x25304a, 2));
  const light = new THREE.DirectionalLight(0xffffff, 2.1);
  light.position.set(-8, 16, 8); scene.add(light);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(32, 32),
    new THREE.MeshStandardMaterial({ color: 0x1b2941, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.08; scene.add(floor);
  const grid = new THREE.GridHelper(32, 32, 0x3c7192, 0x293b5a);
  grid.position.y = 0.01; scene.add(grid);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x263b5d, metalness: 0.2, roughness: 0.7 });
  for (const [x,z,sx,sz] of [[0,-16,32,.5],[0,16,32,.5],[-16,0,.5,32],[16,0,.5,32]]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(sx,1.2,sz),wallMat);
    wall.position.set(x,.5,z); scene.add(wall);
  }
  arena = new THREE.Group(); scene.add(arena);
  coinGroup = new THREE.Group(); scene.add(coinGroup);
  resize();
  window.addEventListener("resize", resize);
  running = true; animate();
}
function resize() {
  if (!renderer) return;
  const w = Math.max(1, wrap.clientWidth), h = Math.max(1, wrap.clientHeight);
  renderer.setSize(w,h,false); camera.aspect = w/h; camera.updateProjectionMatrix();
}
function animate() {
  if (!running) return;
  requestAnimationFrame(animate);
  for (const m of coinMeshes) m.rotation.y += 0.035;
  renderer.render(scene,camera);
}
function makePlayer(color) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.12 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.48,0.8,4,8),material);
  body.position.y = 0.85; group.add(body);
  const eyeMat = new THREE.MeshBasicMaterial({color:0x101426});
  for (const x of [-.16,.16]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.055,8,8),eyeMat);
    eye.position.set(x,1.14,.4); group.add(eye);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.55,.045,6,24),new THREE.MeshBasicMaterial({color:0xffffff}));
  ring.rotation.x=Math.PI/2; ring.position.y=.04; group.add(ring);
  scene.add(group); return group;
}
export function updatePlayers(players, myId) {
  if (!renderer) init3D();
  const alive = new Set();
  for (const p of players) {
    alive.add(p.id);
    let m = meshes.get(p.id);
    if (!m) { m = makePlayer(p.color); meshes.set(p.id,m); }
    m.position.set(p.x,0,p.z);
    m.scale.setScalar(p.id === myId ? 1.08 : 1);
  }
  for (const [id,m] of meshes) if (!alive.has(id)) { scene.remove(m); meshes.delete(id); }
}
export function updateCoins(coins) {
  if (!renderer) init3D();
  for (const m of coinMeshes) coinGroup.remove(m);
  coinMeshes.length = 0;
  const mat = new THREE.MeshStandardMaterial({color:0xffd34e,emissive:0xb87500,emissiveIntensity:1.2,metalness:.6,roughness:.25});
  for (const c of coins || []) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(.42,0),mat);
    m.position.set(c.x,.65,c.z); coinGroup.add(m); coinMeshes.push(m);
  }
}
export function clearGame() {
  for (const m of meshes.values()) scene?.remove(m);
  meshes.clear(); updateCoins([]);
}

window.UPBGame = { updatePlayers, updateCoins, clearGame };
