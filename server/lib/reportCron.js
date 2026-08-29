export function startReportCron() {
  if (globalThis.__bhrReportCron) return;
  Promise.all([import("node-cron"), import("./reports.js")]).then(([cronMod, reports]) => {
    if (globalThis.__bhrReportCron) return;
    const cron = cronMod.default || cronMod;
    globalThis.__bhrReportCron = cron.schedule("* * * * *", () => {
      reports.tickScheduledReports().catch(() => {});
      import("./orderAlerts.js")
        .then((a) => a.tickPendingOrderAlerts())
        .catch(() => {});
      import("./backup.js")
        .then((b) => b.tickScheduledBackup())
        .catch(() => {});
    });
  });
}
