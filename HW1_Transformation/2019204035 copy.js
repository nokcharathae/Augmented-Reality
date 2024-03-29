import * as THREE from '/node_modules/three/build/three.module.js';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js'

const camera=new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight,0.1,1000);

const scene=new THREE.Scene();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setViewport(0,0,window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);

// camera.position.set(0,0,10);
// camera.lookAt(0,0,0);
// camera.up.set(0,1,0);

const controls = new THREE.OrbitControls(camera);

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

let screensizeW=window.innerWidth;
let screensizeH=window.innerHeight;

function trans(a, b){
    let WS=new THREE.Vector3();
    WS.setFromMatrixPosition(boxobj.matrixWorld);
    let PS=WS.project(camera).clone();
    PS = new THREE.Vector3( (PS.x+1.0)/2.0*screensizeW, 
    -(PS.y-1.0)/2.0*screensizeH, -1);
    
    let PS2=new THREE.Vector3( PS.x+a, PS.y+b, -1);
    let WS2=new THREE.Vector3((PS2.x / screensizeW) * 2.0 -1.0,
    -(PS2.y / screensizeH) * 2.0+1.0,-1);
    WS2.unproject(camera);

    let tempWS=new THREE.Vector3(WS.x, WS.y,-1);
    tempWS=tempWS.unproject(camera).clone();
    
    let D_WS=camera.localToWorld(new THREE.Vector3(0,0,0)).distanceTo(new THREE.Vector3(0,0,0));
    let D_PS=0.1;
    let D_10px=WS2.distanceTo(tempWS);
    let D_point=D_WS/D_PS*D_10px;

    return D_point;
}

window.addEventListener("keypress", checkKeyPressed, false);

function checkKeyPressed(e) {
    boxobj.matrixAutoUpdate=false;
    boxobj.matrixWorldNeedsUpdate = true;
	switch(e.keyCode) {
        // 1) rotation
		case 114: // 'r'
        boxobj.applyMatrix4(new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(3)));
			break;
		case 116: // 't'
        boxobj.applyMatrix4(new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(3)));
			break;
		case 121: // 'y'
		boxobj.applyMatrix4(new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(3)));
			break;
		case 102: // 'f'
        boxobj.applyMatrix4(new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(-3)));
			break;	
        case 103: // 'g'
        boxobj.applyMatrix4(new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(-3)));
            break;	 
        case 104: // 'h'
        boxobj.applyMatrix4(new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(-3)));
            break;	   

        // 2) translation
        case 97: // 'a'
        boxobj.applyMatrix4( new THREE.Matrix4().makeTranslation(-trans(-10,0),0,0));
            break;	     
        case 100: // 'd'
        boxobj.applyMatrix4( new THREE.Matrix4().makeTranslation(trans(10,0),0,0));
            break;	 
        case 119: // 'w'
        boxobj.applyMatrix4( new THREE.Matrix4().makeTranslation(0,trans(0,10),0));
            break;	 
        case 115: // 's'
        boxobj.applyMatrix4( new THREE.Matrix4().makeTranslation(0,-trans(0,-10),0));
            break;	 
	}	
}

function animate() {

	requestAnimationFrame(animate);

            renderer.render(scene, camera);
            controls.update(); // 마우스로인해 변경된 카메라값을 업데이트 합니다.


}

animate();





