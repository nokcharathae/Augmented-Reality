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

line.position.set(0,0,0);
line.up.set(0,1,0);
line.lookAt(0,0,-1);

scene.add(line);
render.render(scene,camera);


function modifyText(e){
    const t2=document.getElementById("myTest");
    t2.textContent="^^";
} 

document.addEventListener("click", modifyText,false);



