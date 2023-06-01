import express, { type RequestHandler } from 'express';
import { faker } from '@faker-js/faker';

type User = ReturnType<typeof createRandomUser>;
interface FilterType {
  filter: string;
  filterType: string;
  key: string;
  type: string;
}

const router = express.Router();

const connectedClients = new Map<number, any>();
const users: User[] = Array.from({ length: 100 }, createRandomUser);

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
  // Pull out params from query string, filters are what's leftover and
  // so we use the rest operator to capture them

  // enforce data types

  const startRow = Number(req.query.startRow);
  const endRow = Number(req.query.endRow);
  const {
    sortDir: _1,
    sortColumn: _2,
    startRow: _3,
    endRow: _4,
    ...remainingFilters
  } = req.query;

  const filters = remainingFilters as Record<string, string>;

  console.log({ filters });

  let usersData = [...users];

  if (filters) {
    usersData = usersData.filter((user) => {
      // Hard coding this to assume that the query is for emails containing something
      // Still using query supplied data though

      console.log({ user, filters });

      const filterKeys = Object.keys(filters);
      const firstFilterKey = filterKeys[0];
      //@ts-ignore
      const firstFilter: FilterType = JSON.parse(filters[firstFilterKey]);

      if (firstFilter.filterType === 'text') {
        //@ts-ignore
        console.log({ firstFilter, emailField: user[firstFilterKey] });
        //@ts-ignore
        return user[firstFilterKey].toString().includes(firstFilter.filter);
      }
      // //@ts-ignore
      // if (user[key] === undefined) {
      //   console.log(`user[${key}] is undefined`, user);

      //   return true;
      // }

      // const filter: FilterType = JSON.parse(filters[key]!);

      // //@ts-ignore
      // const fieldToFilter = user[key];

      // console.log({ filter: filter.filter, fieldToFilter });

      // if (filter.filterType === 'text') {
      //   return fieldToFilter.toString().includes(filter.filter);
      // }
      return true;
    });
  }

  if (req.query.sortDir && req.query.sortColumn) {
    const sortDir = req.query.sortDir.toString();
    const sortColumn = req.query.sortColumn.toString();

    usersData = usersData.sort((a, b) => {
      if (sortDir === 'asc') {
        //@ts-ignore
        return a[sortColumn] > b[sortColumn] ? 1 : -1;
      } else {
        //@ts-ignore
        return a[sortColumn] < b[sortColumn] ? 1 : -1;
      }
    });
  }

  usersData = usersData.slice(Number(startRow), Number(endRow));

  // console.log('usersData', usersData);

  // console.log(startRow, endRow, sortDir, sortColumn, filters);

  res.json(usersData);
};

const createUser: RequestHandler = (req, res) => {
  const newUser = createRandomUser();
  users.push(newUser);
  res.json(newUser);
};

const deleteUser: RequestHandler = (req, res) => {
  const randomIndex = Math.floor(Math.random() * users.length);
  const user = users[randomIndex];
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  users.splice(randomIndex, 1);
  res.json({ message: 'User deleted' });
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
router.delete('/users/deleteRandom', deleteUser);

export const userRouter = router;
