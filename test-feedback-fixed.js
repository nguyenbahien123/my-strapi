/**
 * Test script để kiểm tra sau khi sửa Resident và Attachments
 */

const BASE_URL = 'http://localhost:1337/api';

// Test data với Resident ID thực tế
const testFeedback = {
  Type: 'Issue',
  Title: 'Test Feedback Fixed',
  Content: 'This is a test feedback after fixing Resident and Attachments',
  Resident: 39 // Sử dụng Resident ID thực tế từ logs của bạn
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

// Test tạo feedback không có file
async function testCreateFeedbackWithoutFiles() {
  try {
    console.log('=== TESTING CREATE FEEDBACK WITHOUT FILES ===');
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
    const result = await response.json();
    console.log('Response body:', result);
    
    if (response.ok) {
      console.log('✅ Feedback created successfully!');
      console.log('Feedback ID:', result.data.id);
      console.log('Resident:', result.data.Resident);
      console.log('Attachments:', result.data.attachments);
      
      // Kiểm tra Resident có được populate không
      if (result.data.Resident) {
        console.log('✅ Resident is populated:', result.data.Resident);
      } else {
        console.log('❌ Resident is null');
      }
      
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

// Test tạo feedback với file
async function testCreateFeedbackWithFiles() {
  try {
    console.log('\n=== TESTING CREATE FEEDBACK WITH FILES ===');
    
    // Tạo một file test
    const testFile = new File(['test content for feedback'], 'test-feedback.txt', { type: 'text/plain' });
    
    const formData = createFormData(testFeedback, [testFile]);
    
    console.log('FormData with file entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
    
    const response = await fetch(`${BASE_URL}/feedbacks`, {
      method: 'POST',
      body: formData,
    });
    
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response body:', result);
    
    if (response.ok) {
      console.log('✅ Feedback with file created successfully!');
      console.log('Feedback ID:', result.data.id);
      console.log('Resident:', result.data.Resident);
      console.log('Attachments:', result.data.attachments);
      
      // Kiểm tra Resident có được populate không
      if (result.data.Resident) {
        console.log('✅ Resident is populated:', result.data.Resident);
      } else {
        console.log('❌ Resident is null');
      }
      
      // Kiểm tra Attachments có được populate không
      if (result.data.attachments && result.data.attachments.length > 0) {
        console.log('✅ Attachments are populated:', result.data.attachments);
      } else {
        console.log('❌ Attachments are null or empty');
      }
      
      return result.data.id;
    } else {
      console.error('❌ Create feedback with file failed:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating feedback with file:', error);
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
      
      // Kiểm tra trong Strapi admin
      console.log('\n📋 Check in Strapi admin:');
      console.log('- Go to Content Manager > Feedback');
      console.log('- Look for feedback with ID:', result.data.id);
      console.log('- Check if Resident and attachments are populated');
      
    } else {
      console.error('❌ Get feedback failed:', result);
    }
  } catch (error) {
    console.error('❌ Error getting feedback:', error);
  }
}

// Chạy tất cả tests
async function runFixedTests() {
  console.log('🚀 Starting Fixed Feedback API Tests...\n');
  
  // Test 1: Tạo feedback không có file
  const feedbackId1 = await testCreateFeedbackWithoutFiles();
  
  if (feedbackId1) {
    await testGetFeedback(feedbackId1);
  }
  
  // Test 2: Tạo feedback với file
  const feedbackId2 = await testCreateFeedbackWithFiles();
  
  if (feedbackId2) {
    await testGetFeedback(feedbackId2);
  }
  
  console.log('\n🏁 Fixed tests completed!');
  console.log('\n📝 Summary:');
  console.log('- Check if Resident is now populated consistently');
  console.log('- Check if Attachments are now populated when files are uploaded');
  console.log('- Check Strapi admin to verify the data is saved correctly');
}

// Export để sử dụng trong browser
if (typeof window !== 'undefined') {
  window.testFeedbackFixed = {
    testCreateFeedbackWithoutFiles,
    testCreateFeedbackWithFiles,
    testGetFeedback,
    runFixedTests
  };
}

console.log(`
=== Fixed Feedback API Test Script ===

Để test trong browser console:

1. Copy và paste nội dung file này
2. Chạy: testFeedbackFixed.runFixedTests()

Hoặc chạy từng test riêng lẻ:
- testFeedbackFixed.testCreateFeedbackWithoutFiles()
- testFeedbackFixed.testCreateFeedbackWithFiles()
- testFeedbackFixed.testGetFeedback(1)

Lưu ý: 
- Đã sửa Resident parsing để đảm bảo luôn là number
- Đã sửa file upload để tạo feedback trước, sau đó cập nhật attachments
- Kiểm tra Strapi admin để xác nhận dữ liệu được lưu đúng
`); 