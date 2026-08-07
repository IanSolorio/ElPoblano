import React from "react";

const CartButton = ({ toggleCart }) => {
  return (
    <button
      onClick={() => toggleCart(true)}
      style={{
        position: "fixed",
        top: "15px",
        right: "20px", 
        marginRight: "100px",
        zIndex: 1000,
        padding: "10px 20px",
        backgroundColor: "white",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24"
        viewBox="0 0 24 24"
        width="24"
      >
        <path d="M0 0h24v24H0z" fill="none" />
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.91 13.5h7.17c.73 0 1.37-.41 1.68-1.05l3.56-7.88A1 1 0 0019.45 3H4.21L3.27 1H1v2h2l3.6 7.59-1.35 2.45C5.11 13.37 5 13.67 5 14c0 1.1.9 2 2 2h12v-2H7l1.1-2.5z" />
      </svg>
    </button>
  );
};

export default CartButton;
