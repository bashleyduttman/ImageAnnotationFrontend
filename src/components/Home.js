import ImageUploader from "./ImageUploader";
import Header from "./Header"
import Images from "./Images";
import "../styles/Home.css"
import { useState,useEffect } from "react";
function Home({imageUrls,setImageUrls}){

 useEffect(()=>{ 
        fetch_images();
},[])
    const fetch_images=async()=>{
        try{
            const result=await fetch('http://localhost:3002/server/image_annotations_function/images',{
            method:"GET",
            headers:{
                "Content-Type":"application/json"
             }
            })
            if(result.ok){

                const data = await result.json(); 
                
                   
                const urls = data.data.map((item) => ({url: item.data,id:item.id,size:item.size}));

                setImageUrls(urls)
               
            }
        }
        catch(err){
            console.log(err);
        }
            

    }
return (
<div className="home">
    <Header/>
    <ImageUploader onUpload={fetch_images}/>
    <Images  imageUrls={imageUrls} onDelete={fetch_images}/>

</div>)
}
export default Home;