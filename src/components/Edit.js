import { useEffect, useState, useRef } from "react";
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";
import { TiDeleteOutline } from "react-icons/ti";
import { IoMdDownload } from "react-icons/io";
import "../styles/Edit.css";

function Edit() {
  const imageUrl = localStorage.getItem("tempUrl");
  const imageId = localStorage.getItem("tempId");
  const [boxes, setBoxes] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [newBox, setNewBox] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [stageDimensions, setStageDimensions] = useState({ width: 800, height: 600 });
  const stageRef = useRef();
  const containerRef = useRef();
  const transformerRef = useRef();
  const selectedRectRef = useRef();
  const [image] = useImage(imageUrl);

  useEffect(() => {
    if (image && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;

      const aspectRatio = image.width / image.height;
      let width = containerWidth - 200;
      let height = width / aspectRatio;

      if (height > containerHeight - 50) {
        height = containerHeight - 50;
        width = height * aspectRatio;
      }
      setStageDimensions({ width, height });
    }
  }, [image]);

  useEffect(() => {
    if (selectedId !== null && transformerRef.current && selectedRectRef.current) {
      transformerRef.current.nodes([selectedRectRef.current]);
      transformerRef.current.getLayer().batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId]);

  const handleDownload = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = "annotated-image.png";
      link.href = dataURL;
      link.click();
    }
  };

  const handleAnnotationDeletion = async (id) => {
    try {
      const result = await fetch(`http://localhost:3001/api/annotations/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (result.ok) {
        setBoxes(boxes.filter((item) => item.id !== id));
        setSelectedId(null);
      }
    } catch (err) {
      console.error("Error deleting annotation:", err);
    }
  };

  const handleTextBox = async (i, category_id, value) => {
    try {
      const result = await fetch(`http://localhost:3001/api/category/${category_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value }),
      });
      if (result.ok) {
        const newBoxes = [...boxes];
        newBoxes[i] = { ...newBoxes[i], text: value };
        setBoxes(newBoxes);
      }
    } catch (err) {
      console.error("Error updating text:", err);
    }
  };

  const updateBox = async (i, id, boxData) => {
    if (!id) return;
    try {
      const res = await fetch(`http://localhost:3001/api/annotations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Bbox: [boxData.x, boxData.y, boxData.width, boxData.height],
        }),
      });

      if (res.ok) {
        const newBoxes = [...boxes];
        newBoxes[i] = { ...newBoxes[i], ...boxData };
        setBoxes(newBoxes);
      }
    } catch (err) {
      console.error("Error updating box:", err);
    }
  };

  useEffect(() => {
    const fetchBoxes = async () => {
      try {
        const result = await fetch(`http://localhost:3001/api/annotations/${imageId}`);
        if (result.ok) {
          const data = await result.json();
          const temp = await Promise.all(
            data.annotations.map(async (item) => {
              try {
                const res = await fetch(`http://localhost:3001/api/category/${item.category_id}`);
                const category = await res.json();
                return {
                  id: item.Id,
                  x: item.Bbox[0] ?? 0,
                  y: item.Bbox[1] ?? 0,
                  width: item.Bbox[2] ?? 100,
                  height: item.Bbox[3] ?? 100,
                  text: category.name || "",
                  category_id: item.Category_id,
                };
              } catch (categoryErr) {
                console.error("Error fetching category:", categoryErr);
                return {
                  id: item.Id,
                  x: item.Bbox[0] ?? 0,
                  y: item.Bbox[1] ?? 0,
                  width: item.Bbox[2] ?? 100,
                  height: item.Bbox[3] ?? 100,
                  text: "Error loading category",
                  category_id: item.Category_id,
                };
              }
            })
          );
          setBoxes(temp);
        }
      } catch (err) {
        console.error("Error fetching boxes:", err);
      }
    };

    if (imageId) {
      fetchBoxes();
    }
  }, [imageId]);

  const handleMouseDown = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
      return;
    }

    if (e.target.getClassName() === "Image") {
      const pos = e.target.getStage().getPointerPosition();
      setDrawing(true);
      setNewBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
      setSelectedId(null);
    }
  };

  const handleMouseMove = (e) => {
    if (!drawing || !newBox) return;
    const point = e.target.getStage().getPointerPosition();
    setNewBox({
      ...newBox,
      width: point.x - newBox.x,
      height: point.y - newBox.y,
    });
  };

  const handleMouseUp = async () => {
    if (!drawing) return;
    if (newBox && Math.abs(newBox.width) > 5 && Math.abs(newBox.height) > 5) {
      const normalizedBox = {
        x: newBox.width < 0 ? newBox.x + newBox.width : newBox.x,
        y: newBox.height < 0 ? newBox.y + newBox.height : newBox.y,
        width: Math.abs(newBox.width),
        height: Math.abs(newBox.height),
      };

      try {
        const result = await fetch(`http://localhost:3001/api/annotations/${imageId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_name: "",
            Bbox: [normalizedBox.x, normalizedBox.y, normalizedBox.width, normalizedBox.height],
          }),
        });

        if (result.ok) {
          const data = await result.json();
          setBoxes((prev) => [
            ...prev,
            {
              id: data.id,
              x: normalizedBox.x,
              y: normalizedBox.y,
              width: normalizedBox.width,
              height: normalizedBox.height,
              text: "",
              category_id: data.category_id,
            },
          ]);
        }
      } catch (err) {
        console.error("Error adding box:", err);
      }
    }
    setDrawing(false);
    setNewBox(null);
  };

  const handleRectClick = (e, index) => {
    e.cancelBubble = true;
    setSelectedId(index);
  };

  const handleRectChange = (index, newAttrs) => {
    const newBoxes = [...boxes];
    newBoxes[index] = { ...newBoxes[index], ...newAttrs };
    setBoxes(newBoxes);
    updateBox(index, newBoxes[index].id, newAttrs);
  };

  const handleTransform = (index) => {
    if (!selectedRectRef.current) return;

    const node = selectedRectRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    handleRectChange(index, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
    });
  };

  return (
    <div className="edit-image-main" ref={containerRef}>
      <div className="edit-image-container" style={{ position: "relative" }}>
        <Stage
          width={stageDimensions.width}
          height={stageDimensions.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          ref={stageRef}
          style={{ border: "1px solid #ccc" }}
        >
          <Layer>
            {image && (
              <KonvaImage image={image} width={stageDimensions.width} height={stageDimensions.height} />
            )}

            {boxes.map((box, i) => (
              <Rect
                key={box.id || i}
                ref={selectedId === i ? selectedRectRef : null}
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                fill="transparent"
                stroke={selectedId === i ? "#0066cc" : "#ff6b6b"}
                strokeWidth={2}
                strokeDashArray={selectedId === i ? [] : [5, 5]}
                draggable
                onClick={(e) => handleRectClick(e, i)}
                onDragEnd={(e) => handleRectChange(i, { x: e.target.x(), y: e.target.y() })}
                onTransformEnd={() => handleTransform(i)}
              />
            ))}

            {boxes.map((box, i) =>
              box.text ? (
                <Text
                  key={`text-${box.id || i}`}
                  x={box.x}
                  y={box.y}
                  text={box.text}
                  fontSize={14}
                  fontFamily="Arial"
                  fill="#333"
                  listening={false}
                />
              ) : null
            )}

           
            {drawing && newBox && (
              <Rect
                x={Math.min(newBox.x, newBox.x + newBox.width)}
                y={Math.min(newBox.y, newBox.y + newBox.height)}
                width={Math.abs(newBox.width)}
                height={Math.abs(newBox.height)}
                fill="transparent"
                stroke="#0066cc"
                strokeWidth={2}
                strokeDashArray={[5, 5]}
                listening={false}
              />
            )}

            <Transformer
              ref={transformerRef}
              borderEnabled={false}
              anchorEnabled={true}
              anchorSize={8}
              anchorStroke="#0066cc"
              anchorFill="#0066cc"
              keepRatio={false}
            />
          </Layer>
        </Stage>
      </div>

      <div className="annotations-sidebar">
        <div className="annotations-sidebar-div">
          <div>
            <IoMdDownload onClick={handleDownload} className="download-box" />
          </div>
          <div>Download</div>

          {selectedId !== null && boxes[selectedId] && (
            <div style={{ marginTop: "20px", textAlign: "left" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "13px",
                  color: "#333",
                }}
              >
                Annotation Text
              </label>
              <input
                type="text"
                value={boxes[selectedId].text}
                placeholder="Enter annotation text"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #d0d7de",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  outline: "none",
                }}
                onChange={(e) =>
                  handleTextBox(selectedId, boxes[selectedId].category_id, e.target.value)
                }
              />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnnotationDeletion(boxes[selectedId].id);
                }}
                style={{
                  marginTop: "12px",
                  width: "100%",
                  backgroundColor: "#ff4757",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#ff3742")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#ff4757")}
              >
                
                Delete
              </button>
            </div>
          )}

          <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
            <p>Click: Select rectangle</p>
            <p>Double-click: (optional) edit via sidebar</p>
            <p>Drag: Move rectangle</p>
            <p>Drag corners: Resize</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Edit;
