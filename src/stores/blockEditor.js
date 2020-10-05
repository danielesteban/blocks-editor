import { writable } from 'svelte/store';

export default () => {
  const { subscribe, set } = writable(undefined);
  const update = (type) => {
    set(type);
    requestAnimationFrame(() => (
      window.dispatchEvent(new Event('resize'))
    ));
  };
  return {
    subscribe,
    close() {
      update(undefined);
    },
    open(type) {
      update(type);
    },
  };
};
