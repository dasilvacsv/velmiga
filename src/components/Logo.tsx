
import React from 'react';

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 bg-brand rounded-full flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <path d="M7 16h10V9a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v7z"></path>
          <path d="M3 21h18"></path>
          <path d="M5 21V9a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v12"></path>
        </svg>
      </div>
      <span className="text-xl font-bold">Case<span className="text-brand">Tracking</span></span>
    </div>
  );
};

export default Logo;
