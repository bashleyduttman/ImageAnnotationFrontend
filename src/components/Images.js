import { useEffect, useState } from "react";
import "../styles/Images.css";
import { useNavigate } from "react-router-dom";
import { TiDeleteOutline } from "react-icons/ti";
import { MdModeEdit } from "react-icons/md";
import Spinner from "../others/Spinner";

function Images({ imageUrls, onDelete }) {
  const navigate = useNavigate();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  let total_size=0;
  imageUrls.map((item)=>{total_size+=parseInt(item.size)})
  console.log(total_size)


  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 9000);
    return () => clearTimeout(timer);
  }, []);

  const handleEdit = (url, id) => {
    localStorage.setItem("tempUrl", url);
    const parse = parseInt(id);
    localStorage.setItem("tempId", parse);
    navigate("/edit");
  };

  const handleDelete = async (id) => {
    try {
      const result = await fetch(
        `http://localhost:3002/server/image_annotations_function/images/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const result2=await fetch(`http://localhost:3002/server/image_annotations_function/annotations/image/${id}`,{
        method:"DELETE",
        headers:{
            "Content-Type":"application/json"
        }
      })
      if (result.ok && result2.ok) {
        console.log("Image deleted successfully");
        onDelete();
      } else {
        console.log("Image not deleted");
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="image-container">
        <div className="image-size-outerdiv">
        <div className="image-size-div">
            <div>
            TOTAL IMAGES SIZE(BYTES)

            </div>
            
            <div>
                {total_size} 
            </div>
            
        </div>
        <hr></hr>
        <div className="image-size-div">
            <div>
                TOTAL NO OF IMAGES
            </div>
          <div>
            {imageUrls.length}
          </div>
            
        </div>
        </div>
      {imageUrls && imageUrls.length > 0 ? 
        imageUrls.map((url, index) => (
          <div key={index} className="image-container-inner">
            <div className="image-view-container">
              <img src={url.url} className="image-view" alt={`img-${index}`} />
            </div>
            <div
              className="delete-icon"
              onClick={() => handleDelete(url.id)}
            >
              <TiDeleteOutline />
            </div>
            <div
              className="edit-icon"
              onClick={() => handleEdit(url.url, url.id)}
            >
              <MdModeEdit />
            </div>
          </div>
        ))
       : !loadingTimeout ? (
        <Spinner />
      ) : (
        <p style={{ textAlign: "center", marginTop: "20px" }}>
          No images found
        </p>
      )}
    </div>
  );
}

export default Images;
