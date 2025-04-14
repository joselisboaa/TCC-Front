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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ color: "#7E57C2" }}>Relatório de Respostas</DialogTitle>
      <DialogContent>
        <Box ref={pdfRef} sx={{ p: 2 }}>
          {jsonData ? (
            <>
              <Typography variant="h6">
                Data de envio: {new Date(jsonData.timestamp).toLocaleString()}
              </Typography>

              <Typography variant="h6">
                Nome: {jsonData.user.name || "Usuário não identificado"}
              </Typography>

              <Typography variant="h6">
                Grupos de Usuário:&nbsp;
                <strong>
                  {jsonData.user.user_groups.map((group) => group.text).join(", ")}
                </strong>
              </Typography>


              {jsonData.answeredQuestions.map((item, index) => (
                <Box key={index} sx={{ mt: 2, mb: 2 }}>
                  <Card variant="outlined" sx={{ padding: 2, marginBlock: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                      {item.question.text}
                    </Typography>
                    <FormControl component="fieldset">
                      <RadioGroup value={item.answer.text}>
                        <FormControlLabel
                          value={item.answer.text}
                          control={<Radio sx={{ color: "#7E57C2" }} />}
                          label={item.answer.text}
                        />
                      </RadioGroup>
                    </FormControl>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
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

        <DialogActions>
          <Button
            variant="contained"
            onClick={handleDownloadPDF}
            color="success"
            disabled={!jsonData || loading}
          >
            {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Baixar PDF"}
          </Button>
          <Button onClick={onClose} color="primary">
            Fechar
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
