import { useCallback, useState } from "react";

let rippleSeq = 0;

function useRipple() {
  const [ripples, setRipples] = useState([]);

  const onMouseDown = useCallback((event, groupId) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    rippleSeq += 1;
    const id = rippleSeq;

    setRipples((current) => [...current, { id, x, y, size, groupId }]);
  }, []);

  const removeRipple = useCallback((id) => {
    setRipples((current) => current.filter((ripple) => ripple.id !== id));
  }, []);

  return { ripples, onMouseDown, removeRipple };
}

export default useRipple;
