/**
 * Test Feedback API từ Frontend
 * Sử dụng để test API feedback với file upload
 */

const BASE_URL = 'http://localhost:1337/api/feedbacks';

// Test data
const testFeedback = {
  Type: 'Issue',
  Title: 'Vấn đề về điện - Test từ Frontend',
  Content: 'Điện bị cúp thường xuyên vào buổi tối. Cần khắc phục gấp.',
  Resident: 39 // ID của resident (published)
};

// Test files (tạo file test)
function createTestFile() {
  const content = 'This is a test file content';
  const blob = new Blob([content], { type: 'text/plain' });
  return new File([blob], 'test-file.txt', { type: 'text/plain' });
}

// Test tạo feedback không có file
async function testCreateFeedbackWithoutFiles() {
  console.log('=== Test tạo feedback không có file ===');
  
  try {
    const formData = new FormData();
    formData.append("data[Type]", testFeedback.Type);
    formData.append("data[Title]", testFeedback.Title);
    formData.append("data[Content]", testFeedback.Content);
    formData.append("data[Resident]", testFeedback.Resident);

    const response = await fetch(BASE_URL, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', result);
      return result.data.id; // Trả về ID để test update
    } else {
      console.error('❌ Error:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
    return null;
  }
}

// Test tạo feedback có file
async function testCreateFeedbackWithFiles() {
  console.log('=== Test tạo feedback có file ===');
  
  try {
    const formData = new FormData();
    formData.append("data[Type]", testFeedback.Type);
    formData.append("data[Title]", testFeedback.Title + ' - With Files');
    formData.append("data[Content]", testFeedback.Content);
    formData.append("data[Resident]", testFeedback.Resident);

    // Thêm file test
    const testFile = createTestFile();
    formData.append("files.attachments", testFile);

    const response = await fetch(BASE_URL, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success with files:', result);
      return result.data.id;
    } else {
      console.error('❌ Error with files:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Network Error with files:', error);
    return null;
  }
}

// Test lấy danh sách feedback
async function testGetFeedbacks() {
  console.log('=== Test lấy danh sách feedback ===');
  
  try {
    const response = await fetch(BASE_URL);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Feedbacks:', result);
      return result.data;
    } else {
      console.error('❌ Error getting feedbacks:', result);
      return [];
    }
  } catch (error) {
    console.error('❌ Network Error getting feedbacks:', error);
    return [];
  }
}

// Test lấy chi tiết feedback
async function testGetFeedbackById(id) {
  console.log(`=== Test lấy chi tiết feedback ID: ${id} ===`);
  
  try {
    const response = await fetch(`${BASE_URL}/${id}`);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Feedback detail:', result);
      return result.data;
    } else {
      console.error('❌ Error getting feedback detail:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Network Error getting feedback detail:', error);
    return null;
  }
}

// Test cập nhật feedback
async function testUpdateFeedback(id) {
  console.log(`=== Test cập nhật feedback ID: ${id} ===`);
  
  try {
    const updateData = {
      data: {
        StatusFeedback: 'Đang xử lý',
        Title: testFeedback.Title + ' - Updated'
      }
    };

    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Updated feedback:', result);
      return result.data;
    } else {
      console.error('❌ Error updating feedback:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Network Error updating feedback:', error);
    return null;
  }
}

// Test xóa feedback
async function testDeleteFeedback(id) {
  console.log(`=== Test xóa feedback ID: ${id} ===`);
  
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Deleted feedback:', result);
      return true;
    } else {
      console.error('❌ Error deleting feedback:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Network Error deleting feedback:', error);
    return false;
  }
}

// Test validation errors
async function testValidationErrors() {
  console.log('=== Test validation errors ===');
  
  const testCases = [
    {
      name: 'Missing Type',
      data: {
        Title: 'Test Title',
        Content: 'Test Content',
        Resident: 1
      }
    },
    {
      name: 'Invalid Type',
      data: {
        Type: 'InvalidType',
        Title: 'Test Title',
        Content: 'Test Content',
        Resident: 1
      }
    },
    {
      name: 'Missing Title',
      data: {
        Type: 'Issue',
        Content: 'Test Content',
        Resident: 1
      }
    },
    {
      name: 'Empty Title',
      data: {
        Type: 'Issue',
        Title: '',
        Content: 'Test Content',
        Resident: 1
      }
    },
    {
      name: 'Missing Content',
      data: {
        Type: 'Issue',
        Title: 'Test Title',
        Resident: 1
      }
    },
    {
      name: 'Missing Resident',
      data: {
        Type: 'Issue',
        Title: 'Test Title',
        Content: 'Test Content'
      }
    },
    {
      name: 'Invalid Resident ID',
      data: {
        Type: 'Issue',
        Title: 'Test Title',
        Content: 'Test Content',
        Resident: 999999
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    
    try {
      const formData = new FormData();
      Object.entries(testCase.data).forEach(([key, value]) => {
        formData.append(`data[${key}]`, value);
      });

      const response = await fetch(BASE_URL, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (response.status === 400) {
        console.log(`✅ Expected validation error for ${testCase.name}:`, result.message);
      } else {
        console.error(`❌ Unexpected success for ${testCase.name}:`, result);
      }
    } catch (error) {
      console.error(`❌ Network Error for ${testCase.name}:`, error);
    }
  }
}

// Chạy tất cả tests
async function runAllTests() {
  console.log('🚀 Bắt đầu test Feedback API...');
  
  // Test validation errors trước
  await testValidationErrors();
  
  // Test tạo feedback
  const feedbackId1 = await testCreateFeedbackWithoutFiles();
  const feedbackId2 = await testCreateFeedbackWithFiles();
  
  // Test lấy danh sách
  await testGetFeedbacks();
  
  // Test lấy chi tiết
  if (feedbackId1) {
    await testGetFeedbackById(feedbackId1);
  }
  
  // Test cập nhật
  if (feedbackId1) {
    await testUpdateFeedback(feedbackId1);
  }
  
  // Test xóa
  if (feedbackId2) {
    await testDeleteFeedback(feedbackId2);
  }
  
  console.log('🏁 Hoàn thành test Feedback API!');
}

// Export functions để sử dụng trong browser
if (typeof window !== 'undefined') {
  window.FeedbackAPI = {
    testCreateFeedbackWithoutFiles,
    testCreateFeedbackWithFiles,
    testGetFeedbacks,
    testGetFeedbackById,
    testUpdateFeedback,
    testDeleteFeedback,
    testValidationErrors,
    runAllTests
  };
}

// Chạy tests nếu được gọi trực tiếp
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testCreateFeedbackWithoutFiles,
    testCreateFeedbackWithFiles,
    testGetFeedbacks,
    testGetFeedbackById,
    testUpdateFeedback,
    testDeleteFeedback,
    testValidationErrors,
    runAllTests
  };
}

// Auto run nếu trong browser
if (typeof window !== 'undefined') {
  // Uncomment dòng dưới để tự động chạy tests
  // runAllTests();
} 