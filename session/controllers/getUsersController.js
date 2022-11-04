async function getAllUsers(req, res) {
  const userCollection = db.collection("users");
  const users = await userCollection.find().toArray();

  res.send({
    status: "success",
    data: users,
  });
}

module.exports = {
  getAllUsers,
};
