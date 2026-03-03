export const sharedDropdownSx = {
  "& .MuiSelect-select": {
    fontSize: "0.95rem",
    fontWeight: 500,
    lineHeight: 1.3,
    display: "flex",
    alignItems: "center",
    py: 1,
    pr: "1.75rem !important",
  },
  "& .MuiSelect-icon": {
    right: 6,
  },
};

export const appBarDropdownSx = {
  ...sharedDropdownSx,
  color: "inherit",
  height: "100%",
  display: "flex",
  alignItems: "center",
  "& .MuiSelect-icon": {
    color: "inherit",
    right: 4,
  },
};

export const sharedDropdownMenuPaperSx = {
  "& .MuiMenuItem-root": {
    minHeight: 40,
    fontSize: "0.95rem",
    py: 0.75,
  },
};

export const sharedDropdownMenuProps = {
  PaperProps: {
    sx: sharedDropdownMenuPaperSx,
  },
};
