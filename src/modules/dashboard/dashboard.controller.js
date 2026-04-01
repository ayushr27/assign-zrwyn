const { getDashboardInsights, getDashboardSummary } = require('./dashboard.service');

async function getSummaryController(req, res) {
  const summary = await getDashboardSummary(req.query);
  res.json({ data: summary });
}

async function getInsightsController(req, res) {
  const insights = await getDashboardInsights(req.query);
  res.json({ data: insights });
}

module.exports = {
  getSummaryController,
  getInsightsController,
};
