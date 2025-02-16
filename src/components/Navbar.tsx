"use client";

import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box, Drawer, List, ListItem, ListItemText, IconButton } from "@mui/material";
import { Menu as MenuIcon, ExitToApp as ExitIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function Navbar() {
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
      <AppBar position="sticky">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Mapa de Acessibilidade
          </Typography>
          <Button color="inherit" onClick={() => navigateTo("/home/user-group")}>
            Grupos
          </Button>
          <Button color="inherit" onClick={() => navigateTo("/home/questions")}>
            Questões
          </Button>
          <Button color="inherit" onClick={() => navigateTo("/home/answers")}>
            Respostas
          </Button>
          <Button color="inherit" onClick={() => navigateTo("/home/orientations")}>
            Orientações
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
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={isDrawerOpen} onClose={() => toggleDrawer(false)}>
        <List
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => toggleDrawer(false)}
          onKeyDown={() => toggleDrawer(false)}
        >
          <ListItem button onClick={() => navigateTo("/home/user-group")}>
            <ListItemText primary="Grupos" />
          </ListItem>
          <ListItem button onClick={() => navigateTo("/home/questions")}>
            <ListItemText primary="Questões" />
          </ListItem>
          <ListItem button onClick={() => navigateTo("/home/answers")}>
            <ListItemText primary="Respostas" />
          </ListItem>
          <ListItem button onClick={() => navigateTo("/home/orientations")}>
            <ListItemText primary="Orientações" />
          </ListItem>
          <ListItem button onClick={handleLogout}>
            <ListItemText primary="Sair" />
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}
