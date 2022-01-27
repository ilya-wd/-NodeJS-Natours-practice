const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION!!!! ShuTting Down');
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// options inside are to deal with deprecation warnings
// It is actually a promise. And then() gets an access to connection object
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {
    console.log('DB connection successful');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App is running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message, 'here');
  console.log('UHANDLED REJECTION!!!! ShuTting Down');
  // 0 for success 1 for uncaught exception
  server.close(() => {
    process.exit(1);
  });
});
