import type {StateStore} from '../types';

export const mockLocalStateStrategy = <T>(
  key: string,
  initialState: T,
  store: Record<string, any>
): StateStore<T> => {
  console.log(`[DEMO][mockLocalStateStrategy] 🔧 Creating store for key: "${key}"`, {
    hasKey: key in store,
    storeKeys: Object.keys(store),
    initialState
  });

  if (!store[key]) {
    store[key] = initialState;
    console.log(`[DEMO][mockLocalStateStrategy] ✅ Set store["${key}"]`, store[key]);
  }

  return {
    get: async () => {

      console.log(`[DEMO][mockLocalStateStrategy][get] 📖 Getting store["${key}"]`);
      // uncomment to inspect, makes demo noisy
      // console.log(`[DEMO][mockLocalStateStrategy][get] 📖 Getting store["${key}"]`, {
      //   exists: key in store,
      //   value: store[key],
      //   allKeys: Object.keys(store)
      // });
      return await Promise.resolve(store[key]) as T;
    },

    set: async (state: T) => {
      console.log(`[DEMO][mockLocalStateStrategy][set] 💾 Setting store["${key}"]`);
      // uncomment to inspect, makes demo noisy
      // console.log(`[DEMO][mockLocalStateStrategy][set] 💾 Setting store["${key}"]`, state);
      store[key] = state;
      return await Promise.resolve(store[key]);
    },

    // future extension
    merge: async (partial: Partial<T>) => {
      store[key] = { ...store[key], ...partial };
      return await Promise.resolve(store[key]);
    },

    shutdown: async () => null
  };
};
