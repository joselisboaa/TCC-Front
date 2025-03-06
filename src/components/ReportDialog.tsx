import { useRef, useState } from "react";
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, 
  Button, Box, FormControl, RadioGroup, FormControlLabel, Radio , Card,
  CircularProgress
} from "@mui/material";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface Question {
  text: string;
  answer: string;
  orientation: string;
}

interface Orientation {
  questions: Question[];
  value: number;
}

interface ReportData {
  id: number;
  timestamp: string;
  orientations: Record<string, Orientation>;
}

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  jsonData: ReportData | null;
  username: string | null;
}

export default function ReportDialog({ open, onClose, jsonData, username }: ReportDialogProps) {
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
    const textWidth = pdf.getTextWidth("Relatorio do Usuario");
    pdf.text("Relatório do Usuário", (pageWidth - textWidth) / 2, 15);

    pdf.addImage(imgData, "PNG", 10, 25, imgWidth, imgHeight);
    pdf.save("relatorio.pdf");

    setLoading(false);
  };

  const getMarkerColor = (value: number) => {
    if (value >= 0 && value < 20) return "green"; 
    if (value >= 20 && value <= 30) return "yellow";
    return "red"; 
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
                Nome: {username ? username : "Usuário não identificado"}
              </Typography>

              {Object.entries(jsonData.orientations || {}).map(([key, orientation], index) => (
                <Box key={index} sx={{ mt: 2, mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="h6">Grupo de Usuário: <strong>{key}</strong></Typography>
                    <Box
                      sx={{
                        width: "100px",
                        height: "25px",
                        backgroundColor: getMarkerColor(orientation.value),
                        marginLeft: "10px",
                        borderRadius: "5px"
                      }}
                    />
                  </Box>
                  {orientation.questions.map((question, questionIndex) => (
                    <Card key={questionIndex} variant="outlined" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 2, marginBlock: 2 }}>
                      <FormControl component="fieldset">
                        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                          {question.text}
                        </Typography>
                        <RadioGroup value={question.answer}>
                          <FormControlLabel
                            value={question.answer}
                            control={<Radio sx={{ color: "#7E57C2" }} />}
                            label={question.answer}
                          />
                        </RadioGroup>
                      </FormControl>
                    </Card>
                  ))}
                  <Typography variant="body2" color="textSecondary">
                    Peso da Orientação: {orientation.value}
                  </Typography>
                  <Typography variant="h6">
                    Orientação: {orientation.questions[index].orientation}
                  </Typography>
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
