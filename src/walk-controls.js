import * as THREE from 'three';

// Eye-level walk controls that work with a mouse and keyboard or a touch screen.
//
// Look: drag anywhere on the scene (mouse or finger).
// Two-finger pinch (touch): spread out to walk forward, pinch in to walk back.
// Three-finger drag (touch): up and down changes height, left and right
// slides sideways.
// Trackpad pinch (desktop): spread to walk forward, pinch to walk back.
// Trackpad two-finger drag (desktop): up and down changes height, left and
// right slides sideways.  Directions assume macOS natural scrolling.
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
const TILT_SPEED = 1; // radians per second (keyboard tilt: Z, C, Ctrl or Option + Up/Down)
const YAW_SPEED = 1; // radians per second (left and right arrow turn)
const NUDGE_DISTANCE = 24; // inches a double-click moves you forward
const NUDGE_SPEED = 120; // inches per second while gliding
const MAX_PITCH = THREE.MathUtils.degToRad(80);
const STICK_RADIUS = 48; // pixels the knob can travel from center
const DRIFT_SPEED = 0.3; // inches moved per pixel of three-finger drag
const PINCH_SPEED = 0.5; // inches walked per pixel the two fingers close or spread
const TRACKPAD_PINCH_SPEED = 0.5; // inches walked per unit of ctrl + wheel delta
const SAFARI_PINCH_SPEED = 200; // inches walked per unit of gesture scale change
const WHEEL_DRIFT_SPEED = 0.3; // inches moved per pixel of two-finger trackpad drag
const WHEEL_LINE = 16; // pixels per line, for wheels that report in lines

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
    this.touches = new Map(); // touch pointers on the scene: id => { x, y }
    this.multiTouch = false; // three fingers went down; stays on until all lift
    this.pinch = false; // two fingers went down; stays on until all lift
    this.pinchSpread = 0; // last distance between the two pinch fingers
    this.drift = { forward: 0, right: 0, up: 0 }; // inches of touch gesture still to apply

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
      if (e.pointerType === 'touch') {
        this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.touches.size >= 3) {
          this.multiTouch = true;
          this.pinch = false;
          this.lookPointer = null;
        } else if (this.touches.size === 2 && !this.multiTouch) {
          this.pinch = true;
          this.pinchSpread = this.#spread();
          this.lookPointer = null;
        }
      }
      if (this.multiTouch || this.pinch || this.lookPointer !== null) return;
      this.lookPointer = e.pointerId;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointermove', (e) => {
      const touch = this.touches.get(e.pointerId);
      if (touch) {
        const tdx = e.clientX - touch.x;
        const tdy = e.clientY - touch.y;
        touch.x = e.clientX;
        touch.y = e.clientY;
        if (this.multiTouch) {
          // Average the fingers, so the move follows the middle of the hand.
          const share = DRIFT_SPEED / this.touches.size;
          this.drift.right += tdx * share;
          this.drift.up -= tdy * share;
          return;
        }
        if (this.pinch) {
          if (this.touches.size === 2) {
            const spread = this.#spread();
            this.drift.forward += (spread - this.pinchSpread) * PINCH_SPEED;
            this.pinchSpread = spread;
          }
          return;
        }
      }
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
      this.touches.delete(e.pointerId);
      if (this.touches.size === 0) {
        this.multiTouch = false;
        this.pinch = false;
      }
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);

    // Trackpad pinch.  Chrome and Firefox report it as a wheel event with
    // ctrlKey set (negative deltaY when spreading).  Safari sends its own
    // gesture events with a scale instead.  Either way, block the browser's
    // page zoom.  These listen on the window, so nothing layered over the
    // scene can swallow them.  The amount joins the forward glide, which
    // carries over from frame to frame, so a fast pinch isn't lost when one
    // big step would land somewhere blocked.
    let safariScale = null;
    window.addEventListener(
      'wheel',
      (e) => {
        // Over the help panel, let it scroll; still block page zoom.
        if (e.target !== el) {
          if (e.ctrlKey) e.preventDefault();
          return;
        }
        e.preventDefault();
        if (!e.ctrlKey) {
          // Two-finger drag.  With natural scrolling, fingers moving up give
          // a positive deltaY and fingers moving right a negative deltaX.
          const unit = e.deltaMode === 1 ? WHEEL_LINE : 1;
          this.drift.up += e.deltaY * unit * WHEEL_DRIFT_SPEED;
          this.drift.right -= e.deltaX * unit * WHEEL_DRIFT_SPEED;
          return;
        }
        if (safariScale !== null) return;
        this.nudge -= e.deltaY * TRACKPAD_PINCH_SPEED;
      },
      { passive: false },
    );
    window.addEventListener('gesturestart', (e) => {
      e.preventDefault();
      safariScale = e.scale;
    });
    window.addEventListener('gesturechange', (e) => {
      e.preventDefault();
      if (safariScale === null || this.touches.size > 0) return;
      this.nudge += (e.scale - safariScale) * SAFARI_PINCH_SPEED;
      safariScale = e.scale;
    });
    window.addEventListener('gestureend', (e) => {
      e.preventDefault();
      safariScale = null;
    });
  }

  // Distance in pixels between the first two touch points.
  #spread() {
    const [a, b] = this.touches.values();
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
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
    if (m.turnLeft) this.yaw += YAW_SPEED * dt;
    if (m.turnRight) this.yaw -= YAW_SPEED * dt;
    if (m.tiltUp) this.pitch += TILT_SPEED * dt;
    if (m.tiltDown) this.pitch -= TILT_SPEED * dt;
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

    const drift = this.drift;
    const nextX = pos.x + (-sin * forward + cos * right) * step - sin * glide - sin * drift.forward + cos * drift.right;
    if (!this.#blocked(nextX, pos.y, pos.z)) pos.x = nextX;
    const nextZ = pos.z + (-cos * forward - sin * right) * step - cos * glide - cos * drift.forward - sin * drift.right;
    if (!this.#blocked(pos.x, pos.y, nextZ)) pos.z = nextZ;
    const nextY = pos.y + ((m.up ? 1 : 0) - (m.down ? 1 : 0)) * step + drift.up;
    drift.forward = 0;
    drift.right = 0;
    drift.up = 0;
    if (!this.#blocked(pos.x, nextY, pos.z)) pos.y = nextY;

    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
