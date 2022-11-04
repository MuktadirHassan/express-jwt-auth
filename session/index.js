const { MongoClient, ServerApiVersion } = require("mongodb");
const auth = require("./middleware/auth");
const express = require("express");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
/**
 * API
 * route
 *  /users (paginated)
 *  /user/create
 *  /login
 *  /register
 *  /users (protected)
 */
const uri = process.env.DB_URL;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

client.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    // Our database is connected successfully
    const db = client.db("test");
    const usersCollection = db.collection("users");
    // ROUTES
    app.get("/users", auth, async (req, res) => {
      const userCollection = db.collection("users");
      const users = await userCollection.find().toArray();

      res.send({
        status: "success",
        data: users,
      });
    });

    app.get("/p-users", async (req, res) => {
      // [1, 2, 3, 4, 5, 6] => 1 - 3, 4 - 6

      const limit = Number(req.query.limit) || 10;

      // 2 -1 = 1 * 10 => 10
      // 3 -1 = 2 * 10 => 20
      const page = Number(req.query.page) - 1 || 0;

      console.log(req.query);
      // limit
      // 1 - 10, 11 - 20

      const users = await usersCollection
        .find({})
        .limit(limit)
        .skip(page * limit)
        .toArray();

      const count = await usersCollection.estimatedDocumentCount();

      res.send({
        status: "success",
        data: users,
        count: count,
      });
    });

    app.post("/user/create", auth, async (req, res) => {
      const user = await db.collection("users").insertOne({
        name: "John Doe",
        email: "tamim@gmail.com",
        password: "123456",
      });

      res.send({
        status: "success",
        data: user,
      });
    });

    // registration
    app.post("/register", async (req, res) => {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.send({
          status: "error",
          message: "Please provide all the vaules",
        });
      }

      const usersCollection = db.collection("users");

      const user = await usersCollection.insertOne({
        name,
        email,
        password,
      });

      res.send({
        status: "success",
        data: user,
      });
    });

    // login
    app.post("/login", async (req, res) => {
      const { email, password } = req.body;

      console.log(email, password);
      if (!email || !password) {
        return res.send({
          status: "error",
          message: "Please provide all the values",
        });
      }

      const usersCollection = db.collection("users");
      const user = await usersCollection.findOne({
        email: email,
      });

      if (!user) {
        return res.send({
          status: "error",
          message: "User does not exist",
        });
      }

      const isPasswordCorrectUser = await usersCollection.findOne({
        email: email,
        password: password,
      });

      // This part will be skipped if user is found.
      if (!isPasswordCorrectUser) {
        return res.send({
          status: "error",
          message: "Invalid credentials",
        });
      }

      /**
       * 1. validate body
       * 2. find the user
       * 3. if user not found, send invalid error response
       * 4. user found
       * 5. create token
       * 6. send response
       */

      const tokenObj = {
        email: isPasswordCorrectUser.email,
        id: isPasswordCorrectUser._id,
      };

      const token = jwt.sign(tokenObj, process.env.JWT_SECRET);

      res.send({
        status: "success",
        data: tokenObj,
        token: token,
      });
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  client.connect((err) => {
    // Important to check for errors
    if (err) {
      console.log(err);
    } else {
      console.log("Connected to MongoDB");
    }
  });
  console.log("Server is running on " + process.env.PORT);
});
