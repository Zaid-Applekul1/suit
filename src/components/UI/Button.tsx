import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}) => {
  /**
   * Base: 44px minimum height for WCAG 2.5.5 touch targets on mobile.
   * touch-action: manipulation removes the 300 ms tap delay on iOS/Android.
   * -webkit-tap-highlight-color: transparent removes the grey flash on tap.
   */
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg ' +
    'transition-colors duration-200 ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-2 ' +
    'touch-action-manipulation [-webkit-tap-highlight-color:transparent] ' +
    'min-h-[44px]';

  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus:ring-green-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800 focus:ring-gray-500',
    outline:
      'border border-gray-300 text-gray-700 bg-transparent ' +
      'hover:bg-gray-50 active:bg-gray-100 focus:ring-green-500',
  };

  /**
   * Size padding is generous enough to maintain the 44px height on sm/md.
   * lg is visually larger but still ≥44px via min-h above.
   */
  const sizes = {
    sm: 'px-3 py-2 text-sm min-w-[44px]',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const disabledCls = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabledCls} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
