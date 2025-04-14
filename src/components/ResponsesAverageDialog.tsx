import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Card,
  CircularProgress,
} from "@mui/material";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface UserGroup {
  id?: number;
  text: string;
  description?: string;
}

interface Question {
  id: number;
  text: string;
  user_group_id: number;
  last_change: string;
  user_group?: UserGroup;
}

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
  orientations: Orientation[];
}

interface Orientation {
  id: number;
  text: string;
  threshold: number;
  question_id: number;
  question: Question;
}

export default function AverageDialog({
  open,
  onClose,
  data,
  orientations,
}: AverageDialog) {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const getMatchedOrientation = (
    orientations: Orientation[],
    average: number
  ) => {
    return orientations
      .filter((o) => o.threshold <= average)
      .sort((a, b) => b.threshold - a.threshold)[0];
  };

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
    const textWidth = pdf.getTextWidth("Relatório Geral");
    pdf.text("Relatório Geral", (pageWidth - textWidth) / 2, 15);

    pdf.addImage(imgData, "PNG", 10, 25, imgWidth, imgHeight);
    pdf.save("relatorio-geral.pdf");

    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          color: "secondary",
          fontWeight: 600,
          fontSize: "1.5rem",
          alignSelf: "center",
        }}
      >
        Relatório Geral
      </DialogTitle>
      <DialogContent>
        <Box ref={pdfRef} sx={{ p: 2 }}>
          {data.length > 0 ? (
            data.map((item) => {
              const matchedOrientation = getMatchedOrientation(
                orientations.filter((o) => o.question_id === item.id),
                item.average
              );

              return (
                <Card key={item.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" color="#000" fontWeight={500}>
                        {item.text}
                      </Typography>
                      <Typography>
                        Avaliação média: <strong>{item.average}</strong>
                      </Typography>
                      <Typography>Total de respostas: {item.total}</Typography>
                      <Box
                        sx={{
                          width: "100px",
                          height: "25px",
                          backgroundColor: item.threshold,
                          borderRadius: "5px",
                          mt: 1,
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        width: "1px",
                        backgroundColor: "#ccc",
                        display: { xs: "none", md: "block" },
                      }}
                    />

                    <Box sx={{ flex: 2 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        gutterBottom
                      >
                        Orientação
                      </Typography>
                      {matchedOrientation ? (
                        <Typography>{matchedOrientation.text}</Typography>
                      ) : (
                        <Typography color="textSecondary">
                          Nenhuma orientação aplicável.
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Card>
              );
            })
          ) : (
            <Typography variant="body2">Nenhum dado encontrado.</Typography>
          )}
        </Box>
        <DialogActions>
          <Button
            onClick={handleDownloadPDF}
            variant="contained"
            color="success"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#fff" }} />
            ) : (
              "Baixar PDF"
            )}
          </Button>
          <Button onClick={onClose} color="primary">
            Fechar
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
