import { Box, Stack, Typography } from "@mui/material";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
export function Brand() {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: "12px",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          display: "grid",
          placeItems: "center",
        }}
      >
        <CalendarMonthRounded sx={{ fontSize: 25 }} />
      </Box>
      <Typography
        sx={{
          fontFamily: "Roboto, sans-serif",
          fontSize: 25,
          fontWeight: 400,
          letterSpacing: "-.7px",
        }}
      >
        Campass
      </Typography>
    </Stack>
  );
}
