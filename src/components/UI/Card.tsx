import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card — fluid, mobile-first container.
 *
 * Design notes:
 * - width: 100% so cards fill their grid/flex cell on all screen sizes.
 * - No fixed pixel widths — let the parent grid control sizing.
 * - overflow-hidden prevents child content (maps, images) from bleeding outside rounded corners.
 * - min-w-0 prevents flex children from overflowing on small screens.
 */
const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200
        w-full min-w-0 overflow-hidden
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
};

export default Card;
