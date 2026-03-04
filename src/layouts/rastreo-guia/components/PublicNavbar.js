/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import PropTypes from "prop-types";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import breakpoints from "assets/theme/base/breakpoints";
import zendaLogo from "assets/images/zenda-logo.png";

const BRAND_COLORS = {
  deepBlue: "#0B1F3B",
  gold: "#F5B400",
};

const navItems = [
  {
    key: "inicio",
    name: "Inicio",
    type: "internal",
    route: "/rastreo-guia",
  },
  {
    key: "quienes-somos",
    name: "Quiénes somos",
    type: "anchor",
    href: "/rastreo-guia#quienes-somos",
  },
  {
    key: "login",
    name: "Login",
    type: "internal",
    route: "/authentication/sign-in",
  },
];

function NavbarItem({ item, light, onClick }) {
  const sharedStyles = {
    mx: 1,
    px: 1.5,
    py: 1,
    display: "flex",
    alignItems: "center",
    borderRadius: "md",
    sx: ({ palette: { white }, functions: { rgba } }) => ({
      cursor: "pointer",
      userSelect: "none",
      transition: "all 180ms ease",
      "&:hover": {
        backgroundColor: light ? rgba(white.main, 0.18) : "transparent",
      },
    }),
    onClick,
  };

  if (item.type === "anchor") {
    return (
      <MDBox component="a" href={item.href} {...sharedStyles}>
        <MDTypography variant="button" fontWeight="regular" color={light ? "white" : "dark"}>
          {item.name}
        </MDTypography>
      </MDBox>
    );
  }

  return (
    <MDBox component={Link} to={item.route} {...sharedStyles}>
      <MDTypography variant="button" fontWeight="regular" color={light ? "white" : "dark"}>
        {item.name}
      </MDTypography>
    </MDBox>
  );
}

NavbarItem.defaultProps = {
  light: false,
  onClick: undefined,
};

NavbarItem.propTypes = {
  item: PropTypes.shape({
    key: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["internal", "anchor"]).isRequired,
    route: PropTypes.string,
    href: PropTypes.string,
  }).isRequired,
  light: PropTypes.bool,
  onClick: PropTypes.func,
};

function PublicNavbar() {
  const [mobileNavbar, setMobileNavbar] = useState(false);
  const [mobileView, setMobileView] = useState(false);

  const openMobileNavbar = ({ currentTarget }) => setMobileNavbar(currentTarget.parentNode);
  const closeMobileNavbar = () => setMobileNavbar(false);

  useEffect(() => {
    function displayMobileNavbar() {
      if (window.innerWidth < breakpoints.values.lg) {
        setMobileView(true);
        setMobileNavbar(false);
      } else {
        setMobileView(false);
        setMobileNavbar(false);
      }
    }

    window.addEventListener("resize", displayMobileNavbar);
    displayMobileNavbar();

    return () => window.removeEventListener("resize", displayMobileNavbar);
  }, []);

  const menuWidth = mobileNavbar ? mobileNavbar.getBoundingClientRect().width : 0;

  return (
    <MDBox
      position="fixed"
      top={0}
      left={0}
      width="100%"
      zIndex={1200}
      shadow="md"
      sx={{
        backgroundColor: BRAND_COLORS.deepBlue,
        borderBottom: `2px solid ${BRAND_COLORS.gold}`,
      }}
    >
      <MDBox
        py={1}
        px={{ xs: 2, sm: 3, lg: 4 }}
        mx="auto"
        maxWidth="1200px"
        color="white"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <MDBox
          component={Link}
          to="/rastreo-guia"
          py={0.75}
          pr={1}
          lineHeight={1}
          pl={0}
          display="flex"
          alignItems="center"
        >
          <MDBox component="img" src={zendaLogo} alt="Zenda" width="8.5rem" />
        </MDBox>

        <MDBox color="inherit" display={{ xs: "none", lg: "flex" }} m={0} p={0}>
          {navItems.map((item) => (
            <NavbarItem key={item.key} item={item} light />
          ))}
        </MDBox>

        <MDBox
          display={{ xs: "inline-block", lg: "none" }}
          lineHeight={0}
          py={1.5}
          pl={1.5}
          color="inherit"
          sx={{ cursor: "pointer" }}
          onClick={openMobileNavbar}
        >
          <Icon fontSize="default">{mobileNavbar ? "close" : "menu"}</Icon>
        </MDBox>
      </MDBox>

      {mobileView && (
        <Menu
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          anchorEl={mobileNavbar}
          open={Boolean(mobileNavbar)}
          onClose={closeMobileNavbar}
          MenuListProps={{ style: { width: `calc(${menuWidth}px - 2rem)` } }}
        >
          <MDBox px={0.5}>
            {navItems.map((item) => (
              <NavbarItem key={`mobile-${item.key}`} item={item} onClick={closeMobileNavbar} />
            ))}
          </MDBox>
        </Menu>
      )}
    </MDBox>
  );
}

export default PublicNavbar;
