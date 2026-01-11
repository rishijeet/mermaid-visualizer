import { useState, useEffect } from 'react';
import debounce from 'lodash.debounce';

/**
 * Debounce hook for delaying state updates
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const debouncedSetter = debounce((newValue: T) => {
      setDebouncedValue(newValue);
    }, delay);

    debouncedSetter(value);

    return () => {
      debouncedSetter.cancel();
    };
  }, [value, delay]);

  return debouncedValue;
}
