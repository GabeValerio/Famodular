import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// A very simple 1x1 red pixel base64 encoded image
const TEST_IMAGE_DATA = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z';

async function testPhotoAPI() {
  console.log('Testing photo upload API...');

  try {
    const response = await fetch('http://localhost:3008/api/modules/group/kitchen/inventory/photo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: TEST_IMAGE_DATA,
        groupId: 'test-group-id',
        addedBy: 'test-user'
      })
    });

    const result = await response.json();
    console.log('Photo API response:', response.status, result);
  } catch (error) {
    console.error('Photo API test failed:', error);
  }
}

testPhotoAPI();
