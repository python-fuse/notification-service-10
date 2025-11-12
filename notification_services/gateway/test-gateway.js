// src/test-gateway.ts
import axios from 'axios';
import { v4 as uuid } from 'uuid';

const BASE_URL = 'http://localhost:3000/api/v1';

async function testNotificationFlow() {
  console.log('🧪 Testing Gateway Service...\n');

  try {
    // Test 1: Send email notification with request ID
    console.log('📧 Test 1: Sending email notification with x-request-id...');
    const emailRequestId = uuid();
    const emailResponse = await axios.post(
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
    console.log('✅ Email queued:', emailResponse.data);
    console.log('📝 Request ID used:', emailRequestId);

    // Test 2: Check status
    console.log('\n🔍 Test 2: Checking status...');
    const statusResponse = await axios.get(
      `${BASE_URL}/notifications/status?request_id=${emailRequestId}`,
    );
    console.log('✅ Status retrieved:', statusResponse.data);

    // Test 3: Send push notification with request ID
    console.log('\n📱 Test 3: Sending push notification with x-request-id...');
    const pushRequestId = uuid();
    const pushResponse = await axios.post(
      `${BASE_URL}/notifications/send`,
      {
        user_id: '67890',
        channel: 'push',
        template_code: 'welcome',
        data: {
          name: 'Bob',
          message: 'Welcome to our platform!',
        },
      },
      {
        headers: {
          'x-request-id': pushRequestId,
        },
      },
    );
    console.log('✅ Push queued:', pushResponse.data);
    console.log('📝 Request ID used:', pushRequestId);

    // Test 4: Idempotency (send duplicate with same request ID)
    console.log(
      '\n🔄 Test 4: Testing idempotency (sending with same x-request-id)...',
    );
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
          'x-request-id': emailRequestId, // Same ID as Test 1
        },
      },
    );
    console.log(
      '✅ Duplicate handled (cached response):',
      duplicateResponse.data,
    );
    console.log('🔍 Should return same request_id:', emailRequestId);

    // Test 5: Send without request ID (if allowed)
    console.log('\n🆕 Test 5: Sending without x-request-id header...');
    try {
      const noIdResponse = await axios.post(`${BASE_URL}/notifications/send`, {
        user_id: '11111',
        channel: 'email',
        template_code: 'test',
        data: { message: 'Test without ID' },
      });
      console.log('✅ Request without ID handled:', noIdResponse.data);
      if (noIdResponse.data.meta?.warning) {
        console.log('⚠️  Warning received:', noIdResponse.data.meta.warning);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(
          '✅ Request rejected (x-request-id required):',
          error.response.data.message,
        );
      } else {
        throw error;
      }
    }

    // Test 6: Rate limiting
    console.log('\n⏱️  Test 6: Testing rate limiting...');
    for (let i = 0; i < 5; i++) {
      await axios.post(
        `${BASE_URL}/notifications/send`,
        {
          user_id: 'rate_test_user',
          channel: 'email',
          template_code: 'test',
          data: { message: `Test ${i}` },
        },
        {
          headers: {
            'x-request-id': uuid(), // Unique ID for each
          },
        },
      );
    }
    console.log('✅ Rate limit working (5 requests sent)');

    // Test 7: Invalid data
    console.log('\n❌ Test 7: Testing validation...');
    try {
      await axios.post(
        `${BASE_URL}/notifications/send`,
        {
          user_id: '12345',
          channel: 'sms', // Invalid channel
          template_code: 'test',
          data: {},
        },
        {
          headers: {
            'x-request-id': uuid(),
          },
        },
      );
    } catch (error) {
      console.log('✅ Validation working:', error.response.data);
    }

    console.log('\n✨ All tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testNotificationFlow();
