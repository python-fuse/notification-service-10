
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { CreateUserDto } from '../src/users/dto/create-user.dto';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await databaseService.user.deleteMany({});
  });

  describe('/users (POST)', () => {
    it('should create a user and return it', async () => {
      const createUserDto: CreateUserDto = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      console.log('POST /users response:', response.body);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toEqual(createUserDto.email);
    });
  });

  describe('/users (GET)', () => {
    it('should return an array of users', async () => {
      await databaseService.user.create({
        data: {
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane.doe@example.com',
          password: 'password123',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      console.log('GET /users response:', response.body);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].email).toBe('jane.doe@example.com');
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return a single user', async () => {
      const user = await databaseService.user.create({
        data: {
          first_name: 'Jim',
          last_name: 'Beam',
          email: 'jim.beam@example.com',
          password: 'password123',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .expect(200);

      console.log('GET /users/:id response:', response.body);
      expect(response.body.data).toHaveProperty('user_id', user.id);
      expect(response.body.data.email).toBe(user.email);
    });

    it('should return 404 if user does not exist', async () => {
      const nonExistentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const response = await request(app.getHttpServer())
        .get(`/users/${nonExistentId}`)
        .expect(404);

      console.log('GET /users/:id (non-existent) response:', response.body);
      expect(response.body.message).toBe(`User with ID ${nonExistentId} not found`);
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should update a user', async () => {
      const user = await databaseService.user.create({
        data: {
          first_name: 'Jack',
          last_name: 'Daniels',
          email: 'jack.daniels@example.com',
          password: 'password123',
        },
      });

      const updates = { last_name: 'Sparrow' };

      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .send(updates)
        .expect(200);

      console.log('PATCH /users/:id response:', response.body);
      expect(response.body.last_name).toBe('Sparrow');
    });

    it('should return 404 if user does not exist', async () => {
      const nonExistentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const updates = { last_name: 'Sparrow' };
      const response = await request(app.getHttpServer())
        .patch(`/users/${nonExistentId}`)
        .send(updates)
        .expect(404);

      console.log('PATCH /users/:id (non-existent) response:', response.body);
      expect(response.body.message).toBe(`User with ID ${nonExistentId} not found`);
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should delete a user', async () => {
      const user = await databaseService.user.create({
        data: {
          first_name: 'Johnny',
          last_name: 'Walker',
          email: 'johnny.walker@example.com',
          password: 'password123',
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/users/${user.id}`)
        .expect(200);
      
      console.log('DELETE /users/:id response:', response.body);
      expect(response.body).toHaveProperty('id', user.id);

      const findDeleted = await databaseService.user.findUnique({ where: { id: user.id } });
      expect(findDeleted).toBeNull();
    });

    it('should return 404 if user does not exist', async () => {
      const nonExistentId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
      const response = await request(app.getHttpServer())
        .delete(`/users/${nonExistentId}`)
        .expect(404);

      console.log('DELETE /users/:id (non-existent) response:', response.body);
      expect(response.body.message).toBe(`User with ID ${nonExistentId} not found`);
    });
  });
});
