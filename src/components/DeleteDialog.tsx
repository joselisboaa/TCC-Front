import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityName: string;
}

export default function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  entityName,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle color="secondary">Excluir {entityName}</DialogTitle>
      <DialogContent>
        <Typography>Realmente deseja excluir {entityName}?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Não
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Sim
        </Button>
      </DialogActions>
    </Dialog>
  );
}
