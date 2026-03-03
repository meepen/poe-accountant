import type { ReactNode } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getLeagueKey, type League } from "./league-context";
import {
  appBarDropdownSx,
  sharedDropdownMenuProps,
  sharedDropdownSx,
} from "./dropdown-styles";

type AppBarUser = {
  username: string;
} | null;

type NavOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

type AppBarNavProps = {
  user: AppBarUser;
  login: () => void;
  logout: () => void;
  leagues: League[];
  leagueLoading: boolean;
  selectedLeagueKey: string | null;
  onLeagueChange: (value: string | null) => void;
};

const navInteractiveSx = {
  transition: "background-color 180ms ease",
  "&:hover": {
    backgroundColor: (theme: { palette: { common: { white: string } } }) =>
      alpha(theme.palette.common.white, 0.08),
  },
  "&:active": {
    backgroundColor: (theme: { palette: { common: { white: string } } }) =>
      alpha(theme.palette.common.white, 0.14),
  },
  '&[aria-expanded="true"]': {
    backgroundColor: (theme: { palette: { common: { white: string } } }) =>
      alpha(theme.palette.common.white, 0.14),
  },
  "&.Mui-focused": {
    backgroundColor: (theme: { palette: { common: { white: string } } }) =>
      alpha(theme.palette.common.white, 0.14),
  },
};

function NavDivider() {
  return (
    <Divider
      orientation="vertical"
      flexItem
      sx={{ alignSelf: "stretch", my: 0, mx: 0 }}
    />
  );
}

function NavSelectControl({
  value,
  onChange,
  options,
  displayEmpty,
  disabled,
  renderValue,
}: {
  value: string;
  onChange: (event: SelectChangeEvent) => void;
  options: NavOption[];
  displayEmpty?: boolean;
  disabled?: boolean;
  renderValue?: (value: string) => ReactNode;
}) {
  return (
    <FormControl
      size="small"
      variant="standard"
      sx={{
        width: "fit-content",
        minWidth: 0,
        height: "100%",
        alignSelf: "stretch",
        "& .MuiInputBase-root": {
          height: "100%",
        },
      }}
    >
      <Select
        value={value}
        onChange={onChange}
        disableUnderline
        displayEmpty={displayEmpty}
        disabled={disabled}
        renderValue={renderValue}
        MenuProps={sharedDropdownMenuProps}
        sx={[
          sharedDropdownSx,
          appBarDropdownSx,
          navInteractiveSx,
          {
            height: "100%",
            minHeight: 0,
            "&.MuiInputBase-root": {
              height: "100%",
              alignItems: "stretch",
            },
            "& .MuiSelect-select": {
              boxSizing: "border-box",
              minHeight: "unset",
              height: "100%",
              display: "flex",
              alignItems: "center",
              py: 0,
              px: 1.25,
              fontSize: "0.95rem",
              fontWeight: 500,
            },
          },
        ]}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function AppBarNav({
  user,
  login,
  logout,
  leagues,
  leagueLoading,
  selectedLeagueKey,
  onLeagueChange,
}: AppBarNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const availableRoutes = user
    ? [
        { path: "/", label: t("menu_dashboard") },
        { path: "/jobs", label: t("menu_jobs") },
        {
          path: "/league-inspection",
          label: t("menu_league_inspection"),
        },
      ]
    : [{ path: "/", label: t("menu_dashboard") }];
  const availableRoutePaths = availableRoutes.map((route) => route.path);
  const selectedRoute = availableRoutePaths.includes(location.pathname)
    ? location.pathname
    : "/";

  const handleRouteChange = (event: SelectChangeEvent) => {
    const route = event.target.value;
    void navigate(route);
  };

  const handleLeagueChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    onLeagueChange(
      typeof value === "string" && value.length > 0 ? value : null,
    );
  };

  const routeOptions: NavOption[] = availableRoutes.map((route) => ({
    value: route.path,
    label: route.label,
  }));

  const leagueOptions: NavOption[] =
    leagues.length > 0
      ? leagues.map((league) => ({
          value: getLeagueKey(league),
          label: `${league.leagueName ?? league.leagueId} (${league.realm})`,
        }))
      : [
          {
            value: "",
            label: leagueLoading ? t("loading") : t("league_inspection_empty"),
            disabled: true,
          },
        ];

  const accountOptions: NavOption[] = [
    {
      value: "logout",
      label: t("menu_logout"),
    },
  ];

  const handleAccountChange = (event: SelectChangeEvent) => {
    if (event.target.value === "logout") {
      logout();
    }
  };

  return (
    <AppBar position="static">
      <Toolbar disableGutters>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            alignSelf: "stretch",
            height: "100%",
            mr: 4,
          }}
        >
          <Button
            component={RouterLink}
            to="/"
            color="inherit"
            sx={[
              navInteractiveSx,
              {
                borderRadius: 0,
                px: 2.25,
                textTransform: "none",
                fontSize: "0.95rem",
                fontWeight: 500,
                alignSelf: "stretch",
              },
            ]}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{ color: "inherit", fontSize: "0.95rem", fontWeight: 600 }}
            >
              {t("app_title")}
            </Typography>
          </Button>
          <NavDivider />
          <NavSelectControl
            value={selectedRoute}
            onChange={handleRouteChange}
            options={routeOptions}
          />
          <NavDivider />
        </Box>
        {user ? (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: "flex", alignSelf: "stretch" }}>
              <NavSelectControl
                value={selectedLeagueKey ?? ""}
                onChange={handleLeagueChange}
                options={leagueOptions}
                displayEmpty
                disabled={leagueLoading || leagues.length === 0}
              />
              <NavDivider />
            </Box>
            <Box sx={{ display: "flex", alignSelf: "stretch" }}>
              <NavSelectControl
                value=""
                onChange={handleAccountChange}
                options={accountOptions}
                displayEmpty
                renderValue={() => user.username}
              />
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              color="inherit"
              onClick={login}
              sx={[
                navInteractiveSx,
                {
                  borderRadius: 0,
                  px: 2.5,
                  textTransform: "none",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  alignSelf: "stretch",
                },
              ]}
            >
              {t("menu_login")}
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
