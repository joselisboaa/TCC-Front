"use client";

import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box, Drawer, List, ListItem, ListItemText, IconButton, Divider, useTheme, useMediaQuery } from "@mui/material";
import { Menu as MenuIcon, Person, ExitToApp as ExitIcon, Group, Help, QuestionAnswer, Info, Assessment, Close as CloseIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import HomeIcon from '@mui/icons-material/Home';
import Cookies from "js-cookie";

export default function Navbar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const menuItems = [
    { icon: <HomeIcon />, text: "Inicio", path: "/home" },
    { icon: <Person />, text: "Usuários", path: "/home/users" },
    { icon: <Group />, text: "Grupos", path: "/home/user-group" },
    { icon: <Help />, text: "Questões", path: "/home/questions" },
    { icon: <QuestionAnswer />, text: "Respostas", path: "/home/answers" },
    { icon: <Info />, text: "Orientações", path: "/home/orientations" },
    { icon: <Assessment />, text: "Relatórios", path: "/home/reports" },
  ];

  return (
    <>
      <AppBar position="sticky" sx={{ backgroundColor: "#7E57C2" }}>
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
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            Mapa de Acessibilidade
          </Typography>
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => navigateTo(item.path)}
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    minWidth: { xs: 'auto', sm: '100px' },
                    px: { xs: 1, sm: 2 }
                  }}
                >
                  {item.text}
                </Button>
              ))}
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
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: { xs: 'auto', sm: '100px' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                Sair
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer 
        anchor="left" 
        open={isDrawerOpen} 
        onClose={() => toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 250 }
          }
        }}
      >
        <Box 
          sx={{ 
            width: { xs: '100%', sm: 250 },
            pt: { xs: 2, sm: 0 }
          }} 
          role="presentation" 
          onClick={() => toggleDrawer(false)} 
          onKeyDown={() => toggleDrawer(false)}
        >
          {isMobile && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
              <IconButton 
                onClick={() => toggleDrawer(false)}
                sx={{ 
                  color: 'text.primary',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}
          <List>
            {menuItems.map((item) => (
              <ListItem 
                key={item.text}
                component="button" 
                onClick={() => navigateTo(item.path)}
                sx={{
                  py: { xs: 2, sm: 1.5 },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                {item.icon}
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    ml: 1,
                    '& .MuiTypography-root': {
                      fontSize: { xs: '1rem', sm: '0.875rem' }
                    }
                  }} 
                />
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem 
              component="button" 
              onClick={handleLogout}
              sx={{
                py: { xs: 2, sm: 1.5 },
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <ExitIcon sx={{ mr: 1 }} />
              <ListItemText 
                primary="Sair" 
                sx={{ 
                  '& .MuiTypography-root': {
                    fontSize: { xs: '1rem', sm: '0.875rem' }
                  }
                }} 
              />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}
