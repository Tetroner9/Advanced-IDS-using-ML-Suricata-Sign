import React from 'react';

export const Card = ({ className, children, ...props }) => (
  <div className={`bg-gray-800 rounded-lg shadow-lg ${className || ''}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className, children, ...props }) => (
  <div className={`p-6 pb-0 ${className || ''}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={`text-xl font-semibold ${className || ''}`} {...props}>
    {children}
  </h3>
);

export const CardContent = ({ className, children, ...props }) => (
  <div className={`p-6 ${className || ''}`} {...props}>
    {children}
  </div>
);