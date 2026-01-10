import React, {} from "react";

import SidebarAdmin from "../components/SidebarAdmin";
import ListView from "./ListView";

function AdminPanel() {
  return (
    <div className="d-flex">
      <SidebarAdmin />
      <div className="flex-grow-1 p-4">
        <ListView/>
      </div>
    </div>
  );
}

export default AdminPanel;
