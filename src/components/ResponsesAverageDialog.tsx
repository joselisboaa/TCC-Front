import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, Box, Card, CircularProgress } from "@mui/material";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface AverageResponse {
  id: number;
  text: string;
  average: number;
  total: number;
  threshold: string; 
}

interface AverageDialog {
  open: boolean;
  onClose: () => void;
  data: AverageResponse[];
}

export default function AverageDialog({ open, onClose, data }: AverageDialog) {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setLoading(true);

    const canvas = await html2canvas(pdfRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(126, 87, 194);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const textWidth = pdf.getTextWidth("Média de Respostas");
    pdf.text("Média de Respostas", (pageWidth - textWidth) / 2, 15);

    pdf.addImage(imgData, "PNG", 10, 25, imgWidth, imgHeight);
    pdf.save("media-respostas.pdf");

    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ color: "#000", fontWeight: 600, fontSize: "1.5rem", alignSelf: "center" }}>Média de Respostas</DialogTitle>
      <DialogContent>
        <Box ref={pdfRef} sx={{ p: 2 }}>
          {data.length > 0 ? (
            data.map((item) => (
              <Card key={item.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" color="secondary">{item.text}</Typography>
                <Typography>Avaliação média: <strong>{item.average}</strong></Typography>
                <Typography>Total de respostas: {item.total}</Typography>
                <Box
                  sx={{
                    width: "100px",
                    height: "25px",
                    backgroundColor: item.threshold,
                    borderRadius: "5px"
                  }}
                />
              </Card>
            ))
          ) : (
            <Typography variant="body2">Nenhum dado encontrado.</Typography>
          )}
        </Box>
        <DialogActions>
          <Button onClick={handleDownloadPDF} variant="contained" color="success" disabled={loading}>
            {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Baixar PDF"}
          </Button>
          <Button onClick={onClose} color="primary">Fechar</Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
