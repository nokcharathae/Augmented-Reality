// 비디오 스크리밍으로 입력
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

import * as THREE from '/node_modules/three/build/three.module.js';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer();
const render_W=640;
const render_H=480;
renderer.setSize(render_W,render_H);
renderer.setViewport(0,0,render_W,render_H);
document.body.appendChild(renderer.domElement);

const camera_ar=new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight,0.1,500);
camera_ar.position.set(0,0,100);
camera_ar.lookAt(0,0,0);
camera_ar.up.set(0,1,0);

const controls=new OrbitControls(camera, renderer.domElement);

// opengl ndc -1 ~ 1
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
    }
  }
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

// callback
faceMesh.onResults(onResults);

// 카메라 정보 변경
// 매프레임 마다 수행
// const camera = new Camera(videoElement, {
//   onFrame: async () => {
//     await faceMesh.send({image: videoElement});
//   },
//   width: 1280,
//   height: 720
// });
// camera.start();

videoElement.play();

async function detectionFrame(now,metadata){
  await faceMesh.send({image: videoElement});
}

videoElement.requestVideoFrameCallback(detectionFrame);

detectionFrame();
