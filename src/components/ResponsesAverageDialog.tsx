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
    setLoading(true);
    const doc = new jsPDF("p", "mm", "a4");
    const lineHeight = 7;
    let y = 20;
    const pageWidth = 190;
    const margin = 15;
  
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(126, 87, 194);
    const textWidth = doc.getTextWidth("Relatório Geral");
    doc.text("Relatório Geral", (210 - textWidth) / 2, 15); 
    y = 25;
  
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
  
    data.forEach((item) => {
      const orientation = orientations.find(o => o.question_id === item.id)?.text || 
                        "Nenhuma orientação aplicável.";
  
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
  
      doc.setFont("helvetica", "bold");
      const questionLines = doc.splitTextToSize(item.text, pageWidth);
      questionLines.forEach(line => {
        doc.text(line, margin, y);
        y += lineHeight;
      });
      
      doc.setFont("helvetica", "normal");
      y += 2;
      doc.text(`Avaliação média: ${item.average}`, margin, y);
      y += lineHeight;
      doc.text(`Total de respostas: ${item.total}`, margin, y);
      y += lineHeight;
  
      doc.setFillColor(item.threshold);
      doc.rect(margin, y, pageWidth, 5, 'F'); 
      y += 8;
  
      doc.line(margin, y, margin + pageWidth, y);
      y += 10;
  
      doc.setFont("helvetica", "bold");
      doc.text("Orientação:", margin, y);
      y += lineHeight;
  
      doc.setFont("helvetica", "normal");
      const orientationLines = doc.splitTextToSize(orientation, pageWidth);
      orientationLines.forEach(line => {
        doc.text(line, margin + 5, y); 
        y += lineHeight;
      });
  
      y += 15;
    });
  
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Página ${i} de ${totalPages}`, margin, 287);
    }
  
    doc.save("relatorio-acessibilidade.pdf");
    setLoading(false);
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        sx: {
          width: { xs: '95%', sm: '80%', md: '70%' },
          maxHeight: { xs: '90vh', sm: '80vh' },
          margin: { xs: 1, sm: 2 }
        }
      }}
    >
      <DialogTitle
        sx={{
          color: "secondary",
          fontWeight: 600,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          alignSelf: "center",
          padding: { xs: 2, sm: 3 }
        }}
      >
        Relatório Geral
      </DialogTitle>
      <DialogContent sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
        <Box ref={pdfRef} sx={{ p: { xs: 1, sm: 2 } }}>
          {data.length > 0 ? (
            data.map((item) => {
              const matchedOrientation = getMatchedOrientation(
                orientations.filter((o) => o.question_id === item.id),
                item.average
              );

              return (
                <Card key={item.id} variant="outlined" sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  mb: { xs: 1.5, sm: 2 } 
                }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      gap: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="h6" 
                        color="#000" 
                        fontWeight={500}
                        sx={{ 
                          fontSize: { xs: '1rem', sm: '1.25rem' },
                          mb: { xs: 0.5, sm: 1 }
                        }}
                      >
                        {item.text}
                      </Typography>
                      <Typography sx={{ 
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        mb: { xs: 0.5, sm: 1 }
                      }}>
                        Avaliação média: <strong>{item.average}</strong>
                      </Typography>
                      <Typography sx={{ 
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        mb: { xs: 0.5, sm: 1 }
                      }}>
                        Total de respostas: {item.total}
                      </Typography>
                      <Box
                        sx={{
                          width: { xs: '80px', sm: '100px' },
                          height: { xs: '20px', sm: '25px' },
                          backgroundColor: item.threshold,
                          borderRadius: "5px",
                          mt: { xs: 0.5, sm: 1 },
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
                        sx={{ 
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          mb: { xs: 0.5, sm: 1 }
                        }}
                      >
                        Orientação
                      </Typography>
                      {matchedOrientation ? (
                        <Typography sx={{ 
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}>
                          {matchedOrientation.text}
                        </Typography>
                      ) : (
                        <Typography 
                          color="textSecondary"
                          sx={{ 
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}
                        >
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
        <DialogActions sx={{ 
          padding: { xs: 1, sm: 2 },
          justifyContent: { xs: 'center', sm: 'flex-end' },
          gap: { xs: 1, sm: 2 }
        }}>
          <Button
            onClick={handleDownloadPDF}
            variant="contained"
            color="success"
            disabled={loading}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#fff" }} />
            ) : (
              "Baixar PDF"
            )}
          </Button>
          <Button 
            onClick={onClose} 
            color="primary"
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            Fechar
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
