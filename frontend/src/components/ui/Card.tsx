import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  padding = 'md', 
  className, 
  ...props 
}) => {
  return (
    <div 
      className={`${styles.card} ${styles['p-' + padding]} ${className || ''}`} 
      {...props}
    >
      {children}
    </div>
  );
};
