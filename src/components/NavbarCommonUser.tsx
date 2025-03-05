"use client";

import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box, Drawer, List, ListItem, ListItemText, IconButton, Divider } from "@mui/material";
import { Menu as MenuIcon, Person, ExitToApp as ExitIcon, Group, Help, QuestionAnswer, Info } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import HomeIcon from '@mui/icons-material/Home';
import Cookies from "js-cookie";

export default function NavbarCommonUser() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();

  const toggleDrawer = (open: boolean) => {
    setIsDrawerOpen(open);
  };

  const navigateTo = (path: string) => {
    router.push(path);
    setIsDrawerOpen(false);
  };

  const handleLogout = () => {
    Cookies.remove("jwt");
    router.push("/");
  };

  return (
    <>
      <AppBar position="sticky" sx={{ backgroundColor: "#7E57C2" }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => toggleDrawer(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Mapa de Acessibilidade
          </Typography>
          <Box>
            <Button color="inherit" startIcon={<HomeIcon />} onClick={() => navigateTo("/home")}>
              Inicio
            </Button>
            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<ExitIcon />}
              sx={{
                marginLeft: 2,
                fontWeight: "bold",
                color: "inherit",
                border: "2px solid",
                borderColor: "inherit",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.08)",
                },
              }}
            >
              Sair
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={isDrawerOpen} onClose={() => toggleDrawer(false)}>
        <Box sx={{ width: 250 }} role="presentation" onClick={() => toggleDrawer(false)} onKeyDown={() => toggleDrawer(false)}>
          <List>
            <ListItem component="button" onClick={() => navigateTo("/home")}>
              <HomeIcon sx={{ mr: 1 }} />
              <ListItemText primary="Início" />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem component="button" onClick={handleLogout}>
              <ExitIcon sx={{ mr: 1 }} />
              <ListItemText primary="Sair" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}
