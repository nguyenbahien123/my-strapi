/**
 * Test script để debug Feedback API
 */

const BASE_URL = 'http://localhost:1337/api';

// Test data
const testFeedback = {
  Type: 'Issue',
  Title: 'Test Feedback Debug',
  Content: 'This is a test feedback for debugging',
  Resident: 1 // Thay bằng ID resident thực tế
};

// Helper function để tạo FormData
function createFormData(data, files = []) {
  const formData = new FormData();
  
  // Thêm data
  Object.keys(data).forEach(key => {
    formData.append(`data[${key}]`, data[key]);
  });
  
  // Thêm files
  files.forEach((file, index) => {
    formData.append('files.attachments', file);
  });
  
  return formData;
}

// Test tạo feedback với debug
async function testCreateFeedbackWithDebug() {
  try {
    console.log('=== TESTING CREATE FEEDBACK WITH DEBUG ===');
    console.log('Test data:', testFeedback);
    
    const formData = createFormData(testFeedback);
    
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
    
    const response = await fetch(`${BASE_URL}/feedbacks`, {
      method: 'POST',
      body: formData,
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const result = await response.json();
    console.log('Response body:', result);
    
    if (response.ok) {
      console.log('✅ Feedback created successfully!');
      console.log('Feedback ID:', result.data.id);
      console.log('Resident:', result.data.Resident);
      console.log('Attachments:', result.data.attachments);
      return result.data.id;
    } else {
      console.error('❌ Create feedback failed:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating feedback:', error);
    return null;
  }
}

// Test lấy feedback để kiểm tra
async function testGetFeedback(feedbackId) {
  try {
    console.log(`\n=== TESTING GET FEEDBACK ${feedbackId} ===`);
    
    const response = await fetch(`${BASE_URL}/feedbacks/${feedbackId}`);
    const result = await response.json();
    
    console.log('Get feedback result:', result);
    
    if (response.ok) {
      console.log('✅ Feedback retrieved successfully!');
      console.log('Resident:', result.data.Resident);
      console.log('Attachments:', result.data.attachments);
    } else {
      console.error('❌ Get feedback failed:', result);
    }
  } catch (error) {
    console.error('❌ Error getting feedback:', error);
  }
}

// Test lấy danh sách feedback
async function testGetAllFeedbacks() {
  try {
    console.log('\n=== TESTING GET ALL FEEDBACKS ===');
    
    const response = await fetch(`${BASE_URL}/feedbacks`);
    const result = await response.json();
    
    console.log('Get all feedbacks result:', result);
    
    if (response.ok && result.data) {
      console.log(`✅ Found ${result.data.length} feedbacks`);
      result.data.forEach((feedback, index) => {
        console.log(`Feedback ${index + 1}:`, {
          id: feedback.id,
          title: feedback.Title,
          resident: feedback.Resident,
          attachments: feedback.attachments?.length || 0
        });
      });
    } else {
      console.error('❌ Get all feedbacks failed:', result);
    }
  } catch (error) {
    console.error('❌ Error getting all feedbacks:', error);
  }
}

// Chạy tests
async function runDebugTests() {
  console.log('🚀 Starting Feedback API Debug Tests...\n');
  
  // Test 1: Tạo feedback
  const feedbackId = await testCreateFeedbackWithDebug();
  
  if (feedbackId) {
    // Test 2: Lấy feedback vừa tạo
    await testGetFeedback(feedbackId);
    
    // Test 3: Lấy tất cả feedback
    await testGetAllFeedbacks();
  }
  
  console.log('\n🏁 Debug tests completed!');
}

// Export để sử dụng trong browser
if (typeof window !== 'undefined') {
  window.testFeedbackDebug = {
    testCreateFeedbackWithDebug,
    testGetFeedback,
    testGetAllFeedbacks,
    runDebugTests
  };
}

// Chạy tests nếu file được execute trực tiếp
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testCreateFeedbackWithDebug,
    testGetFeedback,
    testGetAllFeedbacks,
    runDebugTests
  };
}

console.log(`
=== Feedback API Debug Test Script ===

Để chạy tests trong browser console:

1. Mở browser console
2. Copy và paste nội dung file này
3. Chạy: testFeedbackDebug.runDebugTests()

Hoặc chạy từng test riêng lẻ:
- testFeedbackDebug.testCreateFeedbackWithDebug()
- testFeedbackDebug.testGetFeedback(1)
- testFeedbackDebug.testGetAllFeedbacks()

Lưu ý: Thay đổi BASE_URL và testFeedback.Resident theo cấu hình thực tế của bạn.
`); 