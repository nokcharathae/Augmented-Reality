import * as THREE from '/node_modules/three/build/three.module.js';

const camera=new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight,0.1,1000);
const scene=new THREE.Scene();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setViewport(0,0,window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(0,0,30);
camera.lookAt(0,0,0);
camera.up.set(0,1,0);

const geo_box = new THREE.BoxGeometry(5,5,5);
const loader = new THREE.TextureLoader();
const material = new THREE.MeshPhongMaterial({
  map: loader.load('black.png'),
});
const boxobj=new THREE.Mesh(geo_box,material);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 50, 50);

scene.add(boxobj);
scene.add(light);


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
    console.log("PS: ",PS);

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
    let objectmat=new THREE.Matrix4();
    let mat_r=new THREE.Matrix4();
    let mat_t=new THREE.Matrix4();
    objectmat=boxobj.matrix;

	switch(e.keyCode) {
        // 1) rotation
		case 114: // 'r'
        objectmat=new THREE.Matrix4().makeTranslation(0,0,0)
        mat_r = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(3));
        boxobj.matrix.multiply(objectmat.premultiply(mat_r));
			break;
		case 116: // 't'
        objectmat=new THREE.Matrix4().makeTranslation(0,0,0)
        mat_r = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(3));
        boxobj.matrix.multiply(objectmat.premultiply(mat_r));
			break;
		case 121: // 'y'
		objectmat=new THREE.Matrix4().makeTranslation(0,0,0)
        mat_r = new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(3));
        boxobj.matrix.multiply(objectmat.premultiply(mat_r));
			break;
		case 102: // 'f'
        objectmat=new THREE.Matrix4().makeTranslation(0,0,0)
        mat_r = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(-3));
        boxobj.matrix.multiply(objectmat.premultiply(mat_r));
			break;	
        case 103: // 'g'
        objectmat=new THREE.Matrix4().makeTranslation(0,0,0)
        mat_r = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(-3));
        boxobj.matrix.multiply(objectmat.premultiply(mat_r));
			break;
        case 104: // 'h'
        objectmat=new THREE.Matrix4().makeTranslation(0,0,0)
        mat_r = new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(-3));
        boxobj.matrix.multiply(objectmat.premultiply(mat_r));
            break;	   

        // 2) translation
        case 97: // 'a'
        mat_t= new THREE.Matrix4().makeTranslation(-trans(-10,0),0,0);
        boxobj.matrix.premultiply(mat_t);
            break;	     
        case 100: // 'd'
        mat_t= new THREE.Matrix4().makeTranslation(trans(10,0),0,0);
        boxobj.matrix.premultiply(mat_t);

            break;	 
        case 119: // 'w'
        mat_t= new THREE.Matrix4().makeTranslation(0,trans(0,10),0);
       boxobj.matrix.premultiply(mat_t);
            break;	 
        case 115: // 's'
        mat_t= new THREE.Matrix4().makeTranslation(0,-trans(0,-10),0);
       boxobj.matrix.premultiply(mat_t);
            break;	 
	}	
}

renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
});
