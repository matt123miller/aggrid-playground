import express, { type RequestHandler } from 'express';
import { faker } from '@faker-js/faker';

type User = ReturnType<typeof createRandomUser>;

const router = express.Router();

const connectedClients = new Map<number, any>();
const users: User[] = [createRandomUser()];

function createRandomUser() {
  return {
    userId: faker.string.uuid(),
    username: faker.internet.userName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    password: faker.internet.password(),
    birthdate: faker.date.birthdate(),
    registeredAt: faker.date.past(),
  };
}

const getUsers: RequestHandler = (req, res) => {
  res.send(users);
};

const createUser: RequestHandler = (req, res) => {
  const newUser = createRandomUser();
  users.push(newUser);
  res.json(newUser);
};

const subscribeToUsers: RequestHandler = (req, res) => {
  console.log('hi');
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  };
  // sends a response to the caller letting them know that data will now be sent as a stream
  res.writeHead(200, headers);

  // Does that do anything client side yet?
  // Or is that only after doing res.send later?
  // res.write('')
  const id = Date.now();
  const newClient = {
    id,
    res,
  };
  connectedClients.set(id, newClient);

  // res.send(users);

  // When the client closes the connection we update the clients Map
  req.on('close', () => {
    connectedClients.delete(id);
  });
};

router.get('/users/subscribe', subscribeToUsers);
router.get('/users', getUsers);
router.post('/users', createUser);

export const userRouter = router;
