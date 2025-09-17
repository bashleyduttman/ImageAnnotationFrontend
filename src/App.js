import {BrowserRouter,Routes,Route, useSearchParams} from "react-router-dom"
import Home from "./components/Home"
import Edit from "./components/Edit";
import Temp from "./components/Temp"
import { useState } from "react";
function App(){
  // const [editUrl,setEditUrl]=useState("")
  const [imageUrls,setImageUrls]=useState([]);
  return(
    <BrowserRouter>
    <Routes>
    <Route path="/" element={<Home imageUrls={imageUrls} setImageUrls={setImageUrls} />}/>
    <Route path="/edit" element={<Edit/>}/>
    <Route path="/temp" element={<Temp/>}> </Route>
      
    </Routes>
    </BrowserRouter>
  )
}
export default App;