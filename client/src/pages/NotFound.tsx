import { Link } from "wouter";
import { Box, Button, Typography } from "@mui/material";
export default function NotFound() {
  return (
    <Box sx={{ textAlign: "center", py: 10 }}>
      <Typography color="primary" sx={{ fontSize: 72, fontWeight: 300 }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ mb: 2 }}>
        ページが見つかりません
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        リンクが変更されたか、ページが移動した可能性があります。
      </Typography>
      <Button variant="contained" component={Link} href="/">
        時間割に戻る
      </Button>
    </Box>
  );
}
