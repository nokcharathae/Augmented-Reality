const videoElement = document.getElementsByClassName('input_video')[0];

import * as THREE from '/node_modules/three/build/three.module.js';
import { DecalGeometry } from '/node_modules/three/examples/jsm/geometries/DecalGeometry.js';
import { TRIANGULATION } from '../triangulation.js';
import { Euler, Vector3 } from 'three';

let face_mesh=null;

let mesh;
let raycaster;
let line;

const objects=[];
let m ;

// renderer
const renderer = new THREE.WebGLRenderer();
const render_w=640;
const render_h=480;
renderer.setSize(render_w,render_h);
renderer.setViewport(0,0,render_w,render_h);
document.body.appendChild(renderer.domElement);


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

const light_helper = new THREE.DirectionalLightHelper( light, 0 );
scene.add(light);
scene.add(amb_light);
scene.add( light_helper );

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
const position = new THREE.Vector3();
const orientation = new THREE.Euler();
const size = new THREE.Vector3( 10, 10, 10 );
mouseHelper = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 10 ), new THREE.MeshNormalMaterial() );
mouseHelper.visible = true;
scene.add( mouseHelper );

renderer.domElement.addEventListener( 'pointerup', function ( event ) {

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
const p_c=new THREE.Vector3(0,0,0).unproject(camera_ar);
const vec_cam2center=new THREE.Vector3().subVectors(p_c,camera_ar.position);
const center_dist=vec_cam2center.length();

function ProjScale(p_ms,cam_pos,src_d,dst_d){
  let vec_cam2p=new THREE.Vector3().subVectors(p_ms,cam_pos);
  return new THREE.Vector3().addVectors(cam_pos,vec_cam2p.multiplyScalar(dst_d/src_d));
}

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

        // decal mesh


        scene.add(face_mesh);
      }
      // 얼굴에 맞닿은 position 값을 알아내는 것이 관건

      // face mesh update
      const center_position =new THREE.Vector3(0,0,0);
      const centernor=new THREE.Vector3(0,0,0);
      for(let i=0;i<landmarks.length;i++){
        const pos_ns=landmarks[i];
        const pos_ps=new THREE.Vector3((pos_ns.x-0.5)*2,-(pos_ns.y-0.5)*2,pos_ns.z);
        let pos_ws=new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);
        pos_ws=ProjScale(pos_ws,camera_ar.position,center_dist,100.0);
        
        face_mesh.geometry.attributes.position.array[3*i+0]=pos_ws.x;
        face_mesh.geometry.attributes.position.array[3*i+1]=pos_ws.y;
        face_mesh.geometry.attributes.position.array[3*i+2]=pos_ws.z;
        face_mesh.geometry.attributes.uv.array[2*i+0]=pos_ns.x;
        face_mesh.geometry.attributes.uv.array[2*i+1]=1.0-pos_ns.y;

        center_position.x+=pos_ws.x;
        center_position.y+=pos_ws.y;
        center_position.z+=pos_ws.z;

        centernor.x+=face_mesh.geometry.attributes.normal.array[3*i+0];
        centernor.y+=face_mesh.geometry.attributes.normal.array[3*i+1];
        centernor.z+=face_mesh.geometry.attributes.normal.array[3*i+2];
      }

      center_position.divideScalar(landmarks.length);

      centernor.divideScalar(landmarks.length).normalize();
      // centernor.x/=landmarks.length;
      // centernor.y/=landmarks.length;
      // centernor.z/=landmarks.length;
      //console.log(centernor);
      
      face_mesh.geometry.attributes.position.needsUpdate=true;
      face_mesh.geometry.attributes.uv.needsUpdate=true;
      face_mesh.geometry.computeVertexNormals();

      
      //console.log(position);
      //const temp=center_position.sub(position);

      const temp=new Vector3(0,0,0).sub(center_position);
      const temp_pos=position.clone();
      temp_pos.sub(temp);
      console.log(temp_pos);

      const qrot = new THREE.Quaternion();
      qrot.setFromUnitVectors(temp,temp_pos);
      const temp_euler=new Euler(0,0,0);
      temp_euler.setFromQuaternion(qrot);
      temp_euler.x=orientation.x;
      temp_euler.y=orientation.y;

      // dacal uqdate
      for (let i=0; i<decals.length;i++){
        //console.log(orientation);

        scene.remove(decals[i]);
        decals.splice(i,1);


        m= new THREE.Mesh( new DecalGeometry( mesh, temp_pos,orientation , size ), material );
        //console.log(m);
        decals.unshift(m);
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

    position.copy( intersection.point );
    orientation.copy( mouseHelper.rotation );

    if ( params.rotate ) orientation.z = Math.random() * 2 * Math.PI;

    const scale = params.minScale + Math.random() * ( params.maxScale - params.minScale );
    size.set( scale, scale, scale );

    // 색 변환 코드
    material = decalMaterial.clone();
    material.color.setHex( Math.random() * 0xffffff );

    m= new THREE.Mesh( new DecalGeometry( mesh, position, orientation, size ), material );
    
    decals.push( m );
    scene.add(m);

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