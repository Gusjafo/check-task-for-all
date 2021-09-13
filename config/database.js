const mongoose = require("mongoose");

const MONGO_URI =
  `mongodb+srv://${process.env.USER}:${process.env.PSW}@sandbox.lafax.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority`;
  
exports.connect = () => {
  // Connecting to the database
  mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    })
    .then(() => {
      console.log("Successfully connected to database");
    })
    .catch((error) => {
      console.log("database connection failed. exiting now...");
      console.error(error);
      process.exit(1);
    });
};