export const createNotification = async (
  userId: string, 
  message: string, 
  type?: string,
  link?: string
) => {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId, 
        message, 
        type: type || 'info',
        link 
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create notification: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};
