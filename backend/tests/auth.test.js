const request = require('supertest');
const { app } = require('../src/server');

describe('Authentication API', () => {
  let authToken;

  test('POST /api/auth/register - should register new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 	est${Date.now()}@example.com,
        phone: 98765${Math.floor(Math.random() * 100000)},
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
  });

  test('POST /api/auth/login - should login user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'citizen@test.com',
        password: 'admin123'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    authToken = res.body.token;
  });

  test('GET /api/auth/me - should get user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', Bearer ${authToken});
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
  });

  test('POST /api/auth/login - should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@test.com',
        password: 'wrongpassword'
      });
    
    expect(res.statusCode).toBe(401);
  });
});
