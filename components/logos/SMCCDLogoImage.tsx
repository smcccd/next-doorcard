import React from "react";
import Image from "next/image";

interface SMCCDLogoImageProps {
  /** Width of the logo (height will scale proportionally) */
  width?: number;
  /** Height of the logo (width will scale proportionally) */
  height?: number;
  /** CSS class name for custom styling */
  className?: string;
  /** Whether to animate the logo on hover */
  animate?: boolean;
  /** Whether to make the logo clickable */
  onClick?: () => void;
  /** Accessibility label */
  "aria-label"?: string;
}

export default function SMCCDLogoImage({
  width,
  height = 48,
  className = "",
  animate = false,
  onClick,
  "aria-label": ariaLabel = "San Mateo County Community College District Logo",
  ...props
}: SMCCDLogoImageProps) {
  // Calculate proportional width if not provided
  const aspectRatio = 274.702 / 57.03;
  const finalWidth = width || Math.round(height * aspectRatio);
  const finalHeight = height || Math.round(width ? width / aspectRatio : 48);

  const imageClasses = [
    className,
    animate && "transition-colors duration-200",
    onClick && "cursor-pointer",
    "max-w-full h-auto block",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Image
      src="/smccd-logo.png" // Using existing file from public folder
      alt={ariaLabel}
      width={finalWidth}
      height={finalHeight}
      className={imageClasses}
      onClick={onClick}
      priority
      style={{
        objectFit: "contain",
        imageRendering: "crisp-edges",
      }}
      {...props}
    />
  );
}
