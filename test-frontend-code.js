/**
 * Test frontend code để debug vấn đề Resident và attachments
 */

// Simulate frontend code của bạn
const user = { id: 1 }; // Giả sử user có ID = 1
const feedbackType = 'Issue';
const subject = 'Test Subject';
const content = 'Test Content';
const files = []; // Không có file để test

// Tạo FormData như frontend code của bạn
const formData = new FormData();
formData.append("data[Type]", feedbackType);
formData.append("data[Title]", subject);
formData.append("data[Content]", content);
formData.append("data[Resident]", user?.id);

// Thêm files nếu có
files.forEach((file) => {
  formData.append("files.attachments", file);
});

// Log FormData để kiểm tra
console.log('=== FRONTEND CODE DEBUG ===');
console.log('User ID:', user?.id);
console.log('Feedback Type:', feedbackType);
console.log('Subject:', subject);
console.log('Content:', content);
console.log('Files count:', files.length);

console.log('\nFormData entries:');
for (let [key, value] of formData.entries()) {
  console.log(`${key}:`, value);
}

// Test API call
async function testFrontendCode() {
  try {
    console.log('\n=== TESTING API CALL ===');
    
    const response = await fetch('http://localhost:1337/api/feedbacks', {
      method: 'POST',
      body: formData,
    });
    
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response body:', result);
    
    if (response.ok) {
      console.log('✅ API call successful!');
      console.log('Created feedback ID:', result.data.id);
      console.log('Resident in response:', result.data.Resident);
      console.log('Attachments in response:', result.data.attachments);
      
      // Kiểm tra trong Strapi admin
      console.log('\n📋 Check in Strapi admin:');
      console.log('- Go to Content Manager > Feedback');
      console.log('- Look for feedback with ID:', result.data.id);
      console.log('- Check if Resident and attachments are populated');
      
    } else {
      console.error('❌ API call failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Error in API call:', error);
  }
}

// Test với file upload
async function testWithFileUpload() {
  try {
    console.log('\n=== TESTING WITH FILE UPLOAD ===');
    
    // Tạo một file test
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    const formDataWithFile = new FormData();
    formDataWithFile.append("data[Type]", feedbackType);
    formDataWithFile.append("data[Title]", subject + ' (with file)');
    formDataWithFile.append("data[Content]", content);
    formDataWithFile.append("data[Resident]", user?.id);
    formDataWithFile.append("files.attachments", testFile);
    
    console.log('FormData with file entries:');
    for (let [key, value] of formDataWithFile.entries()) {
      console.log(`${key}:`, value);
    }
    
    const response = await fetch('http://localhost:1337/api/feedbacks', {
      method: 'POST',
      body: formDataWithFile,
    });
    
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response body:', result);
    
    if (response.ok) {
      console.log('✅ API call with file successful!');
      console.log('Created feedback ID:', result.data.id);
      console.log('Resident in response:', result.data.Resident);
      console.log('Attachments in response:', result.data.attachments);
    } else {
      console.error('❌ API call with file failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Error in API call with file:', error);
  }
}

// Export để sử dụng trong browser
if (typeof window !== 'undefined') {
  window.testFrontendCode = {
    testFrontendCode,
    testWithFileUpload
  };
}

console.log(`
=== Frontend Code Test ===

Để test trong browser console:

1. Copy và paste nội dung file này
2. Chạy: testFrontendCode.testFrontendCode()
3. Hoặc test với file: testFrontendCode.testWithFileUpload()

Điều này sẽ giúp debug xem vấn đề có phải do:
- Frontend code không đúng format
- API không xử lý đúng data
- Strapi admin không hiển thị đúng
`); 