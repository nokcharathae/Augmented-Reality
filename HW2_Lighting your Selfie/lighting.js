// 비디오 스크리밍으로 입력
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

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

const camera_ar=new THREE.PerspectiveCamera(75, render_w,render_h,1,500);
camera_ar.position.set(0,0,100);
camera_ar.lookAt(0,0,0);
camera_ar.up.set(0,1,0);

const scene=new THREE.Scene();

const texture_bg=new THREE.VideoTexture(videoElement);
scene.background = texture_bg;

let lines;
const mgeometry = new LineGeometry();
const mmaterial = new LineMaterial( { color: 0xff00ff, linewidth: 2 } );

let oval_point_mesh=null;
let face_mesh=null;

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,
                     {color: '#C0C0C070', lineWidth: 1});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});

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
        const poin_mat=new THREE.PointsMaterial({color:0xFF0000,size:0.1});
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
        face_geometry.setAttribute('uv',new THREE.Float32BufferAttribute(landmarks.length*2,3));
        let face_material=new THREE.MeshBasicMaterial({color:0xFFFF00});
        face_mesh=new THREE.Mesh(face_geometry,face_material);
        face_mesh.geometry.setIndex(TRIANGULATION);
        scene.add(face_mesh);

      }

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
        // oval_vertices[i]=pos_ws;
        face_mesh.geometry.attributes.position.array[3*i+0]=pos_ws.x;
        face_mesh.geometry.attributes.position.array[3*i+1]=pos_ws.y;
        face_mesh.geometry.attributes.position.array[3*i+2]=pos_ws.z;
      }
      face_mesh.geometry.attributes.position.needsUpdate=true;
    }
  }
  renderer.render(scene, camera_ar);
  canvasCtx.restore();
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