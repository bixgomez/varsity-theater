// Side panel of toggle buttons that show and hide pieces of equipment.
// Each item: { id, label, objects: [THREE.Object3D], obstacles: [box] }.
// A hidden item also stops blocking movement, so you can walk where it was.
// onChange(shown, previous) sets the collision boxes; returning false keeps
// the old state.

export function bindVisibilityPanel(items, onChange) {
  const list = document.querySelector('#show .show-list');
  if (!list) return;

  const visible = new Map(items.map((item) => [item.id, true]));

  const shownItems = () => items.filter((item) => visible.get(item.id));

  const render = () => {
    for (const item of items) {
      const on = visible.get(item.id);
      for (const obj of item.objects) obj.visible = on;
    }
  };

  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'show-toggle';
    button.textContent = item.label;
    button.setAttribute('aria-pressed', 'true');
    button.addEventListener('click', () => {
      button.blur();
      const previous = shownItems();
      const on = !visible.get(item.id);
      visible.set(item.id, on);
      // onChange may refuse (return false), for example when there's no room
      // to step out of a piece being shown around you.
      if (onChange?.(shownItems(), previous) === false) {
        visible.set(item.id, !on);
        return;
      }
      button.setAttribute('aria-pressed', String(on));
      render();
    });
    const li = document.createElement('li');
    li.append(button);
    list.append(li);
  }

  render();
}
