const { getAuthenticatedProfile, login } = require('./auth.service');

async function loginController(req, res) {
  const result = await login(req.body);
  res.json({ data: result });
}

async function meController(req, res) {
  const user = await getAuthenticatedProfile(req.user.id);
  res.json({ data: user });
}

module.exports = {
  loginController,
  meController,
};
