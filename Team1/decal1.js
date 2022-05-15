import * as THREE from 'three';

			import { GUI } from '/node_modules/three/examples/jsm/libs/lil-gui.module.min.js';

			import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
			import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
			import { DecalGeometry } from '/node_modules/three/examples/jsm/geometries/DecalGeometry.js';

			const container = document.getElementById( 'container' );

			let renderer, scene, camera;
			let mesh;
			let raycaster;
			let line;

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

			const params = {
				minScale: 10,
				maxScale: 20,
				rotate: true,
				clear: function () {

					removeDecals();
				}
			};

			window.addEventListener( 'load', init );

			function init() {

				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				container.appendChild( renderer.domElement );


				scene = new THREE.Scene();

				camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
				camera.position.z = 120;

				const controls = new OrbitControls( camera, renderer.domElement );
				controls.minDistance = 50;
				controls.maxDistance = 200;

				scene.add( new THREE.AmbientLight( 0x443333 ) );

				const dirLight1 = new THREE.DirectionalLight( 0xffddcc, 1 );
				dirLight1.position.set( 1, 0.75, 0.5 );
				scene.add( dirLight1 );

				const dirLight2 = new THREE.DirectionalLight( 0xccccff, 1 );
				dirLight2.position.set( - 1, 0.75, - 0.5 );
				scene.add( dirLight2 );

                // mouse helper
				const geometry = new THREE.BufferGeometry();
				geometry.setFromPoints( [ new THREE.Vector3(), new THREE.Vector3() ] );
				line = new THREE.Line( geometry, new THREE.LineBasicMaterial() );
				scene.add( line );

				loadLeePerrySmith();

				raycaster = new THREE.Raycaster();

				mouseHelper = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 10 ), new THREE.MeshNormalMaterial() );
				mouseHelper.visible = true;
				scene.add( mouseHelper );

				window.addEventListener( 'resize', onWindowResize );

				let moved = false;

				controls.addEventListener( 'change', function () {

					moved = true;

				} );

				window.addEventListener( 'pointerdown', function () {

					moved = false;

				} );

				window.addEventListener( 'pointerup', function ( event ) {

					if ( moved === false ) {

						checkIntersection( event.clientX, event.clientY );

						if ( intersection.is_intersected ) shoot();

					}

				} );

				window.addEventListener( 'pointermove', onPointerMove );

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
					raycaster.setFromCamera( mouse, camera );
                    // mesh랑 부딛히면 intersects에 정보 저장
                    // https://threejs.org/docs/#api/en/core/Raycaster.intersectObject
                    // intersects[] 고민해봐야할듯
					raycaster.intersectObject( mesh, false, intersects );
					if ( intersects.length > 0 ) {
                        
                        // point of intersection, in world coordinates
						const p = intersects[ 0 ].point;
						mouseHelper.position.copy( p );
						intersection.point.copy( p );
                        
						const n = intersects[ 0 ].face.normal.clone();
                        // 행렬(m의 왼쪽 위 3 x 3 부분 집합)을a 사용하여 이 벡터의 방향을 변환한 다음 결과를 정규화합니다.
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
						console.log(positions);

                        //console.log(intersects[ 0 ]);
						intersection.is_intersected = true;
						intersects.length = 0;
                        
					} 
                    else {

						intersection.is_intersected = false;

					}
                    
				}

				const gui = new GUI();

				gui.add( params, 'minScale', 1, 30 );
				gui.add( params, 'maxScale', 1, 30 );
				gui.add( params, 'rotate' );
				gui.add( params, 'clear' );
				gui.open();

				onWindowResize();
				animate();

			}

			function loadLeePerrySmith() {

				const loader = new GLTFLoader();

				loader.load( 'LeePerrySmith.glb', function ( gltf ) {

					mesh = gltf.scene.children[ 0 ];
					mesh.material = new THREE.MeshPhongMaterial( {
						specular: 0x111111,
						map: textureLoader.load( 'Map-COL.jpg' ),
						specularMap: textureLoader.load( 'Map-SPEC.jpg' ),
						normalMap: textureLoader.load( 'Infinite-Level_02_Tangent_SmoothUV.jpg' ),
						shininess: 25
					} );

					scene.add( mesh );
					mesh.scale.set( 10, 10, 10 );

				} );

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

				const m = new THREE.Mesh( new DecalGeometry( mesh, position, orientation, size ), material );
                
				decals.push( m );
				scene.add( m );

			}

			function removeDecals() {

				decals.forEach( function ( d ) {

					scene.remove( d );

				} );

				decals.length = 0;

			}

			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

			}

			function animate() {

				requestAnimationFrame( animate );

				renderer.render( scene, camera );

			}
