const videoElement = document.getElementsByClassName('input_video')[0];

import * as THREE from '/node_modules/three/build/three.module.js';
import { DecalGeometry } from '/node_modules/three/examples/jsm/geometries/DecalGeometry.js';
import { TRIANGULATION } from '../triangulation.js';

let oval_point_mesh=null;
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
const amb_light=new THREE.AmbientLight(0xffffff,0.5);
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


const intersection = {
    is_intersected: false,
    point: new THREE.Vector3(),
    normal: new THREE.Vector3()
};
const mouse = new THREE.Vector2();
const intersects = [];

const textureLoader = new THREE.TextureLoader();
const decalDiffuse = textureLoader.load( 'blood_diffuse.png' );
const decalNormal = textureLoader.load( 'blood_normal.jpg' );

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

// 삭제하려고 만든 배열
const decals = [];
let mouseHelper;
const position = new THREE.Vector3();
const orientation = new THREE.Euler();
const size = new THREE.Vector3( 10, 10, 10 );

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

    mouse.x = ( x / window.innerWidth ) * 2 - 1;
    mouse.y = - ( y / window.innerHeight ) * 2 + 1;

    // camera -> ndc 
    raycaster.setFromCamera( mouse, camera_ar );
    // mesh랑 부딛히면 intersects에 정보 저장
    // https://threejs.org/docs/#api/en/core/Raycaster.intersectObject
    // intersects[] 고민해봐야할듯
    raycaster.intersectObject( mesh, false, intersects );
    //console.log(intersects);
    if ( intersects.length > 0 ) {
        
        // point of intersection, in world coordinates
        const p = intersects[ 0 ].point;
        mouseHelper.position.copy( p );
        intersection.point.copy( p );
        
        const n = intersects[ 0 ].face.normal.clone();
        // 행렬(m의 왼쪽 위 3 x 3 부분 집합)을 사용하여 이 벡터의 방향을 변환한 다음 결과를 정규화합니다.
        // 교수님한테 물어보기
        n.transformDirection( mesh.matrixWorld );
        // 선의 길이
        n.multiplyScalar( 10 );
        // 왜 더함?;
        // 추측 : 벡터의 시작을 정해주는 것은 아닌지?
        n.add( intersects[ 0 ].point );

        intersection.normal.copy( intersects[ 0 ].face.normal );
        mouseHelper.lookAt( n );

        // mouse helper position
        const positions = line.geometry.attributes.position;
        // line의 처음과 끝 점
        positions.setXYZ( 0, p.x, p.y, p.z );
        positions.setXYZ( 1, n.x, n.y, n.z );
        positions.needsUpdate = true;

        //console.log(intersects[ 0 ]);
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
        //scene.add(oval_point_mesh);


        let face_geometry=new THREE.BufferGeometry();
        face_geometry.setAttribute('position',new THREE.Float32BufferAttribute(landmarks.length*3,3));
        face_geometry.setAttribute('normal',new THREE.Float32BufferAttribute(landmarks.length*3,3));
        face_geometry.setAttribute('uv',new THREE.Float32BufferAttribute(landmarks.length*2,2));
        
        let face_material=new THREE.MeshPhongMaterial({color:new THREE.Color(1.0,1.0,1.0), specular: new THREE.Color(0,0,0), shininess:1});
        face_mesh=new THREE.Mesh(face_geometry,face_material);
        face_mesh.geometry.setIndex(TRIANGULATION);
        mesh=face_mesh;

        scene.add(face_mesh);
        objects.push(face_mesh);
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

      for (let i=0; i<decals.length;i++){
        position.copy( intersection.point );
        orientation.copy( mouseHelper.rotation );


        if ( params.rotate ) orientation.z = Math.random() * 2 * Math.PI;

        
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
    const material = decalMaterial.clone();
    material.color.setHex( Math.random() * 0xffffff );

    m= new THREE.Mesh( new DecalGeometry( mesh, position, orientation, size ), material );
    
    decals.push( m );
    //scene.add( m );
    face_mesh.add(m);
    objects.push(m);

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