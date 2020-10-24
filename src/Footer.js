import React from "react";

const style = {
  textAlign: "center",
  padding: "20px",
  position: "fixed",
  left: "0",
  bottom: "0",
  height: "50px",
  width: "100%",
}

function Footer({ children }) {
  return (
    <div>
      <div style={style}>
        <small></small>{ children }
      </div>
    </div>
  )
}

export default Footer