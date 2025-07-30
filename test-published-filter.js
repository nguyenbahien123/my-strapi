/**
 * Test script để kiểm tra filter publishedAt
 */

const BASE_URL = 'http://localhost:1337/api';

// Test lấy tất cả feedback (chỉ published)
async function testGetPublishedFeedbacks() {
  try {
    console.log('=== TESTING GET PUBLISHED FEEDBACKS ===');
    
    const response = await fetch(`${BASE_URL}/feedbacks`);
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Total feedbacks:', result.data?.length || 0);
    
    if (response.ok && result.data) {
      console.log('✅ Published feedbacks retrieved successfully!');
      
      // Kiểm tra xem tất cả feedback có publishedAt không
      const hasPublishedAt = result.data.every(feedback => feedback.publishedAt);
      console.log('All feedbacks have publishedAt:', hasPublishedAt);
      
      result.data.forEach((feedback, index) => {
        console.log(`Feedback ${index + 1}:`, {
          id: feedback.id,
          title: feedback.Title,
          publishedAt: feedback.publishedAt,
          resident: feedback.Resident ? 'Yes' : 'No'
        });
      });
    } else {
      console.error('❌ Get published feedbacks failed:', result);
    }
  } catch (error) {
    console.error('❌ Error getting published feedbacks:', error);
  }
}

// Test lấy tất cả feedback (bao gồm cả draft) - cho admin
async function testGetAllFeedbacksForAdmin() {
  try {
    console.log('\n=== TESTING GET ALL FEEDBACKS FOR ADMIN ===');
    
    const response = await fetch(`${BASE_URL}/feedbacks/admin/all`);
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Total feedbacks (including drafts):', result.data?.length || 0);
    
    if (response.ok && result.data) {
      console.log('✅ All feedbacks retrieved successfully!');
      
      // Phân loại feedback theo publishedAt
      const published = result.data.filter(f => f.publishedAt);
      const drafts = result.data.filter(f => !f.publishedAt);
      
      console.log('Published feedbacks:', published.length);
      console.log('Draft feedbacks:', drafts.length);
      
      result.data.forEach((feedback, index) => {
        console.log(`Feedback ${index + 1}:`, {
          id: feedback.id,
          title: feedback.Title,
          publishedAt: feedback.publishedAt ? 'Yes' : 'No',
          resident: feedback.Resident ? 'Yes' : 'No'
        });
      });
    } else {
      console.error('❌ Get all feedbacks failed:', result);
    }
  } catch (error) {
    console.error('❌ Error getting all feedbacks:', error);
  }
}

// Test lấy feedback theo resident (chỉ published)
async function testGetFeedbacksByResident(residentId = 39) {
  try {
    console.log(`\n=== TESTING GET FEEDBACKS BY RESIDENT ${residentId} ===`);
    
    const response = await fetch(`${BASE_URL}/feedbacks/resident/${residentId}`);
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Total feedbacks for resident:', result.data?.length || 0);
    
    if (response.ok && result.data) {
      console.log('✅ Resident feedbacks retrieved successfully!');
      
      // Kiểm tra xem tất cả feedback có publishedAt không
      const hasPublishedAt = result.data.every(feedback => feedback.publishedAt);
      console.log('All resident feedbacks have publishedAt:', hasPublishedAt);
      
      result.data.forEach((feedback, index) => {
        console.log(`Feedback ${index + 1}:`, {
          id: feedback.id,
          title: feedback.Title,
          publishedAt: feedback.publishedAt,
          resident: feedback.Resident ? 'Yes' : 'No'
        });
      });
    } else {
      console.error('❌ Get resident feedbacks failed:', result);
    }
  } catch (error) {
    console.error('❌ Error getting resident feedbacks:', error);
  }
}

// Test lấy thống kê (chỉ published)
async function testGetStats() {
  try {
    console.log('\n=== TESTING GET STATS (PUBLISHED ONLY) ===');
    
    const response = await fetch(`${BASE_URL}/feedbacks/stats`);
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Stats result:', result);
    
    if (response.ok && result.data) {
      console.log('✅ Stats retrieved successfully!');
      console.log('Total published feedbacks:', result.data.total);
      console.log('By type:', result.data.byType);
      console.log('By status:', result.data.byStatus);
    } else {
      console.error('❌ Get stats failed:', result);
    }
  } catch (error) {
    console.error('❌ Error getting stats:', error);
  }
}

// Test tạo feedback mới (sẽ tự động được publish)
async function testCreateFeedback() {
  try {
    console.log('\n=== TESTING CREATE FEEDBACK (AUTO PUBLISH) ===');
    
    const formData = new FormData();
    formData.append('data[Type]', 'Issue');
    formData.append('data[Title]', 'Test Published Filter');
    formData.append('data[Content]', 'This feedback should be automatically published');
    formData.append('data[Resident]', '39');
    
    const response = await fetch(`${BASE_URL}/feedbacks`, {
      method: 'POST',
      body: formData,
    });
    
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response body:', result);
    
    if (response.ok) {
      console.log('✅ Feedback created and published successfully!');
      console.log('Feedback ID:', result.data.id);
      console.log('PublishedAt:', result.data.publishedAt);
      
      // Kiểm tra xem feedback có thể được lấy bằng find không
      setTimeout(async () => {
        console.log('\n--- Checking if feedback appears in published list ---');
        await testGetPublishedFeedbacks();
      }, 1000);
      
    } else {
      console.error('❌ Create feedback failed:', result);
    }
  } catch (error) {
    console.error('❌ Error creating feedback:', error);
  }
}

// Chạy tất cả tests
async function runPublishedFilterTests() {
  console.log('🚀 Starting Published Filter Tests...\n');
  
  // Test 1: Lấy published feedbacks
  await testGetPublishedFeedbacks();
  
  // Test 2: Lấy tất cả feedbacks (admin)
  await testGetAllFeedbacksForAdmin();
  
  // Test 3: Lấy feedbacks theo resident
  await testGetFeedbacksByResident(39);
  
  // Test 4: Lấy thống kê
  await testGetStats();
  
  // Test 5: Tạo feedback mới
  await testCreateFeedback();
  
  console.log('\n🏁 Published filter tests completed!');
  console.log('\n📝 Summary:');
  console.log('- All queries should only return feedbacks with publishedAt not null');
  console.log('- New feedbacks should be automatically published');
  console.log('- Admin can access all feedbacks including drafts via /feedbacks/admin/all');
}

// Export để sử dụng trong browser
if (typeof window !== 'undefined') {
  window.testPublishedFilter = {
    testGetPublishedFeedbacks,
    testGetAllFeedbacksForAdmin,
    testGetFeedbacksByResident,
    testGetStats,
    testCreateFeedback,
    runPublishedFilterTests
  };
}

console.log(`
=== Published Filter Test Script ===

Để test trong browser console:

1. Copy và paste nội dung file này
2. Chạy: testPublishedFilter.runPublishedFilterTests()

Hoặc chạy từng test riêng lẻ:
- testPublishedFilter.testGetPublishedFeedbacks()
- testPublishedFilter.testGetAllFeedbacksForAdmin()
- testPublishedFilter.testGetFeedbacksByResident(39)
- testPublishedFilter.testGetStats()
- testPublishedFilter.testCreateFeedback()

Lưu ý: 
- Tất cả queries sẽ chỉ trả về feedbacks có publishedAt khác null
- Feedback mới sẽ tự động được publish
- Admin có thể xem tất cả feedbacks (bao gồm draft) qua /feedbacks/admin/all
`); 