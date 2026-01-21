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
import { useSession } from "./SessionContext";

type UserJob = z.infer<typeof UserJobDto>;

export default function JobsPage() {
  const { api } = useSession();
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
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Background Jobs
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : !jobs || jobs.length === 0 ? (
        <Typography variant="body1">No jobs found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Updated At</TableCell>
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
                      label={job.isComplete ? "Yes" : "No"}
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
