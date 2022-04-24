const videoElement = document.getElementsByClassName('input_video')[0];

import * as THREE from '/node_modules/three/build/three.module.js';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js'
import { Line2 } from '/node_modules/three/examples/jsm/lines/Line2.js';
import { LineMaterial } from '/node_modules/three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from '/node_modules/three/examples/jsm/lines/LineGeometry.js';
import { TRIANGULATION } from './triangulation.js';

// renderer
const renderer = new THREE.WebGLRenderer();
const render_w=640;
const render_h=480;
renderer.setSize(render_w,render_h);
renderer.setViewport(0,0,render_w,render_h);
document.body.appendChild(renderer.domElement);

const canvas = document.querySelector('#c');
const renderer_world = new THREE.WebGLRenderer({canvas});
renderer_world.setSize(render_w,render_h);
renderer_world.setViewport(0,0,render_w,render_h);
document.body.appendChild(renderer_world.domElement);

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

const camera_perspective=new THREE.PerspectiveCamera(45, render_w/render_h,near,far);
camera_perspective.position.set(0,0,100);
camera_perspective.lookAt(0,0,0);
camera_perspective.up.set(0,1,0);

const camera_wolrd=new THREE.PerspectiveCamera(75, render_w/render_h,0.01,10000);
camera_wolrd.position.set(35,0,200);
camera_wolrd.lookAt(0,0,0);
camera_wolrd.up.set(0,1,0);

const cameraPerspectiveHelper= new THREE.CameraHelper( camera_perspective );
scene.add( cameraPerspectiveHelper );

// light
const light=new THREE.DirectionalLight(0xffffff,1.0);
const amb_light=new THREE.AmbientLight(0xffffff,0.5);
light.position.set(0,0,camera_ar.position.z-near);

const light_helper = new THREE.DirectionalLightHelper( light, 0 );
scene.add(light);
scene.add(amb_light);
scene.add( light_helper );

// point, line, face_mesh
let lines;
const mgeometry = new LineGeometry();
const mmaterial = new LineMaterial( { color: 0x00ffff, linewidth: 2 } );

let oval_point_mesh=null;
let face_mesh=null;

// far plane
const hFar = 2 * Math.tan(camera_perspective.fov * Math.PI / 180 / 2) * camera_perspective.far; // height
const wFar = hFar * camera_perspective.aspect; // width

const plane_geometry = new THREE.PlaneGeometry(wFar, hFar );
const plane_material = new THREE.MeshBasicMaterial( { map: texture_video } );
const plane = new THREE.Mesh( plane_geometry, plane_material );
plane.position.set(0,0,camera_ar.position.z-far);
plane.lookAt(camera_ar.position);

// mouse event
renderer.domElement.addEventListener("mousedown", mouseDownHandler, false);
renderer.domElement.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener('mouseup', mouseUpHandler, false);
renderer.domElement.addEventListener("wheel", mouseWheel, false);

let down=0;
let light_pos_ps=new THREE.Vector3(light.position.x,light.position.y,-1);
let light_pos_ws;

function light_update(){
  light_pos_ws=new THREE.Vector3(light_pos_ps.x,light_pos_ps.y,light_pos_ps.z).unproject(camera_perspective);
  light.position.set(light_pos_ws.x,light_pos_ws.y,light_pos_ws.z); 
  camera_perspective.updateProjectionMatrix();
  cameraPerspectiveHelper.update();
  light_helper.update();
}

function mouseDownHandler(e) {
  down=1;
  light_pos_ps=new THREE.Vector3((e.clientX / render_w) * 2.0 -1.0,
  -(e.clientY / render_h) * 2.0+1.0,-1);
  light_update();
}

function mouseMoveHandler(e) {
  if (down==1){
    light_pos_ps=new THREE.Vector3((e.clientX / render_w) * 2.0 -1.0,
  -(e.clientY / render_h) * 2.0+1.0,-1);
    light_update();
  }
}

function mouseUpHandler(e) {
  down=0;
}

function mouseWheel(e) {
  if (e.deltaY > 0) { // wheel down
    camera_perspective.near-=1;
  }
  else { // wheel up
    camera_perspective.near+=1;
  }
  light_update();
}

// OrbitControls
const controls = new OrbitControls( camera_wolrd, renderer_world.domElement );
controls.listenToKeyEvents( renderer_world.domElement ); // optional
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.05;

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

      const num_oval_points=FACEMESH_FACE_OVAL.length;
      let positions=oval_point_mesh.geometry.attributes.position.array;
      const center_position =new THREE.Vector3(0,0,0);
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

        center_position.x+=pos_ws.x;
        center_position.y+=pos_ws.y;
        center_position.z+=pos_ws.z;
      }
      center_position.x=center_position.x/num_oval_points;
      center_position.y=center_position.y/num_oval_points;
      center_position.z=center_position.z/num_oval_points;
      
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

      //camera_wolrd.lookAt(center_position);
      controls.target.set(center_position.x,center_position.y,center_position.z);
      controls.update();

      plane_material.map=texture_frame;
      scene.background = texture_video;
      scene.remove(cameraPerspectiveHelper);
      scene.remove(light_helper);
      scene.remove( plane );
      renderer.render(scene, camera_perspective);

      scene.background=null;
      scene.add(cameraPerspectiveHelper);
      scene.add(light_helper);
      scene.add( plane );
      renderer_world.render(scene, camera_wolrd);
    }
  }
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