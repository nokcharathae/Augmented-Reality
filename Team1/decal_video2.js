const videoElement = document.getElementsByClassName('input_video')[0];

import * as THREE from '/node_modules/three/build/three.module.js';
import { DecalGeometry } from '/node_modules/three/examples/jsm/geometries/DecalGeometry.js';
import { TRIANGULATION } from '../triangulation.js';
import { Euler, Vector3 } from 'three';

let face_mesh=null;

let mesh;
let raycaster;
let line;

let m ;

// renderer
const renderer = new THREE.WebGLRenderer();
const render_w=640;
const render_h=480;
renderer.setSize(render_w,render_h);
renderer.setViewport(0,0,render_w,render_h);
document.body.appendChild(renderer.domElement);

let FirstZ = null;
let FirstAngle=null;

// scene
const scene=new THREE.Scene();
const texture_video=new THREE.VideoTexture(videoElement);
scene.background = texture_video;

// camera
const near = 80;
const far=500;

const camera_ar=new THREE.PerspectiveCamera(45, render_w/render_h,near,far);
camera_ar.position.set(0,0,100);
camera_ar.lookAt(0,0,0);
camera_ar.up.set(0,1,0);

// light
const light=new THREE.DirectionalLight(0xffffff,1.0);
const amb_light=new THREE.AmbientLight(0xffffff,0.4);
light.position.set(0,0,camera_ar.position.z-near);
scene.add(light);
scene.add(amb_light);

// mouse helper
const geometry = new THREE.BufferGeometry();
geometry.setFromPoints( [ new THREE.Vector3(), new THREE.Vector3() ] );
line = new THREE.Line( geometry, new THREE.LineBasicMaterial() );
scene.add( line );

// decal 
let material;
const decals = [];
const intersection = {
    is_intersected: false,
    point: new THREE.Vector3(),
    normal: new THREE.Vector3()
};
const textureLoader = new THREE.TextureLoader();
const decalDiffuse = textureLoader.load( 'decal-diffuse.png' );
const decalNormal = textureLoader.load( 'decal-normal.jpg' );

const decalMaterial = new THREE.MeshPhongMaterial( {
    specular: 0x444444,
    map: decalDiffuse,
    normalMap: decalNormal,
    normalScale: new THREE.Vector2( 1, 1 ),
    shininess: 30,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: - 4,
    wireframe: false
} );

const mouse = new THREE.Vector2();
const intersects = [];

const mposition = new THREE.Vector3();
const morientation = new THREE.Euler();

const params = {
    minScale: 10,
    maxScale: 20,
    rotate: true,
    clear: function () {

        removeDecals();
    }
};


raycaster = new THREE.Raycaster();

let mouseHelper;
let position = new THREE.Vector3();
const orientation = new THREE.Euler();
const size = new THREE.Vector3( 10, 10, 10 );
mouseHelper = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 10 ), new THREE.MeshNormalMaterial() );
mouseHelper.visible = true;
scene.add( mouseHelper );


renderer.domElement.addEventListener( 'pointerdown', function ( event ) {

  checkIntersection( event.clientX, event.clientY );
  if ( intersection.is_intersected ) shoot();

} );

renderer.domElement.addEventListener( 'pointermove', onPointerMove );

function onPointerMove( event ) {
  if ( event.isPrimary ) {

      checkIntersection( event.clientX, event.clientY );
  }
}

function checkIntersection( x, y ) {

    if ( mesh === undefined ) return;

    mouse.x = ( x / render_w ) * 2 - 1;
    mouse.y = - ( y / render_h ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera_ar );
    raycaster.intersectObject( mesh, false, intersects );

    if ( intersects.length > 0 ) {
        
        // point of intersection, in world coordinates
        const p = intersects[ 0 ].point;
        mouseHelper.position.copy( p );
        intersection.point.copy( p );
        
        const n = intersects[ 0 ].face.normal.clone();
        n.transformDirection( mesh.matrixWorld );
        n.multiplyScalar( 10 );
        n.add( intersects[ 0 ].point );

        intersection.normal.copy( intersects[ 0 ].face.normal );
        mouseHelper.lookAt( n );

        // mouse helper position
        const positions = line.geometry.attributes.position;
        positions.setXYZ( 0, p.x, p.y, p.z );
        positions.setXYZ( 1, n.x, n.y, n.z );
        positions.needsUpdate = true;

        intersection.is_intersected = true;
        intersects.length = 0;
    } 

    else {

        intersection.is_intersected = false;

    }
    
}


// initialize
let nearland=0;
let landistance=100;
let check=0;

let preAngle;
let nowAngle;

const p_c=new THREE.Vector3(0,0,0).unproject(camera_ar);
const vec_cam2center=new THREE.Vector3().subVectors(p_c,camera_ar.position);
const center_dist=vec_cam2center.length();

function ProjScale(p_ms,cam_pos,src_d,dst_d){
  let vec_cam2p=new THREE.Vector3().subVectors(p_ms,cam_pos);
  return new THREE.Vector3().addVectors(cam_pos,vec_cam2p.multiplyScalar(dst_d/src_d));
}

let decalpos=new Vector3(0,0,0);

function onResults(results) {
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {    
      // FACEMESH_FACE_OVAL, landmarks
      if(face_mesh==null){
        // face mesh
        let face_geometry=new THREE.BufferGeometry();
        face_geometry.setAttribute('position',new THREE.Float32BufferAttribute(landmarks.length*3,3));
        face_geometry.setAttribute('normal',new THREE.Float32BufferAttribute(landmarks.length*3,3));
        face_geometry.setAttribute('uv',new THREE.Float32BufferAttribute(landmarks.length*2,2));
        
        let face_material=new THREE.MeshPhongMaterial({color:new THREE.Color(1.0,1.0,1.0), specular: new THREE.Color(0,0,0), shininess:1});
        face_mesh=new THREE.Mesh(face_geometry,face_material);
        face_mesh.geometry.setIndex(TRIANGULATION);
        mesh=face_mesh;

        scene.add(face_mesh);
      }
      // 얼굴에 맞닿은 position 값을 알아내는 것이 관건

      // face mesh update
      
      let centernor=new THREE.Vector3(0,0,0);
      for(let i=0;i<landmarks.length;i++){
        if (check==0) 
        {
          i=0;
          check=1;
        }
        const pos_ns=landmarks[i];
        const pos_ps=new THREE.Vector3((pos_ns.x-0.5)*2,-(pos_ns.y-0.5)*2,pos_ns.z);
        let pos_ws=new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);
        pos_ws=ProjScale(pos_ws,camera_ar.position,center_dist,100.0);
        
        face_mesh.geometry.attributes.position.array[3*i+0]=pos_ws.x;
        face_mesh.geometry.attributes.position.array[3*i+1]=pos_ws.y;
        face_mesh.geometry.attributes.position.array[3*i+2]=pos_ws.z;
        face_mesh.geometry.attributes.uv.array[2*i+0]=pos_ns.x;
        face_mesh.geometry.attributes.uv.array[2*i+1]=1.0-pos_ns.y;

        centernor.x=pos_ws.x;
        centernor.y=pos_ws.y;
        centernor.z=pos_ws.z;

        if(decals.length>0 && check==1)
        {
          if(pos_ws.distanceTo(position)<landistance)
          {
            landistance=pos_ws.distanceTo(position);
            nearland=i;
            decalpos=pos_ws;
          }

          
        }
        if(check==2 && i==nearland)
        {
            decalpos=pos_ws;
            let mdedalpos=decalpos.clone();
           
          if (FirstZ == null) {
            FirstZ = decalpos.z;
            FirstAngle=mdedalpos.sub(centernor);

          }
          else {
            let NowZ = decalpos.z;
            let SetSize = 10;
            let ViewScale= null;

            let Distance = NowZ - FirstZ;
            ViewScale = SetSize + SetSize * Distance / 2;

            FirstZ = decalpos.z;

            console.log("FirsTZ : " + FirstZ + "\nNowZ : " + NowZ + "\nViewSCale : " + ViewScale + "\nDistance : " + Distance)

            size.set(ViewScale, ViewScale, ViewScale)

            nowAngle=mdedalpos.sub(centernor);
            preAngle=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(FirstAngle,nowAngle));
            FirstAngle=mdedalpos.sub(centernor);

          }

        }
        
      }
      if(decals.length>0)
        {check=2;}


      centernor.divideScalar(landmarks.length).normalize();
      //console.log(centernor);
      
      face_mesh.geometry.attributes.position.needsUpdate=true;
      face_mesh.geometry.attributes.uv.needsUpdate=true;
      face_mesh.geometry.computeVertexNormals();

      //console.log(decalpos.z)
      //console.log(size)

      // dacal uqdate
      for (let i=0; i<decals.length;i++){
        //console.log(orientation);

        /*scene.remove(decals[i]);
        decals.splice(i,1);
        renderer.info.reset() // 메모리 누수 방지

        m= new THREE.Mesh( new DecalGeometry( mesh, decalpos,orientation , size ), material );
        //console.log(m);
        decals.unshift(m);
        //console.log(decals);
        scene.add(m);*/
        

        //m.lookAt(centernor);
        //console.log(decals);
        //nowAngle=m.rotation;
        //console.log(nowAngle);
        //nowAngle.x=orientation.x;
        //nowAngle.y=orientation.y;
        //nowAngle.z=orientation.z+nowAngle.z*0.5;

        //console.log(nowAngle);

        scene.remove(decals.pop());
        scene.remove(decals.pop());
        //decals.splice(i,1);
        renderer.info.reset(); // 메모리 누수 방지
        

        m= new THREE.Mesh( new DecalGeometry( mesh, decalpos,preAngle , size ), material );
        //m.lookAt(centernor);
        decals.unshift(m);
        //console.log(decals);
        scene.add(m);
      }

      let texture_frame=new THREE.CanvasTexture(results.image);
      face_mesh.material.map=texture_frame;
      light.target=face_mesh;
      scene.background = texture_video;

      renderer.render(scene, camera_ar);
    }
  }
}


function shoot() {
  check=0;
    position.copy( intersection.point );
    orientation.copy( mouseHelper.rotation );
    preAngle=orientation;

    if ( params.rotate ) orientation.z = Math.random() * 2 * Math.PI;

    const scale = params.minScale + Math.random() * ( params.maxScale - params.minScale );
    size.set( scale, scale, scale );

    // 색 변환 코드
    material = decalMaterial.clone();
    material.color.setHex( Math.random() * 0xffffff );

    m= new THREE.Mesh( new DecalGeometry( mesh, position, orientation, size ), material );
    
    decals.push( m );
    scene.add(m);
    //console.log(check);
}

function removeDecals() {
    decals.forEach( function ( d ) {
        scene.remove( d );
    } );
    decals.length = 0;

}

const faceMesh = new FaceMesh({locateFile: (file) => {
  return `/node_modules/@mediapipe/face_mesh/${file}`;
}});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({image: videoElement});
  },
  width: 1280,
  height: 720
});
camera.start();


videoElement.play();

async function detectionFrame(now, metadata) {
  await faceMesh.send({image: videoElement});
  videoElement.requestVideoFrameCallback(detectionFrame);
}

detectionFrame();