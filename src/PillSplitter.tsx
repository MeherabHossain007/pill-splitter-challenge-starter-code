import React, { useState, useRef, useCallback } from "react";

interface Pill {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  borderRadius?: string;
}

const MIN_SIZE = 40;
const CORNER_RADIUS = "20px";
const colors = [
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

const PillSplitter: React.FC = () => {
  const [pills, setPills] = useState<Pill[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [currentPill, setCurrentPill] = useState<Pill | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPill, setDraggedPill] = useState<Pill | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(0);
  const hasMoved = useRef(false);

  const getRandomColor = () =>
    colors[Math.floor(Math.random() * colors.length)];

  const getMouseCoords = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    return rect
      ? { x: e.clientX - rect.left, y: e.clientY - rect.top }
      : { x: 0, y: 0 };
  };

  const createPill = (
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    borderRadius?: string
  ): Pill => ({
    id: nextIdRef.current++,
    x,
    y,
    width,
    height,
    color,
    borderRadius,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;

      const { x, y } = getMouseCoords(e);
      setMousePos({ x, y });

      if (currentPill && !isDrawing) {
        if (Math.abs(x - startPos.x) > 5 || Math.abs(y - startPos.y) > 5) {
          setIsDrawing(true);
          hasMoved.current = true;
        }
      }

      if (isDrawing && currentPill) {
        setCurrentPill(
          (prev) =>
            prev && {
              ...prev,
              x: Math.min(startPos.x, x),
              y: Math.min(startPos.y, y),
              width: Math.max(Math.abs(x - startPos.x), MIN_SIZE),
              height: Math.max(Math.abs(y - startPos.y), MIN_SIZE),
            }
        );
      }

      if (isDragging && draggedPill) {
        hasMoved.current = true;
        setPills((prev) =>
          prev.map((pill) =>
            pill.id === draggedPill.id
              ? {
                  ...pill,
                  x: Math.max(0, x - dragOffset.x),
                  y: Math.max(0, y - dragOffset.y),
                }
              : pill
          )
        );
      }
    },
    [isDrawing, isDragging, currentPill, draggedPill, dragOffset, startPos]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current) return;

    const { x, y } = getMouseCoords(e);
    hasMoved.current = false;
    setStartPos({ x, y });

    setCurrentPill(
      createPill(x, y, MIN_SIZE, MIN_SIZE, getRandomColor(), CORNER_RADIUS)
    );
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPill) {
      setPills((prev) => [...prev, currentPill]);
    }
    setIsDrawing(false);
    setCurrentPill(null);
    setIsDragging(false);
    setDraggedPill(null);
    setTimeout(() => (hasMoved.current = false), 10);
  };

  const handlePillMouseDown = (e: React.MouseEvent, pill: Pill) => {
    e.stopPropagation();
    hasMoved.current = false;

    const { x, y } = getMouseCoords(e);
    setIsDragging(true);
    setDraggedPill(pill);
    setDragOffset({ x: x - pill.x, y: y - pill.y });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDrawing || isDragging || hasMoved.current) return;

    const { x: clickX, y: clickY } = getMouseCoords(e);

    setPills((prev) => {
      const newPills: Pill[] = [];

      prev.forEach((pill) => {
        const intersectsV = clickX >= pill.x && clickX <= pill.x + pill.width;
        const intersectsH = clickY >= pill.y && clickY <= pill.y + pill.height;

        const splitX = Math.max(0, Math.min(pill.width, clickX - pill.x));
        const splitY = Math.max(0, Math.min(pill.height, clickY - pill.y));

        const canSplitV =
          intersectsV && splitX >= 20 && pill.width - splitX >= 20;
        const canSplitH =
          intersectsH && splitY >= 20 && pill.height - splitY >= 20;

        if (canSplitV && canSplitH) {
          // Four-way split
          newPills.push(
            createPill(
              pill.x,
              pill.y,
              splitX,
              splitY,
              pill.color,
              "20px 0 0 0"
            ),
            createPill(
              pill.x + splitX,
              pill.y,
              pill.width - splitX,
              splitY,
              pill.color,
              "0 20px 0 0"
            ),
            createPill(
              pill.x,
              pill.y + splitY,
              splitX,
              pill.height - splitY,
              pill.color,
              "0 0 0 20px"
            ),
            createPill(
              pill.x + splitX,
              pill.y + splitY,
              pill.width - splitX,
              pill.height - splitY,
              pill.color,
              "0 0 20px 0"
            )
          );
        } else if (canSplitV) {
          // Vertical split
          newPills.push(
            createPill(
              pill.x,
              pill.y,
              splitX,
              pill.height,
              pill.color,
              "20px 0 0 20px"
            ),
            createPill(
              pill.x + splitX,
              pill.y,
              pill.width - splitX,
              pill.height,
              pill.color,
              "0 20px 20px 0"
            )
          );
        } else if (canSplitH) {
          // Horizontal split
          newPills.push(
            createPill(
              pill.x,
              pill.y,
              pill.width,
              splitY,
              pill.color,
              "20px 20px 0 0"
            ),
            createPill(
              pill.x,
              pill.y + splitY,
              pill.width,
              pill.height - splitY,
              pill.color,
              "0 0 20px 20px"
            )
          );
        } else if (intersectsV || intersectsH) {
          // Too small → move away
          const newPill = { ...pill, id: nextIdRef.current++ };

          const centerX = pill.x + pill.width / 2;
          const centerY = pill.y + pill.height / 2;

          if (intersectsV) {
            newPill.x =
              centerX < clickX
                ? Math.max(0, clickX - pill.width - 10)
                : clickX + 10;
          }

          if (intersectsH) {
            newPill.y =
              centerY < clickY
                ? Math.max(0, clickY - pill.height - 10)
                : clickY + 10;
          }

          newPill.borderRadius = CORNER_RADIUS;
          newPills.push(newPill);
        } else {
          newPills.push(pill);
        }
      });

      return newPills;
    });
  };

  return (
    <div className="w-full h-screen bg-gray-100 overflow-hidden">
      <div
        ref={containerRef}
        className="container"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
      >
        {/* Guide lines */}
        <div
          className="guide-line guide-line-vertical"
          style={{ left: mousePos.x }}
        />
        <div
          className="guide-line guide-line-horizontal"
          style={{ top: mousePos.y }}
        />

        {/* Current pill being drawn */}
        {currentPill && (
          <div
            className="pill"
            style={{
              left: currentPill.x,
              top: currentPill.y,
              width: currentPill.width,
              height: currentPill.height,
              backgroundColor: currentPill.color,
              borderRadius: currentPill.borderRadius || CORNER_RADIUS,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Existing pills */}
        {pills.map((pill) => (
          <div
            key={pill.id}
            className="pill"
            style={{
              left: pill.x,
              top: pill.y,
              width: pill.width,
              height: pill.height,
              backgroundColor: pill.color,
              borderRadius: pill.borderRadius || CORNER_RADIUS,
            }}
            onMouseDown={(e) => handlePillMouseDown(e, pill)}
          />
        ))}
      </div>
    </div>
  );
};

export default PillSplitter;
