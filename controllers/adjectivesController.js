import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';
import { getSegment } from '../utils/disc_info.js';

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

const getDiscQuestions = async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT question_number, text FROM adjectives ORDER BY question_number, id');
    
    // Group adjectives by question number
    const questionsMap = {};
    rows.forEach(row => {
      if (!questionsMap[row.question_number]) {
        questionsMap[row.question_number] = [];
      }
      questionsMap[row.question_number].push(row.text);
    });
    
    // Convert to the desired format
    const discQuestions = Object.keys(questionsMap).map(questionNumber => ({
      id: parseInt(questionNumber),
      adjectives: questionsMap[questionNumber]
    }));
    
    res.json({ success: true, data: discQuestions });
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
    const user_id = req.user.user_id;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid answers format' });
    }

    connection = await mysql.createConnection(dbConfig);
    
    // Get all adjectives for lookup
    const [adjectives] = await connection.execute('SELECT text, most_shape, least_shape FROM adjectives');
    
    // Create lookup map
    const adjectiveMap = {};
    adjectives.forEach(adj => {
      
      adjectiveMap[adj.text] = {
        most_shape: adj.most_shape,
        least_shape: adj.least_shape
      };
    });
    
    console.log("adjectiveMap", adjectiveMap);
    const mostShapes = [];
    const leastShapes = [];
    
    for (let questionNum = 1; questionNum <= 28; questionNum++) {
      
      const questionKey = questionNum.toString();
      
      
      const answer = answers.answers[questionKey];
      
      if (!answer || !answer.most || !answer.least) {
        return res.status(400).json({ 
          success: false, 
          error: `Missing answer for question ${questionNum}` 
        });
      }
     
      const answerMost = answer.most;
      const answerLeast = answer.least;
      
      const mostAdjective = adjectiveMap[answerMost];
      const leastAdjective = adjectiveMap[answerLeast];
        if (!mostAdjective || !leastAdjective) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid adjective in question ${questionNum} ${mostAdjective} ${leastAdjective} ` 
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
    
    const diff = {
      Z: (mostCounts.Z || 0) - (leastCounts.Z || 0), // D
      S: (mostCounts.S || 0) - (leastCounts.S || 0), // i
      T: (mostCounts.T || 0) - (leastCounts.T || 0), // S
      '*': (mostCounts['*'] || 0) - (leastCounts['*'] || 0) // C
    };

   
    const code = [
      getSegment('D', diff.Z),
      getSegment('i', diff.S),
      getSegment('S', diff.T),
      getSegment('C', diff['*'])
    ].join('');
    // Store result in results table
    // 1. Get pid from patternTable using segno (code)
    const [patternTableRows] = await connection.execute(
      'SELECT pid FROM patternTable WHERE segno = ? LIMIT 1',
      [parseInt(code, 10)]
    );
    if (!patternTableRows.length) {
      return res.status(500).json({ success: false, error: 'No matching patternTable entry for code/segno' });
    }
    const pid = patternTableRows[0].pid;
    // 2. Get classic_profile_pattern_id from ClassicProfilePatterns using pid
    const [cppRows] = await connection.execute(
      'SELECT id FROM ClassicProfilePatterns WHERE pid = ? LIMIT 1',
      [pid]
    );
    if (!cppRows.length) {
      return res.status(500).json({ success: false, error: 'No matching ClassicProfilePatterns entry for pid' });
    }
    const classic_profile_pattern_id = cppRows[0].id;
    // 3. Insert into results
    const [result] = await connection.execute(
      `INSERT INTO results (user_id, classic_profile_pattern_id, most_counts, least_counts)
       VALUES (?, ?, ?, ?)`,
      [
        user_id,
        classic_profile_pattern_id,
        JSON.stringify(mostCounts),
        JSON.stringify(leastCounts)
      ]
    );
   

    res.json({ 
      success: true, 
      data: {
        most: mostCounts,
        least: leastCounts,
        diff,
        code,
        resultId: result.insertId
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) await connection.end();
  }
};

export default { getAllAdjectives, submitAnswers, getDiscQuestions }; 