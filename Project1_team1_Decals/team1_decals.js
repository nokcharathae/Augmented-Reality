import * as THREE from './node_modules/three/build/three.module.js';
import { DecalGeometry } from './node_modules/three/examples/jsm/geometries/DecalGeometry.js';
import { TRIANGULATION } from './triangulation.js';
import { Vector3 } from 'three';

/* Input Video */
const videoElement = document.getElementsByClassName('input_video')[0];
const texture_video=new THREE.VideoTexture(videoElement); // scene background 

/* Renderer */
const renderer = new THREE.WebGLRenderer();
const render_w=640;
const render_h=480;

/* Scene */
const scene=new THREE.Scene();

/* Camera */
const near = 80;
const far=500;
const camera_ar=new THREE.PerspectiveCamera(63, render_w/render_h, near, far);

/* Light */
const light=new THREE.DirectionalLight(0xffffff,1.0);
const amb_light=new THREE.AmbientLight(0xffffff,0.4);

/* Light Helper */
const light_helper = new THREE.DirectionalLightHelper( light, 0 );

/* Mouse Helper */
let mouse_helper;
const position = new THREE.Vector3();
const orientation = new THREE.Euler();
const size = new THREE.Vector3( 10, 10, 10 );

const line_geo = new THREE.BufferGeometry();
line_geo.setFromPoints( [ new THREE.Vector3(), new THREE.Vector3() ] );
let line = new THREE.Line( line_geo, new THREE.LineBasicMaterial() );

/* Intersection */
const intersection = {
  is_intersected: false,
  point: new THREE.Vector3(),
  normal: new THREE.Vector3()
};
const mouse = new THREE.Vector2();
const intersects = [];
let dist;
let flag = false;

/* Raycaster */
let raycaster = new THREE.Raycaster();

/* Custom Mesh - FaceMesh */
let face_mesh = null;
let face_geometry=new THREE.BufferGeometry();
let face_material=new THREE.MeshPhongMaterial({color:new THREE.Color(1.0,1.0,1.0), specular: new THREE.Color(0,0,0), shininess:1});
   
/* Custom Mesh - Decal */
let decal_mesh, decal_material;
// 셋이 같이 다녀야 함 - decals, decals_vertex, decals_mat
let decals = [];          
const decals_vertex = [];
const decals_mat = [];
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

const params = {
  minScale: 10,
  maxScale: 20,
  rotate: true,
};

/* Scale */
let FirstZ = [];
let Scale_List = [];
let Orientation_List = [];

/* Initialize */
const p_c=new THREE.Vector3(0,0,0).unproject(camera_ar);
const vec_cam2center=new THREE.Vector3().subVectors(p_c,camera_ar.position);
const center_dist=vec_cam2center.length();

function init() {
  /* renderer setting */
  renderer.setSize(render_w,render_h);
  renderer.setViewport(0,0,render_w,render_h);
  document.body.appendChild(renderer.domElement);
  
  /* scene setting */  
  scene.background = texture_video;

  /* camera setting */
  camera_ar.position.set(0,0,100);
  camera_ar.lookAt(0,0,0);
  camera_ar.up.set(0,1,0);

  /* light setting */
  light.position.set(0,0,camera_ar.position.z-near);

  /* mouse setting */
  mouse_helper = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 10 ), new THREE.MeshNormalMaterial() );
  mouse_helper.visible = true;

  /* scene input */
  scene.add( light );
  scene.add( amb_light );
  scene.add( line );
  scene.add( light_helper );
  scene.add( mouse_helper );

  renderer.domElement.addEventListener( 'pointerup', onPointerUp ); 
  renderer.domElement.addEventListener( 'pointermove', onPointerMove );
}

function onPointerUp ( event ) {
  checkIntersection( event.clientX, event.clientY );
  if ( intersection.is_intersected ) shoot();
}

function onPointerMove( event ) {
    if ( event.isPrimary ) {     // 처음 클릭한 지점만 decal이 생기도록 함, 즉 드래그시에는 decal이 안생기도록 함
        checkIntersection( event.clientX, event.clientY );}
}

function checkIntersection( x, y ) {

    if ( face_mesh === undefined ) return;

    mouse.x = ( x / render_w ) * 2 - 1;
    mouse.y = - ( y / render_h ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera_ar );               // Updates the ray with a new origin and direction.
    raycaster.intersectObject( face_mesh, false, intersects ); // object : to check for intersection with the ray

    if ( intersects.length > 0 ) {
        // point of intersection, in world coordinates
        const p = intersects[ 0 ].point;
        mouse_helper.position.copy( p );
        intersection.point.copy( p );
        
        // normal of intersection, in world coordinates
        const n = intersects[ 0 ].face.normal.clone();
        n.transformDirection( face_mesh.matrixWorld );
        n.multiplyScalar( 10 );
        n.add( intersects[ 0 ].point );
        intersection.normal.copy( intersects[ 0 ].face.normal );
        mouse_helper.lookAt( n );

        // mouse helper position
        const positions = line.geometry.attributes.position;
        positions.setXYZ( 0, p.x, p.y, p.z );
        positions.setXYZ( 1, n.x, n.y, n.z );
        positions.needsUpdate = true;

        intersection.is_intersected = true;
        intersects.length = 0;
    } 

    else {
        intersection.is_intersected = false;} 
}

function ProjScale(p_ms,cam_pos,src_d,dst_d){
  let vec_cam2p=new THREE.Vector3().subVectors(p_ms,cam_pos);
  return new THREE.Vector3().addVectors(cam_pos,vec_cam2p.multiplyScalar(dst_d/src_d));
}

function onResults(results) {
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {    
      // FACEMESH_FACE_OVAL, landmarks
      if(face_mesh == null){
        face_geometry.setAttribute('position',new THREE.Float32BufferAttribute(landmarks.length*3,3));
        face_geometry.setAttribute('normal',new THREE.Float32BufferAttribute(landmarks.length*3,3));
        face_geometry.setAttribute('uv',new THREE.Float32BufferAttribute(landmarks.length*2,2));
        
        face_mesh=new THREE.Mesh(face_geometry,face_material);
        face_mesh.geometry.setIndex(TRIANGULATION);
      }

      /* update Face Mesh */
      let min_dist = 10;
      let min_vertex = 0;
      const num_points = landmarks.length; //478
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

        /* Find optimal vertex */
        if (flag) {
          dist = pos_ws.distanceTo(intersection.point);
          if (min_dist > dist) {
            min_dist = dist;
            min_vertex = i;}
        }
      }      

      face_mesh.geometry.attributes.position.needsUpdate=true;
      face_mesh.geometry.attributes.uv.needsUpdate=true;
      face_mesh.geometry.computeVertexNormals();

      if (flag) {
        decals_vertex.push(min_vertex);
        flag = false;
        min_dist = 10; 
        min_vertex = 0;
      }

      /* Update decals */
      if(decals != null) {
        for (let i=0; i<decals.length;i++){
          //console.log(decals_vertex[i]);
          const pos_ns=landmarks[decals_vertex[i]];
          const pos_ps=new THREE.Vector3((pos_ns.x-0.5)*2,-(pos_ns.y-0.5)*2,pos_ns.z);
          let pos_ws=new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);
          pos_ws=ProjScale(pos_ws,camera_ar.position,center_dist,100.0);

          scene.remove(decals[i]);

          if (FirstZ[i]==0) {
            FirstZ[i] = camera_ar.position.distanceTo( pos_ws );
          }

          else {
            let SetSize = Scale_List[i];
            let ViewScale= null;
            let Distance = null;

            /* Set size */
            Distance = camera_ar.position.distanceTo( pos_ws )
            let alpha = (FirstZ[i]-Distance)/Distance;
            ViewScale = SetSize + SetSize*alpha;
            console.log(i + "번째 : " + ViewScale)
            size.set(ViewScale, ViewScale, ViewScale);

          }

          /* Set orientation */
          orientation.x = Orientation_List[3*i+0]
          orientation.y = Orientation_List[3*i+1]
          orientation.z = Orientation_List[3*i+2]

          decal_mesh = new THREE.Mesh( new DecalGeometry( face_mesh, pos_ws, orientation, size ), decals_mat[i] );
          decals[i] = decal_mesh;

          scene.add(decals[i]);
        }
      }

      let texture_frame=new THREE.CanvasTexture(results.image);
      face_mesh.material.map=texture_frame;

      scene.add(face_mesh);

      light.target=face_mesh;
      renderer.render(scene, camera_ar); 
    }
  }
}

/* Input decals */
function shoot() {

    position.copy( intersection.point );
    orientation.copy( mouse_helper.rotation );

    // Random rotation
    if ( params.rotate ) orientation.z = Math.random() * 2 * Math.PI;
    Orientation_List.push(orientation.x)
    Orientation_List.push(orientation.y)
    Orientation_List.push(orientation.z)

    // Random scale
    const scale = params.minScale + Math.random() * ( params.maxScale - params.minScale );
    size.set( scale, scale, scale );
    Scale_List.push(scale);
    FirstZ.push(0);

    // Change color code 
    decal_material = decalMaterial.clone();
    decal_material.color.setHex( Math.random() * 0xffffff );
    decals_mat.push(decal_material);

    // Make decal mesh
    decal_mesh= new THREE.Mesh( new DecalGeometry( face_mesh, position, orientation, size ), decal_material ); 

    // Input decal in array
    decals.push( decal_mesh );
    scene.add( decals[decals.length-1] );

    // Is decal new
    flag = true;
}

init();

/* Define faceMesh */
const faceMesh = new FaceMesh({locateFile: (file) => {
  return `./node_modules/@mediapipe/face_mesh/${file}`;
}});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);

/* Play camera */
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({image: videoElement});
  },
  width: 1280,
  height: 720
});
camera.start();
