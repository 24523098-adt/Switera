import { useEffect, useState } from "react";

function useMountSkeleton(durationMs = 450) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsLoading(false);
    }, durationMs);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isLoading;
}

export default useMountSkeleton;
