// 비디오 스크리밍으로 입력
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

import * as THREE from '/node_modules/three/build/three.module.js';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js'
import { Line2 } from '/node_modules/three/examples/jsm/lines/Line2.js';
import { LineMaterial } from '/node_modules/three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from '/node_modules/three/examples/jsm/lines/LineGeometry.js';
import * as GeometryUtils from '/node_modules/three/examples/jsm/utils/GeometryUtils.js';

const renderer = new THREE.WebGLRenderer();
const render_w=640;
const render_h=480;
renderer.setSize(render_w,render_h);
renderer.setViewport(0,0,render_w,render_h);
document.body.appendChild(renderer.domElement);

const camera_ar=new THREE.PerspectiveCamera(75, render_w,render_h,1,500);
// near plane은 (0,0,99)에 위치
camera_ar.position.set(0,0,100);
camera_ar.lookAt(0,0,0);
camera_ar.up.set(0,1,0);

const scene=new THREE.Scene();

const texture_bg=new THREE.VideoTexture(videoElement);
scene.background = texture_bg;

// Position and THREE.Color Data

const positions = [];
const colors = [];

const points2 = GeometryUtils.hilbert3D( new THREE.Vector3( 0, 0, 0 ), 20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7 );

const spline = new THREE.CatmullRomCurve3( points2 );
const divisions = Math.round( 12 * points2.length );
const point = new THREE.Vector3();
const color = new THREE.Color();

for ( let i = 0, l = divisions; i < l; i ++ ) {

  const t = i / l;

  spline.getPoint( t, point );
  positions.push( point.x, point.y, point.z );

  color.setHSL( t, 1.0, 0.5 );
  colors.push( color.r, color.g, color.b );

}

let line, line1,matLine,matLineBasic,matLineDashed;

// Line2 ( LineGeometry, LineMaterial )

const geometry = new LineGeometry();
geometry.setPositions( positions );
geometry.setColors( colors );

matLine = new LineMaterial( {

  color: 0xffffff,
  linewidth: 5, // in world units with size attenuation, pixels otherwise
  vertexColors: true,

  //resolution:  // to be set by renderer, eventually
  dashed: false,
  alphaToCoverage: true,

} );

line = new Line2( geometry, matLine );
line.computeLineDistances();
line.scale.set( 1, 1, 1 );
scene.add( line );

// THREE.Line ( THREE.BufferGeometry, THREE.LineBasicMaterial ) - rendered with gl.LINE_STRIP

const geo = new THREE.BufferGeometry();
geo.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
geo.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

matLineBasic = new THREE.LineBasicMaterial( { vertexColors: true } );
matLineDashed = new THREE.LineDashedMaterial( { vertexColors: true, scale: 2, dashSize: 1, gapSize: 1 } );

line1 = new THREE.Line( geo, matLineBasic );
line1.computeLineDistances();
line1.visible = false;
scene.add( line1 );


let point_mesh;

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      // console.log(landmarks[300]);
      // canvas에 lendmarks를 찍음
      // console.log(FACEMESH_RIGHT_IRIS); // landmark 점의 index
      // TESSELATION : interpolation -> 내부 mesh를 그림
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
      if(point_mesh==null){
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
        const poin_mat=new THREE.LineBasicMaterial({color:0xFF0000});
        let oval_point_geo=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(oval_vertices,3));
        point_mesh=new THREE.Line(oval_point_geo, poin_mat);
        scene.add(point_mesh);
      }
      const num_oval_points=FACEMESH_FACE_OVAL.length;
      let positions=point_mesh.geometry.attributes.position.array;
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
      // typescript를 쓰는 이유
      point_mesh.geometry.attributes.position.needsUpdate=true;

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