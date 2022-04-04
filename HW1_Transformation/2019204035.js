import * as THREE from '/node_modules/three/build/three.module.js';


const camera=new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight,0.1,100);
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

const screensizeW=window.innerWidth;
const screensizeH=window.innerHeight;

console.log(screensizeW, screensizeH);
let pos = new THREE.Vector3();
pos = pos.setFromMatrixPosition(boxobj.matrixWorld);
pos.project(camera);
console.log(pos);
function trans()
{
    const PS= new THREE.Vector3( boxobj.position.x, boxobj.position.y, -1);
    const SS = new THREE.Vector3( (PS.x+1.0)/2.0*screensizeW, 
    -(PS.y-1.0)/2.0*screensizeH, -1);
    const SS2=new THREE.Vector3(SS.x+10,SS.y,-1);
    const PS2=new THREE.Vector3((SS2.x / screensizeW) * 2.0 -1.0,
    -(SS2.y / screensizeH) * 2.0+1.0,-1);

    const D_WS=camera.localToWorld(new THREE.Vector3(0,0,0)).distanceTo(boxobj.position);
    const D_10px=PS2.distanceTo(PS);
    const D_real=10*D_10px/0.1;
    console.log("SS1 :", SS);
    console.log("SS2 :",SS2);
    console.log("PS1 :",PS);
    console.log("PS2 :",PS2);
    console.log("D_10px :",D_10px);
    return D_real;
}

window.addEventListener("keypress", checkKeyPressed, false);

function checkKeyPressed(e) {
    boxobj.matrixAutoUpdate=false;
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
        // boxobj.applyMatrix4( new THREE.Matrix4().makeTranslation(WS_dis,0,0));
        //SS.x=SS.x-10;
        // boxobj.applyMatrix4( new THREE.Matrix4().makeTranslation(WS2.x,0,0));
        //trans()
        
        //boxobj.position.x=trans();

            break;	     
        case 100: // 'd'
        boxobj.applyMatrix4( new THREE.Matrix4().makeTranslation(trans(),0,0));
        console.log("position",boxobj.position);
            break;	 
        case 119: // 'w'
        SS.y=SS.y-10;
        trans()
            break;	 
        case 115: // 's'
        SS.y=SS.y+10;
        trans()
            break;	 
	}	
}

renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
});






