import { writable } from 'svelte/store';

const { location } = document;
const { history } = window;

export default (() => {
  const { subscribe, set } = writable({});
  const update = () => {
    const [id, ...params] = location.pathname.substr(1).split('/').map((value) => (
      decodeURIComponent(value.trim())
    ));
    set({
      id,
      params: params.length ? params : undefined,
    });
  };
  window.addEventListener('popstate', update);
  return {
    subscribe,
    init() {
      if (location.hash) {
        history.replaceState({}, '', location.hash.substr(1));
      }
      update();
    },
    push(path) {
      if (location.pathname !== path) {
        history.pushState({}, '', path);
        update();
      }
    },
    replace(path) {
      if (location.pathname !== path) {
        history.replaceState({}, '', path);
        update();
      }
    },
  };
})();
