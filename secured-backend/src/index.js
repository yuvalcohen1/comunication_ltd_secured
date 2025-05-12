const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const { PORT } = process.env;

app.use(express.json());
app.use(cors());

const usersRouter = require("./routes/users");
const customersRouter = require("./routes/customers");

app.use("/api/users", usersRouter);
app.use("/api/customers", customersRouter);

app.get("/", (req, res) => {
  res.send("API is running");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
