import * as THREE from 'three';

// Eye-level walk controls that work with a mouse and keyboard or a touch screen.
//
// Look: drag anywhere on the scene (mouse or finger).
// Walk: WASD or arrow keys, or the on-screen thumbstick on touch devices.

const LOOK_SPEED = 0.004; // radians per pixel dragged
const WALK_SPEED = 48; // inches per second (a relaxed walk)
const MAX_PITCH = THREE.MathUtils.degToRad(80);
const STICK_RADIUS = 48; // pixels the knob can travel from center

export class WalkControls {
  constructor(camera, element, { bounds, eyeHeight }) {
    this.camera = camera;
    this.element = element;
    this.bounds = bounds; // { minX, maxX, minZ, maxZ }
    this.eyeHeight = eyeHeight;

    this.yaw = 0;
    this.pitch = 0;
    this.keys = new Set();
    this.stick = { x: 0, y: 0 }; // -1..1 each way
    this.lookPointer = null;

    camera.rotation.order = 'YXZ';
    this.#bindLook();
    this.#bindKeys();
    this.#buildStick();
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
      this.yaw -= dx * LOOK_SPEED;
      this.pitch = THREE.MathUtils.clamp(this.pitch - dy * LOOK_SPEED, -MAX_PITCH, MAX_PITCH);
    });

    const release = (e) => {
      if (e.pointerId === this.lookPointer) this.lookPointer = null;
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  }

  #bindKeys() {
    const moveKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
    window.addEventListener('keydown', (e) => {
      if (!moveKeys.has(e.code)) return;
      this.keys.add(e.code);
      e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
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
    let forward = -this.stick.y;
    let right = this.stick.x;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) forward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) forward -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) right += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) right -= 1;

    const len = Math.hypot(forward, right);
    if (len > 1) {
      forward /= len;
      right /= len;
    }

    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const step = WALK_SPEED * dt;
    const pos = this.camera.position;
    pos.x += (-sin * forward + cos * right) * step;
    pos.z += (-cos * forward - sin * right) * step;

    const b = this.bounds;
    pos.x = THREE.MathUtils.clamp(pos.x, b.minX, b.maxX);
    pos.z = THREE.MathUtils.clamp(pos.z, b.minZ, b.maxZ);
    pos.y = this.eyeHeight;

    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
