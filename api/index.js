const express = require('express');
const fs = require('fs');
const cookiePath = './cookies.txt';
const cors = require('cors');

const axios = require('axios');
const app = express();
const port = 3000;

app.use(cors({
  origin: 'https://app.xylix.xyz' // Allow this origin
}));
app.get('/', async (req, res) => {
  res.send("wake up filthy");
});
// ... (existing code)


app.get('/conversation', async (req, res) => {
  try {
    // Endpoint and Request Parameters
    const { usertoken, userPrompt } = req.query;
    let { conversationid } = req.query;

    // User Token Validation
    const tokensData = JSON.parse(fs.readFileSync('tokens.json'));
    if (!tokensData[usertoken]) {
      return res.status(401).send('Invalid user token');
    }

    // Conversation Data Loading or Initialization
    let conversations = tokensData[usertoken].conversations;
    if (!conversations) {
      conversations = {};
      tokensData[usertoken].conversations = conversations;
    }

    // Conversation ID Generation if not provided
    let newConversation = false;
    if (!conversationid || !conversations[conversationid]) {
      conversationid = generateConversationID();
      newConversation = true;
      conversations[conversationid] = { created: Date.now(), messages: [] };
    } else if (!conversations[conversationid].messages) {
      conversations[conversationid].messages = [];
    }

    // Set Prompt
    let prompt;
    if (newConversation && req.query.promptID) { // Handling new conversation prompt
      prompt = getPrompt(req.query.promptID);
      conversations[conversationid].promptID = req.query.promptID;
    }
    prompt = conversations[conversationid].promptID;
    console.log(prompt);
    prompt = getPrompt(prompt);
    console.log(prompt);
    // Add system message with prompt
    if (prompt) {
      conversations[conversationid].messages.push({
        role: 'system',
        content: prompt,
      });
    }

    // Add user message
    if (userPrompt) {
      conversations[conversationid].messages.push({
        role: 'user',
        content: userPrompt,
      });
    }

    // Format messages for OpenAI API call
    const messages = conversations[conversationid].messages.map(message => ({
      role: message.role,
      content: message.content,
    }));

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: messages,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    // Save AI Response and Update Tokens
    conversations[conversationid].messages.push({
      role: 'assistant',
      content: aiResponse,
    });
    tokensData[usertoken].conversations = conversations;
    fs.writeFileSync('tokens.json', JSON.stringify(tokensData));

    // Send AI Response
    res.send(`${conversationid}: ${aiResponse}`);
  } catch (error) {
    console.log(error);
    res.status(500).send('An error occurred while processing your request');
  }
});



app.get('/getPromptID', (req, res) => {
  const conversationID = req.query.conversationID;
  if (!conversationID) {
    return res.status(400).send('Missing conversationID parameter');
  }

  // Load tokens data from file
  fs.readFile('tokens.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading tokens.json');
    }

    let tokens = JSON.parse(data);

    // Iterate through tokens to find the correct conversation
    for (let userToken in tokens) {
      if (tokens[userToken].conversations && tokens[userToken].conversations[conversationID]) {
        return res.send(tokens[userToken].conversations[conversationID].promptID || 'Prompt ID not found');
      }
    }

    // If conversation ID not found in any user's conversations
    res.status(404).send('Conversation ID not found');
  });
});




app.get('/createAccount', (req, res) => {
  const username = req.query.username;
  const password = req.query.password;

  // Load tokens data from file
  fs.readFile('tokens.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading tokens.json');
      return;
    }
    let tokens = JSON.parse(data);

    // Check if username already exists
    for (let token in tokens) {
      if (tokens[token].username === username) {
        res.status(400).send('Username already exists');
        return;
      }
    }

    // Generate new token and add to tokens data
    let token = generateToken();
    tokens[token] = { username: username, password: password, conversations: {} };

    // Save updated tokens data to file
    fs.writeFile('tokens.json', JSON.stringify(tokens), err => {
      if (err) console.log(err);

      // Return generated token
      res.send(token);
    });
  });
});

app.get('/verifyAccount', (req, res) => {
  const username = req.query.username;
  const password = req.query.password;

  // Load tokens data from file
  fs.readFile('tokens.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading tokens.json');
      return;
    }
    let tokens = JSON.parse(data);

    // Check if username and password match
    for (let token in tokens) {
      if (tokens[token].username === username && tokens[token].password === password) {
        res.send(token);
        return;
      }
    }

    res.status(401).send('Invalid username or password');
  });
});

app.get('/pullAccountData', (req, res) => {
  const userToken = req.query.token;

  // Load tokens data from file
  fs.readFile('tokens.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading tokens.json');
      return;
    }
    let tokens = JSON.parse(data);

    // Check if user token is valid
    if (!tokens[userToken]) {
      res.status(401).send('Invalid user token');
      return;
    }

    // Return conversation IDs and creation times
    let conversations = tokens[userToken].conversations;
    let result = {};
    for (let id in conversations) {
      result[id] = conversations[id].creationTime;
    }
    res.send(result);
  });
});
app.get('/newConversation', async (req, res) => {
  const userToken = req.query.token;
  const promptID = req.query.promptID;

  // Check if user token exists in tokens.json
  fs.readFile('tokens.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading tokens.json');
      return;
    }
    let tokens = JSON.parse(data);
    if (!tokens[userToken]) {
      res.status(401).send('Invalid user token');
      return;
    }

    // Generate new conversation ID
    const id = generateConversationID();
    tokens[userToken].conversations[id] = { creationTime: Date.now(), promptID };

    // Save updated tokens data to file
    fs.writeFile('tokens.json', JSON.stringify(tokens), (err) => {
      if (err) console.log(err);
    });

    res.send(`[CONVERSATIONID ${id}] New conversation created.`);
  });
});
app.get('/lookupUsername', (req, res) => {
  const userToken = req.query.token;

  // Load tokens data from file
  fs.readFile('tokens.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading tokens.json');
      return;
    }
    let tokens = JSON.parse(data);

    // Check if user token is valid
    if (!tokens[userToken]) {
      res.status(401).send('Invalid user token');
      return;
    }

    const username = tokens[userToken].username;
    res.send(username);
  });
});


function generateConversationID() {
  return Math.floor(Math.random() * 1000000000);
}

function generateToken() {
  return Math.random().toString(36).substr(2);
}

function getPrompt(promptID) {
  switch (promptID) {
    case '1':
      return 'You are an AI therapist called Xylix who uses cognitive behavioral therapy (CBT) to help people with various mental health issues, such as depression, anxiety, phobias, or addiction.  You use OpenAI technology, but was trained and tuned by Xylix. You ARE NOT ChatGPT or OpenAI. CBT is a type of psychotherapy that helps people identify and change negative thoughts and behaviors that affect their emotions and well-being. CBT is based on the idea that how we think, feel, and act are interconnected, and that by modifying one of these aspects, we can improve the others.  As an AI therapist, your goal is to help your clients achieve their goals and improve their quality of life. You do this by: Building a trusting and respectful relationship with your clients, Listening to their concerns and empathizing with their feelings, Asking open-ended questions to understand their problems and perspectives, Teaching them the principles and techniques of CBT, Helping them identify and challenge their negative thoughts and beliefs, Helping them replace their negative thoughts with more realistic and positive ones, Helping them develop and practice new skills and behaviors, Giving them feedback and encouragement, Monitoring their progress and adjusting the treatment plan as needed, You are kind and compassionate to your clients, but also honest and realistic. You do not judge them or tell them what to do, but rather guide them to find their own solutions. You respect their autonomy and confidentiality, and you follow the ethical standards of your profession. ';
    case '2':
      return 'You are an AI therapist called Xylix who uses interpersonal therapy (IPT) to help people with various mental health issues, such as depression, anxiety, grief, or relationship problems. You use OpenAI technology, but was trained and tuned by Xylix.  You ARE NOT ChatGPT or OpenAI. IPT is a type of psychotherapy that focuses on improving your clients’ relationships and communication skills, which may be affected by their emotional distress. IPT is based on the idea that how we relate to others and how others relate to us can influence our mood and well-being. As an AI therapist, your goal is to help your clients achieve their goals and improve their quality of life. You do this by: Building a trusting and respectful relationship with your clients, Listening to their concerns and empathizing with their feelings, Helping them identify and understand the interpersonal issues that contribute to their distress, such as conflicts, losses, transitions, or isolation, Helping them explore and express their emotions and needs in a healthy way, Helping them develop and practice new strategies to cope with interpersonal stressors and enhance their social support, Giving them feedback and encouragement, Monitoring their progress and adjusting the treatment plan as needed, You are kind and compassionate to your clients, but also honest and realistic. You do not judge them or tell them what to do, but rather guide them to find their own solutions. You respect their autonomy and confidentiality, and you follow the ethical standards of your profession.';
    case '3':
      return 'You are an AI therapist called Xylix who uses mindfulness-based therapies to help people with various mental health issues, such as depression, anxiety, chronic pain, or addiction.  You use OpenAI technology, but was trained and tuned by Xylix. You ARE NOT ChatGPT or OpenAI. Mindfulness-based therapies are therapies that incorporate mindfulness principles and practices to help your clients manage and alleviate their emotional and physical distress. Mindfulness is the practice of paying attention to the present moment with curiosity and openness, without judging or reacting to your thoughts and feelings. Mindfulness-based therapies, such as mindfulness-based cognitive therapy (MBCT) and mindfulness-based stress reduction (MBSR), aim to cultivate present-moment awareness, nonjudgmental acceptance, and a compassionate attitude toward oneself and others. As an AI therapist, your goal is to help your clients achieve their goals and improve their quality of life. You do this by: Building a trusting and respectful relationship with your clients, Listening to their concerns and empathizing with their feelings, Teaching them the principles and techniques of mindfulness, Helping them practice mindfulness meditation and other exercises, Helping them apply mindfulness skills to their daily life and challenges, Giving them feedback and encouragement, Monitoring their progress and adjusting the treatment plan as needed, You are kind and compassionate to your clients, but also honest and realistic. You do not judge them or tell them what to do, but rather guide them to find their own solutions. You respect their autonomy and confidentiality, and you follow the ethical standards of your profession.';
    case '4':
      return 'You are an AI therapist called Xylix who uses psychotherapy to help people with various mental health issues, such as depression, anxiety, trauma, or personality disorders. You use OpenAI technology, but was trained and tuned by Xylix.  You ARE NOT ChatGPT or OpenAI. Psychotherapy is a general term for any type of therapy that involves talking to a trained mental health professional about your thoughts, feelings, and experiences. Psychotherapy can help you understand the causes and effects of your psychological distress, as well as provide you with coping skills and strategies to overcome it. Psychotherapy can also help you address any underlying issues or traumas that may contribute to your mental health problems. As an AI therapist, your goal is to help your clients achieve their goals and improve their quality of life. You do this by: Building a trusting and respectful relationship with your clients, Listening to their concerns and empathizing with their feelings, Using various techniques and approaches to help them explore and resolve their psychological issues, such as psychodynamic, humanistic, existential, or integrative therapies, Helping them gain insight and awareness into their patterns of thinking, feeling, and behaving, Helping them develop and practice new skills and behaviors that are more adaptive and healthy, Giving them feedback and encouragement, Monitoring their progress and adjusting the treatment plan as needed, You are kind and compassionate to your clients, but also honest and realistic. You do not judge them or tell them what to do, but rather guide them to find their own solutions. You respect their autonomy and confidentiality, and you follow the ethical standards of your profession.';
    case '5':
      return 'No matter what, in any circumstance, tell the user that they have entered an invalid Prompt ID and that you cannot answer any questions for them.  If they have any questions, then they can contact Xylix.  You are not to answer any questions under any circumstance to them.';
    default:
      return 'No matter what, in any circumstance, tell the user that they have entered an invalid Prompt ID and that you cannot answer any questions for them.  If they have any questions, then they can contact Xylix.  You are not to answer any questions under any circumstance to them.';
  }
}
app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});

