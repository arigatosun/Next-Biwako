import React from 'react';

interface CustomCardProps {
  children: React.ReactNode;
  className?: string;
}

const CustomCard: React.FC<CustomCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export const CustomCardContent: React.FC<CustomCardProps> = ({ children, className = '' }) => {
  return <div className={`p-4 ${className}`}>{children}</div>;
};

export const CustomCardHeader: React.FC<CustomCardProps> = ({ children, className = '' }) => {
  return <div className={`p-4 border-b ${className}`}>{children}</div>;
};

export const CustomCardFooter: React.FC<CustomCardProps> = ({ children, className = '' }) => {
  return <div className={`p-4 border-t ${className}`}>{children}</div>;
};

export default CustomCard;