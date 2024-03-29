// 비디오 스크리밍으로 입력
const videoElement = document.getElementsByClassName('input_video')[0];
//const canvasElement = document.getElementsByClassName('output_canvas')[0];
//const canvasCtx = canvasElement.getContext('2d');

import * as THREE from '/node_modules/three/build/three.module.js';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js'
import { Line2 } from '/node_modules/three/examples/jsm/lines/Line2.js';
import { LineMaterial } from '/node_modules/three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from '/node_modules/three/examples/jsm/lines/LineGeometry.js';
import { TRIANGULATION } from './triangulation.js';

const renderer = new THREE.WebGLRenderer();
const render_w=640;
const render_h=480;
renderer.setSize(render_w,render_h);
renderer.setViewport(0,0,render_w,render_h);
document.body.appendChild(renderer.domElement);
const near = 1;
const far=500;

const camera_ar=new THREE.PerspectiveCamera(45, render_w/render_h,near,far);
camera_ar.position.set(0,0,100);
camera_ar.lookAt(0,0,0);
camera_ar.up.set(0,1,0);

const scene=new THREE.Scene();

renderer.domElement.addEventListener("mousedown", mouseDownHandler, false);
renderer.domElement.addEventListener("mousemove", mouseMoveHandler, false);
renderer.domElement.addEventListener('mouseup', mouseUpHandler, false);

let controls;

const texture_video=new THREE.VideoTexture(videoElement);
scene.background = texture_video;

const light=new THREE.DirectionalLight(0xffffff,1.0);
const amb_light=new THREE.AmbientLight(0xffffff,0.5);
light.position.set(0,0,camera_ar.position.z-near);
scene.add(light);
scene.add(amb_light);

let lines;
const mgeometry = new LineGeometry();
const mmaterial = new LineMaterial( { color: 0x00ffff, linewidth: 2 } );

let oval_point_mesh=null;
let face_mesh=null;

let mouseX = 0;
let mouseY = 0;
let down=0;

function mouseDownHandler(e) {
  down=1;
  mouseX = ( e.clientX - render_w/2 );
	mouseY = -( e.clientY - render_h/2 );
  light.position.set(mouseX,mouseY,camera_ar.position.z-near);
}

function mouseMoveHandler(e) {
  if (down==1){
    mouseX = ( e.clientX - render_w/2 );
    mouseY = -( e.clientY - render_h/2 );
    light.position.set(mouseX,mouseY,camera_ar.position.z-near);
  }
}

function mouseUpHandler(e) {
  down=0;
}


function ProjScale(p_ms,cam_pos,src_d,dst_d){
  let vec_cam2p=new THREE.Vector3().subVectors(p_ms,cam_pos);
  return new THREE.Vector3().addVectors(cam_pos,vec_cam2p.multiplyScalar(dst_d/src_d));
}

let cameraRig, activeCamera, activeHelper;
let cameraPerspective, cameraOrtho;
let cameraPerspectiveHelper, cameraOrthoHelper;
const aspect=render_w/render_h;
const frustumSize = 600;
cameraPerspective = new THREE.PerspectiveCamera( 50, 0.5 * aspect, 150, 1000);
cameraPerspectiveHelper = new THREE.CameraHelper( cameraPerspective );
//scene.add( cameraPerspectiveHelper );

cameraOrtho = new THREE.OrthographicCamera( 0.5 * frustumSize * aspect / - 2, 0.5 * frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 150, 1000 );

cameraOrthoHelper = new THREE.CameraHelper( cameraOrtho );
//scene.add( cameraOrthoHelper );

activeCamera = cameraPerspective;
activeHelper = cameraPerspectiveHelper;


// controls

// controls = new OrbitControls( camera_ar, renderer.domElement );
// controls.listenToKeyEvents( window ); // optional

// //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

// controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
// controls.dampingFactor = 0.05;

// controls.screenSpacePanning = false;

// controls.minDistance = 100;
// controls.maxDistance = 500;

// controls.maxPolarAngle = Math.PI / 2;


function onResults(results) {
  //canvasCtx.save();
  //canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  //canvasCtx.drawImage(
      //results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
       
      // drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,
      //                {color: '#C0C0C070', lineWidth: 1});
      // drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
      // drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
      // drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
      // drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
      // drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
      // drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});
      // drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
      // drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});  
    

      // FACEMESH_FACE_OVAL, landmarks
      if(oval_point_mesh==null){
        let oval_point_geo=new THREE.BufferGeometry();
        const num_oval_points=FACEMESH_FACE_OVAL.length;
        const oval_vertices =[];
        for(let i=0;i<=num_oval_points;i++){
          let index;
          if(i==num_oval_points){
            index=FACEMESH_FACE_OVAL[0][0];
          }
          else{
            index=FACEMESH_FACE_OVAL[i][0];
          }
          const pos_ns=landmarks[index];
          const pos_ps=new THREE.Vector3((pos_ns.x-0.5)*2,-(pos_ns.y-0.5)*2,pos_ns.z);
          let pos_ws=new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);
          oval_vertices.push(pos_ws.x,pos_ws.y,pos_ws.z);
        }
        const poin_mat=new THREE.PointsMaterial({color:0xFF0000,size:3});
        oval_point_geo.setAttribute('position',new THREE.Float32BufferAttribute(oval_vertices,3));
        oval_point_mesh=new THREE.Points(oval_point_geo, poin_mat);
        scene.add(oval_point_mesh);

        // line2

        mgeometry.setPositions( oval_vertices );
        // resolution of the inset viewport
        mmaterial.resolution.set( render_w, render_h );
        lines = new Line2( mgeometry, mmaterial );
        //lines.computeLineDistances();
        scene.add( lines );

        let face_geometry=new THREE.BufferGeometry();
        face_geometry.setAttribute('position',new THREE.Float32BufferAttribute(landmarks.length*3,3));
        face_geometry.setAttribute('normal',new THREE.Float32BufferAttribute(landmarks.length*3,3));
        face_geometry.setAttribute('uv',new THREE.Float32BufferAttribute(landmarks.length*2,2));
        
        let face_material=new THREE.MeshPhongMaterial({color:new THREE.Color(1.0,1.0,1.0), specular: new THREE.Color(0,0,0), shininess:1});
        face_mesh=new THREE.Mesh(face_geometry,face_material);
        face_mesh.geometry.setIndex(TRIANGULATION);
        scene.add(face_mesh);
      }

      const p_c=new THREE.Vector3(0,0,0).unproject(camera_ar);
      const vec_cam2center=new THREE.Vector3().subVectors(p_c,camera_ar.position);
      const center_dist=vec_cam2center.length();

      const num_oval_points=FACEMESH_FACE_OVAL.length;
      let positions=oval_point_mesh.geometry.attributes.position.array;
      for(let i=0;i<=num_oval_points;i++){
        let index;
        if(i==num_oval_points){
          index=FACEMESH_FACE_OVAL[0][0];
        }
        else{
          index=FACEMESH_FACE_OVAL[i][0];
        }
        const pos_ns=landmarks[index];
        const pos_ps=new THREE.Vector3((pos_ns.x-0.5)*2,-(pos_ns.y-0.5)*2,pos_ns.z);
        let pos_ws=new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);
        pos_ws=ProjScale(pos_ws,camera_ar.position,center_dist,100.0);

        positions[3*i+0]=pos_ws.x;
        positions[3*i+1]=pos_ws.y;
        positions[3*i+2]=pos_ws.z;
      }
      
      oval_point_mesh.geometry.attributes.position.needsUpdate=true;
      //lines.computeLineDistances();
      mgeometry.setPositions( positions );

      const num_points=landmarks.length;
      for(let i=0;i<num_points;i++){
        const pos_ns=landmarks[i];
        const pos_ps=new THREE.Vector3((pos_ns.x-0.5)*2,-(pos_ns.y-0.5)*2,pos_ns.z);
        let pos_ws=new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);
        pos_ws=ProjScale(pos_ws,camera_ar.position,center_dist,100.0);
        
        face_mesh.geometry.attributes.position.array[3*i+0]=pos_ws.x;
        face_mesh.geometry.attributes.position.array[3*i+1]=pos_ws.y;
        face_mesh.geometry.attributes.position.array[3*i+2]=pos_ws.z;
        face_mesh.geometry.attributes.uv.array[2*i+0]=pos_ns.x;
        face_mesh.geometry.attributes.uv.array[2*i+1]=1.0-pos_ns.y;
      }
      face_mesh.geometry.attributes.position.needsUpdate=true;
      face_mesh.geometry.attributes.uv.needsUpdate=true;
      face_mesh.geometry.computeVertexNormals();

      let texture_frame=new THREE.CanvasTexture(results.image);
      face_mesh.material.map=texture_frame;

      light.target=face_mesh;

      //camera


      cameraOrtho.rotation.y = Math.PI;
      cameraPerspective.rotation.y = Math.PI;

      cameraRig = new THREE.Group();

      cameraRig.add( cameraPerspective );
      cameraRig.add( cameraOrtho );

      scene.add( cameraRig );
      
    }
  }
  renderer.render(scene, camera_ar);
  //canvasCtx.restore();
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

// const camera = new Camera(videoElement, {
//   onFrame: async () => {
//     await faceMesh.send({image: videoElement});
//   },
//   width: 1280,
//   height: 720
// });
// camera.start();


videoElement.play();

async function detectionFrame(now, metadata) {
  await faceMesh.send({image: videoElement});
  videoElement.requestVideoFrameCallback(detectionFrame);
}

detectionFrame();