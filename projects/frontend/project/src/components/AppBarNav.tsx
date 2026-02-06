import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

type AppBarUser = {
  username: string;
} | null;

type AppBarNavProps = {
  user: AppBarUser;
  login: () => void;
  logout: () => void;
};

export default function AppBarNav({ user, login, logout }: AppBarNavProps) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [developerAnchorEl, setDeveloperAnchorEl] =
    useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const developerOpen = Boolean(developerAnchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setDeveloperAnchorEl(null);
  };

  const handleDeveloperClick = (event: React.MouseEvent<HTMLElement>) => {
    setDeveloperAnchorEl(event.currentTarget);
  };

  const handleDeveloperClose = () => {
    setDeveloperAnchorEl(null);
    handleMenuClose();
  };

  return (
    <AppBar position="static">
      <Toolbar disableGutters>
        <Button
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{
            alignSelf: "stretch",
            borderRadius: 0,
            p: 0,
            mr: 4,
            textTransform: "none",
            "&:hover": {
              backgroundColor: "transparent",
            },
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ mx: 2, color: "inherit" }}
          >
            {t("app_title")}
          </Typography>
        </Button>
        {user ? (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: "flex", alignSelf: "stretch" }}>
              <Button
                color="inherit"
                onClick={handleMenuClick}
                endIcon={<KeyboardArrowDownIcon />}
                sx={{ borderRadius: 0, px: 3 }}
              >
                {user.username}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                slotProps={{
                  list: {
                    "aria-labelledby": "basic-button",
                  },
                }}
              >
                <MenuItem onClick={handleDeveloperClick}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <KeyboardArrowLeftIcon fontSize="small" sx={{ mr: 1 }} />
                    {t("menu_developer")}
                  </Box>
                </MenuItem>
                <Menu
                  anchorEl={developerAnchorEl}
                  open={developerOpen}
                  onClose={handleDeveloperClose}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                >
                  <MenuItem
                    component={RouterLink}
                    to="/jobs"
                    onClick={handleDeveloperClose}
                  >
                    {t("menu_jobs")}
                  </MenuItem>
                  <MenuItem
                    component={RouterLink}
                    to="/league-inspection"
                    onClick={handleDeveloperClose}
                  >
                    {t("menu_league_inspection")}
                  </MenuItem>
                </Menu>
                <Divider />
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    logout();
                  }}
                >
                  {t("menu_logout")}
                </MenuItem>
              </Menu>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              color="inherit"
              onClick={login}
              sx={{ borderRadius: 0, px: 3, alignSelf: "stretch" }}
            >
              {t("menu_login")}
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
