"use client";

import React, { useEffect, useState } from "react";

const AutoRipple = ({ drop, originalChildren, methods }) => {
  useEffect(() => {
    if (!drop) return;
    let count = 0;
    const interval = setInterval(() => {
      const x = (0.2 + Math.random() * 0.6) * window.innerWidth;
      const y = (0.2 + Math.random() * 0.6) * window.innerHeight;
      drop({ x, y, radius: 40, strength: 0.04 });
      count++;
      if (count >= 4) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, [drop]);

  if (typeof originalChildren === "function") {
    return originalChildren(methods);
  }
  return originalChildren || <div className="w-full h-full" />;
};

export default function WaterWaveWrapper(props) {
  const [WaterWave, setWaterWave] = useState(null);

  useEffect(() => {
    import("react-water-wave").then((mod) => {
      setWaterWave(() => mod.default || mod);
    });
  }, []);

  if (!WaterWave) {
    return <div className={props.className} style={props.style} />;
  }

  // Intercept props to apply our auto-ripple but preserve original children
  const { children, ...restProps } = props;

  return (
    <WaterWave {...restProps}>
      {(methods) => (
        <AutoRipple drop={methods.drop} methods={methods} originalChildren={children} />
      )}
    </WaterWave>
  );
}
