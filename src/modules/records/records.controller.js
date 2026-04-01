const {
  createRecord,
  deleteRecord,
  getRecordById,
  listRecords,
  restoreRecord,
  updateRecord,
} = require('./records.service');

async function listRecordsController(req, res) {
  const result = await listRecords(req.query);
  res.json(result);
}

async function getRecordController(req, res) {
  const record = await getRecordById(req.params.id);
  res.json({ data: record });
}

async function createRecordController(req, res) {
  const record = await createRecord(req.body, req.user);
  res.status(201).json({ data: record });
}

async function updateRecordController(req, res) {
  const record = await updateRecord(req.params.id, req.body, req.user);
  res.json({ data: record });
}

async function deleteRecordController(req, res) {
  await deleteRecord(req.params.id, req.user);
  res.status(204).send();
}

async function restoreRecordController(req, res) {
  const record = await restoreRecord(req.params.id, req.user);
  res.json({ data: record });
}

module.exports = {
  listRecordsController,
  getRecordController,
  createRecordController,
  updateRecordController,
  deleteRecordController,
  restoreRecordController,
};
