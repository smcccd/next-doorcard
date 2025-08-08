import React from "react";
import Image from "next/image";
import { College } from "@/types/doorcard";

interface CollegeLogoProps {
  college: College;
  height?: number;
  width?: number;
  className?: string;
  priority?: boolean;
}

const COLLEGE_LOGOS: Record<
  College,
  { src: string; alt: string; isJpg?: boolean }
> = {
  CANADA: {
    src: "/canada.svg",
    alt: "Cañada College Logo",
  },
  CSM: {
    src: "/csm.jpg",
    alt: "College of San Mateo Logo",
    isJpg: true,
  },
  SKYLINE: {
    src: "/skyline.svg",
    alt: "Skyline College Logo",
  },
  DISTRICT_OFFICE: {
    src: "/smccd-logo.png",
    alt: "SMCCD District Office Logo",
    isJpg: true,
  },
};

const CollegeLogo: React.FC<CollegeLogoProps> = ({
  college,
  height = 24,
  width,
  className = "",
  priority = false,
}) => {
  const logoInfo = COLLEGE_LOGOS[college];

  if (!logoInfo) {
    return null;
  }

  // Calculate width based on height if not provided
  const calculatedWidth = width || height;

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src={logoInfo.src}
        alt={logoInfo.alt}
        width={calculatedWidth}
        height={height}
        className={`transition-all duration-200 ${logoInfo.isJpg ? "rounded" : ""}`}
        priority={priority}
      />
    </div>
  );
};

export default CollegeLogo;
