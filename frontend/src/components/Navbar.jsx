import React from "react";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <div>
      <nav>
        <NavLink to="/">
          <li>Dashboard</li>
        </NavLink>
        <NavLink to="/profile">
          <li>Profile</li>
        </NavLink>
        <NavLink to="/logout">
          <li>Logout</li>
        </NavLink>
      </nav>
    </div>
  );
};

export default Navbar;
