import React, { useEffect, useRef } from "react";
import "./click-spark.css";

/**
 * PUBLIC_INTERFACE
 * ClickSpark
 * A tiny click spark effect that renders small spark elements radiating from the click position.
 * Usage:
 *   <ClickSpark />
 * Simply include this at the root of your app (e.g., in App.js) to enable click sparks globally.
 */
export default function ClickSpark() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    // Create container if not present in DOM yet
    if (!container) return;

    // Handler to spawn sparks on click
    const handleClick = (e) => {
      // Reduce sparks on mobile for perf
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      const sparkCount = isMobile ? 6 : 12;

      const rect = document.body.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (let i = 0; i < sparkCount; i++) {
        spawnSpark(x, y, container);
      }
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return <div ref={containerRef} className="click-spark-container" aria-hidden="true" />;
}

/**
 * Create an individual spark element at (x, y) and animate it outward.
 */
function spawnSpark(x, y, container) {
  const spark = document.createElement("span");
  spark.className = "click-spark";

  // Randomize angle and distance
  const angle = Math.random() * Math.PI * 2;
  const distance = 30 + Math.random() * 30; // px
  const tx = Math.cos(angle) * distance;
  const ty = Math.sin(angle) * distance;

  // Randomize size and color slight variations within minimalist theme
  const size = 2 + Math.random() * 3;
  spark.style.setProperty("--spark-size", `${size}px`);

  // Position at click point
  spark.style.left = `${x}px`;
  spark.style.top = `${y}px`;

  // Randomize duration slightly
  const duration = 350 + Math.random() * 250;
  spark.style.setProperty("--spark-duration", `${duration}ms`);

  // Random rotation
  const rot = Math.floor(Math.random() * 360);
  spark.style.setProperty("--spark-rotate", `${rot}deg`);

  // Target translation
  spark.style.setProperty("--spark-tx", `${tx}px`);
  spark.style.setProperty("--spark-ty", `${ty}px`);

  container.appendChild(spark);

  // Remove after animation
  const cleanup = () => {
    spark.removeEventListener("animationend", cleanup);
    if (spark.parentNode) spark.parentNode.removeChild(spark);
  };
  spark.addEventListener("animationend", cleanup);
}
