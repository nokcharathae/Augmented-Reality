import * as THREE from '/node_modules/three/build/three.module.js';

const camera=new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight,0.1,1000);
const scene=new THREE.Scene();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setViewport(0,0,window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(0,0,5);
camera.lookAt(0,0,0);
camera.up.set(0,1,0);

const goe_box = new THREE.BoxGeometry(5,5,5);
const loader = new THREE.TextureLoader();
const material = new THREE.MeshBasicMaterial({
  map: loader.load('/black.png'),
});
const boxobj=new THREE.Mesh(goe_box,material);

const light = new THREE.DirectionalLight(0xFFFFFF, 1);

scene.add(boxobj);
scene.add(light);

/* HW1. Transformation

1. 월드에 큐브를 만들어 배치하고 lighting 과 texture mapping 적용
2. 키보드 버튼 press 이벤트 추가

(60점)
 - 'r' :  큐브의 x 축 방향으로 3도 rotation
 - 't' :  큐브의 y 축 방향으로 3도 rotation
 - 'y' :  큐브의 z 축 방향으로 3도 rotation
 - 'f' :  큐브의 x 축 방향으로 -3도 rotation
 - 'g' :  큐브의 y 축 방향으로 -3도 rotation
 - 'h' :  큐브의 z 축 방향으로 -3도 rotation
(40점)
 - 'a' :  큐브를 화면의 왼쪽 방향으로 10 pix 만큼 평행 이동
 - 'd' :  큐브를 화면의 오른쪽 방향으로 10 pix 만큼 평행 이동
 - 'w' :  큐브를 화면의 위쪽 방향으로 10 pix 만큼 평행 이동
 - 's' :  큐브를 화면의 아래쪽 방향으로 10 pix 만큼 평행 이동
*/

const deg2rad=3*(Math.PI/180);

const pt_x = (10 / window.innerWidth) * 2.0 -1.0;
const pt_y = -(10 / window.innerHeight) * 2.0+1.0;
const pt_x2 = (0 / window.innerWidth) * 2.0 -1.0;
const pt_y2 = -(0 / window.innerHeight) * 2.0+1.0;
let PS = new THREE.Vector3(pt_x,pt_y,-1);
console.log(PS);
let WS = PS.unproject(camera);
console.log(WS);
let PS2 = new THREE.Vector3(pt_x2,pt_y2,-1);
let WS2 = PS2.unproject(camera);
let WS_dis=WS.x-WS2.x;

window.addEventListener("keypress", checkKeyPressed, false);

function checkKeyPressed(e) {
	switch(e.keyCode) {
        // 1) rotation
		case 114: // 'r'
        boxobj.rotation.x += deg2rad; 
			break;
		case 116: // 't'
		boxobj.rotation.y += deg2rad; 
			break;
		case 121: // 'y'
		boxobj.rotation.z += deg2rad; 
			break;
		case 102: // 'f'
        boxobj.rotation.x -= deg2rad; 
			break;	
        case 103: // 'g'
        boxobj.rotation.y -= deg2rad; 
            break;	 
        case 104: // 'h'
        boxobj.rotation.z -= deg2rad; 
            break;	   

        // 2) translation
        case 97: // 'a'
        boxobj.applyMatrix4( new THREE.Matrix4().makeTranslation(WS_dis,0,0));
            break;	     
        case 100: // 'd'
        boxobj.applyMatrix4( new THREE.Matrix4().makeTranslation(-WS_dis,0,0));
            break;	 
        case 119: // 'w'
        boxobj.applyMatrix4( new THREE.Matrix4().makeTranslation(0,-pt_y,0));
            break;	 
        case 115: // 's'
        boxobj.applyMatrix4( new THREE.Matrix4().makeTranslation(0,pt_y,0));
            break;	 
	}	
}

renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
});

