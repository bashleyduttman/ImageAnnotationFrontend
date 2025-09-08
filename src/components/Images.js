import { useEffect, useState } from "react";
import "../styles/Images.css"
import { useNavigate } from "react-router-dom";
import { TiDeleteOutline } from "react-icons/ti";
import { MdModeEdit } from "react-icons/md";

function Images({imageUrls,onDelete}){
    const navigate=useNavigate();
    const handleEdit=(url,id)=>{
       localStorage.setItem("tempUrl",url);
       console.log(id)
       localStorage.setItem("tempId",id)
        navigate("/edit")
    }
    const handleDelete=async(id)=>{
        try{
            const result=await fetch(`http://localhost:3001/api/images/${id}`,{
            method:"DELETE",
            headers:{
                "Content-Type":"application/json"
            }
        })
        if(result.ok){
            console.log("image deleted Successfully");
            onDelete();
        }
        else{
            console.log("image not deleted");
        }
        }
        catch(err){
            console.log(err);
        }
       
    }
    return(
        <div className="image-container">
            {imageUrls && imageUrls.map((url,index)=>(
                <div key={index} className="image-container-inner" >
                    {console.log(url)}
                   <div className="image-view-container"><img src={url.Image_url} className="image-view"></img></div> 
                   <div className="delete-icon" onClick={()=>handleDelete(url.id)}><TiDeleteOutline/></div>
                   <div className="edit-icon" onClick={()=>handleEdit(url.Image_url,url.id)}><MdModeEdit/></div>

                </div>
            ))}
        </div>
    )
}
export default Images;