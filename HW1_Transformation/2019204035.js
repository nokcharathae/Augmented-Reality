import * as THREE from '/node_modules/three/build/three.module.js';
const camera=new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight,0.1,1000);
const scene=new THREE.Scene();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setViewport(0,0,window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(0,0,10);
camera.lookAt(0,0,0);
camera.up.set(0,1,0);

const goe_box = new THREE.BoxGeometry(5,5,5);
const loader = new THREE.TextureLoader();
const material = new THREE.MeshBasicMaterial({
  map: loader.load('black.png'),
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

let prevPS = new THREE.Vector3();
const PS= new THREE.Vector3( boxobj.position.x, boxobj.position.y, -1);
// PS.x=(PS.x+1.0)/2.0*window.innerWidth;
// PS.y=-(PS.y-1.0)/2.0*window.innerHeight;
console.log(PS);
let tempPS = PS.clone();
let WS = PS.unproject(camera).clone();
let prevWS = prevPS.unproject(camera).clone();   
console.log(WS);

let V1 = WS.sub(camera.getWorldPosition(new THREE.Vector3(0,0,0)));
let V2 = prevWS.sub(camera.getWorldPosition(new THREE.Vector3(0,0,0)));

let D_PS=camera.localToWorld(new THREE.Vector3(0,0,0)).distanceTo(PS);
console.log(D_PS);
function trans()
{
    let D_PS=camera.localToWorld(new THREE.Vector3(0,0,0)).distanceTo(PS);
    let D_WS=camera.localToWorld(new THREE.Vector3(0,0,0)).distanceTo(V1);
    let scale=-D_WS/D_PS;
    

    // const PS2= new THREE.Vector3((PS.x / window.innerWidth) * 2.0 -1.0,-(PS.y / window.innerHeight) * 2.0+1.0,-1);
    // const WS2=PS2.unproject(camera).clone();
    // const dif_vec=boxobj.localToWorld(new THREE.Vector3()).distanceTo(WS2);
    // console.log(WS2);
    // console.log(dif_vec);
    // return dif_vec;
}

/*
const D_PS=camera.localToWorld(new THREE.Vector3(0,0,0)).distanceTo(pt1);
const D_WS=camera.localToWorld(new THREE.Vector3(0,0,0)).distanceTo(V1);
let prev_PS = new THREE.Vector3(pt_x,pt_y,-1);
let prev_WS = prev_PS.unproject(camera);
let PS = new THREE.Vector3(pt_x2,pt_y2,-1);
let WS = PS.unproject(camera);
let V1 = WS.sub(camera.getWorldPosition(new THREE.Vector3(0,0,0)));
let V2 = prev_WS.sub(camera.getWorldPosition(new THREE.Vector3(0,0,0)));*/

window.addEventListener("keypress", checkKeyPressed, false);

function checkKeyPressed(e) {
    let mat_viewingTrans = new THREE.Matrix4();
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
        // boxobj.applyMatrix4( new THREE.Matrix4().makeTranslation(WS_dis,0,0));
        PS.x=PS.x-10;
        
        // boxobj.applyMatrix4( new THREE.Matrix4().makeTranslation(WS2.x,0,0));
        boxobj.applyMatrix4( new THREE.Matrix4().makeTranslation(trans(),0,0));
        console.log(boxobj.position);
            break;	     
        case 100: // 'd'
        PS.x=PS.x+10;
        trans()
            break;	 
        case 119: // 'w'
        PS.y=PS.y-10;
        trans()
            break;	 
        case 115: // 's'
        PS.y=PS.y+10;
        trans()
            break;	 
	}	
}

renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
});






