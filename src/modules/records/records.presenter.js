const { centsToAmount } = require('../../utils/amounts');

function toActor(id, name) {
  if (!id) {
    return null;
  }

  return {
    id,
    name,
  };
}

function toRecord(row) {
  return {
    id: row.id,
    amount: centsToAmount(row.amount_cents),
    type: row.type,
    category: row.category,
    occurredOn: row.occurred_on,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: toActor(row.created_by, row.created_by_name),
    updatedBy: toActor(row.updated_by, row.updated_by_name),
  };
}

module.exports = {
  toRecord,
};
