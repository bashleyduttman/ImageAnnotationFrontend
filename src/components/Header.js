import "../styles/Header.css"
function Header(){
    return(
        <div className="home-header-main">
            <div className="home-header">
                 <h1>Image Box</h1>
            </div>
            <div style={{paddingTop:"80px"}}>
                <p>Upload & Annotate Your Image!</p>
            </div>
        </div>
        
    )
}
export default Header;