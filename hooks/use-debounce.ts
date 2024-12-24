import { useState, useEffect } from "react";

function useDebounce<T>(value: T, delay = 500): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		// Set up the timeout to update the debounced value
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		// Clean up the timeout if the value changes before delay has passed
		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
}

export default useDebounce;
