import React, { useState } from "react";
import { Stage, Layer, Rect } from "react-konva";

export default function App() {
  const [rectangles, setRectangles] = useState([]);
  const [newRect, setNewRect] = useState(null);

  const handleMouseDown = (e) => {
    const { x, y } = e.target.getStage().getPointerPosition();
    setNewRect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!newRect) return;
    const { x, y } = e.target.getStage().getPointerPosition();
    setNewRect({
      ...newRect,
      width: x - newRect.x,
      height: y - newRect.y,
    });
  };

  const handleMouseUp = () => {
    if (newRect) {
      setRectangles([...rectangles, newRect]);
      setNewRect(null);
    }
  };

  return (
    <Stage
      width={800}
      height={600}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ border: "1px solid gray" }}
    >
      <Layer>
        {rectangles.map((rect, i) => (
          <Rect key={i} {...rect} fill="rgba(0,0,255,0.3)" draggable />
        ))}
        {newRect && <Rect {...newRect} fill="rgba(0,0,255,0.3)" />}
      </Layer>
    </Stage>
  );
}
