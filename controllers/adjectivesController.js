import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';

const getAllAdjectives = async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT id, text FROM adjectives ORDER BY question_number, id');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) await connection.end();
  }
};

const submitAnswers = async (req, res) => {
  let connection;
  try {
    const answers = req.body;
    console.log(answers);

    // if (!answers || typeof answers !== 'object') {
    //   return res.status(400).json({ success: false, error: 'Invalid answers format' });
    // }

    console.log("adjectives");
    connection = await mysql.createConnection(dbConfig);
    
    // Get all adjectives for lookup
    const [adjectives] = await connection.execute('SELECT text, most_shape, least_shape FROM adjectives');
    
    console.log(adjectives);
    // Create lookup map
    const adjectiveMap = {};
    adjectives.forEach(adj => {
      adjectiveMap[adj.text] = {
        most_shape: adj.most_shape,
        least_shape: adj.least_shape
      };
    });

    // Process answers and extract shapes
    const mostShapes = [];
    const leastShapes = [];
    
    for (let questionNum = 1; questionNum <= 28; questionNum++) {
      const questionKey = questionNum.toString();
      const answer = answers[questionKey];
      
      if (!answer || !answer.most || !answer.least) {
        return res.status(400).json({ 
          success: false, 
          error: `Missing answer for question ${questionNum}` 
        });
      }

      const mostAdjective = adjectiveMap[answer.most];
      const leastAdjective = adjectiveMap[answer.least];
      
      if (!mostAdjective || !leastAdjective) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid adjective in question ${questionNum}` 
        });
      }

      mostShapes.push(mostAdjective.most_shape);
      leastShapes.push(leastAdjective.least_shape);
    }

    // Count shapes
    const countShapes = (shapes) => {
      const counts = { Z: 0, S: 0, T: 0, '*': 0, N: 0 };
      shapes.forEach(shape => {
        if (counts.hasOwnProperty(shape)) {
          counts[shape]++;
        }
      });
      return counts;
    };

    const mostCounts = countShapes(mostShapes);
    const leastCounts = countShapes(leastShapes);

    res.json({ 
      success: true, 
      data: {
        most: mostCounts,
        least: leastCounts
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) await connection.end();
  }
};

export default { getAllAdjectives, submitAnswers }; 