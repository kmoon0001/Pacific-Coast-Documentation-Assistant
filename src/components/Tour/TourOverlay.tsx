import React, { useEffect, useState } from 'react';

export interface TourOverlayProps {
  targetElement?: HTMLElement | null;
  allowInteraction?: boolean;
}

export const TourOverlay: React.FC<TourOverlayProps> = ({
  targetElement,
  allowInteraction = false,
}) => {
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const padding = 8;

      setHighlightStyle({
        top: `${rect.top - padding}px`,
        left: `${rect.left - padding}px`,
        width: `${rect.width + padding * 2}px`,
        height: `${rect.height + padding * 2}px`,
      });

      // Scroll element into view
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [targetElement]);

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998] animate-in fade-in duration-300" />

      {/* Spotlight on target element */}
      {targetElement && (
        <div
          className="fixed z-[9999] rounded-lg transition-all duration-300 animate-in fade-in zoom-in"
          style={{
            ...highlightStyle,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)',
            pointerEvents: allowInteraction ? 'none' : 'auto',
          }}
        />
      )}
    </>
  );
};
