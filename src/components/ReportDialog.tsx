import { useRef, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Typography,
  Button, Box, FormControl, RadioGroup, FormControlLabel, Radio, Card,
  CircularProgress
} from "@mui/material";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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

interface Answer {
  id: number;
  text: string;
  value: number;
  other: boolean;
  questions: Question[];
  last_change: string;
}

interface AnsweredQuestion {
  question: Question;
  answer: Answer;
}

interface User {
  phone_number: string;
  email: string;
  name: string;
  user_groups: UserGroup[];
}

interface DetailedResponse {
  id: number;
  user_id: number;
  timestamp: string;
  user: User;
  answeredQuestions: AnsweredQuestion[];
}

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  jsonData: DetailedResponse | null;
}

export default function ReportDialog({ open, onClose, jsonData }: ReportDialogProps) {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!jsonData || !pdfRef.current) return;

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
    const textWidth = pdf.getTextWidth("Relatório do Usuário");
    pdf.text("Relatório do Usuário", (pageWidth - textWidth) / 2, 15);

    pdf.addImage(imgData, "PNG", 10, 25, imgWidth, imgHeight);
    pdf.save("relatorio.pdf");

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
      <DialogTitle sx={{ 
        color: "#7E57C2",
        fontSize: { xs: '1.25rem', sm: '1.5rem' },
        padding: { xs: 2, sm: 3 }
      }}>
        Relatório de Respostas
      </DialogTitle>
      <DialogContent sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
        <Box ref={pdfRef} sx={{ p: { xs: 1, sm: 2 } }}>
          {jsonData ? (
            <>
              <Typography variant="h6" sx={{ 
                fontSize: { xs: '1rem', sm: '1.25rem' },
                mb: { xs: 1, sm: 2 }
              }}>
                Data de envio: {new Date(jsonData.timestamp).toLocaleString()}
              </Typography>

              <Typography variant="h6" sx={{ 
                fontSize: { xs: '1rem', sm: '1.25rem' },
                mb: { xs: 1, sm: 2 }
              }}>
                Nome: {jsonData.user.name || "Usuário não identificado"}
              </Typography>

              <Typography variant="h6" sx={{ 
                fontSize: { xs: '1rem', sm: '1.25rem' },
                mb: { xs: 1, sm: 2 }
              }}>
                Grupos de Usuário:&nbsp;
                <strong>
                  {jsonData.user.user_groups.map((group) => group.text).join(", ")}
                </strong>
              </Typography>

              {jsonData.answeredQuestions.map((item, index) => (
                <Box key={index} sx={{ mt: { xs: 1, sm: 2 }, mb: { xs: 1, sm: 2 } }}>
                  <Card variant="outlined" sx={{ 
                    padding: { xs: 1.5, sm: 2 },
                    marginBlock: { xs: 1, sm: 2 }
                  }}>
                    <Typography variant="body1" sx={{ 
                      fontWeight: "bold",
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}>
                      {item.question.text}
                    </Typography>
                    <FormControl component="fieldset" sx={{ mt: { xs: 0.5, sm: 1 } }}>
                      <RadioGroup value={item.answer.text}>
                        <FormControlLabel
                          value={item.answer.text}
                          control={<Radio sx={{ color: "#7E57C2" }} />}
                          label={item.answer.text}
                          sx={{
                            '& .MuiFormControlLabel-label': {
                              fontSize: { xs: '0.875rem', sm: '1rem' }
                            }
                          }}
                        />
                      </RadioGroup>
                    </FormControl>
                    <Typography variant="body2" color="textSecondary" sx={{ 
                      mt: { xs: 0.5, sm: 1 },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      Valor da resposta: {item.answer.value}
                    </Typography>
                  </Card>
                </Box>
              ))}
            </>
          ) : (
            <Typography variant="body2">Nenhuma resposta disponível.</Typography>
          )}
        </Box>

        <DialogActions sx={{ 
          padding: { xs: 1, sm: 2 },
          justifyContent: { xs: 'center', sm: 'flex-end' },
          gap: { xs: 1, sm: 2 }
        }}>
          <Button
            variant="contained"
            onClick={handleDownloadPDF}
            color="success"
            disabled={!jsonData || loading}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Baixar PDF"}
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
