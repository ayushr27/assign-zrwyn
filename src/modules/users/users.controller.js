const {
  archiveUser,
  createUser,
  getUserById,
  listUsers,
  restoreUser,
  updateUser,
} = require('./users.service');

async function listUsersController(req, res) {
  const users = await listUsers(req.query);
  res.json(users);
}

async function getUserController(req, res) {
  const user = await getUserById(req.params.id);
  res.json({ data: user });
}

async function createUserController(req, res) {
  const user = await createUser(req.body);
  res.status(201).json({ data: user });
}

async function updateUserController(req, res) {
  const user = await updateUser(req.params.id, req.body, req.user);
  res.json({ data: user });
}

async function archiveUserController(req, res) {
  await archiveUser(req.params.id, req.user);
  res.status(204).send();
}

async function restoreUserController(req, res) {
  const user = await restoreUser(req.params.id, req.user);
  res.json({ data: user });
}

module.exports = {
  listUsersController,
  getUserController,
  createUserController,
  updateUserController,
  archiveUserController,
  restoreUserController,
};
