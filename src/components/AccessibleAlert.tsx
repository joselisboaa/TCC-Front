"use client";

import { Alert, AlertColor, Snackbar } from "@mui/material";
import React, { useEffect, useState } from "react";

interface AccessibleAlertProps {
  message: string;
  severity?: AlertColor;
  autoHideDuration?: number;
}

const AccessibleAlert = ({
  message,
  severity = "info",
  autoHideDuration = 10000,
}: AccessibleAlertProps) => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setOpen(false), autoHideDuration);
    return () => clearTimeout(timeout);
  }, [autoHideDuration]);

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert
        onClose={() => setOpen(false)}
        severity={severity}
        role="alert"
        aria-live="assertive"
        variant="filled"
        sx={{ width: "100%" }}
        className="sr-only"
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AccessibleAlert;
