import * as THREE from '/node_modules/three/build/three.module.js';

const render=new THREE.WebGLRenderer();
render.setSize(window.innerHeight,window.innerHeight);
render.setViewport(0,0,window.innerHeight,window.innerHeight);
document.body.appendChild(render.domElement);

const camera=new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight,1,500);
camera.position.set(0,0,100);
camera.lookAt(0,0,0);
camera.up.set(0,1,0);

const scene=new THREE.Scene();

const points=[];
// line strip, path
points.push(new THREE.Vector3(-10,0,0));
points.push(new THREE.Vector3(0,10,0));
points.push(new THREE.Vector3(10,0,0));

const geometry=new THREE.BufferGeometry().setFromPoints(points);
const material=new THREE.LineBasicMaterial({color:0x0000ff});
const line=new THREE.Line(geometry,material);

const goe_box = new THREE.BoxGeometry(5,5,5);
const material_box=new THREE.LineBasicMaterial({color:0xffffff});
const boxobj=new THREE.Mesh(goe_box,material_box);

boxobj.matrixAutoUpdate=false;
let mat_r = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(-40));
boxobj.matrix=new THREE.Matrix4().makeTranslation(0,0,80).multiply(mat_r);

line.position.set(0,0,0);
line.up.set(0,1,0);
line.lookAt(0,5,-1);

scene.add(boxobj);
scene.add(line);
render.render(scene,camera);


