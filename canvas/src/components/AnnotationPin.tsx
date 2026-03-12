import type { Annotation } from '../lib/types';

interface AnnotationPinProps {
  annotation: Annotation;
  isActive: boolean;
  onClick: (id: string) => void;
}

/**
 * Figma-style numbered pin marker rendered at percentage position on the asset overlay.
 * Blue for human annotations, purple for agent annotations.
 */
export function AnnotationPin({ annotation, isActive, onClick }: AnnotationPinProps) {
  const isAgent = annotation.authorType === 'agent';
  const bgColor = isAgent ? '#8b5cf6' : '#44B2FF';
  const activeBorder = isActive ? '2px solid #fff' : '2px solid transparent';

  return (
    <button
      data-testid={`annotation-pin-${annotation.id}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(annotation.id);
      }}
      style={{
        position: 'absolute',
        left: `${annotation.x ?? 0}%`,
        top: `${annotation.y ?? 0}%`,
        transform: 'translate(-50%, -50%)',
        width: 24,
        height: 24,
        borderRadius: '50%',
        backgroundColor: bgColor,
        color: '#fff',
        fontSize: '0.7rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: activeBorder,
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        cursor: 'pointer',
        padding: 0,
        zIndex: 10,
        transition: 'transform 0.15s ease',
        ...(isActive ? { transform: 'translate(-50%, -50%) scale(1.2)' } : {}),
      }}
      title={annotation.text}
    >
      {annotation.pinNumber ?? '?'}
    </button>
  );
}
