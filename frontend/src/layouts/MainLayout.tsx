import React from "react";
import { Outlet } from "react-router-dom";
import NavigationBar from "../components/NavigationBar";

const MainLayout: React.FC = () => {
  return (
    <div>
      <NavigationBar />
      <main className="p-5">
        {" "}
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
