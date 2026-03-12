export async function generateJewelryImage(prompt: string) {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        size: '1024x1024',
      }),
    });
  
    const data = await response.json();
  
    return data.data[0].url;
  }