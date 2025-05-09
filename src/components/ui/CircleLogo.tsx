import React from "react";

interface CircleLogoProps {
  size?: string;
  className?: string;
}

const CircleLogo: React.FC<CircleLogoProps> = ({ 
  size = "60px", // Default size
  className = ""
}) => {
  return (
    <div 
      className={`flex items-center justify-center rounded-full bg-slate-700 shadow-lg ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <h1 
        className="text-center"
        style={{
          color: "white",
          fontSize: `calc(${size} * 0.25)`, // Adjusted font size for longer text
          fontFamily: "'Tajawal', 'Noto Sans Arabic', sans-serif", // Clean and modern font stack
          lineHeight: 1.1, // Adjusted for better readability of two words
          margin: 0,
          fontWeight: 600, // Semi-bold for better presence
          // textShadow: "0px 1px 1px rgba(0,0,0,0.1)" // Optional: subtle shadow
        }}
      >
        علياء<br/>شوقي
      </h1>
    </div>
  );
};

export default CircleLogo;