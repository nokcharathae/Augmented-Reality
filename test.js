const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

// import { FACEMESH_FACE_OVAL } from '@mediapipe/face_mesh';
// import { FACEMESH_FACE_OVAL } from '@mediapipe/face_mesh';
////////////////////////////////////////////////////////////////////////////////////
import * as THREE from './node_modules/three/build/three.module.js';
import * as GeometryUtils from './node_modules/three/examples/jsm/utils/GeometryUtils.js';
import { LineGeometry } from './node_modules/three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from './node_modules/three/examples/jsm/lines/LineMaterial.js';
import { Line2 } from './node_modules/three/examples/jsm/lines/Line2.js';
import {OrbitControls} from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import {TRIANGULATION} from './triangulation.js';

let matLine;
const renderer = new THREE.WebGLRenderer();
const renderer_w = 640;
const renderer_h = 480;
renderer.setSize( renderer_w, renderer_h ); 
renderer.setViewport(0,0,renderer_w, renderer_h); 
document.body.appendChild( renderer.domElement );

const far = 500;
const near = 1 ;
const camera_ar = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, near, far);
camera_ar.position.set( 0, 0, 10 );
camera_ar.lookAt( 0, 0, 0 ); 
camera_ar.up.set(0,1,0);

const scene = new THREE.Scene();

const texture_bg = new THREE.VideoTexture(videoElement);
scene.background = texture_bg;

const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(0,0,100);
scene.add(light);

let oval_point_mesh = null;
let oval_line = null;
let face_mesh = null;
let line = null;

function ProjScale(p_ms, cam_pos, src_d, dst_d) { //scale을 바꾸어 주는 부분
  let vec_cam2p = new THREE.Vector3().subVectors(p_ms, cam_pos);
  return new THREE.Vector3().addVectors(cam_pos, vec_cam2p.multiplyScalar(dst_d/src_d));
  
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////


function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) { //각각이 무엇을 의미하는지 확인해 보아야 한다. 
      //console.log(FACEMESH_FACE_OVAL)
      //console.log(landmarks[300])
      // Landmark is normalizedLandmark[]
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
      if(oval_point_mesh == null){
        let oval_point_geo = new THREE.BufferGeometry();
        const num_oval_points =FACEMESH_FACE_OVAL.length;
        const oval_vertices = [];
        // const curve_vertices = []
        let first_point = new THREE.Vector3();
        // const oval_vertices = new Float32Array( num_oval_points);
        for(let i =0; i< num_oval_points; i++){
          const index = FACEMESH_FACE_OVAL[i][0];
          const pos_ns = landmarks[index];
          const pos_ps = new THREE.Vector3((pos_ns.x -0.5)*2,-(pos_ns.y -0.5)*2, pos_ns.z)
          let pos_ws = new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.x).unproject(camera_ar);
          // oval_vertices[i] = pos_ws;
          oval_vertices.push(pos_ws.x,pos_ws.y,pos_ws.z);
          // curve_vertices.push(new THREE.Vector3(pos_ws.x,pos_ws.y,pos_ws.z));
          if( i == 0){
            first_point = oval_vertices[0]
          }
        }
        const point_mat = new THREE.PointsMaterial({color:0xFF0000, size : 3});
        oval_point_geo.setAttribute('position', new THREE.Float32BufferAttribute(oval_vertices,3));

        let oval_line_geometry = new THREE.BufferGeometry();
        oval_line_geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(num_oval_points * 3),3));

        let face_geometry = new THREE.BufferGeometry();
        face_geometry.setAttribute('position', new THREE.Float32BufferAttribute(landmarks.length * 3,3));
        face_geometry.setAttribute('normal', new THREE.Float32BufferAttribute(landmarks.length * 3,3));
        face_geometry.setAttribute('uv', new THREE.Float32BufferAttribute(landmarks.length * 2,2));
        
        let face_material = new THREE.MeshPhongMaterial({color:0xFFFF00}); // 여기서 주어지는 색이 diffused color
        face_mesh = new THREE.Mesh(face_geometry, face_material); 
        face_mesh.geometry.setIndex(TRIANGULATION);

        oval_line = new THREE.Line(oval_line_geometry, new THREE.LineBasicMaterial({color:0x00ff00}));
        oval_point_mesh = new THREE.Points(oval_point_geo,point_mat);
        scene.add(oval_point_mesh);
        scene.add(oval_line);
        scene.add(face_mesh);
        
        
        ///////////////////////////////////////////////////////////////
       const positions_2 = [];
       const colors = [];
       const points2 = GeometryUtils.hilbert3D( new THREE.Vector3( 0, 0, 0 ), 20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7 );
       const spline2 = new THREE.CatmullRomCurve3( points2 );
       const divisions = Math.round( 12 * points2.length );
       const point = new THREE.Vector3();
       const color = new THREE.Color();
 
       for ( let i = 0, l = divisions; i < l; i ++ ) {
         const t = i / l;
         spline2.getPoint( t, point );
         positions_2.push( point.x, point.y, point.z );
         color.setHSL( t, 1.0, 0.5 );
         colors.push( color.r, color.g, color.b );
       }
       // Line2 ( LineGeometry, LineMaterial )
       const geometry2 = new LineGeometry();
       geometry2.setPositions( oval_vertices ); //! 여기다가 넣어줬다는거지
       geometry2.setColors( colors );
 
       matLine = new LineMaterial( {
         color: 0xffffff,
         linewidth: 0.005, // in world units with size attenuation, pixels otherwise
         vertexColors: true,
 
         dashed: false,
         alphaToCoverage: true,
 
       } );
 
       line = new Line2( geometry2, matLine );
       line.computeLineDistances();
       line.scale.set( 1, 1, 1 );
      //  scene.add( line ); //! 이거 풀어줘야함!!
       ///////////////////////////////////
      }

      const p_c = new THREE.Vector3(0,0,0).unproject(camera_ar);
      const vec_cam2center = new THREE.Vector3().subVectors(p_c, camera_ar.position);
      const center_dist = vec_cam2center.length();

      const num_oval_points = FACEMESH_FACE_OVAL.length;
      let positions = oval_point_mesh.geometry.attributes.position.array;
      for(let i =0; i< num_oval_points; i++){
        const index = FACEMESH_FACE_OVAL[i][0];
        const pos_ns = landmarks[index];
        const pos_ps = new THREE.Vector3((pos_ns.x -0.5)*2,-(pos_ns.y -0.5)*2, pos_ns.z)
        let pos_ws = new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);

        pos_ws = ProjScale(pos_ws, camera_ar.position, center_dist, 100.0 );

        positions[3*i +0] = pos_ws.x;
        positions[3*i +1] = pos_ws.y;
        positions[3*i +2] = pos_ws.z;
      }

      line.geometry.setPositions(positions);//!
      oval_line.geometry.attributes.position.array = positions;
      oval_line.geometry.attributes.position.needsUpdate = true;
      oval_point_mesh.geometry.attributes.position.needsUpdate = true; // 애만 업데이트 하세요.
      line.geometry.attributes.position.needsUpdate = true;

      const num_points = landmarks.length;
      for(let i =0; i< num_points; i++){
        const pos_ns = landmarks[i];
        const pos_ps = new THREE.Vector3((pos_ns.x -0.5)*2,-(pos_ns.y -0.5)*2, pos_ns.z)
        let pos_ws = new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);

        pos_ws = ProjScale(pos_ws, camera_ar.position, center_dist, 100.0 );
        //Oval_vertices[i] = pos_ws
        face_mesh.geometry.attributes.position.array[3*i +0] = pos_ws.x;
        face_mesh.geometry.attributes.position.array[3*i +1] = pos_ws.y;
        face_mesh.geometry.attributes.position.array[3*i +2] = pos_ws.z;
      }

      face_mesh.geometry.attributes.position.needsUpdate = true;
      face_mesh.geometry.computeVertexNormals();//노말 백터를 만들어주는것
      //face_mesh.geometry.attributes.normal.needsUpdate = true;

      //let texture_frame = new THREE.canvas

      light.target = face_mesh;
    }
  }
  renderer.render(scene, camera_ar);
  canvasCtx.restore();
}


const faceMesh = new FaceMesh({locateFile: (file) => {
  return `./node_modules/@mediapipe/face_mesh/${file}`;
}});
faceMesh.setOptions({
  maxNumFaces: 1, //최대 얼굴의 수를 정해준다. 
  refineLandmarks: true, // 눈동자도 트래킹 해줌. Iris tracking
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5 // 수많은 랜드마크가 잡히고, 특정 probability를 따져서 화면에 보여준다. 설정 값 이상의 신뢰도가 주어져야 함.
});
faceMesh.onResults(onResults); // 콜백 펑션. 랜드마크를 생성하면 onResult를 콜백한다. 
 
//! 여기 잘 못쳤을지도 

videoElement.play();

async function detectionFrame(){
  await faceMesh.send({image: videoElement});
  videoElement.requestVideoFrameCallback(detectionFrame);
}

detectionFrame();