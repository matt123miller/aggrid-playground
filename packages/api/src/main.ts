/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import * as path from 'path';

import { version } from '../../../package.json';
import { userRouter } from './users';

const port = process.env.PORT || 3333;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/api/version', (req, res) => {
  res.send({ version });
});

app.get('/api/health', (req, res) => {
  res.send({ message: 'Health check' });
});

app.use('/api', userRouter);

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
