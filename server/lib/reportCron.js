export function startReportCron() {
  if (globalThis.__bhrReportCron) return;
  Promise.all([import("node-cron"), import("./scheduler.js")]).then(([cronMod, scheduler]) => {
    if (globalThis.__bhrReportCron) return;
    const cron = cronMod.default || cronMod;
    globalThis.__bhrReportCron = cron.schedule("* * * * *", () => {
      scheduler.dispatchSchedulerTick("cron");
    });
  });
}
