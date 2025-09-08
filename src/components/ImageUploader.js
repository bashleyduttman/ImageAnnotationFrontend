import { useState } from "react"
import { LuUpload } from "react-icons/lu";
import imageCompression from "browser-image-compression"
import "../styles/ImageUploader.css"
function ImageUploader({onUpload}){
    const [preview,setPreview]=useState(null);
    const [fileName,setFileName]=useState("");
    const [isEnableUpload,setIsEnableUpload]=useState(false);

    
    const handleChange=async(e)=>{
        const file=e.target.files && e.target.files[0];
        if(!file)return;
        
        const compressed=await imageCompression(file,{
            maxSizeMB:1,
            maxWidthOrHeight:1024,
            useWebWorker:true
        })
        setPreview(URL.createObjectURL(compressed));
        setFileName(compressed.name)
        setIsEnableUpload(true)
    }
    const handleUploads=async()=>{
        try{
            const form_data=new FormData();
            form_data.append("image",document.getElementById("file-input").files[0]);
            const result=await fetch("http://localhost:3001/api/images/",{
                method:"POST",
                body:form_data,
            })
            if(result.ok){
                console.log("image uploaded successfully");
                onUpload();
            }
            else{
                console.log("image is not uploaded!")
            }
        }
        catch(err){
            console.log(err);
        }
    }
    return(
        <div className="image-uploader">
            <div className="image-uploader-container">
                <div>
                    <input 
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    id="file-input"
                    name="image"
                    className="image-uploader-file-input"
                    style={{display:"none"}}
                    />
                </div>
                <div>
                     <label htmlFor="file-input" className="choose-btn">
                        Choose-file
                    </label>
                </div>
               
                {fileName &&
                <div>
                    {fileName}
                </div>
                }
                

            </div>
            
            <div>
                {preview && <img className="image-uploader-url" src={preview} alt="preview"></img>}

            </div>
            {isEnableUpload &&
            <div className="image-uploader-footer">
               
                <div onClick={()=>handleUploads()}>
                    <LuUpload className="image-uploader-btn"/>
                </div>
             
              <div>
                    <p style={{color:"white"}}>Upload the image</p>

              </div>
            </div>
            }
            
            
           
        </div>
    )
}
export default ImageUploader