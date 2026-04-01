const db = require('../../db/client');
const { centsToAmount } = require('../../utils/amounts');
const { toRecord } = require('../records/records.presenter');

function buildSummaryWhereClause(filters, alias = 'fr') {
  const clauses = [`${alias}.deleted_at IS NULL`];
  const params = [];

  if (filters.startDate) {
    clauses.push(`${alias}.occurred_on >= ?`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    clauses.push(`${alias}.occurred_on <= ?`);
    params.push(filters.endDate);
  }

  return {
    whereClause: `WHERE ${clauses.join(' AND ')}`,
    params,
  };
}

async function getDashboardSummary(filters) {
  const { whereClause, params } = buildSummaryWhereClause(filters);
  const totalsRow = await db.get(
    `
      SELECT
        COALESCE(SUM(CASE WHEN fr.type = 'income' THEN fr.amount_cents ELSE 0 END), 0) AS income_cents,
        COALESCE(SUM(CASE WHEN fr.type = 'expense' THEN fr.amount_cents ELSE 0 END), 0) AS expense_cents,
        COUNT(fr.id) AS record_count
      FROM financial_records fr
      ${whereClause}
    `,
    params
  );

  const trendBucketExpression = db.getDateBucketExpression(filters.granularity, 'fr.occurred_on');

  const breakdownRows = await db.all(
    `
      SELECT
        fr.category,
        fr.type,
        COALESCE(SUM(fr.amount_cents), 0) AS total_cents
      FROM financial_records fr
      ${whereClause}
      GROUP BY fr.category, fr.type
      ORDER BY total_cents DESC, fr.category ASC
    `,
    params
  );

  const trendRows = await db.all(
    `
      SELECT
        ${trendBucketExpression} AS bucket,
        COALESCE(SUM(CASE WHEN fr.type = 'income' THEN fr.amount_cents ELSE 0 END), 0) AS income_cents,
        COALESCE(SUM(CASE WHEN fr.type = 'expense' THEN fr.amount_cents ELSE 0 END), 0) AS expense_cents
      FROM financial_records fr
      ${whereClause}
      GROUP BY bucket
      ORDER BY bucket ASC
    `,
    params
  );

  const recentActivityRows = await db.all(
    `
      SELECT
        fr.id,
        fr.amount_cents,
        fr.type,
        fr.category,
        fr.occurred_on,
        fr.notes,
        fr.created_at,
        fr.updated_at,
        fr.created_by,
        fr.updated_by,
        creator.name AS created_by_name,
        updater.name AS updated_by_name
      FROM financial_records fr
      LEFT JOIN users creator ON creator.id = fr.created_by
      LEFT JOIN users updater ON updater.id = fr.updated_by
      ${whereClause}
      ORDER BY fr.updated_at DESC
      LIMIT ?
    `,
    [...params, filters.limitRecent]
  );

  const income = centsToAmount(totalsRow.income_cents);
  const expenses = centsToAmount(totalsRow.expense_cents);

  return {
    generatedAt: new Date().toISOString(),
    range: {
      startDate: filters.startDate || null,
      endDate: filters.endDate || null,
      granularity: filters.granularity,
    },
    totals: {
      income,
      expenses,
      netBalance: Number((income - expenses).toFixed(2)),
      recordCount: Number(totalsRow.record_count),
    },
    categoryBreakdown: breakdownRows.map((row) => ({
      category: row.category,
      type: row.type,
      totalAmount: centsToAmount(row.total_cents),
    })),
    trend: trendRows.map((row) => {
      const trendIncome = centsToAmount(row.income_cents);
      const trendExpenses = centsToAmount(row.expense_cents);

      return {
        bucket: row.bucket,
        income: trendIncome,
        expenses: trendExpenses,
        netBalance: Number((trendIncome - trendExpenses).toFixed(2)),
      };
    }),
    recentActivity: recentActivityRows.map(toRecord),
  };
}

async function getDashboardInsights(filters) {
  const { whereClause, params } = buildSummaryWhereClause(filters);
  const trendBucketExpression = db.getDateBucketExpression(filters.granularity, 'fr.occurred_on');

  const metricsRow = await db.get(
    `
      SELECT
        COUNT(CASE WHEN fr.type = 'income' THEN 1 END) AS income_count,
        COUNT(CASE WHEN fr.type = 'expense' THEN 1 END) AS expense_count,
        COALESCE(SUM(CASE WHEN fr.type = 'income' THEN fr.amount_cents ELSE 0 END), 0) AS income_cents,
        COALESCE(SUM(CASE WHEN fr.type = 'expense' THEN fr.amount_cents ELSE 0 END), 0) AS expense_cents,
        COALESCE(AVG(CASE WHEN fr.type = 'income' THEN fr.amount_cents END), 0) AS avg_income_cents,
        COALESCE(AVG(CASE WHEN fr.type = 'expense' THEN fr.amount_cents END), 0) AS avg_expense_cents,
        COALESCE(MAX(CASE WHEN fr.type = 'income' THEN fr.amount_cents END), 0) AS largest_income_cents,
        COALESCE(MAX(CASE WHEN fr.type = 'expense' THEN fr.amount_cents END), 0) AS largest_expense_cents
      FROM financial_records fr
      ${whereClause}
    `,
    params
  );

  const topExpenseCategories = await db.all(
    `
      SELECT fr.category, COALESCE(SUM(fr.amount_cents), 0) AS total_cents
      FROM financial_records fr
      ${whereClause} AND fr.type = 'expense'
      GROUP BY fr.category
      ORDER BY total_cents DESC, fr.category ASC
      LIMIT ?
    `,
    [...params, filters.categoryLimit]
  );

  const topIncomeCategories = await db.all(
    `
      SELECT fr.category, COALESCE(SUM(fr.amount_cents), 0) AS total_cents
      FROM financial_records fr
      ${whereClause} AND fr.type = 'income'
      GROUP BY fr.category
      ORDER BY total_cents DESC, fr.category ASC
      LIMIT ?
    `,
    [...params, filters.categoryLimit]
  );

  const periodPerformanceRows = await db.all(
    `
      SELECT
        ${trendBucketExpression} AS bucket,
        COALESCE(SUM(CASE WHEN fr.type = 'income' THEN fr.amount_cents ELSE 0 END), 0) AS income_cents,
        COALESCE(SUM(CASE WHEN fr.type = 'expense' THEN fr.amount_cents ELSE 0 END), 0) AS expense_cents
      FROM financial_records fr
      ${whereClause}
      GROUP BY bucket
      ORDER BY bucket ASC
    `,
    params
  );

  const periodPerformance = periodPerformanceRows.map((row) => {
    const income = centsToAmount(row.income_cents);
    const expenses = centsToAmount(row.expense_cents);

    return {
      bucket: row.bucket,
      income,
      expenses,
      netBalance: Number((income - expenses).toFixed(2)),
    };
  });

  const income = centsToAmount(metricsRow.income_cents);
  const expenses = centsToAmount(metricsRow.expense_cents);
  const savingsRate = income === 0 ? 0 : Number((((income - expenses) / income) * 100).toFixed(2));
  const expenseRatio = income === 0 ? 0 : Number(((expenses / income) * 100).toFixed(2));
  const sortedByNet = [...periodPerformance].sort((left, right) => left.netBalance - right.netBalance);

  return {
    generatedAt: new Date().toISOString(),
    range: {
      startDate: filters.startDate || null,
      endDate: filters.endDate || null,
      granularity: filters.granularity,
    },
    metrics: {
      incomeRecordCount: Number(metricsRow.income_count),
      expenseRecordCount: Number(metricsRow.expense_count),
      averageIncomeEntry: centsToAmount(metricsRow.avg_income_cents),
      averageExpenseEntry: centsToAmount(metricsRow.avg_expense_cents),
      largestIncome: centsToAmount(metricsRow.largest_income_cents),
      largestExpense: centsToAmount(metricsRow.largest_expense_cents),
      savingsRate,
      expenseRatio,
    },
    topCategories: {
      expenses: topExpenseCategories.map((row) => ({
        category: row.category,
        totalAmount: centsToAmount(row.total_cents),
      })),
      income: topIncomeCategories.map((row) => ({
        category: row.category,
        totalAmount: centsToAmount(row.total_cents),
      })),
    },
    bestPeriod: sortedByNet.length > 0 ? sortedByNet[sortedByNet.length - 1] : null,
    worstPeriod: sortedByNet.length > 0 ? sortedByNet[0] : null,
  };
}

module.exports = {
  getDashboardSummary,
  getDashboardInsights,
};
