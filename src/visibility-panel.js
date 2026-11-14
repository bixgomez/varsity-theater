// Side panel of toggle buttons that show and hide pieces of equipment.
// Each item: { id, label, objects: [THREE.Object3D], obstacles: [box] }.
// A hidden item also stops blocking movement, so you can walk where it was.

export function bindVisibilityPanel(items, onChange) {
  const list = document.querySelector('#show .show-list');
  if (!list) return;

  const visible = new Map(items.map((item) => [item.id, true]));

  const apply = () => {
    for (const item of items) {
      const on = visible.get(item.id);
      for (const obj of item.objects) obj.visible = on;
    }
    onChange?.(items.filter((item) => visible.get(item.id)));
  };

  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'show-toggle';
    button.textContent = item.label;
    button.setAttribute('aria-pressed', 'true');
    button.addEventListener('click', () => {
      const on = !visible.get(item.id);
      visible.set(item.id, on);
      button.setAttribute('aria-pressed', String(on));
      button.blur();
      apply();
    });
    const li = document.createElement('li');
    li.append(button);
    list.append(li);
  }

  apply();
}
