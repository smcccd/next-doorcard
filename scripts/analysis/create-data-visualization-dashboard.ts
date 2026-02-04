#!/usr/bin/env npx tsx

import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

interface DataVisualization {
  title: string;
  data: any[];
  chartType: "bar" | "pie" | "line" | "table";
  description: string;
}

async function createDataVisualizationDashboard() {
  console.log("📊 Creating Data Visualization Dashboard...\n");

  const visualizations: DataVisualization[] = [];

  // 1. Faculty with Data Quality Issues
  const facultyIssues = await prisma.$queryRaw`
    SELECT 
      u.name as faculty_name,
      u.username,
      d.college,
      COUNT(a.id) as total_appointments,
      COUNT(CASE WHEN a.location IS NULL OR a.location = '' THEN 1 END) as missing_locations,
      d.doorcardName
    FROM "User" u
    JOIN "Doorcard" d ON u.id = d.userId
    LEFT JOIN "Appointment" a ON d.id = a.doorcardId
    WHERE d.isActive = true AND d.term = 'FALL' AND d.year = 2025
    GROUP BY u.id, u.name, u.username, d.college, d.doorcardName
    HAVING COUNT(a.id) > 0
    ORDER BY COUNT(a.id) DESC
    LIMIT 20
  `;

  visualizations.push({
    title: "Top 20 Faculty by Appointment Count",
    data: facultyIssues as any[],
    chartType: "bar",
    description:
      "Faculty members with the highest number of appointments, showing potential for duplicates",
  });

  // 2. Appointments by Category
  const categoryStats = await prisma.$queryRaw`
    SELECT 
      a.category,
      COUNT(*) as count,
      COUNT(CASE WHEN a.location IS NULL OR a.location = '' THEN 1 END) as missing_locations
    FROM "Appointment" a
    JOIN "Doorcard" d ON a.doorcardId = d.id
    WHERE d.isActive = true AND d.term = 'FALL' AND d.year = 2025
    GROUP BY a.category
    ORDER BY count DESC
  `;

  visualizations.push({
    title: "Appointments by Category",
    data: categoryStats as any[],
    chartType: "pie",
    description: "Distribution of appointment types across all active faculty",
  });

  // 3. Issues by College
  const collegeIssues = await prisma.$queryRaw`
    SELECT 
      d.college,
      COUNT(DISTINCT d.id) as total_doorcards,
      COUNT(a.id) as total_appointments,
      COUNT(CASE WHEN a.location IS NULL OR a.location = '' THEN 1 END) as missing_locations,
      ROUND(
        COUNT(CASE WHEN a.location IS NULL OR a.location = '' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(a.id), 0), 2
      ) as missing_location_percentage
    FROM "Doorcard" d
    LEFT JOIN "Appointment" a ON d.id = a.doorcardId
    WHERE d.isActive = true AND d.term = 'FALL' AND d.year = 2025
    GROUP BY d.college
    ORDER BY d.college
  `;

  visualizations.push({
    title: "Data Quality Issues by College",
    data: collegeIssues as any[],
    chartType: "table",
    description: "Comparison of data quality metrics across the three colleges",
  });

  // 4. Time Distribution Analysis
  const timeDistribution = await prisma.$queryRaw`
    SELECT 
      a.startTime,
      COUNT(*) as appointment_count,
      COUNT(DISTINCT a.doorcardId) as faculty_count
    FROM "Appointment" a
    JOIN "Doorcard" d ON a.doorcardId = d.id
    WHERE d.isActive = true AND d.term = 'FALL' AND d.year = 2025
    GROUP BY a.startTime
    HAVING COUNT(*) > 5
    ORDER BY a.startTime
  `;

  visualizations.push({
    title: "Popular Time Slots",
    data: timeDistribution as any[],
    chartType: "bar",
    description:
      "Most common appointment start times - may indicate duplicates if too concentrated",
  });

  // 5. Specific Problem Cases
  const problemCases = await prisma.$queryRaw`
    WITH appointment_groups AS (
      SELECT 
        a.doorcardId,
        a.dayOfWeek,
        a.startTime,
        a.endTime,
        a.category,
        a.location,
        COUNT(*) as duplicate_count
      FROM "Appointment" a
      JOIN "Doorcard" d ON a.doorcardId = d.id
      WHERE d.isActive = true AND d.term = 'FALL' AND d.year = 2025
      GROUP BY a.doorcardId, a.dayOfWeek, a.startTime, a.endTime, a.category, a.location
      HAVING COUNT(*) > 1
    )
    SELECT 
      u.name as faculty_name,
      u.username,
      ag.dayOfWeek,
      ag.startTime,
      ag.endTime,
      ag.category,
      ag.location,
      ag.duplicate_count
    FROM appointment_groups ag
    JOIN "Doorcard" d ON ag.doorcardId = d.id
    JOIN "User" u ON d.userId = u.id
    ORDER BY ag.duplicate_count DESC, u.name
    LIMIT 50
  `;

  visualizations.push({
    title: "Duplicate Appointment Records",
    data: problemCases as any[],
    chartType: "table",
    description: "Exact duplicate appointments that need to be consolidated",
  });

  // Generate HTML Dashboard
  const html = generateHTMLDashboard(visualizations);

  // Save dashboard
  const dashboardPath =
    "/Users/besnyib/next-doorcard/data-quality-dashboard.html";
  fs.writeFileSync(dashboardPath, html);

  console.log(`📊 Interactive dashboard saved to: ${dashboardPath}`);
  console.log("🌐 Open this file in a web browser to explore the data");

  // Also generate a summary report
  const summary = generateSummaryReport(visualizations);
  const summaryPath = "/Users/besnyib/next-doorcard/DATA_QUALITY_SUMMARY.md";
  fs.writeFileSync(summaryPath, summary);

  console.log(`📋 Summary report saved to: ${summaryPath}`);

  return { dashboardPath, summaryPath, visualizations };
}

function generateHTMLDashboard(visualizations: DataVisualization[]): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Doorcard Data Quality Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5;
        }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { 
            background: white; 
            padding: 30px; 
            border-radius: 12px; 
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header h1 { margin: 0; color: #2563eb; font-size: 2.5rem; }
        .header p { margin: 10px 0 0 0; color: #64748b; font-size: 1.1rem; }
        .visualization { 
            background: white; 
            padding: 30px; 
            margin-bottom: 30px; 
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .visualization h2 { margin-top: 0; color: #334155; font-size: 1.5rem; }
        .visualization p { color: #64748b; margin-bottom: 20px; }
        .chart-container { position: relative; height: 400px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background-color: #f8fafc; font-weight: 600; color: #374151; }
        tr:hover { background-color: #f8fafc; }
        .metric { 
            display: inline-block; 
            background: #dbeafe; 
            padding: 8px 16px; 
            border-radius: 6px; 
            margin-right: 10px;
            color: #1d4ed8;
            font-weight: 500;
        }
        .timestamp { 
            text-align: center; 
            color: #94a3b8; 
            margin-top: 40px; 
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>📊 Doorcard Data Quality Dashboard</h1>
            <p>Interactive analysis of legacy data import issues and quality metrics</p>
            <div style="margin-top: 20px;">
                <span class="metric">Fall 2025 Term</span>
                <span class="metric">Active Faculty Only</span>
                <span class="metric">Generated ${new Date().toLocaleString()}</span>
            </div>
        </div>
        
        ${visualizations.map((viz, index) => generateVisualizationHTML(viz, index)).join("")}
        
        <div class="timestamp">
            Dashboard generated on ${new Date().toLocaleString()} | 
            Data reflects current state of doorcard database
        </div>
    </div>
    
    <script>
        // Initialize all charts
        ${visualizations.map((viz, index) => generateChartJS(viz, index)).join("\n        ")}
    </script>
</body>
</html>`;
}

function generateVisualizationHTML(
  viz: DataVisualization,
  index: number
): string {
  if (viz.chartType === "table") {
    const data = viz.data as any[];
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);

    return `
        <div class="visualization">
            <h2>${viz.title}</h2>
            <p>${viz.description}</p>
            <table>
                <thead>
                    <tr>${headers.map((h) => `<th>${h.replace(/_/g, " ").toUpperCase()}</th>`).join("")}</tr>
                </thead>
                <tbody>
                    ${data
                      .slice(0, 20)
                      .map(
                        (row) =>
                          `<tr>${headers.map((h) => `<td>${row[h] || ""}</td>`).join("")}</tr>`
                      )
                      .join("")}
                </tbody>
            </table>
            ${data.length > 20 ? `<p style="color: #64748b; font-style: italic;">Showing first 20 of ${data.length} records</p>` : ""}
        </div>
    `;
  } else {
    return `
        <div class="visualization">
            <h2>${viz.title}</h2>
            <p>${viz.description}</p>
            <div class="chart-container">
                <canvas id="chart${index}"></canvas>
            </div>
        </div>
    `;
  }
}

function generateChartJS(viz: DataVisualization, index: number): string {
  if (viz.chartType === "table") return "";

  const data = viz.data as any[];
  if (data.length === 0) return "";

  const keys = Object.keys(data[0]);
  const labelKey = keys[0];
  const dataKey = keys[1];

  const chartData = {
    labels: data.map((item) => String(item[labelKey])),
    datasets: [
      {
        label: dataKey.replace(/_/g, " ").toUpperCase(),
        data: data.map((item) => Number(item[dataKey]) || 0),
        backgroundColor:
          viz.chartType === "pie"
            ? data.map((_, i) => `hsl(${i * 137.508}deg, 70%, 60%)`)
            : "rgba(37, 99, 235, 0.8)",
        borderColor: "rgba(37, 99, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  return `
    new Chart(document.getElementById('chart${index}'), {
        type: '${viz.chartType}',
        data: ${JSON.stringify(chartData)},
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: ${viz.chartType === "pie"} },
                title: { display: false }
            },
            scales: ${
              viz.chartType === "pie"
                ? "{}"
                : `{
                y: { beginAtZero: true }
            }`
            }
        }
    });
  `;
}

function generateSummaryReport(visualizations: DataVisualization[]): string {
  const timestamp = new Date().toLocaleString();

  return `# Data Quality Dashboard Summary

**Generated**: ${timestamp}

## Key Findings

${visualizations
  .map((viz) => {
    const data = viz.data as any[];
    let summary = "";

    if (viz.title.includes("Faculty by Appointment")) {
      const topFaculty = data[0];
      summary = `- **Highest appointment count**: ${topFaculty?.faculty_name} (${topFaculty?.total_appointments} appointments)`;
    } else if (viz.title.includes("by Category")) {
      const topCategory = data[0];
      summary = `- **Most common appointment type**: ${topCategory?.category} (${topCategory?.count} appointments)`;
    } else if (viz.title.includes("by College")) {
      const totalAppointments = data.reduce(
        (sum: number, item: any) =>
          sum + parseInt(item.total_appointments || 0),
        0
      );
      summary = `- **Total appointments across all colleges**: ${totalAppointments}`;
    } else if (viz.title.includes("Duplicate")) {
      const totalDuplicates = data.reduce(
        (sum: number, item: any) => sum + parseInt(item.duplicate_count || 0),
        0
      );
      summary = `- **Total duplicate appointment records**: ${totalDuplicates}`;
    }

    return `### ${viz.title}
${viz.description}
${summary}
- Records analyzed: ${data.length}
`;
  })
  .join("\n")}

## Dashboard Usage

1. **Open data-quality-dashboard.html** in a web browser for interactive charts
2. **Use for meetings** to visually explain data issues to stakeholders
3. **Filter and explore** data to identify specific problem areas
4. **Export charts** by right-clicking and saving images

## Next Steps

1. Review the interactive dashboard for detailed breakdowns
2. Focus cleanup efforts on faculty with highest appointment counts
3. Address missing location data systematically by college
4. Implement duplicate detection rules for future imports

---
*This summary complements the interactive dashboard for quick reference*
`;
}

if (require.main === module) {
  createDataVisualizationDashboard()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
