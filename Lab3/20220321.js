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

// Q. 제가 이해한 바로는 line은 object space에서 변환이 되는 건데, 
// 왜 position 값을 바꾸면 회전하는 것처럼 보이는지?
// lookAt은 어느 정도 감이 오는데 position은 모르겠음
line.position.set(0,0,0);
line.up.set(0,1,0);
line.lookAt(0,5,-1);
// lookAt = 오브젝트의 시점에서 바라보는 방향
// position의 y를 바꾸면 lookAt의 y도 바꿔주면 똑같음! 
// line.matrixAutoUpdate=false;
// let mat_r = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(-70));
// line.matrix=new THREE.Matrix4().makeTranslation(0,10,0).multiply(mat_r);
// 절대 좌표 이동을 위한 matrix



scene.add(boxobj);
scene.add(line);
render.render(scene,camera);


