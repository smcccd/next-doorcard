import React from 'react';
import SMCCDLogo from './SMCCDLogo';
import { College } from '@/types/doorcard';

interface CollegeLogoProps {
  college: College;
  height?: number;
  className?: string;
}

// Campus-specific colors for subtle theming
const CAMPUS_COLORS: Record<College, string> = {
  SKYLINE: '#2563eb', // Blue
  CSM: '#dc2626',     // Red
  CANADA: '#059669',  // Green
};

const CollegeLogo: React.FC<CollegeLogoProps> = ({ 
  college, 
  height = 24, 
  className = '' 
}) => {
  const color = CAMPUS_COLORS[college];
  
  // For now, we'll use the SMCCD logo for all colleges with campus-specific colors
  // In the future, individual college logos could be implemented here
  return (
    <div className={`flex items-center ${className}`}>
      <SMCCDLogo 
        height={height} 
        color={color}
        className="transition-all duration-200"
      />
    </div>
  );
};

export default CollegeLogo;