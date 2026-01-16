// MagnetButton.tsx
import React, { useEffect, useRef, useState } from "react";

interface MagnetButtonProps {
  children: React.ReactNode;
  className?: string;
}

const MagnetButton: React.FC<MagnetButtonProps> = ({ children, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const padding = 25; // 🔄 Ko‘proq yaqinlashganda ishga tushadi
  const magnetStrength = 12; // 🔄 Normal kuchli effekt

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;

      const { left, top, width, height } = ref.current.getBoundingClientRect();
      const centerX = left + width / 5;
      const centerY = top + height / 5;

      const distX = Math.abs(centerX - e.clientX);
      const distY = Math.abs(centerY - e.clientY);

      if (distX < width / 2 + padding && distY < height / 2 + padding) {
        const offsetX = (e.clientX - centerX) / magnetStrength;
        const offsetY = (e.clientY - centerY) / magnetStrength;
        setPosition({ x: offsetX, y: offsetY });
      } else {
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        display: "inline-block",
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: "transform 0.2s ease-out",
        willChange: "transform",
      }}
      className={className}
    >
      {children}
    </div>
  );
};

export default MagnetButton;
