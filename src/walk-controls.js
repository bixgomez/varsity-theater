import * as THREE from 'three';

// Eye-level walk controls that work with a mouse and keyboard or a touch screen.
//
// Look: drag anywhere on the scene (mouse or finger).
// Walk: the on-screen thumbstick on touch devices, or the keyboard:
//   Up / W, Down / S   walk forward, back
//   A, D               strafe left, right
//   Left, Right        turn
//   Shift + arrows     Up/Down move up and down, Left/Right strafe
//   E, Q               move up, down
//   Z, C               tilt the view up, down
//   Ctrl or Option + Up/Down   tilt the view up, down
//   X                  smoothly level the view

const LOOK_SPEED = 0.004; // radians per pixel dragged
const WALK_SPEED = 48; // inches per second (a relaxed walk)
const TURN_SPEED = 2; // radians per second (keyboard turn and tilt)
const NUDGE_DISTANCE = 24; // inches a double-click moves you forward
const NUDGE_SPEED = 120; // inches per second while gliding
const MAX_PITCH = THREE.MathUtils.degToRad(80);
const STICK_RADIUS = 48; // pixels the knob can travel from center

export class WalkControls {
  constructor(camera, element, { canBeAt, eyeHeight }) {
    this.camera = camera;
    this.element = element;
    this.canBeAt = canBeAt; // (x, y, z) => true where the camera may be
    this.eyeHeight = eyeHeight;

    this.yaw = 0;
    this.pitch = 0;
    this.move = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      turnLeft: false,
      turnRight: false,
      up: false,
      down: false,
      tiltUp: false,
      tiltDown: false,
    };
    this.leveling = false;
    this.nudge = 0; // inches of forward glide still to travel
    this.stick = { x: 0, y: 0 }; // -1..1 each way
    this.lookPointer = null;

    camera.rotation.order = 'YXZ';
    this.#bindLook();
    this.#bindKeys();
    this.#buildStick();
  }

  // Footprints you can't walk through: { minX, maxX, minZ, maxZ }, plus an
  // optional minY and maxY for the heights they block.
  setObstacles(obstacles, margin = 8) {
    this.obstacles = obstacles;
    this.obstacleMargin = margin;
  }

  #blocked(x, y, z) {
    if (!this.canBeAt(x, y, z)) return true;
    const m = this.obstacleMargin ?? 0;
    return (this.obstacles ?? []).some(
      (o) =>
        x > o.minX - m &&
        x < o.maxX + m &&
        z > o.minZ - m &&
        z < o.maxZ + m &&
        y >= (o.minY ?? -Infinity) &&
        y <= (o.maxY ?? Infinity),
    );
  }

  setPosition(x, z) {
    this.camera.position.set(x, this.eyeHeight, z);
  }

  setYaw(radians) {
    this.yaw = radians;
  }

  #bindLook() {
    const el = this.element;
    el.style.touchAction = 'none';

    el.addEventListener('pointerdown', (e) => {
      if (this.lookPointer !== null) return;
      this.lookPointer = e.pointerId;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.lookPointer) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.yaw += dx * LOOK_SPEED;
      this.pitch = THREE.MathUtils.clamp(this.pitch + dy * LOOK_SPEED, -MAX_PITCH, MAX_PITCH);
      this.leveling = false;
    });

    // Double-click glides forward; Shift + double-click glides back.
    el.addEventListener('dblclick', (e) => {
      this.nudge = e.shiftKey ? -NUDGE_DISTANCE : NUDGE_DISTANCE;
    });

    const release = (e) => {
      if (e.pointerId === this.lookPointer) this.lookPointer = null;
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  }

  #bindKeys() {
    const m = this.move;

    // A swallowed key-up (Command shortcuts, focus changes) would leave a
    // key stuck down, so clear everything in those cases.
    const clearKeys = () => {
      for (const key of Object.keys(m)) m[key] = false;
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'MetaLeft' || e.code === 'MetaRight') {
        clearKeys();
        return;
      }
      if (e.metaKey) return;

      // Ctrl, or Option on a Mac (Ctrl + arrow is taken by Mission Control).
      if (e.ctrlKey || e.altKey) {
        if (e.code === 'ArrowUp') m.tiltUp = true;
        else if (e.code === 'ArrowDown') m.tiltDown = true;
        else return;
        this.leveling = false;
        e.preventDefault();
        return;
      }

      if (e.shiftKey) {
        if (e.code === 'ArrowUp') m.up = true;
        else if (e.code === 'ArrowDown') m.down = true;
        else if (e.code === 'ArrowLeft') m.left = true;
        else if (e.code === 'ArrowRight') m.right = true;
        else return;
        e.preventDefault();
        return;
      }

      switch (e.code) {
        case 'ArrowUp': case 'KeyW': m.forward = true; break;
        case 'ArrowDown': case 'KeyS': m.backward = true; break;
        case 'KeyA': m.left = true; break;
        case 'KeyD': m.right = true; break;
        case 'ArrowLeft': m.turnLeft = true; break;
        case 'ArrowRight': m.turnRight = true; break;
        case 'KeyZ': m.tiltUp = true; this.leveling = false; break;
        case 'KeyC': m.tiltDown = true; this.leveling = false; break;
        case 'KeyX': this.leveling = true; break;
        case 'KeyE': m.up = true; break;
        case 'KeyQ': m.down = true; break;
        default: return;
      }
      e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'MetaLeft' || e.code === 'MetaRight') {
        clearKeys();
        return;
      }
      switch (e.code) {
        case 'ArrowUp': m.forward = false; m.up = false; m.tiltUp = false; break;
        case 'ArrowDown': m.backward = false; m.down = false; m.tiltDown = false; break;
        case 'ArrowLeft': m.turnLeft = false; m.left = false; break;
        case 'ArrowRight': m.turnRight = false; m.right = false; break;
        case 'KeyW': m.forward = false; break;
        case 'KeyS': m.backward = false; break;
        case 'KeyA': m.left = false; break;
        case 'KeyD': m.right = false; break;
        case 'KeyZ': m.tiltUp = false; break;
        case 'KeyC': m.tiltDown = false; break;
        case 'KeyE': m.up = false; break;
        case 'KeyQ': m.down = false; break;
      }
    });

    window.addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearKeys();
    });
  }

  #buildStick() {
    const base = document.createElement('div');
    base.className = 'stick';
    base.setAttribute('aria-hidden', 'true');
    const knob = document.createElement('div');
    knob.className = 'stick-knob';
    base.appendChild(knob);
    document.body.appendChild(base);

    let active = null;
    let cx = 0;
    let cy = 0;

    const moveKnob = (e) => {
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > STICK_RADIUS) {
        dx = (dx / dist) * STICK_RADIUS;
        dy = (dy / dist) * STICK_RADIUS;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.stick.x = dx / STICK_RADIUS;
      this.stick.y = dy / STICK_RADIUS;
    };

    base.addEventListener('pointerdown', (e) => {
      if (active !== null) return;
      active = e.pointerId;
      const r = base.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      base.setPointerCapture(e.pointerId);
      moveKnob(e);
    });
    base.addEventListener('pointermove', (e) => {
      if (e.pointerId === active) moveKnob(e);
    });
    const release = (e) => {
      if (e.pointerId !== active) return;
      active = null;
      knob.style.transform = '';
      this.stick.x = 0;
      this.stick.y = 0;
    };
    base.addEventListener('pointerup', release);
    base.addEventListener('pointercancel', release);
  }

  update(dt) {
    // Combine keyboard and thumbstick into forward/right amounts.
    const m = this.move;
    let forward = -this.stick.y;
    let right = this.stick.x;
    if (m.forward) forward += 1;
    if (m.backward) forward -= 1;
    if (m.right) right += 1;
    if (m.left) right -= 1;

    // Keyboard turn and tilt.  Left arrow turns left (positive yaw).
    if (m.turnLeft) this.yaw += TURN_SPEED * dt;
    if (m.turnRight) this.yaw -= TURN_SPEED * dt;
    if (m.tiltUp) this.pitch += TURN_SPEED * dt;
    if (m.tiltDown) this.pitch -= TURN_SPEED * dt;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -MAX_PITCH, MAX_PITCH);

    // Ease the tilt back to level.
    if (this.leveling) {
      this.pitch += (0 - this.pitch) * (1 - Math.exp(-dt * 12));
      if (Math.abs(this.pitch) < 0.0005) {
        this.pitch = 0;
        this.leveling = false;
      }
    }

    const len = Math.hypot(forward, right);
    if (len > 1) {
      forward /= len;
      right /= len;
    }

    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const step = WALK_SPEED * dt;
    const pos = this.camera.position;

    // Move one axis at a time, so you slide along an obstacle instead of
    // sticking to it.
    const glide = Math.sign(this.nudge) * Math.min(Math.abs(this.nudge), NUDGE_SPEED * dt);
    this.nudge -= glide;

    const nextX = pos.x + (-sin * forward + cos * right) * step - sin * glide;
    if (!this.#blocked(nextX, pos.y, pos.z)) pos.x = nextX;
    const nextZ = pos.z + (-cos * forward - sin * right) * step - cos * glide;
    if (!this.#blocked(pos.x, pos.y, nextZ)) pos.z = nextZ;
    const nextY = pos.y + ((m.up ? 1 : 0) - (m.down ? 1 : 0)) * step;
    if (!this.#blocked(pos.x, nextY, pos.z)) pos.y = nextY;

    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
