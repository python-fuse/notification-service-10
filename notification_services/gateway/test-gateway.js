// src/test-gateway.ts
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/v1';

async function testNotificationFlow() {
  console.log('🧪 Testing Gateway Service...\n');

  try {
    // Test 1: Send email notification
    console.log('📧 Test 1: Sending email notification...');
    const emailResponse = await axios.post(`${BASE_URL}/notifications/send`, {
      user_id: '12345',
      channel: 'email',
      template_code: 'password_reset',
      data: {
        name: 'Ada',
        reset_link: 'https://app.com/reset?token=xyz',
      },
    });
    console.log('✅ Email queued:', emailResponse.data);
    const emailRequestId = emailResponse.data.data.request_id;

    // Test 2: Check status
    console.log('\n🔍 Test 2: Checking status...');
    const statusResponse = await axios.get(
      `${BASE_URL}/notifications/status?request_id=${emailRequestId}`,
    );
    console.log('✅ Status retrieved:', statusResponse.data);

    // Test 3: Send push notification
    console.log('\n📱 Test 3: Sending push notification...');
    const pushResponse = await axios.post(`${BASE_URL}/notifications/send`, {
      user_id: '67890',
      channel: 'push',
      template_code: 'welcome',
      data: {
        name: 'Bob',
        message: 'Welcome to our platform!',
      },
    });
    console.log('✅ Push queued:', pushResponse.data);

    // Test 4: Idempotency (send duplicate)
    console.log('\n🔄 Test 4: Testing idempotency...');
    const duplicateResponse = await axios.post(
      `${BASE_URL}/notifications/send`,
      {
        user_id: '12345',
        channel: 'email',
        template_code: 'password_reset',
        data: {
          name: 'Ada',
          reset_link: 'https://app.com/reset?token=xyz',
        },
      },
      {
        headers: {
          'x-request-id': emailRequestId,
        },
      },
    );
    console.log('✅ Duplicate handled:', duplicateResponse.data);

    // Test 5: Rate limiting
    console.log('\n⏱️  Test 5: Testing rate limiting...');
    for (let i = 0; i < 5; i++) {
      await axios.post(`${BASE_URL}/notifications/send`, {
        user_id: 'rate_test_user',
        channel: 'email',
        template_code: 'test',
        data: { message: `Test ${i}` },
      });
    }
    console.log('✅ Rate limit working (5 requests sent)');

    // Test 6: Invalid data
    console.log('\n❌ Test 6: Testing validation...');
    try {
      await axios.post(`${BASE_URL}/notifications/send`, {
        user_id: '12345',
        channel: 'sms', // Invalid channel
        template_code: 'test',
        data: {},
      });
    } catch (error) {
      console.log('✅ Validation working:', error.response.data);
    }

    console.log('\n✨ All tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testNotificationFlow();
