import { useRef } from 'react';
import { Empty } from 'antd';
import type { PalaceLocusInput } from '../../../types/palaceScene';

export function LocusCanvas({ imageUrl, loci, selected, disabled, onSelect, onPosition, onAdd }: {
  imageUrl: string; loci: PalaceLocusInput[]; selected: number; disabled: boolean;
  onSelect: (index: number) => void; onPosition: (index: number, position: { xPercent: number; yPercent: number }) => void;
  onAdd: (position: { xPercent: number; yPercent: number }) => void;
}) {
  const canvas = useRef<HTMLDivElement>(null);
  const dragging = useRef<number | null>(null);
  const positionAt = (x: number, y: number) => {
    const bounds = canvas.current?.getBoundingClientRect();
    if (!bounds?.width || !bounds.height) return null;
    return { xPercent: Math.max(0, Math.min(100, (x - bounds.left) / bounds.width * 100)), yPercent: Math.max(0, Math.min(100, (y - bounds.top) / bounds.height * 100)) };
  };
  return <div ref={canvas} className='palace-canvas' onClick={event => {
    if (disabled || !imageUrl) return;
    const position = positionAt(event.clientX, event.clientY);
    if (position) { if (loci[selected]) onPosition(selected, position); else onAdd(position); }
  }} onPointerMove={event => {
    if (disabled || dragging.current === null) return;
    const position = positionAt(event.clientX, event.clientY);
    if (position) onPosition(dragging.current, position);
  }} onPointerUp={() => { dragging.current = null; }} onPointerCancel={() => { dragging.current = null; }}>
    {imageUrl ? <img src={imageUrl} alt='Palace scene canvas' draggable={false} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='Upload a scene image to place your first memory point' />}
    {imageUrl && loci.map((locus, index) => <button key={locus.id ?? index} type='button' disabled={disabled}
      className={`palace-marker ${selected === index ? 'is-selected' : ''}`} style={{ left: `${locus.xPercent}%`, top: `${locus.yPercent}%` }}
      aria-label={`Memory point ${index + 1}: ${locus.name}`} aria-pressed={selected === index}
      onPointerDown={event => { event.stopPropagation(); dragging.current = index; onSelect(index); event.currentTarget.setPointerCapture(event.pointerId); }}
      onClick={event => { event.stopPropagation(); onSelect(index); }}
      onKeyDown={event => {
        const offsets: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        const offset = offsets[event.key];
        if (!offset) return;
        event.preventDefault(); onPosition(index, { xPercent: Math.max(0, Math.min(100, locus.xPercent + offset[0])), yPercent: Math.max(0, Math.min(100, locus.yPercent + offset[1])) });
      }}>{index + 1}</button>)}
  </div>;
}
