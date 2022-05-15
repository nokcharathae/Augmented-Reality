let px = ($light_eventX / 640) * 2 - 1;
let py = -($light_eventY / 480) * 2 + 1;

upperCanvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.deltaY < 0) camera_ar.near++;
    else camera_ar.near--;
    camera_ar.updateProjectionMatrix();

    let vector = new THREE.Vector3(px, py, -1); 
    let newPos = new THREE.Vector3(0, 0, 0);
    vector.unproject(camera_ar);
    //let dist = (camera_ar.near - camera_ar.position.z) / vector.z;
    //newPos.copy(camera_ar.position).add(vector.multiplyScalar(dist));
    $lightX = vector.x;
    $lightY = vector.y;
    mouseLight.position.set(
      $lightX,
      $lightY,
      camera_ar.position.z - camera_ar.near
    );
    mouseLight.lookAt(0, 0, 0);
    lightHelper.update();
  });