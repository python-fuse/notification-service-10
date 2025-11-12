export class MockUserService {
  async getUserById(userId: string) {
    // Return mock data for testing
    return {
      success: true,
      message: 'user data retrieved',
      data: {
        user_id: userId,
        email: 'test@example.com',
        push_token: 'fcm_token_mock',
        preferences: {
          email_enabled: true,
          push_enabled: true,
        },
      },
      error: null,
      meta: null,
    };
  }
}

export class MockTemplateService {
  async getTemplate(templateCode: string) {
    // Return mock data for testing
    return {
      success: true,
      message: 'template retrieved',
      data: {
        template_code: templateCode,
        subject: 'Test Subject',
        template_body: 'Hello {{name}}, this is a test: {{message}}',
        variables: ['name', 'message'],
        version: 1,
      },
      error: null,
      meta: null,
    };
  }
}
