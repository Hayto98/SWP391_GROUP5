const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const apiKey = 'AIzaSyBtINJnRR54sZ06YquocpeY2Hwn4QEiQPA'; 
  console.log("Using API Key:", apiKey);
  
  if (!apiKey) {
    console.error('No API key provided.');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const models = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const json = await models.json();
    console.log("Available models:");
    if (json.models) {
        json.models.forEach(model => {
            console.log(`- ${model.name} (vision: ${model.supportedGenerationMethods.includes('generateContent')})`);
        });
    } else {
        console.log(json);
    }
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
