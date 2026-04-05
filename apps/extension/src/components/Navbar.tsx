import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <div>
      <nav>
        <NavLink
          className={(e) => {
            return e.isActive ? "to-blue-50" : "";
          }}
          to="/"
        >
          <li>Dashboard</li>
        </NavLink>
        <NavLink
          className={(e) => {
            return e.isActive ? "to-blue-50" : "";
          }}
          to="/urls"
        >
          <li>URL's</li>
        </NavLink>
        <NavLink
          className={(e) => {
            return e.isActive ? "to-blue-50" : "";
          }}
          to="/profile"
        >
          <li>Profile</li>
        </NavLink>
        <NavLink
          className={(e) => {
            return e.isActive ? "to-blue-50" : "";
          }}
          to="/signout"
        >
          <li>Sign Out</li>
        </NavLink>
      </nav>
    </div>
  );
};

export default Navbar;
