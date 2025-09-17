import { useEffect, useState, useRef } from "react";
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";
import { TiDeleteOutline } from "react-icons/ti";
import { IoMdDownload } from "react-icons/io";
import { BiRectangle } from "react-icons/bi";
import { FaTrashAlt } from "react-icons/fa";

import "../styles/Edit.css";

function Edit() {
  const imageUrl = localStorage.getItem("tempUrl");
  const imageId = localStorage.getItem("tempId");
  const [boxes, setBoxes] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [annotationId,setAnnotationId]=useState(null)
  const [newBox, setNewBox] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [stageDimensions, setStageDimensions] = useState({ width: 800, height: 600 });
  const stageRef = useRef();
  const containerRef = useRef();
  const transformerRef = useRef();
  const selectedRectRef = useRef();
  const [textValue,setTextValue]=useState("")
  const [image] = useImage(imageUrl);
  const [selectRectangle,setSelectRectangle]=useState(false);

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
  const handleRectangleClick=()=>{
    setSelectRectangle((prev)=>(!prev))
  }
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
      const result = await fetch(`http://localhost:3002/server/image_annotations_function/annotations/${id}`, {
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

  const handleTextBox = async (i, value,ind) => {
    try {
      const result = await fetch(`http://localhost:3002/server/image_annotations_function/annotations/category/${i}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value }),
      });
      if (result.ok) {
        const newBoxes = [...boxes];
        newBoxes[ind] = { ...newBoxes[ind], text: value };
        setBoxes(newBoxes);
        console.log(value)
      }
    } catch (err) {
      console.error("Error updating text:", err);
    }
  };

  const updateBox = async (i, id, boxData) => {
  if (!id) return;
  
  console.log(boxData);
  try {
    const res = await fetch(
      `http://localhost:3002/server/image_annotations_function/annotations/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Bbox: [boxData.x, boxData.y, boxData.width, boxData.height],
          category_name: boxData.text || "",
          rotation: boxData.rotation || 0 // Include rotation in API call
        }),
      }
    );

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
    const result = await fetch(
      `http://localhost:3002/server/image_annotations_function/annotations/${imageId}`
    );
    console.log("fetching annotations for imageId:", imageId);
    if (!result.ok) {
      throw new Error(`HTTP error! status: ${result.status}`);
    }

    const data = await result.json();
    console.log("Raw annotations response:", data);

    const formatted = data.data.map((item) => {
      let bbox = [];
      try {
        bbox = JSON.parse(item.Bbox);
      } catch (err) {
        console.error("Invalid Bbox:", item.Bbox);
      }

      return {
        id: item.ROWID,
        x: bbox[0] ?? 0,
        y: bbox[1] ?? 0,
        width: bbox[2] ?? 100,
        height: bbox[3] ?? 100,
        rotation: item.rotation || 0, 
        text: item.Category_name || "",
        category_id: item.Category_name || "",
      };
    });

    setBoxes(formatted);
  } catch (err) {
    console.error("Error fetching boxes:", err);
  }
};

    // if (imageId) {
    //   fetchBoxes();
    // }
    fetchBoxes()
  }, [imageId]);

  const handleMouseDown = (e) => {
     if(!selectRectangle)return
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
    if (!drawing || !newBox ||!selectRectangle) return;
    const point = e.target.getStage().getPointerPosition();
    setNewBox({
      ...newBox,
      width: point.x - newBox.x,
      height: point.y - newBox.y,
    });
  };

  const handleMouseUp = async () => {
    if (!drawing || !selectRectangle) return;
    if (newBox && Math.abs(newBox.width) > 5 && Math.abs(newBox.height) > 5) {
      const normalizedBox = {
        x: newBox.width < 0 ? newBox.x + newBox.width : newBox.x,
        y: newBox.height < 0 ? newBox.y + newBox.height : newBox.y,
        width: Math.abs(newBox.width),
        height: Math.abs(newBox.height),
      };

      try {
        console.log("Adding box for imageId:", imageId);
        const result = await fetch(`http://localhost:3002/server/image_annotations_function/annotations/${imageId}`, {
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
              id: data.data.ROWID,
              x: normalizedBox.x,
              y: normalizedBox.y,
              width: normalizedBox.width,
              height: normalizedBox.height,
              text: "",
              category_id: data.data.Category_name || "",
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

  const handleRectClick = (e, index,boxId) => {
    e.cancelBubble = true;
    if(selectedId==null || selectedId!==index){
    setSelectedId(index);
    setTextValue("")
    setAnnotationId(boxId)
    }
    else{
      setSelectedId(null)
    }
  };

  const handleRectChange = (index, newAttrs) => {
  
  const newBoxes = [...boxes];
  const updatedBox = { ...newBoxes[index], ...newAttrs };

  newBoxes[index] = updatedBox;
  setBoxes(newBoxes);

  updateBox(index, updatedBox.id, updatedBox);
};

const handleTransform = (index) => {
  if(!selectRectangle)return
  if (!selectedRectRef.current) return;

  const node = selectedRectRef.current;
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();
  const rotation = node.rotation(); 

  node.scaleX(1);
  node.scaleY(1);

  const newWidth = Math.max(5, node.width() * scaleX);
  const newHeight = Math.max(5, node.height() * scaleY);

  handleRectChange(index, {
    x: node.x(),
    y: node.y(),
    width: newWidth,
    height: newHeight,
    rotation: rotation 
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
          style={{ border: "1px solid #ccc" ,display:"flex"}}
        >
          <Layer>
            {image && (
              <KonvaImage  image={image}width={stageDimensions.width} height={stageDimensions.height} />
            )}

            {boxes.map((box, i) => (
          <Rect
            key={box.id || i}
            ref={selectedId === i ? selectedRectRef : null}
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            rotation={box.rotation || 0} 
            fill="transparent"
            stroke={selectedId === i ? "#0066cc" : "#ff6b6b"}
            
            strokeWidth={selectedId===i?4:2}
            strokeDashArray={selectedId === i ? [] : [5, 5]}
            draggable
            
            onClick={(e) => handleRectClick(e, i,box.id)}
            onDragEnd={(e) => handleRectChange(i, { x: e.target.x(), y: e.target.y() })}
            onTransformEnd={() => handleTransform(i)}
          />
        ))}


            {boxes.map((box, i) =>
              box.text ? (
                <Text
                  key={`text-${box.id || i}`}
                  x={box.x}
                  y={box.y - 18}
                  text={box.text}
                  fontSize={14}
                  fontFamily="Arial"
                  fill="#333"
                  listening={false}
                />
              ) : null
            )}

           
            {selectRectangle && drawing && newBox && (
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

            {selectRectangle && <Transformer
              ref={transformerRef}
              borderEnabled={false}
              anchorEnabled={true}
              anchorSize={8}
              anchorStroke="#0066cc"
              anchorFill="#0066cc"
              keepRatio={false}
            />}
          </Layer>
        </Stage>
      </div>

      <div className="annotations-sidebar">

        <div className="annotations-sidebar-div">
           { selectedId !== null && boxes[selectedId] &&
          <div onClick={(e) => {
              e.stopPropagation();
              handleAnnotationDeletion(boxes[selectedId].id);
            }} className="delete-container">
          
           <FaTrashAlt className="delete-annotation"/>
            
          </div>}
          {selectedId !== null && boxes[selectedId] && (
            <div style={{ marginTop: "20px", textAlign: "left" }}>
             
                
              <input
                type="text"
                value={textValue}
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
                onChange={(e) =>{
                  setTextValue(e.target.value)
                  handleTextBox(annotationId ,e.target.value,selectedId)
                }
                }
              />

             </div>
          )}
          <div className="download-section">
            <IoMdDownload onClick={handleDownload} className="download-box" />
            <div>Download</div>
            
          </div>
          
         
         
          
         
         
          <div className="rectangle-checkBox" onClick={handleRectangleClick}>
            <BiRectangle  className={`rectangle-icon ${selectRectangle ? "icon-active" : ""}`}/>
            <div>Rectangle</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Edit;
