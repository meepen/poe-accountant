import { useEffect, useState } from "react";
import { Fragment } from "react";
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
  Button,
  Collapse,
} from "@mui/material";
import { ApiEndpoint } from "@meepen/poe-accountant-api-schema/api/api-endpoints.enum";
import type { ApiResponse } from "@meepen/poe-accountant-api-schema/api/api-request-data.dto";
import { useTranslation } from "react-i18next";
import { useApi } from "../components/session-hooks";

type UserJobId = ApiResponse<ApiEndpoint.GetUserJobs>[number];

export default function JobsPage() {
  const api = useApi();
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<UserJobId[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(
    () => new Set(),
  );
  const [jobData, setJobData] = useState<Record<string, unknown>>({});
  const [jobDataLoading, setJobDataLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [jobDataError, setJobDataError] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;

    async function fetchJobs() {
      try {
        const result = await api.request(ApiEndpoint.GetUserJobs);
        const normalized = result.filter(
          (jobId): jobId is string =>
            typeof jobId === "string" && jobId.length > 0,
        );
        if (mounted) {
          setJobs(normalized);
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

  const toggleJobExpanded = async (jobId: string) => {
    const nextExpanded = new Set(expandedJobs);
    const isExpanded = nextExpanded.has(jobId);

    if (isExpanded) {
      nextExpanded.delete(jobId);
      setExpandedJobs(nextExpanded);
      return;
    }

    nextExpanded.add(jobId);
    setExpandedJobs(nextExpanded);

    if (jobData[jobId] !== undefined || jobDataLoading[jobId]) {
      return;
    }

    setJobDataLoading((previous) => ({ ...previous, [jobId]: true }));
    setJobDataError((previous) => ({ ...previous, [jobId]: "" }));

    try {
      const result = await api.request(ApiEndpoint.GetUserJobResult, { jobId });
      setJobData((previous) => ({ ...previous, [jobId]: result }));
    } catch (error) {
      console.error(`Failed to fetch job result for ${jobId}:`, error);
      setJobDataError((previous) => ({
        ...previous,
        [jobId]: t("jobs_error_loading_job_data"),
      }));
    } finally {
      setJobDataLoading((previous) => ({ ...previous, [jobId]: false }));
    }
  };

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
                <TableCell align="right">{t("jobs_table_status")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((jobId) => (
                <Fragment key={jobId}>
                  <TableRow key={jobId}>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace" }}
                      >
                        {jobId}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        onClick={() => {
                          void toggleJobExpanded(jobId);
                        }}
                      >
                        {expandedJobs.has(jobId)
                          ? t("jobs_hide_data")
                          : t("jobs_show_data")}
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2} sx={{ p: 0, borderBottom: 0 }}>
                      <Collapse
                        in={expandedJobs.has(jobId)}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box sx={{ p: 2 }}>
                          {jobDataLoading[jobId] ? (
                            <Typography variant="body2">
                              {t("jobs_loading_job_data")}
                            </Typography>
                          ) : jobDataError[jobId] ? (
                            <Typography variant="body2" color="error">
                              {jobDataError[jobId]}
                            </Typography>
                          ) : (
                            <Box
                              component="pre"
                              sx={{
                                m: 0,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                fontSize: "0.75rem",
                                fontFamily: "monospace",
                              }}
                            >
                              {JSON.stringify(jobData[jobId] ?? null, null, 2)}
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
