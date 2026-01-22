import { useEffect, useState } from "react";
import {
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  Chip,
} from "@mui/material";
import { z } from "zod";
import { ApiEndpoint } from "@meepen/poe-accountant-api-schema/api/api-endpoints.enum";
import { UserJobDto } from "@meepen/poe-accountant-api-schema/api/user.job.dto";
import { useTranslation } from "react-i18next";
import { useSession } from "../components/SessionContext";

type UserJob = z.infer<typeof UserJobDto>;

export default function JobsPage() {
  const { api } = useSession();
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<UserJob[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchJobs() {
      try {
        const result = await api.request(ApiEndpoint.GetUserJobs);
        if (mounted) {
          setJobs(result);
        }
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void fetchJobs();

    return () => {
      mounted = false;
    };
  }, [api]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t("jobs_title")}
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : !jobs || jobs.length === 0 ? (
        <Typography variant="body1">{t("jobs_empty")}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("jobs_table_id")}</TableCell>
                <TableCell>{t("jobs_table_status")}</TableCell>
                <TableCell>{t("jobs_table_completed")}</TableCell>
                <TableCell>{t("jobs_table_created_at")}</TableCell>
                <TableCell>{t("jobs_table_updated_at")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {job.id}
                    </Typography>
                  </TableCell>
                  <TableCell>{job.statusText}</TableCell>
                  <TableCell>
                    <Chip
                      label={job.isComplete ? t("yes") : t("no")}
                      color={job.isComplete ? "success" : "warning"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(job.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {new Date(job.updatedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
