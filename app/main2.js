const express = require('express');
const bodyParser = require('body-parser'); // body-parser middleware 추가
const app = express();
const port = 3000;
const template = require('./template.js');
const mysql = require('mysql');

const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'mysql',
  database: 'web'
});

app.use(express.static('css'));
app.use(express.static('public'));
app.use(express.static('img'));
app.use(express.static('font'));

// body-parser middleware 설정
app.use(bodyParser.urlencoded({ extended: true }));

// DB 연결 관리를 위한 함수
function handleDisconnect() {
  conn.connect(function(err) {
    if (err) {
      console.log('Error when connecting to database:', err);
      setTimeout(handleDisconnect, 2000); // 연결 재시도
    }
  });

  conn.on('error', function(err) {
    console.log('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect(); // 초기 연결

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/main.html');
});

app.get("/main.html", function (req, res) {
  res.sendFile(__dirname + '/main.html');
});

// ------------------------------------------------

app.get("/journal.html", function (req, res) {
  let {id} = req.query;
  conn.query("SELECT * FROM journal", (err, journal) => {  
    if (err) {
      console.log('Database query error:', err);
      return res.status(500).send('Internal Server Error');
    }
    let list = template.list(journal);
    let control;
    if (id === undefined) {
      let button = `
        <form action="/journal.html/create_process" method="post">
          <p>title</p><input type="text" name="title" autocomplete="off" minlength="1" placeholder="제목을 입력하세요."><br><br>
          <p>content</p><textarea name="description" autocomplete="off" placeholder="내용을 입력하세요."></textarea>
          <button type="submit">CREATE</button>
        </form>`;
      const html = template.HTML(list, button);
      res.send(html);
    } else {
      conn.query('SELECT title, content FROM journal WHERE id=?', [id], (err2, journal2) => {
        if (err2) {
          console.log('Database query error:', err2);
          return res.status(500).send('Internal Server Error');
        }
        let button = `
          <form action="/journal.html/update_process" method="post">
            <p>title</p><input type="text" name="title" value='${journal2[0].title}' autocomplete="off" minlength="1" placeholder="제목을 입력하세요."><br><br>
            <p>content</p><textarea name="description" autocomplete="off" placeholder="내용을 입력하세요.">${journal2[0].content}</textarea>
            <input type='hidden' name='id' value='${id}'>
            <button type="submit">UPDATE</button>
          </form>
          <form action="/journal.html/delete_process" method="post">
            <input type='hidden' name='id' value='${id}'>
            <button type="submit">DELETE</button>
          </form>`;
        const html = template.HTML(list, button);
        res.send(html);
      });
    }
  });
});

app.post('/journal.html/create_process', (req, res)=>{
  const { title, description } = req.body;
  conn.query("INSERT INTO journal (title, content, adddate) VALUES (?, ?,  DATE_FORMAT(now(), '%Y-%m-%d'))",
    [title, description], (err, result) => {
      if (err) {
        console.log('Database query error:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.redirect(302, '/journal.html');
    }
  );
});

app.post('/journal.html/update_process', (req, res)=>{
  const { id, title, description } = req.body;
  conn.query('UPDATE journal SET title=?, content=? WHERE id=?', [title, description, id], (err, result) => {
    if (err) {
      console.log('Database query error:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect(302, `/journal.html`);
  });
});

app.post('/journal.html/delete_process', (req, res)=>{
  const { id } = req.body;
  conn.query('DELETE FROM journal WHERE id=?', [id], (err, result) => {
    if (err) {
      console.log('Database query error:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect(302, `/journal.html`);
  });
});

// ------------------------------------------------

app.get("/ware.html", function (req, res) {
  res.sendFile(__dirname + '/ware.html');
});

app.get("/mypage.html", function (req, res) {
  res.sendFile(__dirname + '/mypage.html');
});

app.listen(port, function () {
  console.log(`App is running on port ${port}`);
});
