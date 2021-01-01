<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import {
    Euler,
    Raycaster,
    Vector2,
    Vector3,
  } from 'three';

  const dispatch = createEventDispatcher();

  export let isLocked = false;

  const aux = {
    euler: new Euler(0, 0, 0, 'YXZ'),
    direction: new Vector3(),
    forward: new Vector3(),
    right: new Vector3(),
    worldUp: new Vector3(0, 1, 0),
  };

  const buttons = {
    primary: false,
    secondary: false,
    tertiary: false,
  };
  const crosshair = new Vector2(0, 0);
  const keyboard = new Vector3(0, 0, 0);
  const pointer = new Vector2(0, 0);
  const raycaster = new Raycaster();
  let speed = 8;
  
  onMount(() => {
    document.addEventListener('pointerlockchange', onPointerLock);
  });

  onDestroy(() => {
    document.removeEventListener('pointerlockchange', onPointerLock);
    if (isLocked) {
      document.exitPointerLock();
    }
  });

  export const onAnimationTick = ({
    animation: { delta },
    camera,
    player,
  }) => {
    if (!isLocked) {
      return;
    }

    let hasMoved = false;

    if (pointer.x !== 0 || pointer.y !== 0) {
      const { euler } = aux;
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= pointer.x * 0.002;
      euler.x -= pointer.y * 0.002;
      const PI_2 = Math.PI / 2;
      euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
      camera.quaternion.setFromEuler(euler);
      pointer.set(0, 0);
      hasMoved = true;
    }
  
    if (keyboard.x !== 0 || keyboard.y !== 0 || keyboard.z !== 0) {
      const {
        direction,
        forward,
        right,
        worldUp,
      } = aux;
      camera.getWorldDirection(forward);
      right.crossVectors(forward, worldUp);
      direction
        .set(0, 0, 0)
        .addScaledVector(right, keyboard.x)
        .addScaledVector(worldUp, keyboard.y)
        .addScaledVector(forward, keyboard.z)
        .normalize();
      player.position.addScaledVector(direction, delta * speed);
      hasMoved = true;
    }

    if (hasMoved) {
      raycaster.setFromCamera(crosshair, camera);
      dispatch('movement', { raycaster });
    }

    if (
      buttons.primary
      || buttons.primaryDown
      || buttons.primaryUp
      || buttons.secondary
      || buttons.secondaryDown
      || buttons.secondaryUp
      || buttons.tertiary
      || buttons.tertiaryDown
      || buttons.tertiaryUp
    ) {
      raycaster.setFromCamera(crosshair, camera);
      dispatch('buttons', { buttons: { ...buttons }, raycaster });
      ['primary', 'secondary', 'tertiary'].forEach((button) => {
        buttons[`${button}Down`] = false;
        buttons[`${button}Up`] = false;
      });
    }
  };

  export const request = () => {
    if (isLocked) {
      return;
    }
    document.body.requestPointerLock();
  };

  export const setup = ({ player }) => {
    player.camera.position.set(0, 0, 0);
    player.camera.rotation.set(0, 0, 0);
  };

  const onBlur = () => {
    ['primary', 'secondary', 'tertiary'].forEach((button) => {
      buttons[button] = false;
      buttons[`${button}Down`] = false;
      if (buttons[button]) {
        buttons[`${button}Up`] = true;
      }
    });
    keyboard.set(0, 0, 0);
  };

  const onKeyDown = ({ keyCode, repeat }) => {
    if (repeat) return;
    switch (keyCode) {
      case 16:
        keyboard.y = -1;
        break;
      case 32:
        keyboard.y = 1;
        break;
      case 87:
        keyboard.z = 1;
        break;
      case 83:
        keyboard.z = -1;
        break;
      case 65:
        keyboard.x = -1;
        break;
      case 68:
        keyboard.x = 1;
        break;
      default:
        break;
    }
  };

  const onKeyUp = ({ keyCode, repeat }) => {
    if (repeat) return;
    switch (keyCode) {
      case 16:
      case 32:
        keyboard.y = 0;
        break;
      case 87:
      case 83:
        keyboard.z = 0;
        break;
      case 65:
      case 68:
        keyboard.x = 0;
        break;
      default:
        break;
    }
  };

  const onMouseDown = ({ button }) => {
    if (!isLocked) {
      return;
    }
    switch (button) {
      case 0:
        buttons.primary = true;
        buttons.primaryDown = true;
        break;
      case 2:
        buttons.secondary = true;
        buttons.secondaryDown = true;
        break;
      case 1:
        buttons.tertiary = true;
        buttons.tertiaryDown = true;
        break;
      default:
        break;
    }
  };

  const onMouseMove = ({ movementX, movementY }) => {
    if (!isLocked) {
      return;
    }
    pointer.set(movementX, movementY);
  };

  const onMouseUp = ({ button }) => {
    if (buttons.primary && button === 0) {
      buttons.primary = false;
      buttons.primaryUp = true;
    }
    if (buttons.secondary && button === 2) {
      buttons.secondary = false;
      buttons.secondaryUp = true;
    }
    if (buttons.tertiary && button === 1) {
      buttons.tertiary = false;
      buttons.tertiaryUp = true;
    }
  };

  const minSpeed = Math.log(2);
  const maxSpeed = Math.log(32);
  const speedRange = maxSpeed - minSpeed;
  const wheelSensitivity = 0.0003;
  const onWheel = ({ deltaY }) => {
    const logSpeed = Math.log(speed);
    speed = (logSpeed - minSpeed) / speedRange;
    speed = Math.min(Math.max(speed - (-deltaY * wheelSensitivity), 0), 1);
    speed = Math.exp(minSpeed + speed * speedRange);
  };

  const onPointerLock = () => {
    isLocked = !!document.pointerLockElement;
  };
</script>

<svelte:window
  on:blur={onBlur}
  on:keydown={onKeyDown}
  on:keyup={onKeyUp}
  on:mousedown={onMouseDown}
  on:mousemove={onMouseMove}
  on:mouseup={onMouseUp}
  on:wheel={onWheel}
/>
