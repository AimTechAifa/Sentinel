"use client";

import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { AlertTriangle, Calendar, CheckCircle2, Flag, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ReleaseStatusCounts = {
  planned: number;
  blocked: number;
  shipped: number;
  atRisk: number;
  inProgress: number;
};

type TileConfig = {
  key: keyof ReleaseStatusCounts;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
};

const TILES: TileConfig[] = [
  { key: "planned", label: "Planned", icon: Calendar, color: "#9155FD", bg: "rgba(145, 85, 253, 0.12)" },
  { key: "blocked", label: "Blocked", icon: AlertTriangle, color: "#FF4C51", bg: "rgba(255, 76, 81, 0.12)" },
  { key: "shipped", label: "Shipped", icon: CheckCircle2, color: "#56CA00", bg: "rgba(86, 202, 0, 0.12)" },
  { key: "atRisk", label: "At Risk", icon: Flag, color: "#FFB400", bg: "rgba(255, 180, 0, 0.14)" },
  { key: "inProgress", label: "In Progress", icon: Package, color: "#16B1FF", bg: "rgba(22, 177, 255, 0.12)" },
];

export function ReleaseStatusTiles({
  counts,
  heading,
}: {
  counts: ReleaseStatusCounts;
  heading: string;
}) {
  const theme = useTheme();

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }} color="text.primary">
        {heading}
      </Typography>
      <Grid container spacing={2.5} columns={{ xs: 12, sm: 12, md: 12, lg: 10 }}>
        {TILES.map(({ key, label, icon: Icon, color, bg }) => (
          <Grid key={key} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Box
              sx={{
                p: 2.5,
                height: "100%",
                borderRadius: 2,
                border: `1px solid ${alpha(color, 0.28)}`,
                bgcolor: theme.palette.mode === "dark" ? alpha(color, 0.08) : bg,
                boxShadow: theme.palette.mode === "dark" ? "0 2px 10px rgba(19,17,32,0.35)" : "0 2px 10px rgba(46,38,61,0.06)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(color, 0.16),
                    color,
                  }}
                >
                  <Icon size={20} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                  {label}
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color, lineHeight: 1.1 }}>
                {counts[key]}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
